import { describe, expect, it } from "vitest";
import { DEMO_CENTER, MARKER_SIZE_M } from "./constants";
import { bboxSizeMeters } from "./geo";
import { markerSpanMeters, pauseTriangle, resumeZ } from "./markers";

describe("pause/resume markers", () => {
  it("draws a closed triangle around 14 m across", () => {
    const pts = pauseTriangle(DEMO_CENTER);
    expect(pts.length).toBeGreaterThan(8);
    const first = pts[0];
    const last = pts[pts.length - 1];
    expect(first.lat).toBeCloseTo(last.lat, 6);
    expect(first.lon).toBeCloseTo(last.lon, 6);
    const span = markerSpanMeters(pts);
    expect(span).toBeGreaterThan(MARKER_SIZE_M * 0.85);
    expect(span).toBeLessThan(MARKER_SIZE_M * 1.25);
  });

  it("draws a Z that is readable at ~50 ft scale", () => {
    const pts = resumeZ(DEMO_CENTER);
    expect(pts.length).toBeGreaterThan(8);
    const { width, height } = bboxSizeMeters(pts);
    expect(width).toBeGreaterThan(10);
    expect(width).toBeLessThan(18);
    expect(height).toBeGreaterThan(10);
    expect(height).toBeLessThan(18);
  });

  it("keeps triangle and Z as different shapes", () => {
    const tri = pauseTriangle(DEMO_CENTER);
    const z = resumeZ(DEMO_CENTER);
    expect(tri.length).not.toBe(z.length);
    const triClosed =
      tri[0].lat === tri[tri.length - 1].lat && tri[0].lon === tri[tri.length - 1].lon;
    const zClosed =
      z[0].lat === z[z.length - 1].lat && z[0].lon === z[z.length - 1].lon;
    expect(triClosed).toBe(true);
    expect(zClosed).toBe(false);
  });
});
