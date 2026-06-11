# Local State Storage

`nextop` local state must follow one root-directory convention.

The repository-owned default names for these paths now live in:

- `config/nextop.defaults.json`

Runtime code should consume generated defaults from that source instead of duplicating literal file names in multiple implementations.

## Default Roots

- production defaults to `~/.nextop`
- local development defaults to `~/.nextop-dev`

This rule applies to local databases, logs, caches, temporary runtime metadata, and other daemon-owned state.

## Environment Rules

- `NEXTOP_ENV=development` uses `~/.nextop-dev`
- `NEXTOP_ENV=production` uses `~/.nextop`
- `NEXTOP_STATE_DIR=/custom/path` overrides both defaults

These environment variables are for development, test, packaging, and diagnostics overrides.
They are not the primary source of product defaults.

Per-file overrides such as `NEXTOPD_DB_PATH` are still allowed for narrow operational needs, but new local storage code should derive paths from the shared generated defaults and shared state root first.

## Allowed Override Surface

Current supported override surface for local state and closely-related runtime paths:

- `NEXTOP_ENV`
- `NEXTOP_STATE_DIR`
- `NEXTOP_LOG_DIR`
- `NEXTOPD_DB_PATH`
- `NEXTOPD_RUN_DIR`
- `NEXTOPD_PID_PATH`
- `NEXTOPD_LISTENER_INFO_PATH`
- `NEXTOP_AGENT_CONTEXT_CONFIG`

Rules:

- treat these variables as developer and operator escape hatches, not product settings
- prefer `NEXTOP_STATE_DIR` over adding new per-file overrides
- do not add a new environment variable when an existing shared root or generated default can express the same rule
- if a new override is truly needed, update this document and the matching transport or logging convention document in the same change

## Standard Layout

Production:

```text
~/.nextop/
  nextopd.db
  bin/
    nextop
    nextop-dev
  logs/
    nextopd.log
    nextop-desktop.log
  run/
    nextopd.listener.json
    nextopd.pid
```

Local development:

```text
~/.nextop-dev/
  nextopd.db
  bin/
    nextop
    nextop-dev
  logs/
    nextopd.log
    nextop-desktop.log
  run/
    nextopd.listener.json
    nextopd.pid
```

`nextopd.listener.json` is runtime endpoint metadata. It contains the loopback
address and per-run bearer auth needed by local clients such as the bundled
CLI, and should be written with restrictive file permissions.

Migrated agent runtime state should derive from the same root:

```text
~/.nextop[-dev]/
  agent/
    runs/
      <workspace-id>/
        <agent-session-id>/
          sidecar-manifest.json
          codex-home/
    codex/
      nextop/
        current/
          agent-context.json
```

`agent/runs` stores per-session provider sidecar state that can be recreated or
cleaned up when the owning agent session is deleted. Provider-specific homes,
generated skills, and cleanup manifests live under the matching run directory.

The exact files may appear gradually as features are implemented, but new daemon-owned local files should follow this layout.

## Current Usage

- `nextopd` SQLite database defaults to `<state-dir>/nextopd.db`
- desktop-managed local development starts `nextopd` with `NEXTOP_ENV=development`
- packaged desktop builds start `nextopd` with `NEXTOP_ENV=production`
- path helpers reserve `<state-dir>/logs` and `<state-dir>/run` for daemon log, listener-info, and pid files
- desktop main-process operational logging defaults to `<state-dir>/logs/nextop-desktop.log`
- desktop-to-daemon listener publication defaults to `<state-dir>/run/nextopd.listener.json`
- the bundled CLI discovers the managed daemon by reading `<state-dir>/run/nextopd.listener.json`
- packaged desktop shim install or repair uses `<state-dir>/bin/nextop` as the user-level command path and points it at the packaged CLI binary
- local development scripts install or repair `<state-dir>/bin/nextop-dev` as the development CLI command and default it to `NEXTOP_ENV=development`

## Validation

The repository includes a transport smoke test:

- `pnpm smoke:desktop-transport`

Use it after changing local transport, listener setup, or state path derivation.

## Logging

`nextopd` default operational logging writes to:

- `<state-dir>/logs/nextopd.log`

See [Logging](./logging.md) for output mode and level rules.

## Rule Of Thumb

When adding a new local file path:

1. start from the shared state root
2. create a domain-specific subpath under that root
3. avoid writing new daemon-owned files directly under `$HOME`
