import type { IReporterService } from "../../../analytics/services/reporterService.interface.ts";

export interface WorkspaceAppWebviewBrowserLease {
  release(): void;
}

export function createWorkspaceAppWebviewBrowserLease(_input: {
  reporterNow?: () => number;
  reporterService?: Pick<IReporterService, "trackEvents">;
}): WorkspaceAppWebviewBrowserLease | null {
  return null;
}
