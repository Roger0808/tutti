import { describe, expect, it } from "vitest";
import { resolveAgentMentionPalettePosition } from "./agentMentionPalettePosition";

describe("resolveAgentMentionPalettePosition", () => {
  it("anchors the palette to the lower-right of the @ trigger by default", () => {
    const result = resolveAgentMentionPalettePosition({
      anchorRect: {
        left: 220,
        top: 340,
        right: 232,
        bottom: 360,
        width: 12,
        height: 20
      },
      shellRect: {
        left: 160,
        top: 300,
        right: 760,
        bottom: 480,
        width: 600,
        height: 180
      },
      paletteSize: {
        width: 420,
        height: 260
      },
      viewportWidth: 1280,
      viewportHeight: 900
    });

    expect(result.placement).toBe("bottom");
    expect(result.left).toBe(72);
    expect(result.top).toBe(68);
    expect(result.width).toBe(420);
    expect(result.maxWidth).toBe(576);
  });

  it("flips above when the space below the trigger is insufficient", () => {
    const result = resolveAgentMentionPalettePosition({
      anchorRect: {
        left: 240,
        top: 720,
        right: 252,
        bottom: 740,
        width: 12,
        height: 20
      },
      shellRect: {
        left: 180,
        top: 680,
        right: 780,
        bottom: 860,
        width: 600,
        height: 180
      },
      paletteSize: {
        width: 420,
        height: 260
      },
      viewportWidth: 1280,
      viewportHeight: 760
    });

    expect(result.placement).toBe("top");
    expect(result.left).toBe(72);
    expect(result.top).toBe(-228);
  });

  it("keeps the palette inside the composer width when near the right edge", () => {
    const result = resolveAgentMentionPalettePosition({
      anchorRect: {
        left: 680,
        top: 340,
        right: 692,
        bottom: 360,
        width: 12,
        height: 20
      },
      shellRect: {
        left: 160,
        top: 300,
        right: 760,
        bottom: 480,
        width: 600,
        height: 180
      },
      paletteSize: {
        width: 420,
        height: 260
      },
      viewportWidth: 1280,
      viewportHeight: 900
    });

    expect(result.left).toBe(168);
    expect(result.width).toBe(420);
  });

  it("shrinks the palette on narrow composers instead of overflowing", () => {
    const result = resolveAgentMentionPalettePosition({
      anchorRect: {
        left: 220,
        top: 340,
        right: 232,
        bottom: 360,
        width: 12,
        height: 20
      },
      shellRect: {
        left: 160,
        top: 300,
        right: 440,
        bottom: 480,
        width: 280,
        height: 180
      },
      paletteSize: {
        width: 420,
        height: 260
      },
      viewportWidth: 1280,
      viewportHeight: 900
    });

    expect(result.left).toBe(12);
    expect(result.width).toBe(256);
    expect(result.maxWidth).toBe(256);
  });
});
