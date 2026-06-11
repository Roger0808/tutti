import assert from "node:assert/strict";
import test from "node:test";
import { nextopWorkbenchSnapshotFixture } from "./fixtures.ts";
import { parseWorkbenchSnapshot, serializeWorkbenchSnapshot } from "./index.ts";

test("round-trips snapshots through stable JSON", () => {
  const serialized = serializeWorkbenchSnapshot(nextopWorkbenchSnapshotFixture);
  const parsed = parseWorkbenchSnapshot(serialized);

  assert.deepEqual(
    parsed,
    parseWorkbenchSnapshot(serializeWorkbenchSnapshot(parsed))
  );
});
