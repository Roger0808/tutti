# Nextop CLI Commands

This reference is for code inside a generated workspace app at runtime. It is not the Agent's own Nextop CLI workflow guide.

Workspace apps may call local Nextop capabilities through the bundled Nextop CLI.

Always use the command path from `NEXTOP_CLI`:

```python
import json
import os
import subprocess

def run_nextop(args, timeout=15):
    command = os.environ.get("NEXTOP_CLI", "").strip()
    if not command:
        raise RuntimeError("NEXTOP_CLI is not configured")
    result = subprocess.run(
        [command, "--json", *args],
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout).strip())
    return json.loads(result.stdout or "{}")
```

`NEXTOP_CLI` is the stable app-runtime contract across development and packaged production.

## Discovery

The CLI command set is dynamic. It includes daemon-owned commands plus commands exposed by installed workspace apps through `nextop.cli.json`.

Generated apps that integrate with another app should probe commands before depending on them:

- `[NEXTOP_CLI, "--help"]`: list current top-level command groups.
- `[NEXTOP_CLI, "<group>", "--help"]`: list commands under a group.
- `[NEXTOP_CLI, "<group>", "<command>", "--help"]`: inspect flags and documentation hints.
- Add `--json` before the command path for machine-readable command results, for example `[NEXTOP_CLI, "--json", "status"]` or `[NEXTOP_CLI, "--json", "weather", "refresh"]`.

If a command is missing or returns a non-zero exit code, keep the app usable and show a local fallback state rather than failing startup.

## Command Discovery

The command set can differ by workspace and installed apps. Discover commands at runtime instead of hard-coding a static catalog. Common command groups may include:

- `status`: show local `nextopd` health.
- `doctor`: daemon and command-routing diagnostics.
- `agent`: start, list, send to, open, cancel, and inspect agent sessions and providers.
- `issue`: create, list, update, delete, and manage issue topics, tasks, and runs.
- App-provided groups such as `weather`, `automation`, or `news` may appear when those apps are installed and enabled in the workspace.

App-provided command groups are the important composition surface. For example, a dashboard app can call a weather app with `[NEXTOP_CLI, "--json", "weather", "refresh"]` if that command exists, and can call a news app through whatever command group that app exposes, such as `[NEXTOP_CLI, "--json", "news", "latest"]`.

## Example Weather Commands

When a compatible weather app is installed, it might expose commands like:

- `weather search --query <place>`: search locations.
- `weather add --name <name> --latitude <lat> --longitude <lon> [--admin1 <region>] [--country <country>] [--id <id>] [--timezone <tz>]`: save a location.
- `weather locations`: list saved locations.
- `weather refresh [--location <id-or-name>]`: fetch weather for a saved location.

Use help at runtime before assuming this shape. A different weather app may expose different paths.

## Composition Guidelines

- Call reusable local Nextop capabilities through `NEXTOP_CLI`.
- Use `--json` for app-to-app calls so parsing stays stable.
- Keep timeouts short and handle failures gracefully.
- Keep command handlers acyclic when the app also exposes `nextop.cli.json` commands.
- Mention any CLI integrations in package `AGENTS.md`, including the command paths the app tries and the fallback behavior.
