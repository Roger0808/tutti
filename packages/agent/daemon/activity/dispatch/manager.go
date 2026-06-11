package dispatch

import (
	"context"
	"errors"
	"log/slog"
	"math/rand/v2"
	"strings"
	"time"

	agentsessionstore "github.com/tutti-os/tutti/packages/agentactivity/daemon/activity"
	controlplanehttp "github.com/tutti-os/tutti/packages/agentactivity/daemon/internal/httpclient"
)

const (
	SourceLocalFirstRuntime = "local_first_runtime"
	SourceLocalFirstHook    = "local_first_hook"
	SourceSessionController = "session_controller"
)

var (
	ErrClosed    = errors.New("agent activity dispatch manager closed")
	ErrQueueFull = errors.New("agent activity dispatch queue full")
	ErrNoSender  = errors.New("agent activity dispatch sender is nil")
)

type SendFunc func(context.Context, agentsessionstore.ReportActivityInput) (agentsessionstore.ReportActivityReply, error)

type Result struct {
	Reply    agentsessionstore.ReportActivityReply
	Err      error
	Attempts int
}

type Job struct {
	Key       string
	Source    string
	Context   context.Context
	Report    agentsessionstore.ReportActivityInput
	Send      SendFunc
	OnSuccess func(Result)
	OnFailure func(Result)
	Coalesce  func(existing Job, incoming Job) Job
}

type Submitter interface {
	Submit(Job) error
}

type Config struct {
	MaxConcurrent       int
	MaxQueuedJobs       int
	MaxQueuedJobsPerKey int
	NetworkBackoffs     []time.Duration
	OverloadBackoffs    []time.Duration
	OverloadCooldown    time.Duration
	Logger              *slog.Logger
	Now                 func() time.Time
	Jitter              func(time.Duration) time.Duration
	Sleep               func(context.Context, time.Duration) error
}

type Manager struct {
	submitCh chan submitRequest
	done     <-chan struct{}
	logger   *slog.Logger
	now      func() time.Time
	jitter   func(time.Duration) time.Duration
	sleep    func(context.Context, time.Duration) error

	maxConcurrent       int
	maxQueuedJobs       int
	maxQueuedJobsPerKey int
	networkBackoffs     []time.Duration
	overloadBackoffs    []time.Duration
	overloadCooldown    time.Duration

	currentMaxConcurrent int
}

type submitRequest struct {
	job  Job
	resp chan error
}

type jobResult struct {
	job    Job
	result Result
	class  retryClass
}

type retryClass int

const (
	retryClassNone retryClass = iota
	retryClassNetwork
	retryClassOverload
)

func NewManager(ctx context.Context, cfg Config) *Manager {
	if ctx == nil {
		ctx = context.Background()
	}
	manager := &Manager{
		submitCh:             make(chan submitRequest),
		done:                 ctx.Done(),
		logger:               loggerOrDefault(cfg.Logger),
		now:                  cfg.Now,
		jitter:               cfg.Jitter,
		sleep:                cfg.Sleep,
		maxConcurrent:        fallbackInt(cfg.MaxConcurrent, 3),
		maxQueuedJobs:        fallbackInt(cfg.MaxQueuedJobs, 2048),
		maxQueuedJobsPerKey:  fallbackInt(cfg.MaxQueuedJobsPerKey, 128),
		networkBackoffs:      append([]time.Duration(nil), cfg.NetworkBackoffs...),
		overloadBackoffs:     append([]time.Duration(nil), cfg.OverloadBackoffs...),
		overloadCooldown:     fallbackDuration(cfg.OverloadCooldown, 30*time.Second),
		currentMaxConcurrent: fallbackInt(cfg.MaxConcurrent, 3),
	}
	if manager.sleep == nil {
		manager.sleep = sleepWithContext
	}
	if manager.now == nil {
		manager.now = time.Now
	}
	if manager.jitter == nil {
		manager.jitter = fullJitter
	}
	if len(manager.networkBackoffs) == 0 {
		manager.networkBackoffs = []time.Duration{
			100 * time.Millisecond,
			300 * time.Millisecond,
			time.Second,
			3 * time.Second,
		}
	}
	if len(manager.overloadBackoffs) == 0 {
		manager.overloadBackoffs = []time.Duration{
			500 * time.Millisecond,
			time.Second,
			2 * time.Second,
			5 * time.Second,
			10 * time.Second,
		}
	}
	go manager.run(ctx)
	return manager
}

func (m *Manager) Submit(job Job) error {
	if m == nil {
		return ErrClosed
	}
	if job.Send == nil {
		return ErrNoSender
	}
	if strings.TrimSpace(job.Key) == "" {
		job.Key = SessionKey(job.Report.Source.SessionOrigin, job.Report.WorkspaceID, job.Report.Source.AgentID)
	}
	resp := make(chan error, 1)
	request := submitRequest{job: job, resp: resp}
	select {
	case <-m.done:
		return ErrClosed
	case m.submitCh <- request:
	}
	select {
	case <-m.done:
		return ErrClosed
	case err := <-resp:
		return err
	}
}

func (m *Manager) run(ctx context.Context) {
	queuesByKey := map[string][]Job{}
	readyKeys := make([]string, 0, 16)
	inflightKeys := map[string]struct{}{}
	inflightTotal := 0
	queuedJobs := 0
	restoreAt := time.Time{}
	completeCh := make(chan jobResult)

	dispatchReady := func(now time.Time) {
		for m.currentMaxConcurrent < m.maxConcurrent && !restoreAt.IsZero() && !now.Before(restoreAt) {
			m.currentMaxConcurrent++
			m.logger.Info("agent activity dispatch concurrency restored",
				"event", "agent_activity.dispatch.concurrency_restored",
				"current_max_concurrent", m.currentMaxConcurrent,
				"base_max_concurrent", m.maxConcurrent,
			)
			if m.currentMaxConcurrent >= m.maxConcurrent {
				restoreAt = time.Time{}
			} else {
				restoreAt = now.Add(m.overloadCooldown)
			}
		}
		for inflightTotal < m.currentMaxConcurrent && len(readyKeys) > 0 {
			key := readyKeys[0]
			readyKeys = readyKeys[1:]
			queue := queuesByKey[key]
			if len(queue) == 0 {
				delete(queuesByKey, key)
				continue
			}
			job := queue[0]
			inflightKeys[key] = struct{}{}
			inflightTotal++
			m.logger.Info("agent activity dispatch started",
				"event", "agent_activity.dispatch.started",
				"key", key,
				"source", strings.TrimSpace(job.Source),
				"inflight_total", inflightTotal,
				"current_max_concurrent", m.currentMaxConcurrent,
				"queue_depth", queuedJobs,
			)
			go func(job Job) {
				result, class := m.execute(job)
				select {
				case <-ctx.Done():
				case completeCh <- jobResult{job: job, result: result, class: class}:
				}
			}(job)
		}
	}

	for {
		select {
		case <-ctx.Done():
			for _, queue := range queuesByKey {
				for _, job := range queue {
					if job.OnFailure != nil {
						job.OnFailure(Result{Err: ErrClosed})
					}
				}
			}
			return
		case request := <-m.submitCh:
			now := m.now()
			dispatchReady(now)
			if queuedJobs >= m.maxQueuedJobs {
				m.logger.Warn("agent activity dispatch queue full",
					"event", "agent_activity.dispatch.queue_full",
					"key", request.job.Key,
					"source", strings.TrimSpace(request.job.Source),
					"queue_depth", queuedJobs,
					"max_queued_jobs", m.maxQueuedJobs,
				)
				request.resp <- ErrQueueFull
				continue
			}
			queue := queuesByKey[request.job.Key]
			if fn := request.job.Coalesce; fn != nil {
				pendingStart := 0
				if _, inflight := inflightKeys[request.job.Key]; inflight {
					pendingStart = 1
				}
				if len(queue) > pendingStart {
					lastIndex := len(queue) - 1
					if merged := fn(queue[lastIndex], request.job); strings.TrimSpace(merged.Key) != "" {
						queue[lastIndex] = merged
						queuesByKey[request.job.Key] = queue
						request.resp <- nil
						continue
					}
				}
			}
			if len(queue) >= m.maxQueuedJobsPerKey {
				m.logger.Warn("agent activity dispatch per-key queue full",
					"event", "agent_activity.dispatch.queue_full",
					"key", request.job.Key,
					"source", strings.TrimSpace(request.job.Source),
					"queue_depth_for_key", len(queue),
					"max_queued_jobs_per_key", m.maxQueuedJobsPerKey,
				)
				request.resp <- ErrQueueFull
				continue
			}
			wasEmpty := len(queue) == 0
			queue = append(queue, request.job)
			queuesByKey[request.job.Key] = queue
			queuedJobs++
			m.logger.Info("agent activity dispatch enqueued",
				"event", "agent_activity.dispatch.enqueued",
				"key", request.job.Key,
				"source", strings.TrimSpace(request.job.Source),
				"queue_depth", queuedJobs,
				"queue_depth_for_key", len(queue),
				"inflight_total", inflightTotal,
			)
			if wasEmpty {
				if _, inflight := inflightKeys[request.job.Key]; !inflight {
					readyKeys = append(readyKeys, request.job.Key)
				}
			}
			request.resp <- nil
			dispatchReady(now)
		case completion := <-completeCh:
			now := m.now()
			queue := queuesByKey[completion.job.Key]
			if len(queue) > 0 {
				queue = queue[1:]
				queuedJobs--
				if len(queue) == 0 {
					delete(queuesByKey, completion.job.Key)
				} else {
					queuesByKey[completion.job.Key] = queue
				}
			}
			delete(inflightKeys, completion.job.Key)
			if inflightTotal > 0 {
				inflightTotal--
			}
			if completion.class == retryClassOverload && m.currentMaxConcurrent > 1 {
				m.logger.Warn("agent activity dispatch overload detected",
					"event", "agent_activity.dispatch.overload_detected",
					"key", completion.job.Key,
					"source", strings.TrimSpace(completion.job.Source),
					"attempts", completion.result.Attempts,
					"queue_depth", queuedJobs,
				)
				m.currentMaxConcurrent--
				m.logger.Warn("agent activity dispatch concurrency reduced",
					"event", "agent_activity.dispatch.concurrency_reduced",
					"current_max_concurrent", m.currentMaxConcurrent,
					"base_max_concurrent", m.maxConcurrent,
				)
				restoreAt = now.Add(m.overloadCooldown)
			}
			if len(queue) > 0 {
				readyKeys = append(readyKeys, completion.job.Key)
			}
			if completion.result.Err != nil {
				if completion.job.OnFailure != nil {
					completion.job.OnFailure(completion.result)
				}
			} else if completion.job.OnSuccess != nil {
				completion.job.OnSuccess(completion.result)
			}
			dispatchReady(now)
		}
	}
}

func (m *Manager) execute(job Job) (Result, retryClass) {
	ctx := job.Context
	if ctx == nil {
		ctx = context.Background()
	}
	attempts := 0
	seenClass := retryClassNone
	for {
		attempts++
		reply, err := job.Send(ctx, job.Report)
		if err == nil {
			return Result{Reply: reply, Attempts: attempts}, seenClass
		}
		class := classifyRetry(err)
		if class > seenClass {
			seenClass = class
		}
		delay, ok := m.retryDelay(err, class, attempts)
		if !ok {
			m.logger.Warn("agent activity dispatch failed",
				"event", "agent_activity.dispatch.failed",
				"key", job.Key,
				"source", strings.TrimSpace(job.Source),
				"attempt", attempts,
				"error", err,
			)
			return Result{Err: err, Attempts: attempts}, seenClass
		}
		m.logger.Warn("agent activity dispatch retrying",
			"event", "agent_activity.dispatch.retry",
			"key", job.Key,
			"source", strings.TrimSpace(job.Source),
			"attempt", attempts,
			"delay", delay,
			"error", err,
		)
		if sleepErr := m.sleep(ctx, delay); sleepErr != nil {
			return Result{Err: err, Attempts: attempts}, seenClass
		}
	}
}

func (m *Manager) retryDelay(err error, class retryClass, attempts int) (time.Duration, bool) {
	if class == retryClassOverload {
		if delay, ok := retryAfterDelay(err, m.now()); ok {
			return delay, true
		}
	}
	index := attempts - 1
	switch class {
	case retryClassNetwork:
		if index >= 0 && index < len(m.networkBackoffs) {
			return m.jitter(m.networkBackoffs[index]), true
		}
	case retryClassOverload:
		if index >= 0 && index < len(m.overloadBackoffs) {
			return m.jitter(m.overloadBackoffs[index]), true
		}
	}
	return 0, false
}

func SessionKey(origin string, roomID string, agentSessionID string) string {
	normalizedOrigin := agentsessionstore.NormalizeSessionOrigin(origin)
	if normalizedOrigin == "" {
		normalizedOrigin = agentsessionstore.WorkspaceAgentSessionOriginHook
	}
	return normalizedOrigin + ":" + strings.TrimSpace(roomID) + ":" + strings.TrimSpace(agentSessionID)
}

func CoalesceMessageReportJobs(existing Job, incoming Job) Job {
	for _, update := range incoming.Report.MessageUpdates {
		switch strings.ToLower(strings.TrimSpace(update.Status)) {
		case "completed", "failed", "canceled":
			return Job{}
		}
	}
	existing.Report.MessageUpdates = append(existing.Report.MessageUpdates, incoming.Report.MessageUpdates...)
	existing.Context = incoming.Context
	return existing
}

func classifyRetry(err error) retryClass {
	if err == nil {
		return retryClassNone
	}
	var httpErr agentsessionstore.HTTPError
	if errors.As(err, &httpErr) {
		if httpErr.StatusCode == 429 {
			return retryClassOverload
		}
		if httpErr.StatusCode == 502 || httpErr.StatusCode == 503 || httpErr.StatusCode == 504 {
			return retryClassNetwork
		}
		body := strings.ToLower(strings.TrimSpace(httpErr.Body))
		if httpErr.StatusCode == 500 &&
			strings.Contains(body, "1040") &&
			strings.Contains(body, "too many connections") {
			return retryClassOverload
		}
		return retryClassNone
	}
	if controlplanehttp.IsTransientNetworkError(err) {
		return retryClassNetwork
	}
	return retryClassNone
}

func loggerOrDefault(logger *slog.Logger) *slog.Logger {
	if logger != nil {
		return logger
	}
	return slog.Default()
}

func fallbackInt(value, fallback int) int {
	if value > 0 {
		return value
	}
	return fallback
}

func fallbackDuration(value, fallback time.Duration) time.Duration {
	if value > 0 {
		return value
	}
	return fallback
}

func sleepWithContext(ctx context.Context, delay time.Duration) error {
	if delay <= 0 {
		return ctx.Err()
	}
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}

func retryAfterDelay(err error, now time.Time) (time.Duration, bool) {
	var httpErr agentsessionstore.HTTPError
	if !errors.As(err, &httpErr) || httpErr.Header == nil {
		return 0, false
	}
	raw := strings.TrimSpace(httpErr.Header.Get("Retry-After"))
	if raw == "" {
		return 0, false
	}
	if seconds, parseErr := time.ParseDuration(raw + "s"); parseErr == nil && seconds > 0 {
		return seconds, true
	}
	retryAt, parseErr := time.Parse(time.RFC1123, raw)
	if parseErr != nil {
		return 0, false
	}
	delay := retryAt.Sub(now)
	if delay <= 0 {
		return 0, false
	}
	return delay, true
}

func fullJitter(base time.Duration) time.Duration {
	if base <= 0 {
		return 0
	}
	return time.Duration(rand.Int64N(int64(base) + 1))
}
