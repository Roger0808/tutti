import type { RichTextAtProvider } from "@tutti-os/ui-rich-text/types";
import type { IssueManagerNodeState } from "../../../../contracts/index.ts";
import type { IssueManagerFeature } from "../../../../core/index.ts";
import type {
  IssueManagerControllerSession,
  IssueManagerEditorMode,
  IssueManagerReferenceTarget
} from "../../../../services/issueManagerControllerService.interface.ts";
import { applyIssueManagerIssueSelection } from "../../../../services/internal/controllerState.ts";
import { createIssueManagerIssueBindings } from "../issue/createIssueManagerIssueBindings.ts";
import { createIssueManagerTaskBindings } from "../task/createIssueManagerTaskBindings.ts";

export function createIssueManagerControllerBindings(input: {
  controllerSession: IssueManagerControllerSession;
  feature: IssueManagerFeature;
  issueEditorMode: IssueManagerEditorMode;
  nodeState: IssueManagerNodeState;
  onResolveRichTextAtProviders?: (input: {
    surface: "issue" | "task";
    workspaceId: string;
  }) => readonly RichTextAtProvider[];
  taskEditorMode: IssueManagerEditorMode;
  workspaceId: string;
}) {
  const {
    controllerSession,
    feature,
    issueEditorMode,
    nodeState,
    onResolveRichTextAtProviders,
    taskEditorMode,
    workspaceId
  } = input;

  const issueBindings = createIssueManagerIssueBindings({
    controllerSession,
    feature,
    issueEditorMode,
    nodeState
  });
  const taskBindings = createIssueManagerTaskBindings({
    controllerSession,
    feature,
    nodeState,
    taskEditorMode
  });

  return {
    ...issueBindings,
    ...taskBindings,
    dismissNotification() {
      controllerSession.setNotification(null);
    },
    refreshAll() {
      controllerSession.refreshAll();
    },
    reportIssueSearchUsage(query: string) {
      controllerSession.reportIssueSearchUsage(query);
    },
    resolveRichTextAtProviders(surface: "issue" | "task") {
      return (
        onResolveRichTextAtProviders?.({
          surface,
          workspaceId
        }) ?? []
      );
    },
    selectIssue(issueId: string | null) {
      controllerSession.updateNodeState((current) =>
        applyIssueManagerIssueSelection(current, issueId)
      );
      controllerSession.setIssueEditorModeState("read");
      controllerSession.setTaskEditorModeState("read");
    },
    setReferenceTarget(target: IssueManagerReferenceTarget | null) {
      controllerSession.setReferenceTarget(target);
    },
    setSelectedAgentProvider(provider: string) {
      controllerSession.updateNodeState((current) => ({
        ...current,
        selectedAgentProvider: provider
      }));
    }
  };
}
