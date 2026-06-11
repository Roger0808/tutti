export const workspaceAppRuntimeStatuses = [
  "idle",
  "installing",
  "preparing",
  "starting",
  "running",
  "failed",
  "stopping"
] as const;

export type WorkspaceAppRuntimeStatus =
  (typeof workspaceAppRuntimeStatuses)[number];

export interface WorkspaceAppRuntimeError {
  readonly code?: string;
  readonly message: string;
}

export interface WorkspaceAppRuntimeState {
  readonly appId: string;
  readonly status: WorkspaceAppRuntimeStatus;
  readonly error?: WorkspaceAppRuntimeError | null;
  readonly startedAt?: string | null;
  readonly updatedAt?: string | null;
}
