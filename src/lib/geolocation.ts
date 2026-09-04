import type { LatLon } from "../types";

export function roundCoord(n: number): number {
  return Number(n.toFixed(5));
}

export function locateErrorMessage(code?: number): string {
  switch (code) {
    case 1:
      return "Location permission was denied. Allow location, or enter lat/lon / click a map to place the route.";
    case 2:
      return "Your position is unavailable right now. Enter lat/lon or click a map to place the route.";
    case 3:
      return "Location request timed out. Enter lat/lon or click a map to place the route.";
    default:
      return "Could not read your location. Enter lat/lon or click a map to place the route.";
  }
}

export type LocateResult =
  | { ok: true; center: LatLon }
  | { ok: false; message: string };

type GeoError = { code?: number };
type GeoPosition = { coords: { latitude: number; longitude: number } };

export type GeoLocator = {
  getCurrentPosition: (
    success: (pos: GeoPosition) => void,
    error?: (err: GeoError) => void,
    options?: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number },
  ) => void;
};

export async function locateCurrentPosition(
  locator: GeoLocator | undefined = typeof navigator !== "undefined"
    ? navigator.geolocation
    : undefined,
): Promise<LocateResult> {
  if (!locator) {
    return {
      ok: false,
      message: "Geolocation is not available in this browser. Enter lat/lon or click a map.",
    };
  }

  if (typeof navigator !== "undefined" && navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      if (status.state === "denied") {
        return { ok: false, message: locateErrorMessage(1) };
      }
    } catch {
      // Permissions API is optional; fall through to getCurrentPosition.
    }
  }

  return new Promise((resolve) => {
    locator.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          center: {
            lat: roundCoord(pos.coords.latitude),
            lon: roundCoord(pos.coords.longitude),
          },
        });
      },
      async (err) => {
        let code = err?.code;
        if (typeof navigator !== "undefined" && navigator.permissions?.query) {
          try {
            const status = await navigator.permissions.query({ name: "geolocation" });
            if (status.state === "denied") code = 1;
          } catch {
            // keep original code
          }
        }
        resolve({ ok: false, message: locateErrorMessage(code) });
      },
      { enableHighAccuracy: true, timeout: 25_000, maximumAge: 15_000 },
    );
  });
}
