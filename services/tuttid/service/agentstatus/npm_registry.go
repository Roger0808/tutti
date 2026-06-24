package agentstatus

import (
	"os"
	"strings"
)

const (
	// agentNPMRegistryEnv overrides the npm registry used to install agent
	// adapters — e.g. an enterprise proxy or the official registry.
	agentNPMRegistryEnv = "TUTTI_AGENT_NPM_REGISTRY"

	// defaultAgentNPMRegistry is a complete, globally reachable public mirror of
	// npm. Agent-adapter installs default to it so they don't hang/fail on slow or
	// blocked public-npm access (notably CN/JP). The mirror serves identical
	// tarballs, so npm integrity verification is unaffected.
	defaultAgentNPMRegistry = "https://registry.npmmirror.com"
)

// agentNPMRegistryEnvVar returns the `npm_config_registry=<url>` entry to inject
// into agent-adapter npm command environments so npm resolves and downloads
// packages from a reliable registry. TUTTI_AGENT_NPM_REGISTRY wins when set;
// otherwise the npmmirror default is used.
func (s Service) agentNPMRegistryEnvVar() string {
	registry := strings.TrimSpace(s.lookupEnv(agentNPMRegistryEnv))
	if registry == "" {
		registry = defaultAgentNPMRegistry
	}
	return "npm_config_registry=" + registry
}

// lookupEnv reads a single environment variable, honoring an injected Environ for
// testability and falling back to the process environment otherwise.
func (s Service) lookupEnv(key string) string {
	if s.Environ == nil {
		return os.Getenv(key)
	}
	prefix := key + "="
	for _, kv := range s.Environ() {
		if strings.HasPrefix(kv, prefix) {
			return kv[len(prefix):]
		}
	}
	return ""
}
