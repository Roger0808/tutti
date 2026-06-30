import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultDesktopAgentWorkMode,
  desktopAgentWorkModes,
  isDesktopAgentWorkMode,
  normalizeDesktopAgentWorkMode
} from "./core.ts";

test("desktop agent work mode defaults to coding", () => {
  assert.equal(defaultDesktopAgentWorkMode, "coding");
  assert.deepEqual(desktopAgentWorkModes, ["coding", "general"]);
});

test("desktop agent work mode normalization preserves known values", () => {
  assert.equal(normalizeDesktopAgentWorkMode("coding"), "coding");
  assert.equal(normalizeDesktopAgentWorkMode("general"), "general");
  assert.equal(isDesktopAgentWorkMode("coding"), true);
  assert.equal(isDesktopAgentWorkMode("general"), true);
});

test("desktop agent work mode normalization falls back to coding", () => {
  assert.equal(normalizeDesktopAgentWorkMode(""), "coding");
  assert.equal(normalizeDesktopAgentWorkMode("daily"), "coding");
  assert.equal(normalizeDesktopAgentWorkMode(undefined), "coding");
  assert.equal(isDesktopAgentWorkMode("daily"), false);
});
