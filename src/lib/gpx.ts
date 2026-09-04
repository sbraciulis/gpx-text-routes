import type { BuiltTrack, LatLon } from "../types";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function trkpt(p: LatLon): string {
  return `<trkpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}"></trkpt>`;
}

export function routeSlug(text: string): string {
  const s = text.toUpperCase().replace(/[^A-Z0-9]+/g, "");
  return s.slice(0, 24) || "route";
}

export function prettyFilename(text: string, markers: boolean): string {
  return `${routeSlug(text)}-pretty-${markers ? "with-markers" : "no-markers"}.gpx`;
}

export function streetsFilename(text: string): string {
  return `${routeSlug(text)}-streets.gpx`;
}

export type GpxMeta = {
  name: string;
  description: string;
  creator?: string;
};

export function buildGpx(
  points: LatLon[],
  meta: GpxMeta,
  extras?: { pauses?: LatLon[]; resumes?: LatLon[] },
): string {
  const creator = xmlEscape(meta.creator ?? "gpx-text-routes");
  const name = xmlEscape(meta.name);
  const desc = xmlEscape(meta.description);
  const wpts: string[] = [];
  extras?.pauses?.forEach((p, i) => {
    wpts.push(
      `<wpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}"><name>PAUSE ${i + 1}</name><desc>Pause tracking here, then move to RESUME ${i + 1}. Triangle doodle = pause.</desc><sym>Triangle</sym></wpt>`,
    );
  });
  extras?.resumes?.forEach((p, i) => {
    wpts.push(
      `<wpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}"><name>RESUME ${i + 1}</name><desc>Resume tracking here. Z doodle = resume.</desc><sym>Flag</sym></wpt>`,
    );
  });

  const pts = points.map(trkpt).join("\n      ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${creator}"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${name}</name>
    <desc>${desc}</desc>
  </metadata>
  ${wpts.join("\n  ")}
  <trk>
    <name>${name}</name>
    <desc>${desc}</desc>
    <trkseg>
      ${pts}
    </trkseg>
  </trk>
</gpx>
`;
}

export function prettyGpx(track: BuiltTrack, text: string, markers: boolean): string {
  const slug = routeSlug(text) || "route";
  return buildGpx(
    track.points,
    {
      name: `${slug} pretty ${markers ? "with pause/resume markers" : "no markers"}`,
      description: markers
        ? "Aesthetic glyph track. Triangle doodle = PAUSE watch; Z doodle = RESUME. Straight lines between them are GPS jumps while paused."
        : "Aesthetic glyph track without pause/resume doodles. Straight connections between strokes are still present.",
    },
    markers ? { pauses: track.pauses, resumes: track.resumes } : undefined,
  );
}

export function streetsGpx(points: LatLon[], text: string, source: string): string {
  const slug = routeSlug(text) || "route";
  return buildGpx(points, {
    name: `${slug} street-follow`,
    description: `Continuously runnable track following roads (${source}). No pause/resume choreography.`,
  });
}

export function downloadTextFile(filename: string, contents: string, mime: string): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
