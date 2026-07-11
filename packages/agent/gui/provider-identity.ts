import { resolveAgentGUIProviderCatalogIdentity } from "./providerIdentityCatalog.ts";

export interface AgentGUIProviderIdentityPresentation {
  providerId: string;
  displayName: string;
}

export function resolveAgentGUIProviderIdentity(
  value: string | null | undefined
): AgentGUIProviderIdentityPresentation | null {
  const identity = resolveAgentGUIProviderCatalogIdentity(value);
  if (!identity) {
    return null;
  }
  return {
    providerId: identity.providerId,
    displayName: identity.displayName
  };
}
