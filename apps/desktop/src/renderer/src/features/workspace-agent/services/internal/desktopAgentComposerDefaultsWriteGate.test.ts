import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultDesktopAgentGUINodeState } from "../../desktopAgentGUINodeState.ts";
import {
  resolveDesktopAgentComposerDefaultsWriteIntent,
  shouldRememberDesktopAgentComposerDefaults,
  type DesktopAgentComposerDefaultsWriteIntent
} from "./desktopAgentComposerDefaultsWriteGate.ts";

test("resolveDesktopAgentComposerDefaultsWriteIntent captures user composer setting changes", () => {
  const current = {
    ...createDefaultDesktopAgentGUINodeState("codex"),
    composerOverrides: {
      permissionModeId: "auto",
      reasoningEffort: "high"
    }
  };
  const next = {
    ...current,
    composerOverrides: {
      permissionModeId: "read-only",
      reasoningEffort: "high"
    }
  };

  assert.deepEqual(
    resolveDesktopAgentComposerDefaultsWriteIntent(current, next),
    {
      defaults: {
        permissionModeId: "read-only",
        reasoningEffort: "high"
      },
      provider: "codex"
    }
  );
});

test("resolveDesktopAgentComposerDefaultsWriteIntent ignores non-composer state changes", () => {
  const current = {
    ...createDefaultDesktopAgentGUINodeState("codex"),
    composerOverrides: {
      permissionModeId: "auto"
    },
    conversationRailCollapsed: false
  };
  const next = {
    ...current,
    conversationRailCollapsed: true
  };

  assert.equal(
    resolveDesktopAgentComposerDefaultsWriteIntent(current, next),
    undefined
  );
});

test("shouldRememberDesktopAgentComposerDefaults accepts only the pending user write", () => {
  const pendingWrite: DesktopAgentComposerDefaultsWriteIntent = {
    defaults: {
      permissionModeId: "read-only",
      reasoningEffort: "high"
    },
    provider: "codex"
  };

  assert.equal(
    shouldRememberDesktopAgentComposerDefaults({
      defaults: {
        permissionModeId: "read-only",
        reasoningEffort: "high"
      },
      pendingWrite,
      provider: "codex"
    }),
    true
  );
});

test("shouldRememberDesktopAgentComposerDefaults rejects stale preference replay", () => {
  const pendingWrite: DesktopAgentComposerDefaultsWriteIntent = {
    defaults: {
      permissionModeId: "read-only",
      reasoningEffort: "high"
    },
    provider: "codex"
  };

  assert.equal(
    shouldRememberDesktopAgentComposerDefaults({
      defaults: {
        permissionModeId: "auto",
        reasoningEffort: "high"
      },
      pendingWrite,
      provider: "codex"
    }),
    false
  );
});

test("shouldRememberDesktopAgentComposerDefaults rejects provider mismatch", () => {
  const pendingWrite: DesktopAgentComposerDefaultsWriteIntent = {
    defaults: {
      permissionModeId: "read-only"
    },
    provider: "codex"
  };

  assert.equal(
    shouldRememberDesktopAgentComposerDefaults({
      defaults: {
        permissionModeId: "read-only"
      },
      pendingWrite,
      provider: "gemini"
    }),
    false
  );
});
