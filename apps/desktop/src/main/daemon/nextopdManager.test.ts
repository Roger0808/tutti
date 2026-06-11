import assert from "node:assert/strict";
import {
  access,
  chmod,
  mkdir,
  mkdtemp,
  utimes,
  writeFile
} from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  isLikelyNextopdProcess,
  resolveLaunchSpec,
  resolveManagedDaemonProcessEnv
} from "./nextopdManager.ts";

const repoRoot = resolve(
  fileURLToPath(new URL("../../../../..", import.meta.url))
);

test("resolveLaunchSpec prefers the development nextopd binary when present", async (t) => {
  const previousEnv = { ...process.env };
  const binaryName = process.platform === "win32" ? "nextopd.exe" : "nextopd";
  const binaryPath = join(repoRoot, "apps/desktop/build/nextopd", binaryName);

  try {
    delete process.env.NEXTOPD_BIN;
    if (!(await fileIsExecutable(binaryPath))) {
      t.skip("development nextopd binary is not built");
      return;
    }

    const got = resolveLaunchSpec({
      isPackaged: false,
      resourcesPath: join(tmpdir(), "nextop-resources")
    });

    assert.equal(got.command, binaryPath);
    assert.deepEqual(got.args, []);
  } finally {
    restoreEnv(previousEnv);
  }
});

test("resolveLaunchSpec falls back to go run when no development binary exists", async (t) => {
  const previousEnv = { ...process.env };
  const binaryName = process.platform === "win32" ? "nextopd.exe" : "nextopd";
  const binaryPath = join(repoRoot, "apps/desktop/build/nextopd", binaryName);

  try {
    delete process.env.NEXTOPD_BIN;
    if (await fileIsExecutable(binaryPath)) {
      t.skip("development nextopd binary is built");
      return;
    }

    const got = resolveLaunchSpec({
      isPackaged: false,
      resourcesPath: join(tmpdir(), "nextop-resources")
    });

    assert.equal(got.command, "go");
    assert.deepEqual(got.args, ["run", "."]);
    assert.equal(got.cwd, join(repoRoot, "services/nextopd"));
  } finally {
    restoreEnv(previousEnv);
  }
});

test("resolveLaunchSpec ignores a stale development binary when nextopd sources changed", async () => {
  const previousEnv = { ...process.env };
  const tempRepoRoot = await mkdtemp(join(tmpdir(), "nextopd-launch-"));
  const binaryName = process.platform === "win32" ? "nextopd.exe" : "nextopd";
  const binaryPath = join(
    tempRepoRoot,
    "apps/desktop/build/nextopd",
    binaryName
  );
  const sourcePath = join(
    tempRepoRoot,
    "services/nextopd/api/events/generated/protocol.gen.go"
  );

  try {
    delete process.env.NEXTOPD_BIN;
    await mkdir(dirname(binaryPath), { recursive: true });
    await mkdir(dirname(sourcePath), { recursive: true });
    await writeFile(binaryPath, "#!/bin/sh\n");
    await chmod(binaryPath, 0o755);
    await writeFile(sourcePath, "package generated\n");
    await utimes(binaryPath, new Date("2026-01-01"), new Date("2026-01-01"));
    await utimes(sourcePath, new Date("2026-01-02"), new Date("2026-01-02"));

    const got = resolveLaunchSpec(
      {
        isPackaged: false,
        resourcesPath: join(tmpdir(), "nextop-resources")
      },
      { repoRoot: tempRepoRoot }
    );

    assert.equal(got.command, "go");
    assert.deepEqual(got.args, ["run", "."]);
    assert.equal(got.cwd, join(tempRepoRoot, "services/nextopd"));
  } finally {
    restoreEnv(previousEnv);
  }
});

test("resolveLaunchSpec honors NEXTOPD_BIN override", () => {
  const previousEnv = { ...process.env };

  try {
    process.env.NEXTOPD_BIN = "/tmp/custom-nextopd";

    const got = resolveLaunchSpec({
      isPackaged: false,
      resourcesPath: join(tmpdir(), "nextop-resources")
    });

    assert.equal(got.command, "/tmp/custom-nextopd");
    assert.deepEqual(got.args, []);
  } finally {
    restoreEnv(previousEnv);
  }
});

test("isLikelyNextopdProcess only matches nextopd executables", () => {
  assert.equal(isLikelyNextopdProcess("/tmp/nextopd"), true);
  assert.equal(
    isLikelyNextopdProcess(
      join(repoRoot, "apps/desktop/build/nextopd/nextopd")
    ),
    true
  );
  assert.equal(isLikelyNextopdProcess("node nextopdManager.js"), false);
  assert.equal(isLikelyNextopdProcess("/tmp/not-nextopd"), false);
  assert.equal(isLikelyNextopdProcess(""), false);
});

test("resolveManagedDaemonProcessEnv passes the shared desktop app version", () => {
  const previousEnv = { ...process.env };

  try {
    process.env.NEXTOP_APP_VERSION = "1.2.3";

    const got = resolveManagedDaemonProcessEnv({
      endpoint: {
        accessToken: "token",
        boundAddr: null,
        listenerInfoPath: "/tmp/nextopd.listener.json",
        pidPath: "/tmp/nextopd.pid",
        requestedAddr: "127.0.0.1:4545"
      },
      logDir: "/tmp/nextop-logs",
      logOutput: "file",
      parentPID: 123,
      sessionID: "session-1",
      userShellEnv: {
        NEXTOP_APP_VERSION: "0.0.1"
      }
    });

    assert.equal(got.NEXTOP_APP_VERSION, "1.2.3");
    assert.equal(got.NEXTOP_ANALYTICS_DEBUG, undefined);
    assert.equal(got.NEXTOPD_ACCESS_TOKEN, "token");
    assert.equal(got.NEXTOPD_ADDR, "127.0.0.1:4545");
  } finally {
    restoreEnv(previousEnv);
  }
});

function restoreEnv(previousEnv: NodeJS.ProcessEnv): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in previousEnv)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = value;
  }
}

async function fileIsExecutable(path: string): Promise<boolean> {
  try {
    await access(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
