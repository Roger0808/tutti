import {
  appendRichTextLinksToContent,
  createRichTextLinkMarkdown,
  createRichTextMentionHref,
  createRichTextMentionMarkdown,
  extractPlainTextFromContent,
  extractPlainTextWithoutFilesFromContent,
  extractRichTextLinksFromContent,
  extractRichTextMentionsFromContent,
  normalizeRichTextContent,
  normalizeRichTextLinkHref,
  parseRichTextMentionHref,
  removeRichTextLinkFromContent,
  removeRichTextMentionFromContent
} from "@tutti-os/ui-rich-text/core";
import type {
  RichTextLinkInput,
  RichTextLinkRef
} from "@tutti-os/ui-rich-text/core";
import type { RichTextMentionAttrs } from "@tutti-os/ui-rich-text/types";

export type IssueManagerWorkspaceFileLinkRef = RichTextLinkRef;
export type IssueManagerWorkspaceFileLinkInput = RichTextLinkInput;

export type IssueManagerMentionRef = RichTextMentionAttrs;
export type IssueManagerMentionAttrs = RichTextMentionAttrs;

export const normalizeIssueManagerContent = normalizeRichTextContent;

export const normalizeIssueManagerWorkspaceFileLinkHref =
  normalizeRichTextLinkHref;

export const createIssueManagerWorkspaceFileLinkMarkdown =
  createRichTextLinkMarkdown;

export const appendIssueManagerWorkspaceFileLinksToContent =
  appendRichTextLinksToContent;

export const extractIssueManagerWorkspaceFileLinksFromContent =
  extractRichTextLinksFromContent;

export const removeIssueManagerWorkspaceFileLinkFromContent =
  removeRichTextLinkFromContent;

export const extractIssueManagerPlainTextFromContent =
  extractPlainTextFromContent;

export const extractIssueManagerPlainTextWithoutFilesFromContent =
  extractPlainTextWithoutFilesFromContent;

export const createIssueManagerMentionHref = createRichTextMentionHref;
export const createIssueManagerMentionMarkdown = createRichTextMentionMarkdown;
export const parseIssueManagerMentionHref = parseRichTextMentionHref;
export const extractIssueManagerMentionsFromContent =
  extractRichTextMentionsFromContent;
export const removeIssueManagerMentionFromContent =
  removeRichTextMentionFromContent;
