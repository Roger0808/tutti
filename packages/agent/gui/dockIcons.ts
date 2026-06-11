const workspaceDockAgentClaudeCodeUrl = new URL(
  "./app/renderer/assets/icons/agents/workspace-dock-agent-claude-code.png",
  import.meta.url
).href;
const workspaceDockAgentCodexUrl = new URL(
  "./app/renderer/assets/icons/agents/workspace-dock-agent-codex.png",
  import.meta.url
).href;
const workspaceDockAgentGeminiUrl = new URL(
  "./app/renderer/assets/icons/agents/workspace-dock-agent-gemini.png",
  import.meta.url
).href;
const workspaceDockAgentNexightUrl = new URL(
  "./app/renderer/assets/icons/agents/workspace-dock-agent-nexight.png",
  import.meta.url
).href;
const workspaceDockAgentOpenclawUrl = new URL(
  "./app/renderer/assets/icons/agents/workspace-dock-agent-openclaw.png",
  import.meta.url
).href;
const workspaceDockAgentHermesUrl = new URL(
  "./app/renderer/assets/icons/agents/manage-agent-hermes.png",
  import.meta.url
).href;

export const agentGuiDockIconUrl = workspaceDockAgentCodexUrl;

export const agentGuiDockIconUrls = {
  "claude-code": workspaceDockAgentClaudeCodeUrl,
  codex: workspaceDockAgentCodexUrl,
  gemini: workspaceDockAgentGeminiUrl,
  hermes: workspaceDockAgentHermesUrl,
  nexight: workspaceDockAgentNexightUrl,
  openclaw: workspaceDockAgentOpenclawUrl
} as const;
