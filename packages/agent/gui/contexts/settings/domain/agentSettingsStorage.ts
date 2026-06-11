import { DEFAULT_AGENT_SETTINGS, type AgentSettings } from "./agentSettings";

function migrateStoredAgentSettings(settings: AgentSettings): AgentSettings {
  if (!settings.focusNodeOnClick) {
    return settings;
  }

  return {
    ...settings,
    focusNodeOnClick: false
  };
}

export function readStoredAgentSettings(): AgentSettings {
  return migrateStoredAgentSettings(DEFAULT_AGENT_SETTINGS);
}

export function writeStoredAgentSettings(_settings: AgentSettings): void {
  // Settings are owned by the embedding app rather than browser storage.
}
