import assert from "node:assert/strict";
import test from "node:test";
import { format } from "prettier";

import { renderGoDefaults, renderTSDefaults } from "./generate-defaults.mjs";
import prettierConfig from "../../packages/configs/prettier/base.mjs";

test("renderTSDefaults produces prettier-stable TypeScript output", async () => {
  const rendered = await renderTSDefaults({
    state: {
      productionDirName: ".nextop",
      developmentDirName: ".nextop-dev"
    },
    transport: {
      defaultTCPAddr: "127.0.0.1:4545"
    },
    logging: {
      defaultLevel: "info",
      maxSizeMB: 50
    }
  });

  const reformatted = await format(rendered, {
    ...prettierConfig,
    parser: "typescript"
  });

  assert.equal(rendered, reformatted);
  assert.match(rendered, /state: {/);
  assert.doesNotMatch(rendered, /"state": {/);
});

test("renderGoDefaults produces gofmt-stable Go output", () => {
  const rendered = renderGoDefaults({
    state: {
      productionDirName: ".nextop",
      developmentDirName: ".nextop-dev",
      runDirName: "run",
      logsDirName: "logs",
      dbFileName: "nextopd.db",
      daemonLogFileName: "nextopd.log",
      desktopLogFileName: "nextop-desktop.log",
      listenerInfoFileName: "nextopd.listener.json",
      pidFileName: "nextopd.pid"
    },
    transport: {
      defaultTCPAddr: "127.0.0.1:4545"
    },
    logging: {
      defaultLevel: "info",
      defaultOutput: "file",
      maxSizeMB: 50,
      maxBackups: 10,
      maxAgeDays: 14,
      maxTotalMB: 300
    },
    analytics: {
      appId: 20004092,
      appKey: "app-key",
      channel: "sg",
      channelDomain: "https://gator.uba.ap-southeast-1.volces.com",
      appVersion: "0.0.0"
    }
  });

  assert.match(rendered, /\t\tProductionDirName:\s{4}".nextop",/);
  assert.match(rendered, /var generatedDefaults = generatedDefaultsSpec{/);
});

test("renderGoDefaults includes analytics defaults", () => {
  const rendered = renderGoDefaults({
    state: {
      productionDirName: ".nextop",
      developmentDirName: ".nextop-dev",
      runDirName: "run",
      logsDirName: "logs",
      dbFileName: "nextopd.db",
      daemonLogFileName: "nextopd.log",
      desktopLogFileName: "nextop-desktop.log",
      listenerInfoFileName: "nextopd.listener.json",
      pidFileName: "nextopd.pid"
    },
    transport: {
      defaultTCPAddr: "127.0.0.1:4545"
    },
    logging: {
      defaultLevel: "info",
      defaultOutput: "file",
      maxSizeMB: 50,
      maxBackups: 10,
      maxAgeDays: 14,
      maxTotalMB: 300
    },
    analytics: {
      appId: 20004092,
      appKey: "app-key",
      channel: "sg",
      channelDomain: "https://gator.uba.ap-southeast-1.volces.com",
      appVersion: "0.0.0"
    }
  });

  assert.match(rendered, /Analytics: generatedAnalyticsDefaults{/);
  assert.match(rendered, /AppID:\s+20004092,/);
  assert.match(rendered, /AppVersion:\s+"0.0.0",/);
});
