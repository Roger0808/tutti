import type { AgentSessionChromeVM } from "../contracts/agentSessionChromeVM";
import type { AgentGUISessionChrome } from "../../../agent-gui/agentGuiNode/model/agentGuiNodeTypes";

export function projectAgentSessionChromeVM(
  chrome: AgentGUISessionChrome
): AgentSessionChromeVM {
  return {
    auth: chrome.auth,
    approvalSummary: chrome.approval
      ? {
          title: chrome.approval.title,
          requestId: chrome.approval.requestId
        }
      : null,
    recovery: chrome.recovery
  };
}
