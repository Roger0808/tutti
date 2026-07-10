import { agentColorfulUrl } from "../managedAgentIconAssets.ts";
import { migratedAgentGUIProviderIdentityCatalog } from "../providerIdentityCatalog.ts";
import {
  resolveProviderIconAsset,
  type ProviderIconAssetVariant
} from "../providerIconAssets.ts";
import { normalizeManagedAgentProvider } from "./managedAgentProviders";

/**
 * Providers not yet in providerregistry.Migrated() retain this explicit
 * compatibility mapping. Migrated providers are appended from the generated
 * identity catalog below.
 */
const legacyManagedAgentProviderIconKeys = {
  "claude-code": "claude-code",
  cursor: "cursor",
  hermes: "hermes",
  tutti: "tutti",
  openclaw: "openclaw",
  opencode: "opencode"
} as const;

/** Square avatar art for the managed toolchain agents (used by Manage Agents and Launch home Agents floor). */
export const MANAGED_AGENT_ICON_URLS: Record<string, string> =
  createProviderIconUrlMap("manage");

/** Colorful provider rail icons used by AgentGUI's left provider filter. */
export const MANAGED_AGENT_PROVIDER_RAIL_ICON_URLS: Record<string, string> =
  createProviderIconUrlMap("providerRail");

/** Rounded avatars for Room status / room activity panel only. */
export const MANAGED_AGENT_ICON_ROUNDED_URLS: Record<string, string> =
  createProviderIconUrlMap("rounded");

/** Neutral artwork for UI surfaces that require a non-null fallback. */
export const MANAGED_AGENT_ICON_FALLBACK_URL = agentColorfulUrl;

export function managedAgentRoundedIconUrl(
  provider: string | undefined
): string {
  return (
    MANAGED_AGENT_ICON_ROUNDED_URLS[normalizeManagedAgentProvider(provider)] ??
    MANAGED_AGENT_ICON_FALLBACK_URL
  );
}

function createProviderIconUrlMap(
  variant: ProviderIconAssetVariant
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [providerId, iconKey] of Object.entries(
    legacyManagedAgentProviderIconKeys
  )) {
    const iconUrl = resolveProviderIconAsset(iconKey, variant);
    if (iconUrl) {
      result[providerId] = iconUrl;
    }
  }
  for (const identity of migratedAgentGUIProviderIdentityCatalog) {
    const iconUrl = resolveProviderIconAsset(identity.iconKey, variant);
    if (iconUrl) {
      result[identity.providerId] = iconUrl;
    }
  }
  return result;
}
