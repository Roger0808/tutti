import { createI18nRuntime, type I18nRuntime } from "@tutti-os/ui-i18n-runtime";
import type { AgentHostRoomIssueSummary } from "../shared/contracts/dto";
import {
  extractWorkspaceFileLinksFromContent,
  extractPlainTextFromContent
} from "../shared/richText/richTextDocument";
import { agentGuiI18nResources, type AgentGuiI18nLocale } from "../i18n/index";

const issueRunPromptRuntimeByLocale = new Map<
  AgentGuiI18nLocale,
  I18nRuntime<string>
>();

function issueRunPromptRuntime(locale: AgentGuiI18nLocale) {
  const existing = issueRunPromptRuntimeByLocale.get(locale);
  if (existing) {
    return existing;
  }
  const runtime = createI18nRuntime<string>({
    dictionaries: [agentGuiI18nResources[locale]]
  });
  issueRunPromptRuntimeByLocale.set(locale, runtime);
  return runtime;
}

export function buildIssueRunOutputDir(
  issueId: string,
  _runId: string,
  taskId?: string | null
): string {
  const normalizedTaskId = taskId?.trim();
  if (normalizedTaskId) {
    return `/workspace/tasks/${normalizedTaskId}`;
  }
  return `/workspace/issues/${issueId}`;
}

export function buildIssueUploadDir(
  issueId: string,
  taskId?: string | null
): string {
  const normalizedTaskId = taskId?.trim();
  if (normalizedTaskId) {
    return `/workspace/tasks/${normalizedTaskId}/attachments`;
  }
  return `/workspace/issues/${issueId}/inputs/uploads`;
}

export function resolveWorkspaceRuntimePath(
  workspaceRoot: string,
  requestedPath: string
): string {
  const normalizedWorkspaceRoot = workspaceRoot.trim().replace(/\/+$/, "");
  const normalizedRequestedPath = requestedPath.trim();

  if (!normalizedWorkspaceRoot || !normalizedRequestedPath) {
    return normalizedRequestedPath;
  }

  if (
    normalizedRequestedPath === normalizedWorkspaceRoot ||
    normalizedRequestedPath.startsWith(`${normalizedWorkspaceRoot}/`)
  ) {
    return normalizedRequestedPath;
  }

  if (normalizedRequestedPath === "/workspace") {
    return normalizedWorkspaceRoot;
  }

  if (normalizedRequestedPath.startsWith("/workspace/")) {
    return `${normalizedWorkspaceRoot}/${normalizedRequestedPath.slice("/workspace/".length)}`;
  }

  if (!normalizedRequestedPath.startsWith("/")) {
    return `${normalizedWorkspaceRoot}/${normalizedRequestedPath.replace(/^\/+/, "")}`;
  }

  return normalizedRequestedPath;
}

export function buildIssueRunPrompt(input: {
  issue: AgentHostRoomIssueSummary;
  locale?: AgentGuiI18nLocale;
  workspaceRoot: string;
  runId: string;
  taskId?: string;
  taskTitle?: string;
  taskContent?: string;
}): string {
  const workspaceFileRefs = extractWorkspaceFileLinkPaths(
    input.taskContent || "",
    input.issue.content || ""
  )
    .map(
      (refPath) =>
        `- [file] ${resolveWorkspaceRuntimePath(input.workspaceRoot, refPath)}`
    )
    .join("\n");
  const taskTitle = input.taskTitle?.trim() || input.issue.title;
  const taskContent = extractPlainTextFromContent(input.taskContent || "");
  const issueContent = extractPlainTextFromContent(input.issue.content || "");
  const copy = issueRunPromptRuntime(input.locale ?? "en");

  return [
    copy.t("agentHost.agentGui.issueRunPrompt.intro"),
    "",
    `${copy.t("agentHost.agentGui.issueRunPrompt.taskTitleLabel")}: ${taskTitle}`,
    `${copy.t("agentHost.agentGui.issueRunPrompt.taskContentLabel")}: ${taskContent || copy.t("agentHost.agentGui.issueRunPrompt.missingContent")}`,
    `${copy.t("agentHost.agentGui.issueRunPrompt.issueTitleLabel")}: ${input.issue.title}`,
    `${copy.t("agentHost.agentGui.issueRunPrompt.issueContentLabel")}: ${issueContent || input.issue.description || copy.t("agentHost.agentGui.issueRunPrompt.missingContent")}`,
    `${copy.t("agentHost.agentGui.issueRunPrompt.currentWorkingDirectoryLabel")}: ${input.workspaceRoot}`,
    "",
    `${copy.t("agentHost.agentGui.issueRunPrompt.referencesLabel")}:`,
    workspaceFileRefs ||
      copy.t("agentHost.agentGui.issueRunPrompt.noReferences"),
    "",
    `${copy.t("agentHost.agentGui.issueRunPrompt.executionRequirementsLabel")}:`,
    copy.t("agentHost.agentGui.issueRunPrompt.requirementStayInWorkspace", {
      workspaceRoot: input.workspaceRoot
    }),
    copy.t("agentHost.agentGui.issueRunPrompt.requirementSummaryOutput", {
      issueId: input.issue.issueId
    }),
    copy.t("agentHost.agentGui.issueRunPrompt.requirementNoOtherOutputDir")
  ].join("\n");
}

function extractWorkspaceFileLinkPaths(...contents: string[]): string[] {
  const paths = new Set<string>();
  for (const content of contents) {
    for (const ref of extractWorkspaceFileLinksFromContent(content)) {
      paths.add(ref.path);
    }
  }
  return [...paths];
}
