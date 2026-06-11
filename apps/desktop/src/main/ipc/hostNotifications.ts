import { BrowserWindow, Notification, app } from "electron";
import {
  desktopIpcChannels,
  type DesktopHostNotificationPayload
} from "../../shared/contracts/ipc";
import type { WorkspaceLaunch } from "../host/workspaceLaunch";
import { createDesktopNotificationActivation } from "../host/desktopNotificationActivation.ts";
import { createDesktopNotificationAccess } from "../host/desktopNotificationAccess.ts";
import { getDesktopLogger } from "../logging.ts";
import { registerDesktopIpcHandler } from "./handle";

export interface HostNotificationsIpcDependencies {
  workspaceLaunch: Pick<WorkspaceLaunch, "openStartupWindow">;
}

export function registerHostNotificationsIpc(
  deps: HostNotificationsIpcDependencies
): void {
  const logger = getDesktopLogger();
  const activation = createDesktopNotificationActivation({
    focusApp() {
      app.focus();
    },
    getWindows() {
      return BrowserWindow.getAllWindows();
    },
    onOpenStartupWindowFailed(error) {
      logger.warn("failed to open startup window from desktop notification", {
        error
      });
    },
    openStartupWindow() {
      return deps.workspaceLaunch.openStartupWindow();
    }
  });
  const access = createDesktopNotificationAccess({
    createNotification(input) {
      return new Notification(input);
    },
    isSupported() {
      return Notification.isSupported();
    },
    onFailed(error) {
      logger.warn("desktop notification failed", {
        error
      });
    },
    onClick() {
      void activation.activate();
    }
  });

  registerDesktopIpcHandler(
    desktopIpcChannels.host.notifications.show,
    (_event, payload: DesktopHostNotificationPayload) =>
      access.show({
        body: payload.body,
        title: payload.title
      })
  );
}
