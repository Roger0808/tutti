import type { ServiceRegistry } from "@zk-tech/bedrock/di";
import type { NextopdClient } from "@tutti-os/client-nextopd-ts";
import { ReporterService } from "./internal/reporterService";
import { IReporterService } from "./reporterService.interface";

export interface ReporterServiceRegistrationInput {
  nextopdClient: Pick<NextopdClient, "trackEvents">;
}

export function registerReporterServices(
  registry: ServiceRegistry,
  input: ReporterServiceRegistrationInput
): IReporterService {
  const reporterService = new ReporterService({
    nextopdClient: input.nextopdClient
  });
  registry.registerInstance(IReporterService, reporterService);
  return reporterService;
}
