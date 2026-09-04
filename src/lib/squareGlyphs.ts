import type { Glyph, Stroke } from "../types";

function poly(...xy: number[]): Stroke {
  const pts: Stroke = [];
  for (let i = 0; i < xy.length; i += 2) {
    pts.push({ x: xy[i], y: xy[i + 1] });
  }
  return pts;
}

function g(width: number, ...strokes: Stroke[]): Glyph {
  return { width, strokes };
}

function flipX(stroke: Stroke, width: number): Stroke {
  return stroke.map((p) => ({ x: width - p.x, y: p.y }));
}

function rotate180(stroke: Stroke, width: number): Stroke {
  return stroke.map((p) => ({ x: width - p.x, y: 1 - p.y }));
}

/**
 * Classic 7-segment LCD cell. y=0 is the baseline.
 * Corner gaps keep bars from fusing into closed boxes that all look alike.
 *
 *   A
 * F   B
 *   G
 * E   C
 *   D
 */
const W = 0.62;
const L = 0.1;
const R = 0.52;
const GAP = 0.11;
const MID = 0.5;

const A = () => poly(L + GAP, 1, R - GAP, 1);
const B = () => poly(R, 1 - GAP, R, MID + GAP);
const C = () => poly(R, MID - GAP, R, GAP);
const D = () => poly(R - GAP, 0, L + GAP, 0);
const E = () => poly(L, GAP, L, MID - GAP);
const F = () => poly(L, MID + GAP, L, 1 - GAP);
const Gseg = () => poly(L + GAP, MID, R - GAP, MID);

/**
 * Axis-aligned LCD / street-grid font.
 * Digits are open 7-segment shapes. The slashed zero is the only intended diagonal.
 */
export const SQUARE_GLYPHS: Record<string, Glyph> = {
  " ": g(0.34),

  // Rectangle of open segments + diagonal slash so 0 ≠ O.
  "0": g(W, A(), B(), C(), D(), E(), F(), poly(L + 0.1, 0.16, R - 0.1, 0.84)),

  // Stem + visible top-left flag — not an I-beam.
  "1": g(0.42, poly(0.04, 0.7, 0.04, 1, 0.3, 1, 0.3, 0)),

  // Standard 2: A B G E D (no F, no C).
  "2": g(W, A(), B(), Gseg(), E(), D()),

  // Two open bowls on the right with a clear mid gap.
  "3": g(
    W,
    poly(L, 1, R, 1, R, MID + 0.12, L + GAP, MID + 0.12),
    poly(L + GAP, MID - 0.12, R, MID - 0.12, R, 0, L, 0),
  ),

  // Open 4: full-height right stem + mid crossbar + upper-left post. No top cap.
  "4": g(W, poly(R, 0, R, 1), poly(L, 1, L, MID, R, MID)),

  // Standard 5: A F G C D (mirror of 2).
  "5": g(W, ...[A(), B(), Gseg(), E(), D()].map((s) => flipX(s, W))),

  // Bottom bowl + left stem up (no upper-right).
  "6": g(W, A(), F(), Gseg(), E(), C(), D()),

  // Top bar + stepped stem (not a lone vertical, not a diagonal).
  "7": g(0.58, poly(0.06, 1, 0.54, 1, 0.54, 0.44, 0.22, 0.44, 0.22, 0)),

  // Two stacked open loops sharing mid bar G, with corner gaps.
  "8": g(W, A(), B(), C(), D(), E(), F(), Gseg()),

  // Top bowl + right stem down — 180° of 6 so they stay mirrored.
  "9": g(W, ...[A(), F(), Gseg(), E(), C(), D()].map((s) => rotate180(s, W))),

  A: g(0.64, poly(0.08, 0, 0.08, 1, 0.56, 1, 0.56, 0), poly(0.08, 0.42, 0.56, 0.42)),
  B: g(
    0.62,
    poly(0.08, 0, 0.08, 1),
    poly(0.08, 1, 0.46, 1, 0.46, 0.54, 0.08, 0.54),
    poly(0.08, 0.46, 0.5, 0.46, 0.5, 0, 0.08, 0),
  ),
  C: g(0.6, poly(0.52, 1, 0.08, 1, 0.08, 0, 0.52, 0)),
  D: g(0.64, poly(0.08, 0, 0.08, 1, 0.56, 1, 0.56, 0, 0.08, 0)),
  E: g(0.58, poly(0.5, 1, 0.08, 1, 0.08, 0, 0.5, 0), poly(0.08, 0.5, 0.42, 0.5)),
  F: g(0.56, poly(0.08, 0, 0.08, 1, 0.5, 1), poly(0.08, 0.5, 0.4, 0.5)),
  G: g(0.64, poly(0.54, 1, 0.08, 1, 0.08, 0, 0.54, 0, 0.54, 0.42, 0.32, 0.42)),
  H: g(0.64, poly(0.08, 0, 0.08, 1), poly(0.56, 0, 0.56, 1), poly(0.08, 0.5, 0.56, 0.5)),
  I: g(0.4, poly(0.06, 0, 0.34, 0, 0.2, 0, 0.2, 1, 0.06, 1, 0.34, 1)),
  J: g(0.56, poly(0.48, 1, 0.48, 0, 0.08, 0, 0.08, 0.18)),
  K: g(0.62, poly(0.08, 0, 0.08, 1), poly(0.52, 1, 0.08, 0.5, 0.54, 0)),
  L: g(0.56, poly(0.08, 1, 0.08, 0, 0.5, 0)),
  M: g(0.78, poly(0.06, 0, 0.06, 1, 0.28, 0.45, 0.5, 1, 0.72, 0)),
  N: g(0.64, poly(0.08, 0, 0.08, 1, 0.56, 0, 0.56, 1)),
  O: g(0.64, poly(0.08, 0, 0.56, 0, 0.56, 1, 0.08, 1, 0.08, 0)),
  P: g(0.58, poly(0.08, 0, 0.08, 1, 0.48, 1, 0.48, 0.5, 0.08, 0.5)),
  Q: g(0.64, poly(0.08, 0, 0.56, 0, 0.56, 1, 0.08, 1, 0.08, 0), poly(0.36, 0.22, 0.58, 0)),
  R: g(
    0.6,
    poly(0.08, 0, 0.08, 1, 0.48, 1, 0.48, 0.5, 0.08, 0.5),
    poly(0.28, 0.5, 0.54, 0),
  ),
  // S-hooks so this is not the same polyline as 5.
  S: g(
    0.6,
    poly(0.54, 0.78, 0.54, 1, 0.1, 1, 0.1, 0.5, 0.5, 0.5, 0.5, 0, 0.1, 0, 0.1, 0.22),
  ),
  T: g(0.62, poly(0.04, 1, 0.58, 1), poly(0.31, 1, 0.31, 0)),
  U: g(0.64, poly(0.08, 1, 0.08, 0, 0.56, 0, 0.56, 1)),
  V: g(0.64, poly(0.04, 1, 0.32, 0, 0.6, 1)),
  W: g(0.82, poly(0.04, 1, 0.18, 0, 0.4, 0.55, 0.62, 0, 0.78, 1)),
  X: g(0.6, poly(0.06, 1, 0.54, 0), poly(0.54, 1, 0.06, 0)),
  Y: g(0.62, poly(0.06, 1, 0.31, 0.48, 0.56, 1), poly(0.31, 0.48, 0.31, 0)),
  Z: g(0.6, poly(0.06, 1, 0.54, 1, 0.06, 0, 0.54, 0)),
};
