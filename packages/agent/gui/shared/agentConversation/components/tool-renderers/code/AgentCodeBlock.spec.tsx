import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentCodeBlock } from "./AgentCodeBlock";

describe("AgentCodeBlock", () => {
  it("renders flat added content without a per-line fill", () => {
    render(
      <AgentCodeBlock content="const ready = true" flat showHeader={false} />
    );

    const addedLine = screen.getByText("const ready = true").closest(".grid");

    expect(addedLine?.className).not.toContain(
      "bg-[var(--transparency-block)]"
    );
    expect(addedLine?.className).toContain("border-l-[var(--state-success)]");
    expect(addedLine?.className).not.toContain("emerald");
    expect(addedLine?.parentElement?.className).not.toContain(
      "bg-[var(--background-fronted)]"
    );
    expect(addedLine?.parentElement?.className).toContain(
      "bg-[var(--background-panel)]"
    );
  });

  it("renders the long-content disclosure as a full-width code-block row", () => {
    const content = Array.from(
      { length: 121 },
      (_, index) => `line ${index + 1}`
    ).join("\n");

    render(
      <AgentCodeBlock content={content} collapsible flat showHeader={false} />
    );

    const disclosure = screen.getByRole("button", {
      name: /show full content/i
    });

    expect(disclosure.className).toContain("w-full");
    expect(disclosure.className).not.toContain("border-t");
    expect(
      disclosure.closest(".workspace-agents-status-panel__detail-tool-code")
    ).toBeTruthy();
    expect(disclosure.parentElement?.className).toContain(
      "workspace-agents-status-panel__detail-scroll-region"
    );
  });
});
