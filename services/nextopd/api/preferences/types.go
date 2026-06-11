package preferences

import (
	nextopgenerated "github.com/tutti-os/tutti/services/nextopd/api/generated"
	preferencesbiz "github.com/tutti-os/tutti/services/nextopd/biz/preferences"
)

func GeneratedDesktopPreferencesFromBiz(value preferencesbiz.DesktopPreferences) nextopgenerated.DesktopPreferences {
	return nextopgenerated.DesktopPreferences{
		AgentComposerDefaultsByProvider: generatedAgentComposerDefaultsByProvider(value.AgentComposerDefaultsByProvider),
		DefaultAgentProvider:            nextopgenerated.WorkspaceAgentProvider(value.DefaultAgentProvider),
		DockIconStyle:                   nextopgenerated.DesktopDockIconStyle(value.DockIconStyle),
		DockPlacement:                   nextopgenerated.DesktopDockPlacement(value.DockPlacement),
		Locale:                          nextopgenerated.DesktopLocale(value.Locale),
		SleepPreventionMode:             nextopgenerated.DesktopSleepPreventionMode(value.SleepPreventionMode),
		ThemeSource:                     nextopgenerated.DesktopThemeSource(value.ThemeSource),
	}
}

func GeneratedDesktopPreferencesStateResponseFromBiz(value preferencesbiz.DesktopPreferences) nextopgenerated.DesktopPreferencesStateResponse {
	return nextopgenerated.DesktopPreferencesStateResponse{
		Initialized: value.Initialized,
		Preferences: GeneratedDesktopPreferencesFromBiz(value),
	}
}

func generatedAgentComposerDefaultsByProvider(value map[string]preferencesbiz.AgentComposerDefaults) nextopgenerated.DesktopAgentComposerDefaultsByProvider {
	return nextopgenerated.DesktopAgentComposerDefaultsByProvider{
		ClaudeCode: generatedAgentComposerDefaultsPointer(value["claude-code"]),
		Codex:      generatedAgentComposerDefaultsPointer(value["codex"]),
		Gemini:     generatedAgentComposerDefaultsPointer(value["gemini"]),
		Hermes:     generatedAgentComposerDefaultsPointer(value["hermes"]),
		Nexight:    generatedAgentComposerDefaultsPointer(value["nexight"]),
		Openclaw:   generatedAgentComposerDefaultsPointer(value["openclaw"]),
	}
}

func generatedAgentComposerDefaultsPointer(value preferencesbiz.AgentComposerDefaults) *nextopgenerated.DesktopAgentComposerDefaults {
	generated := nextopgenerated.DesktopAgentComposerDefaults{
		Model:            optionalStringPointer(value.Model),
		PermissionModeId: optionalStringPointer(value.PermissionModeID),
		ReasoningEffort:  optionalStringPointer(value.ReasoningEffort),
	}
	if generated.Model == nil && generated.PermissionModeId == nil && generated.ReasoningEffort == nil {
		return nil
	}
	return &generated
}

func optionalStringPointer(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
