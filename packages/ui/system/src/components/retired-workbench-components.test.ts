import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readMetadataIds() {
  const metadataPath = new URL("../metadata/components.json", import.meta.url);
  const metadata = JSON.parse(readFileSync(metadataPath, "utf8")) as {
    components: Array<{ id: string }>;
  };

  return new Set(metadata.components.map((component) => component.id));
}

test("retired workbench components no longer export from the shared component barrel", () => {
  const indexSource = readFileSync(
    new URL("./index.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(indexSource, /export \* from "\.\/agent-gui-workbench";/);
  assert.doesNotMatch(
    indexSource,
    /export \* from "\.\/workspace-file-manager-panel";/
  );
});

test("retired workbench components no longer register ui-system metadata ids", () => {
  const metadataIds = readMetadataIds();

  assert.equal(metadataIds.has("agent-gui-workbench"), false);
  assert.equal(metadataIds.has("workspace-file-manager-panel"), false);
});
