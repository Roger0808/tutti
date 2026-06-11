import { getActiveLocale } from "../../../../i18n/runtime.ts";
import { AppUpdateActionClickedReporter } from "../../../analytics/reporters/app-update-action-clicked/appUpdateActionClickedReporter.ts";
import type { IReporterService } from "../../../analytics/services/reporterService.interface.ts";
import { resolveDesktopErrorMessage } from "../../../../lib/desktopErrors.ts";
import type { AppUpdateState } from "@shared/contracts/ipc";
import type { IAppUpdateService } from "../appUpdateService.interface";
import type { DesktopAppUpdateClient } from "./adapters/desktopAppUpdateClient";
import { createAppUpdateStore } from "./appUpdateStore.ts";
import { resolveAppUpdateViewState } from "./appUpdateViewModel.ts";

function formatError(error: unknown): string {
  return resolveDesktopErrorMessage(error, getActiveLocale());
}

export class AppUpdateService implements IAppUpdateService {
  readonly _serviceBrand: undefined;
  readonly store = createAppUpdateStore();

  private disposed = false;
  private unsubscribe: (() => void) | null = null;
  private readonly reporterService: Pick<
    IReporterService,
    "trackEvents"
  > | null;
  private readonly reporterNow?: () => number;
  private readonly updateClient: DesktopAppUpdateClient;

  constructor(
    updateClient: DesktopAppUpdateClient,
    reporterService: Pick<IReporterService, "trackEvents"> | null = null,
    reporterNow?: () => number
  ) {
    this.updateClient = updateClient;
    this.reporterService = reporterService;
    this.reporterNow = reporterNow;
  }

  async load(): Promise<void> {
    this.ensureSubscription();

    try {
      const updateState = await this.updateClient.getState();
      this.applyUpdateState(updateState);
    } catch (error) {
      if (!this.disposed) {
        this.store.error = formatError(error);
      }
    }
  }

  async runPrimaryAction(): Promise<void> {
    const view = resolveAppUpdateViewState(
      this.store.updateState,
      this.store.isActing
    );
    if (view.busy || !view.action) {
      return;
    }

    this.reportActionClicked({
      action: view.action,
      updateStatus: this.store.updateState?.status ?? "idle"
    });
    this.store.error = null;
    this.store.isActing = true;
    this.updateView();

    try {
      if (view.action === "download") {
        this.applyUpdateState(await this.updateClient.downloadUpdate());
      } else if (view.action === "install") {
        await this.updateClient.installUpdate();
      } else {
        this.applyUpdateState(await this.updateClient.checkForUpdates());
      }
    } catch (error) {
      if (!this.disposed) {
        this.store.error = formatError(error);
      }
    } finally {
      if (!this.disposed) {
        this.store.isActing = false;
        this.updateView();
      }
    }
  }

  dispose(): void {
    this.disposed = true;
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private ensureSubscription(): void {
    if (this.unsubscribe) {
      return;
    }

    this.unsubscribe = this.updateClient.onState((updateState) => {
      this.applyUpdateState(updateState);
    });
  }

  private applyUpdateState(updateState: AppUpdateState): void {
    if (this.disposed) {
      return;
    }

    this.store.error = null;
    this.store.updateState = updateState;
    this.updateView();
  }

  private updateView(): void {
    this.store.view = resolveAppUpdateViewState(
      this.store.updateState,
      this.store.isActing
    );
  }

  private reportActionClicked(input: {
    action: string;
    updateStatus: string;
  }): void {
    if (!this.reporterService) {
      return;
    }

    void new AppUpdateActionClickedReporter(input, {
      reporterService: this.reporterService,
      now: this.reporterNow
    }).report();
  }
}
