export interface AgentMentionRectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface AgentMentionPaletteSize {
  width: number;
  height: number;
}

export interface ResolveAgentMentionPalettePositionInput {
  anchorRect: AgentMentionRectLike;
  shellRect: AgentMentionRectLike;
  paletteSize: AgentMentionPaletteSize;
  viewportWidth: number;
  viewportHeight: number;
}

export interface AgentMentionPalettePosition {
  left: number;
  top: number;
  width: number;
  maxWidth: number;
  maxHeight: number;
  placement: "top" | "bottom";
}

const EDGE_PADDING = 12;
const GAP = 8;
const MIN_WIDTH = 220;

export function resolveAgentMentionPalettePosition({
  anchorRect,
  shellRect,
  paletteSize,
  viewportWidth,
  viewportHeight
}: ResolveAgentMentionPalettePositionInput): AgentMentionPalettePosition {
  const maxWidth = Math.max(
    MIN_WIDTH,
    Math.floor(shellRect.width - EDGE_PADDING * 2)
  );
  const width = Math.min(paletteSize.width, maxWidth);

  const idealLeft = anchorRect.right - shellRect.left;
  const minLeft = EDGE_PADDING;
  const maxLeft = Math.max(minLeft, shellRect.width - EDGE_PADDING - width);
  const left = Math.min(Math.max(idealLeft, minLeft), maxLeft);

  const spaceBelow = Math.max(0, viewportHeight - anchorRect.bottom - GAP);
  const spaceAbove = Math.max(0, anchorRect.top - GAP);
  const placement: "top" | "bottom" =
    spaceBelow >= paletteSize.height || spaceBelow >= spaceAbove
      ? "bottom"
      : "top";

  const maxHeight = Math.max(
    0,
    Math.floor(placement === "bottom" ? spaceBelow : spaceAbove)
  );
  const height = Math.min(paletteSize.height, maxHeight || paletteSize.height);
  const top =
    placement === "bottom"
      ? anchorRect.bottom - shellRect.top + GAP
      : anchorRect.top - shellRect.top - height - GAP;

  return {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(Math.min(width, viewportWidth - EDGE_PADDING * 2)),
    maxWidth,
    maxHeight,
    placement
  };
}
