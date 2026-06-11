import type { WorkbenchHostNodeBodyContext } from "@tutti-os/workbench-surface";
import type { TerminalNodeExternalState } from "../contracts/index.ts";
import type { TerminalNodeFeature } from "../core/feature.ts";

export interface TerminalWorkbenchBodyProps {
  externalState: TerminalNodeExternalState | null;
  feature: TerminalNodeFeature;
  nodeId: string;
  onFocusRequest?: () => void;
  sessionId: string | null;
  showHeader: boolean;
}

export function resolveTerminalWorkbenchBodyProps({
  context,
  feature
}: {
  context: WorkbenchHostNodeBodyContext<
    TerminalNodeExternalState | null,
    unknown
  >;
  feature: TerminalNodeFeature;
}): TerminalWorkbenchBodyProps {
  // Keep this resolver narrower than TerminalNodeProps on purpose. The workbench
  // lease keeps the session alive while the node exists, but the mounted surface
  // must still retain the controller so snapshot hydration starts immediately.
  // Passing controllerLeaseRetainedExternally here makes a newly opened terminal
  // render blank until the first user input triggers controller.write().
  return {
    externalState: context.externalNodeState,
    feature,
    nodeId: context.node.id,
    onFocusRequest: context.isFocused ? undefined : () => context.focus(),
    sessionId: context.node.data.instanceKey ?? null,
    showHeader: false
  };
}
