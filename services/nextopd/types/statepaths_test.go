package types

import (
	"path/filepath"
	"testing"
)

func TestDefaultStateDirUsesOverride(t *testing.T) {
	t.Setenv("NEXTOP_STATE_DIR", "/tmp/nextop-custom")
	t.Setenv("NEXTOP_ENV", "")

	if got := DefaultStateDir(); got != "/tmp/nextop-custom" {
		t.Fatalf("DefaultStateDir() = %q", got)
	}
}

func TestDefaultStateDirUsesDevelopmentDirectory(t *testing.T) {
	homeDir := t.TempDir()
	t.Setenv("HOME", homeDir)
	t.Setenv("NEXTOP_STATE_DIR", "")
	t.Setenv("NEXTOP_ENV", "development")

	want := filepath.Join(homeDir, ".nextop-dev")
	if got := DefaultStateDir(); got != want {
		t.Fatalf("DefaultStateDir() = %q, want %q", got, want)
	}
}

func TestDefaultStateDirUsesProductionDirectory(t *testing.T) {
	homeDir := t.TempDir()
	t.Setenv("HOME", homeDir)
	t.Setenv("NEXTOP_STATE_DIR", "")
	t.Setenv("NEXTOP_ENV", "production")

	want := filepath.Join(homeDir, ".nextop")
	if got := DefaultStateDir(); got != want {
		t.Fatalf("DefaultStateDir() = %q, want %q", got, want)
	}
}

func TestNextopdDerivedPathsUseDevelopmentRoot(t *testing.T) {
	homeDir := t.TempDir()
	t.Setenv("HOME", homeDir)
	t.Setenv("NEXTOP_STATE_DIR", "")
	t.Setenv("NEXTOP_ENV", "development")
	t.Setenv("NEXTOPD_DB_PATH", "")
	t.Setenv("NEXTOPD_LOG_PATH", "")
	t.Setenv("NEXTOPD_RUN_DIR", "")
	t.Setenv("NEXTOPD_LISTENER_INFO_PATH", "")
	t.Setenv("NEXTOPD_PID_PATH", "")

	stateDir := filepath.Join(homeDir, ".nextop-dev")
	if got := NextopdDBPath(); got != filepath.Join(stateDir, "nextopd.db") {
		t.Fatalf("NextopdDBPath() = %q", got)
	}
	if got := NextopdLogsDir(); got != filepath.Join(stateDir, "logs") {
		t.Fatalf("NextopdLogsDir() = %q", got)
	}
	if got := NextopdLogPath(); got != filepath.Join(stateDir, "logs", "nextopd.log") {
		t.Fatalf("NextopdLogPath() = %q", got)
	}
	if got := NextopdRunDir(); got != filepath.Join(stateDir, "run") {
		t.Fatalf("NextopdRunDir() = %q", got)
	}
	if got := NextopdListenerInfoPath(); got != filepath.Join(stateDir, "run", "nextopd.listener.json") {
		t.Fatalf("NextopdListenerInfoPath() = %q", got)
	}
	if got := NextopdPIDPath(); got != filepath.Join(stateDir, "run", "nextopd.pid") {
		t.Fatalf("NextopdPIDPath() = %q", got)
	}
}

func TestNextopdDerivedPathsUseOverrides(t *testing.T) {
	t.Setenv("NEXTOPD_DB_PATH", "/tmp/nextopd-custom.db")
	t.Setenv("NEXTOPD_LOG_PATH", "/tmp/nextopd.log")
	t.Setenv("NEXTOPD_RUN_DIR", "/tmp/nextopd-run")
	t.Setenv("NEXTOPD_LISTENER_INFO_PATH", "/tmp/nextopd.listener.json")
	t.Setenv("NEXTOPD_PID_PATH", "/tmp/nextopd.pid")

	if got := NextopdDBPath(); got != "/tmp/nextopd-custom.db" {
		t.Fatalf("NextopdDBPath() = %q", got)
	}
	if got := NextopdLogPath(); got != "/tmp/nextopd.log" {
		t.Fatalf("NextopdLogPath() = %q", got)
	}
	if got := NextopdRunDir(); got != "/tmp/nextopd-run" {
		t.Fatalf("NextopdRunDir() = %q", got)
	}
	if got := NextopdListenerInfoPath(); got != "/tmp/nextopd.listener.json" {
		t.Fatalf("NextopdListenerInfoPath() = %q", got)
	}
	if got := NextopdPIDPath(); got != "/tmp/nextopd.pid" {
		t.Fatalf("NextopdPIDPath() = %q", got)
	}
}
