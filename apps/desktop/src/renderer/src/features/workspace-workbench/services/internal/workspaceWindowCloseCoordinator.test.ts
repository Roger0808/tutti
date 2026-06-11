import assert from "node:assert/strict";
import test from "node:test";
import type { WorkbenchHostHandle } from "@tutti-os/workbench-surface";
import { createWindowCloseRequestTracker } from "../windowCloseRequestTracker.ts";
import type { WorkspaceWorkbenchHostInput } from "../workspaceWorkbenchHostService.interface.ts";
import { confirmWorkspaceWindowClose } from "./workspaceWindowCloseCoordinator.ts";

test("confirmWorkspaceWindowClose stops when the close effect dialog is cancelled", async () => {
  let approvedCloseCount = 0;
  let prepareCount = 0;
  const hostInput: WorkspaceWorkbenchHostInput = {
    createWindowCloseDialogRequest: () => ({
      cancelLabel: "Cancel",
      confirmLabel: "Close",
      description: "There is work running.",
      scope: "window",
      title: "Close window?"
    }),
    prepareHostClose: async () => {
      prepareCount += 1;
      return true;
    },
    snapshotRepository: {} as never,
    workspaceId: "workspace-1"
  };

  await confirmWorkspaceWindowClose({
    confirmCloseGuard: async () => false,
    host: createWorkbenchHostHandleStub(),
    hostInput,
    requestApprovedClose: async () => {
      approvedCloseCount += 1;
    },
    tracker: createWindowCloseRequestTracker()
  });

  assert.equal(prepareCount, 0);
  assert.equal(approvedCloseCount, 0);
});

test("confirmWorkspaceWindowClose does not prepare host close before approving window close", async () => {
  let approvedCloseCount = 0;
  const preparedWorkspaceIds: string[] = [];
  const hostInput: WorkspaceWorkbenchHostInput = {
    prepareHostClose: async ({ workspaceId }) => {
      preparedWorkspaceIds.push(workspaceId);
      return false;
    },
    snapshotRepository: {} as never,
    workspaceId: "workspace-2"
  };

  await confirmWorkspaceWindowClose({
    confirmCloseGuard: async () => true,
    host: createWorkbenchHostHandleStub(),
    hostInput,
    requestApprovedClose: async () => {
      approvedCloseCount += 1;
    },
    tracker: createWindowCloseRequestTracker()
  });

  assert.deepEqual(preparedWorkspaceIds, []);
  assert.equal(approvedCloseCount, 1);
});

test("confirmWorkspaceWindowClose approves window close without stopping workspace apps", async () => {
  const events: string[] = [];
  const hostInput: WorkspaceWorkbenchHostInput = {
    createWindowCloseDialogRequest: () => ({
      cancelLabel: "Cancel",
      confirmLabel: "Close",
      description: "There is work running.",
      scope: "window",
      title: "Close window?"
    }),
    prepareHostClose: async ({ workspaceId }) => {
      events.push(`prepare:${workspaceId}`);
      return true;
    },
    snapshotRepository: {} as never,
    workspaceId: "workspace-3"
  };

  await confirmWorkspaceWindowClose({
    confirmCloseGuard: async () => {
      events.push("confirm");
      return true;
    },
    host: createWorkbenchHostHandleStub(),
    hostInput,
    requestApprovedClose: async () => {
      events.push("approve");
    },
    tracker: createWindowCloseRequestTracker()
  });

  assert.deepEqual(events, ["confirm", "approve"]);
});

function createWorkbenchHostHandleStub(): WorkbenchHostHandle {
  return {
    activateNode() {
      return undefined;
    },
    closeNode() {
      return undefined;
    },
    collectWindowCloseEffects: async () => [
      {
        nodeId: "node-1",
        title: "Terminal",
        typeId: "workspace-terminal"
      }
    ],
    dispose() {
      return undefined;
    },
    exitFullscreenNode() {
      return undefined;
    },
    focusNode() {
      return undefined;
    },
    getSnapshot() {
      return {} as never;
    },
    launchNode: async () => null,
    load: async () => undefined,
    reconcileProjectedNodes() {
      return undefined;
    },
    requestNodeClose() {
      return undefined;
    },
    setNodeRuntimeState() {
      return undefined;
    },
    setNodeSizeConstraints() {
      return undefined;
    },
    setSnapshotNodeState() {
      return undefined;
    },
    setNodeTitle() {
      return undefined;
    }
  };
}
