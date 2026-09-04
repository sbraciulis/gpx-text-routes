import { CHAR_GAP } from "./constants";
import { SQUARE_GLYPHS } from "./squareGlyphs";
import type { Glyph, GlyphStyle, LaidChar, LayoutResult, Pt, Stroke } from "../types";

/** Elliptical arc. 0° = +x (right), 90° = +y (up). Negative sweep is clockwise. */
export function ellipseArc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startDeg: number,
  sweepDeg: number,
  steps = 20,
): Stroke {
  const start = (startDeg * Math.PI) / 180;
  const sweep = (sweepDeg * Math.PI) / 180;
  const pts: Pt[] = [];
  const n = Math.max(2, steps);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = start + sweep * t;
    pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  }
  return pts;
}

export function poly(...xy: number[]): Stroke {
  const pts: Pt[] = [];
  for (let i = 0; i < xy.length; i += 2) {
    pts.push({ x: xy[i], y: xy[i + 1] });
  }
  return pts;
}

function g(width: number, ...strokes: Stroke[]): Glyph {
  return { width, strokes };
}

/**
 * Single- / multi-stroke running font.
 * Height is normalized to 1. Origin is bottom-left of the character cell.
 * Extra strokes (e.g. the two bowls of "3") become pause/resume jumps in pretty mode.
 */
export const GLYPHS: Record<string, Glyph> = {
  " ": g(0.34),

  "0": g(0.64, ellipseArc(0.32, 0.5, 0.28, 0.48, 90, -360, 36)),
  "1": g(0.46, poly(0.08, 0.78, 0.3, 1, 0.3, 0)),
  "2": g(
    0.62,
    [
      ...ellipseArc(0.32, 0.74, 0.26, 0.24, 160, -230, 18),
      ...poly(0.08, 0, 0.56, 0),
    ],
  ),
  "3": g(
    0.62,
    [...ellipseArc(0.3, 0.26, 0.28, 0.24, 115, -245, 22)].reverse(),
    ellipseArc(0.3, 0.74, 0.28, 0.24, 145, -245, 22),
  ),
  "4": g(0.64, poly(0.1, 0.92, 0.1, 0.4, 0.58, 0.4), poly(0.48, 1, 0.48, 0)),
  "5": g(
    0.62,
    [
      ...poly(0.54, 1, 0.1, 1, 0.1, 0.56, 0.34, 0.56),
      ...ellipseArc(0.3, 0.28, 0.28, 0.26, 110, -250, 20),
    ],
  ),
  "6": g(
    0.62,
    [
      ...ellipseArc(0.34, 0.78, 0.26, 0.2, 70, 140, 10),
      ...ellipseArc(0.32, 0.32, 0.28, 0.3, 110, -360, 28),
    ],
  ),
  "7": g(0.6, poly(0.06, 1, 0.56, 1, 0.22, 0)),
  "8": g(
    0.6,
    [
      ...ellipseArc(0.3, 0.73, 0.26, 0.25, -90, -360, 24),
      ...ellipseArc(0.3, 0.27, 0.27, 0.25, 90, 360, 24),
    ],
  ),
  "9": g(
    0.62,
    [
      ...ellipseArc(0.32, 0.68, 0.28, 0.3, -70, -360, 28),
      ...ellipseArc(0.3, 0.22, 0.26, 0.2, 250, -140, 10),
    ],
  ),

  A: g(0.66, poly(0, 0, 0.33, 1, 0.66, 0), poly(0.14, 0.36, 0.52, 0.36)),
  B: g(
    0.62,
    poly(0.08, 0, 0.08, 1),
    [
      ...ellipseArc(0.28, 0.76, 0.28, 0.22, 90, -180, 16),
      ...ellipseArc(0.3, 0.26, 0.3, 0.24, 90, -180, 16),
    ],
  ),
  C: g(0.62, ellipseArc(0.34, 0.5, 0.3, 0.48, 55, 250, 24)),
  D: g(
    0.64,
    poly(0.08, 0, 0.08, 1),
    ellipseArc(0.22, 0.5, 0.36, 0.48, 90, -180, 22),
  ),
  E: g(0.58, poly(0.52, 1, 0.08, 1, 0.08, 0, 0.52, 0), poly(0.08, 0.5, 0.42, 0.5)),
  F: g(0.56, poly(0.08, 0, 0.08, 1, 0.52, 1), poly(0.08, 0.5, 0.4, 0.5)),
  G: g(
    0.66,
    [...ellipseArc(0.36, 0.5, 0.32, 0.48, 50, 265, 26), ...poly(0.4, 0.42, 0.58, 0.42)],
  ),
  H: g(
    0.64,
    poly(0.08, 0, 0.08, 1),
    poly(0.56, 0, 0.56, 1),
    poly(0.08, 0.5, 0.56, 0.5),
  ),
  I: g(0.36, poly(0.18, 0, 0.18, 1)),
  J: g(0.56, [...poly(0.48, 1, 0.48, 0.28), ...ellipseArc(0.28, 0.28, 0.2, 0.22, 0, -180, 14)]),
  K: g(0.62, poly(0.08, 0, 0.08, 1), poly(0.56, 1, 0.08, 0.48, 0.58, 0)),
  L: g(0.56, poly(0.08, 1, 0.08, 0, 0.52, 0)),
  M: g(0.8, poly(0.04, 0, 0.04, 1, 0.4, 0.32, 0.76, 1, 0.76, 0)),
  N: g(0.66, poly(0.08, 0, 0.08, 1, 0.58, 0, 0.58, 1)),
  O: g(0.66, ellipseArc(0.33, 0.5, 0.3, 0.48, 90, -360, 36)),
  P: g(
    0.58,
    poly(0.08, 0, 0.08, 1),
    ellipseArc(0.28, 0.74, 0.26, 0.24, 90, -180, 16),
  ),
  Q: g(
    0.66,
    ellipseArc(0.33, 0.5, 0.3, 0.48, 90, -360, 36),
    poly(0.4, 0.22, 0.6, 0),
  ),
  R: g(
    0.6,
    poly(0.08, 0, 0.08, 1),
    [
      ...ellipseArc(0.28, 0.74, 0.26, 0.24, 90, -180, 16),
      ...poly(0.28, 0.5, 0.56, 0),
    ],
  ),
  S: g(
    0.6,
    [
      ...ellipseArc(0.3, 0.74, 0.26, 0.24, 40, 230, 16),
      ...ellipseArc(0.3, 0.26, 0.28, 0.24, 110, -250, 16),
    ],
  ),
  T: g(0.64, poly(0, 1, 0.64, 1), poly(0.32, 1, 0.32, 0)),
  U: g(
    0.64,
    [
      ...poly(0.08, 1, 0.08, 0.3),
      ...ellipseArc(0.32, 0.3, 0.24, 0.26, 180, -180, 14),
      ...poly(0.56, 0.3, 0.56, 1),
    ],
  ),
  V: g(0.66, poly(0, 1, 0.33, 0, 0.66, 1)),
  W: g(0.84, poly(0, 1, 0.16, 0, 0.42, 0.62, 0.68, 0, 0.84, 1)),
  X: g(0.62, poly(0.04, 1, 0.58, 0), poly(0.58, 1, 0.04, 0)),
  Y: g(0.64, poly(0, 1, 0.32, 0.48, 0.64, 1), poly(0.32, 0.48, 0.32, 0)),
  Z: g(0.62, poly(0.04, 1, 0.58, 1, 0.04, 0, 0.58, 0)),
};

export function normalizeText(input: string): string {
  return input
    .toUpperCase()
    .split("")
    .filter((ch) => ch in GLYPHS)
    .join("");
}

export function glyphSet(style: GlyphStyle): Record<string, Glyph> {
  return style === "square" ? SQUARE_GLYPHS : GLYPHS;
}

function almostEqual(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) < eps;
}

/** Axis-aligned path from `from` to `to`. Horizontal-then-vertical keeps joins on the baseline. */
export function manhattanPts(from: Pt, to: Pt, horizontalFirst = true): Stroke {
  if (almostEqual(from.x, to.x) || almostEqual(from.y, to.y)) return [from, to];
  const corner = horizontalFirst ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
  return [from, corner, to];
}

/**
 * Pin each character to the baseline: enter at lower-left, exit at lower-right.
 * Inter-letter GPS jumps then run along the bottom instead of mid-height or the top.
 */
export function attachBaselineJoins(strokes: Stroke[], charX: number, width: number): Stroke[] {
  const copy = strokes
    .filter((s) => s.length >= 2)
    .map((s) => s.map((p) => ({ x: p.x, y: p.y })));
  if (copy.length === 0) return copy;

  const first = copy[0][0];
  const entry = { x: charX + width * 0.12, y: 0 };
  const exit = { x: charX + width * 0.88, y: 0 };

  if (first.y > 0.1 || Math.abs(first.x - entry.x) > 0.06) {
    const pad = manhattanPts(entry, first, true);
    copy[0] = [...pad.slice(0, -1), ...copy[0]];
  }

  const lastStroke = copy[copy.length - 1];
  const last = lastStroke[lastStroke.length - 1];
  if (last.y > 0.1 || Math.abs(last.x - exit.x) > 0.06) {
    const pad = manhattanPts(last, exit, true);
    copy[copy.length - 1] = [...lastStroke, ...pad.slice(1)];
  }
  return copy;
}

export function layoutText(input: string, style: GlyphStyle = "round"): LayoutResult {
  const text = normalizeText(input);
  const set = glyphSet(style);
  const chars: LaidChar[] = [];
  let x = 0;
  for (const ch of text) {
    const glyph = set[ch] ?? GLYPHS[ch];
    const raw = glyph.strokes.map((stroke) => stroke.map((p) => ({ x: p.x + x, y: p.y })));
    const strokes = ch === " " ? [] : attachBaselineJoins(raw, x, glyph.width);
    chars.push({ ch, x, width: glyph.width, strokes });
    x += glyph.width + CHAR_GAP;
  }
  const width = text.length === 0 ? 0 : x - CHAR_GAP;
  const strokes = chars.flatMap((c) => c.strokes);
  return { chars, strokes, width, height: 1 };
}

export function supportedChars(): string[] {
  return Object.keys(GLYPHS)
    .filter((k) => k !== " ")
    .sort();
}
