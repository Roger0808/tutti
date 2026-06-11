import { createRichTextMentionAttrs } from "./mention.ts";
import {
  createRichTextMentionMarkdown,
  createRichTextLinkMarkdown
} from "../core/richTextDocument.ts";
import type {
  RichTextAtInsertResult,
  RichTextAtProvider,
  RichTextMarkdownLinkInsertResult,
  RichTextMentionAtInsertResult,
  RichTextTextInsertResult
} from "../types/at.ts";

const richTextAtTrigger = "@";

function normalizeRequiredString(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`Rich text ${fieldName} is required.`);
  }
  return trimmed;
}

export function createRichTextTextInsertResult(
  text: string
): RichTextTextInsertResult {
  return {
    kind: "text",
    text
  };
}

export function createRichTextMarkdownLinkInsertResult(
  label: string,
  href: string
): RichTextMarkdownLinkInsertResult {
  return {
    kind: "markdown-link",
    label: normalizeRequiredString(label, "insert label"),
    href: normalizeRequiredString(href, "insert href")
  };
}

export function createRichTextMentionInsertResult(
  mention: RichTextMentionAtInsertResult["mention"]
): RichTextMentionAtInsertResult {
  return {
    kind: "mention",
    mention
  };
}

export function renderRichTextAtInsertResult(
  providerId: string,
  result: RichTextAtInsertResult
): string {
  switch (result.kind) {
    case "mention":
      return createRichTextMentionMarkdown(
        createRichTextMentionAttrs(providerId, result.mention)
      );
    case "markdown-link":
      return createRichTextLinkMarkdown({
        name: result.label,
        path: result.href,
        kind: result.href.endsWith("/") ? "folder" : "file"
      });
    case "text":
      return result.text;
    default:
      return "";
  }
}

export function createRichTextAtProvider<TItem>(
  provider: RichTextAtProvider<TItem>
): RichTextAtProvider<TItem> {
  const id = normalizeRequiredString(provider.id, "provider id");

  return {
    ...provider,
    id,
    trigger: richTextAtTrigger
  };
}
