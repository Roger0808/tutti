import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    "WorkspaceSettingsPanel.tsx"
  ),
  "utf8"
);

test("workspace settings developer panel exposes analytics debug switch only when available", () => {
  assert.match(source, /useAnalyticsDebugPreferenceService/);
  assert.match(source, /analyticsDebugAvailable \? \(/);
  assert.match(source, /<Switch\s/s);
  assert.match(source, /checked=\{analyticsDebugEnabled\}/);
  assert.match(source, /onCheckedChange=\{onAnalyticsDebugEnabledChange\}/);
});

test("workspace settings panel lists appearance below general", () => {
  assert.match(
    source,
    /id: "general" as const,[\s\S]*id: "appearance" as const,[\s\S]*id: "developer" as const/
  );
});

test("workspace settings general panel lists language before default provider", () => {
  assert.match(
    source,
    /workspace\.settings\.general\.languageLabel[\s\S]*workspace\.settings\.general\.defaultAgentProviderLabel/
  );
});

test("workspace settings appearance panel owns visual settings", () => {
  assert.match(source, /WorkspaceAppearanceSettingsSection/);
  assert.match(source, /workspace\.settings\.appearance\.themeLabel/);
  assert.match(source, /workspace\.settings\.appearance\.dockPlacementLabel/);
  assert.match(source, /workspace\.settings\.appearance\.wallpaperLabel/);
});
