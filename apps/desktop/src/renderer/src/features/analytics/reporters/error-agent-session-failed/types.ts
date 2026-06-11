import type { AnalyticsReporterParams } from "../baseReporter.ts";

export interface ErrorAgentSessionFailedParams extends AnalyticsReporterParams {
  agentSessionId: string;
  errorCode: string | null;
  isRetryable: boolean;
  provider: string;
}
