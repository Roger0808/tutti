import type { JSX } from "react";
import type { AgentToolCallVM } from "../../contracts/agentToolCallVM";
import { AgentApprovalContent } from "./AgentApprovalContent";
import { AgentAskUserQuestionContent } from "./AgentAskUserQuestionContent";
import { AgentBashContent } from "./AgentBashContent";
import { AgentEditContent } from "./AgentEditContent";
import { AgentImageGenerationContent } from "./AgentImageGenerationContent";
import { AgentMcpToolContent } from "./AgentMcpToolContent";
import { AgentPlanModeContent } from "./AgentPlanModeContent";
import { AgentReadContent } from "./AgentReadContent";
import { AgentSearchContent } from "./AgentSearchContent";
import { AgentSkillContent } from "./AgentSkillContent";
import { AgentTaskContent } from "./AgentTaskContent";
import { AgentTodoWriteContent } from "./AgentTodoWriteContent";
import { AgentToolSearchContent } from "./AgentToolSearchContent";
import { AgentDefaultToolContent } from "./agentToolContentShared";
import { AgentWebFetchContent } from "./AgentWebFetchContent";
import { AgentWebSearchContent } from "./AgentWebSearchContent";
import { AgentWriteContent } from "./AgentWriteContent";

export function AgentExpandedToolContent({
  call,
  onLinkClick
}: {
  call: AgentToolCallVM;
  onLinkClick?: (href: string) => void;
}): JSX.Element | null {
  "use memo";
  switch (call.rendererKind) {
    case "approval":
      return <AgentApprovalContent call={call} onLinkClick={onLinkClick} />;
    case "plan-enter":
    case "plan-exit":
      return <AgentPlanModeContent call={call} onLinkClick={onLinkClick} />;
    case "ask-user":
      return (
        <AgentAskUserQuestionContent call={call} onLinkClick={onLinkClick} />
      );
    case "task":
      return <AgentTaskContent call={call} onLinkClick={onLinkClick} />;
    case "read":
      return <AgentReadContent call={call} onLinkClick={onLinkClick} />;
    case "write":
      return <AgentWriteContent call={call} onLinkClick={onLinkClick} />;
    case "edit":
      return <AgentEditContent call={call} onLinkClick={onLinkClick} />;
    case "bash":
      return <AgentBashContent call={call} onLinkClick={onLinkClick} />;
    case "search":
      return <AgentSearchContent call={call} onLinkClick={onLinkClick} />;
    case "web-search":
      return <AgentWebSearchContent call={call} onLinkClick={onLinkClick} />;
    case "web-fetch":
      return <AgentWebFetchContent call={call} onLinkClick={onLinkClick} />;
    case "image-generation":
      return (
        <AgentImageGenerationContent call={call} onLinkClick={onLinkClick} />
      );
    case "todo-write":
      return <AgentTodoWriteContent call={call} onLinkClick={onLinkClick} />;
    case "tool-search":
      return <AgentToolSearchContent call={call} onLinkClick={onLinkClick} />;
    case "skill":
      return <AgentSkillContent call={call} onLinkClick={onLinkClick} />;
    case "mcp":
      return <AgentMcpToolContent call={call} onLinkClick={onLinkClick} />;
    default:
      return <AgentDefaultToolContent call={call} onLinkClick={onLinkClick} />;
  }
}
