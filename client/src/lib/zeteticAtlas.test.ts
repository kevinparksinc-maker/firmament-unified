import { describe, expect, it } from "vitest";
import { ATLAS_CALCULATION_BASELINE, calculateZeteticChart, compassPoint, equalHouseForLongitude, gleasonPoint } from "./zeteticAtlas";

describe("Zetetic Atlas calculation module", () => {
  it("retains the Dallas direct UTC-degree axes while sourcing planets live", () => {
    const chart = calculateZeteticChart({
      birthDate: "1986-11-20",
      birthTime: "10:06",
      timezone: "America/Chicago",
      location: "Dallas, Texas",
      latitude: 32.7767,
      longitude: -96.797,
    });
    const sun = chart.points.find((point) => point.key === "sun");
    const mercury = chart.points.find((point) => point.key === "mercury");
    const mars = chart.points.find((point) => point.key === "mars");

    expect(chart.utcDegrees).toBeCloseTo(241.5, 3);
    expect(chart.midheaven).toBeCloseTo(144.703, 3);
    expect(chart.ascendant).toBeCloseTo(234.703, 3);
    expect(chart.baseline).toEqual(ATLAS_CALCULATION_BASELINE);
    expect(chart.baseline.id).toBe("atlas-live-engine-v1");
    expect(sun?.longitude).toBeCloseTo(238.044, 2);
    // Astronomy Engine's live geocentric tropical longitude agrees with
    // JPL Horizons' IAU76/80 ecliptic-of-date observer field to < 0.1 arcsec.
    expect(mars?.longitude).toBeCloseTo(326.35198, 4);
    expect(mars).toMatchObject({ sign: "Aquarius", house: 4 });
    expect(sun?.nakshatra).toEqual({ name: "Jyeshtha", lord: "Mercury", pada: 4 });
    expect(mercury?.fixedStars).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Antares", isRoyal: true }),
    ]));
    expect(chart.aspectScan.aspects).toEqual(expect.arrayContaining([
      expect.objectContaining({ first: "Sun", second: "Mars", type: "square", state: "separating" }),
    ]));
    expect(chart.aspectScan.angularContacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ planet: "Sun", angle: "Ascendant" }),
      expect.objectContaining({ planet: "Mars", angle: "Imum Coeli" }),
    ]));
    expect(chart.aspectScan.stelliums).toEqual(expect.arrayContaining([
      expect.objectContaining({ scope: "sign", location: "Scorpio", planets: ["Sun", "Mercury", "Venus", "Pluto"] }),
      expect.objectContaining({ scope: "Equal House", location: "House 12", planets: ["Mercury", "Venus", "Pluto"] }),
    ]));
  });

  it("keeps the supplied 235° Mars row as a historical Equal-House reference only", () => {
    const suppliedHistoricalMarsLongitude = 235;
    const directDallasAscendant = 234.703;

    expect(equalHouseForLongitude(suppliedHistoricalMarsLongitude, directDallasAscendant)).toBe(1);
    expect(equalHouseForLongitude(326.3519766, directDallasAscendant)).toBe(4);
  });

  it("produces valid longitudes, houses, horizon coordinates, and map points for another user", () => {
    const chart = calculateZeteticChart({
      birthDate: "2000-01-15",
      birthTime: "12:00",
      timezone: "Europe/London",
      location: "London, United Kingdom",
      latitude: 51.5074,
      longitude: -0.1278,
    });

    for (const point of chart.points) {
      const gleason = gleasonPoint(point.rightAscension, point.declination);
      const compass = compassPoint(point.azimuth, point.altitude);
      expect(point.longitude).toBeGreaterThanOrEqual(0);
      expect(point.longitude).toBeLessThan(360);
      expect(point.house).toBeGreaterThanOrEqual(1);
      expect(point.house).toBeLessThanOrEqual(12);
      expect(point.rightAscension).toBeGreaterThanOrEqual(0);
      expect(point.rightAscension).toBeLessThan(24);
      expect(point.declination).toBeGreaterThanOrEqual(-90);
      expect(point.declination).toBeLessThanOrEqual(90);
      expect(point.azimuth).toBeGreaterThanOrEqual(0);
      expect(point.azimuth).toBeLessThan(360);
      expect(point.altitude).toBeGreaterThanOrEqual(-90);
      expect(point.altitude).toBeLessThanOrEqual(90);
      expect(point.nakshatra.name).toBeTruthy();
      expect(point.nakshatra.lord).toBeTruthy();
      expect(point.nakshatra.pada).toBeGreaterThanOrEqual(1);
      expect(point.nakshatra.pada).toBeLessThanOrEqual(4);
      expect(Array.isArray(point.fixedStars)).toBe(true);
      expect(Number.isFinite(gleason.x) && Number.isFinite(gleason.y)).toBe(true);
      expect(Number.isFinite(compass.x) && Number.isFinite(compass.y)).toBe(true);
    }
  });
});
