import type {
  IReporterService,
  ReporterEventParams
} from "../services/reporterService.interface";
import { toAnalyticsParamName } from "./paramNames.ts";

export type AnalyticsReporterParamValue =
  | string
  | number
  | boolean
  | null
  | readonly string[]
  | readonly number[]
  | readonly boolean[];

export type AnalyticsReporterParams = Record<
  string,
  AnalyticsReporterParamValue
>;

export interface AnalyticsReporterDependencies {
  reporterService: Pick<IReporterService, "trackEvents">;
  now?: () => number;
}

export abstract class BaseAnalyticsReporter<
  TParams extends AnalyticsReporterParams
> {
  protected abstract readonly eventName: string;

  private readonly params: TParams;
  private readonly reporterService: Pick<IReporterService, "trackEvents">;
  private readonly now: () => number;

  protected constructor(
    params: TParams,
    dependencies: AnalyticsReporterDependencies
  ) {
    this.params = params;
    this.reporterService = dependencies.reporterService;
    this.now = dependencies.now ?? Date.now;
  }

  async report(): Promise<void> {
    await this.reporterService.trackEvents([
      {
        clientTS: this.now(),
        name: this.eventName,
        params: this.toProtocolParams()
      }
    ]);
  }

  private toProtocolParams(): ReporterEventParams {
    const result: ReporterEventParams = {};
    for (const [key, value] of Object.entries(this.params)) {
      result[toAnalyticsParamName(key)] = value;
    }
    return result;
  }
}
