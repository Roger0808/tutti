import type {
  IssueManagerFileReference,
  IssueManagerNodeState
} from "../../../contracts/index.ts";
import type { IssueManagerReferenceTarget } from "../model.ts";
import type { IssueDraft, TaskDraft } from "../controllerTypes.ts";
import { resolveIssueManagerReferenceInsertionContent } from "./controllerReferenceCommands.ts";

export interface IssueManagerReferenceOutcome {
  issueDraft?: (current: IssueDraft) => IssueDraft;
  nodeState?: (current: IssueManagerNodeState) => IssueManagerNodeState;
  referenceTarget?: IssueManagerReferenceTarget | null;
  refreshAll?: boolean;
  refreshDetails?: boolean;
  taskDraft?: (current: TaskDraft) => TaskDraft;
}

export function createIssueManagerOpenReferencePickerOutcome(
  target: IssueManagerReferenceTarget
): IssueManagerReferenceOutcome {
  return {
    referenceTarget: target
  };
}

export function createIssueManagerAttachReferencesOutcome(
  attached: boolean
): IssueManagerReferenceOutcome {
  return {
    referenceTarget: null,
    refreshDetails: attached
  };
}

export function createIssueManagerInsertReferencesOutcome(input: {
  refs: IssueManagerFileReference[];
  target: Extract<IssueManagerReferenceTarget, { mode: "insert" }>;
}): IssueManagerReferenceOutcome {
  return input.target.parentKind === "issue"
    ? {
        issueDraft: (current) => ({
          ...current,
          content: resolveIssueManagerReferenceInsertionContent({
            content: current.content,
            refs: input.refs
          })
        }),
        referenceTarget: null
      }
    : {
        referenceTarget: null,
        taskDraft: (current) => ({
          ...current,
          content: resolveIssueManagerReferenceInsertionContent({
            content: current.content,
            refs: input.refs
          })
        })
      };
}
