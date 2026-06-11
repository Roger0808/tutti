import { ipcMain, shell } from "electron";
import type { NextopdClient } from "@tutti-os/client-nextopd-ts";
import {
  desktopIpcChannels,
  type DesktopDeveloperLogKind
} from "../../shared/contracts/ipc";
import { type DeveloperLogsService } from "../developerLogs";
import {
  createDesktopDeveloperLogsService,
  exportDesktopDeveloperLogsAndNotify
} from "../developerLogsDesktop.ts";
import type { DesktopHostPreferencesState } from "../desktopHostPreferences";
import { resolveDesktopDefaultsFromEnv } from "../defaults";
import { toDesktopIpcResult } from "./result";

export function registerDeveloperIpc(
  preferences: DesktopHostPreferencesState,
  nextopdClient?: Pick<
    NextopdClient,
    | "listWorkspaceAgentSessionMessages"
    | "listWorkspaceAgentSessions"
    | "listWorkspaceAppFactoryJobs"
    | "listWorkspaceApps"
    | "listWorkspaces"
  >
): void {
  const defaults = resolveDesktopDefaultsFromEnv();
  const service = createDesktopDeveloperLogsService(preferences, nextopdClient);

  ipcMain.handle(desktopIpcChannels.developer.getLogsState, () =>
    toDesktopIpcResult(() => service.getLogsState())
  );
  ipcMain.handle(desktopIpcChannels.developer.clearLogs, () =>
    toDesktopIpcResult(() => service.clearLogs())
  );
  ipcMain.handle(desktopIpcChannels.developer.exportLogs, () =>
    toDesktopIpcResult(() =>
      exportDesktopDeveloperLogsAndNotify(preferences, nextopdClient)
    )
  );
  ipcMain.handle(desktopIpcChannels.developer.openLogDirectory, () =>
    toDesktopIpcResult(async () => {
      await openPathOrThrow(defaults.state.logsDir);
    })
  );
  ipcMain.handle(
    desktopIpcChannels.developer.openLogFile,
    (_event, kind: DesktopDeveloperLogKind) =>
      toDesktopIpcResult(async () => {
        await openPathOrThrow(resolveLogFilePath(kind, service, defaults));
      })
  );
}

function resolveLogFilePath(
  kind: DesktopDeveloperLogKind,
  _service: DeveloperLogsService,
  defaults: ReturnType<typeof resolveDesktopDefaultsFromEnv>
): string {
  return kind === "daemon"
    ? defaults.state.nextopdLogPath
    : defaults.state.desktopLogPath;
}

async function openPathOrThrow(path: string): Promise<void> {
  const error = await shell.openPath(path);
  if (error) {
    throw new Error(error);
  }
}
