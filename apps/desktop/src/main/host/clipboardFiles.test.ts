import assert from "node:assert/strict";
import test from "node:test";
import { buildFilenamesPlist } from "./clipboardFilePlist.ts";

test("buildFilenamesPlist escapes special characters", () => {
  const plist = buildFilenamesPlist(["/Users/demo/Desktop/a&b<file>.txt"]);

  assert.match(plist, /a&amp;b&lt;file&gt;\.txt/);
  assert.match(plist, /<array>/);
});
