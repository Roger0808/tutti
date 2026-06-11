import { useEffect } from "react";
import { selectFocusedWorkbenchNode } from "../../core/selectors.ts";
import { useWorkbenchController } from "../WorkbenchProvider.tsx";

export function useWorkbenchShortcuts<TData = unknown>(enabled = true): void {
  const controller = useWorkbenchController<TData>();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      const focusedNode = selectFocusedWorkbenchNode(controller.getSnapshot());
      if (focusedNode?.displayMode === "fullscreen") {
        controller.commands.exitFullscreen(focusedNode.id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [controller, enabled]);
}
