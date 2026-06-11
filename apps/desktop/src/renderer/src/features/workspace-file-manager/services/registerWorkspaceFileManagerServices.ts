import { SyncDescriptor, type ServiceRegistry } from "@zk-tech/bedrock/di";
import type { NextopdClient } from "@tutti-os/client-nextopd-ts";
import type { DesktopHostFilesApi, DesktopPlatformApi } from "@preload/types";
import type { IReporterService } from "../../analytics/services/reporterService.interface.ts";
import { WorkspaceFileManagerService } from "./internal/workspaceFileManagerService";
import { IWorkspaceFileManagerService } from "./workspaceFileManagerService.interface";

export interface WorkspaceFileManagerServiceRegistrationInput {
  hostFilesApi: DesktopHostFilesApi;
  nextopdClient: NextopdClient;
  platformApi: Pick<
    DesktopPlatformApi,
    "homeDirectory" | "os" | "resolveDroppedPaths"
  >;
  reporterService?: Pick<IReporterService, "trackEvents">;
}

export function registerWorkspaceFileManagerServices(
  registry: ServiceRegistry,
  input: WorkspaceFileManagerServiceRegistrationInput
): void {
  registry.register(
    IWorkspaceFileManagerService,
    new SyncDescriptor(WorkspaceFileManagerService, [input])
  );
}
