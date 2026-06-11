import { webUtils } from "electron";
import { homedir } from "node:os";
import type { DesktopPlatformApi } from "../types";

export function createPlatformDesktopApi(): DesktopPlatformApi {
  return {
    homeDirectory: homedir(),
    os: process.platform,
    resolveDroppedPaths(files: File[]): string[] {
      return files.map((file) => webUtils.getPathForFile(file));
    }
  };
}
