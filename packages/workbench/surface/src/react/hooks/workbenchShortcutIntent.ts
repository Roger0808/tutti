import type {
  WorkbenchLayoutPreset,
  WorkbenchQuickLayoutTarget,
  WorkbenchSnapTarget
} from "../../core/types.ts";

export type WorkbenchShortcutIntent =
  | { type: "exitFullscreen" }
  | {
      type: "applyFocusedSnapTarget";
      snapTarget: Exclude<WorkbenchSnapTarget, null>;
    }
  | {
      type: "applyFocusedQuickLayout";
      target: WorkbenchQuickLayoutTarget;
    }
  | {
      type: "applyVisibleLayoutPreset";
      preset: WorkbenchLayoutPreset;
    };

interface WorkbenchShortcutEventLike {
  altKey?: boolean;
  ctrlKey?: boolean;
  defaultPrevented?: boolean;
  key: string;
  metaKey?: boolean;
  shiftKey?: boolean;
  target?: EventTarget | null;
}

export function resolveWorkbenchShortcutIntent(
  event: WorkbenchShortcutEventLike
): WorkbenchShortcutIntent | null {
  if (
    event.defaultPrevented ||
    isEditableShortcutTarget(event.target ?? null)
  ) {
    return null;
  }

  if (
    event.key === "Escape" &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.shiftKey
  ) {
    return { type: "exitFullscreen" };
  }

  if (!event.metaKey || event.shiftKey || event.ctrlKey || event.altKey) {
    return null;
  }

  switch (event.key) {
    case "ArrowLeft":
      return { type: "applyFocusedSnapTarget", snapTarget: "left" };
    case "ArrowRight":
      return { type: "applyFocusedSnapTarget", snapTarget: "right" };
    case "ArrowUp":
      return { type: "applyFocusedQuickLayout", target: "top" };
    case "ArrowDown":
      return { type: "applyFocusedQuickLayout", target: "bottom" };
    case "0":
      return {
        type: "applyVisibleLayoutPreset",
        preset: { kind: "balanced" }
      };
    default:
      return null;
  }
}

function isEditableShortcutTarget(target: EventTarget | null): boolean {
  const candidate = target as {
    isContentEditable?: boolean;
    tagName?: string;
  } | null;
  const tagName = candidate?.tagName?.toUpperCase();
  return (
    candidate?.isContentEditable === true ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}
