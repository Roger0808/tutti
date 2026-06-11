import { useSyncExternalStore } from "react";
import { mergeAgentActivityMessages } from "@tutti-os/agent-activity-core";
import type {
  AgentHostAgentActivityStreamEvent,
  AgentHostAgentSessionCommand,
  AgentHostAgentSessionState,
  AgentHostSubscribeAgentSessionEventsInput
} from "../../../../../shared/contracts/dto";
import type { WorkspaceAgentActivityMessage } from "../../../../../shared/workspaceAgentActivityTypes";
import { getOptionalAgentActivityRuntime } from "../../../../../agentActivityRuntime";

const STREAM_LINGER_MS = 15000;

export interface AgentSessionViewRef {
  workspaceId: string | null | undefined;
  agentSessionId: string | null | undefined;
}

export interface AgentSessionView extends Required<
  Pick<AgentSessionViewRef, "workspaceId" | "agentSessionId">
> {
  sessionKey: string;
  overlayMessages: WorkspaceAgentActivityMessage[];
  controlCommands: AgentHostAgentSessionCommand[];
  controlState: AgentHostAgentSessionState | null;
  lastEventAt: number | null;
  isLive: boolean;
  isLoadingControlState: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  watcherCount: number;
  controlStateRefreshRevision: number;
}

export interface AgentSessionOverlayMessageHydrationEntry extends Required<
  Pick<AgentSessionViewRef, "workspaceId" | "agentSessionId">
> {
  overlayMessages: readonly WorkspaceAgentActivityMessage[];
}

export interface AgentSessionViewStoreSnapshot {
  sessionViewsBySessionKey: Record<string, AgentSessionView>;
}

type AgentSessionViewStoreListener = () => void;
type AgentSessionActivityStreamListener = (
  event: AgentHostAgentActivityStreamEvent
) => void;

interface NormalizedAgentSessionViewRef {
  sessionKey: string;
  workspaceId: string;
  agentSessionId: string;
}

interface AgentSessionActivityStreamPayload {
  workspaceId: string | null | undefined;
  agentSessionId: string;
}

type NormalizedAgentSessionActivityStreamPayload = Required<
  Pick<AgentHostSubscribeAgentSessionEventsInput, "agentSessionId">
> & {
  workspaceId: string;
};

interface AgentSessionActivityStreamEntry {
  key: string;
  payload: NormalizedAgentSessionActivityStreamPayload;
  listeners: Set<AgentSessionActivityStreamListener>;
  lingerTimer: ReturnType<typeof setTimeout> | null;
  releaseRuntimeEvents: (() => void) | null;
  retainPromise: Promise<void> | null;
}

const EMPTY_AGENT_SESSION_VIEW_STORE_SNAPSHOT: AgentSessionViewStoreSnapshot = {
  sessionViewsBySessionKey: {}
};

let snapshot = EMPTY_AGENT_SESSION_VIEW_STORE_SNAPSHOT;
const storeListeners = new Set<AgentSessionViewStoreListener>();
let ignoreEmptyViewUpdatesAfterTestReset = false;
const activityStreamEntries = new Map<
  string,
  AgentSessionActivityStreamEntry
>();
const runtimeSessionEventUnsubscribeByWorkspaceId = new Map<
  string,
  () => void
>();

export function useAgentSessionViewStoreSnapshot(): AgentSessionViewStoreSnapshot {
  return useSyncExternalStore(
    subscribeAgentSessionViewStore,
    getAgentSessionViewStoreSnapshot,
    getAgentSessionViewStoreSnapshot
  );
}

export function getAgentSessionViewStoreSnapshot(): AgentSessionViewStoreSnapshot {
  return snapshot;
}

export function createAgentSessionViewKey(
  ref: AgentSessionViewRef
): string | null {
  return normalizeAgentSessionViewRef(ref)?.sessionKey ?? null;
}

export function getAgentSessionView(
  ref: AgentSessionViewRef
): AgentSessionView | null {
  const normalized = normalizeAgentSessionViewRef(ref);
  if (!normalized) {
    return null;
  }
  return snapshot.sessionViewsBySessionKey[normalized.sessionKey] ?? null;
}

export function useAgentSessionView(
  ref: AgentSessionViewRef
): AgentSessionView | null {
  const sessionKey = createAgentSessionViewKey(ref);
  return useSyncExternalStore(
    subscribeAgentSessionViewStore,
    () =>
      sessionKey
        ? (snapshot.sessionViewsBySessionKey[sessionKey] ?? null)
        : null,
    () =>
      sessionKey
        ? (snapshot.sessionViewsBySessionKey[sessionKey] ?? null)
        : null
  );
}

export function watchAgentSession(
  payload: AgentSessionActivityStreamPayload,
  options: { onEvent?: AgentSessionActivityStreamListener } = {}
): () => void {
  const normalizedPayload = normalizeSubscribePayload(payload);
  if (!normalizedPayload) {
    return () => {};
  }
  const key = activityStreamKey(normalizedPayload);
  let entry = activityStreamEntries.get(key);
  if (!entry) {
    entry = {
      key,
      payload: normalizedPayload,
      listeners: new Set<AgentSessionActivityStreamListener>(),
      lingerTimer: null,
      releaseRuntimeEvents: null,
      retainPromise: null
    };
    activityStreamEntries.set(key, entry);
  }
  clearEntryLingerTimer(entry);
  if (options.onEvent) {
    entry.listeners.add(options.onEvent);
  }
  ignoreEmptyViewUpdatesAfterTestReset = false;
  updateAgentSessionView(normalizedPayload, (current) => ({
    ...current,
    watcherCount: current.watcherCount + 1,
    error: null
  }));
  ensureWorkspaceSessionEventListener(normalizedPayload.workspaceId);
  ensureActivityStreamUpstream(entry);
  return () => {
    const currentEntry = activityStreamEntries.get(key);
    if (!currentEntry) {
      return;
    }
    if (options.onEvent) {
      currentEntry.listeners.delete(options.onEvent);
    }
    updateAgentSessionView(normalizedPayload, (current) => ({
      ...current,
      watcherCount: Math.max(0, current.watcherCount - 1)
    }));
    const currentView = getAgentSessionView(normalizedPayload);
    if ((currentView?.watcherCount ?? 0) > 0) {
      return;
    }
    scheduleEntryStop(currentEntry);
  };
}

export function watchAgentSessionActivityStream(
  payload: AgentSessionActivityStreamPayload,
  listener: AgentSessionActivityStreamListener
): () => void {
  return watchAgentSession(payload, { onEvent: listener });
}

export function mergeAgentSessionViewOverlayMessages(
  ref: AgentSessionViewRef,
  nextMessages: readonly WorkspaceAgentActivityMessage[]
): void {
  const normalized = normalizeAgentSessionViewRef(ref);
  if (!normalized || nextMessages.length === 0) {
    return;
  }
  updateAgentSessionView(normalized, (current) => {
    const overlayMessages = mergeMessages(
      current.overlayMessages,
      nextMessages
    );
    if (sameMessages(current.overlayMessages, overlayMessages)) {
      return current;
    }
    return {
      ...current,
      overlayMessages
    };
  });
}

export function setAgentSessionViewOverlayMessages(
  ref: AgentSessionViewRef,
  nextMessages: readonly WorkspaceAgentActivityMessage[]
): void {
  const normalized = normalizeAgentSessionViewRef(ref);
  if (!normalized) {
    return;
  }
  updateAgentSessionView(normalized, (current) => {
    const overlayMessages = mergeMessages([], nextMessages);
    if (sameMessages(current.overlayMessages, overlayMessages)) {
      return current;
    }
    return {
      ...current,
      overlayMessages
    };
  });
}

export function hydrateAgentSessionViewOverlayMessages(
  entries: readonly AgentSessionOverlayMessageHydrationEntry[]
): void {
  let didChange = false;
  let nextSnapshot = snapshot;
  for (const entry of entries) {
    const normalized = normalizeAgentSessionViewRef(entry);
    if (!normalized) {
      continue;
    }
    const current =
      nextSnapshot.sessionViewsBySessionKey[normalized.sessionKey] ??
      createEmptySessionView(normalized);
    const nextOverlayMessages = mergeMessages([], entry.overlayMessages);
    if (sameMessages(current.overlayMessages, nextOverlayMessages)) {
      continue;
    }
    nextSnapshot = {
      sessionViewsBySessionKey: {
        ...nextSnapshot.sessionViewsBySessionKey,
        [normalized.sessionKey]: {
          ...current,
          overlayMessages: nextOverlayMessages
        }
      }
    };
    didChange = true;
  }
  if (didChange) {
    snapshot = nextSnapshot;
    emitAgentSessionViewStoreChange();
  }
}

export function setAgentSessionViewControlCommands(
  ref: AgentSessionViewRef,
  commands: readonly AgentHostAgentSessionCommand[]
): void {
  const normalized = normalizeAgentSessionViewRef(ref);
  if (!normalized) {
    return;
  }
  updateAgentSessionView(normalized, (current) => ({
    ...current,
    controlCommands: [...commands]
  }));
}

export function setAgentSessionViewControlState(
  ref: AgentSessionViewRef,
  controlState: AgentHostAgentSessionState | null
): void {
  const normalized = normalizeAgentSessionViewRef(ref);
  if (!normalized) {
    return;
  }
  updateAgentSessionView(normalized, (current) => ({
    ...current,
    controlState
  }));
}

export function updateAgentSessionViewControlState(
  ref: AgentSessionViewRef,
  updater: (
    current: AgentHostAgentSessionState | null
  ) => AgentHostAgentSessionState | null
): void {
  const normalized = normalizeAgentSessionViewRef(ref);
  if (!normalized) {
    return;
  }
  updateAgentSessionView(normalized, (current) => ({
    ...current,
    controlState: updater(current.controlState)
  }));
}

export function setAgentSessionViewControlStateLoading(
  ref: AgentSessionViewRef,
  isLoadingControlState: boolean
): void {
  const normalized = normalizeAgentSessionViewRef(ref);
  if (!normalized) {
    return;
  }
  updateAgentSessionView(normalized, (current) => ({
    ...current,
    isLoadingControlState
  }));
}

export function setAgentSessionViewMessagesLoading(
  ref: AgentSessionViewRef,
  isLoadingMessages: boolean
): void {
  const normalized = normalizeAgentSessionViewRef(ref);
  if (!normalized) {
    return;
  }
  updateAgentSessionView(normalized, (current) => ({
    ...current,
    isLoadingMessages
  }));
}

export function setAgentSessionViewError(
  ref: AgentSessionViewRef,
  error: string | null
): void {
  const normalized = normalizeAgentSessionViewRef(ref);
  if (!normalized) {
    return;
  }
  updateAgentSessionView(normalized, (current) => ({
    ...current,
    error
  }));
}

export function deleteAgentSessionView(ref: AgentSessionViewRef): void {
  const normalized = normalizeAgentSessionViewRef(ref);
  if (
    !normalized ||
    !(normalized.sessionKey in snapshot.sessionViewsBySessionKey)
  ) {
    return;
  }
  const nextSessionViewsBySessionKey = { ...snapshot.sessionViewsBySessionKey };
  delete nextSessionViewsBySessionKey[normalized.sessionKey];
  snapshot = {
    sessionViewsBySessionKey: nextSessionViewsBySessionKey
  };
  emitAgentSessionViewStoreChange();
}

export function getAgentSessionActivityStreamStateForTests(): Array<{
  key: string;
  listenerCount: number;
  hasUpstreamSubscription: boolean;
  isLingering: boolean;
  leaseId: string | null;
}> {
  return [...activityStreamEntries.values()].map((entry) => ({
    key: entry.key,
    listenerCount: entry.listeners.size,
    hasUpstreamSubscription:
      entry.releaseRuntimeEvents !== null || entry.retainPromise !== null,
    isLingering: entry.lingerTimer !== null,
    leaseId: null
  }));
}

export function resetAgentSessionViewStoreForTests(): void {
  for (const unsubscribe of runtimeSessionEventUnsubscribeByWorkspaceId.values()) {
    unsubscribe();
  }
  runtimeSessionEventUnsubscribeByWorkspaceId.clear();
  for (const entry of activityStreamEntries.values()) {
    clearEntryLingerTimer(entry);
    entry.releaseRuntimeEvents?.();
  }
  activityStreamEntries.clear();
  snapshot = EMPTY_AGENT_SESSION_VIEW_STORE_SNAPSHOT;
  ignoreEmptyViewUpdatesAfterTestReset = true;
  emitAgentSessionViewStoreChange();
}

function subscribeAgentSessionViewStore(
  listener: AgentSessionViewStoreListener
): () => void {
  ignoreEmptyViewUpdatesAfterTestReset = false;
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

function updateAgentSessionView(
  ref: AgentSessionViewRef,
  updater: (current: AgentSessionView) => AgentSessionView
): void {
  const normalized = normalizeAgentSessionViewRef(ref);
  if (!normalized) {
    return;
  }
  const current =
    snapshot.sessionViewsBySessionKey[normalized.sessionKey] ??
    (ignoreEmptyViewUpdatesAfterTestReset
      ? null
      : createEmptySessionView(normalized));
  if (!current) {
    return;
  }
  const next = updater(current);
  if (next === current) {
    return;
  }
  snapshot = {
    sessionViewsBySessionKey: {
      ...snapshot.sessionViewsBySessionKey,
      [normalized.sessionKey]: next
    }
  };
  emitAgentSessionViewStoreChange();
}

function emitAgentSessionViewStoreChange(): void {
  for (const listener of storeListeners) {
    listener();
  }
}

function ensureWorkspaceSessionEventListener(workspaceId: string): void {
  const normalizedWorkspaceId = workspaceId.trim();
  if (!normalizedWorkspaceId) {
    return;
  }
  if (runtimeSessionEventUnsubscribeByWorkspaceId.has(normalizedWorkspaceId)) {
    return;
  }
  const runtime = getOptionalAgentActivityRuntime();
  if (!runtime) {
    return;
  }
  const unsubscribe = runtime.subscribeSessionEvents(
    normalizedWorkspaceId,
    (event) => {
      if (!isAgentSessionActivityStreamEvent(event)) {
        return;
      }
      const entries = findEntriesForEvent(event);
      if (entries.length === 0) {
        return;
      }
      for (const entry of entries) {
        recordAgentSessionStreamEvent(entry, event);
        for (const listener of entry.listeners) {
          listener(event);
        }
      }
    }
  );
  runtimeSessionEventUnsubscribeByWorkspaceId.set(
    normalizedWorkspaceId,
    unsubscribe
  );
}

function ensureActivityStreamUpstream(
  entry: AgentSessionActivityStreamEntry
): void {
  if (entry.releaseRuntimeEvents || entry.retainPromise) {
    return;
  }
  const runtime = getOptionalAgentActivityRuntime();
  if (runtime) {
    try {
      const ensureSessionSynchronized =
        runtime.ensureSessionSynchronized ?? runtime.retainSessionEvents;
      entry.releaseRuntimeEvents = ensureSessionSynchronized({
        workspaceId: entry.payload.workspaceId,
        agentSessionId: entry.payload.agentSessionId,
        onError: (error) => {
          updateAgentSessionView(entry.payload, (current) => ({
            ...current,
            isLive: false,
            error: error instanceof Error ? error.message : String(error)
          }));
        }
      });
      updateAgentSessionView(entry.payload, (current) => ({
        ...current,
        isLive: true,
        error: null
      }));
    } catch (error) {
      updateAgentSessionView(entry.payload, (current) => ({
        ...current,
        isLive: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
    return;
  }
}

function scheduleEntryStop(entry: AgentSessionActivityStreamEntry): void {
  clearEntryLingerTimer(entry);
  entry.lingerTimer = setTimeout(() => {
    entry.lingerTimer = null;
    const currentEntry = activityStreamEntries.get(entry.key);
    if (!currentEntry) {
      return;
    }
    const watcherCount =
      getAgentSessionView(currentEntry.payload)?.watcherCount ?? 0;
    if (watcherCount > 0) {
      return;
    }
    currentEntry.releaseRuntimeEvents?.();
    currentEntry.releaseRuntimeEvents = null;
    activityStreamEntries.delete(currentEntry.key);
    updateAgentSessionView(currentEntry.payload, (current) => ({
      ...current,
      isLive: false
    }));
  }, STREAM_LINGER_MS);
}

function clearEntryLingerTimer(entry: AgentSessionActivityStreamEntry): void {
  if (entry.lingerTimer === null) {
    return;
  }
  clearTimeout(entry.lingerTimer);
  entry.lingerTimer = null;
}

function normalizeSubscribePayload(
  payload: AgentSessionActivityStreamPayload
): NormalizedAgentSessionActivityStreamPayload | null {
  const workspaceId = payload.workspaceId?.trim();
  const agentSessionId = payload.agentSessionId.trim();
  if (!workspaceId || !agentSessionId) {
    return null;
  }
  return {
    workspaceId,
    agentSessionId
  };
}

function normalizeAgentSessionViewRef(
  ref: AgentSessionViewRef
): NormalizedAgentSessionViewRef | null {
  const workspaceId = ref.workspaceId?.trim();
  const agentSessionId = ref.agentSessionId?.trim();
  if (!workspaceId || !agentSessionId) {
    return null;
  }
  return {
    workspaceId,
    agentSessionId,
    sessionKey: activityStreamKey({ workspaceId, agentSessionId })
  };
}

function activityStreamKey(
  payload: Pick<NormalizedAgentSessionViewRef, "workspaceId" | "agentSessionId">
): string {
  return `${payload.workspaceId}:${payload.agentSessionId}`;
}

function findEntriesForEvent(
  event: AgentHostAgentActivityStreamEvent
): AgentSessionActivityStreamEntry[] {
  const agentSessionId = event.data.agentSessionId?.trim();
  if (!agentSessionId) {
    return [];
  }
  const eventWorkspaceId =
    "workspaceId" in event.data && typeof event.data.workspaceId === "string"
      ? event.data.workspaceId.trim()
      : null;
  if (eventWorkspaceId) {
    const exactEntry = activityStreamEntries.get(
      `${eventWorkspaceId}:${agentSessionId}`
    );
    return exactEntry ? [exactEntry] : [];
  }
  return [...activityStreamEntries.values()].filter(
    (entry) => entry.payload.agentSessionId === agentSessionId
  );
}

function recordAgentSessionStreamEvent(
  entry: AgentSessionActivityStreamEntry,
  event: AgentHostAgentActivityStreamEvent
): void {
  const occurredAtUnixMs =
    "occurredAtUnixMs" in event.data &&
    typeof event.data.occurredAtUnixMs === "number"
      ? event.data.occurredAtUnixMs
      : Date.now();
  updateAgentSessionView(entry.payload, (current) => {
    let next = current;
    if (event.eventType === "available_commands_update") {
      next = {
        ...next,
        controlCommands: [...event.data.commands]
      };
    }
    return {
      ...next,
      lastEventAt: occurredAtUnixMs,
      isLive: true,
      error: null
    };
  });
}

function isAgentSessionActivityStreamEvent(
  value: unknown
): value is AgentHostAgentActivityStreamEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const eventType = (value as { eventType?: unknown }).eventType;
  if (
    eventType !== "message_update" &&
    eventType !== "state_patch" &&
    eventType !== "available_commands_update" &&
    eventType !== "config_options_update"
  ) {
    return false;
  }
  const data = (value as { data?: unknown }).data;
  return !!data && typeof data === "object";
}

function createEmptySessionView(
  ref: NormalizedAgentSessionViewRef
): AgentSessionView {
  return {
    sessionKey: ref.sessionKey,
    workspaceId: ref.workspaceId,
    agentSessionId: ref.agentSessionId,
    overlayMessages: [],
    controlCommands: [],
    controlState: null,
    lastEventAt: null,
    isLive: false,
    isLoadingControlState: false,
    isLoadingMessages: false,
    error: null,
    watcherCount: 0,
    controlStateRefreshRevision: 0
  };
}

function mergeMessages(
  left: readonly WorkspaceAgentActivityMessage[],
  right: readonly WorkspaceAgentActivityMessage[]
): WorkspaceAgentActivityMessage[] {
  return mergeAgentActivityMessages(left, right);
}

function sameMessages(
  left: readonly WorkspaceAgentActivityMessage[],
  right: readonly WorkspaceAgentActivityMessage[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((item, index) =>
    equivalentMessageValue(item, right[index]!)
  );
}

function equivalentMessageValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (typeof left !== typeof right || left === null || right === null) {
    return false;
  }
  if (typeof left !== "object") {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (
      !Array.isArray(left) ||
      !Array.isArray(right) ||
      left.length !== right.length
    ) {
      return false;
    }
    return left.every((item, index) =>
      equivalentMessageValue(item, right[index])
    );
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord);
  if (leftKeys.length !== Object.keys(rightRecord).length) {
    return false;
  }
  return leftKeys.every(
    (key) =>
      Object.hasOwn(rightRecord, key) &&
      equivalentMessageValue(leftRecord[key], rightRecord[key])
  );
}
