package agentsidecar

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const claudeSystemPromptFileEnv = "NEXTOP_CLAUDE_SYSTEM_PROMPT_FILE"
const claudePluginDirEnv = "NEXTOP_CLAUDE_PLUGIN_DIR"
const claudeConfigDirEnv = "CLAUDE_CONFIG_DIR"

type ClaudeCodePreparer struct{}

func (ClaudeCodePreparer) Provider() string {
	return "claude-code"
}

func (ClaudeCodePreparer) Prepare(_ context.Context, input ProviderPrepareInput) (ProviderPrepareResult, error) {
	systemPromptPath := filepath.Join(input.RuntimeRoot, "claude-system-prompt.md")
	if err := os.MkdirAll(filepath.Dir(systemPromptPath), 0o700); err != nil {
		return ProviderPrepareResult{}, fmt.Errorf("create claude system prompt directory: %w", err)
	}
	if err := os.WriteFile(systemPromptPath, []byte(nextopCLIPolicy(input.PrepareInput)), 0o600); err != nil {
		return ProviderPrepareResult{}, fmt.Errorf("write claude system prompt: %w", err)
	}
	pluginDir := filepath.Join(input.RuntimeRoot, "claude-plugin", "nextop-cli")
	if err := installClaudeNextopPlugin(pluginDir, input.PrepareInput); err != nil {
		return ProviderPrepareResult{}, err
	}
	projectSkillRoot := providerSkillRoot(input.Cwd, input.Provider)
	if projectSkillRoot != "" {
		skillPaths, err := installProviderNativeSkills(projectSkillRoot, input.PrepareInput)
		if err != nil {
			return ProviderPrepareResult{}, fmt.Errorf("install claude project skills: %w", err)
		}
		if input.Manifest != nil {
			for _, skillPath := range skillPaths {
				input.Manifest.RecordManagedFile(skillPath, "provider-skill", true)
			}
		}
	}
	if input.Manifest != nil {
		input.Manifest.RecordManagedFile(systemPromptPath, "provider-system-prompt", true)
		input.Manifest.RecordManagedFile(pluginDir, "provider-plugin", true)
	}
	env := []string{
		claudeSystemPromptFileEnv + "=" + systemPromptPath,
		claudePluginDirEnv + "=" + pluginDir,
	}
	if input.PlanMode {
		configDir := filepath.Join(input.RuntimeRoot, "claude-config")
		if err := installClaudePlanSettings(configDir); err != nil {
			return ProviderPrepareResult{}, err
		}
		if input.Manifest != nil {
			input.Manifest.RecordManagedFile(configDir, "provider-config", true)
		}
		env = append(env, claudeConfigDirEnv+"="+configDir)
	}
	return ProviderPrepareResult{
		Cwd: input.Cwd,
		Env: env,
	}, nil
}

func installClaudePlanSettings(configDir string) error {
	if err := os.MkdirAll(configDir, 0o700); err != nil {
		return fmt.Errorf("create claude config directory: %w", err)
	}
	settings := readUserClaudeSettings()
	permissions, _ := settings["permissions"].(map[string]any)
	if permissions == nil {
		permissions = map[string]any{}
	}
	permissions["defaultMode"] = "plan"
	settings["permissions"] = permissions
	content, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return fmt.Errorf("encode claude plan settings: %w", err)
	}
	if err := os.WriteFile(filepath.Join(configDir, "settings.json"), append(content, '\n'), 0o600); err != nil {
		return fmt.Errorf("write claude plan settings: %w", err)
	}
	return nil
}

func readUserClaudeSettings() map[string]any {
	home, err := os.UserHomeDir()
	if err != nil || strings.TrimSpace(home) == "" {
		return map[string]any{}
	}
	content, err := os.ReadFile(filepath.Join(home, ".claude", "settings.json"))
	if err != nil {
		return map[string]any{}
	}
	var settings map[string]any
	if err := json.Unmarshal(content, &settings); err != nil || settings == nil {
		return map[string]any{}
	}
	return settings
}

func installClaudeNextopPlugin(pluginDir string, input PrepareInput) error {
	manifestDir := filepath.Join(pluginDir, ".claude-plugin")
	if err := os.MkdirAll(manifestDir, 0o700); err != nil {
		return fmt.Errorf("create claude plugin manifest directory: %w", err)
	}
	manifest := map[string]any{
		"name":        "nextop-cli",
		"version":     "0.1.0",
		"description": "Nextop CLI skill for AgentGUI sessions.",
		"author": map[string]string{
			"name": "Nextop",
		},
	}
	content, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return fmt.Errorf("encode claude plugin manifest: %w", err)
	}
	if err := os.WriteFile(filepath.Join(manifestDir, "plugin.json"), append(content, '\n'), 0o600); err != nil {
		return fmt.Errorf("write claude plugin manifest: %w", err)
	}
	if _, err := installProviderNativeSkills(filepath.Join(pluginDir, "skills"), input); err != nil {
		return fmt.Errorf("install claude nextop skill plugin: %w", err)
	}
	return nil
}
