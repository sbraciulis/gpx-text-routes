import { describe, expect, it } from "vitest";
import { GLYPHS, layoutText, normalizeText, supportedChars } from "./glyphs";
import { SQUARE_GLYPHS } from "./squareGlyphs";
import type { Glyph, Stroke } from "../types";

function isAxisAligned(stroke: { x: number; y: number }[]): boolean {
  for (let i = 1; i < stroke.length; i++) {
    const dx = Math.abs(stroke[i].x - stroke[i - 1].x);
    const dy = Math.abs(stroke[i].y - stroke[i - 1].y);
    if (dx > 1e-6 && dy > 1e-6) return false;
  }
  return true;
}

function signature(glyph: Glyph): string {
  return glyph.strokes
    .map((stroke) => stroke.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(";"))
    .join("|");
}

function rotate180(glyph: Glyph): Glyph {
  return {
    width: glyph.width,
    strokes: glyph.strokes.map((stroke) =>
      stroke.map((p) => ({ x: glyph.width - p.x, y: 1 - p.y })),
    ),
  };
}

function flipX(glyph: Glyph): Glyph {
  return {
    width: glyph.width,
    strokes: glyph.strokes.map((stroke) =>
      stroke.map((p) => ({ x: glyph.width - p.x, y: p.y })),
    ),
  };
}

function hasDiagonal(stroke: Stroke): boolean {
  for (let i = 1; i < stroke.length; i++) {
    const dx = Math.abs(stroke[i].x - stroke[i - 1].x);
    const dy = Math.abs(stroke[i].y - stroke[i - 1].y);
    if (dx > 1e-6 && dy > 1e-6) return true;
  }
  return false;
}

function coversY(glyph: Glyph, y: number, eps = 0.04): boolean {
  return glyph.strokes.some((stroke) =>
    stroke.some((p, i) => {
      if (i === 0) return Math.abs(p.y - y) <= eps;
      const a = stroke[i - 1];
      const lo = Math.min(a.y, p.y) - eps;
      const hi = Math.max(a.y, p.y) + eps;
      return y >= lo && y <= hi && Math.abs(a.x - p.x) < 1e-6;
    }),
  );
}

describe("glyphs", () => {
  it("defines A–Z and 0–9", () => {
    const chars = supportedChars();
    for (let i = 0; i < 10; i++) expect(chars).toContain(String(i));
    for (let i = 0; i < 26; i++) expect(chars).toContain(String.fromCharCode(65 + i));
  });

  it("draws digit 3 as one continuous stroke", () => {
    expect(GLYPHS["3"].strokes).toHaveLength(1);
    expect(SQUARE_GLYPHS["3"].strokes).toHaveLength(1);
    const square = SQUARE_GLYPHS["3"].strokes[0];
    const ys = square.map((p) => p.y);
    expect(Math.max(...ys)).toBeGreaterThan(0.95);
    expect(Math.min(...ys)).toBeLessThan(0.05);
    const mid = square.filter((p) => Math.abs(p.y - 0.5) < 0.02);
    expect(mid.length).toBeGreaterThanOrEqual(2);
    expect(Math.min(...mid.map((p) => p.x))).toBeLessThan(0.25);
  });

  it("lays out 33 as two strokes with a gap between characters", () => {
    const layout = layoutText("33");
    expect(layout.chars).toHaveLength(2);
    expect(layout.strokes).toHaveLength(2);
    expect(layout.width).toBeGreaterThan(GLYPHS["3"].width * 2);
    const left = Math.max(...layout.chars[0].strokes.flat().map((p) => p.x));
    const right = Math.min(...layout.chars[1].strokes.flat().map((p) => p.x));
    expect(right).toBeGreaterThan(left);
  });

  it("joins characters along the baseline without drawing extra stems", () => {
    const layout = layoutText("33", "square");
    expect(layout.chars[0].exit.y).toBeLessThan(0.12);
    expect(layout.chars[1].entry.y).toBeLessThan(0.12);
    const rawWidth = SQUARE_GLYPHS["3"].strokes.flat().length;
    const laidWidth = layout.chars[0].strokes.flat().length;
    expect(laidWidth).toBe(rawWidth);
  });

  it("keeps square digits on axis-aligned bars except the slashed zero", () => {
    for (const ch of "123456789") {
      for (const stroke of SQUARE_GLYPHS[ch].strokes) {
        expect(isAxisAligned(stroke), `square ${ch}`).toBe(true);
      }
    }
    const slashes = SQUARE_GLYPHS["0"].strokes.filter(hasDiagonal);
    expect(slashes).toHaveLength(1);
    expect(SQUARE_GLYPHS["0"].strokes.filter((s) => isAxisAligned(s)).length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it("makes square 6 and 9 180° mirrors", () => {
    expect(signature(SQUARE_GLYPHS["9"])).toBe(signature(rotate180(SQUARE_GLYPHS["6"])));
  });

  it("makes square 2 and 5 left-right mirrors, not copies of S", () => {
    expect(signature(SQUARE_GLYPHS["5"])).toBe(signature(flipX(SQUARE_GLYPHS["2"])));
    expect(signature(SQUARE_GLYPHS["5"])).not.toBe(signature(SQUARE_GLYPHS["S"]));
    expect(SQUARE_GLYPHS["2"].strokes).toHaveLength(5);
    expect(SQUARE_GLYPHS["5"].strokes).toHaveLength(5);
  });

  it("keeps 0/O, 1/I, 8/B from sharing the same square outline", () => {
    expect(signature(SQUARE_GLYPHS["0"])).not.toBe(signature(SQUARE_GLYPHS.O));
    expect(signature(SQUARE_GLYPHS["1"])).not.toBe(signature(SQUARE_GLYPHS.I));
    expect(signature(SQUARE_GLYPHS["8"])).not.toBe(signature(SQUARE_GLYPHS.B));
    expect(SQUARE_GLYPHS["0"].strokes.some(hasDiagonal)).toBe(true);
    expect(SQUARE_GLYPHS.O.strokes.every((s) => !hasDiagonal(s))).toBe(true);
    expect(coversY(SQUARE_GLYPHS.I, 0)).toBe(true);
    expect(coversY(SQUARE_GLYPHS["1"], 0)).toBe(true);
    expect(SQUARE_GLYPHS["1"].strokes.some((s) => s.some((p) => p.y >= 0.99 && p.x < 0.2))).toBe(
      true,
    );
  });

  it("keeps square 4 open (full stem + mid bar, no top cap)", () => {
    const four = SQUARE_GLYPHS["4"];
    expect(coversY(four, 0)).toBe(true);
    expect(coversY(four, 1)).toBe(true);
    const topBar = four.strokes.some((stroke) =>
      stroke.some((p, i) => {
        if (i === 0) return false;
        const a = stroke[i - 1];
        return a.y > 0.95 && p.y > 0.95 && Math.abs(a.x - p.x) > 0.3;
      }),
    );
    expect(topBar).toBe(false);
  });

  it("gives rounded 0 a slash so it is not an O", () => {
    const slash = (glyph: typeof GLYPHS["0"]) =>
      glyph.strokes.find((s) => s.length === 2 && hasDiagonal(s));
    expect(slash(GLYPHS["0"])).toBeTruthy();
    expect(slash(GLYPHS.O)).toBeUndefined();
    expect(GLYPHS["0"].strokes.length).toBeGreaterThan(GLYPHS.O.strokes.length);
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
