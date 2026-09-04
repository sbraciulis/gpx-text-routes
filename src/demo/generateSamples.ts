import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEMO_CENTER, STREET_GRID_M } from "../lib/constants";
import { sampleEveryMeters } from "../lib/geo";
import { buildGpx } from "../lib/gpx";
import { buildPrettyTrack } from "../lib/pretty";
import { awkwardize, manhattanGridPath } from "../lib/streets";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const demoDir = join(root, "demo");

const center = DEMO_CENTER;
const heightM = 450;
const text = "33";

function write(name: string, xml: string) {
  writeFileSync(join(demoDir, name), xml, "utf8");
}

mkdirSync(demoDir, { recursive: true });

const beautified = buildPrettyTrack({
  text,
  center,
  heightM,
  headingDeg: 0,
  markers: false,
});

write(
  "33-beautified-glyph.gpx",
  buildGpx(beautified.points, {
    name: "33 beautified glyph (floating)",
    description:
      "Invented sample: an AI-beautified 33 that traces clean digit strokes. Geometry floats off the street grid — it looks like 33 but is not continuously runnable on roads.",
  }),
);

const practiced = buildPrettyTrack({
  text,
  center,
  heightM,
  headingDeg: 0,
  markers: true,
});

write(
  "33-practiced-with-pauses.gpx",
  buildGpx(
    practiced.points,
    {
      name: "33 practiced run with pause/resume",
      description:
        "Invented sample: a practiced run that approximates the beautified 33. Triangle doodles = PAUSE tracking; Z doodles = RESUME. Straight jump lines between them are what the GPS draws while the watch is paused.",
    },
    { pauses: practiced.pauses, resumes: practiced.resumes },
  ),
);

const verts = beautified.strokes.flatMap((s) => sampleEveryMeters(s, 55));
const grid = manhattanGridPath(verts, center, STREET_GRID_M);
const awkward = awkwardize(grid, STREET_GRID_M);

write(
  "33-awkward-roads.gpx",
  buildGpx(awkward, {
    name: "33 awkward hand-planned roads",
    description:
      "Invented sample: a rough, street-like plan for 33. It stays on a north-south / east-west grid with extra block jogs, so it is continuously runnable but only roughly looks like 33.",
  }),
);

console.log(`Wrote demo GPX files to ${demoDir}`);
