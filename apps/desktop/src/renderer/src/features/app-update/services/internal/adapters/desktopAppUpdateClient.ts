import type { DesktopUpdateApi } from "@preload/types";
import type { AppUpdateState } from "@shared/contracts/ipc";

export interface DesktopAppUpdateClient {
  checkForUpdates(): Promise<AppUpdateState>;
  downloadUpdate(): Promise<AppUpdateState>;
  getState(): Promise<AppUpdateState>;
  installUpdate(): Promise<void>;
  onState(listener: (state: AppUpdateState) => void): () => void;
}

export function createDesktopAppUpdateClient(
  updateApi: DesktopUpdateApi
): DesktopAppUpdateClient {
  return {
    checkForUpdates() {
      return updateApi.checkForUpdates();
    },
    downloadUpdate() {
      return updateApi.downloadUpdate();
    },
    getState() {
      return updateApi.getState();
    },
    installUpdate() {
      return updateApi.installUpdate();
    },
    onState(listener: (state: AppUpdateState) => void) {
      return updateApi.onState(listener);
    }
  };
}
