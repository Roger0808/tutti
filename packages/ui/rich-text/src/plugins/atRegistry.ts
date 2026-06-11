import type {
  RichTextAtProvider,
  RichTextAtQueryInput,
  RichTextAtQueryMatch,
  RichTextAtRegistry
} from "../types/at.ts";

function normalizeProviderId(providerId: string): string {
  return providerId.trim();
}

export function createRichTextAtRegistry(
  providers: readonly RichTextAtProvider[]
): RichTextAtRegistry {
  const providerMap = new Map<string, RichTextAtProvider>();

  for (const provider of providers) {
    const providerId = normalizeProviderId(provider.id);
    if (!providerId) {
      throw new Error("Rich text @ provider id is required.");
    }
    if (providerMap.has(providerId)) {
      throw new Error(`Duplicate rich text @ provider id: ${providerId}`);
    }
    providerMap.set(providerId, provider);
  }

  async function query(
    input: RichTextAtQueryInput
  ): Promise<readonly RichTextAtQueryMatch[]> {
    if (input.abortSignal?.aborted) {
      return [];
    }

    const matches = await Promise.all(
      [...providerMap.values()].map(async (provider) => {
        if (input.abortSignal?.aborted) {
          return [];
        }
        const items = await provider.query(input);
        if (input.abortSignal?.aborted) {
          return [];
        }
        return items.map<RichTextAtQueryMatch>((item) => ({
          providerId: provider.id,
          key: provider.getItemKey(item),
          label: provider.getItemLabel(item),
          subtitle: provider.getItemSubtitle?.(item) || undefined,
          keywords: provider.getItemKeywords?.(item),
          item,
          insertResult: provider.toInsertResult(item)
        }));
      })
    );

    const flatMatches = matches.flat();
    const limit = input.maxResults;
    if (typeof limit === "number" && limit >= 0) {
      return flatMatches.slice(0, limit);
    }
    return flatMatches;
  }

  return {
    listProviders: () => [...providerMap.values()],
    getProvider: (providerId: string) =>
      providerMap.get(normalizeProviderId(providerId)),
    query
  };
}
