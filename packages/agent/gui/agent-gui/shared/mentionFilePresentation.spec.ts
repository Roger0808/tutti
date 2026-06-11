import { describe, expect, it } from "vitest";
import {
  resolveAgentMentionFileThumbnailUrl,
  resolveAgentMentionFileVisualKind
} from "./mentionFilePresentation";

describe("mentionFilePresentation", () => {
  it("resolves image files as image visual kind", () => {
    expect(
      resolveAgentMentionFileVisualKind({
        path: "/workspace/assets/diagram.png"
      })
    ).toBe("image");
  });

  it("returns thumbnail urls only for image files", () => {
    expect(
      resolveAgentMentionFileThumbnailUrl({
        path: "/workspace/assets/diagram.png",
        thumbnailUrl: "data:image/png;base64,thumb"
      })
    ).toBe("data:image/png;base64,thumb");
    expect(
      resolveAgentMentionFileThumbnailUrl({
        path: "/workspace/report.docx",
        thumbnailUrl: "data:image/png;base64,thumb"
      })
    ).toBeUndefined();
  });
});
