import type { AgentActivitySession } from "@tutti-os/agent-activity-core";
import type { WorkspaceAgentSession } from "@tutti-os/client-nextopd-ts";
import {
  agentSessionStateDefaultsFromSettings,
  type AgentHostAgentSessionComposerSettingsInput,
  type AgentHostAgentSessionStateDefaults
} from "./desktopAgentHostProjection.ts";

export interface DesktopAgentHostWorkspaceState {
  defaultProjectSelection: DesktopAgentHostProjectSelection | null;
  hiddenAgentSessionIds: Set<string>;
  sessionStateDefaultsByAgentSessionId: Map<
    string,
    AgentHostAgentSessionStateDefaults
  >;
}

export interface DesktopAgentHostProjectSelection {
  path: string | null;
}

const agentHostWorkspaceStateByWorkspaceId = new Map<
  string,
  DesktopAgentHostWorkspaceState
>();

export function desktopAgentHostWorkspaceState(
  workspaceId: string
): DesktopAgentHostWorkspaceState {
  const normalizedWorkspaceId = workspaceId.trim() || "__default__";
  let state = agentHostWorkspaceStateByWorkspaceId.get(normalizedWorkspaceId);
  if (!state) {
    state = {
      defaultProjectSelection: null,
      hiddenAgentSessionIds: new Set(),
      sessionStateDefaultsByAgentSessionId: new Map<
        string,
        AgentHostAgentSessionStateDefaults
      >()
    };
    agentHostWorkspaceStateByWorkspaceId.set(normalizedWorkspaceId, state);
  }
  return state;
}

export function rememberDefaultProjectSelection(
  state: DesktopAgentHostWorkspaceState,
  selection: DesktopAgentHostProjectSelection | null
): void {
  state.defaultProjectSelection = selection
    ? { path: normalizeOptionalPath(selection.path) }
    : null;
}

export function resolveDefaultProjectSelection(
  state: DesktopAgentHostWorkspaceState
): DesktopAgentHostProjectSelection | null {
  return state.defaultProjectSelection
    ? { path: state.defaultProjectSelection.path }
    : null;
}

export function rememberAgentSessionStateDefaults(
  state: DesktopAgentHostWorkspaceState,
  nextopdSessionId: string,
  settings: AgentHostAgentSessionComposerSettingsInput | null | undefined
): void {
  const defaults = agentSessionStateDefaultsFromSettings(settings);
  if (!defaults) {
    return;
  }
  const normalizedNextopdSessionId = normalizeAgentSessionId(nextopdSessionId);
  if (normalizedNextopdSessionId) {
    state.sessionStateDefaultsByAgentSessionId.set(
      normalizedNextopdSessionId,
      defaults
    );
  }
}

export function resolveAgentSessionStateDefaults(
  state: DesktopAgentHostWorkspaceState,
  agentSessionId: string
): AgentHostAgentSessionStateDefaults | undefined {
  return state.sessionStateDefaultsByAgentSessionId.get(
    normalizeAgentSessionId(agentSessionId)
  );
}

export function rememberAgentSessionVisibility(
  state: DesktopAgentHostWorkspaceState,
  nextopdSessionId: string,
  visible: boolean | null | undefined
): void {
  if (visible === undefined || visible === null) {
    return;
  }
  const normalizedNextopdSessionId = normalizeAgentSessionId(nextopdSessionId);
  if (!normalizedNextopdSessionId) {
    return;
  }
  if (visible) {
    state.hiddenAgentSessionIds.delete(normalizedNextopdSessionId);
    return;
  }
  state.hiddenAgentSessionIds.add(normalizedNextopdSessionId);
}

export function forgetHiddenAgentSession(
  state: DesktopAgentHostWorkspaceState,
  agentSessionId: string
): void {
  state.hiddenAgentSessionIds.delete(normalizeAgentSessionId(agentSessionId));
}

export function isHiddenAgentSession(
  state: DesktopAgentHostWorkspaceState,
  session: WorkspaceAgentSession | AgentActivitySession
): boolean {
  const nextopdSessionId = normalizeAgentSessionId(
    "agentSessionId" in session ? session.agentSessionId : session.id
  );
  const daemonVisible =
    "visible" in session && typeof session.visible === "boolean"
      ? session.visible
      : true;
  return !daemonVisible || state.hiddenAgentSessionIds.has(nextopdSessionId);
}

function normalizeAgentSessionId(agentSessionId: string): string {
  return agentSessionId.trim();
}

function normalizeOptionalPath(path: string | null | undefined): string | null {
  return path?.trim() || null;
}
