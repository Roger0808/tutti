import { app, BrowserWindow } from "electron";
import electronUpdater, {
  type AppUpdater,
  type ProgressInfo,
  type UpdateDownloadedEvent,
  type UpdateInfo
} from "electron-updater";
import {
  desktopIpcChannels,
  type AppUpdateChannel,
  type AppUpdatePolicy,
  type AppUpdateState,
  type AppUpdateStatus,
  type ConfigureAppUpdatesInput
} from "../../shared/contracts/ipc";
import { getDesktopLogger } from "../logging";
import {
  resolveMacAppBundlePath,
  resolveMacUpdaterSupport
} from "./macosUpdaterSupport";

const { autoUpdater } = electronUpdater;

const updateCheckIntervalMs = 1000 * 60 * 60 * 6;

type DriverDisposer = () => void;

interface AppUpdateDriver {
  checkForUpdates(): Promise<void>;
  configure(options: {
    allowPrerelease: boolean;
    autoDownload: boolean;
    autoInstallOnAppQuit: boolean;
    channel: string;
  }): void;
  downloadUpdate(): Promise<void>;
  onCheckingForUpdate(listener: () => void): DriverDisposer;
  onDownloadProgress(
    listener: (progress: ProgressInfo) => void
  ): DriverDisposer;
  onError(listener: (error: Error) => void): DriverDisposer;
  onUpdateAvailable(listener: (info: UpdateInfo) => void): DriverDisposer;
  onUpdateDownloaded(
    listener: (info: UpdateDownloadedEvent) => void
  ): DriverDisposer;
  onUpdateNotAvailable(listener: (info: UpdateInfo) => void): DriverDisposer;
  quitAndInstall(): void;
}

export interface AppUpdateService {
  checkForUpdates(): Promise<AppUpdateState>;
  configure(input: ConfigureAppUpdatesInput): Promise<AppUpdateState>;
  dispose(): void;
  downloadUpdate(): Promise<AppUpdateState>;
  getState(): AppUpdateState;
  installUpdate(): Promise<void>;
  onStateChanged(
    listener: (state: AppUpdateState, previousState: AppUpdateState) => void
  ): () => void;
}

interface AppUpdateServiceOptions {
  supportsUpdates?: boolean;
  unsupportedMessage?: string;
}

function createElectronAppUpdateDriver(updater: AppUpdater): AppUpdateDriver {
  const emitter = updater as unknown as {
    on: (event: string, listener: (...args: unknown[]) => void) => void;
    removeListener: (
      event: string,
      listener: (...args: unknown[]) => void
    ) => void;
  };

  const listen = <T>(
    event: string,
    listener: (payload: T) => void
  ): DriverDisposer => {
    const handler = (...args: unknown[]) => {
      listener(args[0] as T);
    };
    emitter.on(event, handler);
    return () => {
      emitter.removeListener(event, handler);
    };
  };

  const listenVoid = (event: string, listener: () => void): DriverDisposer => {
    emitter.on(event, listener);
    return () => {
      emitter.removeListener(event, listener);
    };
  };

  return {
    checkForUpdates: () => updater.checkForUpdates().then(() => undefined),
    configure(options) {
      updater.autoDownload = options.autoDownload;
      updater.autoInstallOnAppQuit = options.autoInstallOnAppQuit;
      updater.allowPrerelease = options.allowPrerelease;
      updater.channel = options.channel;
    },
    downloadUpdate: () => updater.downloadUpdate().then(() => undefined),
    onCheckingForUpdate: (listener) =>
      listenVoid("checking-for-update", listener),
    onDownloadProgress: (listener) =>
      listen<ProgressInfo>("download-progress", listener),
    onError: (listener) => listen<Error>("error", listener),
    onUpdateAvailable: (listener) =>
      listen<UpdateInfo>("update-available", listener),
    onUpdateDownloaded: (listener) =>
      listen<UpdateDownloadedEvent>("update-downloaded", listener),
    onUpdateNotAvailable: (listener) =>
      listen<UpdateInfo>("update-not-available", listener),
    quitAndInstall: () => {
      updater.quitAndInstall();
    }
  };
}

function buildBaseState(
  currentVersion: string,
  policy: AppUpdatePolicy,
  channel: AppUpdateChannel,
  status: AppUpdateStatus,
  message: string | null = null
): AppUpdateState {
  return {
    channel,
    checkedAt: null,
    currentVersion,
    downloadedBytes: null,
    downloadPercent: null,
    latestVersion: null,
    message,
    policy,
    releaseDate: null,
    releaseName: null,
    releaseNotesUrl: null,
    status,
    totalBytes: null
  };
}

function normalizeReleaseDate(
  value: Date | string | null | undefined
): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function summarizeUpdateErrorMessage(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (normalized.includes("Cannot parse releases feed")) {
    return "Unable to read the update feed from GitHub Releases.";
  }
  if (
    normalized.includes("Code signature at URL") &&
    normalized.includes("did not pass validation")
  ) {
    return "macOS rejected the downloaded update because its code signature did not match this build. Download the latest release manually.";
  }
  if (
    normalized.includes("net::ERR_INTERNET_DISCONNECTED") ||
    normalized.includes("net::ERR_NETWORK_CHANGED")
  ) {
    return "Network connection was interrupted while checking for updates.";
  }

  return normalized.length <= 160
    ? normalized
    : `${normalized.slice(0, 157).trimEnd()}...`;
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return summarizeUpdateErrorMessage(error.message);
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return summarizeUpdateErrorMessage(error);
  }

  return "Unknown update error";
}

export function createAppUpdateService(
  driver: AppUpdateDriver = createElectronAppUpdateDriver(autoUpdater),
  options: AppUpdateServiceOptions = {}
): AppUpdateService {
  const currentVersion = app.getVersion();
  let supportsUpdates =
    options.supportsUpdates ??
    (process.env.NODE_ENV !== "test" && app.isPackaged);
  let unsupportedMessage =
    options.unsupportedMessage ??
    (process.env.NODE_ENV === "test"
      ? "Update checks are disabled in tests."
      : "Update checks are only available in packaged builds.");

  if (
    options.supportsUpdates === undefined &&
    supportsUpdates &&
    process.platform === "darwin"
  ) {
    const macSupport = resolveMacUpdaterSupport({
      appPath: resolveMacAppBundlePath(app.getPath("exe"))
    });
    if (!macSupport.supported) {
      supportsUpdates = false;
      unsupportedMessage = macSupport.message ?? unsupportedMessage;
    }
  }

  let state = buildBaseState(
    currentVersion,
    "prompt",
    "stable",
    supportsUpdates ? "idle" : "unsupported",
    supportsUpdates ? null : unsupportedMessage
  );
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let activeCheckPromise: Promise<void> | null = null;
  let activeDownloadPromise: Promise<void> | null = null;
  const stateChangedListeners = new Set<
    (state: AppUpdateState, previousState: AppUpdateState) => void
  >();

  const emitState = (): void => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(desktopIpcChannels.update.state, state);
    }
  };

  const applyState = (nextState: AppUpdateState): AppUpdateState => {
    const previousState = state;
    state = nextState;
    emitState();
    for (const listener of stateChangedListeners) {
      listener(state, previousState);
    }
    return state;
  };

  const clearSchedule = (): void => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const resetConfiguredState = (
    status: AppUpdateStatus,
    message: string | null = null
  ): void => {
    applyState(
      buildBaseState(
        currentVersion,
        state.policy,
        state.channel,
        status,
        message
      )
    );
  };

  const scheduleChecks = (): void => {
    clearSchedule();
    if (!supportsUpdates || state.policy === "off") {
      return;
    }

    intervalId = setInterval(() => {
      void service.checkForUpdates();
    }, updateCheckIntervalMs);
  };

  const driverDisposers = [
    driver.onCheckingForUpdate(() => {
      getDesktopLogger().info("checking for application updates", {
        channel: state.channel,
        policy: state.policy
      });
      applyState({
        ...buildBaseState(
          currentVersion,
          state.policy,
          state.channel,
          "checking"
        ),
        checkedAt: state.checkedAt
      });
    }),
    driver.onUpdateAvailable((info) => {
      getDesktopLogger().info("application update is available", {
        release_date: normalizeReleaseDate(info.releaseDate),
        release_name: info.releaseName ?? null,
        version: info.version ?? null
      });
      applyState({
        ...buildBaseState(
          currentVersion,
          state.policy,
          state.channel,
          "available"
        ),
        checkedAt: new Date().toISOString(),
        latestVersion: info.version ?? null,
        releaseDate: normalizeReleaseDate(info.releaseDate),
        releaseName: info.releaseName ?? null
      });
    }),
    driver.onUpdateNotAvailable(() => {
      applyState({
        ...buildBaseState(
          currentVersion,
          state.policy,
          state.channel,
          "up_to_date"
        ),
        checkedAt: new Date().toISOString()
      });
    }),
    driver.onDownloadProgress((progress) => {
      applyState({
        ...state,
        downloadedBytes: Number.isFinite(progress.transferred)
          ? progress.transferred
          : null,
        downloadPercent: Number.isFinite(progress.percent)
          ? progress.percent
          : null,
        status: "downloading",
        totalBytes: Number.isFinite(progress.total) ? progress.total : null
      });
    }),
    driver.onUpdateDownloaded((info) => {
      applyState({
        ...state,
        checkedAt: new Date().toISOString(),
        downloadedBytes: state.totalBytes,
        downloadPercent: 100,
        latestVersion: info.version ?? state.latestVersion,
        releaseDate:
          normalizeReleaseDate(info.releaseDate) ?? state.releaseDate,
        releaseName: info.releaseName ?? state.releaseName,
        status: "downloaded"
      });
    }),
    driver.onError((error) => {
      getDesktopLogger().error("application updater failed", {
        error: error.message,
        error_name: error.name
      });
      applyState({
        ...buildBaseState(
          currentVersion,
          state.policy,
          state.channel,
          "error",
          normalizeMessage(error)
        ),
        checkedAt: new Date().toISOString(),
        latestVersion: state.latestVersion,
        releaseDate: state.releaseDate,
        releaseName: state.releaseName
      });
    })
  ];

  const service: AppUpdateService = {
    async checkForUpdates() {
      if (
        !supportsUpdates ||
        state.policy === "off" ||
        state.status === "downloaded"
      ) {
        return state;
      }

      if (activeCheckPromise) {
        await activeCheckPromise;
        return state;
      }

      activeCheckPromise = driver.checkForUpdates().finally(() => {
        activeCheckPromise = null;
      });
      await activeCheckPromise;
      return state;
    },
    configure(input) {
      state = {
        ...state,
        channel: input.channel ?? "stable",
        policy: input.policy
      };

      clearSchedule();
      if (!supportsUpdates) {
        return Promise.resolve(
          applyState(
            buildBaseState(
              currentVersion,
              state.policy,
              state.channel,
              "unsupported",
              unsupportedMessage
            )
          )
        );
      }

      if (state.policy === "off") {
        return Promise.resolve(
          applyState(
            buildBaseState(
              currentVersion,
              state.policy,
              state.channel,
              "disabled"
            )
          )
        );
      }

      driver.configure({
        allowPrerelease: false,
        autoDownload: state.policy === "auto",
        autoInstallOnAppQuit: state.policy === "auto",
        channel: "latest"
      });
      resetConfiguredState("idle");
      scheduleChecks();
      void service.checkForUpdates();
      return Promise.resolve(state);
    },
    dispose() {
      clearSchedule();
      for (const dispose of driverDisposers) {
        dispose();
      }
    },
    async downloadUpdate() {
      if (!supportsUpdates || state.status !== "available") {
        return state;
      }

      if (activeDownloadPromise) {
        await activeDownloadPromise;
        return state;
      }

      applyState({
        ...state,
        downloadedBytes: 0,
        downloadPercent: 0,
        status: "downloading",
        totalBytes: null
      });
      activeDownloadPromise = driver.downloadUpdate().finally(() => {
        activeDownloadPromise = null;
      });
      await activeDownloadPromise;
      return state;
    },
    getState() {
      return state;
    },
    installUpdate() {
      if (state.status === "downloaded") {
        driver.quitAndInstall();
      }
      return Promise.resolve();
    },
    onStateChanged(listener) {
      stateChangedListeners.add(listener);
      return () => {
        stateChangedListeners.delete(listener);
      };
    }
  };

  return service;
}
