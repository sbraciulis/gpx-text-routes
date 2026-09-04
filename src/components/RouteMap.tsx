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
  pauses?: LatLon[];
  resumes?: LatLon[];
  jumps?: { start: LatLon; end: LatLon }[];
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
  pauses = [],
  resumes = [],
  jumps = [],
  emptyHint,
  onPickCenter,
}: Props) {
  const center: [number, number] = points[0]
    ? [points[0].lat, points[0].lon]
    : [37.7564, -122.4342];

  return (
    <div className="map-wrap">
      {points.length < 2 ? (
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
          {jumps.map((jump, i) => (
            <Polyline
              key={`jump-${i}`}
              positions={[
                [jump.start.lat, jump.start.lon],
                [jump.end.lat, jump.end.lon],
              ]}
              pathOptions={{
                color: "#f4efe6",
                weight: 2,
                dashArray: "6 8",
                opacity: 0.7,
              }}
            />
          ))}
          <Polyline
            positions={points.map((p) => [p.lat, p.lon] as [number, number])}
            pathOptions={{ color, weight: 4, opacity: 0.95 }}
          />
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
          <Fit points={points} />
        </MapContainer>
      )}
    </div>
  );
}
