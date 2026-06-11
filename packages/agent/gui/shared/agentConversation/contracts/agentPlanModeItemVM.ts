export type AgentPlanModeKind = "enter" | "exit";

export interface AgentPlanModeItemVM {
  itemKind: "plan-mode";
  id: string;
  turnId: string;
  requestId?: string;
  kind: AgentPlanModeKind;
  title: string;
  plan?: string | null;
  status: string | null;
  filePath?: string | null;
  occurredAtUnixMs: number | null;
}
