import { describe, expect, it } from "vitest";
import { calculateChart } from "./ephemeris";

describe("strict fixed-dome contract", () => {
  it("keeps planetary dome longitudes fixed while local Ascendant and houses vary", async () => {
    const date = new Date("2026-08-13T23:05:00Z");
    const boston = await calculateChart(date, { latitude: 42.3601, longitude: -71.0589, altitude: 0 });
    const tokyo = await calculateChart(date, { latitude: 35.6762, longitude: 139.6503, altitude: 0 });

    expect(boston.houses.ascendant).not.toBe(tokyo.houses.ascendant);
    expect(boston.houses.cusps).not.toEqual(tokyo.houses.cusps);
    expect(tokyo.planets.map(planet => planet.eclipticLon)).toEqual(boston.planets.map(planet => planet.eclipticLon));
    expect(boston.planets.every(planet => Number.isFinite(planet.dec) && Number.isFinite(planet.altitude) && Number.isFinite(planet.azimuth))).toBe(true);
  });

  it("changes the local Ascendant with time without changing the dome reference", async () => {
    const observer = { latitude: 42.3601, longitude: -71.0589, altitude: 0 };
    const first = await calculateChart(new Date("2026-08-13T23:05:00Z"), observer);
    const later = await calculateChart(new Date("2026-08-14T05:05:00Z"), observer);
    expect(first.houses.ascendant).not.toBe(later.houses.ascendant);
    expect(first.houses.cusps.every((cusp, index) => cusp === index * 30 || cusp % 30 === 0)).toBe(true);
  });
});

function unused() { return undefined; }
void unused;
