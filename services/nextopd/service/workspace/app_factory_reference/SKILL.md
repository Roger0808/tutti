---
name: nextop-workspace-app-factory
description: "Create or repair a self-contained Nextop workspace app package from a user request. Use for mention://workspace-app-factory handoffs, Nextop workspace app generation, repair, validation, manifests, bootstrap scripts, package-local AGENTS.md, local HTTP runtimes, healthchecks, app assets, optional app-runtime Nextop CLI integration, and NEXTOP_APP_* storage rules."
---

# Nextop Workspace App Factory

Use this skill to create or repair one Nextop workspace app package. The app package must be self-contained, runnable by the Nextop custom app runtime, and safe to copy into a workspace app archive.

## Required Context

Treat the current working directory as the factory job workspace. The app package must be created under the package root named by the mention context `output.packageRoot`, normally `package/`. The package root is the only generated app output directory; files outside it are scratch or coordination files and will not be published.

## Mention Contract

Treat a `mention://workspace-app-factory` link as the factory handoff. Before writing files, read `context.json` from the current working directory. Use its exact metadata, output rules, workspace context, and constraints as authoritative. Do not copy the context file into generated app outputs.

Before writing files, read these bundled references:

- `references/manifest-contract.md` for `nextop.app.json`.
- `references/cli-manifest-contract.md` for optional `nextop.cli.json`.
- `references/runtime-env.md` for runtime environment variables and storage ownership.
- `references/nextop-cli-commands.md` when the generated app runtime should call, combine, or expose local Nextop CLI capabilities.
- `references/validation-checklist.md` for completion checks.

Read `references/demos/simple-python-static-app/` only when you need a concrete complete package shape. Do not copy its demo app id, display name, description, or tags unless the user explicitly asks for the demo itself.

## Output Contract

Create or update these files under `output.packageRoot` from the context, normally `package/`:

- `nextop.app.json`: valid JSON manifest matching `references/manifest-contract.md`.
- `nextop.cli.json`: optional CLI manifest matching `references/cli-manifest-contract.md`, only when `nextop.app.json` declares `cli.manifest`.
- `bootstrap.sh`: executable shell entrypoint that starts the app server with no arguments.
- `AGENTS.md`: package-local guidance describing layout, runtime command, endpoints, data storage, and modification rules.
- `locales/<locale>/manifest.json`: manifest metadata localization files, only when the user asks for localized app metadata.
- App implementation files and assets needed for the requested behavior.

If the task supplies exact metadata such as `appId`, version, display name, or description, copy those values exactly into `nextop.app.json`. If metadata is missing, choose conservative defaults:

- `schemaVersion`: `nextop.app.manifest.v1`
- `version`: `0.1.0`
- `appId`: `app_` plus a lowercase hyphenated slug from the app name or request
- `description`: one concise sentence describing actual app behavior
- `icon`: package-local asset, preferably `{"type":"asset","src":"icon.svg"}`
- `runtime.bootstrap`: `bootstrap.sh`
- `runtime.healthcheckPath`: `/healthz`
- `localizationInfo`: omit unless the user asks for localized app metadata; when needed, follow `references/manifest-contract.md` and create each referenced locale file.

## Runtime Rules

Build a small local HTTP app. Prefer Python standard library or Node built-ins unless the user request clearly needs another stack.

The runtime must:

- Bind `$NEXTOP_APP_HOST:$NEXTOP_APP_PORT`, defaulting the host to `127.0.0.1` only when the variable is absent.
- Serve the manifest healthcheck path with a 2xx response.
- Treat `$NEXTOP_APP_PACKAGE_DIR` as read-only after startup.
- Write durable app data only under `$NEXTOP_APP_DATA_DIR`.
- Write scratch/runtime files only under `$NEXTOP_APP_RUNTIME_DIR`.
- Write logs only under `$NEXTOP_APP_LOG_DIR` when file logs are needed.
- Read `$NEXTOP_WORKSPACE_ROOT` only when the app needs workspace context.
- Launch Python with `$NEXTOP_APP_PYTHON` and Node with `$NEXTOP_APP_NODE`; use `$NEXTOP_APP_NPM` for npm install/build work.
- When the generated app calls another local Nextop capability at runtime, use `$NEXTOP_CLI` and follow `references/nextop-cli-commands.md`.
- Read the current UI locale from the optional host-injected app context when localized in-app copy is needed. Do not pass locale in the launch URL query.
- Use CSS `prefers-color-scheme` / `matchMedia("(prefers-color-scheme: dark)")` for dark/light rendering. Do not pass theme in the launch URL query.

Do not assume a Nextop API token, browser extension, daemon internals, or broad desktop APIs. The only browser-side host surface a generated app may optionally consume is the app context described in `references/runtime-env.md`.

## Dependency Rules

Avoid startup-time package installation. If dependencies or build artifacts are necessary, add an executable `prepare.sh` and keep `bootstrap.sh` focused on launching the prepared app. `prepare.sh` may use `$NEXTOP_APP_PYTHON`, `$NEXTOP_APP_NODE`, and `$NEXTOP_APP_NPM` for install and build steps.

Generated apps must not rely on system `python`, `python3`, `node`, or `npm` commands. Use the explicit managed runtime environment variables instead.

Keep generated apps small and inspectable. Do not add frameworks, background workers, databases, or network services unless they are required by the user request.

## Implementation Workflow

1. Read the required reference files.
2. Decide the smallest runtime shape that satisfies the requested behavior.
3. Write the manifest, bootstrap script, package guidance, and app files.
4. Make `bootstrap.sh` executable.
5. Validate against `references/validation-checklist.md`.
6. Fix any validation failure before finishing.

## Repair Workflow

When fixing an existing draft:

- Preserve the existing `appId` unless the user explicitly asks to change it.
- Reread the references before changing runtime or manifest behavior.
- Update `AGENTS.md` when endpoints, data files, commands, or storage rules change.
- Keep reference files out of the package root.
