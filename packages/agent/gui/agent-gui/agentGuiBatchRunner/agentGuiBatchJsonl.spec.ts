import { describe, expect, it } from "vitest";
import { parseAgentGuiBatchJsonl } from "./agentGuiBatchJsonl";

describe("parseAgentGuiBatchJsonl", () => {
  it("parses valid object rows and skips empty lines", () => {
    const result = parseAgentGuiBatchJsonl(
      [
        '{"id":"case-1","title":"First","prompt":"hello","settings":{"model":"gpt-5","reasoningEffort":"high","permissionModeId":"auto","planMode":true}}',
        "",
        '{"prompt":"second"}'
      ].join("\n")
    );

    expect(result.errors).toEqual([]);
    expect(result.cases).toEqual([
      {
        id: "case-1",
        line: 1,
        title: "First",
        prompt: "hello",
        settings: {
          model: "gpt-5",
          reasoningEffort: "high",
          permissionModeId: "auto",
          planMode: true
        }
      },
      {
        id: "line-3",
        line: 3,
        title: null,
        prompt: "second",
        settings: null
      }
    ]);
  });

  it("reports bad JSON and missing prompt rows", () => {
    const result = parseAgentGuiBatchJsonl(
      ['{"prompt":"ok"}', "{bad", '{"title":"no"}'].join("\n")
    );

    expect(result.cases).toHaveLength(1);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]!.line).toBe(2);
    expect(result.errors[1]!).toMatchObject({
      line: 3,
      code: "missingPrompt",
      message: "Missing required string field: prompt."
    });
  });

  it("rejects non-object rows", () => {
    const result = parseAgentGuiBatchJsonl('["not","object"]');

    expect(result.cases).toEqual([]);
    expect(result.errors).toEqual([
      {
        line: 1,
        code: "rowMustBeObject",
        message: "Each JSONL row must be an object."
      }
    ]);
  });

  it("preserves prompt whitespace while still rejecting blank prompts", () => {
    const result = parseAgentGuiBatchJsonl(
      ['{"prompt":"  keep this spacing  "}', '{"prompt":"   "}'].join("\n")
    );

    expect(result.cases[0]?.prompt).toBe("  keep this spacing  ");
    expect(result.errors).toEqual([
      {
        line: 2,
        code: "missingPrompt",
        message: "Missing required string field: prompt."
      }
    ]);
  });
});
