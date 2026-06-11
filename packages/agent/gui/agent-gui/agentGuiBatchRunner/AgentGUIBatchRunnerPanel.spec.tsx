import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setAgentGuiI18nTestLocale } from "../../i18n/testUtils";
import type {
  AgentGuiBatchRunCaseResult,
  AgentHostWorkspaceAgentTimelineItem
} from "../../shared/contracts/dto";
import { AgentGUIBatchRunnerPanel } from "./AgentGUIBatchRunnerPanel";
import {
  agentGuiBatchRunCaseResultKey,
  useAgentGuiBatchRunner,
  type UseAgentGuiBatchRunnerResult
} from "./useAgentGuiBatchRunner";

vi.mock("./useAgentGuiBatchRunner", async (importActual) => {
  const actual =
    await importActual<typeof import("./useAgentGuiBatchRunner")>();
  return {
    ...actual,
    useAgentGuiBatchRunner: vi.fn()
  };
});

const mockedUseAgentGuiBatchRunner = vi.mocked(useAgentGuiBatchRunner);

describe("AgentGUIBatchRunnerPanel", () => {
  afterEach(async () => {
    vi.resetAllMocks();
    setAgentGuiI18nTestLocale("zh-CN");
  });

  it("opens a case session from the results list and returns to results", async () => {
    setAgentGuiI18nTestLocale("en");
    const first = batchResult({
      id: "case-1",
      line: 1,
      title: "Case 1",
      agentSessionId: "session-1",
      status: "running"
    });
    const second = batchResult({
      id: "case-2",
      line: 2,
      title: "Case 2",
      agentSessionId: "session-2"
    });
    const loadSessionTimeline = vi.fn();
    mockedUseAgentGuiBatchRunner.mockReturnValue(
      runnerResult({
        results: [first, second],
        sessionTimelines: {
          [agentGuiBatchRunCaseResultKey(second)]: {
            timelineItems: [
              {
                id: 1,
                workspaceId: "room-1",
                agentSessionId: "session-2",
                eventId: "message-1",
                actorType: "agent",
                actorId: "agent",
                itemType: "message",
                role: "assistant",
                content: "hello from session",
                occurredAtUnixMs: 1,
                createdAtUnixMs: 1
              },
              visibleErrorTimelineItem(),
              failedToolTimelineItem()
            ],
            loading: false,
            error: null,
            lastLoadedAtUnixMs: 1
          }
        },
        loadSessionTimeline
      })
    );

    render(
      <AgentGUIBatchRunnerPanel
        workspaceId="workspace-1"
        workspacePath="/workspace/project"
      />
    );

    expect(mockedUseAgentGuiBatchRunner).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace-1"
      })
    );

    const firstDiagnostics = screen.getAllByTestId(
      "agent-gui-batch-case-diagnostics"
    )[0];
    expect(firstDiagnostics).toHaveTextContent("—");
    expect(firstDiagnostics).not.toHaveTextContent("0 errors");
    expect(firstDiagnostics).not.toHaveTextContent("0 tool failures");

    const secondDiagnostics = screen.getAllByTestId(
      "agent-gui-batch-case-diagnostics"
    )[1];
    expect(secondDiagnostics).toHaveTextContent("1 errors");
    expect(secondDiagnostics).toHaveTextContent("1 tool failures");

    fireEvent.click(screen.getAllByTestId("agent-gui-batch-case-row")[1]!);

    expect(
      screen.getByTestId("agent-gui-batch-session-detail")
    ).toBeInTheDocument();
    expect(screen.getByText("Case 2")).toBeInTheDocument();
    expect(screen.getByText("session-2")).toBeInTheDocument();
    expect(loadSessionTimeline).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("agent-gui-batch-session-back"));

    expect(screen.getByTestId("agent-gui-batch-search")).toBeInTheDocument();
    expect(
      screen.queryByTestId("agent-gui-batch-session-detail")
    ).not.toBeInTheDocument();
  });

  it("offers local upload and built-in case source actions", async () => {
    setAgentGuiI18nTestLocale("en");
    const selectPromptFile = vi.fn();
    const selectBuiltInPromptFile = vi.fn();
    mockedUseAgentGuiBatchRunner.mockReturnValue(
      runnerResult({
        selectedFile: null,
        selectPromptFile,
        selectBuiltInPromptFile
      })
    );

    render(
      <AgentGUIBatchRunnerPanel
        workspaceId="room-1"
        workspacePath="/workspace/project"
      />
    );

    fireEvent.click(screen.getByTestId("agent-gui-batch-select-file"));
    fireEvent.click(screen.getByTestId("agent-gui-batch-select-built-in"));

    expect(selectPromptFile).toHaveBeenCalledTimes(1);
    expect(selectBuiltInPromptFile).toHaveBeenCalledTimes(1);
  });
});

function runnerResult(
  overrides: Partial<UseAgentGuiBatchRunnerResult> = {}
): UseAgentGuiBatchRunnerResult {
  return {
    batchId: "batch-1",
    selectedFile: {
      name: "cases.jsonl",
      path: "/tmp/cases.jsonl",
      source: "local"
    },
    selectedProviders: ["codex"],
    status: "completed",
    cases: [],
    parseErrors: [],
    results: [],
    sessionTimelines: {},
    exportResult: null,
    error: null,
    isRunnable: true,
    isExportable: true,
    toggleSelectedProvider: vi.fn(),
    selectPromptFile: vi.fn(),
    selectBuiltInPromptFile: vi.fn(),
    loadSessionTimeline: vi.fn(),
    run: vi.fn(),
    exportRun: vi.fn(),
    ...overrides
  };
}

function visibleErrorTimelineItem(): AgentHostWorkspaceAgentTimelineItem {
  return {
    id: 2,
    workspaceId: "room-1",
    agentSessionId: "session-2",
    eventId: "visible-error-1",
    actorType: "agent",
    actorId: "codex",
    itemType: "message.assistant",
    role: "assistant",
    status: "failed",
    payload: {
      kind: "agent_visible_error",
      code: "process_exited",
      phase: "start",
      provider: "codex",
      detail: "Config invalid",
      retryable: false,
      content: "Codex failed to start.",
      text: "Codex failed to start."
    },
    occurredAtUnixMs: 2,
    createdAtUnixMs: 2
  };
}

function failedToolTimelineItem(): AgentHostWorkspaceAgentTimelineItem {
  return {
    id: 3,
    workspaceId: "room-1",
    agentSessionId: "session-2",
    eventId: "tool-failed-1",
    actorType: "agent",
    actorId: "codex",
    itemType: "call.completed",
    role: "assistant",
    callType: "tool",
    callId: "bash-1",
    name: "Bash",
    status: "failed",
    payload: {
      tool_state: {
        name: "Bash",
        input: { command: "exit 1" },
        error: { message: "Command failed" }
      }
    },
    occurredAtUnixMs: 3,
    createdAtUnixMs: 3
  };
}

function batchResult(
  overrides: Partial<AgentGuiBatchRunCaseResult> = {}
): AgentGuiBatchRunCaseResult {
  return {
    id: "case-1",
    line: 1,
    title: "Case 1",
    prompt: "hello",
    status: "completed",
    provider: "codex",
    agentSessionId: "session-1",
    providerSessionId: null,
    ...overrides
  };
}
