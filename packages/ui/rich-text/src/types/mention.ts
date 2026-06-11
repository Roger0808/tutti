export type RichTextSuggestionTrigger = "@" | "#" | "/";
export type RichTextMentionRenderState =
  | "active"
  | "missing"
  | "disabled"
  | "loading";

export interface RichTextMentionPluginContext {
  locale?: string;
  documentText?: string;
  blockText?: string;
  selectionText?: string;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface RichTextMentionQueryInput {
  keyword: string;
  maxResults?: number;
  abortSignal?: AbortSignal;
  context: RichTextMentionPluginContext;
}

export interface RichTextMentionResolveInput {
  mention: RichTextMentionAttrs;
  context: RichTextMentionPluginContext;
}

export interface RichTextResolvedMention<TResolved = unknown> {
  state: RichTextMentionRenderState;
  label?: string;
  tooltip?: string;
  href?: string;
  entity?: TResolved;
}

export interface RichTextResolvedMentionView<TResolved = unknown> {
  state: RichTextMentionRenderState;
  label: string;
  tooltip?: string;
  href?: string;
  entity?: TResolved;
  interactive: boolean;
}

export interface RichTextMentionInsert {
  entityId: string;
  label: string;
  href?: string | null;
  kind?: string | null;
  version?: string | null;
  meta?: Readonly<Record<string, string>> | null;
}

export interface RichTextMentionAttrs {
  trigger: "@";
  plugin: string;
  entityId: string;
  label: string;
  href?: string;
  kind?: string;
  version?: string;
  meta?: Readonly<Record<string, string>>;
}

export interface RichTextMentionPlugin<TItem = unknown, TResolved = unknown> {
  id: string;
  trigger?: "@";
  query: (
    input: RichTextMentionQueryInput
  ) => Promise<readonly TItem[]> | readonly TItem[];
  getItemKey: (item: TItem) => string;
  getItemLabel: (item: TItem) => string;
  getItemSubtitle?: (item: TItem) => string | null | undefined;
  getItemKeywords?: (item: TItem) => readonly string[] | undefined;
  toMention: (item: TItem) => RichTextMentionInsert;
  renderText?: (attrs: RichTextMentionAttrs) => string;
  resolveMention?: (
    input: RichTextMentionResolveInput
  ) =>
    | Promise<RichTextResolvedMention<TResolved>>
    | RichTextResolvedMention<TResolved>;
}

export interface RichTextMentionQueryMatch<TItem = unknown> {
  pluginId: string;
  key: string;
  label: string;
  subtitle?: string;
  keywords?: readonly string[];
  item: TItem;
  mention: RichTextMentionAttrs;
}

export interface RichTextMentionRegistry {
  listPlugins: () => readonly RichTextMentionPlugin[];
  getPlugin: (pluginId: string) => RichTextMentionPlugin | undefined;
  query: (
    input: RichTextMentionQueryInput
  ) => Promise<readonly RichTextMentionQueryMatch[]>;
  resolve: (
    input: RichTextMentionResolveInput
  ) => Promise<RichTextResolvedMentionView>;
}
