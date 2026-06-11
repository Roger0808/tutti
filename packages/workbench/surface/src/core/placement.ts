import { clampWorkbenchRect } from "./geometry.ts";
import {
  defaultWorkbenchLayoutConstraints,
  type WorkbenchLayoutConstraints,
  type WorkbenchFrame,
  type WorkbenchNode,
  type WorkbenchNodeSizeConstraints,
  type WorkbenchSize
} from "./types.ts";

export const WORKBENCH_WINDOW_CASCADE_OFFSET = 28;

export function createWorkbenchInitialRect(
  index: number,
  surfaceSize: WorkbenchSize,
  constraints: WorkbenchLayoutConstraints = defaultWorkbenchLayoutConstraints,
  sizeConstraints?: WorkbenchNodeSizeConstraints | null
): WorkbenchFrame {
  const frameOrigin = {
    x: constraints.safeArea.left + constraints.surfacePadding,
    y: constraints.safeArea.top + constraints.surfacePadding
  };
  const baseWidth = Math.min(760, Math.max(360, surfaceSize.width * 0.62));
  const baseHeight = Math.min(520, Math.max(260, surfaceSize.height * 0.62));
  const offset = (index % 8) * WORKBENCH_WINDOW_CASCADE_OFFSET;

  return clampWorkbenchRect(
    {
      x: frameOrigin.x + offset,
      y: frameOrigin.y + offset,
      width: baseWidth,
      height: baseHeight
    },
    surfaceSize,
    constraints,
    sizeConstraints
  );
}

export function resolveWorkbenchCascadedRect<TData>(input: {
  constraints?: WorkbenchLayoutConstraints;
  currentNodeStack: readonly string[];
  existingNodes: readonly WorkbenchNode<TData>[];
  preferredFrame: WorkbenchFrame;
  sizeConstraints?: WorkbenchNodeSizeConstraints | null;
  surfaceSize: WorkbenchSize;
}): WorkbenchFrame {
  const activeNode =
    input.existingNodes.find(
      (node) => node.id === input.currentNodeStack.at(-1)
    ) ?? input.existingNodes.at(-1);

  if (!activeNode) {
    return clampWorkbenchRect(
      input.preferredFrame,
      input.surfaceSize,
      input.constraints,
      input.sizeConstraints
    );
  }

  return clampWorkbenchRect(
    {
      x: activeNode.frame.x + WORKBENCH_WINDOW_CASCADE_OFFSET,
      y: activeNode.frame.y + WORKBENCH_WINDOW_CASCADE_OFFSET,
      width: input.preferredFrame.width,
      height: input.preferredFrame.height
    },
    input.surfaceSize,
    input.constraints,
    input.sizeConstraints
  );
}

export function placeWorkbenchNode<TData>(
  node: Omit<WorkbenchNode<TData>, "frame"> & { frame?: WorkbenchFrame },
  index: number,
  surfaceSize: WorkbenchSize
): WorkbenchNode<TData> {
  return {
    ...node,
    frame: node.frame ?? createWorkbenchInitialRect(index, surfaceSize)
  };
}
