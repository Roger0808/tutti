import assert from "node:assert/strict";
import test from "node:test";
import { nextopWorkbenchSnapshotFixture } from "./fixtures.ts";
import { migrateWorkbenchSnapshot } from "./index.ts";

test("migrates current snapshots through normalization", () => {
  const migrated = migrateWorkbenchSnapshot(nextopWorkbenchSnapshotFixture);
  assert.equal(migrated.schemaVersion, 1);
  assert.equal(migrated.nodes[0]?.displayMode, "floating");
});

test("rejects unknown snapshot versions", () => {
  assert.throws(
    () => migrateWorkbenchSnapshot({ schemaVersion: 999, nodes: [] }),
    /unsupported/
  );
});
