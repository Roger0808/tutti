import type { NextopdClient, TrackEvent } from "@tutti-os/client-nextopd-ts";
import type {
  IReporterService,
  ReporterEventInput,
  ReporterEventParams
} from "../reporterService.interface";

export interface ReporterServiceDependencies {
  nextopdClient: Pick<NextopdClient, "trackEvents">;
  now?: () => number;
}

export class ReporterService implements IReporterService {
  readonly _serviceBrand: undefined;

  private readonly nextopdClient: Pick<NextopdClient, "trackEvents">;
  private readonly now: () => number;

  constructor(dependencies: ReporterServiceDependencies) {
    this.nextopdClient = dependencies.nextopdClient;
    this.now = dependencies.now ?? Date.now;
  }

  async track(name: string, params?: ReporterEventParams): Promise<void> {
    await this.trackEvents([{ name, params }]);
  }

  async trackEvents(events: ReporterEventInput[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    try {
      const nextopdEvents = events.map((event) => this.toNextopdEvent(event));
      await this.nextopdClient.trackEvents(nextopdEvents);
    } catch {
      // Analytics is best-effort in the renderer and must not affect product flows.
    }
  }

  private toNextopdEvent(event: ReporterEventInput): TrackEvent {
    const nextopdEvent: TrackEvent = {
      client_ts: event.clientTS ?? this.now(),
      name: event.name
    };
    if (event.params) {
      nextopdEvent.params = { ...event.params };
    }
    return nextopdEvent;
  }
}
