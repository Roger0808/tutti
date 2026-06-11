package agentdaemon

import (
	"context"
	"errors"
	"testing"

	activityshared "github.com/tutti-os/tutti/packages/agentactivity/daemon/activity/events"
	agentruntime "github.com/tutti-os/tutti/packages/agentactivity/daemon/runtime"
)

func TestNewRuntimeCreatesDefaultController(t *testing.T) {
	t.Parallel()

	runtime, err := NewRuntime(Config{
		ProcessTransport: NewLocalProcessTransport(),
		HostMetadata:     testHostMetadata(),
	})
	if err != nil {
		t.Fatalf("NewRuntime() error = %v", err)
	}
	if runtime.Controller() == nil {
		t.Fatal("Controller() = nil, want controller")
	}
}

func TestNewRuntimeRequiresHostMetadataForDefaultAdapters(t *testing.T) {
	t.Parallel()

	_, err := NewRuntime(Config{})
	if !errors.Is(err, ErrHostMetadataRequired) {
		t.Fatalf("NewRuntime() error = %v, want ErrHostMetadataRequired", err)
	}
}

func TestNewRuntimeRequiresProcessTransportForDefaultAdapters(t *testing.T) {
	t.Parallel()

	_, err := NewRuntime(Config{HostMetadata: testHostMetadata()})
	if !errors.Is(err, ErrProcessTransportRequired) {
		t.Fatalf("NewRuntime() error = %v, want ErrProcessTransportRequired", err)
	}
}

func TestNewRuntimeUsesCustomAdapters(t *testing.T) {
	t.Parallel()

	runtime, err := NewRuntime(Config{
		Adapters: []agentruntime.Adapter{testAdapter{provider: "test-agent"}},
	})
	if err != nil {
		t.Fatalf("NewRuntime() error = %v", err)
	}
	started, err := runtime.Controller().Start(context.Background(), agentruntime.StartInput{
		RoomID:         "workspace-1",
		AgentSessionID: "agent-session-1",
		Provider:       "test-agent",
	})
	if err != nil {
		t.Fatalf("Start() error = %v", err)
	}
	if started.Session.Provider != "test-agent" {
		t.Fatalf("provider = %q, want test-agent", started.Session.Provider)
	}
}

func testHostMetadata() HostMetadata {
	return HostMetadata{
		ClientInfo: ClientInfo{
			Name:    "test-desktop",
			Title:   "Test Desktop",
			Version: "1.0.0",
		},
		WorkspaceEnvName:         "TEST_WORKSPACE_ID",
		OpenClawSessionKeyPrefix: "agent:main:test-",
	}
}

type testAdapter struct {
	provider string
}

func (a testAdapter) Provider() string {
	return a.provider
}

func (a testAdapter) Start(context.Context, agentruntime.Session) ([]activityshared.Event, error) {
	return nil, nil
}

func (a testAdapter) Resume(context.Context, agentruntime.Session) error {
	return nil
}

func (a testAdapter) Close(context.Context, agentruntime.Session) error {
	return nil
}

func (a testAdapter) Exec(
	context.Context,
	agentruntime.Session,
	[]agentruntime.PromptContentBlock,
	string,
	string,
	agentruntime.EventSink,
	agentruntime.CommandSnapshotSink,
) ([]activityshared.Event, error) {
	return nil, nil
}

func (a testAdapter) Cancel(
	context.Context,
	agentruntime.Session,
	string,
) ([]activityshared.Event, error) {
	return nil, nil
}
