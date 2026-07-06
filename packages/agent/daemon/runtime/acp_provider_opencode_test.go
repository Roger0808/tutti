package agentruntime

import (
	"strings"
	"testing"
)

func TestOpenCodeAdapterUsesOfficialACPCommand(t *testing.T) {
	t.Parallel()

	adapter := NewOpenCodeAdapter(nil)
	if adapter.config.provider != ProviderOpenCode {
		t.Fatalf("provider = %q, want %q", adapter.config.provider, ProviderOpenCode)
	}
	if len(adapter.config.command) != 2 || adapter.config.command[0] != "opencode" || adapter.config.command[1] != "acp" {
		t.Fatalf("command = %#v, want opencode acp", adapter.config.command)
	}
	if got := adapter.config.permissionModeID("anything"); got != "" {
		t.Fatalf("permissionModeID = %q, want empty", got)
	}
}

func TestOpenCodeACPEnvInjectsModelConfigContent(t *testing.T) {
	t.Parallel()

	session := standardTestSession(ProviderOpenCode)
	session.Settings = &SessionSettings{Model: "anthropic/claude-sonnet-4-5"}

	env := opencodeACPEnv(session, LegacyHostMetadata())
	found := false
	for _, item := range env {
		if strings.HasPrefix(item, "OPENCODE_CONFIG_CONTENT=") {
			found = true
			if item != `OPENCODE_CONFIG_CONTENT={"model":"anthropic/claude-sonnet-4-5"}` {
				t.Fatalf("OPENCODE_CONFIG_CONTENT = %q", item)
			}
		}
	}
	if !found {
		t.Fatalf("env = %#v, want OPENCODE_CONFIG_CONTENT", env)
	}
}

func TestOpenCodeRequiresNewSessionForModelSettings(t *testing.T) {
	t.Parallel()

	model := "openai/gpt-5"
	if !opencodeRequiresNewSessionForSettings(Session{}, SessionSettingsPatch{Model: &model}) {
		t.Fatal("model patch did not require a new session")
	}
	if opencodeRequiresNewSessionForSettings(Session{}, SessionSettingsPatch{}) {
		t.Fatal("empty patch required a new session")
	}
}
