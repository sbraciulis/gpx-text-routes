import { describe, expect, it } from "vitest";
import { GLYPHS, layoutText, normalizeText, supportedChars } from "./glyphs";
import { SQUARE_GLYPHS } from "./squareGlyphs";

function isAxisAligned(stroke: { x: number; y: number }[]): boolean {
  for (let i = 1; i < stroke.length; i++) {
    const dx = Math.abs(stroke[i].x - stroke[i - 1].x);
    const dy = Math.abs(stroke[i].y - stroke[i - 1].y);
    if (dx > 1e-6 && dy > 1e-6) return false;
  }
  return true;
}

describe("glyphs", () => {
  it("defines A–Z and 0–9", () => {
    const chars = supportedChars();
    for (let i = 0; i < 10; i++) expect(chars).toContain(String(i));
    for (let i = 0; i < 26; i++) expect(chars).toContain(String.fromCharCode(65 + i));
  });

  it("gives digit 3 two disconnected bowls", () => {
    expect(GLYPHS["3"].strokes).toHaveLength(2);
    const ys = GLYPHS["3"].strokes.map(
      (stroke) => stroke.reduce((s, p) => s + p.y, 0) / stroke.length,
    );
    expect(Math.max(...ys)).toBeGreaterThan(0.5);
    expect(Math.min(...ys)).toBeLessThan(0.5);
  });

  it("lays out 33 as four strokes with a gap between characters", () => {
    const layout = layoutText("33");
    expect(layout.chars).toHaveLength(2);
    expect(layout.strokes.length).toBeGreaterThanOrEqual(4);
    expect(layout.width).toBeGreaterThan(GLYPHS["3"].width * 2);
    const left = Math.max(...layout.chars[0].strokes.flat().map((p) => p.x));
    const right = Math.min(...layout.chars[1].strokes.flat().map((p) => p.x));
    expect(right).toBeGreaterThan(left);
  });

  it("joins characters along the baseline", () => {
    const layout = layoutText("33", "square");
    const exit = layout.chars[0].strokes.at(-1)!.at(-1)!;
    const entry = layout.chars[1].strokes[0][0];
    expect(exit.y).toBeLessThan(0.12);
    expect(entry.y).toBeLessThan(0.12);
  });

  it("keeps square digits on axis-aligned bars", () => {
    for (const ch of "0123456789") {
      for (const stroke of SQUARE_GLYPHS[ch].strokes) {
        expect(isAxisAligned(stroke), `square ${ch}`).toBe(true);
      }
    }
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
