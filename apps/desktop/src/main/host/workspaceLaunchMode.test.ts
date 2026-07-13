import assert from "node:assert/strict";
import test from "node:test";
import { resolveWorkspaceLaunchWindowKind } from "./workspaceLaunchMode.ts";

test("desktop startup creates the OS workspace by default", () => {
  assert.equal(resolveWorkspaceLaunchWindowKind({}), "workspace");
});

test("desktop startup creates an Agent window after an explicit override", () => {
  assert.equal(
    resolveWorkspaceLaunchWindowKind({
      "workspace.standaloneAgentMode": true
    }),
    "agent"
  );
});
