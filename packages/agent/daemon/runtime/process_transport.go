package agentruntime

import (
	"context"
	"errors"
	"io"
	"os/exec"
	"sync"

	"github.com/tutti-os/tutti/packages/agentactivity/daemon/runtimecmd"
)

type localProcessTransport struct{}

type localProcessConnection struct {
	cancel  context.CancelFunc
	cmd     *exec.Cmd
	done    chan struct{}
	closing chan struct{}
	frames  chan ProcessFrame
	stdin   io.WriteCloser
	stdout  io.Closer
	stderr  io.Closer

	closeOnce sync.Once
	sendMu    sync.Mutex
}

func NewLocalProcessTransport() ProcessTransport {
	return localProcessTransport{}
}

func (localProcessTransport) Start(ctx context.Context, spec ProcessSpec) (ProcessConnection, error) {
	if len(spec.Command) == 0 || spec.Command[0] == "" {
		return nil, errors.New("process command is required")
	}
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}
	processCtx, cancel := context.WithCancel(context.Background())
	resolver := runtimecmd.Resolver{}
	env := resolver.Env(spec.Env)
	cmd := exec.CommandContext(processCtx, resolver.Resolve(spec.Command[0], env), spec.Command[1:]...)
	cmd.Env = env

	stdin, err := cmd.StdinPipe()
	if err != nil {
		cancel()
		return nil, err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return nil, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		cancel()
		return nil, err
	}

	conn := &localProcessConnection{
		cancel:  cancel,
		cmd:     cmd,
		done:    make(chan struct{}),
		closing: make(chan struct{}),
		frames:  make(chan ProcessFrame, 16),
		stdin:   stdin,
		stdout:  stdout,
		stderr:  stderr,
	}
	var readers sync.WaitGroup
	readers.Add(2)
	go conn.readPipe(&readers, stdout, true)
	go conn.readPipe(&readers, stderr, false)
	go conn.wait(&readers)
	return conn, nil
}

func (c *localProcessConnection) Send(data []byte) error {
	if c == nil || c.stdin == nil {
		return io.ErrClosedPipe
	}
	c.sendMu.Lock()
	defer c.sendMu.Unlock()
	_, err := c.stdin.Write(data)
	return err
}

func (c *localProcessConnection) Recv() (ProcessFrame, error) {
	if c == nil {
		return ProcessFrame{}, io.EOF
	}
	frame, ok := <-c.frames
	if !ok {
		return ProcessFrame{}, io.EOF
	}
	return frame, nil
}

func (c *localProcessConnection) Close() error {
	if c == nil {
		return nil
	}
	c.closeOnce.Do(func() {
		close(c.closing)
		c.cancel()
		_ = c.stdin.Close()
		_ = c.stdout.Close()
		_ = c.stderr.Close()
	})
	<-c.done
	return nil
}

func (c *localProcessConnection) readPipe(readers *sync.WaitGroup, reader io.Reader, stdout bool) {
	defer readers.Done()
	buf := make([]byte, 4096)
	for {
		n, err := reader.Read(buf)
		if n > 0 {
			chunk := append([]byte(nil), buf[:n]...)
			frame := ProcessFrame{}
			if stdout {
				frame.Stdout = chunk
			} else {
				frame.Stderr = chunk
			}
			select {
			case c.frames <- frame:
			case <-c.closing:
				return
			}
		}
		if err != nil {
			return
		}
	}
}

func (c *localProcessConnection) wait(readers *sync.WaitGroup) {
	err := c.cmd.Wait()
	readers.Wait()
	exitCode := 0
	if err != nil {
		exitCode = 1
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			exitCode = exitErr.ExitCode()
		}
	}
	c.frames <- ProcessFrame{ExitCode: &exitCode}
	close(c.frames)
	close(c.done)
}
