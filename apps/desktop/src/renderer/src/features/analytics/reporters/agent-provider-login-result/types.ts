import type { AnalyticsReporterParams } from "../baseReporter.ts";

export interface AgentProviderLoginResultParams extends AnalyticsReporterParams {
  errorReason: string | null;
  provider: string;
  success: boolean;
}
