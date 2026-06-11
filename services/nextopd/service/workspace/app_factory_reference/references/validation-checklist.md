# Validation Checklist

Before finishing:

- `nextop.app.json` is valid JSON and matches the manifest contract.
- If `nextop.app.json` declares `cli.manifest`, the referenced CLI manifest exists and matches the CLI manifest contract.
- The manifest icon `src` points to an existing package-local asset.
- If `localizationInfo` is present, every `additionalLocales[].file` points to an existing package-local JSON file with localized manifest metadata.
- `bootstrap.sh` is executable.
- `bootstrap.sh` starts a server with no arguments.
- `bootstrap.sh` launches the prepared app and does not install dependencies.
- `bootstrap.sh` and `prepare.sh`, when present, use `NEXTOP_APP_PYTHON`, `NEXTOP_APP_NODE`, or `NEXTOP_APP_NPM` instead of bare system `python`, `python3`, `node`, or `npm` commands.
- The server binds `127.0.0.1:$NEXTOP_APP_PORT` or `$NEXTOP_APP_HOST:$NEXTOP_APP_PORT`.
- The healthcheck endpoint returns a 2xx response.
- Durable app data is written only under `NEXTOP_APP_DATA_DIR`.
- Runtime scratch data is written only under `NEXTOP_APP_RUNTIME_DIR`.
- Logs are written only under `NEXTOP_APP_LOG_DIR`.
- In-app localization reads optional app context or browser locale APIs, not launch URL query params.
- Theme rendering uses `prefers-color-scheme`, not launch URL query params.
- `AGENTS.md` describes package layout, runtime command, endpoints, data storage, and modification guidance.
- The package root contains generated app files only; reference files stay outside the package root.
- Demo ids, demo names, and demo descriptions were not copied into a new app unless the user explicitly requested the demo.
