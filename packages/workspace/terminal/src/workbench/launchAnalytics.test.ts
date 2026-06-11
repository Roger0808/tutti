import assert from "node:assert/strict";
import test from "node:test";
import type { WorkbenchHostLaunchRequest } from "@tutti-os/workbench-surface";
import { resolveTerminalLaunchAnalyticsTrigger } from "./launchAnalytics.ts";

test("terminal launch analytics trigger resolves from launch source", () => {
  const cases: Array<{
    expectedTrigger: string;
    request: WorkbenchHostLaunchRequest;
  }> = [
    {
      expectedTrigger: "dock",
      request: {
        dockEntryId: "workspace-terminal",
        reason: "dock",
        typeId: "workspace-terminal",
        workspaceId: "workspace-1"
      }
    },
    {
      expectedTrigger: "keyboard",
      request: {
        dockEntryId: "workspace-terminal",
        reason: "shortcut",
        typeId: "workspace-terminal",
        workspaceId: "workspace-1"
      }
    },
    {
      expectedTrigger: "launchpad",
      request: {
        dockEntryId: "workspace-terminal",
        payload: {},
        reason: "launchpad",
        typeId: "workspace-terminal",
        workspaceId: "workspace-1"
      }
    },
    {
      expectedTrigger: "agent_command",
      request: {
        payload: {
          initialInput: "pnpm test\n"
        },
        reason: "host",
        typeId: "workspace-terminal",
        workspaceId: "workspace-1"
      }
    }
  ];

  for (const { expectedTrigger, request } of cases) {
    assert.equal(
      resolveTerminalLaunchAnalyticsTrigger(request),
      expectedTrigger
    );
  }
});
