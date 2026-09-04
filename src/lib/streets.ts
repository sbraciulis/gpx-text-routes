import {
  OSRM_ENDPOINT,
  OSRM_MAX_WAYPOINTS,
  OSRM_TIMEOUT_MS,
  STREET_GRID_M,
  STREET_WAYPOINT_SPACING_M,
} from "./constants";
import {
  eastNorth,
  offsetLatLon,
  sampleEveryMeters,
} from "./geo";
import type { LatLon, StreetTrack } from "../types";

function snapToGrid(value: number, grid: number): number {
  return Math.round(value / grid) * grid;
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

function waypointsFromStrokes(strokes: LatLon[][], spacingM: number): LatLon[] {
  const pts: LatLon[] = [];
  for (const stroke of strokes) {
    const sampled = sampleEveryMeters(stroke, spacingM);
    if (pts.length && sampled.length) {
      const last = pts[pts.length - 1];
      const first = sampled[0];
      if (last.lat === first.lat && last.lon === first.lon) {
        pts.push(...sampled.slice(1));
        continue;
      }
    }
    pts.push(...sampled);
  }
  return pts;
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

type OsrmResponse = {
  code?: string;
  routes?: { geometry?: { coordinates?: [number, number][] } }[];
};

async function fetchOsrm(waypoints: LatLon[]): Promise<LatLon[] | null> {
  if (waypoints.length < 2) return null;
  const loc = waypoints.map((p) => `${p.lon},${p.lat}`).join(";");
  const url = `${OSRM_ENDPOINT}/${loc}?overview=full&geometries=geojson&continue_straight=true`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OSRM_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as OsrmResponse;
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;
    return coords.map(([lon, lat]) => ({ lat, lon }));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function buildStreetTrack(opts: {
  strokes: LatLon[][];
  center: LatLon;
}): Promise<StreetTrack> {
  const raw = waypointsFromStrokes(opts.strokes, STREET_WAYPOINT_SPACING_M);
  const waypoints = capWaypoints(raw, OSRM_MAX_WAYPOINTS);

  if (waypoints.length < 2) {
    return { points: [], source: "direct", message: "Not enough geometry to route." };
  }

  const routed = await fetchOsrm(waypoints);
  if (routed && routed.length >= 2) {
    return { points: routed, source: "osrm" };
  }

  const grid = manhattanGridPath(waypoints, opts.center);
  return {
    points: grid,
    source: "grid",
    message:
      "Street routing was unavailable, so this track follows a north–south / east–west grid instead of live OpenStreetMap roads.",
  };
}
