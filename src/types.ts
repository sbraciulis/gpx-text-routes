export type Pt = { x: number; y: number };
export type Stroke = Pt[];
export type LatLon = { lat: number; lon: number };

export type Glyph = {
  width: number;
  strokes: Stroke[];
};

export type LayoutResult = {
  strokes: Stroke[];
  width: number;
  height: number;
};

export type BuiltTrack = {
  points: LatLon[];
  strokes: LatLon[][];
  pauses: LatLon[];
  resumes: LatLon[];
  jumpEdges: { start: LatLon; end: LatLon }[];
};

export type StreetSource = "osrm" | "grid" | "direct";

export type StreetTrack = {
  points: LatLon[];
  source: StreetSource;
  message?: string;
};
