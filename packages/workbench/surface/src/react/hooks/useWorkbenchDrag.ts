import { useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { WorkbenchNode } from "../../core/types.ts";
import { useWorkbenchController } from "../WorkbenchProvider.tsx";
import { useWorkbenchSnap } from "./useWorkbenchSnap.ts";

export function useWorkbenchDrag<TData>(node: WorkbenchNode<TData>) {
  const controller = useWorkbenchController<TData>();
  const updateSnap = useWorkbenchSnap<TData>();

  return useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      controller.commands.focusNode(node.id);

      event.currentTarget.setPointerCapture(event.pointerId);
      controller.commands.setActiveDragNode(node.id);

      const origin = { x: event.clientX, y: event.clientY };
      const initialFrame = node.frame;

      const onPointerMove = (moveEvent: PointerEvent) => {
        const nextFrame = {
          ...initialFrame,
          x: initialFrame.x + moveEvent.clientX - origin.x,
          y: initialFrame.y + moveEvent.clientY - origin.y
        };
        updateSnap(
          { x: moveEvent.clientX, y: moveEvent.clientY },
          { edgeSnapEnabled: true }
        );
        controller.commands.dragNode(node.id, nextFrame);
      };

      const clearListeners = () => {
        controller.commands.setActiveDragNode(null);
        controller.commands.setActiveSnapTarget(null);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", finishDrag);
        window.removeEventListener("pointercancel", cancelDrag);
      };

      const finishDrag = (upEvent: PointerEvent) => {
        if (
          updateSnap(
            { x: upEvent.clientX, y: upEvent.clientY },
            { edgeSnapEnabled: true }
          ) !== null
        ) {
          controller.commands.applyActiveSnapTarget(node.id);
        }
        clearListeners();
      };

      const cancelDrag = () => {
        clearListeners();
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", finishDrag);
      window.addEventListener("pointercancel", cancelDrag);
    },
    [controller, node.frame, node.id, updateSnap]
  );
}
