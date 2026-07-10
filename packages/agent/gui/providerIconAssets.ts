import claudeCodeFlatFilledIconUrl from "./app/renderer/assets/icons/agents/claudecode-flat-filled.svg";
import codexFlatFilledIconUrl from "./app/renderer/assets/icons/agents/codex-flat-filled.svg";
import cursorFlatFilledIconUrl from "./app/renderer/assets/icons/agents/cursor-flat-filled.svg";
import opencodeFlatFilledIconUrl from "./app/renderer/assets/icons/agents/opencode-flat-filled.svg";
import tuttiFlatFilledIconUrl from "./app/renderer/assets/icons/agents/tutti-flat-filled.svg";
import {
  claudeRoundedUrl,
  codexRoundedUrl,
  cursorColorfulUrl,
  cursorRoundedUrl,
  hermesRoundedUrl,
  manageAgentClaudeCodeUrl,
  manageAgentCodexUrl,
  manageAgentCursorUrl,
  manageAgentHermesUrl,
  manageAgentOpenCodeUrl,
  manageAgentOpenclawUrl,
  manageAgentTuttiUrl,
  opencodeRoundedUrl,
  openclawRoundedUrl,
  providerRailClaudeCodeColorfulUrl,
  providerRailCodexColorfulUrl,
  providerRailHermesColorfulUrl,
  providerRailOpenCodeColorfulUrl,
  providerRailTuttiUrl,
  tuttiAgentRoundedUrl,
  tuttiDocRoundedUrl
} from "./managedAgentIconAssets.ts";

export type ProviderIconAssetVariant =
  | "manage"
  | "providerRail"
  | "rounded"
  | "sessionColorful"
  | "sessionFlat"
  | "dock";

export type ProviderIconAssetSet = Partial<
  Record<ProviderIconAssetVariant, string>
>;

/** Provider descriptors reference these assets only through Identity.IconKey. */
export const PROVIDER_ICON_ASSETS_BY_ICON_KEY: Readonly<
  Record<string, ProviderIconAssetSet>
> = {
  "claude-code": {
    manage: manageAgentClaudeCodeUrl,
    providerRail: providerRailClaudeCodeColorfulUrl,
    rounded: claudeRoundedUrl,
    sessionColorful: claudeRoundedUrl,
    sessionFlat: claudeCodeFlatFilledIconUrl,
    dock: claudeRoundedUrl
  },
  codex: {
    manage: manageAgentCodexUrl,
    providerRail: providerRailCodexColorfulUrl,
    rounded: codexRoundedUrl,
    sessionColorful: codexRoundedUrl,
    sessionFlat: codexFlatFilledIconUrl,
    dock: codexRoundedUrl
  },
  cursor: {
    manage: manageAgentCursorUrl,
    providerRail: cursorColorfulUrl,
    rounded: cursorColorfulUrl,
    sessionColorful: cursorColorfulUrl,
    sessionFlat: cursorFlatFilledIconUrl,
    dock: cursorRoundedUrl
  },
  hermes: {
    manage: manageAgentHermesUrl,
    providerRail: providerRailHermesColorfulUrl,
    rounded: hermesRoundedUrl,
    dock: hermesRoundedUrl
  },
  openclaw: {
    manage: manageAgentOpenclawUrl,
    rounded: openclawRoundedUrl,
    dock: openclawRoundedUrl
  },
  opencode: {
    manage: manageAgentOpenCodeUrl,
    providerRail: providerRailOpenCodeColorfulUrl,
    rounded: opencodeRoundedUrl,
    sessionColorful: opencodeRoundedUrl,
    sessionFlat: opencodeFlatFilledIconUrl,
    dock: opencodeRoundedUrl
  },
  tutti: {
    manage: manageAgentTuttiUrl,
    providerRail: providerRailTuttiUrl,
    rounded: tuttiDocRoundedUrl,
    sessionColorful: manageAgentTuttiUrl,
    sessionFlat: tuttiFlatFilledIconUrl,
    dock: tuttiAgentRoundedUrl
  }
};

export function resolveProviderIconAsset(
  iconKey: string | null | undefined,
  variant: ProviderIconAssetVariant
): string | null {
  const normalizedIconKey = iconKey?.trim().toLowerCase() ?? "";
  return PROVIDER_ICON_ASSETS_BY_ICON_KEY[normalizedIconKey]?.[variant] ?? null;
}

export {
  claudeCodeFlatFilledIconUrl,
  codexFlatFilledIconUrl,
  cursorFlatFilledIconUrl,
  opencodeFlatFilledIconUrl,
  tuttiFlatFilledIconUrl
};
