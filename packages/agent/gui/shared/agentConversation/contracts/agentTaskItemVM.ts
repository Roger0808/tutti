import type { AgentToolCallVM } from "./agentToolCallVM";

export interface AgentTaskStepVM {
  id: string;
  turnId: string;
  name: string;
  toolName: string | null;
  status: string | null;
  summary: string;
  payload: Record<string, unknown> | null;
  tool: AgentToolCallVM | null;
  occurredAtUnixMs: number | null;
}

export interface AgentTaskItemVM {
  kind: "task";
  id: string;
  turnId: string;
  title: string;
  status: string | null;
  prompt?: string | null;
  delegateSessionId?: string | null;
  steps: AgentTaskStepVM[];
  result?: string | null;
  resultMarkdown?: string | null;
  durationMs?: number | null;
  occurredAtUnixMs: number | null;
}
