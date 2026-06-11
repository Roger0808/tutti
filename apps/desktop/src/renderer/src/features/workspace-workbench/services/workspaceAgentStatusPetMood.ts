import type { AgentActivitySnapshot } from "@tutti-os/agent-activity-core";

export type WorkspaceAgentStatusPetMood =
  | "failed"
  | "idle"
  | "review"
  | "running"
  | "waiting";

export function resolveWorkspaceAgentStatusPetMood(
  snapshot: AgentActivitySnapshot,
  waitingCount: number
): WorkspaceAgentStatusPetMood {
  if (waitingCount > 0) {
    return "waiting";
  }
  const statuses = snapshot.sessions.map((session) =>
    session.status.trim().toLowerCase()
  );
  if (statuses.some((status) => status === "failed")) {
    return "failed";
  }
  if (statuses.some((status) => status === "running" || status === "working")) {
    return "running";
  }
  if (statuses.some((status) => status === "queued" || status === "created")) {
    return "review";
  }
  return "idle";
}
