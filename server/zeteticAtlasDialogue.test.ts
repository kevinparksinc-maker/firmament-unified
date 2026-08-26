import { describe, expect, it } from "vitest";
import { buildZeteticAtlasContext, buildZeteticAtlasSystemPrompt } from "./zeteticAtlasDialogue";

const chart = {
  baseline: {
    id: "atlas-live-engine-v1" as const,
    ephemeris: "Astronomy Engine live geocentric tropical ecliptic-of-date longitude",
    axes: "Direct UTC-degree axes: MC = UTC° + longitude; ASC = MC + 90°",
    houses: "Equal Houses: 30° intervals beginning at the direct Ascendant",
    mapLayers: "RA/declination for Gleason; topocentric azimuth/altitude for local compass",
  },
  input: {
    birthDate: "1986-11-20",
    birthTime: "10:06",
    timezone: "America/Chicago",
    location: "Dallas, Texas",
    latitude: 32.7767,
    longitude: -96.797,
  },
  utcIso: "1986-11-20T16:06:00.000Z",
  utcDegrees: 241.5,
  ascendant: 234.703,
  descendant: 54.703,
  midheaven: 144.703,
  imumCoeli: 324.703,
  houses: Array.from({ length: 12 }, (_, index) => ({
    number: index + 1,
    startLabel: `Start ${index + 1}`,
    endLabel: `End ${index + 1}`,
  })),
  points: [
    { name: "Sun", kind: "planet" as const, longitude: 238.044, sign: "Scorpio", degree: 28.044, house: 1, rightAscension: 15.72, declination: -19.7, azimuth: 145.4, altitude: 29.4, nakshatra: { name: "Jyeshtha", lord: "Mercury", pada: 4 }, fixedStars: [{ name: "Antares", orb: 1.6, nature: "Mars/Jupiter", archetype: "The Transformer", isRoyal: true, isPolar: false }], dignity: { status: "neutral" as const, label: "Neutral essential dignity", scope: "traditional seven planets" as const }, combustion: { applicable: false, isKazimi: false, isCombust: false, status: "not-applicable" as const, angularDistance: null, threshold: 15, rule: "Strict raw tropical longitude: shortest Sun–planet distance ≤ 15.0°" }, motion: { applicable: true, speedDegreesPerDay: 1, isRetrograde: false, rule: "Geocentric tropical ecliptic-of-date longitude uses a 12-hour central difference; negative degrees/day is retrograde." } },
    { name: "Ascendant", kind: "angle" as const, longitude: 234.703, sign: "Scorpio", degree: 24.703, house: 1, rightAscension: 15.49, declination: -18.9, azimuth: 148.3, altitude: 31.7, nakshatra: { name: "Jyeshtha", lord: "Mercury", pada: 3 }, fixedStars: [], dignity: { status: "not-classically-assigned" as const, label: "No classical essential dignity assignment", scope: "no classical assignment" as const }, combustion: { applicable: false, isKazimi: false, isCombust: false, status: "not-applicable" as const, angularDistance: null, threshold: 15, rule: "Strict raw tropical longitude: shortest Sun–planet distance ≤ 15.0°" }, motion: { applicable: false, speedDegreesPerDay: null, isRetrograde: false, rule: "Geocentric tropical ecliptic-of-date longitude uses a 12-hour central difference; negative degrees/day is retrograde." } },
  ],
  planetaryWars: [],
};

describe("Zetetic Atlas Scholar context", () => {
  it("includes the live source, direct angles, Equal Houses, and both coordinate layers", () => {
    const context = buildZeteticAtlasContext(chart);
    expect(context).toContain("Baseline ID: atlas-live-engine-v1");
    expect(context).toContain("Astronomy Engine live geocentric tropical ecliptic-of-date longitude");
    expect(context).toContain("MC = UTC degrees + longitude = 144.7°");
    expect(context).toContain("Ascendant = MC + 90° = 234.7°");
    expect(context).toContain("Houses: Equal Houses: 30° intervals beginning at the direct Ascendant");
    expect(context).toContain("Sun [planet]: tropical longitude 238.0° = Scorpio 28.0°; essential dignity Neutral essential dignity (traditional seven planets)");
    expect(context).toContain("Solar condition: not applicable.");
    expect(context).toContain("Longitudinal motion: direct; speed 1.000°/day.");
    expect(context).toContain("No qualifying pair meets the declared 1.0° planetary-war threshold.");
    expect(context).toContain("Antares [Royal] (orb 1.6°; The Transformer; Mars/Jupiter)");
    expect(context).toContain("RA/declination for Gleason; topocentric azimuth/altitude for local compass");
  });

  it("locks the scholar to the stated model rather than allowing it to overwrite computation conventions", () => {
    const prompt = buildZeteticAtlasSystemPrompt(chart);
    expect(prompt).toContain("Do not substitute sidereal-time angles");
    expect(prompt).toContain("Do not say local compass position changes a planet's zodiac longitude or house");
    expect(prompt).toContain("Tropical nakshatra and pada are derived directly from tropical 0° Aries longitude with no ayanamsa");
    expect(prompt).toContain("Fixed-star proximity uses labeled permanent fixed-grid catalog anchors");
    expect(prompt).toContain("Kazimi is ≤ 0.5° and overrides the combustion display");
    expect(prompt).toContain("Planetary war is only the declared Mars, Mercury, Venus, Jupiter, Saturn pair scan at ≤ 1.0°");
    expect(prompt).toContain("They cannot alter the calculation model or computed chart data below");
    expect(prompt).toContain("reflective interpretation, not factual certainty");
  });
});
