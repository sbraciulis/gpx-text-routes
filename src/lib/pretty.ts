import {
  DEFAULT_HEADING_DEG,
  DEFAULT_HEIGHT_M,
  MARKER_OUTSET_M,
  TRACK_POINT_SPACING_M,
} from "./constants";
import { densifyLatLon, localToLatLon, offsetLatLon, unitEastNorth } from "./geo";
import { layoutText } from "./glyphs";
import { pauseTriangle, resumeZ } from "./markers";
import type { BuiltTrack, LatLon } from "../types";

export type PrettyOptions = {
  text: string;
  center: LatLon;
  heightM?: number;
  headingDeg?: number;
  markers?: boolean;
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

export function buildPrettyTrack(opts: PrettyOptions): BuiltTrack {
  const heightM = opts.heightM ?? DEFAULT_HEIGHT_M;
  const headingDeg = opts.headingDeg ?? DEFAULT_HEADING_DEG;
  const withMarkers = opts.markers ?? true;
  const layout = layoutText(opts.text);
  const cx = layout.width / 2;
  const cy = layout.height / 2;

  const strokes: LatLon[][] = layout.strokes
    .filter((s) => s.length >= 2)
    .map((stroke) => {
      const geo = stroke.map((p) =>
        localToLatLon(p, opts.center, heightM, headingDeg, cx, cy),
      );
      return densifyLatLon(geo, TRACK_POINT_SPACING_M);
    });

  const pauses: LatLon[] = [];
  const resumes: LatLon[] = [];
  const jumpEdges: { start: LatLon; end: LatLon }[] = [];
  const points: LatLon[] = [];

  for (let i = 0; i < strokes.length; i++) {
    const stroke = strokes[i];
    if (i > 0 && withMarkers) {
      const prev = strokes[i - 1];
      const prevAnchor = strokeAnchor(prev, true);
      const nextAnchor = strokeAnchor(stroke, false);
      const pauseAt = outsetAlong(prevAnchor.here, prevAnchor.other, MARKER_OUTSET_M);
      const resumeAt = outsetBefore(nextAnchor.here, nextAnchor.other, MARKER_OUTSET_M);
      const pausePts = pauseTriangle(pauseAt);
      const resumePts = resumeZ(resumeAt);
      points.push(...pausePts);
      jumpEdges.push({
        start: pausePts[pausePts.length - 1],
        end: resumePts[0],
      });
      // Straight GPS jump: do not densify. That's the visual the athlete wants.
      points.push(...resumePts);
      pauses.push(pauseAt);
      resumes.push(resumeAt);
    } else if (i > 0 && !withMarkers) {
      jumpEdges.push({
        start: strokes[i - 1][strokes[i - 1].length - 1],
        end: stroke[0],
      });
    }
    points.push(...stroke);
  }

  return { points, strokes, pauses, resumes, jumpEdges };
}
