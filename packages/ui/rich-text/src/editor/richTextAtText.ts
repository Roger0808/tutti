import {
  createDefaultRichTextI18nRuntime,
  type RichTextI18nRuntime
} from "../i18n/richTextI18n.ts";

export interface RichTextAtTextOverrides {
  loadingLabel?: string;
  noMatchesLabel?: string;
  removeReferenceActionLabel?: string;
}

export interface ResolvedRichTextAtText {
  loadingLabel: string;
  noMatchesLabel: string;
  removeReferenceActionLabel: string;
}

const defaultRichTextI18n = createDefaultRichTextI18nRuntime();

export function resolveRichTextAtText(
  overrides?: RichTextAtTextOverrides,
  removeDecorationAriaLabel?: string,
  i18n: RichTextI18nRuntime = defaultRichTextI18n
): ResolvedRichTextAtText {
  return {
    loadingLabel:
      overrides?.loadingLabel?.trim() || i18n.t("richTextAt.loading"),
    noMatchesLabel:
      overrides?.noMatchesLabel?.trim() || i18n.t("richTextAt.noMatches"),
    removeReferenceActionLabel:
      removeDecorationAriaLabel?.trim() ||
      overrides?.removeReferenceActionLabel?.trim() ||
      i18n.t("richTextAt.removeReferenceActionLabel")
  };
}

export const defaultRichTextAtText = resolveRichTextAtText();
