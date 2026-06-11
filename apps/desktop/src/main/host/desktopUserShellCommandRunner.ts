import { spawn } from "node:child_process";
import type { DesktopLogger } from "../logging";

export interface DesktopUserShellCommandInput {
  cwd?: string | null;
  input: string;
}

export interface DesktopUserShellCommandResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

export interface DesktopUserShellCommandOptions {
  logLabel?: string;
}

export function runDesktopUserShellCommand(
  input: DesktopUserShellCommandInput,
  logger: DesktopLogger,
  options: DesktopUserShellCommandOptions = {}
): Promise<DesktopUserShellCommandResult> {
  const command = input.input.trim();
  const logLabel = options.logLabel ?? "user shell command";
  if (!command) {
    throw new Error(`${logLabel} is empty`);
  }

  const invocation = resolveDesktopUserShellCommandInvocation(command);
  logger.info(`running ${logLabel}`, {
    command,
    cwd: input.cwd ?? null,
    shell: invocation.shell,
    shellMode: invocation.shellMode
  });

  return new Promise((resolve, reject) => {
    const child =
      invocation.kind === "windows"
        ? spawn(command, {
            cwd: input.cwd ?? undefined,
            env: process.env,
            shell: true,
            windowsHide: true
          })
        : spawn(invocation.shell, invocation.args, {
            cwd: input.cwd ?? undefined,
            env: process.env,
            windowsHide: true
          });
    let stdout = "";
    let stderr = "";

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      logger.error(`${logLabel} failed to start`, {
        command,
        error: error.message
      });
      reject(error);
    });
    child.on("close", (exitCode) => {
      const result = {
        exitCode: exitCode ?? 1,
        stderr,
        stdout
      };
      if (result.exitCode !== 0) {
        logger.error(`${logLabel} failed`, {
          command,
          exitCode: result.exitCode,
          stderr: trimCommandOutput(stderr)
        });
        reject(
          new Error(
            trimCommandOutput(stderr) ||
              `${logLabel} exited with code ${result.exitCode}`
          )
        );
        return;
      }
      logger.info(`${logLabel} completed`, { command });
      resolve(result);
    });
  });
}

export type DesktopUserShellCommandInvocation =
  | {
      args: readonly string[];
      kind: "posix";
      shell: string;
      shellMode: "interactive-login" | "login";
    }
  | {
      kind: "windows";
      shell: string;
      shellMode: "system";
    };

export function resolveDesktopUserShellCommandInvocation(
  command: string,
  input: {
    platform?: NodeJS.Platform;
    shell?: string;
  } = {}
): DesktopUserShellCommandInvocation {
  const platform = input.platform ?? process.platform;
  const shell = input.shell ?? resolveDesktopUserShell(platform);
  if (platform === "win32") {
    return {
      kind: "windows",
      shell,
      shellMode: "system"
    };
  }

  const shellName = shell.split(/[\\/]/u).at(-1) ?? "";
  if (shellName === "bash" || shellName === "zsh") {
    return {
      args: ["-lic", command],
      kind: "posix",
      shell,
      shellMode: "interactive-login"
    };
  }
  if (shellName === "fish") {
    return {
      args: ["-l", "-i", "-c", command],
      kind: "posix",
      shell,
      shellMode: "interactive-login"
    };
  }
  return {
    args: ["-lc", command],
    kind: "posix",
    shell,
    shellMode: "login"
  };
}

function resolveDesktopUserShell(platform: NodeJS.Platform): string {
  if (platform === "win32") {
    return process.env.ComSpec || "cmd.exe";
  }
  return process.env.SHELL || "/bin/sh";
}

function trimCommandOutput(value: string): string {
  return value.trim().slice(0, 4000);
}
