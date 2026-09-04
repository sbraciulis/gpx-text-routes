import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLon } from "../types";

type Props = {
  points: LatLon[];
  color: string;
  /** When set, each stroke is drawn separately so join pads don't fill in the glyph. */
  letterStrokes?: LatLon[][];
  pauses?: LatLon[];
  resumes?: LatLon[];
  jumps?: { start: LatLon; end: LatLon; kind?: "stroke" | "letter" }[];
  ghostStrokes?: LatLon[][];
  emptyHint: string;
  onPickCenter?: (center: LatLon) => void;
};

function Fit({ points }: { points: LatLon[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = points.map((p) => [p.lat, p.lon] as [number, number]);
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16 });
  }, [map, points]);
  return null;
}

function PickCenter({ onPick }: { onPick: (center: LatLon) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

export default function RouteMap({
  points,
  color,
  letterStrokes,
  pauses = [],
  resumes = [],
  jumps = [],
  ghostStrokes = [],
  emptyHint,
  onPickCenter,
}: Props) {
  const drawn = letterStrokes?.filter((s) => s.length >= 2) ?? [];
  const fitPts = drawn.length > 0 ? drawn.flat() : points;
  const center: [number, number] = fitPts[0]
    ? [fitPts[0].lat, fitPts[0].lon]
    : [37.7564, -122.4342];

  return (
    <div className="map-wrap">
      {fitPts.length < 2 ? (
        <div className="map-empty">{emptyHint}</div>
      ) : (
        <MapContainer
          center={center}
          zoom={14}
          maxZoom={19}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {ghostStrokes.map((stroke, i) =>
            stroke.length >= 2 ? (
              <Polyline
                key={`ghost-${i}`}
                positions={stroke.map((p) => [p.lat, p.lon] as [number, number])}
                pathOptions={{ color: "#ff7a45", weight: 6, opacity: 0.22 }}
              />
            ) : null,
          )}
          {jumps.map((jump, i) => (
            <Polyline
              key={`jump-${i}`}
              positions={[
                [jump.start.lat, jump.start.lon],
                [jump.end.lat, jump.end.lon],
              ]}
              pathOptions={{
                color: jump.kind === "letter" ? "#ffd166" : "#f4efe6",
                weight: jump.kind === "letter" ? 3 : 2,
                dashArray: jump.kind === "letter" ? "10 6" : "6 8",
                opacity: 0.85,
              }}
            />
          ))}
          {drawn.length > 0
            ? drawn.map((stroke, i) => (
                <Polyline
                  key={`letter-${i}`}
                  positions={stroke.map((p) => [p.lat, p.lon] as [number, number])}
                  pathOptions={{ color, weight: 3, opacity: 0.95 }}
                />
              ))
            : (
                <Polyline
                  positions={points.map((p) => [p.lat, p.lon] as [number, number])}
                  pathOptions={{ color, weight: 4, opacity: 0.95 }}
                />
              )}
          {pauses.map((p, i) => (
            <CircleMarker
              key={`p-${i}`}
              center={[p.lat, p.lon]}
              radius={7}
              pathOptions={{ color: "#ef476f", fillColor: "#ef476f", fillOpacity: 0.9, weight: 2 }}
            />
          ))}
          {resumes.map((p, i) => (
            <CircleMarker
              key={`r-${i}`}
              center={[p.lat, p.lon]}
              radius={7}
              pathOptions={{ color: "#06d6a0", fillColor: "#06d6a0", fillOpacity: 0.9, weight: 2 }}
            />
          ))}
          {onPickCenter ? <PickCenter onPick={onPickCenter} /> : null}
          <Fit points={fitPts} />
        </MapContainer>
      )}
    </div>
  );
}
