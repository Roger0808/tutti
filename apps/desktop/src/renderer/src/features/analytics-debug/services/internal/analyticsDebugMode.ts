export interface AnalyticsDebugModeInput {
  isDev: boolean;
}

export function isAnalyticsDebugAvailable({
  isDev
}: AnalyticsDebugModeInput): boolean {
  return isDev;
}
