import type { AnalyticsReporterDependencies } from "../baseReporter.ts";

export class PredefinePageviewReporter {
  private readonly dependencies: AnalyticsReporterDependencies;
  private readonly eventName = "predefine_pageview";

  constructor(dependencies: AnalyticsReporterDependencies) {
    this.dependencies = dependencies;
  }

  async report(): Promise<void> {
    await this.dependencies.reporterService.trackEvents([
      {
        clientTS: this.dependencies.now?.() ?? Date.now(),
        name: this.eventName
      }
    ]);
  }
}
