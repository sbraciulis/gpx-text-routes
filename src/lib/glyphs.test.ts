import { describe, expect, it } from "vitest";
import { GLYPHS, layoutText, normalizeText, supportedChars } from "./glyphs";

describe("glyphs", () => {
  it("defines A–Z and 0–9", () => {
    const chars = supportedChars();
    for (let i = 0; i < 10; i++) expect(chars).toContain(String(i));
    for (let i = 0; i < 26; i++) expect(chars).toContain(String.fromCharCode(65 + i));
  });

  it("gives digit 3 two disconnected bowls", () => {
    expect(GLYPHS["3"].strokes).toHaveLength(2);
    const [top, bottom] = GLYPHS["3"].strokes;
    const topY = top.reduce((s, p) => s + p.y, 0) / top.length;
    const botY = bottom.reduce((s, p) => s + p.y, 0) / bottom.length;
    expect(topY).toBeGreaterThan(0.5);
    expect(botY).toBeLessThan(0.5);
  });

  it("lays out 33 as four strokes with a gap between characters", () => {
    const layout = layoutText("33");
    expect(layout.strokes).toHaveLength(4);
    expect(layout.width).toBeGreaterThan(GLYPHS["3"].width * 2);
    const left = Math.max(...layout.strokes[0].map((p) => p.x));
    const right = Math.min(...layout.strokes[2].map((p) => p.x));
    expect(right).toBeGreaterThan(left);
  });

  it("normalizes to uppercase and drops unsupported characters", () => {
    expect(normalizeText("hi!")).toBe("HI");
    expect(normalizeText("3-3")).toBe("33");
  });

  it("treats spaces as width-only (no strokes)", () => {
    const a = layoutText("A");
    const spaced = layoutText("A A");
    expect(spaced.strokes).toHaveLength(a.strokes.length * 2);
    expect(spaced.width).toBeGreaterThan(a.width * 2);
  });
});
