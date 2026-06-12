import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { TooltipProvider } from "@tutti-os/ui-system";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceAgentMessageCenterAttentionDeck } from "./WorkspaceAgentMessageCenterAttentionDeck";
import type { WorkspaceAgentMessageCenterItem } from "./workspaceAgentMessageCenterModel";

function promptItem(
  overrides: Partial<WorkspaceAgentMessageCenterItem> & {
    agentSessionId: string;
  }
): WorkspaceAgentMessageCenterItem {
  return {
    id: `message-center-${overrides.agentSessionId}`,
    provider: "codex",
    title: overrides.agentSessionId,
    identity: null,
    cwd: "/workspace",
    status: "waiting",
    lastAgentMessageSummary: "",
    lastAgentMessageAtUnixMs: 1,
    needsAttentionKind: null,
    needsAttentionSummary: null,
    sortTimeUnixMs: 1,
    pendingPrompt: {
      kind: "approval",
      id: `approval:${overrides.agentSessionId}`,
      turnId: "turn-1",
      requestId: `request-${overrides.agentSessionId}`,
      callId: `request-${overrides.agentSessionId}`,
      title: "Approval",
      status: "waiting_approval",
      toolName: "Bash",
      input: null,
      options: [
        { id: "allow_once", label: "Yes", kind: "allow_once", description: "" }
      ],
      output: null,
      occurredAtUnixMs: 1
    },
    ...overrides
  };
}

function renderDeck(
  items: WorkspaceAgentMessageCenterItem[],
  props: Partial<
    React.ComponentProps<typeof WorkspaceAgentMessageCenterAttentionDeck>
  > = {}
) {
  return render(
    <TooltipProvider>
      <WorkspaceAgentMessageCenterAttentionDeck
        items={items}
        submittingPromptKey={null}
        onSubmitPrompt={vi.fn()}
        onOpenChat={vi.fn()}
        {...props}
      />
    </TooltipProvider>
  );
}

describe("WorkspaceAgentMessageCenterAttentionDeck", () => {
  it("renders nothing when there are no items", () => {
    const { container } = renderDeck([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("puts the first (newest) item on top and only the top card is interactive", () => {
    renderDeck([
      promptItem({ agentSessionId: "newest" }),
      promptItem({ agentSessionId: "older" })
    ]);

    const deck = screen.getByTestId(
      "workspace-agent-message-center-attention-deck"
    );
    expect(deck).toHaveAttribute(
      "data-deck-top-item-id",
      "message-center-newest"
    );
    expect(deck).toHaveAttribute("data-deck-count", "2");
    // exactly one interactive prompt surface (one "Yes, proceed" button)
    expect(
      screen.getAllByRole("button", { name: "Yes, proceed" })
    ).toHaveLength(1);
  });

  it("shows a remaining-count indicator for the cards behind the top", () => {
    renderDeck([
      promptItem({ agentSessionId: "a" }),
      promptItem({ agentSessionId: "b" }),
      promptItem({ agentSessionId: "c" })
    ]);
    expect(screen.getByText("2 more waiting below")).toBeTruthy();
  });

  it("omits the remaining indicator when only one card is present", () => {
    renderDeck([promptItem({ agentSessionId: "solo" })]);
    expect(screen.queryByText(/more waiting below/)).toBeNull();
  });

  it("promotes a highlighted non-top item to the top slot", () => {
    renderDeck(
      [
        promptItem({ agentSessionId: "newest" }),
        promptItem({ agentSessionId: "older" })
      ],
      { highlightedItemId: "message-center-older" }
    );
    const deck = screen.getByTestId(
      "workspace-agent-message-center-attention-deck"
    );
    expect(deck).toHaveAttribute(
      "data-deck-top-item-id",
      "message-center-older"
    );
  });
});
