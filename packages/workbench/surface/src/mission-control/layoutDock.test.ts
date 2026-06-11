import assert from "node:assert/strict";
import test from "node:test";
import {
  shouldShowWorkbenchMissionControlLayoutHint,
  shouldShowWorkbenchMissionControlLayoutPreset
} from "./layoutDock.ts";
import type { WorkbenchLayoutPreset } from "../core/types.ts";

test("keeps the mission control layout hint until multiple windows are selected", () => {
  assert.equal(shouldShowWorkbenchMissionControlLayoutHint(0), true);
  assert.equal(shouldShowWorkbenchMissionControlLayoutHint(1), true);
  assert.equal(shouldShowWorkbenchMissionControlLayoutHint(2), false);
  assert.equal(shouldShowWorkbenchMissionControlLayoutHint(3), false);
});

test("limits mission control layout presets by selected window count", () => {
  const presets: WorkbenchLayoutPreset[] = [
    { kind: "balanced" },
    { kind: "row" },
    { kind: "column" }
  ];
  const visiblePresetKinds = (selectedCount: number) =>
    presets
      .filter((preset) =>
        shouldShowWorkbenchMissionControlLayoutPreset(selectedCount, preset)
      )
      .map((preset) => preset.kind);

  assert.deepEqual(visiblePresetKinds(2), ["row", "column"]);
  assert.deepEqual(visiblePresetKinds(3), ["balanced", "row", "column"]);
  assert.deepEqual(visiblePresetKinds(4), ["balanced"]);
  assert.deepEqual(visiblePresetKinds(5), ["balanced"]);
});
