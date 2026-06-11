import type { JSONContent } from "@tiptap/core";
import type { WorkspaceFileReference } from "@tutti-os/workspace-file-reference/contracts";

function basename(path: string): string {
  const normalized = path.trim().replace(/\/+$/, "");
  if (!normalized) {
    return "";
  }
  const segments = normalized.split("/").filter(Boolean);
  return segments.at(-1) ?? normalized;
}

function dirnameFromPath(path: string): string {
  const normalized = path.trim().replace(/\/+$/, "");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length <= 1) {
    return "/";
  }
  return `/${segments.slice(0, -1).join("/")}`;
}

function referenceMentionPath(item: WorkspaceFileReference): string {
  const path = item.path.trim();
  if (item.kind === "folder" && path !== "/" && !path.endsWith("/")) {
    return `${path}/`;
  }
  return path;
}

export function createAgentFileMentionContent(
  items: readonly WorkspaceFileReference[]
): JSONContent[] {
  return items.flatMap((item, index) => {
    const path = referenceMentionPath(item);
    const name = item.displayName?.trim() || basename(path);
    return [
      ...(index > 0 ? ([{ type: "text", text: " " }] as JSONContent[]) : []),
      {
        type: "agentFileMention",
        attrs: {
          kind: "file",
          href: path,
          path,
          name,
          entryKind: item.kind === "folder" ? "directory" : "file",
          directoryPath: dirnameFromPath(path)
        }
      },
      { type: "text", text: " " }
    ];
  });
}
