import assert from "node:assert/strict";
import test from "node:test";
import type {
  AgentActivitySessionStatus,
  AgentActivitySnapshot
} from "@tutti-os/agent-activity-core";
import { resolveWorkspaceAgentStatusPetMood } from "./workspaceAgentStatusPetMood.ts";

test("workspace agent status pet mood is idle when no sessions are active or waiting", () => {
  assert.equal(resolveWorkspaceAgentStatusPetMood(createSnapshot(), 0), "idle");
  assert.equal(
    resolveWorkspaceAgentStatusPetMood(
      createSnapshot(["completed", "canceled", "unknown"]),
      0
    ),
    "idle"
  );
});

test("workspace agent status pet mood prioritizes actionable states", () => {
  assert.equal(
    resolveWorkspaceAgentStatusPetMood(createSnapshot(["completed"]), 1),
    "waiting"
  );
  assert.equal(
    resolveWorkspaceAgentStatusPetMood(createSnapshot(["failed"]), 0),
    "failed"
  );
  assert.equal(
    resolveWorkspaceAgentStatusPetMood(createSnapshot(["working"]), 0),
    "running"
  );
  assert.equal(
    resolveWorkspaceAgentStatusPetMood(createSnapshot(["queued"]), 0),
    "review"
  );
});

function createSnapshot(
  statuses: AgentActivitySessionStatus[] = []
): AgentActivitySnapshot {
  return {
    workspaceId: "workspace-1",
    sessions: statuses.map((status, index) => ({
      agentSessionId: `session-${index + 1}`,
      cwd: "/tmp",
      provider: "codex",
      status,
      title: `Session ${index + 1}`,
      workspaceId: "workspace-1"
    })),
    presences: [],
    sessionMessagesById: {}
  };
}
