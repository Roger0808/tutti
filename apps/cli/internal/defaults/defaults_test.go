package defaults

import (
	"path/filepath"
	"testing"
)

func TestResolveDefaultsFromEnvUsesGeneratedStateDefaults(t *testing.T) {
	t.Setenv("HOME", "/tmp/nextop-cli-home")
	t.Setenv("NEXTOP_ENV", "development")
	t.Setenv("NEXTOP_STATE_DIR", "")
	t.Setenv("NEXTOPD_RUN_DIR", "")
	t.Setenv("NEXTOPD_LISTENER_INFO_PATH", "")

	got := ResolveDefaultsFromEnv()

	if got.Runtime.Env != "development" {
		t.Fatalf("env = %q, want development", got.Runtime.Env)
	}
	wantRoot := filepath.Join("/tmp/nextop-cli-home", ".nextop-dev")
	if got.State.RootDir != wantRoot {
		t.Fatalf("root dir = %q, want %q", got.State.RootDir, wantRoot)
	}
	wantListenerInfo := filepath.Join(wantRoot, "run", "nextopd.listener.json")
	if got.State.NextopdListenerInfoPath != wantListenerInfo {
		t.Fatalf("listener info path = %q, want %q", got.State.NextopdListenerInfoPath, wantListenerInfo)
	}
}

func TestResolveDefaultsFromEnvHonorsListenerInfoOverride(t *testing.T) {
	t.Setenv("NEXTOPD_LISTENER_INFO_PATH", "/tmp/nextopd.listener.json")

	got := ResolveDefaultsFromEnv()

	if got.State.NextopdListenerInfoPath != "/tmp/nextopd.listener.json" {
		t.Fatalf("listener info path = %q", got.State.NextopdListenerInfoPath)
	}
}
