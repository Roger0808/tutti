import type { WorkbenchHostLaunchRequest } from "@tutti-os/workbench-surface";
import {
  isAgentGuiWorkbenchProvider,
  normalizeAgentGuiWorkbenchProvider
} from "./providerCatalog.ts";
import {
  agentGuiWorkbenchOpenSessionActivationType,
  type AgentGuiWorkbenchProvider,
  type AgentGuiWorkbenchPendingHandoff
} from "./types.ts";

type AgentGuiWorkbenchLaunchRequestInput = Pick<
  WorkbenchHostLaunchRequest,
  "payload" | "typeId"
> & {
  dockEntryId?: string | null;
};

export const agentGuiWorkbenchTypeId = "agent-gui";

const agentGuiWorkbenchDockEntryPrefix = "agent-gui:";
let agentGuiWorkbenchInstanceSequence = 0;

export function agentGuiWorkbenchDockEntryId(
  provider: AgentGuiWorkbenchProvider
): string {
  return provider === "codex"
    ? agentGuiWorkbenchTypeId
    : `${agentGuiWorkbenchDockEntryPrefix}${provider}`;
}

export function agentGuiWorkbenchInstanceId(
  provider: AgentGuiWorkbenchProvider
): string {
  return `${agentGuiWorkbenchDockEntryPrefix}${provider}`;
}

export function createAgentGuiWorkbenchInstanceId(input: {
  agentSessionId?: string | null;
  pendingHandoff?: {
    requestId?: string | null;
  } | null;
  provider: AgentGuiWorkbenchProvider;
}): string {
  const prefix = agentGuiWorkbenchInstanceId(input.provider);
  const agentSessionId = input.agentSessionId?.trim();
  if (agentSessionId) {
    return `${prefix}:session:${encodeAgentGuiWorkbenchInstanceSegment(
      agentSessionId
    )}`;
  }

  const handoffRequestId = input.pendingHandoff?.requestId?.trim();
  if (handoffRequestId) {
    return `${prefix}:handoff:${encodeAgentGuiWorkbenchInstanceSegment(
      handoffRequestId
    )}`;
  }

  agentGuiWorkbenchInstanceSequence += 1;
  return [
    prefix,
    "panel",
    `${Date.now().toString(36)}-${agentGuiWorkbenchInstanceSequence.toString(36)}`
  ].join(":");
}

export function agentGuiWorkbenchProviderFromIdentifier(
  value: string | null | undefined
): AgentGuiWorkbenchProvider | null {
  const normalized = value?.trim();
  if (!normalized || normalized === agentGuiWorkbenchTypeId) {
    return normalized === agentGuiWorkbenchTypeId ? "codex" : null;
  }
  if (!normalized.startsWith(agentGuiWorkbenchDockEntryPrefix)) {
    return null;
  }
  const provider = normalized
    .slice(agentGuiWorkbenchDockEntryPrefix.length)
    .split(":", 1)[0];
  return isAgentGuiWorkbenchProvider(provider) ? provider : null;
}

export function agentGuiWorkbenchProviderFromLaunchRequest(
  request: AgentGuiWorkbenchLaunchRequestInput
): AgentGuiWorkbenchProvider {
  const payloadProvider =
    request.payload &&
    typeof request.payload === "object" &&
    !Array.isArray(request.payload)
      ? (request.payload as { provider?: unknown }).provider
      : null;
  if (isAgentGuiWorkbenchProvider(payloadProvider)) {
    return payloadProvider;
  }
  return (
    agentGuiWorkbenchProviderFromIdentifier(request.dockEntryId) ??
    agentGuiWorkbenchProviderFromIdentifier(request.typeId) ??
    "codex"
  );
}

export function createAgentGuiWorkbenchSessionLaunchRequest(input: {
  agentSessionId?: string;
  pendingHandoff?: AgentGuiWorkbenchPendingHandoff;
  provider: unknown;
}) {
  const provider = normalizeAgentGuiWorkbenchProvider(input.provider);
  return {
    dockEntryId: agentGuiWorkbenchDockEntryId(provider),
    payload: {
      ...(input.agentSessionId ? { agentSessionId: input.agentSessionId } : {}),
      ...(input.pendingHandoff ? { pendingHandoff: input.pendingHandoff } : {}),
      provider
    },
    reason: "host" as const,
    typeId: agentGuiWorkbenchTypeId
  };
}

export interface AgentGuiWorkbenchLaunchDescriptor {
  activation: {
    payload: {
      agentSessionId: string;
    };
    type: typeof agentGuiWorkbenchOpenSessionActivationType;
  } | null;
  dockEntryId: string;
  instanceId: string;
  pendingHandoff: AgentGuiWorkbenchPendingHandoff | null;
  provider: AgentGuiWorkbenchProvider;
  reuseDockEntryNode: boolean;
  targetAgentSessionId: string | null;
}

export function createAgentGuiWorkbenchLaunchDescriptor(
  request: AgentGuiWorkbenchLaunchRequestInput
): AgentGuiWorkbenchLaunchDescriptor {
  const provider = agentGuiWorkbenchProviderFromLaunchRequest(request);
  const targetAgentSessionId = agentSessionIdFromLaunchPayload(request.payload);
  const pendingHandoff = pendingHandoffFromLaunchPayload(request.payload);
  const instanceId = createAgentGuiWorkbenchInstanceId({
    agentSessionId: targetAgentSessionId,
    pendingHandoff,
    provider
  });

  return {
    activation: targetAgentSessionId
      ? {
          payload: {
            agentSessionId: targetAgentSessionId
          },
          type: agentGuiWorkbenchOpenSessionActivationType
        }
      : null,
    dockEntryId: request.dockEntryId ?? agentGuiWorkbenchDockEntryId(provider),
    instanceId,
    pendingHandoff,
    provider,
    reuseDockEntryNode: Boolean(targetAgentSessionId),
    targetAgentSessionId
  };
}

function encodeAgentGuiWorkbenchInstanceSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

function agentSessionIdFromLaunchPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const agentSessionId = (payload as { agentSessionId?: unknown })
    .agentSessionId;
  return typeof agentSessionId === "string" && agentSessionId.trim()
    ? agentSessionId.trim()
    : null;
}

function pendingHandoffFromLaunchPayload(
  payload: unknown
): AgentGuiWorkbenchPendingHandoff | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const pendingHandoff = (payload as { pendingHandoff?: unknown })
    .pendingHandoff;
  if (
    !pendingHandoff ||
    typeof pendingHandoff !== "object" ||
    Array.isArray(pendingHandoff)
  ) {
    return null;
  }
  const requestId = (pendingHandoff as { requestId?: unknown }).requestId;
  const prompt = (pendingHandoff as { prompt?: unknown }).prompt;
  const title = (pendingHandoff as { title?: unknown }).title;
  const taskTitle = (pendingHandoff as { taskTitle?: unknown }).taskTitle;
  if (
    typeof requestId !== "string" ||
    typeof prompt !== "string" ||
    typeof title !== "string" ||
    typeof taskTitle !== "string"
  ) {
    return null;
  }

  const issueId = (pendingHandoff as { issueId?: unknown }).issueId;
  const issueTitle = (pendingHandoff as { issueTitle?: unknown }).issueTitle;
  const taskId = (pendingHandoff as { taskId?: unknown }).taskId;
  return {
    issueId: typeof issueId === "string" ? issueId : null,
    issueTitle: typeof issueTitle === "string" ? issueTitle : null,
    prompt,
    requestId,
    taskId: typeof taskId === "string" ? taskId : null,
    taskTitle,
    title
  };
}
