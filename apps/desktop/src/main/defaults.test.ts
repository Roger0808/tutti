import assert from "node:assert/strict";
import test from "node:test";
import {
  initializeDesktopEnvironment,
  resolveDesktopDefaultsFromEnv,
  resolveNextopEnv
} from "./defaults.ts";

test("resolveDesktopDefaultsFromEnv uses generated development defaults", () => {
  const previousEnv = { ...process.env };
  const homeDir = "/tmp/nextop-desktop-home";

  try {
    process.env.HOME = homeDir;
    process.env.NEXTOP_ENV = "development";
    delete process.env.NEXTOP_STATE_DIR;
    delete process.env.NEXTOP_LOG_DIR;
    delete process.env.NEXTOPD_RUN_DIR;
    delete process.env.NEXTOPD_LOG_PATH;
    delete process.env.NEXTOP_DESKTOP_LOG_PATH;
    delete process.env.NEXTOPD_LISTENER_INFO_PATH;
    delete process.env.NEXTOPD_ADDR;

    const got = resolveDesktopDefaultsFromEnv();

    assert.equal(got.runtime.env, "development");
    assert.equal(got.state.rootDir, `${homeDir}/.nextop-dev`);
    assert.equal(got.state.logsDir, `${homeDir}/.nextop-dev/logs`);
    assert.equal(got.state.runDir, `${homeDir}/.nextop-dev/run`);
    assert.equal(got.state.nextopdDBPath, `${homeDir}/.nextop-dev/nextopd.db`);
    assert.equal(
      got.state.nextopdListenerInfoPath,
      `${homeDir}/.nextop-dev/run/nextopd.listener.json`
    );
    assert.equal(
      got.state.nextopdLogPath,
      `${homeDir}/.nextop-dev/logs/nextopd.log`
    );
    assert.equal(
      got.state.desktopLogPath,
      `${homeDir}/.nextop-dev/logs/nextop-desktop.log`
    );
    assert.equal(
      got.state.nextopdPIDPath,
      `${homeDir}/.nextop-dev/run/nextopd.pid`
    );
    assert.equal(got.transport.tcpAddr, "127.0.0.1:4545");
    assert.equal(got.logging.defaultLevel, "info");
    assert.equal(got.logging.defaultOutput, "file");
    assert.equal(got.logging.maxSizeMB, 50);
    assert.equal(got.logging.maxBackups, 10);
    assert.equal(got.logging.maxAgeDays, 14);
    assert.equal(got.logging.maxTotalMB, 300);
  } finally {
    restoreEnv(previousEnv);
  }
});

test("resolveDesktopDefaultsFromEnv honors endpoint and log overrides", () => {
  const previousEnv = { ...process.env };

  try {
    process.env.NEXTOP_ENV = "production";
    process.env.NEXTOP_LOG_DIR = "/tmp/nextop-logs";
    process.env.NEXTOPD_ADDR = "127.0.0.1:9999";
    process.env.NEXTOPD_LISTENER_INFO_PATH = "/tmp/nextopd.listener.json";

    const got = resolveDesktopDefaultsFromEnv();

    assert.equal(got.transport.tcpAddr, "127.0.0.1:9999");
    assert.equal(
      got.state.nextopdListenerInfoPath,
      "/tmp/nextopd.listener.json"
    );
    assert.equal(got.state.logsDir, "/tmp/nextop-logs");
    assert.equal(got.state.nextopdLogPath, "/tmp/nextop-logs/nextopd.log");
    assert.equal(
      got.state.desktopLogPath,
      "/tmp/nextop-logs/nextop-desktop.log"
    );
  } finally {
    restoreEnv(previousEnv);
  }
});

test("initializeDesktopEnvironment sets development and production defaults when unset", () => {
  const previousEnv = { ...process.env };

  try {
    delete process.env.NEXTOP_ENV;
    initializeDesktopEnvironment({ isPackaged: false });
    assert.equal(resolveNextopEnv(), "development");

    delete process.env.NEXTOP_ENV;
    initializeDesktopEnvironment({ isPackaged: true });
    assert.equal(resolveNextopEnv(), "production");
  } finally {
    restoreEnv(previousEnv);
  }
});

test("initializeDesktopEnvironment sets shared app version when unset", () => {
  const previousEnv = { ...process.env };

  try {
    delete process.env.NEXTOP_APP_VERSION;

    initializeDesktopEnvironment({
      appVersion: "1.2.3",
      isPackaged: false
    });

    assert.equal(process.env.NEXTOP_APP_VERSION, "1.2.3");
  } finally {
    restoreEnv(previousEnv);
  }
});

test("initializeDesktopEnvironment preserves shared app version override", () => {
  const previousEnv = { ...process.env };

  try {
    process.env.NEXTOP_APP_VERSION = "9.9.9";

    initializeDesktopEnvironment({
      appVersion: "1.2.3",
      isPackaged: false
    });

    assert.equal(process.env.NEXTOP_APP_VERSION, "9.9.9");
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
