import type { Editor, JSONContent } from "@tiptap/core";
import {
  attrsToMentionItem,
  formatAgentMentionMarkdown,
  parseAgentMentionMarkdown
} from "./agentFileMentionExtension";

function createEmptyDocument(): JSONContent {
  return {
    type: "doc",
    content: [{ type: "paragraph" }]
  };
}

function createParagraphFromText(text: string): JSONContent {
  const content: JSONContent[] = [];
  let index = 0;
  let textBuffer = "";

  const flushTextBuffer = (): void => {
    if (textBuffer.length === 0) {
      return;
    }
    content.push({ type: "text", text: textBuffer });
    textBuffer = "";
  };

  while (index < text.length) {
    const current = text[index];
    if (current === "\n") {
      flushTextBuffer();
      content.push({ type: "hardBreak" });
      index += 1;
      continue;
    }

    const parsedMention = parseAgentMentionMarkdown(text, index);
    if (parsedMention) {
      flushTextBuffer();
      content.push({
        type: "agentFileMention",
        attrs: parsedMention.item
      });
      index = parsedMention.end;
      continue;
    }

    textBuffer += current;
    index += 1;
  }

  flushTextBuffer();
  return content.length > 0
    ? { type: "paragraph", content }
    : { type: "paragraph" };
}

export function plainTextToAgentRichTextDoc(text: string): JSONContent {
  if (text.length === 0) {
    return createEmptyDocument();
  }
  const normalized = text.replace(/\r\n?/g, "\n");
  return {
    type: "doc",
    content: [createParagraphFromText(normalized)]
  };
}

export function plainTextToAgentRichTextInlineContent(
  text: string
): JSONContent[] {
  const paragraph = createParagraphFromText(text.replace(/\r\n?/g, "\n"));
  return paragraph.content ?? [];
}

export function agentRichTextDocToPromptText(doc: JSONContent): string {
  if (doc.type !== "doc") {
    return nodeToPromptText(doc);
  }
  const blocks = doc.content ?? [];
  if (blocks.length === 0) {
    return "";
  }
  return blocks.map(nodeToPromptText).join("\n");
}

export function editorToPromptText(editor: Editor): string {
  return agentRichTextDocToPromptText(editor.getJSON());
}

function nodeToPromptText(node: JSONContent): string {
  if (node.type === "text") {
    return node.text ?? "";
  }
  if (node.type === "agentFileMention") {
    return formatAgentMentionMarkdown(attrsToMentionItem(node.attrs ?? {}));
  }
  if (node.type === "hardBreak") {
    return "\n";
  }
  if (!node.content || node.content.length === 0) {
    return "";
  }
  return node.content.map(nodeToPromptText).join("");
}
