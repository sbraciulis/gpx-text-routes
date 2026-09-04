export type Pt = { x: number; y: number };
export type Stroke = Pt[];
export type LatLon = { lat: number; lon: number };

export type Glyph = {
  width: number;
  strokes: Stroke[];
};

export type GlyphStyle = "round" | "square";

export type LaidChar = {
  ch: string;
  x: number;
  width: number;
  strokes: Stroke[];
};

export type LayoutResult = {
  chars: LaidChar[];
  strokes: Stroke[];
  width: number;
  height: number;
};

export type BuiltTrack = {
  points: LatLon[];
  strokes: LatLon[][];
  charStrokes: LatLon[][][];
  pauses: LatLon[];
  resumes: LatLon[];
  jumpEdges: { start: LatLon; end: LatLon; kind: "stroke" | "letter" }[];
};

export type StreetSource = "osrm" | "grid" | "direct";

export type StreetTrack = {
  points: LatLon[];
  source: StreetSource;
  message?: string;
};
