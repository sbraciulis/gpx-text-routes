import { MARKER_SIZE_M, TRACK_POINT_SPACING_M } from "./constants";
import { densifyLatLon, offsetLatLon } from "./geo";
import type { LatLon } from "../types";

/**
 * Pause = north-pointing triangle (stop).
 * Resume = classic Z (go).
 * Both are axis-aligned on the map so they stay readable regardless of glyph heading.
 * Sized (~14 m) to be obvious at ~50 ft / 15 m zoom.
 */
export function pauseTriangle(center: LatLon, sizeM = MARKER_SIZE_M): LatLon[] {
  const h = sizeM * (Math.sqrt(3) / 2);
  const top = offsetLatLon(center, 0, (h * 2) / 3);
  const bl = offsetLatLon(center, -sizeM / 2, -h / 3);
  const br = offsetLatLon(center, sizeM / 2, -h / 3);
  return densifyLatLon([top, br, bl, top], Math.min(1.6, TRACK_POINT_SPACING_M));
}

export function resumeZ(center: LatLon, sizeM = MARKER_SIZE_M): LatLon[] {
  const s = sizeM / 2;
  const tl = offsetLatLon(center, -s, s);
  const tr = offsetLatLon(center, s, s);
  const bl = offsetLatLon(center, -s, -s);
  const br = offsetLatLon(center, s, -s);
  return densifyLatLon([tl, tr, bl, br], Math.min(1.6, TRACK_POINT_SPACING_M));
}

export function markerSpanMeters(points: LatLon[]): number {
  let max = 0;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dLat = (points[i].lat - points[j].lat) * 111_320;
      const dLon =
        (points[i].lon - points[j].lon) *
        111_320 *
        Math.cos((points[i].lat * Math.PI) / 180);
      max = Math.max(max, Math.hypot(dLat, dLon));
    }
  }
  return max;
}
