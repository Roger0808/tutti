import type { DesktopLocale } from "../i18n";
import type { DesktopDockPlacement } from "../preferences/index.ts";
import type {
  DesktopThemeAppearance,
  DesktopThemeSource
} from "../theme/index.ts";

export type DesktopWindowIntent =
  | {
      kind: "workspace";
      workspaceID: string;
    }
  | {
      kind: "workspace-missing";
    };

export interface DesktopWindowIntentSearchOptions {
  dockPlacement?: DesktopDockPlacement;
  locale?: DesktopLocale;
  themeAppearance?: DesktopThemeAppearance;
  themeSource?: DesktopThemeSource;
}

export function createWorkspaceWindowIntent(
  workspaceID: string
): DesktopWindowIntent {
  return {
    kind: "workspace",
    workspaceID
  };
}

export function encodeDesktopWindowIntent(
  intent: DesktopWindowIntent,
  options: DesktopWindowIntentSearchOptions = {}
): string {
  const params = new URLSearchParams();

  if (options.locale) {
    params.set("lang", options.locale);
  }
  if (options.dockPlacement) {
    params.set("dockPlacement", options.dockPlacement);
  }
  if (options.themeSource) {
    params.set("themeSource", options.themeSource);
  }
  if (options.themeAppearance) {
    params.set("theme", options.themeAppearance);
  }

  params.set("view", "workspace");
  if (intent.kind === "workspace") {
    params.set("workspaceId", intent.workspaceID);
  }

  return params.toString();
}

export function applyDesktopWindowIntent(
  baseUrl: string,
  intent: DesktopWindowIntent,
  options: DesktopWindowIntentSearchOptions = {}
): string {
  const url = new URL(baseUrl);
  url.search = encodeDesktopWindowIntent(intent, options);
  return url.toString();
}

export function resolveDesktopWindowIntent(
  search: string
): DesktopWindowIntent {
  const params = new URLSearchParams(search);
  const view = params.get("view");

  if (view !== "workspace") {
    return {
      kind: "workspace-missing"
    };
  }

  const workspaceID = params.get("workspaceId")?.trim();
  if (!workspaceID) {
    return {
      kind: "workspace-missing"
    };
  }

  return createWorkspaceWindowIntent(workspaceID);
}
