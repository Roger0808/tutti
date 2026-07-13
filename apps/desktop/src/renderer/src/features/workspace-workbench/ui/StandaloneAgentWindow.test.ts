import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const standaloneWindowSource = readFileSync(
  resolve(currentDirectory, "StandaloneAgentWindow.tsx"),
  "utf8"
);
const workbenchBodySource = readFileSync(
  resolve(
    currentDirectory,
    "../../workspace-agent/ui/DesktopAgentGUIWorkbenchBody.tsx"
  ),
  "utf8"
);

test("standalone Agent reuses the OS account menu in the sidebar footer", () => {
  assert.match(
    standaloneWindowSource,
    /import \{ WorkspaceAccountMenu \} from "\.\/WorkspaceAccountMenu";/
  );
  assert.match(
    standaloneWindowSource,
    /function renderStandaloneAgentSidebarFooter\(\): ReactNode \{[\s\S]*<WorkspaceAccountMenu \/>/
  );
  assert.match(
    standaloneWindowSource,
    /renderSidebarFooter=\{renderStandaloneAgentSidebarFooter\}/
  );
  assert.match(
    workbenchBodySource,
    /renderSlots=\{\{[\s\S]*sidebarFooter: previewMode \? undefined : renderSidebarFooter[\s\S]*\}\}/
  );
});

test("standalone Agent keeps the app runtime lifecycle active for inline apps", () => {
  assert.match(
    standaloneWindowSource,
    /useEffect\(\s*\(\) => workspaceAppCenterService\.startWorkspacePolling\(workspaceId\),\s*\[workspaceAppCenterService, workspaceId\]\s*\)/
  );
});

test("standalone Agent routes files and apps into the right sidebar", () => {
  assert.match(
    standaloneWindowSource,
    /setCanvasFilePreviewLauncher\([\s\S]*?openFileInSidebar\(target\.path\)/
  );
  assert.match(standaloneWindowSource, /workspaceFilePreviewMode: "canvas"/);
  assert.match(
    standaloneWindowSource,
    /runDesktopAgentGUILinkAction\(action,[\s\S]*?launchWorkspaceFiles: \(\{ path \}\) => openFileInSidebar\(path\)/
  );
  assert.match(
    standaloneWindowSource,
    /setWorkspaceAppLauncher\([\s\S]*?state: \{ openAppId: appId \}/
  );
  assert.match(
    standaloneWindowSource,
    /<StandaloneAgentToolSidebar[\s\S]*?appOpenId=\{openAppId\}[\s\S]*?fileOpenRequest=\{fileOpenRequest\}/
  );
  assert.match(
    standaloneWindowSource,
    /<WorkspaceAppExternalBridge[\s\S]*?api=\{workspaceAppExternalApi\}[\s\S]*?openFile=\{openWorkspaceAppExternalFile\}[\s\S]*?workspaceId=\{workspaceId\}/
  );
});

test("standalone Agent handles task and app Agent launch requests", () => {
  assert.match(
    standaloneWindowSource,
    /registerWorkspaceAgentGuiLaunchHandler\(workspaceId, \(request\) =>[\s\S]*?handleStandaloneAgentGuiLaunch\(request, \{/
  );
  assert.match(
    standaloneWindowSource,
    /registerWorkspaceIssueManagerLaunchHandler\(workspaceId, \(request\) => \{[\s\S]*?createStandaloneAgentIssueManagerOpenRequest/
  );
  assert.match(
    standaloneWindowSource,
    /<StandaloneAgentToolSidebar[\s\S]*?issueManagerOpenRequest=\{issueManagerOpenRequest\}/
  );
  assert.match(
    standaloneWindowSource,
    /prefillPromptBootstrapRequest =\s*useMemo<[\s\S]*?draftPrompt: launchDraftPrompt[\s\S]*?sequence: 1/
  );
  assert.match(
    standaloneWindowSource,
    /<LazyDesktopAgentGUIWorkbenchBody[\s\S]*?prefillPromptBootstrapRequest=\{prefillPromptBootstrapRequest\}/
  );
  assert.match(
    workbenchBodySource,
    /useState<DesktopAgentGUIPrefillPromptRequest \| null>\(\s*\(\) => prefillPromptBootstrapRequest\s*\)/
  );
});

test("standalone Agent duplicates the active window without minimizing its source", () => {
  assert.match(
    standaloneWindowSource,
    /openDetachedWindow: i18n\.t\(\s*"workspace\.agentGui\.openDetachedWindow"\s*\)/
  );
  assert.match(
    standaloneWindowSource,
    /onOpenDetachedWindow=\{handleDuplicateStandaloneWindow\}/
  );
  assert.match(
    standaloneWindowSource,
    /handleDuplicateStandaloneWindow[\s\S]*?openAgentWindow\(\{[\s\S]*?agentSessionId: nodeState\.lastActiveAgentSessionId[\s\S]*?agentTargetId: activeAgentTargetId[\s\S]*?agents: agents \?\? undefined[\s\S]*?minimizeSourceWindow: false[\s\S]*?provider: headerProvider[\s\S]*?workspaceId/
  );
});

test("standalone Agent opens Agent settings on the General section", () => {
  assert.match(
    standaloneWindowSource,
    /workspaceSettingsService\.openPanel\([\s\S]*?settingsPanelRequest\.section === "agent"[\s\S]*?\? "general"/
  );
});
