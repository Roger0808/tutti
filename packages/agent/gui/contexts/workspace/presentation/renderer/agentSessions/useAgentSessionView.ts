import { useEffect, useMemo, useRef } from "react";
import type { AgentHostAgentActivityStreamEvent } from "../../../../../shared/contracts/dto";
import {
  createAgentSessionViewKey,
  getAgentSessionView,
  type AgentSessionView,
  watchAgentSession,
  type AgentSessionViewRef,
  useAgentSessionView as useStoreAgentSessionView
} from "./agentSessionViewStore";

export { getAgentSessionView };

export function useAgentSessionView(ref: AgentSessionViewRef) {
  return useStoreAgentSessionView(ref);
}

export function useWatchAgentSession(input: {
  workspaceId: string;
  agentSessionId: string | null | undefined;
  enabled?: boolean;
  onEvent?: (event: AgentHostAgentActivityStreamEvent) => void;
  onSubscribe?: () => void;
  onCleanup?: () => void;
}) {
  const onEventRef = useRef(input.onEvent);
  const onSubscribeRef = useRef(input.onSubscribe);
  const onCleanupRef = useRef(input.onCleanup);

  useEffect(() => {
    onEventRef.current = input.onEvent;
    onSubscribeRef.current = input.onSubscribe;
    onCleanupRef.current = input.onCleanup;
  }, [input.onCleanup, input.onEvent, input.onSubscribe]);

  useEffect(() => {
    const workspaceId = input.workspaceId.trim();
    const agentSessionId = input.agentSessionId?.trim();
    if (!input.enabled || !workspaceId || !agentSessionId) {
      return undefined;
    }
    onSubscribeRef.current?.();
    const unsubscribe = watchAgentSession(
      { workspaceId, agentSessionId },
      {
        onEvent: (event) => {
          onEventRef.current?.(event);
        }
      }
    );
    return () => {
      onCleanupRef.current?.();
      unsubscribe();
    };
  }, [input.agentSessionId, input.enabled, input.workspaceId]);
}

export function useWatchAgentSessions(input: {
  workspaceId: string;
  agentSessionIds: readonly string[];
  enabled?: boolean;
  onEvent?: (event: AgentHostAgentActivityStreamEvent) => void;
}) {
  const onEventRef = useRef(input.onEvent);
  const agentSessionIdsKey = JSON.stringify(
    [...new Set(input.agentSessionIds.map((id) => id.trim()))]
      .filter(Boolean)
      .sort()
  );

  useEffect(() => {
    onEventRef.current = input.onEvent;
  }, [input.onEvent]);

  useEffect(() => {
    const workspaceId = input.workspaceId.trim();
    if (!input.enabled || !workspaceId) {
      return undefined;
    }
    const uniqueAgentSessionIds = JSON.parse(agentSessionIdsKey) as string[];
    if (uniqueAgentSessionIds.length === 0) {
      return undefined;
    }
    const unsubscribes = uniqueAgentSessionIds.map((agentSessionId) =>
      watchAgentSession(
        { workspaceId, agentSessionId },
        {
          onEvent: (event) => {
            onEventRef.current?.(event);
          }
        }
      )
    );
    return () => {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    };
  }, [agentSessionIdsKey, input.enabled, input.workspaceId]);
}

export function useAgentSessionDurableRefresh(input: {
  agentSessionId: string | null | undefined;
  sessionView: AgentSessionView | null;
  blockControlStateRefresh?: boolean;
  onControlStateRefresh?: (revision: number) => void;
}) {
  const {
    agentSessionId,
    sessionView,
    blockControlStateRefresh,
    onControlStateRefresh
  } = input;
  const seenControlStateRefreshRevisionBySessionKeyRef = useRef<
    Record<string, number>
  >({});

  useEffect(() => {
    if (!agentSessionId || !sessionView || blockControlStateRefresh) {
      return;
    }
    const sessionKey = sessionView.sessionKey;
    const revision = sessionView.controlStateRefreshRevision;
    if (
      revision <= 0 ||
      seenControlStateRefreshRevisionBySessionKeyRef.current[sessionKey] ===
        revision
    ) {
      return;
    }
    seenControlStateRefreshRevisionBySessionKeyRef.current[sessionKey] =
      revision;
    onControlStateRefresh?.(revision);
  }, [
    agentSessionId,
    blockControlStateRefresh,
    onControlStateRefresh,
    sessionView
  ]);
}

export function useAgentSessionViewSnapshot(ref: AgentSessionViewRef) {
  const sessionView = useStoreAgentSessionView(ref);
  return useMemo(
    () => ({
      sessionView,
      hasSessionView:
        Boolean(createAgentSessionViewKey(ref)) && Boolean(sessionView)
    }),
    [ref, sessionView]
  );
}
