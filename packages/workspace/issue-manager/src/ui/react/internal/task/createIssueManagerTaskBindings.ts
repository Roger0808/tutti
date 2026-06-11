import type {
  IssueManagerNodeState,
  IssueManagerPriority
} from "../../../../contracts/index.ts";
import type { IssueManagerFeature } from "../../../../core/index.ts";
import type {
  IssueManagerControllerSession,
  IssueManagerEditorMode,
  TaskDraft
} from "../../../../services/issueManagerControllerService.interface.ts";
import {
  applyIssueManagerTaskEditorModeToNodeState,
  applyIssueManagerTaskSelection,
  createIssueManagerTaskDraftFromNodeState,
  persistIssueManagerTaskDraftContent
} from "../../../../services/internal/controllerState.ts";
import { trackIssueManagerContentReferenceChanges } from "../../../../services/internal/controllerAnalytics.ts";

export function createIssueManagerTaskBindings(input: {
  controllerSession: IssueManagerControllerSession;
  feature: IssueManagerFeature;
  nodeState: IssueManagerNodeState;
  taskEditorMode: IssueManagerEditorMode;
}) {
  const { controllerSession, feature, nodeState, taskEditorMode } = input;

  return {
    selectTask(taskId: string | null) {
      controllerSession.updateNodeState((current) =>
        applyIssueManagerTaskSelection(current, taskId)
      );
      controllerSession.setTaskEditorModeState("read");
    },
    setTaskContent(content: string) {
      controllerSession.setTaskDraftInternal((current) => {
        trackIssueManagerContentReferenceChanges({
          feature,
          nextContent: content,
          previousContent: current.content,
          targetType: "task"
        });
        return {
          ...current,
          content
        };
      });
      controllerSession.updateNodeState((current) =>
        persistIssueManagerTaskDraftContent(current, taskEditorMode, content)
      );
    },
    setTaskDraft(patch: Partial<TaskDraft>) {
      controllerSession.setTaskDraftInternal((current) => ({
        ...current,
        ...patch
      }));
    },
    setTaskEditorMode(mode: IssueManagerEditorMode) {
      controllerSession.setTaskEditorModeState(mode);
      if (mode === "create") {
        controllerSession.setTaskDraftInternal(
          createIssueManagerTaskDraftFromNodeState(nodeState)
        );
      }
      controllerSession.updateNodeState((current) =>
        applyIssueManagerTaskEditorModeToNodeState(current, mode)
      );
    },
    setTaskListCollapsed(collapsed: boolean) {
      controllerSession.updateNodeState((current) => ({
        ...current,
        taskListCollapsed: collapsed
      }));
    },
    setTaskPriority(priority: IssueManagerPriority) {
      controllerSession.setTaskDraftInternal((current) => ({
        ...current,
        priority
      }));
    },
    setTaskTitle(title: string) {
      controllerSession.setTaskDraftInternal((current) => ({
        ...current,
        title
      }));
    }
  };
}
