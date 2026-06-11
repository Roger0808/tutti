import type { JSX } from "react";
import { translate } from "../../../../i18n/index";
import {
  ToolMarkdownBlock,
  ToolSection,
  type AgentToolRendererProps
} from "./agentToolContentShared";
import { getWebFetchRenderData } from "./render-data/agentToolRenderData";

export function AgentWebFetchContent({
  call,
  onLinkClick
}: AgentToolRendererProps): JSX.Element | null {
  "use memo";
  const web = getWebFetchRenderData(call);
  if (!web.url && !web.visibleContent) {
    return null;
  }

  return (
    <div className="workspace-agents-status-panel__detail-tool-body">
      {web.url ? (
        <ToolSection title={translate("agentHost.agentTool.details.url")}>
          <ToolMarkdownBlock
            content={
              web.domain && web.domain !== web.url
                ? `${web.domain}\n\n${web.url}`
                : web.url
            }
            onLinkClick={onLinkClick}
          />
        </ToolSection>
      ) : null}
      {web.visibleContent ? (
        <ToolSection title={translate("agentHost.agentTool.details.content")}>
          <ToolMarkdownBlock
            content={web.visibleContent}
            onLinkClick={onLinkClick}
            collapsible
          />
        </ToolSection>
      ) : null}
      {web.isTruncated ? (
        <div className="text-[10px] italic text-[var(--text-tertiary)]">
          {translate("agentHost.agentTool.details.contentTruncated")}
        </div>
      ) : null}
    </div>
  );
}
