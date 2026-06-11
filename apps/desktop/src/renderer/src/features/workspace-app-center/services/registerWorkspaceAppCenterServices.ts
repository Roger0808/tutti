import type { ServiceRegistry } from "@zk-tech/bedrock/di";
import type {
  NextopdClient,
  NextopdEventStreamClient
} from "@tutti-os/client-nextopd-ts";
import type {
  DesktopHostFilesApi,
  DesktopRuntimeApi,
  DesktopHostWorkspaceApi
} from "@preload/types";
import type { IReporterService } from "../../analytics/services/reporterService.interface.ts";
import { createDesktopWorkspaceAppCenterGateway } from "./internal/adapters/desktopWorkspaceAppCenterGateway.ts";
import { WorkspaceAppCenterService } from "./internal/workspaceAppCenterService.ts";
import {
  IWorkspaceAppCenterService,
  type IWorkspaceAppCenterService as WorkspaceAppCenterServiceInterface
} from "./workspaceAppCenterService.interface";

export interface WorkspaceAppCenterServiceRegistrationInput {
  eventStreamClient: NextopdEventStreamClient;
  hostFilesApi: Pick<
    DesktopHostFilesApi,
    | "revealInFolder"
    | "selectAppArchive"
    | "selectAppArchiveExportPath"
    | "selectAppIconImage"
  >;
  hostWorkspaceApi: Pick<DesktopHostWorkspaceApi, "openWorkspaceAppFolder">;
  nextopdClient: NextopdClient;
  reporterService?: Pick<IReporterService, "trackEvents">;
  runtimeApi: Pick<DesktopRuntimeApi, "logRendererDiagnostic">;
}

export function registerWorkspaceAppCenterServices(
  registry: ServiceRegistry,
  input: WorkspaceAppCenterServiceRegistrationInput
): WorkspaceAppCenterServiceInterface {
  const service = new WorkspaceAppCenterService({
    eventStreamClient: input.eventStreamClient,
    gateway: createDesktopWorkspaceAppCenterGateway(input.nextopdClient),
    hostFilesApi: input.hostFilesApi,
    hostWorkspaceApi: input.hostWorkspaceApi,
    nextopdClient: input.nextopdClient,
    reporterService: input.reporterService,
    runtimeApi: input.runtimeApi
  });
  registry.registerInstance(IWorkspaceAppCenterService, service);
  return service;
}
