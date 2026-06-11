import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";
import { buildNextopAppRuntimeCatalog } from "./build-nextop-app-runtime-catalog.mjs";

const runtimeWorkflowPath = new URL(
  "../../.github/workflows/publish-nextop-app-runtime.yml",
  import.meta.url
);

test("buildNextopAppRuntimeCatalog writes runtime catalog from artifact metadata", async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), "nextop-runtime-catalog-"));
  const darwin = await runtimeMetadataFile(tempDir, {
    platform: "darwin-arm64",
    components: {
      python: {
        artifactPath:
          "2026.06.0/darwin-arm64/python/nextop-app-runtime-python-darwin-arm64-2026.06.0.zip",
        artifactSha256: "a".repeat(64)
      }
    },
    profiles: {
      baseline: ["python"]
    }
  });
  const linux = await runtimeMetadataFile(tempDir, {
    platform: "linux-amd64",
    components: {
      node: {
        artifactPath:
          "2026.06.0/linux-amd64/node/nextop-app-runtime-node-linux-amd64-2026.06.0.zip",
        artifactSha256: "b".repeat(64)
      }
    },
    profiles: {
      baseline: ["node"]
    }
  });
  const output = path.join(tempDir, "catalog.json");

  const catalog = await buildNextopAppRuntimeCatalog({
    artifactBaseUrl: "https://cdn.example.test/app-runtimes/",
    metadataFiles: [linux, darwin],
    output
  });

  assert.deepEqual(Object.keys(catalog.runtimes), [
    "darwin-arm64",
    "linux-amd64"
  ]);
  assert.deepEqual(JSON.parse(await readFile(output, "utf8")), catalog);
  assert.equal(
    catalog.runtimes["darwin-arm64"].components.python.artifactUrl,
    "https://cdn.example.test/app-runtimes/2026.06.0/darwin-arm64/python/nextop-app-runtime-python-darwin-arm64-2026.06.0.zip"
  );
  assert.deepEqual(catalog.runtimes["darwin-arm64"].profiles.baseline, [
    "python"
  ]);
});

test("buildNextopAppRuntimeCatalog rejects duplicate platforms", async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), "nextop-runtime-catalog-"));
  const first = await runtimeMetadataFile(tempDir, {
    platform: "darwin-arm64",
    components: {
      python: {
        artifactPath: "2026.06.0/darwin-arm64/python/first.zip",
        artifactSha256: "a".repeat(64)
      }
    },
    profiles: {
      baseline: ["python"]
    }
  });
  const second = await runtimeMetadataFile(tempDir, {
    platform: "darwin-arm64",
    components: {
      python: {
        artifactPath: "2026.06.0/darwin-arm64/python/second.zip",
        artifactSha256: "b".repeat(64)
      }
    },
    profiles: {
      baseline: ["python"]
    }
  });

  await assert.rejects(
    () =>
      buildNextopAppRuntimeCatalog({
        artifactBaseUrl: "https://cdn.example.test/app-runtimes",
        metadataFiles: [first, second],
        output: path.join(tempDir, "catalog.json")
      }),
    /duplicate runtime platform darwin-arm64/
  );
});

test("Tutti app runtime workflow publishes immutable artifacts and mutable catalog", async () => {
  const workflow = await readFile(runtimeWorkflowPath, "utf8");

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /config\/nextop\.app-runtime\.lock\.json/);
  assert.match(workflow, /uv python install --no-bin "\$\{PYTHON_VERSION\}"/);
  assert.match(workflow, /SHASUMS256\.txt/);
  assert.match(
    workflow,
    /nextop-app-runtime-python-\$\{PLATFORM\}-\$\{RUNTIME_VERSION\}\.zip/
  );
  assert.match(
    workflow,
    /nextop-app-runtime-node-\$\{PLATFORM\}-\$\{RUNTIME_VERSION\}\.zip/
  );
  assert.match(workflow, /node\/bin\/npm/);
  assert.match(workflow, /npm-cli\.js/);
  assert.match(workflow, /node\/bin\/npx/);
  assert.match(workflow, /npx-cli\.js/);
  assert.match(workflow, /\$\{node_staging\}\/node\/bin\/npm" --version/);
  assert.match(workflow, /\$\{node_staging\}\/node\/bin\/npx" --version/);
  assert.match(workflow, /build-nextop-app-runtime-catalog\.mjs/);
  assert.match(workflow, /max-age=31536000, immutable/);
  assert.match(workflow, /max-age=60/);
});

async function runtimeMetadataFile(tempDir, overrides) {
  const baseMetadata = {
    schemaVersion: "nextop.app.runtime-platform.v2",
    runtimeVersion: "2026.06.0",
    platform: "darwin-arm64",
    pythonVersion: "3.12.13",
    nodeVersion: "22.22.3",
    components: {
      python: {
        version: "3.12.13",
        artifactPath:
          "2026.06.0/darwin-arm64/python/nextop-app-runtime-python-darwin-arm64-2026.06.0.zip",
        artifactSha256: "a".repeat(64),
        artifactSizeBytes: 123
      },
      node: {
        version: "22.22.3",
        artifactPath:
          "2026.06.0/darwin-arm64/node/nextop-app-runtime-node-darwin-arm64-2026.06.0.zip",
        artifactSha256: "b".repeat(64),
        artifactSizeBytes: 456
      }
    },
    profiles: {
      baseline: ["python", "node"]
    }
  };
  const metadata = {
    ...baseMetadata,
    ...overrides
  };
  if (overrides.components) {
    metadata.components = Object.fromEntries(
      Object.entries(overrides.components).map(([name, component]) => [
        name,
        {
          ...baseMetadata.components[name],
          version:
            component.version ??
            (name === "node"
              ? baseMetadata.nodeVersion
              : baseMetadata.pythonVersion),
          artifactSizeBytes: component.artifactSizeBytes ?? 123,
          ...component
        }
      ])
    );
  }
  const filePath = path.join(
    tempDir,
    `${metadata.platform}-${Math.random()}.json`
  );
  await writeFile(filePath, `${JSON.stringify(metadata, null, 2)}\n`);
  return filePath;
}
