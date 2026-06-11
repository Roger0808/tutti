package dispatch

import (
	"context"
	"errors"
	"net/http"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	agentsessionstore "github.com/tutti-os/tutti/packages/agentactivity/daemon/activity"
)

func TestManagerLimitsConcurrencyAndStartsNextJobAfterCompletion(t *testing.T) {
	t.Parallel()

	manager := NewManager(context.Background(), Config{
		MaxConcurrent:       3,
		MaxQueuedJobs:       16,
		MaxQueuedJobsPerKey: 8,
		Jitter:              func(delay time.Duration) time.Duration { return delay },
	})
	type startedCall struct {
		key string
	}
	started := make(chan startedCall, 8)
	release := make(chan struct{})
	var active atomic.Int32
	var maxActive atomic.Int32
	send := func(key string) SendFunc {
		return func(ctx context.Context, _ agentsessionstore.ReportActivityInput) (agentsessionstore.ReportActivityReply, error) {
			current := active.Add(1)
			for {
				seen := maxActive.Load()
				if current <= seen || maxActive.CompareAndSwap(seen, current) {
					break
				}
			}
			started <- startedCall{key: key}
			select {
			case <-release:
			case <-ctx.Done():
				active.Add(-1)
				return agentsessionstore.ReportActivityReply{}, ctx.Err()
			}
			active.Add(-1)
			return agentsessionstore.ReportActivityReply{}, nil
		}
	}

	for _, key := range []string{"k1", "k2", "k3", "k4"} {
		if err := manager.Submit(Job{Key: key, Send: send(key)}); err != nil {
			t.Fatalf("Submit(%s): %v", key, err)
		}
	}

	seen := map[string]struct{}{}
	for len(seen) < 3 {
		select {
		case call := <-started:
			seen[call.key] = struct{}{}
		case <-time.After(time.Second):
			t.Fatal("timed out waiting for initial starts")
		}
	}
	if maxActive.Load() != 3 {
		t.Fatalf("max active = %d, want 3", maxActive.Load())
	}
	select {
	case call := <-started:
		t.Fatalf("unexpected fourth start before a release: %#v", call)
	case <-time.After(50 * time.Millisecond):
	}

	close(release)
	select {
	case call := <-started:
		if call.key != "k4" {
			t.Fatalf("fourth started key = %q, want k4", call.key)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for fourth start")
	}
}

func TestManagerPreservesPerKeyOrdering(t *testing.T) {
	t.Parallel()

	manager := NewManager(context.Background(), Config{
		MaxConcurrent:       2,
		MaxQueuedJobs:       16,
		MaxQueuedJobsPerKey: 8,
		Jitter:              func(delay time.Duration) time.Duration { return delay },
	})
	firstStarted := make(chan struct{})
	secondStarted := make(chan struct{}, 1)
	releaseFirst := make(chan struct{})
	var attempts atomic.Int32
	send := func(ctx context.Context, _ agentsessionstore.ReportActivityInput) (agentsessionstore.ReportActivityReply, error) {
		switch attempts.Add(1) {
		case 1:
			close(firstStarted)
			select {
			case <-releaseFirst:
				return agentsessionstore.ReportActivityReply{}, nil
			case <-ctx.Done():
				return agentsessionstore.ReportActivityReply{}, ctx.Err()
			}
		case 2:
			secondStarted <- struct{}{}
			return agentsessionstore.ReportActivityReply{}, nil
		default:
			return agentsessionstore.ReportActivityReply{}, nil
		}
	}
	if err := manager.Submit(Job{Key: "same", Send: send}); err != nil {
		t.Fatalf("Submit(first): %v", err)
	}
	if err := manager.Submit(Job{Key: "same", Send: send}); err != nil {
		t.Fatalf("Submit(second): %v", err)
	}

	select {
	case <-firstStarted:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for first start")
	}
	select {
	case <-secondStarted:
		t.Fatal("second job started before first completed")
	case <-time.After(50 * time.Millisecond):
	}

	close(releaseFirst)
	select {
	case <-secondStarted:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for second start")
	}
}

func TestManagerCoalescesIncomingJobIntoPendingTail(t *testing.T) {
	t.Parallel()

	manager := NewManager(context.Background(), Config{
		MaxConcurrent:       1,
		MaxQueuedJobs:       8,
		MaxQueuedJobsPerKey: 8,
		Jitter:              func(delay time.Duration) time.Duration { return delay },
	})
	firstStarted := make(chan struct{})
	releaseFirst := make(chan struct{})
	sentUpdateCounts := make(chan int, 3)
	var attempts atomic.Int32
	send := func(ctx context.Context, report agentsessionstore.ReportActivityInput) (agentsessionstore.ReportActivityReply, error) {
		switch attempts.Add(1) {
		case 1:
			close(firstStarted)
			select {
			case <-releaseFirst:
			case <-ctx.Done():
				return agentsessionstore.ReportActivityReply{}, ctx.Err()
			}
			return agentsessionstore.ReportActivityReply{}, nil
		default:
			sentUpdateCounts <- len(report.MessageUpdates)
			return agentsessionstore.ReportActivityReply{
				AcceptedMessageUpdateCount: len(report.MessageUpdates),
			}, nil
		}
	}
	coalesce := func(existing Job, incoming Job) Job {
		existing.Report.MessageUpdates = append(existing.Report.MessageUpdates, incoming.Report.MessageUpdates...)
		existing.Context = incoming.Context
		return existing
	}

	if err := manager.Submit(Job{Key: "same", Send: send}); err != nil {
		t.Fatalf("Submit(first): %v", err)
	}
	select {
	case <-firstStarted:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for first start")
	}
	if err := manager.Submit(Job{
		Key:      "same",
		Send:     send,
		Report:   reportWithMessageUpdate("m-1"),
		Coalesce: coalesce,
	}); err != nil {
		t.Fatalf("Submit(second): %v", err)
	}
	if err := manager.Submit(Job{
		Key:      "same",
		Send:     send,
		Report:   reportWithMessageUpdate("m-2"),
		Coalesce: coalesce,
	}); err != nil {
		t.Fatalf("Submit(third): %v", err)
	}

	close(releaseFirst)
	select {
	case count := <-sentUpdateCounts:
		if count != 2 {
			t.Fatalf("coalesced update count = %d, want 2", count)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for coalesced job")
	}
	select {
	case count := <-sentUpdateCounts:
		t.Fatalf("unexpected extra queued job with %d updates", count)
	case <-time.After(50 * time.Millisecond):
	}
}

func TestCoalesceMessageReportJobsAppendsNonTerminalUpdates(t *testing.T) {
	t.Parallel()

	merged := CoalesceMessageReportJobs(
		Job{Key: "same", Report: reportWithMessageUpdate("m-1")},
		Job{Key: "same", Report: reportWithMessageUpdate("m-2")},
	)
	if merged.Key != "same" {
		t.Fatalf("merged key = %q, want same", merged.Key)
	}
	if got := len(merged.Report.MessageUpdates); got != 2 {
		t.Fatalf("merged update count = %d, want 2", got)
	}
}

func TestCoalesceMessageReportJobsKeepsTerminalUpdateSeparate(t *testing.T) {
	t.Parallel()

	incoming := reportWithMessageUpdate("m-2")
	incoming.MessageUpdates[0].Status = "completed"
	merged := CoalesceMessageReportJobs(
		Job{Key: "same", Report: reportWithMessageUpdate("m-1")},
		Job{Key: "same", Report: incoming},
	)
	if merged.Key != "" {
		t.Fatalf("merged key = %q, want empty job for no coalesce", merged.Key)
	}
}

func reportWithMessageUpdate(messageID string) agentsessionstore.ReportActivityInput {
	return agentsessionstore.ReportActivityInput{
		WorkspaceID: "room-1",
		Source: agentsessionstore.EventSource{
			SessionOrigin: agentsessionstore.WorkspaceAgentSessionOriginHook,
			AgentID:       "agent-session-1",
		},
		MessageUpdates: []agentsessionstore.WorkspaceAgentMessageUpdate{{
			AgentSessionID: "agent-session-1",
			MessageID:      messageID,
		}},
	}
}

func TestManagerRetriesOverloadAndReducesConcurrency(t *testing.T) {
	t.Parallel()

	var sleepsMu sync.Mutex
	var sleeps []time.Duration
	manager := NewManager(context.Background(), Config{
		MaxConcurrent:       3,
		MaxQueuedJobs:       16,
		MaxQueuedJobsPerKey: 8,
		OverloadBackoffs:    []time.Duration{time.Millisecond, 2 * time.Millisecond},
		OverloadCooldown:    time.Minute,
		Jitter:              func(delay time.Duration) time.Duration { return delay },
		Sleep: func(context.Context, time.Duration) error {
			sleepsMu.Lock()
			defer sleepsMu.Unlock()
			sleeps = append(sleeps, time.Duration(len(sleeps)+1)*time.Millisecond)
			return nil
		},
	})
	var attempts atomic.Int32
	done := make(chan struct{})
	var finalErr error
	if err := manager.Submit(Job{
		Key: "same",
		Send: func(context.Context, agentsessionstore.ReportActivityInput) (agentsessionstore.ReportActivityReply, error) {
			if attempts.Add(1) < 3 {
				return agentsessionstore.ReportActivityReply{}, agentsessionstore.HTTPError{
					StatusCode: 429,
					Body:       "Too Many Requests",
				}
			}
			return agentsessionstore.ReportActivityReply{}, nil
		},
		OnSuccess: func(Result) { close(done) },
		OnFailure: func(result Result) {
			finalErr = result.Err
			close(done)
		},
	}); err != nil {
		t.Fatalf("Submit: %v", err)
	}

	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for retry completion")
	}
	if finalErr != nil {
		t.Fatalf("final error = %v, want nil", finalErr)
	}
	if attempts.Load() != 3 {
		t.Fatalf("attempts = %d, want 3", attempts.Load())
	}
	sleepsMu.Lock()
	defer sleepsMu.Unlock()
	if len(sleeps) != 2 {
		t.Fatalf("sleep count = %d, want 2", len(sleeps))
	}
	if sleeps[0] != time.Millisecond || sleeps[1] != 2*time.Millisecond {
		t.Fatalf("sleep sequence = %#v, want configured overload backoffs", sleeps)
	}
	if manager.currentMaxConcurrent != 2 {
		t.Fatalf("current max concurrent = %d, want 2 after one overloaded job", manager.currentMaxConcurrent)
	}
}

func TestManagerRejectsQueueOverflow(t *testing.T) {
	t.Parallel()

	manager := NewManager(context.Background(), Config{
		MaxConcurrent:       1,
		MaxQueuedJobs:       1,
		MaxQueuedJobsPerKey: 1,
		Jitter:              func(delay time.Duration) time.Duration { return delay },
	})
	block := make(chan struct{})
	send := func(ctx context.Context, _ agentsessionstore.ReportActivityInput) (agentsessionstore.ReportActivityReply, error) {
		select {
		case <-block:
		case <-ctx.Done():
			return agentsessionstore.ReportActivityReply{}, ctx.Err()
		}
		return agentsessionstore.ReportActivityReply{}, nil
	}
	if err := manager.Submit(Job{Key: "one", Send: send}); err != nil {
		t.Fatalf("Submit(first): %v", err)
	}
	if err := manager.Submit(Job{Key: "two", Send: send}); !errors.Is(err, ErrQueueFull) {
		t.Fatalf("Submit(second) error = %v, want ErrQueueFull", err)
	}
	close(block)
}

func TestManagerUsesRetryAfterHeaderBeforeConfiguredBackoff(t *testing.T) {
	t.Parallel()

	fixedNow := time.Date(2026, 5, 28, 12, 0, 0, 0, time.UTC)
	var slept []time.Duration
	manager := NewManager(context.Background(), Config{
		MaxConcurrent:       1,
		MaxQueuedJobs:       4,
		MaxQueuedJobsPerKey: 4,
		OverloadBackoffs:    []time.Duration{time.Second},
		Now:                 func() time.Time { return fixedNow },
		Jitter:              func(delay time.Duration) time.Duration { return delay },
		Sleep: func(_ context.Context, delay time.Duration) error {
			slept = append(slept, delay)
			return nil
		},
	})
	done := make(chan struct{})
	var attempts atomic.Int32
	if err := manager.Submit(Job{
		Key: "retry-after",
		Send: func(context.Context, agentsessionstore.ReportActivityInput) (agentsessionstore.ReportActivityReply, error) {
			if attempts.Add(1) == 1 {
				return agentsessionstore.ReportActivityReply{}, agentsessionstore.HTTPError{
					StatusCode: 429,
					Body:       "Too Many Requests",
					Header:     http.Header{"Retry-After": []string{"3"}},
				}
			}
			return agentsessionstore.ReportActivityReply{}, nil
		},
		OnSuccess: func(Result) { close(done) },
		OnFailure: func(Result) { close(done) },
	}); err != nil {
		t.Fatalf("Submit: %v", err)
	}
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for retry-after completion")
	}
	if len(slept) != 1 || slept[0] != 3*time.Second {
		t.Fatalf("slept = %#v, want retry-after delay", slept)
	}
}

func TestClassifyRetryTreatsGatewayErrorsAsNetwork(t *testing.T) {
	t.Parallel()

	for _, statusCode := range []int{502, 503, 504} {
		if class := classifyRetry(agentsessionstore.HTTPError{StatusCode: statusCode, Body: "gateway"}); class != retryClassNetwork {
			t.Fatalf("status %d classified as %v, want network", statusCode, class)
		}
	}
}
