import type { AgentGUIProvider } from "./types.ts";
import { migratedAgentGUIProviderIdentityCatalog } from "./providerIdentityCatalog.ts";
import { resolveProviderIconAsset } from "./providerIconAssets.ts";

/** Explicit fallback until these providers migrate into providerregistry. */
const legacyDockProviderIconKeys = {
  "claude-code": "claude-code",
  cursor: "cursor",
  hermes: "hermes",
  nexight: "tutti",
  openclaw: "openclaw",
  opencode: "opencode",
  "tutti-agent": "tutti"
} as const satisfies Partial<Record<AgentGUIProvider, string>>;

export const agentGuiDockIconUrls = createDockIconUrls();

export const agentGuiDockIconUrl = agentGuiDockIconUrls.codex;

function createDockIconUrls(): Record<AgentGUIProvider, string> {
  const result: Partial<Record<AgentGUIProvider, string>> = {};
  for (const [providerId, iconKey] of Object.entries(
    legacyDockProviderIconKeys
  )) {
    const iconUrl = resolveProviderIconAsset(iconKey, "dock");
    if (iconUrl) {
      result[providerId as AgentGUIProvider] = iconUrl;
    }
  }
  for (const identity of migratedAgentGUIProviderIdentityCatalog) {
    const iconUrl = resolveProviderIconAsset(identity.iconKey, "dock");
    if (iconUrl) {
      result[identity.providerId as AgentGUIProvider] = iconUrl;
    }
  }
  return result as Record<AgentGUIProvider, string>;
}
