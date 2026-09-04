import { useEffect, useMemo, useState } from "react";
import Legend from "./components/Legend";
import RouteMap from "./components/RouteMap";
import {
  DEFAULT_HEADING_DEG,
  DEFAULT_HEIGHT_M,
  DEFAULT_TEXT,
  DEMO_CENTER,
  METERS_PER_FOOT,
} from "./lib/constants";
import { pathLengthMeters } from "./lib/geo";
import { locateCurrentPosition, roundCoord } from "./lib/geolocation";
import {
  downloadTextFile,
  prettyFilename,
  prettyGpx,
  streetsFilename,
  streetsGpx,
} from "./lib/gpx";
import { buildPrettyTrack } from "./lib/pretty";
import { buildStreetTrack } from "./lib/streets";
import type { StreetTrack } from "./types";
import "./App.css";

function formatKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export default function App() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [lat, setLat] = useState(DEMO_CENTER.lat);
  const [lon, setLon] = useState(DEMO_CENTER.lon);
  const [heightM, setHeightM] = useState(DEFAULT_HEIGHT_M);
  const [units, setUnits] = useState<"m" | "ft">("m");
  const [heading, setHeading] = useState(DEFAULT_HEADING_DEG);
  const [markers, setMarkers] = useState(true);
  const [street, setStreet] = useState<StreetTrack | null>(null);
  const [streetLoading, setStreetLoading] = useState(false);
  const [geoNote, setGeoNote] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [anchorStart, setAnchorStart] = useState(false);
  const [squareStyle, setSquareStyle] = useState(true);

  const center = useMemo(() => ({ lat, lon }), [lat, lon]);

  const pretty = useMemo(
    () =>
      buildPrettyTrack({
        text,
        center,
        heightM,
        headingDeg: heading,
        markers,
        anchor: anchorStart ? "start" : "center",
        style: squareStyle ? "square" : "round",
      }),
    [text, center, heightM, heading, markers, anchorStart, squareStyle],
  );

  const prettyPlain = useMemo(
    () =>
      buildPrettyTrack({
        text,
        center,
        heightM,
        headingDeg: heading,
        markers: false,
        anchor: anchorStart ? "start" : "center",
        style: squareStyle ? "square" : "round",
      }),
    [text, center, heightM, heading, anchorStart, squareStyle],
  );

  useEffect(() => {
    let cancelled = false;
    setStreetLoading(true);
    const handle = window.setTimeout(() => {
      void buildStreetTrack({
        strokes: prettyPlain.strokes,
        charStrokes: prettyPlain.charStrokes,
        charJoins: prettyPlain.charJoins,
        center,
      }).then((result) => {
        if (!cancelled) {
          setStreet(result);
          setStreetLoading(false);
        }
      });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [prettyPlain, center]);

  const heightDisplay = units === "m" ? heightM : heightM / METERS_PER_FOOT;
  const setHeightDisplay = (value: number) => {
    setHeightM(units === "m" ? value : value * METERS_PER_FOOT);
  };

  const prettyKm = pathLengthMeters(pretty.points);
  const streetKm = street ? pathLengthMeters(street.points) : 0;
  const slugText = text.trim() || "route";

  const placeCenter = (nextLat: number, nextLon: number, note: string) => {
    setLat(roundCoord(nextLat));
    setLon(roundCoord(nextLon));
    setGeoNote({ kind: "ok", text: note });
  };

  const startAtMyLocation = () => {
    setLocating(true);
    setGeoNote(null);
    void locateCurrentPosition().then((result) => {
      setLocating(false);
      if (result.ok) {
        placeCenter(
          result.center.lat,
          result.center.lon,
          anchorStart
            ? "First stroke starts at your current location. Previews and GPX downloads are anchored there."
            : "Route centered on your current location. Previews and GPX downloads use this point.",
        );
      } else {
        setGeoNote({ kind: "error", text: result.message });
      }
    });
  };

  const downloadPretty = (withMarkers: boolean) => {
    const track = withMarkers
      ? buildPrettyTrack({
          text,
          center,
          heightM,
          headingDeg: heading,
          markers: true,
          anchor: anchorStart ? "start" : "center",
          style: squareStyle ? "square" : "round",
        })
      : prettyPlain;
    downloadTextFile(
      prettyFilename(slugText, withMarkers),
      prettyGpx(track, slugText, withMarkers),
      "application/gpx+xml",
    );
  };

  const downloadStreets = () => {
    if (!street || street.points.length < 2) return;
    downloadTextFile(
      streetsFilename(slugText),
      streetsGpx(street.points, slugText, street.source),
      "application/gpx+xml",
    );
  };

  return (
    <div className="app">
      <aside className="panel">
        <header className="brand">
          <p className="eyebrow">GPS watch · Gaia GPS</p>
          <h1>GPX Text Routes</h1>
          <p className="lede">
            Draw letters on the map by running. Export a pretty glyph with pause/resume
            doodles, or a continuously runnable street-follow track.
          </p>
        </header>

        <label className="field">
          <span>Text</span>
          <input
            value={text}
            maxLength={12}
            spellCheck={false}
            onChange={(e) => setText(e.target.value)}
            placeholder="33"
            aria-describedby="text-help"
          />
          <small id="text-help">A–Z and 0–9. Short strings work best.</small>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={squareStyle}
            onChange={(e) => setSquareStyle(e.target.checked)}
          />
          Square / grid style (7-segment LCD digits, right-angle strokes that fit city streets)
        </label>

        <div className="field">
          <div className="field-head">
            <span>Character height</span>
            <div className="unit-toggle" role="group" aria-label="Units">
              <button
                type="button"
                className={units === "m" ? "on" : ""}
                onClick={() => setUnits("m")}
              >
                m
              </button>
              <button
                type="button"
                className={units === "ft" ? "on" : ""}
                onClick={() => setUnits("ft")}
              >
                ft
              </button>
            </div>
          </div>
          <input
            type="range"
            min={units === "m" ? 80 : 260}
            max={units === "m" ? 2000 : 6560}
            step={units === "m" ? 10 : 20}
            value={Math.round(heightDisplay)}
            onChange={(e) => setHeightDisplay(Number(e.target.value))}
          />
          <div className="inline-num">
            <input
              type="number"
              min={units === "m" ? 50 : 160}
              max={units === "m" ? 3000 : 9800}
              value={Math.round(heightDisplay)}
              onChange={(e) => setHeightDisplay(Number(e.target.value))}
            />
            <span className="mono">{units === "m" ? "meters" : "feet"}</span>
          </div>
        </div>

        <label className="field">
          <span>Heading</span>
          <input
            type="range"
            min={0}
            max={359}
            value={heading}
            onChange={(e) => setHeading(Number(e.target.value))}
          />
          <div className="inline-num">
            <input
              type="number"
              min={0}
              max={359}
              value={heading}
              onChange={(e) => setHeading(((Number(e.target.value) % 360) + 360) % 360)}
            />
            <span className="mono">deg · 0 = north-up</span>
          </div>
        </label>

        <div className="field">
          <span>Route placement</span>
          <button
            type="button"
            className="locate"
            onClick={startAtMyLocation}
            disabled={locating}
          >
            {locating ? "Finding your location…" : "Start at my current location"}
          </button>
          <small>
            Asks the browser for GPS permission, then places both previews and GPX exports on
            that point.
          </small>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={anchorStart}
            onChange={(e) => setAnchorStart(e.target.checked)}
          />
          Start the first stroke at this location (instead of centering the glyph)
        </label>

        <div className="coord-grid">
          <label className="field">
            <span>Center lat</span>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Center lon</span>
            <input
              type="number"
              step="0.0001"
              value={lon}
              onChange={(e) => setLon(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="btn-row">
          <button
            type="button"
            className="ghost"
            onClick={() =>
              placeCenter(
                DEMO_CENTER.lat,
                DEMO_CENTER.lon,
                "Reset to the San Francisco demo grid.",
              )
            }
          >
            Demo location
          </button>
        </div>
        {geoNote ? (
          <p className={geoNote.kind === "error" ? "banner" : "note"}>{geoNote.text}</p>
        ) : (
          <p className="note">Or type coordinates, or click either map to move the route.</p>
        )}

        <label className="check">
          <input
            type="checkbox"
            checked={markers}
            onChange={(e) => setMarkers(e.target.checked)}
          />
          Show pause/resume doodles on the pretty track
        </label>

        <div className="stats">
          <div>
            <span>Pretty</span>
            <strong>{pretty.points.length < 2 ? "—" : formatKm(prettyKm)}</strong>
            <em>
              {pretty.pauses.length
                ? `${pretty.pauses.length} pause/resume pair${pretty.pauses.length === 1 ? "" : "s"}`
                : "no pauses"}
            </em>
          </div>
          <div>
            <span>Streets</span>
            <strong>
              {streetLoading ? "…" : street && street.points.length > 1 ? formatKm(streetKm) : "—"}
            </strong>
            <em>
              {streetLoading
                ? "routing"
                : street?.source === "osrm"
                  ? "OSRM foot"
                  : street?.source === "grid"
                    ? "grid fallback"
                    : "waiting"}
            </em>
          </div>
        </div>

        <div className="downloads">
          <h2>Download GPX 1.1</h2>
          <button
            type="button"
            className="primary"
            disabled={pretty.points.length < 2}
            onClick={() => downloadPretty(true)}
          >
            Pretty with markers
            <small className="mono">{prettyFilename(slugText, true)}</small>
          </button>
          <button
            type="button"
            className="secondary"
            disabled={prettyPlain.points.length < 2}
            onClick={() => downloadPretty(false)}
          >
            Pretty, no markers
            <small className="mono">{prettyFilename(slugText, false)}</small>
          </button>
          <button
            type="button"
            className="secondary streets"
            disabled={!street || street.points.length < 2 || streetLoading}
            onClick={downloadStreets}
          >
            Street-follow
            <small className="mono">{streetsFilename(slugText)}</small>
          </button>
        </div>

        {street?.message ? <p className="banner">{street.message}</p> : null}

        <Legend />
      </aside>

      <main className="maps">
        <section className="map-card">
          <header>
            <h2>Pretty glyph</h2>
            <p>
              Aesthetic strokes
              {squareStyle ? " · square/grid" : " · rounded"}
              {markers ? " · triangle pause, Z resume" : " · markers off"}
              {" · bottom joins · click to move"}
            </p>
          </header>
          <RouteMap
            points={pretty.points}
            letterStrokes={pretty.strokes}
            color="#ff7a45"
            pauses={markers ? pretty.pauses : []}
            resumes={markers ? pretty.resumes : []}
            jumps={pretty.jumpEdges}
            emptyHint="Type a letter or number to preview the pretty track."
            onPickCenter={(p) =>
              placeCenter(p.lat, p.lon, "Route moved to the map click. GPX exports will use this center.")
            }
          />
        </section>
        <section className="map-card">
          <header>
            <h2>Street-follow</h2>
            <p>
              {streetLoading
                ? "Snapping to OSM roads…"
                : street?.source === "osrm"
                  ? "Roads kept close to the glyph · faint outline = ideal"
                  : street?.source === "grid"
                    ? "Offline grid (OSRM unavailable)"
                    : "No street track yet"}
            </p>
          </header>
          <RouteMap
            points={street?.points ?? []}
            color="#4cc9f0"
            ghostStrokes={prettyPlain.strokes}
            emptyHint="Street-follow appears once routing (or the grid fallback) finishes."
            onPickCenter={(p) =>
              placeCenter(p.lat, p.lon, "Route moved to the map click. GPX exports will use this center.")
            }
          />
        </section>
      </main>
    </div>
  );
}
