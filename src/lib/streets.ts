import {
  OSRM_ENDPOINT,
  OSRM_MAX_WAYPOINTS,
  OSRM_NEAREST,
  OSRM_TIMEOUT_MS,
  STREET_DETOUR_RATIO,
  STREET_GRID_M,
  STREET_MAX_DEVIATION_M,
  STREET_MAX_SNAP_M,
  STREET_WAYPOINT_SPACING_M,
} from "./constants";
import {
  eastNorth,
  haversineMeters,
  maxDistanceToPolyline,
  offsetLatLon,
  pathLengthMeters,
} from "./geo";
import type { LatLon, StreetSource, StreetTrack } from "../types";

function snapToGrid(value: number, grid: number): number {
  return Math.round(value / grid) * grid;
}

export function manhattanPair(a: LatLon, b: LatLon): LatLon[] {
  if (a.lat === b.lat || a.lon === b.lon) return [a, b];
  const { east, north } = eastNorth(a, b);
  if (Math.abs(east) >= Math.abs(north)) {
    return [a, { lat: a.lat, lon: b.lon }, b];
  }
  return [a, { lat: b.lat, lon: a.lon }, b];
}

/**
 * Axis-aligned Manhattan path on a local meter grid (north-south / east-west
 * "streets"). Used as an offline / OSRM-failure fallback and for the awkward
 * hand-planned demo sample.
 */
export function manhattanGridPath(
  points: LatLon[],
  origin: LatLon,
  gridM = STREET_GRID_M,
  stagger = true,
): LatLon[] {
  if (points.length === 0) return [];

  const snapped = points.map((p) => {
    const { east, north } = eastNorth(origin, p);
    return offsetLatLon(origin, snapToGrid(east, gridM), snapToGrid(north, gridM));
  });

  const out: LatLon[] = [snapped[0]];
  for (let i = 1; i < snapped.length; i++) {
    const a = snapped[i - 1];
    const b = snapped[i];
    if (a.lat === b.lat && a.lon === b.lon) continue;
    const horizontalFirst = stagger ? i % 2 === 0 : true;
    const corner = horizontalFirst
      ? { lat: a.lat, lon: b.lon }
      : { lat: b.lat, lon: a.lon };
    if (corner.lat !== a.lat || corner.lon !== a.lon) out.push(corner);
    out.push(b);
  }
  return out;
}

export function manhattanThrough(points: LatLon[]): LatLon[] {
  if (points.length === 0) return [];
  const out: LatLon[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const hop = manhattanPair(out[out.length - 1], points[i]);
    out.push(...hop.slice(1));
  }
  return out;
}

/** Extra block-jogs so the demo "hand-planned" route looks awkward, not perfect. */
export function awkwardize(path: LatLon[], gridM = STREET_GRID_M): LatLon[] {
  if (path.length < 3) return path;
  const out: LatLon[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const prev = out[out.length - 1];
    const next = path[i];
    if (i % 5 === 0) {
      const { east, north } = eastNorth(prev, next);
      if (Math.abs(east) > Math.abs(north) && Math.abs(east) > gridM * 0.5) {
        const bump = offsetLatLon(prev, 0, north >= 0 ? gridM : -gridM);
        const mid = { lat: bump.lat, lon: next.lon };
        out.push(bump, mid);
      } else if (Math.abs(north) > gridM * 0.5) {
        const bump = offsetLatLon(prev, east >= 0 ? gridM : -gridM, 0);
        const mid = { lat: next.lat, lon: bump.lon };
        out.push(bump, mid);
      }
    }
    out.push(next);
  }
  return out;
}

export function keepStrokeCorners(stroke: LatLon[], minSpacingM: number): LatLon[] {
  if (stroke.length === 0) return [];
  const out: LatLon[] = [stroke[0]];
  let acc = 0;
  for (let i = 1; i < stroke.length; i++) {
    acc += haversineMeters(stroke[i - 1], stroke[i]);
    let corner = false;
    if (i < stroke.length - 1) {
      const prev = eastNorth(stroke[i - 1], stroke[i]);
      const next = eastNorth(stroke[i], stroke[i + 1]);
      const magP = Math.hypot(prev.east, prev.north) || 1;
      const magN = Math.hypot(next.east, next.north) || 1;
      const dot = (prev.east * next.east + prev.north * next.north) / (magP * magN);
      corner = dot < 0.72;
    }
    if (i === stroke.length - 1 || corner || acc >= minSpacingM) {
      out.push(stroke[i]);
      acc = 0;
    }
  }
  return out.length >= 2 ? out : [stroke[0], stroke[stroke.length - 1]];
}

export function hopIsDetour(directM: number, routedM: number): boolean {
  return routedM > Math.max(directM * STREET_DETOUR_RATIO, directM + 70);
}

function capWaypoints(points: LatLon[], max: number): LatLon[] {
  if (points.length <= max) return points;
  const out: LatLon[] = [];
  const last = points.length - 1;
  for (let i = 0; i < max; i++) {
    const idx = Math.round((i * last) / (max - 1));
    out.push(points[idx]);
  }
  return out;
}

type OsrmRouteResponse = {
  code?: string;
  routes?: { geometry?: { coordinates?: [number, number][] } }[];
};

type OsrmNearestResponse = {
  code?: string;
  waypoints?: { distance?: number; location?: [number, number] }[];
};

async function fetchJson<T>(url: string): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OSRM_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOsrm(waypoints: LatLon[]): Promise<LatLon[] | null> {
  if (waypoints.length < 2) return null;
  const capped = capWaypoints(waypoints, OSRM_MAX_WAYPOINTS);
  const loc = capped.map((p) => `${p.lon},${p.lat}`).join(";");
  const url = `${OSRM_ENDPOINT}/${loc}?overview=full&geometries=geojson&continue_straight=true`;
  const data = await fetchJson<OsrmRouteResponse>(url);
  const coords = data?.routes?.[0]?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  return coords.map(([lon, lat]) => ({ lat, lon }));
}

async function nearestRoad(point: LatLon, maxSnapM: number): Promise<LatLon | null> {
  const url = `${OSRM_NEAREST}/${point.lon},${point.lat}?number=1`;
  const data = await fetchJson<OsrmNearestResponse>(url);
  const wp = data?.waypoints?.[0];
  if (!wp?.location || (wp.distance ?? Infinity) > maxSnapM) return null;
  return { lon: wp.location[0], lat: wp.location[1] };
}

function routeStaysClose(routed: LatLon[], glyph: LatLon[], directM: number): boolean {
  if (hopIsDetour(directM, pathLengthMeters(routed))) return false;
  return maxDistanceToPolyline(routed, glyph) <= STREET_MAX_DEVIATION_M;
}

async function routeCloseToStroke(stroke: LatLon[]): Promise<{ points: LatLon[]; usedOsrm: boolean }> {
  const verts = keepStrokeCorners(stroke, STREET_WAYPOINT_SPACING_M);
  const fallback = manhattanThrough(verts);
  const direct = pathLengthMeters(verts);

  const snapped = await Promise.all(
    verts.map(async (v) => {
      const road = await nearestRoad(v, STREET_MAX_SNAP_M);
      return { pt: road ?? v, snapped: Boolean(road) };
    }),
  );
  const snappedPts = snapped.map((s) => s.pt);
  const snappedAny = snapped.some((s) => s.snapped);

  const routed = await fetchOsrm(snappedPts);
  if (routed && routeStaysClose(routed, stroke, Math.max(direct, pathLengthMeters(snappedPts)))) {
    return { points: routed, usedOsrm: true };
  }

  const grid = manhattanThrough(snappedPts);
  if (snappedAny && maxDistanceToPolyline(grid, stroke) <= STREET_MAX_DEVIATION_M * 1.2) {
    return { points: grid, usedOsrm: true };
  }
  return { points: fallback, usedOsrm: false };
}

function appendUnique(target: LatLon[], extra: LatLon[]) {
  for (const p of extra) {
    const last = target[target.length - 1];
    if (!last || haversineMeters(last, p) > 0.4) target.push(p);
  }
}

export async function buildStreetTrack(opts: {
  charStrokes?: LatLon[][][];
  strokes: LatLon[][];
  center: LatLon;
}): Promise<StreetTrack> {
  const groups = opts.charStrokes?.filter((g) => g.length > 0) ?? [opts.strokes];
  if (groups.every((g) => g.length === 0) || opts.strokes.length === 0) {
    return { points: [], source: "direct", message: "Not enough geometry to route." };
  }

  const points: LatLon[] = [];
  let usedOsrm = false;
  let usedGrid = false;

  for (let c = 0; c < groups.length; c++) {
    const group = groups[c];
    if (c > 0) {
      const prev = groups[c - 1];
      const from = prev[prev.length - 1][prev[prev.length - 1].length - 1];
      const to = group[0][0];
      appendUnique(points, manhattanPair(from, to));
    }
    for (let s = 0; s < group.length; s++) {
      if (s > 0) {
        const from = group[s - 1][group[s - 1].length - 1];
        const to = group[s][0];
        appendUnique(points, manhattanPair(from, to));
      }
      const routed = await routeCloseToStroke(group[s]);
      if (routed.usedOsrm) usedOsrm = true;
      else usedGrid = true;
      appendUnique(points, routed.points);
    }
  }

  if (points.length < 2) {
    return { points: [], source: "direct", message: "Not enough geometry to route." };
  }

  const source: StreetSource = usedOsrm && !usedGrid ? "osrm" : usedOsrm ? "osrm" : "grid";
  const message =
    source === "grid"
      ? "Live street matching wandered too far from the letters, so this track stays on a tight north–south / east–west grid that keeps the glyph shape."
      : undefined;
  return { points, source, message };
}
