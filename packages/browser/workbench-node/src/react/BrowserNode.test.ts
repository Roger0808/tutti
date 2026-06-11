import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("Browser Node webview allows popup windows", () => {
  const source = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "BrowserNode.tsx"),
    "utf8"
  );

  assert.match(
    source,
    /browserNodeAllowPopupsAttribute = "true" as unknown as boolean/
  );
  assert.match(
    source,
    /<webview[\s\S]*\sallowpopups=\{browserNodeAllowPopupsAttribute\}[\s\S]*\/>/
  );
});
