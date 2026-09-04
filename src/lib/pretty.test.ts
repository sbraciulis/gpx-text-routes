import { describe, expect, it } from "vitest";
import { DEMO_CENTER } from "./constants";
import { bboxSizeMeters, haversineMeters } from "./geo";
import { buildGpx, prettyFilename, prettyGpx, routeSlug, streetsFilename } from "./gpx";
import { buildPrettyTrack } from "./pretty";
import { awkwardize, manhattanGridPath } from "./streets";

describe("geo + pretty tracks", () => {
  it("scales character height in meters", () => {
    const a = buildPrettyTrack({
      text: "33",
      center: DEMO_CENTER,
      heightM: 400,
      markers: false,
    });
    const b = buildPrettyTrack({
      text: "33",
      center: DEMO_CENTER,
      heightM: 800,
      markers: false,
    });
    const ha = bboxSizeMeters(a.points).height;
    const hb = bboxSizeMeters(b.points).height;
    expect(ha).toBeGreaterThan(350);
    expect(ha).toBeLessThan(480);
    expect(hb / ha).toBeGreaterThan(1.8);
    expect(hb / ha).toBeLessThan(2.2);
  });

  it("inserts pause and resume markers between the four strokes of 33", () => {
    const plain = buildPrettyTrack({
      text: "33",
      center: DEMO_CENTER,
      heightM: 450,
      markers: false,
    });
    const marked = buildPrettyTrack({
      text: "33",
      center: DEMO_CENTER,
      heightM: 450,
      markers: true,
    });
    expect(plain.strokes).toHaveLength(4);
    expect(marked.pauses).toHaveLength(3);
    expect(marked.resumes).toHaveLength(3);
    expect(marked.jumpEdges).toHaveLength(3);
    expect(marked.points.length).toBeGreaterThan(plain.points.length + 40);
  });

  it("can pin the first stroke start to the given location", () => {
    const start = { lat: 40.7128, lon: -74.006 };
    const track = buildPrettyTrack({
      text: "33",
      center: start,
      heightM: 400,
      markers: false,
      anchor: "start",
    });
    const first = track.strokes[0][0];
    expect(haversineMeters(first, start)).toBeLessThan(1);

    const centered = buildPrettyTrack({
      text: "33",
      center: start,
      heightM: 400,
      markers: false,
      anchor: "center",
    });
    expect(haversineMeters(centered.strokes[0][0], start)).toBeGreaterThan(50);
  });

  it("rotates heading so up points east at 90°", () => {
    const north = buildPrettyTrack({
      text: "1",
      center: DEMO_CENTER,
      heightM: 400,
      headingDeg: 0,
      markers: false,
    });
    const east = buildPrettyTrack({
      text: "1",
      center: DEMO_CENTER,
      heightM: 400,
      headingDeg: 90,
      markers: false,
    });
    const nBox = bboxSizeMeters(north.points);
    const eBox = bboxSizeMeters(east.points);
    expect(nBox.height).toBeGreaterThan(nBox.width);
    expect(eBox.width).toBeGreaterThan(eBox.height);
  });
});

describe("GPX export", () => {
  it("emits GPX 1.1 with track points and pause waypoints", () => {
    const track = buildPrettyTrack({
      text: "33",
      center: DEMO_CENTER,
      markers: true,
    });
    const xml = prettyGpx(track, "33", true);
    expect(xml).toContain('version="1.1"');
    expect(xml).toContain("<trkpt lat=");
    expect(xml).toContain("<name>PAUSE 1</name>");
    expect(xml).toContain("<name>RESUME 1</name>");
    expect(xml).toContain("http://www.topografix.com/GPX/1/1");
    expect((xml.match(/<trkpt /g) ?? []).length).toBe(track.points.length);
  });

  it("escapes XML in names and builds clear filenames", () => {
    const xml = buildGpx(
      [{ lat: 1, lon: 2 }],
      { name: 'A&B <test>', description: 'say "hi"' },
    );
    expect(xml).toContain("A&amp;B &lt;test&gt;");
    expect(xml).toContain("&quot;hi&quot;");
    expect(routeSlug("33! go")).toBe("33GO");
    expect(prettyFilename("33", true)).toBe("33-pretty-with-markers.gpx");
    expect(prettyFilename("33", false)).toBe("33-pretty-no-markers.gpx");
    expect(streetsFilename("33")).toBe("33-streets.gpx");
  });
});

describe("street-grid fallback", () => {
  it("snaps a diagonal to axis-aligned segments", () => {
    const a = DEMO_CENTER;
    const b = { lat: a.lat + 0.004, lon: a.lon + 0.004 };
    const path = manhattanGridPath([a, b], a, 80);
    expect(path.length).toBeGreaterThanOrEqual(3);
    let diagonal = 0;
    for (let i = 1; i < path.length; i++) {
      const dLat = path[i].lat !== path[i - 1].lat;
      const dLon = path[i].lon !== path[i - 1].lon;
      if (dLat && dLon) diagonal++;
    }
    expect(diagonal).toBe(0);
  });

  it("awkwardize adds extra corners", () => {
    const a = DEMO_CENTER;
    const pts = [
      a,
      { lat: a.lat, lon: a.lon + 0.006 },
      { lat: a.lat + 0.006, lon: a.lon + 0.006 },
      { lat: a.lat + 0.006, lon: a.lon },
      { lat: a.lat + 0.012, lon: a.lon },
      { lat: a.lat + 0.012, lon: a.lon + 0.006 },
    ];
    const grid = manhattanGridPath(pts, a, 80);
    const awkward = awkwardize(grid, 80);
    expect(awkward.length).toBeGreaterThanOrEqual(grid.length);
    expect(haversineMeters(awkward[0], grid[0])).toBeLessThan(1);
  });
});
