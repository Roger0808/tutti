export {
  createIssueManagerFeature,
  defaultIssueManagerNodeState,
  normalizeIssueManagerNodeState,
  type CreateIssueManagerFeatureInput,
  type IssueManagerFeature,
  type IssueManagerNotificationSink
} from "./feature.ts";
export {
  appendIssueManagerWorkspaceFileLinksToContent,
  createIssueManagerMentionHref,
  createIssueManagerMentionMarkdown,
  createIssueManagerWorkspaceFileLinkMarkdown,
  extractIssueManagerMentionsFromContent,
  extractIssueManagerPlainTextFromContent,
  extractIssueManagerPlainTextWithoutFilesFromContent,
  parseIssueManagerMentionHref,
  extractIssueManagerWorkspaceFileLinksFromContent,
  normalizeIssueManagerContent,
  normalizeIssueManagerWorkspaceFileLinkHref,
  removeIssueManagerMentionFromContent,
  removeIssueManagerWorkspaceFileLinkFromContent,
  type IssueManagerMentionAttrs,
  type IssueManagerMentionRef,
  type IssueManagerWorkspaceFileLinkInput,
  type IssueManagerWorkspaceFileLinkRef
} from "./content.ts";
export {
  clampIssueManagerSidebarWidth,
  issueManagerDefaultNodeFrameWidth,
  issueManagerExpandedFrameMinWidth,
  issueManagerMainMinWidth,
  issueManagerSidebarDefaultWidth,
  issueManagerSidebarMaxWidth,
  issueManagerSidebarMinWidth,
  resolveIssueManagerExpandedFrame,
  shouldAutoCollapseIssueManagerSidebar
} from "./layout.ts";
export {
  buildIssueManagerRunPrompt,
  buildIssueManagerTaskBreakdownPrompt,
  resolveIssueManagerWorkspaceRuntimePath
} from "./runPrompt.ts";
export {
  buildWorkspaceIssueMentionHref,
  parseWorkspaceIssueMentionHref,
  type BuildWorkspaceIssueMentionHrefInput,
  type ParsedWorkspaceIssueMention,
  type WorkspaceIssueMentionMode
} from "./workspaceIssueMention.ts";
