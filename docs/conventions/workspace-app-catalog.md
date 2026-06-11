# Workspace App Catalog

Workspace App Center can show built-in apps from two sources:

- embedded app packages committed in `services/nextopd/builtin-apps`
- remote built-in app packages listed by a JSON catalog

Remote built-in apps are optional. App Center can show their name, description, and icon before the package is downloaded. The package zip is downloaded only when the user installs the app.

## Runtime Overrides

`NEXTOP_APP_CATALOG_FILE` points nextopd at a local catalog JSON file and has priority over `NEXTOP_APP_CATALOG_URL`.

When `NEXTOP_APP_CATALOG_URL` is unset, nextopd loads the default published catalog:

```text
https://d1x7gb6wqsqmnm.cloudfront.net/nextop-app-releases/catalog.json
```

Staging releases use a separate catalog and must not write production
`latest.json` objects:

```text
https://d1x7gb6wqsqmnm.cloudfront.net/nextop-app-releases-staging/catalog.json
```

`NEXTOP_APP_CATALOG_URL` points nextopd at a public HTTP(S) catalog JSON file, usually served through CloudFront or S3. Set it to an empty string to disable the default remote catalog.

Example local mock:

```sh
NEXTOP_APP_CATALOG_FILE=/tmp/nextop-app-catalog/catalog.json pnpm dev:desktop
```

## Refresh Behavior

`nextopd` is the source of truth for remote catalog retrieval, manifest validation, artifact URLs, and artifact SHA-256 values. Renderer code should ask `nextopd` to refresh the catalog instead of fetching the CDN catalog directly.

App Center opening should call `POST /v1/workspaces/{workspaceID}/apps/catalog/refresh`. The refresh request is in-flight deduplicated by `nextopd`, keeps local and previously loaded apps visible while loading, and retries retryable network or 5xx failures for a total of three attempts.

## Catalog Shape

```json
{
  "schemaVersion": "nextop.app.catalog.v1",
  "apps": [
    {
      "manifest": {
        "schemaVersion": "nextop.app.manifest.v1",
        "appId": "vibe-design",
        "version": "0.1.0+abc123",
        "name": "Vibe Design",
        "description": "Design workspace",
        "icon": {
          "type": "asset",
          "src": "icon.svg"
        },
        "runtime": {
          "bootstrap": "bootstrap.sh",
          "healthcheckPath": "/"
        }
      },
      "distribution": {
        "kind": "remote",
        "artifactUrl": "https://cdn.example.test/apps/vibe-design/0.1.0%2Babc123/vibe-design-0.1.0%2Babc123.zip",
        "artifactSha256": "64-char-sha256",
        "iconUrl": "https://cdn.example.test/apps/vibe-design/0.1.0%2Babc123/icon.svg"
      }
    }
  ]
}
```

Remote catalog entries must include `distribution.iconUrl`, `distribution.artifactUrl`, `distribution.artifactSha256`, and a manifest icon asset. The zip package must contain a complete app package with `nextop.app.json`, `bootstrap.sh`, `AGENTS.md`, and the manifest icon asset.

Workspace app packages do not declare runtime kind or bundle Python/Node. Managed runtime release and download rules belong to [Workspace App Runtime](./workspace-app-runtime.md).

## Release Flow

External app repositories should call `.github/workflows/publish-nextop-app-release.yml` from this repository. The reusable workflow:

1. Checks out the app repository.
2. Runs the app repository package command.
3. Runs `@tutti-os/app-release-tools`.
4. Generates a zip, immutable `release.json`, and mutable `latest.json`.
5. Uploads the release directory and `latest.json` to S3.

The default release version is `manifest.version+<short git sha>`. Callers can pass `release_version` to override it.

Each app uploads under:

```text
apps/<appId>/<version>/
apps/<appId>/latest.json
```

The Tutti repository owns `.github/workflows/publish-nextop-app-catalog.yml`. That workflow reads selected `apps/<appId>/latest.json` files from S3 and publishes one shared `catalog.json`. It defaults to merge mode, which preserves existing catalog apps and updates only selected app ids. Replace mode publishes only the selected app ids and should be used only for deliberate full catalog replacement.

Production and staging release metadata must stay on separate S3 prefixes:

```text
nextop-app-releases/apps/<appId>/latest.json
nextop-app-releases/catalog.json

nextop-app-releases-staging/apps/<appId>/latest.json
nextop-app-releases-staging/catalog.json
```

Use `.github/workflows/publish-nextop-app-catalog-staging.yml` to publish a
staging catalog. Use `.github/workflows/publish-nextop-app-catalog.yml` to
publish the production catalog. Production catalog publishing must read only
production release metadata; staging catalog publishing must read only staging
release metadata. In merge mode, an empty app id input refreshes the existing
catalog and invalidates CloudFront without changing the app set, as long as an
existing `catalog.json` is already present.
