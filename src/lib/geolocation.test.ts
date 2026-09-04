import { describe, expect, it } from "vitest";
import {
  locateCurrentPosition,
  locateErrorMessage,
  roundCoord,
} from "./geolocation";

describe("geolocation helpers", () => {
  it("maps permission and timeout codes to actionable errors", () => {
    expect(locateErrorMessage(1)).toMatch(/denied/i);
    expect(locateErrorMessage(2)).toMatch(/unavailable/i);
    expect(locateErrorMessage(3)).toMatch(/timed out/i);
    expect(locateErrorMessage()).toMatch(/click a map/i);
  });

  it("rounds coordinates for the lat/lon fields", () => {
    expect(roundCoord(37.75641234)).toBe(37.75641);
  });

  it("resolves a successful locator to a center point", async () => {
    const result = await locateCurrentPosition({
      getCurrentPosition: (ok) =>
        ok({ coords: { latitude: 40.7128, longitude: -74.006 } }),
    });
    expect(result).toEqual({ ok: true, center: { lat: 40.7128, lon: -74.006 } });
  });

  it("returns a short error when permission is denied", async () => {
    const result = await locateCurrentPosition({
      getCurrentPosition: (_ok, err) => err?.({ code: 1 }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/denied/i);
  });

  it("handles a missing Geolocation API", async () => {
    const result = await locateCurrentPosition(undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/not available/i);
  });
});
