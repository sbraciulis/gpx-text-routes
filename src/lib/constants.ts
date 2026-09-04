import type { LatLon } from "../types";

/** Inner Richmond / Castro-Noe grid — enough blocks for a neighborhood-scale "33". */
export const DEMO_CENTER: LatLon = { lat: 37.7564, lon: -122.4342 };

export const DEFAULT_TEXT = "33";
export const DEFAULT_HEIGHT_M = 450;
export const DEFAULT_HEADING_DEG = 0;

/** Normalized gap between character cells (as a fraction of glyph height). */
export const CHAR_GAP = 0.28;

/** GPS-like spacing along runnable strokes. */
export const TRACK_POINT_SPACING_M = 8;

/**
 * Pause/resume doodles are sized to read at ~50 ft (15 m) map zoom.
 * 14 m across fills most of that view without swallowing the glyph.
 */
export const MARKER_SIZE_M = 14;

/** Nudge markers slightly past the stroke so they don't sit on the letter. */
export const MARKER_OUTSET_M = 7;

export const STREET_WAYPOINT_SPACING_M = 70;
export const STREET_GRID_M = 85;
export const OSRM_TIMEOUT_MS = 12_000;
export const OSRM_MAX_WAYPOINTS = 80;
export const OSRM_ENDPOINT = "https://router.project-osrm.org/route/v1/foot";

export const METERS_PER_FOOT = 0.3048;
export const METERS_PER_DEG_LAT = 111_320;
