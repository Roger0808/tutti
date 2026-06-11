import type { DesktopAgentComposerDefaults } from "@shared/preferences";
import type {
  DesktopAgentGUIComposerOverrides,
  DesktopAgentGUINodeState,
  DesktopAgentGUIProvider
} from "../../desktopAgentGUINodeState.ts";

export interface DesktopAgentComposerDefaultsWriteIntent {
  defaults: DesktopAgentComposerDefaults;
  provider: DesktopAgentGUIProvider;
}

export function desktopAgentComposerOverridesToDefaults(
  overrides: DesktopAgentGUIComposerOverrides
): DesktopAgentComposerDefaults | null {
  const defaults: DesktopAgentComposerDefaults = {};
  if (overrides.model?.trim()) {
    defaults.model = overrides.model.trim();
  }
  if (overrides.permissionModeId?.trim()) {
    defaults.permissionModeId = overrides.permissionModeId.trim();
  }
  if (overrides.reasoningEffort?.trim()) {
    defaults.reasoningEffort = overrides.reasoningEffort.trim();
  }
  return Object.keys(defaults).length > 0 ? defaults : null;
}

export function desktopAgentComposerDefaultsEqual(
  left: DesktopAgentComposerDefaults | null | undefined,
  right: DesktopAgentComposerDefaults | null | undefined
): boolean {
  return (
    normalizedDesktopAgentComposerDefaultValue(left?.model) ===
      normalizedDesktopAgentComposerDefaultValue(right?.model) &&
    normalizedDesktopAgentComposerDefaultValue(left?.permissionModeId) ===
      normalizedDesktopAgentComposerDefaultValue(right?.permissionModeId) &&
    normalizedDesktopAgentComposerDefaultValue(left?.reasoningEffort) ===
      normalizedDesktopAgentComposerDefaultValue(right?.reasoningEffort)
  );
}

export function normalizedDesktopAgentComposerDefaultValue(
  value: string | null | undefined
): string {
  return value?.trim() ?? "";
}

export function resolveDesktopAgentComposerDefaultsWriteIntent(
  current: DesktopAgentGUINodeState,
  next: DesktopAgentGUINodeState
): DesktopAgentComposerDefaultsWriteIntent | null | undefined {
  const currentDefaults = desktopAgentComposerDefaultsFromNodeState(current);
  const nextDefaults = desktopAgentComposerDefaultsFromNodeState(next);
  if (desktopAgentComposerDefaultsEqual(currentDefaults, nextDefaults)) {
    return undefined;
  }
  return nextDefaults
    ? {
        defaults: nextDefaults,
        provider: next.provider
      }
    : null;
}

export function shouldRememberDesktopAgentComposerDefaults(input: {
  defaults: DesktopAgentComposerDefaults | null;
  pendingWrite: DesktopAgentComposerDefaultsWriteIntent | null;
  provider: DesktopAgentGUIProvider;
}): boolean {
  return Boolean(
    input.defaults &&
    input.pendingWrite &&
    input.pendingWrite.provider === input.provider &&
    desktopAgentComposerDefaultsEqual(
      input.pendingWrite.defaults,
      input.defaults
    )
  );
}

function desktopAgentComposerDefaultsFromNodeState(
  state: DesktopAgentGUINodeState
): DesktopAgentComposerDefaults | null {
  const settings =
    state.composerOverridesByProvider?.[state.provider] ??
    state.composerOverrides ??
    null;
  return settings ? desktopAgentComposerOverridesToDefaults(settings) : null;
}
