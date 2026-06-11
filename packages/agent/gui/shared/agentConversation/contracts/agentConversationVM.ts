import type { WorkspaceAgentActivityCard } from "../../workspaceAgentActivityListViewModel";
import type { WorkspaceAgentSessionDetailViewModel } from "../../workspaceAgentSessionDetailViewModel";
import type { AgentApprovalItemVM } from "./agentApprovalItemVM";
import type { AgentAskUserQuestionVM } from "./agentAskUserQuestionItemVM";
import type { AgentTranscriptRowVM } from "./agentTranscriptRowVM";

export type AgentConversationPromptVM =
  | AgentApprovalItemVM
  | {
      kind: "ask-user";
      requestId: string;
      title: string;
      questions: AgentAskUserQuestionVM[];
    }
  | {
      kind: "exit-plan";
      requestId: string;
      title: string;
    };

export type AgentConversationPendingInteractivePromptVM = Exclude<
  AgentConversationPromptVM,
  AgentApprovalItemVM
>;

export interface AgentConversationVM {
  activity: WorkspaceAgentActivityCard;
  workspaceRoot: string | null;
  sourceDetail: WorkspaceAgentSessionDetailViewModel;
  rows: AgentTranscriptRowVM[];
  pendingApproval: AgentApprovalItemVM | null;
  pendingInteractivePrompt: AgentConversationPendingInteractivePromptVM | null;
}
