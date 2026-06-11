import assert from "node:assert/strict";
import test from "node:test";
import {
  applyDesktopWindowIntent,
  createWorkspaceWindowIntent,
  encodeDesktopWindowIntent
} from "./windowIntent.ts";

test("encodeDesktopWindowIntent includes locale and theme bootstrap parameters", () => {
  const search = encodeDesktopWindowIntent(
    createWorkspaceWindowIntent("workspace-1"),
    {
      dockPlacement: "left",
      locale: "zh-CN",
      themeAppearance: "dark",
      themeSource: "dark"
    }
  );

  const params = new URLSearchParams(search);
  assert.equal(params.get("view"), "workspace");
  assert.equal(params.get("workspaceId"), "workspace-1");
  assert.equal(params.get("lang"), "zh-CN");
  assert.equal(params.get("dockPlacement"), "left");
  assert.equal(params.get("themeSource"), "dark");
  assert.equal(params.get("theme"), "dark");
});

test("applyDesktopWindowIntent preserves theme bootstrap parameters in development URLs", () => {
  const url = applyDesktopWindowIntent(
    "http://localhost:5173/",
    createWorkspaceWindowIntent("workspace-1"),
    {
      locale: "en",
      themeAppearance: "light",
      themeSource: "system"
    }
  );

  assert.equal(
    url,
    "http://localhost:5173/?lang=en&themeSource=system&theme=light&view=workspace&workspaceId=workspace-1"
  );
});

test("readInitialDockPlacementFromLocation resolves dock placement from search params", async () => {
  const { readInitialDockPlacementFromLocation } =
    await import("../preferences/index.ts");

  assert.equal(
    readInitialDockPlacementFromLocation("?dockPlacement=left"),
    "left"
  );
  assert.equal(
    readInitialDockPlacementFromLocation("?dockPlacement=invalid"),
    "bottom"
  );
  assert.equal(readInitialDockPlacementFromLocation(""), "bottom");
});
