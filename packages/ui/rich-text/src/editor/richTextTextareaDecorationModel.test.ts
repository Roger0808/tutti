import assert from "node:assert/strict";
import test from "node:test";
import { buildRichTextTextareaDecorationSegments } from "./richTextTextareaDecorationModel.ts";

test("decorates markdown links with spaces and parentheses in hrefs", () => {
  const content =
    "See [White House (cropped).jpg](/Users/example/Downloads/White House (cropped).jpg) now";
  const segments = buildRichTextTextareaDecorationSegments(content);

  assert.equal(segments.length, 3);
  assert.deepEqual(segments[1], {
    type: "link",
    text: "[White House (cropped).jpg](/Users/example/Downloads/White House (cropped).jpg)",
    from: 4,
    to: 79,
    label: "White House (cropped).jpg",
    href: "/Users/example/Downloads/White House (cropped).jpg",
    kind: "file"
  });
});
