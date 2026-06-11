import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    "AnalyticsDebugFloatingEntry.tsx"
  ),
  "utf8"
);

test("analytics debug floating entry keeps trigger and panel on the same top overlay layer", () => {
  assert.match(source, /z-\[var\(--z-dialog-popover\)\]/);
  assert.match(
    source,
    /style=\{\{\s*zIndex:\s*"var\(--z-dialog-popover\)"\s*\}\}/s
  );
});

test("analytics debug event params wrap with the panel scroll instead of clipping inside each event", () => {
  assert.doesNotMatch(source, /<pre[^>]*max-h-40/s);
  assert.match(source, /<pre[^>]*whitespace-pre-wrap/s);
  assert.match(source, /<pre[^>]*\[overflow-wrap:anywhere\]/s);
});

test("analytics debug panel stays open on outside interaction and closes from the header close button", () => {
  assert.match(source, /const \[panelOpen, setPanelOpen\] = useState/);
  assert.match(source, /<Popover\s+open=\{panelOpen\}/s);
  assert.doesNotMatch(source, /window\.addEventListener\("pointerdown"/);
  assert.match(source, /onInteractOutside=\{\(event\) => \{/);
  assert.match(source, /event\.preventDefault\(\);/);
  assert.match(
    source,
    /aria-label=\{t\("workspace\.analyticsDebug\.close"\)\}/
  );
  assert.match(source, /onClick=\{\(\) => setPanelOpen\(false\)\}/);
  assert.match(source, /<CloseIcon[^>]*\/>/);
});
