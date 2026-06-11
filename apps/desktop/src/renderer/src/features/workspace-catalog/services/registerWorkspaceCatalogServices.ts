import type { ServiceRegistry } from "@zk-tech/bedrock/di";
import type { NextopdClient } from "@tutti-os/client-nextopd-ts";
import type { DesktopHostWorkspaceApi } from "@preload/types";
import type { IReporterService } from "../../analytics/services/reporterService.interface";
import { IWorkspaceCatalogService } from "./workspaceCatalogService.interface";
import { createDesktopWorkspaceCatalogGateway } from "./internal/adapters/desktopWorkspaceCatalogGateway";
import { WorkspaceCatalogService } from "./internal/workspaceCatalogService";

export interface WorkspaceCatalogServiceRegistrationInput {
  hostApi: {
    platform: NodeJS.Platform;
    workspace: DesktopHostWorkspaceApi;
  };
  nextopdClient: NextopdClient;
  reporterService: Pick<IReporterService, "trackEvents">;
}

export function registerWorkspaceCatalogServices(
  registry: ServiceRegistry,
  input: WorkspaceCatalogServiceRegistrationInput
): void {
  registry.registerInstance(
    IWorkspaceCatalogService,
    new WorkspaceCatalogService({
      gateway: createDesktopWorkspaceCatalogGateway(
        input.hostApi.workspace,
        input.nextopdClient
      ),
      platform: input.hostApi.platform,
      reporterService: input.reporterService
    })
  );
}
