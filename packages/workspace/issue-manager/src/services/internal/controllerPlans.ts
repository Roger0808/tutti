import type {
  IssueManagerIssueDetail,
  IssueManagerTaskDetail
} from "../../contracts/index.ts";
import type { IssueDraft, TaskDraft } from "./controllerTypes.ts";

export type IssueManagerSavePlan<TResult> =
  | {
      kind: "blocked";
      notificationKey: "messages.titleRequired" | "messages.topicListEmpty";
    }
  | ({ kind: "ready" } & TResult);

export function createIssueManagerRunTaskPlan(input: {
  issueDetail: IssueManagerIssueDetail | null;
  providerOverride?: string;
  selectedAgentProvider: string;
  taskDetail: IssueManagerTaskDetail | null;
}):
  | {
      kind: "ready";
      provider: string;
      shouldUpdateSelectedAgentProvider: boolean;
    }
  | { kind: "skip" } {
  if (!input.issueDetail) {
    return { kind: "skip" };
  }

  const provider =
    input.providerOverride?.trim() || input.selectedAgentProvider.trim();
  if (!provider) {
    return { kind: "skip" };
  }

  return {
    kind: "ready",
    provider,
    shouldUpdateSelectedAgentProvider: provider !== input.selectedAgentProvider
  };
}

export function createIssueManagerSaveIssuePlan(input: {
  activeTopicId: string | null;
  issueDraft: IssueDraft;
}): IssueManagerSavePlan<{ activeTopicId: string }> {
  if (!input.activeTopicId) {
    return {
      kind: "blocked",
      notificationKey: "messages.topicListEmpty"
    };
  }

  const title = input.issueDraft.title.trim();
  if (!title) {
    return {
      kind: "blocked",
      notificationKey: "messages.titleRequired"
    };
  }

  return { kind: "ready", activeTopicId: input.activeTopicId };
}

export function createIssueManagerSaveTaskPlan(input: {
  selectedIssueId: string | null;
  taskDraft: TaskDraft;
}): IssueManagerSavePlan<{ selectedIssueId: string }> | { kind: "skip" } {
  if (!input.selectedIssueId) {
    return { kind: "skip" };
  }

  const title = input.taskDraft.title.trim();
  if (!title) {
    return {
      kind: "blocked",
      notificationKey: "messages.titleRequired"
    };
  }

  return {
    kind: "ready",
    selectedIssueId: input.selectedIssueId
  };
}

export function shouldIssueManagerNotifyRunFailure(status: string): boolean {
  return status !== "completed";
}
