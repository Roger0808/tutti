import assert from "node:assert/strict";
import test from "node:test";
import {
  createRichTextMentionAttrs,
  resolveRichTextMentionView
} from "./mention.ts";

test("resolveRichTextMentionView does not expose stored href without explicit resolution", () => {
  const mention = createRichTextMentionAttrs("user", {
    entityId: "u_123",
    href: "/people/u_123",
    label: "Alice"
  });

  const view = resolveRichTextMentionView(mention);

  assert.equal(view.state, "active");
  assert.equal(view.href, undefined);
});

test("resolveRichTextMentionView keeps explicit resolved href", () => {
  const mention = createRichTextMentionAttrs("user", {
    entityId: "u_123",
    href: "/people/u_123",
    label: "Alice"
  });

  const view = resolveRichTextMentionView(mention, {
    href: "/profiles/u_123",
    state: "active"
  });

  assert.equal(view.href, "/profiles/u_123");
});
