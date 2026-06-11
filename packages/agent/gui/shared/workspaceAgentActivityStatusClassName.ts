import type { WorkspaceAgentActivityStatus } from "./workspaceAgentActivityListViewModel";

const STATUS_CLASS_BY_STATUS: Record<WorkspaceAgentActivityStatus, string> = {
  working: "working",
  waiting: "waiting",
  idle: "idle",
  completed: "done",
  canceled: "done",
  failed: "failed"
};

export function workspaceAgentActivityStatusClassName(
  status: WorkspaceAgentActivityStatus
): string {
  return STATUS_CLASS_BY_STATUS[status];
}
