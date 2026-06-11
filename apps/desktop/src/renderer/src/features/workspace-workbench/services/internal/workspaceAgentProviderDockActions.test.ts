import assert from "node:assert/strict";
import test from "node:test";
import type { WorkbenchHostHandle } from "@tutti-os/workbench-surface";
import type { AgentProviderStatusService } from "@renderer/features/workspace-agent";
import { runWorkspaceAgentProviderDockAction } from "./workspaceAgentProviderDockActions.ts";
import { workspaceAgentGuiDockEntryId } from "./workspaceWorkbenchComposition.ts";

test("workspace agent provider dock action forwards to the status service", async () => {
  const forwardedActions: Array<{
    actionId: string;
    provider: string;
    workbenchHost: unknown;
    workspaceId: string | undefined;
  }> = [];
  const agentProviderStatusService = createAgentProviderStatusService({
    runAction: async (provider, actionId, context) => {
      forwardedActions.push({
        actionId,
        provider,
        workbenchHost: context?.workbenchHost,
        workspaceId: context?.workspaceId
      });
    }
  });
  const host = {
    launchNode: async () => null
  } as unknown as WorkbenchHostHandle;

  await runWorkspaceAgentProviderDockAction({
    actionId: "login",
    agentProviderStatusService,
    entryId: workspaceAgentGuiDockEntryId("codex"),
    host,
    workspaceId: "workspace-1"
  });

  assert.deepEqual(forwardedActions, [
    {
      actionId: "login",
      provider: "codex",
      workbenchHost: host,
      workspaceId: "workspace-1"
    }
  ]);
});

test("workspace agent provider dock action ignores non-agent dock entries", async () => {
  const forwardedActions: Array<{ actionId: string; provider: string }> = [];
  const agentProviderStatusService = createAgentProviderStatusService({
    runAction: async (provider, actionId) => {
      forwardedActions.push({ actionId, provider });
    }
  });

  await runWorkspaceAgentProviderDockAction({
    actionId: "login",
    agentProviderStatusService,
    entryId: "workspace-files",
    host: { launchNode: async () => null } as unknown as WorkbenchHostHandle,
    workspaceId: "workspace-1"
  });

  assert.deepEqual(forwardedActions, []);
});

function createAgentProviderStatusService(input: {
  runAction: AgentProviderStatusService["runAction"];
}): AgentProviderStatusService {
  return {
    _serviceBrand: undefined,
    getRevision: () => 0,
    getSnapshot: () => ({
      capturedAt: null,
      defaultProvider: null,
      error: null,
      isLoading: false,
      pendingActions: [],
      statuses: []
    }),
    getStatus: () => null,
    isActionPending: () => false,
    ensureLoaded: async () => null,
    refresh: async () => {},
    runAction: input.runAction,
    subscribe: () => () => {}
  };
}
