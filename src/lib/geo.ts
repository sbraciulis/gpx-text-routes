import { METERS_PER_DEG_LAT } from "./constants";
import type { LatLon, Pt } from "../types";

export function metersPerDegLon(lat: number): number {
  return METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

export function offsetLatLon(p: LatLon, eastM: number, northM: number): LatLon {
  return {
    lat: p.lat + northM / METERS_PER_DEG_LAT,
    lon: p.lon + eastM / metersPerDegLon(p.lat),
  };
}

/** Heading 0° = glyph up points north; heading increases clockwise. */
export function localToLatLon(
  pt: Pt,
  origin: LatLon,
  heightM: number,
  headingDeg: number,
  centerX: number,
  centerY: number,
): LatLon {
  const east0 = (pt.x - centerX) * heightM;
  const north0 = (pt.y - centerY) * heightM;
  const h = (headingDeg * Math.PI) / 180;
  const cos = Math.cos(h);
  const sin = Math.sin(h);
  const east = east0 * cos + north0 * sin;
  const north = -east0 * sin + north0 * cos;
  return offsetLatLon(origin, east, north);
}

export function eastNorth(from: LatLon, to: LatLon): { east: number; north: number } {
  const north = (to.lat - from.lat) * METERS_PER_DEG_LAT;
  const east = (to.lon - from.lon) * metersPerDegLon(from.lat);
  return { east, north };
}

export function haversineMeters(a: LatLon, b: LatLon): number {
  const r = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function pathLengthMeters(points: LatLon[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += haversineMeters(points[i - 1], points[i]);
  }
  return sum;
}

export function lerpLatLon(a: LatLon, b: LatLon, t: number): LatLon {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lon: a.lon + (b.lon - a.lon) * t,
  };
}

export function densifyLatLon(points: LatLon[], maxGapM: number): LatLon[] {
  if (points.length === 0) return [];
  const out: LatLon[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const d = haversineMeters(a, b);
    const n = Math.max(1, Math.ceil(d / maxGapM));
    for (let k = 1; k <= n; k++) {
      out.push(lerpLatLon(a, b, k / n));
    }
  }
  return out;
}

export function sampleEveryMeters(points: LatLon[], spacingM: number): LatLon[] {
  if (points.length === 0) return [];
  const out: LatLon[] = [points[0]];
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const step = haversineMeters(points[i - 1], points[i]);
    acc += step;
    if (acc >= spacingM) {
      out.push(points[i]);
      acc = 0;
    }
  }
  const last = points[points.length - 1];
  const prev = out[out.length - 1];
  if (prev.lat !== last.lat || prev.lon !== last.lon) out.push(last);
  return out;
}

export function boundingBox(points: LatLon[]): {
  min: LatLon;
  max: LatLon;
} | null {
  if (points.length === 0) return null;
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLon = points[0].lon;
  let maxLon = points[0].lon;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);
  }
  return { min: { lat: minLat, lon: minLon }, max: { lat: maxLat, lon: maxLon } };
}

export function bboxSizeMeters(points: LatLon[]): { width: number; height: number } {
  const box = boundingBox(points);
  if (!box) return { width: 0, height: 0 };
  return {
    width: haversineMeters(
      { lat: box.min.lat, lon: box.min.lon },
      { lat: box.min.lat, lon: box.max.lon },
    ),
    height: haversineMeters(
      { lat: box.min.lat, lon: box.min.lon },
      { lat: box.max.lat, lon: box.min.lon },
    ),
  };
}

export function unitEastNorth(
  from: LatLon,
  to: LatLon,
): { east: number; north: number } {
  const { east, north } = eastNorth(from, to);
  const mag = Math.hypot(east, north) || 1;
  return { east: east / mag, north: north / mag };
}
