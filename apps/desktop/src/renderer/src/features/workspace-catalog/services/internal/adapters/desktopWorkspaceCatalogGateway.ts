import type {
  HealthStatusResponse,
  NextopdClient,
  WorkspaceSummary
} from "@tutti-os/client-nextopd-ts";
import type { DesktopHostWorkspaceApi } from "@preload/types";

export interface DesktopWorkspaceCatalogGateway {
  getHealth(): Promise<HealthStatusResponse>;
  getStartupWorkspace(): Promise<WorkspaceSummary | null>;
  getWorkspace(workspaceID: string): Promise<WorkspaceSummary>;
  renameWorkspace(
    workspaceID: string,
    payload: { name: string }
  ): Promise<WorkspaceSummary>;
}

export function createDesktopWorkspaceCatalogGateway(
  _hostWorkspaceApi: DesktopHostWorkspaceApi,
  nextopdClient: NextopdClient
): DesktopWorkspaceCatalogGateway {
  return {
    getHealth() {
      return nextopdClient.getHealth();
    },
    getStartupWorkspace() {
      return nextopdClient.getStartupWorkspace();
    },
    getWorkspace(workspaceID: string) {
      return nextopdClient.getWorkspace(workspaceID);
    },
    renameWorkspace(workspaceID: string, payload: { name: string }) {
      return nextopdClient.updateWorkspace(workspaceID, payload);
    }
  };
}
