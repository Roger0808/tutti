import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");

test("ui storyboard surfaces the promoted shared primitives in navigation", () => {
  for (const pattern of [
    '"spinner"',
    '"checkbox"',
    '"switch"',
    '"tooltip"',
    '"popover"',
    '"drawer"',
    '"textarea"',
    '"shortcut-badge"',
    '"underline-tabs"',
    '"status-dot"',
    '"menu-surface"',
    '"viewport-menu-surface"'
  ]) {
    assert.match(
      appSource,
      new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      `missing storyboard navigation pattern ${pattern}`
    );
  }
});

test("ui storyboard renders dedicated docs sections for the promoted shared primitives", () => {
  for (const componentName of [
    "Spinner",
    "Checkbox",
    "Switch",
    "Tooltip",
    "Popover",
    "Drawer",
    "Textarea",
    "ShortcutBadge",
    "UnderlineTabs",
    "StatusDot",
    "MenuSurface",
    "ViewportMenuSurface"
  ]) {
    assert.match(
      appSource,
      new RegExp(`function ${componentName}Storyboard\\(`, "g"),
      `missing storyboard docs section for ${componentName}`
    );
  }
});

test("ui storyboard does not surface retired workbench business components", () => {
  for (const retiredPattern of [
    '"agent-gui-workbench"',
    '"workspace-file-manager-panel"',
    "function AgentGUIWorkbenchStoryboard(",
    "function WorkspaceFileManagerPanelStoryboard("
  ]) {
    assert.doesNotMatch(
      appSource,
      new RegExp(retiredPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      `retired storyboard surface still present for ${retiredPattern}`
    );
  }
});
