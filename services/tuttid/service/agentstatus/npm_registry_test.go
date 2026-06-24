package agentstatus

import (
	"context"
	"slices"
	"testing"
)

func TestAgentNPMRegistryEnvVarDefaultsToNpmmirror(t *testing.T) {
	service := Service{Environ: func() []string { return []string{"PATH=/usr/bin"} }}
	if got := service.agentNPMRegistryEnvVar(); got != "npm_config_registry=https://registry.npmmirror.com" {
		t.Fatalf("agentNPMRegistryEnvVar() = %q, want npmmirror default", got)
	}
}

func TestAgentNPMRegistryEnvVarHonorsOverride(t *testing.T) {
	service := Service{Environ: func() []string {
		return []string{"TUTTI_AGENT_NPM_REGISTRY=https://registry.npmjs.org"}
	}}
	if got := service.agentNPMRegistryEnvVar(); got != "npm_config_registry=https://registry.npmjs.org" {
		t.Fatalf("agentNPMRegistryEnvVar() = %q, want overridden registry", got)
	}
}

func TestRunExternalAgentRegistryNPMInstallerInjectsRegistry(t *testing.T) {
	runtimeRoot := fakeManagedRuntimeRoot(t)
	service := Service{
		ManagedRuntime: fakeManagedRuntimeResolver(t, runtimeRoot),
		Environ:        func() []string { return []string{"PATH=/usr/bin:/bin"} },
	}
	var capturedEnv []string
	service.InstallCommand = func(_ context.Context, in InstallCommandInput) (InstallCommandResult, error) {
		capturedEnv = in.Env
		return InstallCommandResult{ExitCode: 0}, nil
	}

	spec := InstallerSpec{
		Kind: InstallerKindExternalAgentRegistryNPM,
		RegistryNPM: &ExternalAgentRegistryNPMInstallerSpec{
			Package:   "@agentclientprotocol/claude-agent-acp@0.46.0",
			PrefixDir: t.TempDir(),
		},
	}
	if _, err := service.runExternalAgentRegistryNPMInstaller(context.Background(), spec); err != nil {
		t.Fatalf("runExternalAgentRegistryNPMInstaller() error = %v", err)
	}
	if !slices.Contains(capturedEnv, "npm_config_registry=https://registry.npmmirror.com") {
		t.Fatalf("install env = %#v, want npm_config_registry mirror", capturedEnv)
	}
}

func TestResolveExternalRegistryNPMSpecExecEnvInjectsRegistry(t *testing.T) {
	home := t.TempDir()
	registryStore, prefixDir := fakeClaudeExternalRegistry(t)
	runtimeRoot := fakeManagedRuntimeRoot(t)

	service := probeTestService(home)
	service.ExternalAgentRegistry = registryStore
	service.ManagedRuntime = fakeManagedRuntimeResolver(t, runtimeRoot)

	result, err := service.ResolveProviderCommand(context.Background(), "claude-code")
	if err != nil {
		t.Fatalf("ResolveProviderCommand() error = %v", err)
	}
	// Sanity: this is the npm exec fallback path (no installed bin yet).
	if !slices.Contains(result.Command, "exec") || !slices.Contains(result.Command, prefixDir) {
		t.Fatalf("Command = %#v, want npm exec fallback under %q", result.Command, prefixDir)
	}
	if !slices.Contains(result.Env, "npm_config_registry=https://registry.npmmirror.com") {
		t.Fatalf("adapter env = %#v, want npm_config_registry mirror", result.Env)
	}
}
