import { describe, expect, it } from "vitest";
import { findAtlasPlanetaryWars, getAtlasMotion } from "./atlasPhenomena";
import { calculateZeteticChart } from "./zeteticAtlas";

describe("Atlas local phenomena registry", () => {
  it("classifies signed geocentric longitude motion without any network lookup", () => {
    const retrograde = getAtlasMotion(100.0, 99.9, 0.5);
    const directAcrossAries = getAtlasMotion(359.9, 0.1, 0.5);
    expect(retrograde).toMatchObject({ applicable: true, isRetrograde: true });
    expect(retrograde.speedDegreesPerDay).toBeCloseTo(-0.2, 8);
    expect(directAcrossAries).toMatchObject({ applicable: true, isRetrograde: false });
    expect(directAcrossAries.speedDegreesPerDay).toBeCloseTo(0.4, 8);
  });

  it("flags only declared Graha Yuddha participants at or below the 1° threshold", () => {
    const wars = findAtlasPlanetaryWars([
      { name: "Mars", longitude: 10 },
      { name: "Mercury", longitude: 10.75 },
      { name: "Venus", longitude: 42 },
      { name: "Jupiter", longitude: 130 },
      { name: "Saturn", longitude: 250 },
      { name: "Uranus", longitude: 10.2 },
    ]);
    expect(wars).toHaveLength(1);
    expect(wars[0]).toMatchObject({ first: "Mars", second: "Mercury", distance: 0.75, threshold: 1 });
  });

  it("records live Dallas retrograde and no-war results from the active Atlas baseline", () => {
    const chart = calculateZeteticChart({
      birthDate: "1986-11-20",
      birthTime: "10:06",
      timezone: "America/Chicago",
      location: "Dallas, Texas",
      latitude: 32.7767,
      longitude: -96.797,
    });
    const mercury = chart.points.find(point => point.key === "mercury");
    const venus = chart.points.find(point => point.key === "venus");

    expect(mercury?.motion).toMatchObject({ applicable: true, isRetrograde: true });
    expect(mercury?.motion.speedDegreesPerDay).toBeCloseTo(-0.324, 3);
    expect(venus?.motion).toMatchObject({ applicable: true, isRetrograde: true });
    expect(venus?.motion.speedDegreesPerDay).toBeCloseTo(-0.226, 3);
    expect(chart.planetaryWars).toEqual([]);
  });
});
