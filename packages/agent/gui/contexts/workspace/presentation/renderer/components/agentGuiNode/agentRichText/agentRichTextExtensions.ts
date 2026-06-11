import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  createAgentFileMentionExtension,
  type AgentFileMentionExtensionOptions
} from "./agentFileMentionExtension";

function createAgentPromptStarterKit(): Extensions[0] {
  return StarterKit.configure({
    blockquote: false,
    bold: false,
    bulletList: false,
    code: false,
    codeBlock: false,
    dropcursor: false,
    gapcursor: false,
    heading: false,
    horizontalRule: false,
    italic: false,
    link: false,
    listItem: false,
    listKeymap: false,
    orderedList: false,
    strike: false,
    trailingNode: false,
    underline: false
  });
}

export function createAgentRichTextInputExtensions(
  fileMentionOptions?: AgentFileMentionExtensionOptions
): Extensions {
  return [
    createAgentPromptStarterKit(),
    createAgentFileMentionExtension(fileMentionOptions)
  ];
}

export function createAgentRichTextReadonlyExtensions(): Extensions {
  return [
    createAgentPromptStarterKit(),
    createAgentFileMentionExtension({
      enableSuggestions: false,
      renderAsLink: true
    })
  ];
}
