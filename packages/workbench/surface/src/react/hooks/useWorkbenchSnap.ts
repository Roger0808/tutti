import { useCallback } from "react";
import { inferWorkbenchSnapTarget } from "../../core/geometry.ts";
import type { WorkbenchSnapTarget } from "../../core/types.ts";
import { useWorkbenchController } from "../WorkbenchProvider.tsx";

export function useWorkbenchSnap<TData = unknown>() {
  const controller = useWorkbenchController<TData>();

  return useCallback(
    (pointerClientY: number): WorkbenchSnapTarget => {
      const target = inferWorkbenchSnapTarget(
        { y: pointerClientY },
        controller.getSnapshot().surfaceSize,
        undefined,
        controller.getSnapshot().layoutConstraints
      );
      controller.commands.setActiveSnapTarget(target);
      return target;
    },
    [controller]
  );
}
