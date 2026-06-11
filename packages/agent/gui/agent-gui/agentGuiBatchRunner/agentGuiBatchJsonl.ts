import type { AgentGuiBatchPromptCase } from "../../shared/contracts/dto";
import type { AgentSessionComposerSettings } from "../../shared/agentSessionTypes";

export interface AgentGuiBatchJsonlParseError {
  line: number;
  code: "invalidJson" | "rowMustBeObject" | "missingPrompt";
  message: string;
}

export interface AgentGuiBatchJsonlParseResult {
  cases: AgentGuiBatchPromptCase[];
  errors: AgentGuiBatchJsonlParseError[];
}

function readOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function readSettings(value: unknown): AgentSessionComposerSettings | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const settings: AgentSessionComposerSettings = {};
  const model = readOptionalString(record.model);
  const reasoningEffort = readOptionalString(record.reasoningEffort);
  const permissionModeId = readOptionalString(record.permissionModeId);

  if (model) {
    settings.model = model;
  }
  if (reasoningEffort) {
    settings.reasoningEffort = reasoningEffort;
  }
  if (permissionModeId) {
    settings.permissionModeId = permissionModeId;
  }
  if (typeof record.planMode === "boolean") {
    settings.planMode = record.planMode;
  }

  return Object.keys(settings).length > 0 ? settings : null;
}

export function parseAgentGuiBatchJsonl(
  content: string
): AgentGuiBatchJsonlParseResult {
  const cases: AgentGuiBatchPromptCase[] = [];
  const errors: AgentGuiBatchJsonlParseError[] = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      errors.push({
        line: lineNumber,
        code: "invalidJson",
        // i18n-check-ignore: Parser fallback; UI can localize by error code.
        message: error instanceof Error ? error.message : "Invalid JSON"
      });
      return;
    }

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      errors.push({
        line: lineNumber,
        code: "rowMustBeObject",
        // i18n-check-ignore: Parser fallback; UI can localize by error code.
        message: "Each JSONL row must be an object."
      });
      return;
    }

    const record = parsed as Record<string, unknown>;
    const prompt = typeof record.prompt === "string" ? record.prompt : "";
    if (!prompt.trim()) {
      errors.push({
        line: lineNumber,
        code: "missingPrompt",
        // i18n-check-ignore: Parser fallback; UI can localize by error code.
        message: "Missing required string field: prompt."
      });
      return;
    }

    const id = readOptionalString(record.id) ?? `line-${lineNumber}`;
    cases.push({
      id,
      line: lineNumber,
      prompt,
      title: readOptionalString(record.title),
      settings: readSettings(record.settings)
    });
  });

  return { cases, errors };
}
