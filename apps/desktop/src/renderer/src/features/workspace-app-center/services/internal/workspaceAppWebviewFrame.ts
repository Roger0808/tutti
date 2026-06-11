import type {
  WorkbenchFrame,
  WorkbenchNodeSizeConstraints
} from "@tutti-os/workbench-surface";

export const workspaceAppWebviewFrame: WorkbenchFrame = {
  height: 680,
  width: 1040,
  x: 170,
  y: 64
};

export function resolveWorkspaceAppWebviewFrame(
  sizeConstraints: WorkbenchNodeSizeConstraints | null
): WorkbenchFrame {
  if (!sizeConstraints) {
    return workspaceAppWebviewFrame;
  }

  return {
    ...workspaceAppWebviewFrame,
    height: Math.max(
      workspaceAppWebviewFrame.height,
      sizeConstraints.minHeight ?? 0
    ),
    width: Math.max(
      workspaceAppWebviewFrame.width,
      sizeConstraints.minWidth ?? 0
    )
  };
}
