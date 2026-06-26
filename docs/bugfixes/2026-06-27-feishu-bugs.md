# 2026-06-27 Feishu Bug Records

## O0wTrJF9BerYUKc14OUchDIVnJf - workspace-reference mention routing

- Link: https://ccn53rwonxso.feishu.cn/record/O0wTrJF9BerYUKc14OUchDIVnJf
- Base record id: unresolved locally; the short record link does not include Base/table ids, Chrome MCP timed out, and unauthenticated curl reached only the Feishu login page.
- Bug: `workspace-reference` mention cannot be recognized by the agent.
- Evidence: Runtime policy already routes `mention://workspace-reference/<id>?source=...&workspaceId=...` to the `reference` skill, but Claude Code ACP's injected first-tool-call routing only mapped `workspace-issue`, `workspace-app`, and `agent-session`.
- Cause: `skillForMentionURI` missed the `mention://workspace-reference/` prefix, so Claude Code did not receive the stronger `Skill(skill="reference", args="<mention>")` instruction for this mention kind.
- Fix: Map `workspace-reference` mentions to the `reference` skill in Claude Code ACP mention routing and add a regression test.
- Verification:
  - `gofmt -w packages/agent/daemon/runtime/standard_acp_adapter.go packages/agent/daemon/runtime/standard_acp_adapter_test.go`
  - `go test ./packages/agent/daemon/runtime -run 'TestClaudeCodeAdapterExec(PrependsMentionRoutingDirective|RoutesWorkspaceReferenceMention)'`
- Status: fixed locally
- Commit: pending
- Feishu status update: not updated; real Base record id could not be resolved from the supplied short link.
