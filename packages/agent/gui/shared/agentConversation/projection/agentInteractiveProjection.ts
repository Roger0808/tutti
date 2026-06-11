import type { WorkspaceAgentSessionDetailToolCall } from "../../workspaceAgentSessionDetailViewModel";
import type {
  AgentAskUserQuestionItemVM,
  AgentAskUserQuestionVM
} from "../contracts/agentAskUserQuestionItemVM";
import type { AgentPlanModeItemVM } from "../contracts/agentPlanModeItemVM";

export function projectAgentAskUserQuestionItem(
  call: WorkspaceAgentSessionDetailToolCall,
  input: Record<string, unknown> | null,
  output: Record<string, unknown> | null
): AgentAskUserQuestionItemVM | null {
  if (normalizeToolName(call.toolName) !== "askuserquestion") {
    return null;
  }
  const questions = normalizeQuestions(arrayValue(input?.questions) ?? []);
  if (questions.length === 0) {
    return null;
  }
  const answersByQuestionId = objectValue(output?.answersByQuestionId) ?? {};
  return {
    kind: "ask-user",
    id: call.id,
    turnId: call.turnId ?? "turn:unknown",
    requestId:
      stringValue(input?.requestId) ??
      stringValue(call.payload?.requestId) ??
      call.id.replace(/^call:/, ""),
    title: call.name,
    status: call.status,
    questions: questions.map((question) => ({
      ...question,
      answer: answerForQuestion(question.id, answersByQuestionId, output)
    })),
    occurredAtUnixMs: call.occurredAtUnixMs ?? null
  };
}

export function projectAgentPlanModeItem(
  call: WorkspaceAgentSessionDetailToolCall,
  input: Record<string, unknown> | null
): AgentPlanModeItemVM | null {
  if (isExitPlanApprovalInput(input)) {
    return {
      itemKind: "plan-mode",
      id: call.id,
      turnId: call.turnId ?? "turn:unknown",
      requestId:
        stringValue(input?.requestId) ??
        stringValue(call.payload?.requestId) ??
        call.id.replace(/^call:/, ""),
      kind: "exit",
      title: stringValue(objectValue(input?.toolCall)?.title) ?? call.name,
      status: call.status,
      plan:
        stringValue(input?.plan) ??
        stringValue(call.payload?.plan) ??
        (call.summary.trim() || null),
      filePath:
        stringValue(input?.filePath) ?? stringValue(call.payload?.filePath),
      occurredAtUnixMs: call.occurredAtUnixMs ?? null
    };
  }
  const toolName = normalizeToolName(call.toolName);
  if (toolName === "enterplanmode") {
    return {
      itemKind: "plan-mode",
      id: call.id,
      turnId: call.turnId ?? "turn:unknown",
      kind: "enter",
      title: call.name,
      status: call.status,
      plan: stringValue(input?.content) ?? (call.summary.trim() || null),
      filePath: stringValue(input?.filePath),
      occurredAtUnixMs: call.occurredAtUnixMs ?? null
    };
  }
  if (toolName !== "exitplanmode") {
    return null;
  }
  return {
    itemKind: "plan-mode",
    id: call.id,
    turnId: call.turnId ?? "turn:unknown",
    requestId:
      stringValue(input?.requestId) ??
      stringValue(call.payload?.requestId) ??
      call.id.replace(/^call:/, ""),
    kind: "exit",
    title: call.name,
    status: call.status,
    plan:
      stringValue(input?.plan) ??
      stringValue(call.payload?.plan) ??
      (call.summary.trim() || null),
    filePath:
      stringValue(input?.filePath) ?? stringValue(call.payload?.filePath),
    occurredAtUnixMs: call.occurredAtUnixMs ?? null
  };
}

function isExitPlanApprovalInput(
  input: Record<string, unknown> | null
): boolean {
  const toolCall = objectValue(input?.toolCall);
  const kind = normalizeToolName(stringValue(toolCall?.kind));
  if (kind !== "switchmode") {
    return false;
  }
  return (arrayValue(input?.options) ?? []).some((value) => {
    const option = objectValue(value);
    return (
      stringValue(option?.optionId) === "plan" ||
      stringValue(option?.id) === "plan"
    );
  });
}

function normalizeQuestions(
  values: readonly unknown[]
): AgentAskUserQuestionVM[] {
  return values.flatMap((value, index) => {
    const question = objectValue(value);
    if (!question) {
      return [];
    }
    return [
      {
        id: stringValue(question.id) ?? `question-${index + 1}`,
        header: stringValue(question.header) ?? `Question ${index + 1}`,
        question:
          stringValue(question.question) ??
          stringValue(question.header) ??
          `Question ${index + 1}`,
        options: (arrayValue(question.options) ?? []).flatMap((optionValue) => {
          const option = objectValue(optionValue);
          const label = stringValue(option?.label);
          if (!label) {
            return [];
          }
          return [
            {
              label,
              description: stringValue(option?.description) ?? ""
            }
          ];
        }),
        multiSelect: Boolean(question.multiSelect)
      }
    ];
  });
}

function answerForQuestion(
  questionId: string,
  answersByQuestionId: Record<string, unknown>,
  output: Record<string, unknown> | null
): string | string[] | null {
  const value = answersByQuestionId[questionId];
  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      typeof item === "string" && item.trim() ? [item.trim()] : []
    );
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  const answers = arrayValue(output?.answers);
  return answers && answers.length > 0
    ? answers.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
      )
    : null;
}

function normalizeToolName(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/[_\s-]+/g, "")
    .trim()
    .toLowerCase();
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function arrayValue(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}
