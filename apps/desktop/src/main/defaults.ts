import { join } from "node:path";
import { homedir } from "node:os";
import { generatedDefaults } from "./generated/defaults.ts";

export interface DesktopResolvedDefaults {
  runtime: {
    env: "development" | "production";
  };
  state: {
    rootDir: string;
    logsDir: string;
    runDir: string;
    nextopdDBPath: string;
    nextopdListenerInfoPath: string;
    nextopdLogPath: string;
    desktopLogPath: string;
    nextopdPIDPath: string;
  };
  transport: {
    tcpAddr: string;
  };
  logging: {
    defaultLevel: "debug" | "info" | "warn" | "error";
    defaultOutput: "file" | "stdout" | "tee";
    maxSizeMB: number;
    maxBackups: number;
    maxAgeDays: number;
    maxTotalMB: number;
  };
}

export function initializeDesktopEnvironment(options?: {
  appVersion?: string;
  isPackaged?: boolean;
}): void {
  if (!process.env.NEXTOP_ENV?.trim()) {
    process.env.NEXTOP_ENV = options?.isPackaged ? "production" : "development";
  }

  const appVersion = options?.appVersion?.trim();
  if (!process.env.NEXTOP_APP_VERSION?.trim() && appVersion) {
    process.env.NEXTOP_APP_VERSION = appVersion;
  }
}

export function resolveDesktopDefaultsFromEnv(): DesktopResolvedDefaults {
  const env = resolveNextopEnv();
  const stateRootDir = resolveStateRootDir(env);
  const logsDir = resolveLogsDir(stateRootDir);
  const runDir = resolveRunDir(stateRootDir);

  return {
    runtime: {
      env
    },
    state: {
      rootDir: stateRootDir,
      logsDir,
      runDir,
      nextopdDBPath: resolveDBPath(stateRootDir),
      nextopdListenerInfoPath: resolveListenerInfoPath(runDir),
      nextopdLogPath: resolveDaemonLogPath(logsDir),
      desktopLogPath: resolveDesktopLogPath(logsDir),
      nextopdPIDPath: resolvePIDPath(runDir)
    },
    transport: {
      tcpAddr: resolveTCPAddr()
    },
    logging: {
      defaultLevel: generatedDefaults.logging.defaultLevel,
      defaultOutput: generatedDefaults.logging.defaultOutput,
      maxSizeMB: generatedDefaults.logging.maxSizeMB,
      maxBackups: generatedDefaults.logging.maxBackups,
      maxAgeDays: generatedDefaults.logging.maxAgeDays,
      maxTotalMB: generatedDefaults.logging.maxTotalMB
    }
  };
}

export function resolveNextopEnv(): "development" | "production" {
  return process.env.NEXTOP_ENV?.trim().match(/^(dev|development|local)$/i)
    ? "development"
    : "production";
}

function resolveStateRootDir(env: "development" | "production"): string {
  const override = process.env.NEXTOP_STATE_DIR?.trim();
  if (override) {
    return override;
  }

  const homeDir = homedir();
  const dirName =
    env === "development"
      ? generatedDefaults.state.developmentDirName
      : generatedDefaults.state.productionDirName;

  return join(homeDir, dirName);
}

function resolveLogsDir(stateRootDir: string): string {
  const override = process.env.NEXTOP_LOG_DIR?.trim();
  if (override) {
    return override;
  }

  return join(stateRootDir, generatedDefaults.state.logsDirName);
}
function resolveRunDir(stateRootDir: string): string {
  const override = process.env.NEXTOPD_RUN_DIR?.trim();
  if (override) {
    return override;
  }

  return join(stateRootDir, generatedDefaults.state.runDirName);
}

function resolveDBPath(stateRootDir: string): string {
  const override = process.env.NEXTOPD_DB_PATH?.trim();
  if (override) {
    return override;
  }

  return join(stateRootDir, generatedDefaults.state.dbFileName);
}

function resolveDaemonLogPath(logsDir: string): string {
  const override = process.env.NEXTOPD_LOG_PATH?.trim();
  if (override) {
    return override;
  }

  return join(logsDir, generatedDefaults.state.daemonLogFileName);
}

function resolveDesktopLogPath(logsDir: string): string {
  const override = process.env.NEXTOP_DESKTOP_LOG_PATH?.trim();
  if (override) {
    return override;
  }

  return join(logsDir, generatedDefaults.state.desktopLogFileName);
}

function resolvePIDPath(runDir: string): string {
  const override = process.env.NEXTOPD_PID_PATH?.trim();
  if (override) {
    return override;
  }

  return join(runDir, generatedDefaults.state.pidFileName);
}

function resolveListenerInfoPath(runDir: string): string {
  const override = process.env.NEXTOPD_LISTENER_INFO_PATH?.trim();
  if (override) {
    return override;
  }

  return join(runDir, generatedDefaults.state.listenerInfoFileName);
}

function resolveTCPAddr(): string {
  return (
    process.env.NEXTOPD_ADDR?.trim() ||
    generatedDefaults.transport.defaultTCPAddr
  );
}
