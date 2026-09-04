# gpx-text-routes

Turn letters and numbers into **runnable GPX tracks** for a GPS watch or [Gaia GPS](https://www.gaiagps.com/).

Athletes sometimes “draw” big text (a bib number, a name) by running local roads. Real streets rarely match a nice glyph, so people historically **pause tracking**, walk a shortcut, then **resume** — the GPS fills in a straight jump and the map looks like the letter. This app gives you both that pretty track (with obvious pause/resume doodles) and a continuously runnable street-follow alternative.

## Use it on your phone

**Live site (HTTPS):** [https://sbraciulis.github.io/gpx-text-routes/](https://sbraciulis.github.io/gpx-text-routes/)

Open that link in your phone browser (Safari or Chrome). HTTPS is required for **Start at my current location**. Tap the button, allow location when the browser asks, then both map previews and GPX downloads use your GPS position. If you deny or it fails, type lat/lon or tap a map instead.

The first deploy needs a one-time GitHub setting (not automatable from this PR):

1. Repo **Settings → Pages**
2. **Build and deployment → Source** = **GitHub Actions**
3. Push to `main` or `cursor/gpx-text-routes-7482` (this workflow deploys from both) and wait for the **Deploy GitHub Pages** Action to finish

Until that source is set, the Action’s deploy job will fail even if the build succeeds.

## Quick start (local)

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Type `33`, leave **Square / grid style** on, set scale, compare the two maps, download GPX.

Other scripts:

```bash
npm test              # glyph / marker / GPX unit tests
npm run build         # production bundle
npm run generate-demo # rewrite demo/*.gpx from the same engine
```

## Two export modes

### 1. Pretty + pauses

Vector strokes for **A–Z** and **0–9** are laid out at your center, character height, and heading. Digit `3` is two open bowls, so `33` has four strokes and three jumps.

**Square / grid style** (on by default) uses axis-aligned bars and right angles so the letters sit on a city grid. Turn it off for the rounded, cursive strokes.

**Letter-to-letter joins run along the baseline:** after you finish a glyph, pretty mode drops to the bottom, pauses, and the GPS jump goes to the **bottom** of the next character (lower exit → lower entry), not mid-height or the top. Jumps *inside* a digit (the two bowls of a `3`) still connect those bowls.

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

Each glyph stroke is snapped toward nearby OSM foot ways (OSRM nearest + short routes). Hops that **wander too far** from the ideal polyline are rejected and replaced with a tight north–south / east–west path through the stroke corners, so `33` should still read as two threes. Character order and **bottom joins** are preserved. The street map draws a **faint pretty-glyph outline** under the blue route so you can judge fidelity.

If live routing is down or every hop is a detour, the same grid fallback still keeps the blocky letter shapes (especially with Square / grid style on). Keep the watch running — no pause choreography.

## Controls

- **Text** — letters and digits (other characters are ignored). Short strings work best.
- **Square / grid style** — blocky, right-angle glyphs (default on). Better for street-follow. Off = rounded strokes.
- **Character height** — meters or feet. Default **520 m** (~1706 ft) makes a neighborhood-scale `33`.
- **Heading** — 0° = glyph up points north; increases clockwise.
- **Center lat/lon** — default is a San Francisco grid (Noe / Castro, `37.7564, -122.4342`).
- **Start at my current location** — uses the browser Geolocation API (you’ll get a permission prompt). On success, both map previews recenter and GPX downloads are anchored there. If you deny permission, it times out, or GPS isn’t available, a short error appears and you can still type coordinates or **click either map** to place the route. By default the **glyph is centered** on that point. Check **Start the first stroke at this location** if you want to stand on the first waypoint and run the letter from there.
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

- If street-follow still looks messy, turn **Square / grid style** on, keep heading at 0°, and place the center on a regular street grid (the SF demo location is a good start).
- Huge letters (kilometers tall) make long routes and can hit OSRM URL limits; the app keeps stroke corners and caps waypoints per stroke.
- Heading 45° on a city grid produces stair-step street-follow. That is expected.
