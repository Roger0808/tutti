import type { WorkbenchHostHandle } from "@tutti-os/workbench-surface";
import type { AgentProviderStatusService } from "@renderer/features/workspace-agent";
import { workspaceAgentGuiProviderFromIdentifier } from "./workspaceWorkbenchComposition.ts";

export interface WorkspaceAgentProviderDockActionInput {
  actionId: string;
  agentProviderStatusService: Pick<AgentProviderStatusService, "runAction">;
  entryId: string;
  host: WorkbenchHostHandle;
  workspaceId: string;
}

export async function runWorkspaceAgentProviderDockAction(
  input: WorkspaceAgentProviderDockActionInput
): Promise<void> {
  const provider = workspaceAgentGuiProviderFromIdentifier(input.entryId);
  if (!provider) {
    return;
  }
  await input.agentProviderStatusService.runAction(provider, input.actionId, {
    workbenchHost: input.host,
    workspaceId: input.workspaceId
  });
}
