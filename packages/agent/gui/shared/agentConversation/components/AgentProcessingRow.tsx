import type { JSX } from "react";
import type { AgentProcessingRowVM } from "../contracts/agentProcessingRowVM";

export function AgentProcessingRow({
  row,
  label
}: {
  row: AgentProcessingRowVM;
  label: string;
}): JSX.Element {
  "use memo";

  return (
    <div
      data-row-id={row.id}
      className="workspace-agents-status-panel__detail-processing tsh-inline-scanlight-group inline-flex items-center gap-1.5"
    >
      <span className="tsh-inline-scanlight-line font-semibold">
        {processingLabel(row, label)}
        <LoadingEllipsis />
      </span>
    </div>
  );
}

function processingLabel(row: AgentProcessingRowVM, fallback: string): string {
  if (row.label?.trim()) {
    return row.label.trim();
  }
  return fallback;
}

function LoadingEllipsis(): JSX.Element {
  "use memo";
  return (
    <span
      className="tsh-inline-loading-ellipsis tsh-inline-loading-ellipsis--entry-timing"
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </span>
  );
}
