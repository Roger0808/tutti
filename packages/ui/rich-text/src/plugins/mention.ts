import type {
  RichTextMentionAttrs,
  RichTextMentionInsert,
  RichTextMentionPlugin,
  RichTextResolvedMention,
  RichTextResolvedMentionView
} from "../types/mention.ts";

const richTextMentionTrigger = "@";

function normalizeOptionalString(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeMentionMeta(
  meta?: Readonly<Record<string, string>> | null
): Readonly<Record<string, string>> | undefined {
  if (!meta) {
    return undefined;
  }

  const nextEntries = Object.entries(meta)
    .map(([key, value]) => [key.trim(), value.trim()] as const)
    .filter(([key, value]) => key.length > 0 && value.length > 0);

  if (nextEntries.length === 0) {
    return undefined;
  }

  return Object.freeze(Object.fromEntries(nextEntries));
}

export function createRichTextMentionAttrs(
  pluginId: string,
  mention: RichTextMentionInsert
): RichTextMentionAttrs {
  const plugin = pluginId.trim();
  const entityId = mention.entityId.trim();
  const label = mention.label.trim();

  if (!plugin) {
    throw new Error("Rich text mention plugin id is required.");
  }
  if (!entityId) {
    throw new Error("Rich text mention entityId is required.");
  }
  if (!label) {
    throw new Error("Rich text mention label is required.");
  }

  return {
    trigger: richTextMentionTrigger,
    plugin,
    entityId,
    label,
    href: normalizeOptionalString(mention.href),
    kind: normalizeOptionalString(mention.kind),
    version: normalizeOptionalString(mention.version),
    meta: normalizeMentionMeta(mention.meta)
  };
}

export function isRichTextMentionAttrs(
  value: unknown
): value is RichTextMentionAttrs {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RichTextMentionAttrs>;
  return (
    candidate.trigger === richTextMentionTrigger &&
    typeof candidate.plugin === "string" &&
    candidate.plugin.trim().length > 0 &&
    typeof candidate.entityId === "string" &&
    candidate.entityId.trim().length > 0 &&
    typeof candidate.label === "string" &&
    candidate.label.trim().length > 0
  );
}

export function getRichTextMentionDisplayText(
  attrs: RichTextMentionAttrs
): string {
  return `@${attrs.label}`;
}

export function resolveRichTextMentionView(
  mention: RichTextMentionAttrs,
  resolved?: RichTextResolvedMention | null
): RichTextResolvedMentionView {
  const state = resolved?.state ?? "active";
  const label = resolved?.label?.trim() || mention.label;
  const href = normalizeOptionalString(resolved?.href);
  const tooltip = normalizeOptionalString(resolved?.tooltip);

  return {
    state,
    label,
    tooltip,
    href,
    entity: resolved?.entity,
    interactive: state === "active"
  };
}

export function createRichTextMentionPlugin<TItem, TResolved = unknown>(
  plugin: RichTextMentionPlugin<TItem, TResolved>
): RichTextMentionPlugin<TItem, TResolved> {
  const id = plugin.id.trim();
  if (!id) {
    throw new Error("Rich text mention plugin id is required.");
  }

  return {
    ...plugin,
    id,
    trigger: richTextMentionTrigger
  };
}
