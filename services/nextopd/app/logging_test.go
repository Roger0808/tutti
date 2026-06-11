package app

import (
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"testing"

	nextoptypes "github.com/tutti-os/tutti/services/nextopd/types"
)

func TestResolveLogOutputDefaultsToFile(t *testing.T) {
	t.Setenv("NEXTOPD_LOG_OUTPUT", "")

	got, err := resolveLogOutput()
	if err != nil {
		t.Fatalf("resolveLogOutput() error = %v", err)
	}
	if got != LogOutputFile {
		t.Fatalf("resolveLogOutput() = %q", got)
	}
}

func TestResolveLogOutputRejectsInvalidValue(t *testing.T) {
	t.Setenv("NEXTOPD_LOG_OUTPUT", "loud")

	if _, err := resolveLogOutput(); err == nil {
		t.Fatal("resolveLogOutput() error = nil, want invalid output error")
	}
}

func TestResolveLogLevelSupportsDebug(t *testing.T) {
	t.Setenv("NEXTOPD_LOG_LEVEL", "debug")

	level, err := resolveLogLevel()
	if err != nil {
		t.Fatalf("resolveLogLevel() error = %v", err)
	}
	if level != slog.LevelDebug {
		t.Fatalf("resolveLogLevel() = %v", level)
	}
}

func TestSetupLoggerFromEnvWritesToFileByDefault(t *testing.T) {
	stateDir := t.TempDir()
	t.Setenv("NEXTOP_STATE_DIR", stateDir)
	t.Setenv("NEXTOP_ENV", "development")
	t.Setenv("NEXTOPD_LOG_OUTPUT", "file")
	t.Setenv("NEXTOPD_LOG_PATH", "")
	t.Setenv("NEXTOP_LOG_DIR", nextoptypes.NextopdLogsDir())

	setup, err := SetupLoggerFromEnv()
	if err != nil {
		t.Fatalf("SetupLoggerFromEnv() error = %v", err)
	}

	setup.Logger.Info("hello from test", "event", "nextop.test")
	if err := setup.Close(); err != nil {
		t.Fatalf("setup.Close() error = %v", err)
	}

	contents, err := os.ReadFile(filepath.Join(stateDir, "logs", "nextopd.log"))
	if err != nil {
		t.Fatalf("os.ReadFile() error = %v", err)
	}
	if !strings.Contains(string(contents), "hello from test") {
		t.Fatalf("log file does not contain expected message: %q", string(contents))
	}
}

func TestResolveLogFilePathUsesSharedLogDir(t *testing.T) {
	t.Setenv("NEXTOP_LOG_DIR", "/tmp/nextop-logs")
	t.Setenv("NEXTOPD_LOG_PATH", "")

	if got := resolveLogFilePath(); got != "/tmp/nextop-logs/nextopd.log" {
		t.Fatalf("resolveLogFilePath() = %q", got)
	}
}

func TestSetupLoggerFromEnvIncludesSessionIDWhenPresent(t *testing.T) {
	stateDir := t.TempDir()
	t.Setenv("NEXTOP_STATE_DIR", stateDir)
	t.Setenv("NEXTOP_ENV", "development")
	t.Setenv("NEXTOPD_LOG_OUTPUT", "file")
	t.Setenv("NEXTOPD_LOG_PATH", "")
	t.Setenv("NEXTOP_LOG_DIR", nextoptypes.NextopdLogsDir())
	t.Setenv("NEXTOP_SESSION_ID", "desktop-session-123")

	setup, err := SetupLoggerFromEnv()
	if err != nil {
		t.Fatalf("SetupLoggerFromEnv() error = %v", err)
	}

	setup.Logger.Info("hello from session test")
	if err := setup.Close(); err != nil {
		t.Fatalf("setup.Close() error = %v", err)
	}

	contents, err := os.ReadFile(filepath.Join(stateDir, "logs", "nextopd.log"))
	if err != nil {
		t.Fatalf("os.ReadFile() error = %v", err)
	}
	if !strings.Contains(string(contents), "session_id=desktop-session-123") {
		t.Fatalf("log file does not contain expected session id: %q", string(contents))
	}
}
