package agent

import (
	"reflect"
	"testing"

	"github.com/tutti-os/tutti/packages/agent/daemon/providerregistry"
	"github.com/tutti-os/tutti/services/tuttid/biz/agentprovider"
)

func TestCodexComposerProfileComesFromProviderDescriptor(t *testing.T) {
	profile := composerProfileFor(agentprovider.Codex)
	if !profile.ModelSelection || !profile.UsesModelCatalog || profile.ModelCatalog != "codex-cli" {
		t.Fatalf("model profile = %#v", profile)
	}
	if !reflect.DeepEqual(profile.ReasoningEffortValues, []string{"low", "medium", "high", "xhigh"}) {
		t.Fatalf("reasoning values = %#v", profile.ReasoningEffortValues)
	}
	if reasoningConfigOptionID(agentprovider.Codex) != "reasoning_effort" {
		t.Fatalf("reasoning config option = %q", reasoningConfigOptionID(agentprovider.Codex))
	}
	if speedConfigOptionID(agentprovider.Codex) != "service_tier" {
		t.Fatalf("speed config option = %q", speedConfigOptionID(agentprovider.Codex))
	}
	if profile.SkillKind != "codex" || profile.SkillInvocation != "promptItem" {
		t.Fatalf("skill profile = %#v", profile)
	}
	if profile.CapabilityCatalogKind != providerregistry.CapabilityCatalogKindCodexAppServer {
		t.Fatalf("capability catalog profile = %#v", profile)
	}
}

func TestCodexModelCatalogSpecComesFromProviderDescriptor(t *testing.T) {
	spec, ok := agentModelCatalogSpecs[agentprovider.Codex]
	if !ok {
		t.Fatal("codex model catalog spec missing")
	}
	if spec.source != "codex-cli" {
		t.Fatalf("source = %q", spec.source)
	}
	if spec.lister == nil || spec.configuredDefaultModel == nil {
		t.Fatalf("catalog spec incomplete: %#v", spec)
	}
}

func TestAgentModelCatalogSpecRejectsUnknownDescriptorKind(t *testing.T) {
	descriptor, ok := providerregistry.Find(agentprovider.Codex)
	if !ok {
		t.Fatal("codex descriptor missing")
	}
	descriptor.ComposerProfile.ModelCatalog = "poison"
	if _, registered, err := agentModelCatalogSpecFromDescriptor(descriptor); err == nil || registered {
		t.Fatalf("agentModelCatalogSpecFromDescriptor() = (_, %v, %v), want unsupported error", registered, err)
	}
}

func TestCodexCapabilityCatalogCommandComesFromRuntimeDescriptor(t *testing.T) {
	descriptor, ok := providerregistry.Find(agentprovider.Codex)
	if !ok {
		t.Fatal("codex descriptor missing")
	}
	descriptor.Runtime.Command = []string{"poison-codex", "poison-app-server"}
	profile := composerProfileFromDescriptor(descriptor)
	lister, ok, err := composerCapabilityCatalogLister(profile)
	if err != nil || !ok {
		t.Fatalf("composerCapabilityCatalogLister() = (%#v, %v, %v)", lister, ok, err)
	}
	if lister.Command != "poison-codex" || !reflect.DeepEqual(lister.Args, []string{"poison-app-server"}) {
		t.Fatalf("lister command = %q %#v", lister.Command, lister.Args)
	}
}

func TestCodexSlashCommandPolicyComesFromProviderDescriptor(t *testing.T) {
	policy := composerSlashCommandPolicyRuntimeContext(agentprovider.Codex)
	if !reflect.DeepEqual(policy["fallbackCommands"], []string{"compact", "status", "fast", "goal", "review"}) {
		t.Fatalf("fallbackCommands = %#v", policy["fallbackCommands"])
	}
	effects, ok := policy["commandEffects"].([]map[string]any)
	if !ok || len(effects) != 6 {
		t.Fatalf("commandEffects = %#v", policy["commandEffects"])
	}
	want := []map[string]any{
		{"command": "init", "effect": "submitImmediate"},
		{"command": "compact", "effect": "submitImmediate"},
		{"command": "review", "effect": "showReviewPicker"},
		{"command": "plan", "effect": "togglePlanMode"},
		{"command": "status", "effect": "showStatus"},
		{"command": "fast", "effect": "toggleSpeed"},
	}
	if !reflect.DeepEqual(effects, want) {
		t.Fatalf("commandEffects = %#v, want %#v", effects, want)
	}
}
