import { afterEach, describe, expect, it } from "vitest";
import type { AgentActivityRuntime } from "../../../../../agentActivityRuntime";
import {
  resetAgentActivityRuntimeForTests,
  setAgentActivityRuntimeForTests
} from "../../../../../agentActivityRuntime";
import {
  getAgentSessionView,
  resetAgentSessionViewStoreForTests,
  watchAgentSession
} from "./agentSessionViewStore";

describe("agentSessionViewStore", () => {
  afterEach(() => {
    resetAgentSessionViewStoreForTests();
    resetAgentActivityRuntimeForTests();
  });

  it("does not request durable control-state refreshes for inline state patches", async () => {
    let streamListener: ((event: unknown) => void) | undefined;
    setAgentActivityRuntimeForTests({
      retainSessionEvents: () => () => {},
      subscribeSessionEvents: (_workspaceId, listener) => {
        streamListener = listener;
        return () => {};
      }
    } as Partial<AgentActivityRuntime> as AgentActivityRuntime);

    const release = watchAgentSession({
      workspaceId: "workspace-1",
      agentSessionId: "agent-session-1"
    });

    const listener = streamListener;
    expect(listener).toBeDefined();
    listener?.({
      eventType: "state_patch",
      data: {
        workspaceId: "workspace-1",
        agentSessionId: "agent-session-1",
        lifecycleStatus: "running",
        occurredAtUnixMs: 1717200001000
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 200));

    const view = getAgentSessionView({
      workspaceId: "workspace-1",
      agentSessionId: "agent-session-1"
    });
    expect(view?.isLive).toBe(true);
    expect(view?.lastEventAt).toBe(1717200001000);
    expect(view?.controlStateRefreshRevision).toBe(0);

    release();
  });
});
