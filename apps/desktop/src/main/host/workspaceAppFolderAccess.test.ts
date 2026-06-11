import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { resolveWorkspaceAppFolderPath } from "./workspaceAppFolderPaths.ts";

test("resolveWorkspaceAppFolderPath resolves workspace app runtime folders", () => {
  const stateRoot = "/state";

  assert.equal(
    resolveWorkspaceAppFolderPath(stateRoot, {
      appId: "automation.center",
      folderKind: "workspace",
      workspaceId: "workspace-1"
    }),
    join(stateRoot, "apps", "workspaces", "workspace-1", "automation.center")
  );
  assert.equal(
    resolveWorkspaceAppFolderPath(stateRoot, {
      appId: "automation.center",
      folderKind: "data",
      workspaceId: "workspace-1"
    }),
    join(
      stateRoot,
      "apps",
      "workspaces",
      "workspace-1",
      "automation.center",
      "data"
    )
  );
  assert.equal(
    resolveWorkspaceAppFolderPath(stateRoot, {
      appId: "automation.center",
      folderKind: "logs",
      workspaceId: "workspace-1"
    }),
    join(
      stateRoot,
      "apps",
      "workspaces",
      "workspace-1",
      "automation.center",
      "logs"
    )
  );
  assert.equal(
    resolveWorkspaceAppFolderPath(stateRoot, {
      appId: "automation.center",
      folderKind: "runtime",
      workspaceId: "workspace-1"
    }),
    join(
      stateRoot,
      "apps",
      "workspaces",
      "workspace-1",
      "automation.center",
      "runtime"
    )
  );
});

test("resolveWorkspaceAppFolderPath resolves package folders by version", () => {
  assert.equal(
    resolveWorkspaceAppFolderPath("/state", {
      appId: "automation.center",
      folderKind: "package",
      version: "0.1.0",
      workspaceId: "workspace-1"
    }),
    join("/state", "apps", "packages", "automation.center", "0.1.0")
  );
});

test("resolveWorkspaceAppFolderPath requires package version", () => {
  assert.throws(
    () =>
      resolveWorkspaceAppFolderPath("/state", {
        appId: "automation.center",
        folderKind: "package",
        workspaceId: "workspace-1"
      }),
    /package version is required/u
  );
});
