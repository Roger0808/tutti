import { readFile, rm } from "node:fs/promises";
import { accessSync, constants, existsSync, statSync } from "node:fs";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import type {
  HealthStatusResponse,
  NextopdClient
} from "@tutti-os/client-nextopd-ts";
import { resolveNextopEnv } from "../defaults.ts";
import {
  desktopErrorCodes,
  formatErrorMessage
} from "../../shared/errors/desktopErrors.ts";
import { getDesktopLogger, getDesktopLogSessionID } from "../logging.ts";
import {
  resolveDesktopLogsDir,
  type DesktopDaemonEndpoint
} from "../transport/paths.ts";
import { resolveUserShellEnv } from "./userShellEnv.ts";

const healthPollIntervalMs = 250;
const healthTimeoutMs = 90_000;
const shutdownTimeoutMs = 90_000;
const staleProcessShutdownTimeoutMs = 3_000;

const require = createRequire(import.meta.url);

export interface NextopdManager {
  getHealth(): Promise<HealthStatusResponse>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

interface LaunchSpec {
  command: string;
  args: string[];
  cwd?: string;
}

interface DesktopElectronAppRuntime {
  isPackaged: boolean;
  resourcesPath: string;
}

interface ResolveLaunchSpecOptions {
  repoRoot?: string;
}

export function createNextopdManager(
  endpoint: DesktopDaemonEndpoint,
  nextopdClient: NextopdClient
): NextopdManager {
  return new ManagedNextopd(endpoint, nextopdClient);
}

class ManagedNextopd implements NextopdManager {
  private process: ChildProcess | null = null;
  private stopRequested = false;
  private readonly endpoint: DesktopDaemonEndpoint;
  private readonly nextopdClient: NextopdClient;

  constructor(endpoint: DesktopDaemonEndpoint, nextopdClient: NextopdClient) {
    this.endpoint = endpoint;
    this.nextopdClient = nextopdClient;
  }

  getHealth(): Promise<HealthStatusResponse> {
    return this.nextopdClient.getHealth();
  }

  async start(): Promise<void> {
    if (this.process) {
      return;
    }

    this.endpoint.boundAddr = null;
    await stopStaleNextopd(this.endpoint.pidPath);
    await clearListenerInfo(this.endpoint.listenerInfoPath);

    const launchSpec = resolveLaunchSpec();
    const logOutput = resolveDaemonLogOutput();
    const forwardStdout = shouldForwardDaemonStdout(logOutput);
    const logger = getDesktopLogger();
    const userShellEnv = await resolveManagedDaemonUserShellEnv();
    logger.info("starting managed nextopd", {
      command: launchSpec.command,
      args: launchSpec.args,
      cwd: launchSpec.cwd ?? process.cwd(),
      listener_info_path: this.endpoint.listenerInfoPath,
      pid_path: this.endpoint.pidPath,
      log_output: logOutput
    });

    const child = spawn(launchSpec.command, launchSpec.args, {
      cwd: launchSpec.cwd,
      detached: process.platform !== "win32",
      env: resolveManagedDaemonProcessEnv({
        endpoint: this.endpoint,
        logOutput,
        userShellEnv
      }),
      stdio: ["ignore", forwardStdout ? "pipe" : "ignore", "pipe"]
    });

    this.process = child;
    this.stopRequested = false;
    logger.info("managed nextopd spawned", {
      pid: child.pid ?? null
    });

    if (forwardStdout) {
      child.stdout?.on("data", (chunk: Buffer | string) => {
        process.stdout.write(`[nextopd] ${chunk.toString()}`);
      });
    }

    child.stderr?.on("data", (chunk: Buffer | string) => {
      process.stderr.write(`[nextopd] ${chunk.toString()}`);
      getDesktopLogger().error("managed nextopd stderr", {
        chunk: chunk.toString().trim(),
        error_code: desktopErrorCodes.managedProcessStderr
      });
    });

    child.on("exit", (code, signal) => {
      const pid = child.pid ?? null;
      this.process = null;

      if (!this.stopRequested) {
        getDesktopLogger().error("managed nextopd exited unexpectedly", {
          pid,
          code,
          signal,
          error_code: desktopErrorCodes.managedProcessExited
        });
      }
    });

    try {
      this.endpoint.boundAddr = await waitForListenerInfo(
        this.endpoint.listenerInfoPath,
        () => this.isProcessAlive()
      );
      await waitUntilHealthy(this.nextopdClient, () => this.isProcessAlive());
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.stopRequested = true;
    this.endpoint.boundAddr = null;

    const child = this.process;
    if (!child) {
      await clearListenerInfo(this.endpoint.listenerInfoPath);
      return;
    }

    if (child.exitCode !== null || child.signalCode !== null) {
      this.process = null;
      await clearListenerInfo(this.endpoint.listenerInfoPath);
      return;
    }

    const exited = waitForChildExit(child, shutdownTimeoutMs, () => {
      if (child.exitCode === null && child.signalCode === null) {
        terminateProcessTree(child, "SIGKILL");
      }
    });

    terminateProcessTree(child, "SIGTERM");
    await exited;
    this.process = null;
    this.endpoint.boundAddr = null;
    await clearListenerInfo(this.endpoint.listenerInfoPath);
  }

  private isProcessAlive(): boolean {
    if (!this.process) {
      return false;
    }

    return this.process.exitCode === null && this.process.signalCode === null;
  }
}

function resolveEndpointEnv(
  endpoint: DesktopDaemonEndpoint
): Record<string, string> {
  return {
    NEXTOPD_ACCESS_TOKEN: endpoint.accessToken,
    NEXTOPD_ADDR: endpoint.requestedAddr
  };
}

export interface ManagedDaemonProcessEnvInput {
  endpoint: DesktopDaemonEndpoint;
  logDir?: string;
  logOutput: string;
  parentPID?: number;
  sessionID?: string;
  userShellEnv?: Record<string, string>;
}

export function resolveManagedDaemonProcessEnv(
  input: ManagedDaemonProcessEnvInput
): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ...(input.userShellEnv ?? {}),
    ...resolveEndpointEnv(input.endpoint),
    NEXTOP_APP_VERSION: process.env.NEXTOP_APP_VERSION?.trim() ?? "",
    NEXTOP_DESKTOP_PARENT_PID: String(input.parentPID ?? process.pid),
    NEXTOP_LOG_DIR: input.logDir ?? resolveDesktopLogsDir(),
    NEXTOP_SESSION_ID: input.sessionID ?? getDesktopLogSessionID(),
    NEXTOPD_LOG_OUTPUT: input.logOutput,
    NEXTOP_ENV: resolveNextopEnv()
  };
}

async function resolveManagedDaemonUserShellEnv(): Promise<
  Record<string, string>
> {
  const logger = getDesktopLogger();
  try {
    const env = await resolveUserShellEnv();
    const keys = Object.keys(env);
    if (keys.length > 0) {
      logger.info("resolved user shell env for managed nextopd", {
        keys: keys.sort(),
        pathResolved: typeof env.PATH === "string" && env.PATH.trim() !== ""
      });
    }
    return env;
  } catch (error) {
    logger.warn("failed to resolve user shell env for managed nextopd", {
      error: formatErrorMessage(error)
    });
    return {};
  }
}

export function resolveLaunchSpec(
  runtime?: DesktopElectronAppRuntime,
  options: ResolveLaunchSpecOptions = {}
): LaunchSpec {
  const binaryOverride = process.env.NEXTOPD_BIN?.trim();
  if (binaryOverride) {
    return {
      command: binaryOverride,
      args: []
    };
  }

  const appRuntime = runtime ?? resolveElectronAppRuntime();
  if (appRuntime.isPackaged) {
    const binaryName = process.platform === "win32" ? "nextopd.exe" : "nextopd";

    return {
      command: join(appRuntime.resourcesPath, "bin", binaryName),
      args: []
    };
  }

  const repoRoot = options.repoRoot ?? resolveRepoRoot();
  const devBinaryPath = resolve(
    repoRoot,
    "apps/desktop/build/nextopd",
    process.platform === "win32" ? "nextopd.exe" : "nextopd"
  );
  if (
    isExecutable(devBinaryPath) &&
    isFreshDevelopmentNextopdBinary(devBinaryPath, repoRoot)
  ) {
    return {
      command: devBinaryPath,
      args: []
    };
  }

  return {
    command: "go",
    args: ["run", "."],
    cwd: resolve(repoRoot, "services/nextopd")
  };
}

function isFreshDevelopmentNextopdBinary(
  binaryPath: string,
  repoRoot: string
): boolean {
  const sourceSentinelPaths = [
    resolve(repoRoot, "services/nextopd/api/events/generated/protocol.gen.go")
  ];

  let binaryModifiedAt: number;
  try {
    binaryModifiedAt = statSync(binaryPath).mtimeMs;
  } catch {
    return false;
  }

  return sourceSentinelPaths.every((sourcePath) => {
    if (!existsSync(sourcePath)) {
      return true;
    }

    return statSync(sourcePath).mtimeMs <= binaryModifiedAt;
  });
}

function resolveElectronAppRuntime(): DesktopElectronAppRuntime {
  const electron = require("electron") as {
    app: { isPackaged: boolean };
  };
  return {
    isPackaged: electron.app.isPackaged,
    resourcesPath: process.resourcesPath
  };
}

function isExecutable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveDaemonLogOutput(): string {
  const override = process.env.NEXTOPD_LOG_OUTPUT?.trim().toLowerCase();
  if (override === "stdout" || override === "tee" || override === "file") {
    return override;
  }

  return "file";
}

function shouldForwardDaemonStdout(logOutput: string): boolean {
  if (process.env.NEXTOPD_FORWARD_STDIO?.trim() === "1") {
    return true;
  }

  return logOutput === "stdout" || logOutput === "tee";
}

function resolveRepoRoot(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  let candidate = currentDir;
  for (;;) {
    if (
      existsSync(join(candidate, "pnpm-workspace.yaml")) &&
      existsSync(join(candidate, "services/nextopd"))
    ) {
      return candidate;
    }

    const parent = dirname(candidate);
    if (parent === candidate) {
      return resolve(currentDir, "../../../../");
    }
    candidate = parent;
  }
}

async function waitUntilHealthy(
  nextopdClient: NextopdClient,
  isAlive?: () => boolean
): Promise<void> {
  const deadline = Date.now() + healthTimeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    if (isAlive && !isAlive()) {
      throw new Error("nextopd exited before it became healthy.");
    }

    try {
      await nextopdClient.getHealth();
      return;
    } catch (error) {
      lastError = error;
      await sleep(healthPollIntervalMs);
    }
  }

  throw new Error(
    `Timed out waiting for nextopd health: ${formatError(lastError)}`
  );
}

async function waitForListenerInfo(
  listenerInfoPath: string,
  isAlive?: () => boolean
): Promise<string> {
  const deadline = Date.now() + healthTimeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    if (isAlive && !isAlive()) {
      throw new Error("nextopd exited before it published its listener info.");
    }

    try {
      return await readListenerInfo(listenerInfoPath);
    } catch (error) {
      lastError = error;
      await sleep(healthPollIntervalMs);
    }
  }

  throw new Error(
    `Timed out waiting for nextopd listener info: ${formatError(lastError)}`
  );
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("ENOENT")) {
      return "daemon runtime information is not available yet";
    }
    if (error.message.includes("ECONNREFUSED")) {
      return "daemon refused the desktop connection";
    }
    if (error.message.includes("timed out")) {
      return "daemon did not become healthy before the timeout";
    }
    return error.message;
  }

  return "unknown error";
}

async function readListenerInfo(listenerInfoPath: string): Promise<string> {
  const content = await readFile(listenerInfoPath, "utf8");
  const parsed = JSON.parse(content) as { addr?: unknown };

  if (typeof parsed.addr !== "string" || parsed.addr.trim() === "") {
    throw new Error("listener info file does not contain a valid addr field");
  }

  return parsed.addr.trim();
}

async function clearListenerInfo(listenerInfoPath: string): Promise<void> {
  await rm(listenerInfoPath, { force: true });
  await rm(`${listenerInfoPath}.tmp`, { force: true });
}

async function stopStaleNextopd(pidPath: string): Promise<void> {
  let rawPID: string;
  try {
    rawPID = await readFile(pidPath, "utf8");
  } catch {
    return;
  }

  const pid = Number.parseInt(rawPID.trim(), 10);
  if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) {
    await rm(pidPath, { force: true });
    return;
  }

  if (!isProcessRunning(pid)) {
    await rm(pidPath, { force: true });
    return;
  }

  const command = readProcessCommand(pid);
  if (!isLikelyNextopdProcess(command)) {
    getDesktopLogger().warn(
      "ignoring stale nextopd pid for unrelated process",
      {
        pid,
        pid_path: pidPath,
        command
      }
    );
    await rm(pidPath, { force: true });
    return;
  }

  getDesktopLogger().warn("stopping stale nextopd process", {
    pid,
    pid_path: pidPath,
    command
  });

  signalProcess(pid, "SIGTERM");
  await waitForProcessExit(pid, staleProcessShutdownTimeoutMs);
  if (
    isProcessRunning(pid) &&
    isLikelyNextopdProcess(readProcessCommand(pid))
  ) {
    getDesktopLogger().warn("force stopping stale nextopd process", {
      pid,
      pid_path: pidPath
    });
    signalProcess(pid, "SIGKILL");
    await waitForProcessExit(pid, staleProcessShutdownTimeoutMs);
  }

  if (!isProcessRunning(pid)) {
    await rm(pidPath, { force: true });
  }
}

export function isLikelyNextopdProcess(command: string): boolean {
  const normalized = command.trim().toLowerCase();
  if (normalized === "") {
    return false;
  }

  return normalized
    .split(/\s+/)
    .some((part) => part.split("/").pop() === "nextopd");
}

function readProcessCommand(pid: number): string {
  const result = spawnSync(
    "ps",
    ["-p", String(pid), "-o", "comm=", "-o", "args="],
    {
      encoding: "utf8"
    }
  );
  if (result.status !== 0) {
    return "";
  }

  return result.stdout.trim();
}

function terminateProcessTree(
  child: ChildProcess,
  signal: NodeJS.Signals
): void {
  if (!child.pid) {
    return;
  }

  if (process.platform !== "win32") {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
      // Fall back to the direct child when the process group is already gone.
    }
  }

  child.kill(signal);
}

function waitForChildExit(
  child: ChildProcess,
  timeoutMs: number,
  onTimeout: () => void
): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolvePromise) => {
    const timeout = setTimeout(() => {
      child.off("exit", onExit);
      onTimeout();
      resolvePromise();
    }, timeoutMs);

    function onExit(): void {
      clearTimeout(timeout);
      resolvePromise();
    }

    child.once("exit", onExit);
  });
}

async function waitForProcessExit(
  pid: number,
  timeoutMs: number
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isProcessRunning(pid)) {
      return;
    }
    await sleep(100);
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function signalProcess(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(pid, signal);
  } catch {
    // Process already exited.
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}
