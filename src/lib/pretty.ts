import {
  DEFAULT_HEADING_DEG,
  DEFAULT_HEIGHT_M,
  MARKER_OUTSET_M,
  TRACK_POINT_SPACING_M,
} from "./constants";
import { densifyLatLon, localToLatLon, offsetLatLon, unitEastNorth } from "./geo";
import { layoutText } from "./glyphs";
import { pauseTriangle, resumeZ } from "./markers";
import type { BuiltTrack, GlyphStyle, LatLon } from "../types";

export type PrettyOptions = {
  text: string;
  center: LatLon;
  heightM?: number;
  headingDeg?: number;
  markers?: boolean;
  /** center = glyph bbox on the pin; start = first stroke begins at the pin. */
  anchor?: "center" | "start";
  style?: GlyphStyle;
};

function outsetAlong(end: LatLon, prev: LatLon, meters: number): LatLon {
  const dir = unitEastNorth(prev, end);
  return offsetLatLon(end, dir.east * meters, dir.north * meters);
}

function outsetBefore(start: LatLon, next: LatLon, meters: number): LatLon {
  const dir = unitEastNorth(start, next);
  return offsetLatLon(start, -dir.east * meters, -dir.north * meters);
}

function strokeAnchor(stroke: LatLon[], atEnd: boolean): { here: LatLon; other: LatLon } {
  if (stroke.length < 2) {
    const p = stroke[0];
    return { here: p, other: p };
  }
  if (atEnd) {
    return { here: stroke[stroke.length - 1], other: stroke[stroke.length - 2] };
  }
  return { here: stroke[0], other: stroke[1] };
}

function addJump(
  points: LatLon[],
  pauses: LatLon[],
  resumes: LatLon[],
  jumpEdges: BuiltTrack["jumpEdges"],
  prev: LatLon[],
  next: LatLon[],
  kind: "stroke" | "letter",
  withMarkers: boolean,
) {
  const prevAnchor = strokeAnchor(prev, true);
  const nextAnchor = strokeAnchor(next, false);
  if (withMarkers) {
    const pauseAt = outsetAlong(prevAnchor.here, prevAnchor.other, MARKER_OUTSET_M);
    const resumeAt = outsetBefore(nextAnchor.here, nextAnchor.other, MARKER_OUTSET_M);
    const pausePts = pauseTriangle(pauseAt);
    const resumePts = resumeZ(resumeAt);
    points.push(...pausePts);
    jumpEdges.push({
      start: pausePts[pausePts.length - 1],
      end: resumePts[0],
      kind,
    });
    points.push(...resumePts);
    pauses.push(pauseAt);
    resumes.push(resumeAt);
  } else {
    jumpEdges.push({
      start: prev[prev.length - 1],
      end: next[0],
      kind,
    });
  }
}

export function buildPrettyTrack(opts: PrettyOptions): BuiltTrack {
  const heightM = opts.heightM ?? DEFAULT_HEIGHT_M;
  const headingDeg = opts.headingDeg ?? DEFAULT_HEADING_DEG;
  const withMarkers = opts.markers ?? true;
  const layout = layoutText(opts.text, opts.style ?? "round");
  const firstPt = layout.strokes.find((s) => s.length >= 2)?.[0];
  const useStart = opts.anchor === "start" && firstPt;
  const cx = useStart ? firstPt.x : layout.width / 2;
  const cy = useStart ? firstPt.y : layout.height / 2;

  const toGeo = (stroke: { x: number; y: number }[]) =>
    densifyLatLon(
      stroke.map((p) => localToLatLon(p, opts.center, heightM, headingDeg, cx, cy)),
      TRACK_POINT_SPACING_M,
    );

  const charStrokes: LatLon[][][] = layout.chars
    .map((ch) => ch.strokes.filter((s) => s.length >= 2).map(toGeo))
    .filter((strokes) => strokes.length > 0);

  const strokes = charStrokes.flat();
  const pauses: LatLon[] = [];
  const resumes: LatLon[] = [];
  const jumpEdges: BuiltTrack["jumpEdges"] = [];
  const points: LatLon[] = [];

  for (let c = 0; c < charStrokes.length; c++) {
    const group = charStrokes[c];
    if (c > 0) {
      const prevGroup = charStrokes[c - 1];
      addJump(
        points,
        pauses,
        resumes,
        jumpEdges,
        prevGroup[prevGroup.length - 1],
        group[0],
        "letter",
        withMarkers,
      );
    }
    for (let i = 0; i < group.length; i++) {
      if (i > 0) {
        addJump(points, pauses, resumes, jumpEdges, group[i - 1], group[i], "stroke", withMarkers);
      }
      points.push(...group[i]);
    }
  }

  return { points, strokes, charStrokes, pauses, resumes, jumpEdges };
}
