export interface AgentSessionChromeVM {
  auth: {
    message: string;
  } | null;
  approvalSummary: {
    title: string;
    requestId: string;
  } | null;
  recovery: {
    kind: "activating" | "failed" | "warning";
    message: string;
    canRetry?: boolean;
    followupAction?: "continue-in-new-conversation";
  } | null;
}
