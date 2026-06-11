import assert from "node:assert/strict";
import test from "node:test";
import type {
  NextopdClient,
  WorkbenchSnapshot
} from "@tutti-os/client-nextopd-ts";
import { workbenchSnapshotSchemaVersion } from "@tutti-os/workbench-snapshot";
import {
  readWorkspaceWallpaperIdFromSnapshot,
  writeWorkspaceWallpaperIdToSnapshot
} from "../../workspaceWallpaper.ts";
import { createDesktopWorkspaceWorkbenchRepository } from "./desktopWorkspaceWorkbenchRepository.ts";

test("desktop workspace workbench repository caches loaded snapshots", async () => {
  const repository = createDesktopWorkspaceWorkbenchRepository(
    createNextopdClient({
      initialSnapshot: createSnapshot()
    })
  );
  let notificationCount = 0;
  repository.subscribe(() => {
    notificationCount += 1;
  });

  assert.equal(repository.hasLoaded("workspace-1"), false);
  const loadedSnapshot = await repository.load("workspace-1");

  assert.equal(repository.hasLoaded("workspace-1"), true);
  assert.equal(repository.readCached("workspace-1"), loadedSnapshot);
  assert.equal(notificationCount, 1);
});

test("desktop workspace workbench repository preserves wallpaper metadata on host saves", async () => {
  let savedSnapshot: WorkbenchSnapshot | null = null;
  const repository = createDesktopWorkspaceWorkbenchRepository(
    createNextopdClient({
      initialSnapshot: writeWorkspaceWallpaperIdToSnapshot(
        createSnapshot(),
        "sky"
      ),
      onSave(snapshot) {
        savedSnapshot = snapshot;
      }
    })
  );

  await repository.load("workspace-1");
  await repository.save("workspace-1", createSnapshot());

  assert.equal(readWorkspaceWallpaperIdFromSnapshot(savedSnapshot), "sky");
});

function createNextopdClient(input: {
  initialSnapshot: WorkbenchSnapshot;
  onSave?: (snapshot: WorkbenchSnapshot) => void;
}): NextopdClient {
  return {
    async getWorkspaceWorkbench() {
      return input.initialSnapshot;
    },
    async putWorkspaceWorkbench(_workspaceID, snapshot) {
      input.onSave?.(snapshot);
      return snapshot;
    }
  } as Partial<NextopdClient> as NextopdClient;
}

function createSnapshot(): WorkbenchSnapshot {
  return {
    schemaVersion: workbenchSnapshotSchemaVersion,
    nodes: [],
    nodeStack: [],
    activeNodeId: null
  };
}
