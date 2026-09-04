# gpx-text-routes

Turn letters and numbers into **runnable GPX tracks** for a GPS watch or [Gaia GPS](https://www.gaiagps.com/).

Athletes sometimes “draw” big text (a bib number, a name) by running local roads. Real streets rarely match a nice glyph, so people historically **pause tracking**, walk a shortcut, then **resume** — the GPS fills in a straight jump and the map looks like the letter. This app gives you both that pretty track (with obvious pause/resume doodles) and a continuously runnable street-follow alternative.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Type `33`, set scale, compare the two maps, download GPX.

Other scripts:

```bash
npm test              # glyph / marker / GPX unit tests
npm run build         # production bundle
npm run generate-demo # rewrite demo/*.gpx from the same engine
```

## Two export modes

### 1. Pretty + pauses

Vector strokes for **A–Z** and **0–9** are laid out at your center, character height, and heading. Digit `3` is two open bowls, so `33` has four strokes and three jumps.

Between disconnected strokes the track inserts small **doodles in the GPS geometry** (and matching waypoints):

| Mark | Shape | Meaning |
|------|--------|---------|
| **PAUSE** | North-pointing **triangle** (~14 m) | Stop recording |
| **RESUME** | Classic **Z** (~14 m) | Start recording again |

Those doodles are sized to be obvious at about **50 ft / 15 m** map zoom. They are axis-aligned on the map (not rotated with the letter) so they always read as a triangle and a Z.

The straight line between a triangle and a Z is the GPS jump — leave it undensified on purpose, the same way a paused watch draws it.

Turn **Show pause/resume doodles** off to export the same glyph without the triangle/Z patterns (straight jumps remain). Use that if you cue pause/resume some other way.

Pretty geometry **does not follow roads**. It is the beautified shape you are trying to paint on the map.

### 2. Street-follow (no pauses)

Waypoints sampled from the glyph are sent to the public [OSRM](https://project-osrm.org/) **foot** router (`https://router.project-osrm.org`). The result is a continuous road/path track. It will usually look less like the ideal glyph, but you can leave the watch running.

If OSRM is unreachable, times out, or returns nothing, the app **falls back to a north–south / east–west grid** (Manhattan blocks around your center) and shows a banner. That fallback is still continuously runnable; it is not live OSM data.

## Controls

- **Text** — letters and digits (other characters are ignored). Short strings work best.
- **Character height** — meters or feet. Default **450 m** (~1476 ft) makes a neighborhood-scale `33`.
- **Heading** — 0° = glyph up points north; increases clockwise.
- **Center lat/lon** — default is a San Francisco grid (Noe / Castro, `37.7564, -122.4342`).
- **Start at my current location** — uses the browser Geolocation API (you’ll get a permission prompt). On success, both map previews recenter and GPX downloads are anchored there. If you deny permission, it times out, or GPS isn’t available, a short error appears and you can still type coordinates or **click either map** to place the route.
- **Downloads** — GPX 1.1 tracks, named clearly:
  - `33-pretty-with-markers.gpx`
  - `33-pretty-no-markers.gpx`
  - `33-streets.gpx`

## How to run a pretty track

1. Import the **with-markers** GPX (see below).
2. Zoom to ~50 ft until you can see the doodles at stroke ends.
3. Run a stroke (one bowl of a `3`, the bar of a `4`, …).
4. At a **triangle**: pause the watch.
5. Move to the **Z** (the map will later show a straight jump).
6. Resume at the Z and run the next stroke.

Street-follow: import `*-streets.gpx` and run it as a normal course. No pause choreography.

## Load GPX into Gaia GPS / a watch

Files are **GPX 1.1** with one track (`<trk>` / `<trkseg>`). Marker exports also include `<wpt>` named `PAUSE n` and `RESUME n`.

**Gaia GPS (phone or web)**  
Import / Open → choose the `.gpx` file. The track overlays the map; waypoints appear as pins. Save to a folder and use Navigate if you want turn-by-turn along street-follow.

**Garmin (Connect / watch course)**  
Garmin Connect → Training → Courses → Create Course → Import GPX, or copy the file into `Garmin/NewFiles` on some watches. Course point limits vary by model; these tracks are a few hundred points, which is usually fine. Some devices treat a GPX track as a course and others as a saved track — either still shows the shape.

**Apple Watch / WorkOutDoors, Strava, etc.**  
Any app that imports a GPX track or course will display the line. Pause/resume doodles only help if the app shows the track geometry at high zoom (Gaia is the intended viewer for cueing).

This app exports a **route to follow**, not a recorded activity (no timestamps).

## Demo samples (`demo/`)

Invented files for the digit **33** — no real uploads. Generated with `npm run generate-demo` from the same engine:

| File | What it illustrates |
|------|---------------------|
| `demo/33-awkward-roads.gpx` | Rough hand-planned street sketch: snapped to a block grid with extra jogs. Continuously runnable, only roughly a 33. |
| `demo/33-beautified-glyph.gpx` | Clean, AI-style glyph path. Looks like 33; floats off the roads. |
| `demo/33-practiced-with-pauses.gpx` | Same beautified shape plus triangle/Z pause-resume cues and straight GPS jumps. |

Open them in Gaia next to a live export to see the three ideas.

## Tech

Vite + React + TypeScript + Leaflet. Routing via the public OSRM endpoint. Offline fallback is local grid math (no extra services).

Unit tests live next to the libraries they cover (`src/lib/*.test.ts`).

## Tips

- If street-follow looks like a scribble, the glyph is sitting in a park or water — move the center onto a street grid, or shrink the scale.
- Huge letters (kilometers tall) make long routes and can hit OSRM URL limits; the app thins waypoints, but smaller is cleaner.
- Heading 45° on a city grid produces stair-step street-follow. That is expected.
