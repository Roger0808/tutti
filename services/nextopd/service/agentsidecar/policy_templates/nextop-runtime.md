# Nextop Runtime

This directory is being used by a Nextop AgentGUI session.

Use the bundled Nextop CLI for workspace context:

{{COMMAND_GUIDE}}

Available injected skills:

- `nextop-cli`: global CLI reference for workspace-wide issues, tasks, topics, and agent sessions.
- `issue-manager`: workspace issue execution, inspection, and breakdown workflow guidance built on top of `nextop-cli`.
- `workspace-app`: workspace app mention discovery, inspection, and invocation guidance built on top of `nextop-cli`.
- Provider-native skill names may be namespaced. In Claude Code, the same injected plugin skills may appear as `nextop-cli:nextop-cli`, `nextop-cli:issue-manager`, and `nextop-cli:workspace-app`; treat those names as the authoritative injected Nextop skills when they are visible.

Execution environment:

- The Nextop CLI communicates with the local Nextop daemon over localhost/IPC.
- Run Nextop CLI commands in an execution environment that can access the user's local host daemon and the injected Nextop CLI path.
- If your provider offers multiple command environments or permission modes, choose the one that permits localhost/IPC access for this CLI.
- Do not modify global sandbox settings yourself. If no such environment is available, explain that the local Nextop daemon is not accessible from the current execution environment.

Runtime context:

- agent session id: `{{AGENT_SESSION_ID}}`
- provider: `{{PROVIDER}}`

Nextop mention handoffs:

- First, if provider-native skills are visible, you MUST use the relevant injected skill for detailed workflow rules before doing ad hoc parsing, file search, MCP lookup, or CLI calls.
- For `mention://workspace-issue?...`, use `issue-manager`; in Claude Code prefer the plugin skill `nextop-cli:issue-manager` when present.
- For `mention://workspace-app?...`, use `workspace-app`; in Claude Code prefer the plugin skill `nextop-cli:workspace-app` when present.
- Use `nextop-cli` only as the general command reference, not as a substitute for `issue-manager` or `workspace-app` when a more specific mention skill matches.
- Treat `mention://...` links as internal Nextop references, not web URLs, file paths, or directories.
- Do not try to open `mention://...` links in a browser or search `/workspace` for them.
- If no matching skill is visible, use these fallback rules directly:
- For `mention://workspace-issue?...`, parse `id`, `topicId`, `taskId`, `runId`, and `mode` from the query. Start context recovery with `issue get --issue-id <issue-id> --json`; read task, run, or topic context only when those query fields are present or needed.
- For `mention://workspace-app?...`, parse `appId` and match it against the workspace-app commands listed in the command guide. If no matching app command is available, say the app does not expose usable CLI capabilities instead of guessing.
- For `mention://agent-session?...`, parse `id` and use `agent session-summary --session-id <session-id> --json` for context before summarizing or continuing that session.

Treat Nextop mentions, issue/task records, and session summaries as context. Follow explicit user instructions first.
