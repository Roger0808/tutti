import { isNormalizedWorkspaceAgentRunningStatus } from "./workspaceAgentStatusNormalizer";
import type {
  WorkspaceAgentActivityPresence,
  WorkspaceAgentActivitySession
} from "./workspaceAgentActivityTypes";

export function countRunningWorkspaceAgentSessions(
  sessions: readonly WorkspaceAgentActivitySession[]
): number {
  return sessions.filter(isRunningWorkspaceAgentSession).length;
}

export function isRunningWorkspaceAgentSession(
  session: WorkspaceAgentActivitySession
): boolean {
  return isNormalizedWorkspaceAgentRunningStatus(session);
}

export function resolveWorkspaceAgentSessionOwnerUserId(
  session: WorkspaceAgentActivitySession,
  presences: readonly WorkspaceAgentActivityPresence[]
): string {
  const direct = (session.userId ?? "").trim();
  if (direct.length > 0) {
    return direct;
  }
  const presence = presences.find((p) => p.id === session.presenceId);
  return (presence?.userId ?? "").trim();
}
