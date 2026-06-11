import type { IssueManagerIdentityAdapter } from "@tutti-os/workspace-issue-manager/contracts";

export function createDesktopIssueManagerIdentityAdapter(): IssueManagerIdentityAdapter {
  return {
    currentUser() {
      return {
        displayName: "Local",
        userId: "local"
      };
    }
  };
}
