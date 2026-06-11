import {
  buildIssueManagerRunPrompt,
  buildIssueManagerTaskBreakdownPrompt,
  createIssueManagerI18nRuntime
} from "@tutti-os/workspace-issue-manager";
import type { I18nRuntime } from "@tutti-os/ui-i18n-runtime";
import type {
  IssueManagerAgentBreakdownLauncher,
  IssueManagerAgentBreakdownResult,
  IssueManagerAgentRunner,
  IssueManagerAgentRunResult
} from "@tutti-os/workspace-issue-manager/contracts";

export interface DesktopIssueManagerAgentHostApi {
  agentSessions: {
    activate(input: {
      agentSessionId: string;
      cwd?: string;
      mode: "new";
      provider: string;
      settings: Record<string, never>;
      title: string;
      workspaceId: string;
    }): Promise<{
      activation: { status: string };
      error?: { code?: string; message?: string };
      session: { agentSessionId: string; cwd?: string; status?: string };
    }>;
    exec(input: {
      agentSessionId: string;
      prompt: string;
      workspaceId: string;
    }): Promise<{
      accepted: boolean;
      agentSessionId: string;
      sessionStatus?: string;
      status?: string;
      turnId?: string;
    }>;
    getState?(input: {
      agentSessionId: string;
      workspaceId: string;
    }): Promise<DesktopIssueManagerAgentSessionState>;
  };
}

interface DesktopIssueManagerAgentSessionState {
  lastError?: string | null;
  status?: string | null;
}

export interface DesktopIssueManagerAgentGuiHandoff {
  issueId?: string | null;
  issueTitle?: string | null;
  prompt: string;
  requestId: string;
  taskId?: string | null;
  taskTitle: string;
  title: string;
}

export interface DesktopIssueManagerAgentGuiLaunchInput {
  agentSessionId?: string;
  pendingHandoff?: DesktopIssueManagerAgentGuiHandoff;
  provider: string;
  workspaceId: string;
}

export function createDesktopIssueManagerAgentRunner(input: {
  agentHostApi: DesktopIssueManagerAgentHostApi;
  i18n?: I18nRuntime<string>;
  launchAgentGui?: (
    input: DesktopIssueManagerAgentGuiLaunchInput
  ) => Promise<void> | void;
  workspaceId: string;
}): IssueManagerAgentRunner {
  const { agentHostApi, launchAgentGui, workspaceId } = input;

  return {
    async runTask(request): Promise<IssueManagerAgentRunResult> {
      const activation = await agentHostApi.agentSessions.activate({
        agentSessionId: request.agentSessionId,
        ...(request.executionDirectory?.trim()
          ? { cwd: request.executionDirectory.trim() }
          : {}),
        mode: "new",
        provider: request.provider,
        settings: {},
        title: request.task?.title || request.issue.title,
        workspaceId
      });
      if (activation.activation.status === "failed") {
        return {
          errorMessage:
            activation.error?.message ??
            activation.error?.code ??
            "issue_manager.agent_activation_failed",
          status: "failed"
        };
      }
      const executionDirectory = activation.session.cwd?.trim() || ".";
      const prompt = buildIssueManagerRunPrompt({
        copy: createIssueManagerI18nRuntime(input.i18n),
        issue: request.issue,
        task: request.task,
        workspaceRoot: executionDirectory
      });

      try {
        await launchAgentGui?.({
          agentSessionId: request.agentSessionId,
          provider: request.provider,
          workspaceId
        });
      } catch {
        // The run can continue even if the workbench window is not available.
      }

      const exec = await agentHostApi.agentSessions.exec({
        agentSessionId: request.agentSessionId,
        prompt,
        workspaceId
      });
      if (!exec.accepted) {
        return {
          errorMessage: "issue_manager.agent_exec_rejected",
          sessionId: request.agentSessionId,
          status: "failed"
        };
      }

      return {
        sessionId: request.agentSessionId,
        status: "opened"
      };
    }
  };
}

export function createDesktopIssueManagerAgentBreakdownLauncher(input: {
  i18n?: I18nRuntime<string>;
  launchAgentGui?: (
    input: DesktopIssueManagerAgentGuiLaunchInput
  ) => Promise<void> | void;
  workspaceId: string;
}): IssueManagerAgentBreakdownLauncher {
  return {
    async startBreakdown(request): Promise<IssueManagerAgentBreakdownResult> {
      if (!input.launchAgentGui) {
        return {
          errorMessage: "issue_manager.agent_gui_launch_unavailable",
          status: "failed"
        };
      }

      const prompt = buildIssueManagerTaskBreakdownPrompt({
        copy: createIssueManagerI18nRuntime(input.i18n),
        issueDetail: {
          contextRefs: [...request.issueDetail.contextRefs],
          issue: request.issueDetail.issue,
          tasks: [...request.issueDetail.tasks]
        },
        workspaceId: input.workspaceId
      });
      const issueTitle = request.issueDetail.issue.title;

      await input.launchAgentGui({
        pendingHandoff: {
          issueId: request.issueDetail.issue.issueId,
          issueTitle,
          prompt,
          requestId: createIssueManagerAgentHandoffId(),
          taskId: null,
          taskTitle: issueTitle,
          title: issueTitle
        },
        provider: request.provider,
        workspaceId: input.workspaceId
      });

      return { status: "opened" };
    }
  };
}

function createIssueManagerAgentHandoffId(): string {
  const randomUUID = globalThis.crypto?.randomUUID?.();
  if (randomUUID) {
    return `issue-breakdown-${randomUUID}`;
  }
  return `issue-breakdown-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
