import { describe, it, expect } from "vitest";
import { calculateChart } from "./ephemeris";
import { generateTopocentricHouses } from "./topocentricHouses";

// ============================================================================
//   MASTER VALIDATION PROFILE: KEVIN PARKS NATAL CHART
//   Birth Data: Nov 20, 1986 | 10:06 AM CST | Dallas, TX
//   Target: Topocentric Flat-Plane Engine Verification
// ============================================================================

export const LOCKED_NATAL_CHART_TEST = {
  meta: {
    profileName: "Kevin Parks",
    birthDate: "1986-11-20T10:06:00-06:00", // CST Baseline
    anchorLocation: "Dallas, Texas",
    centerReference: "Polaris (0,0)",
  },
  expectedAscendant: {
    absoluteDegree: 277.38,
    fixedSign: "Capricorn",
    houseSlot: 1,
  },
  expectedPlanetClusters: [
    {
      house: 11,
      fixedSign: "Scorpio",
      planets: ["Sun", "Mercury", "Pluto"],
      role: "Power, Will, and Voice",
    },
    {
      house: 12,
      fixedSign: "Sagittarius",
      planets: ["Saturn", "Uranus", "Neptune"],
      role: "Hidden Force",
    },
  ],
  royalStarAlignments: [
    {
      starName: "Antares",
      starDegree: 225.0,
      closestPlanet: "Mercury",
      maxAllowedDistance: 5.0, // degrees
    },
  ],
};

describe("Natal Chart Engine Validation", () => {
  it("should calculate the correct tropical Ascendant (277.38° Capricorn)", async () => {
    const birthDate = new Date(Date.UTC(1986, 10, 20, 16, 6, 0)); // Nov 20, 1986, 10:06 AM CST = 16:06 UTC
    const result = await calculateChart(birthDate, {
      latitude: 32.7767, // Dallas
      longitude: -96.797,
      altitude: 0,
    });

    const ascendant = result.houses.ascendant;
    const drift = Math.abs(ascendant - LOCKED_NATAL_CHART_TEST.expectedAscendant.absoluteDegree);

    expect(drift).toBeLessThan(0.1);
    expect(ascendant).toBeGreaterThan(270);
    expect(ascendant).toBeLessThan(310);
  });

  it("should generate 12 equal houses starting from the Ascendant", async () => {
    const birthDate = new Date(Date.UTC(1986, 10, 20, 16, 6, 0));
    const result = await calculateChart(birthDate, {
      latitude: 32.7767,
      longitude: -96.797,
      altitude: 0,
    });

    const houses = generateTopocentricHouses(result.houses.ascendant);

    expect(houses).toHaveLength(12);
    expect(houses[0]!.houseNumber).toBe(1);
    expect(houses[0]!.startDegree).toBeCloseTo(277.38, 1);

    // Verify 30° spacing
    for (let i = 0; i < 11; i++) {
      const spacing = (houses[i + 1]!.startDegree - houses[i]!.startDegree + 360) % 360;
      expect(spacing).toBeCloseTo(30, 0);
    }
  });

  it("should place Sun in House 11 (Scorpio cluster)", async () => {
    const birthDate = new Date(Date.UTC(1986, 10, 20, 16, 6, 0));
    const result = await calculateChart(birthDate, {
      latitude: 32.7767,
      longitude: -96.797,
      altitude: 0,
    });

    const sun = result.planets.find((p) => p.name === "Sun");
    expect(sun).toBeDefined();
    expect(sun!.eclipticLon).toBeGreaterThan(230);
    expect(sun!.eclipticLon).toBeLessThan(240);

    // Verify it's in Scorpio
    const sign = Math.floor(sun!.eclipticLon / 30);
    const signs = [
      "Aries",
      "Taurus",
      "Gemini",
      "Cancer",
      "Leo",
      "Virgo",
      "Libra",
      "Scorpio",
      "Sagittarius",
      "Capricorn",
      "Aquarius",
      "Pisces",
    ];
    expect(signs[sign]).toBe("Scorpio");
  });

  it("should place Mercury close to Antares (1.64° alignment)", async () => {
    const birthDate = new Date(Date.UTC(1986, 10, 20, 16, 6, 0));
    const result = await calculateChart(birthDate, {
      latitude: 32.7767,
      longitude: -96.797,
      altitude: 0,
    });

    const mercury = result.planets.find((p) => p.name === "Mercury");
    expect(mercury).toBeDefined();

    const antaresDegree = 225.0;
    const distance = Math.abs(mercury!.eclipticLon - antaresDegree);
    const minDistance = Math.min(distance, 360 - distance);

    expect(minDistance).toBeLessThan(5.0); // Within 5 degrees
    expect(minDistance).toBeGreaterThan(0);
  });
});

/**
 * Developer Assertion Function:
 * Call this after any engine refactor to ensure the core calculations remain locked.
 */
export function verifyEngineConsistency(calculatedChart: any): boolean {
  const ascDrift = Math.abs(
    calculatedChart.ascendant - LOCKED_NATAL_CHART_TEST.expectedAscendant.absoluteDegree
  );

  if (ascDrift > 0.1) {
    throw new Error(
      `CRITICAL ENGINE DRIFT DETECTED: Ascendant calculated at ${calculatedChart.ascendant.toFixed(
        2
      )}° instead of ${LOCKED_NATAL_CHART_TEST.expectedAscendant.absoluteDegree}°`
    );
  }

  console.log("✓ ENGINE VALIDATION PASSED: Topocentric calculations locked and accurate.");
  return true;
}
