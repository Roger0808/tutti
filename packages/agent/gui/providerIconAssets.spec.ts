import { describe, expect, it } from "vitest";
import { migratedAgentGUIProviderIdentityCatalog } from "./providerIdentityCatalog.ts";
import {
  PROVIDER_ICON_ASSETS_BY_ICON_KEY,
  resolveProviderIconAsset
} from "./providerIconAssets.ts";

describe("provider icon assets", () => {
  it("covers every icon key emitted by the migrated provider catalog", () => {
    for (const identity of migratedAgentGUIProviderIdentityCatalog) {
      expect(
        PROVIDER_ICON_ASSETS_BY_ICON_KEY[identity.iconKey],
        `missing icon assets for ${identity.providerId}:${identity.iconKey}`
      ).toBeDefined();
      expect(
        resolveProviderIconAsset(identity.iconKey, "manage")
      ).not.toBeNull();
      expect(
        resolveProviderIconAsset(identity.iconKey, "providerRail")
      ).not.toBeNull();
      expect(
        resolveProviderIconAsset(identity.iconKey, "rounded")
      ).not.toBeNull();
      expect(
        resolveProviderIconAsset(identity.iconKey, "sessionColorful")
      ).not.toBeNull();
      expect(
        resolveProviderIconAsset(identity.iconKey, "sessionFlat")
      ).not.toBeNull();
      expect(resolveProviderIconAsset(identity.iconKey, "dock")).not.toBeNull();
    }
  });

  it("returns null for unknown icon keys instead of a Tutti asset", () => {
    expect(resolveProviderIconAsset("unknown-provider", "rounded")).toBeNull();
    expect(resolveProviderIconAsset(undefined, "manage")).toBeNull();
  });
});
