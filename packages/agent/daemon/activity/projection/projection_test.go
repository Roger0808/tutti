package projection

import "testing"

func TestProjectSessionStateMergesExistingSnapshot(t *testing.T) {
	existing := SessionSnapshot{
		WorkspaceID:       "ws-1",
		AgentSessionID:    "session-1",
		Origin:            "runtime",
		Provider:          "codex",
		ProviderSessionID: "provider-session-1",
		Model:             "gpt-old",
		CWD:               "/workspace",
		Title:             "Existing",
		Status:            "running",
		CurrentPhase:      "working",
		LastError:         "kept",
		MessageVersion:    7,
		LastEventUnixMS:   120,
		StartedAtUnixMS:   90,
		EndedAtUnixMS:     0,
		CreatedAtUnixMS:   80,
		UpdatedAtUnixMS:   100,
	}

	projected := ProjectSessionState(existing, true, SessionStateReport{
		WorkspaceID:      "ws-1",
		AgentSessionID:   "session-1",
		Title:            "Updated",
		Status:           "completed",
		OccurredAtUnixMS: 110,
		StartedAtUnixMS:  95,
		EndedAtUnixMS:    130,
	}, 140)

	if !projected.Accepted {
		t.Fatal("Accepted = false, want true")
	}
	session := projected.Session
	if session.Provider != "codex" || session.ProviderSessionID != "provider-session-1" {
		t.Fatalf("provider fields = %q/%q, want existing values", session.Provider, session.ProviderSessionID)
	}
	if session.Title != "Updated" || session.Status != "completed" {
		t.Fatalf("updated fields = %q/%q, want incoming values", session.Title, session.Status)
	}
	if session.LastEventUnixMS != 120 {
		t.Fatalf("LastEventUnixMS = %d, want existing max 120", session.LastEventUnixMS)
	}
	if session.StartedAtUnixMS != 90 || session.EndedAtUnixMS != 130 {
		t.Fatalf("times = started %d ended %d, want 90/130", session.StartedAtUnixMS, session.EndedAtUnixMS)
	}
	if session.CreatedAtUnixMS != 80 || session.UpdatedAtUnixMS != 140 {
		t.Fatalf("storage times = created %d updated %d, want 80/140", session.CreatedAtUnixMS, session.UpdatedAtUnixMS)
	}
	if session.MessageVersion != 7 || session.LastError != "kept" {
		t.Fatalf("retained fields = version %d error %q, want 7/kept", session.MessageVersion, session.LastError)
	}
}

func TestProjectSessionStateRejectsDeletedSnapshot(t *testing.T) {
	existing := SessionSnapshot{
		WorkspaceID:     "ws-1",
		AgentSessionID:  "session-1",
		DeletedAtUnixMS: 100,
	}

	projected := ProjectSessionState(existing, true, SessionStateReport{
		WorkspaceID:      "ws-1",
		AgentSessionID:   "session-1",
		Status:           "completed",
		OccurredAtUnixMS: 120,
	}, 130)

	if projected.Accepted {
		t.Fatal("Accepted = true, want false")
	}
	if projected.LastEventUnixMS != 120 {
		t.Fatalf("LastEventUnixMS = %d, want 120", projected.LastEventUnixMS)
	}
}

func TestProjectMessageUpdateMergesPayloadAndProtectsTerminalStatus(t *testing.T) {
	existing := MessageSnapshot{
		ID:                3,
		AgentSessionID:    "session-1",
		MessageID:         "message-1",
		Version:           4,
		TurnID:            "turn-1",
		Role:              "assistant",
		Kind:              "text",
		Status:            "completed",
		Payload:           map[string]any{"text": "hel", "nested": map[string]any{"a": "b"}},
		OccurredAtUnixMS:  120,
		StartedAtUnixMS:   90,
		CompletedAtUnixMS: 130,
		CreatedAtUnixMS:   80,
		UpdatedAtUnixMS:   100,
	}

	message, ok := ProjectMessageUpdate(existing, true, MessageUpdate{
		MessageID:         "message-1",
		Status:            "running",
		ContentDelta:      "lo",
		Payload:           map[string]any{"nested": map[string]any{"c": "d"}},
		OccurredAtUnixMS:  110,
		StartedAtUnixMS:   95,
		CompletedAtUnixMS: 125,
	}, 5, 150)
	if !ok {
		t.Fatal("ok = false, want true")
	}
	if message.Status != "completed" {
		t.Fatalf("Status = %q, want terminal completed", message.Status)
	}
	if message.Payload["text"] != "hello" {
		t.Fatalf("text payload = %#v, want hello", message.Payload["text"])
	}
	nested, ok := message.Payload["nested"].(map[string]any)
	if !ok || nested["a"] != "b" || nested["c"] != "d" {
		t.Fatalf("nested payload = %#v, want merged map", message.Payload["nested"])
	}
	if message.OccurredAtUnixMS != 120 || message.StartedAtUnixMS != 90 || message.CompletedAtUnixMS != 130 {
		t.Fatalf("times = %d/%d/%d, want 120/90/130", message.OccurredAtUnixMS, message.StartedAtUnixMS, message.CompletedAtUnixMS)
	}
	if message.Version != 5 || message.CreatedAtUnixMS != 80 || message.UpdatedAtUnixMS != 150 {
		t.Fatalf("version/storage times = %d/%d/%d, want 5/80/150", message.Version, message.CreatedAtUnixMS, message.UpdatedAtUnixMS)
	}
}

func TestCanonicalSessionStatus(t *testing.T) {
	tests := []struct {
		name      string
		lifecycle string
		phase     string
		want      string
	}{
		{name: "completed lifecycle wins", lifecycle: "completed", phase: "working", want: "completed"},
		{name: "failed lifecycle wins", lifecycle: "failed", phase: "idle", want: "failed"},
		{name: "waiting phase", lifecycle: "active", phase: "waiting_input", want: "waiting"},
		{name: "working phase", lifecycle: "active", phase: "streaming", want: "working"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := CanonicalSessionStatus(tt.lifecycle, tt.phase); got != tt.want {
				t.Fatalf("CanonicalSessionStatus() = %q, want %q", got, tt.want)
			}
		})
	}
}
