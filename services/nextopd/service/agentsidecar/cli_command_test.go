package agentsidecar

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolveCLICommandUsesStateRootShim(t *testing.T) {
	stateDir := t.TempDir()
	if err := os.MkdirAll(filepath.Join(stateDir, "bin"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(stateDir, "bin", "nextop-dev"), []byte("#!/bin/sh\n"), 0o755); err != nil {
		t.Fatal(err)
	}

	if got := resolveCLICommand(stateDir); got != "nextop-dev" {
		t.Fatalf("resolveCLICommand() = %q, want nextop-dev", got)
	}
}

func TestResolveCLICommandDefaultsToProductionName(t *testing.T) {
	if got := resolveCLICommand(t.TempDir()); got != "nextop" {
		t.Fatalf("resolveCLICommand() = %q, want nextop", got)
	}
}
