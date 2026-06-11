export type AgentGuiWorkbenchProvider =
  | "claude-code"
  | "codex"
  | "nexight"
  | "gemini"
  | "hermes"
  | "openclaw";

export const agentGuiWorkbenchOpenSessionActivationType =
  "agent-gui:open-session";

export interface AgentGuiWorkbenchComposerOverrides {
  model?: string | null;
  permissionModeId?: string | null;
  planMode?: boolean;
  reasoningEffort?: string | null;
}

export type AgentGuiWorkbenchComposerOverridesByProvider = Partial<
  Record<AgentGuiWorkbenchProvider, AgentGuiWorkbenchComposerOverrides | null>
>;

export interface AgentGuiWorkbenchPendingHandoff {
  issueId?: string | null;
  issueTitle?: string | null;
  prompt: string;
  requestId: string;
  taskId?: string | null;
  taskTitle: string;
  title: string;
}

export interface AgentGuiWorkbenchNodeState {
  composerOverrides?: AgentGuiWorkbenchComposerOverrides | null;
  composerOverridesByProvider?: AgentGuiWorkbenchComposerOverridesByProvider | null;
  conversationCount?: number | null;
  conversationRailCollapsed?: boolean | null;
  conversationRailWidthPx?: number | null;
  lastActiveAgentSessionId: string | null;
  lastActiveConversationTitle?: string | null;
  pendingHandoff?: AgentGuiWorkbenchPendingHandoff | null;
  provider: AgentGuiWorkbenchProvider;
}

export interface AgentGuiWorkbenchState {
  composerOverrides?: AgentGuiWorkbenchComposerOverrides | null;
  composerOverridesByProvider?: AgentGuiWorkbenchComposerOverridesByProvider | null;
  conversationRailCollapsed?: boolean | null;
  conversationRailWidthPx?: number | null;
  lastActiveAgentSessionId: string | null;
  lastActiveConversationTitle?: string | null;
  pendingHandoff?: AgentGuiWorkbenchPendingHandoff | null;
}

export interface AgentGuiWorkbenchWorkspaceState {
  workspaceId: string;
}
