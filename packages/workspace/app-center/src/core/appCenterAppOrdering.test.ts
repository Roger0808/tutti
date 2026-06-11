import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AppCenterViewModel } from "../contracts/viewModel.ts";
import {
  sortMyAppsByCreatedDesc,
  sortRecommendedApps,
  sortRecommendedAppsForAllTab
} from "./appCenterAppOrdering.ts";

describe("sortMyAppsByCreatedDesc", () => {
  it("orders newer apps first and uses name then id as stable tie breakers", () => {
    const apps = [
      createApp({ createdAtUnixMs: 10, id: "zeta", name: "Zeta" }),
      createApp({ createdAtUnixMs: 30, id: "middle", name: "Middle" }),
      createApp({ createdAtUnixMs: 30, id: "alpha-b", name: "Alpha" }),
      createApp({ createdAtUnixMs: 30, id: "alpha-a", name: "Alpha" }),
      createApp({ createdAtUnixMs: null, id: "legacy", name: "Legacy" })
    ];

    assert.deepEqual(
      sortMyAppsByCreatedDesc(apps).map((app) => app.id),
      ["alpha-a", "alpha-b", "middle", "zeta", "legacy"]
    );
  });
});

describe("sortRecommendedApps", () => {
  it("orders recommended apps by configured category sections", () => {
    const apps = [
      createApp({ category: "内容创作", id: "media", name: "Media" }),
      createApp({ category: "工具", id: "automation", name: "Automation" }),
      createApp({ category: "办公", id: "chat", name: "Chat" }),
      createApp({
        category: "产品与设计",
        id: "design",
        name: "Design"
      })
    ];

    assert.deepEqual(
      sortRecommendedApps(apps).map((app) => app.id),
      ["design", "chat", "automation", "media"]
    );
  });

  it("places coming soon apps at the end of each category", () => {
    const apps = [
      createApp({
        category: "产品与设计",
        id: "soon-a",
        name: "Alpha coming soon",
        statusLabelKey: "status.comingSoon"
      }),
      createApp({
        category: "产品与设计",
        id: "ready-b",
        name: "Zeta ready"
      }),
      createApp({
        category: "产品与设计",
        id: "ready-a",
        name: "Alpha ready"
      }),
      createApp({
        category: "产品与设计",
        id: "soon-b",
        name: "Beta coming soon",
        tags: ["coming-soon"]
      }),
      createApp({ category: "办公", id: "office", name: "Office" })
    ];

    assert.deepEqual(
      sortRecommendedApps(apps).map((app) => app.id),
      ["ready-a", "ready-b", "soon-a", "soon-b", "office"]
    );
  });
});

describe("sortRecommendedAppsForAllTab", () => {
  it("places all coming soon apps after ready apps across categories", () => {
    const apps = [
      createApp({
        category: "产品与设计",
        id: "design-soon",
        name: "Design soon",
        tags: ["coming-soon"]
      }),
      createApp({
        category: "内容创作",
        id: "media-ready",
        name: "Media ready"
      }),
      createApp({
        category: "办公",
        id: "office-soon",
        name: "Office soon",
        statusLabelKey: "status.comingSoon"
      }),
      createApp({
        category: "工具",
        id: "tool-ready",
        name: "Tool ready"
      })
    ];

    assert.deepEqual(
      sortRecommendedAppsForAllTab(apps).map((app) => app.id),
      ["tool-ready", "media-ready", "design-soon", "office-soon"]
    );
  });
});

function createApp(
  overrides: Pick<AppCenterViewModel["apps"][number], "id" | "name"> &
    Partial<
      Pick<
        AppCenterViewModel["apps"][number],
        "category" | "createdAtUnixMs" | "statusLabelKey" | "tags"
      >
    >
): AppCenterViewModel["apps"][number] {
  return {
    availableVersion: "0.1.0",
    canDelete: true,
    canExport: true,
    canOpen: false,
    canOpenFactorySession: false,
    canOpenFolder: false,
    canOpenPackageFolder: false,
    canPublishFactoryUpdate: false,
    canReplaceIcon: false,
    canRetry: false,
    canUninstall: false,
    canUpdate: false,
    createdAtUnixMs: null,
    description: "",
    icon: {
      src: "app.png",
      type: "asset"
    },
    installed: false,
    primaryAction: "install",
    sourceKind: "local",
    status: "idle",
    statusLabelKey: "actions.installApp",
    statusPulse: false,
    statusTone: "neutral",
    tags: [],
    updateAvailable: false,
    version: "0.1.0",
    ...overrides
  };
}
