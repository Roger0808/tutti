import type { JSONContent } from "@tiptap/core";
import {
  mentionReferenceNodeName,
  workspaceReferenceNodeName
} from "../extensions/names.ts";
import type { RichTextMentionAttrs } from "../types/mention.ts";
import {
  findRichTextMarkdownLinks,
  type RichTextMarkdownLinkMatch
} from "./richTextMarkdownLinks.ts";

export type RichTextLinkRef = {
  name: string;
  path: string;
  href: string;
  kind: "file" | "folder";
};

export type RichTextLinkInput = {
  name?: string | null;
  path: string;
  kind?: "file" | "folder";
};

export type RichTextMentionRef = RichTextMentionAttrs;
export type RichTextDocument = JSONContent;

const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
const EXTERNAL_LINK_PREFIX = /^(?:[a-z]+:)?\/\//i;
const MENTION_LINK_PREFIX = /^mention:\/\//i;
const MENTION_META_PARAM_PREFIX = "meta.";

type LegacyJSONContentNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: LegacyJSONContentNode[];
};

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function normalizeContentString(value?: string | null): string {
  const trimmed = normalizeLineEndings(value ?? "").trim();
  if (!trimmed) {
    return "";
  }
  const markdown = convertLegacyDocumentString(trimmed);
  return markdown || trimmed;
}

export function normalizeRichTextContent(value?: string | null): string {
  return normalizeContentString(value);
}

function convertLegacyDocumentString(value: string): string {
  try {
    const parsed = JSON.parse(value) as LegacyJSONContentNode;
    if (parsed?.type !== "doc" || !Array.isArray(parsed.content)) {
      return "";
    }
    return renderLegacyNodesToMarkdown(parsed.content).trim();
  } catch {
    return "";
  }
}

function renderLegacyNodesToMarkdown(nodes: LegacyJSONContentNode[]): string {
  return nodes
    .map((node) => renderLegacyNodeToMarkdown(node))
    .filter((part) => part.length > 0)
    .join("\n\n");
}

function renderLegacyNodeToMarkdown(
  node: LegacyJSONContentNode | null | undefined
): string {
  if (!node) {
    return "";
  }
  if (node.type === "text") {
    return node.text ?? "";
  }
  if (node.type === "workspaceFileLink") {
    const attrs = node.attrs ?? {};
    const kind = attrs.kind === "folder" ? "folder" : "file";
    const hrefValue =
      (typeof attrs.href === "string" ? attrs.href : undefined) ||
      (typeof attrs.path === "string" ? attrs.path : undefined) ||
      "";
    const href = normalizeRichTextLinkHref(hrefValue, kind);
    const label =
      (typeof attrs.name === "string" ? attrs.name : undefined)?.trim() ||
      href.split("/").filter(Boolean).at(-1) ||
      href;
    return href && label ? `[${label}](${href})` : label;
  }
  if (Array.isArray(node.content)) {
    const inline = node.content
      .map((child) => renderLegacyNodeToMarkdown(child))
      .filter((part) => part.length > 0)
      .join("")
      .trim();
    if (!inline) {
      return "";
    }
    if (node.type === "paragraph") {
      return inline;
    }
    return inline;
  }
  return "";
}

function normalizeWorkspacePath(
  pathOrHref: string,
  kind: "file" | "folder"
): string {
  const trimmed = pathOrHref.trim();
  if (!trimmed) {
    return "";
  }
  if (kind === "folder" && !trimmed.endsWith("/")) {
    return `${trimmed}/`;
  }
  return trimmed;
}

function isWorkspaceReferenceHref(href: string): boolean {
  const trimmed = href.trim();
  if (
    !trimmed ||
    MENTION_LINK_PREFIX.test(trimmed) ||
    EXTERNAL_LINK_PREFIX.test(trimmed)
  ) {
    return false;
  }
  return true;
}

export function isRichTextMentionHref(href: string): boolean {
  return MENTION_LINK_PREFIX.test(href.trim());
}

function createMentionQueryParams(
  mention: RichTextMentionAttrs
): URLSearchParams {
  const params = new URLSearchParams();
  if (mention.kind?.trim()) {
    params.set("kind", mention.kind.trim());
  }
  if (mention.href?.trim()) {
    params.set("link", mention.href.trim());
  }
  if (mention.version?.trim()) {
    params.set("v", mention.version.trim());
  }
  for (const [key, value] of Object.entries(mention.meta ?? {})) {
    const nextKey = key.trim();
    const nextValue = value.trim();
    if (!nextKey || !nextValue) {
      continue;
    }
    params.set(`${MENTION_META_PARAM_PREFIX}${nextKey}`, nextValue);
  }
  return params;
}

export function createRichTextMentionHref(
  mention: RichTextMentionAttrs
): string {
  const plugin = mention.plugin.trim();
  const entityId = mention.entityId.trim();
  if (!plugin || !entityId) {
    return "";
  }

  const params = createMentionQueryParams(mention);
  const queryString = params.toString();
  const pathname = `${encodeURIComponent(plugin)}/${encodeURIComponent(entityId)}`;
  return queryString
    ? `mention://${pathname}?${queryString}`
    : `mention://${pathname}`;
}

export function createRichTextMentionMarkdown(
  mention: RichTextMentionAttrs
): string {
  const label = mention.label.trim();
  const href = createRichTextMentionHref(mention);
  if (!label || !href) {
    return "";
  }
  return `[${label}](${href})`;
}

export function parseRichTextMentionHref(
  href: string,
  label?: string | null
): RichTextMentionRef | null {
  const trimmedHref = href.trim();
  if (!isRichTextMentionHref(trimmedHref)) {
    return null;
  }

  try {
    const parsed = new URL(trimmedHref);
    const plugin = decodeURIComponent(parsed.hostname).trim();
    const entityId = decodeURIComponent(
      parsed.pathname.replace(/^\/+/, "")
    ).trim();
    const nextLabel = label?.trim() ?? "";

    if (!plugin || !entityId || !nextLabel) {
      return null;
    }

    const metaEntries = [...parsed.searchParams.entries()]
      .filter(
        ([key, value]) =>
          key.startsWith(MENTION_META_PARAM_PREFIX) && value.trim().length > 0
      )
      .map(
        ([key, value]) =>
          [key.slice(MENTION_META_PARAM_PREFIX.length), value.trim()] as const
      )
      .filter(([key, value]) => key.trim().length > 0 && value.length > 0);

    return {
      trigger: "@",
      plugin,
      entityId,
      label: nextLabel,
      kind: parsed.searchParams.get("kind")?.trim() || undefined,
      href: parsed.searchParams.get("link")?.trim() || undefined,
      version: parsed.searchParams.get("v")?.trim() || undefined,
      meta: metaEntries.length > 0 ? Object.fromEntries(metaEntries) : undefined
    };
  } catch {
    return null;
  }
}

export function normalizeRichTextLinkHref(
  pathOrHref: string,
  kind: "file" | "folder" = "file"
): string {
  return normalizeWorkspacePath(pathOrHref, kind);
}

export function createRichTextLinkMarkdown(input: RichTextLinkInput): string {
  const kind = input.kind === "folder" ? "folder" : "file";
  const href = normalizeRichTextLinkHref(input.path, kind);
  const displayName =
    input.name?.trim() ||
    href.split("/").filter(Boolean).at(-1) ||
    href ||
    input.path.trim();
  if (!href || !displayName) {
    return "";
  }
  return `[${escapeMarkdownLinkLabel(displayName)}](${escapeMarkdownLinkHref(href)})`;
}

export function appendRichTextLinksToContent(
  value: string | null | undefined,
  refs: readonly RichTextLinkInput[]
): string {
  const content = normalizeContentString(value);
  const existing = new Set(
    extractRichTextLinksFromContent(content).map((ref) => ref.path)
  );
  const rendered = refs
    .map((ref) => {
      const kind = ref.kind === "folder" ? "folder" : "file";
      const path = normalizeRichTextLinkHref(ref.path, kind);
      if (!path || existing.has(path)) {
        return "";
      }
      existing.add(path);
      return createRichTextLinkMarkdown({ ...ref, path, kind });
    })
    .filter(Boolean);

  if (rendered.length === 0) {
    return content;
  }
  return content ? `${content} ${rendered.join(" ")}` : rendered.join(" ");
}

export function extractRichTextLinksFromContent(
  value: string | null | undefined
): RichTextLinkRef[] {
  const content = normalizeContentString(value);
  const refs = new Map<string, RichTextLinkRef>();
  for (const match of findRichTextMarkdownLinks(content)) {
    const name = match.label.trim();
    const href = match.href.trim();
    if (!name || !isWorkspaceReferenceHref(href)) {
      continue;
    }
    const kind = href.endsWith("/") ? "folder" : "file";
    const path = normalizeRichTextLinkHref(href, kind);
    if (!path || refs.has(path)) {
      continue;
    }
    refs.set(path, {
      name,
      path,
      href: path,
      kind
    });
  }
  return [...refs.values()];
}

export function extractRichTextMentionsFromContent(
  value: string | null | undefined
): RichTextMentionRef[] {
  const content = normalizeContentString(value);
  const refs = new Map<string, RichTextMentionRef>();

  for (const match of findRichTextMarkdownLinks(content)) {
    const label = match.label.trim();
    const href = match.href.trim();
    const mention = parseRichTextMentionHref(href, label);
    if (!mention) {
      continue;
    }
    const mentionKey = `${mention.plugin}:${mention.entityId}`;
    if (refs.has(mentionKey)) {
      continue;
    }
    refs.set(mentionKey, mention);
  }

  return [...refs.values()];
}

export function removeRichTextMentionFromContent(
  content: string,
  mention: Pick<RichTextMentionAttrs, "plugin" | "entityId">
): string {
  const plugin = mention.plugin.trim();
  const entityId = mention.entityId.trim();
  if (!plugin || !entityId) {
    return normalizeContentString(content);
  }

  const normalized = normalizeContentString(content);
  const next = replaceRichTextMarkdownLinks(normalized, (match) => {
    const parsedMention = parseRichTextMentionHref(match.href, match.label);
    if (!parsedMention) {
      return match.source;
    }
    return parsedMention.plugin === plugin &&
      parsedMention.entityId === entityId
      ? ""
      : match.source;
  });

  return next
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function removeRichTextLinkFromContent(
  content: string,
  path: string
): string {
  const targetPath = path.trim();
  if (!targetPath) {
    return normalizeContentString(content);
  }
  const normalized = normalizeContentString(content);
  const next = replaceRichTextMarkdownLinks(normalized, (match) => {
    const href = match.href.trim();
    const kind = href.endsWith("/") ? "folder" : "file";
    const refPath = normalizeRichTextLinkHref(href, kind);
    return refPath === targetPath ? "" : match.source;
  });
  return next
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractPlainTextFromContent(value?: string | null): string {
  const content = normalizeContentString(value);
  if (!content) {
    return "";
  }
  return replaceRichTextMarkdownLinks(
    content.replace(MARKDOWN_IMAGE_PATTERN, " $1 "),
    (match) => ` ${match.label} `
  )
    .replace(/^[\s>*#+-]+/gm, " ")
    .replace(/`([^`]+)`/g, " $1 ")
    .replace(/[*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPlainTextWithoutFilesFromContent(
  value?: string | null
): string {
  const content = normalizeContentString(value);
  if (!content) {
    return "";
  }
  return replaceRichTextMarkdownLinks(
    content.replace(MARKDOWN_IMAGE_PATTERN, " "),
    () => " "
  )
    .replace(/^[\s>*#+-]+/gm, " ")
    .replace(/`([^`]+)`/g, " $1 ")
    .replace(/[*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRichTextContentToDocument(
  value?: string | null
): RichTextDocument {
  const content = normalizeContentString(value);
  if (!content) {
    return {
      type: "doc",
      content: [{ type: "paragraph" }]
    };
  }

  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => createRichTextParagraphNode(paragraph))
    .filter((paragraph) => Array.isArray(paragraph.content));

  return {
    type: "doc",
    content: paragraphs.length > 0 ? paragraphs : [{ type: "paragraph" }]
  };
}

export function serializeRichTextDocumentToContent(
  document: RichTextDocument
): string {
  const paragraphs = (document.content ?? [])
    .map((node) => serializeRichTextBlockNode(node))
    .filter((value) => value.length > 0);

  return paragraphs.join("\n\n").trim();
}

function createRichTextParagraphNode(paragraph: string): JSONContent {
  return {
    type: "paragraph",
    content: createRichTextInlineNodes(paragraph)
  };
}

function createRichTextInlineNodes(text: string): JSONContent[] {
  const content: JSONContent[] = [];
  let cursor = 0;

  for (const match of findRichTextMarkdownLinks(text)) {
    const { index, source } = match;
    if (index > cursor) {
      appendPlainTextNodes(content, text.slice(cursor, index));
    }

    const label = match.label.trim();
    const href = match.href.trim();
    const mention = parseRichTextMentionHref(href, label);
    if (mention) {
      content.push({
        type: mentionReferenceNodeName,
        attrs: mention
      });
    } else if (label && isWorkspaceReferenceHref(href)) {
      const kind = href.endsWith("/") ? "folder" : "file";
      content.push({
        type: workspaceReferenceNodeName,
        attrs: {
          kind,
          label,
          path: normalizeRichTextLinkHref(href, kind)
        }
      });
    } else {
      appendPlainTextNodes(content, source);
    }

    cursor = match.to;
  }

  if (cursor < text.length) {
    appendPlainTextNodes(content, text.slice(cursor));
  }

  return content;
}

function replaceRichTextMarkdownLinks(
  value: string,
  replace: (match: RichTextMarkdownLinkMatch) => string
): string {
  let nextValue = "";
  let cursor = 0;

  for (const match of findRichTextMarkdownLinks(value)) {
    nextValue += value.slice(cursor, match.index);
    nextValue += replace(match);
    cursor = match.to;
  }

  return `${nextValue}${value.slice(cursor)}`;
}

function escapeMarkdownLinkLabel(value: string): string {
  return value.replace(/[\\[\]]/g, "\\$&");
}

function escapeMarkdownLinkHref(value: string): string {
  return value.replace(/[\\()]/g, "\\$&");
}

function appendPlainTextNodes(content: JSONContent[], text: string): void {
  if (!text) {
    return;
  }

  const lines = text.split("\n");
  lines.forEach((line, index) => {
    if (line.length > 0) {
      content.push({
        type: "text",
        text: line
      });
    }
    if (index < lines.length - 1) {
      content.push({ type: "hardBreak" });
    }
  });
}

function serializeRichTextBlockNode(node: JSONContent): string {
  if (node.type === "paragraph") {
    return serializeRichTextInlineNodes(node.content ?? []);
  }
  return serializeRichTextInlineNodes(node.content ?? []);
}

function serializeRichTextInlineNodes(nodes: readonly JSONContent[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        return typeof node.text === "string" ? node.text : "";
      }
      if (node.type === "hardBreak") {
        return "\n";
      }
      if (node.type === workspaceReferenceNodeName) {
        const attrs = node.attrs ?? {};
        return createRichTextLinkMarkdown({
          kind: attrs.kind === "folder" ? "folder" : "file",
          name: typeof attrs.label === "string" ? attrs.label : "",
          path: typeof attrs.path === "string" ? attrs.path : ""
        });
      }
      if (node.type === mentionReferenceNodeName) {
        const attrs = node.attrs ?? {};
        const label = typeof attrs.label === "string" ? attrs.label.trim() : "";
        const plugin =
          typeof attrs.plugin === "string" ? attrs.plugin.trim() : "";
        const entityId =
          typeof attrs.entityId === "string" ? attrs.entityId.trim() : "";
        if (!label || !plugin || !entityId) {
          return "";
        }
        return createRichTextMentionMarkdown({
          entityId,
          href: typeof attrs.href === "string" ? attrs.href : undefined,
          kind: typeof attrs.kind === "string" ? attrs.kind : undefined,
          label,
          meta:
            attrs.meta && typeof attrs.meta === "object"
              ? (attrs.meta as Record<string, string>)
              : undefined,
          plugin,
          trigger: "@",
          version: typeof attrs.version === "string" ? attrs.version : undefined
        });
      }

      if (Array.isArray(node.content)) {
        return serializeRichTextInlineNodes(node.content);
      }

      return "";
    })
    .join("");
}
