import assert from "node:assert/strict";
import test from "node:test";
import { resolveDesktopUserShellCommandInvocation } from "./desktopUserShellCommandRunner.ts";

test("desktop user shell command invocation uses interactive login shell for zsh", () => {
  assert.deepEqual(
    resolveDesktopUserShellCommandInvocation("npm install -g tool", {
      platform: "darwin",
      shell: "/bin/zsh"
    }),
    {
      args: ["-lic", "npm install -g tool"],
      kind: "posix",
      shell: "/bin/zsh",
      shellMode: "interactive-login"
    }
  );
});

test("desktop user shell command invocation uses interactive login shell for bash", () => {
  assert.deepEqual(
    resolveDesktopUserShellCommandInvocation("npm install -g tool", {
      platform: "linux",
      shell: "/usr/bin/bash"
    }),
    {
      args: ["-lic", "npm install -g tool"],
      kind: "posix",
      shell: "/usr/bin/bash",
      shellMode: "interactive-login"
    }
  );
});

test("desktop user shell command invocation supports fish login interactive flags", () => {
  assert.deepEqual(
    resolveDesktopUserShellCommandInvocation("npm install -g tool", {
      platform: "darwin",
      shell: "/opt/homebrew/bin/fish"
    }),
    {
      args: ["-l", "-i", "-c", "npm install -g tool"],
      kind: "posix",
      shell: "/opt/homebrew/bin/fish",
      shellMode: "interactive-login"
    }
  );
});

test("desktop user shell command invocation falls back to login shell for other posix shells", () => {
  assert.deepEqual(
    resolveDesktopUserShellCommandInvocation("npm install -g tool", {
      platform: "linux",
      shell: "/bin/sh"
    }),
    {
      args: ["-lc", "npm install -g tool"],
      kind: "posix",
      shell: "/bin/sh",
      shellMode: "login"
    }
  );
});

test("desktop user shell command invocation delegates to system shell on Windows", () => {
  assert.deepEqual(
    resolveDesktopUserShellCommandInvocation("npm install -g tool", {
      platform: "win32",
      shell: "cmd.exe"
    }),
    {
      kind: "windows",
      shell: "cmd.exe",
      shellMode: "system"
    }
  );
});
