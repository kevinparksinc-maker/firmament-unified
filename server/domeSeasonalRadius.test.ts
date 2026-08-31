import { describe, expect, it } from "vitest";
import {
  calculateAncientHorizonAscendant,
  calculateDomeSeasonalRadiusAudit,
  solarRadius,
} from "./domeSeasonalRadius";

describe("experimental dome seasonal-radius model", () => {
  it("anchors the tight Cancer radius at the configured summer solstice", () => {
    expect(solarRadius(172)).toBeCloseTo(1600, 8);
  });

  it("reaches the wide Capricorn radius near the winter solstice", () => {
    expect(solarRadius(172 + 365.25 / 2)).toBeCloseTo(2900, 8);
  });

  it("uses the midpoint at the equinox quarter cycle", () => {
    expect(solarRadius(172 + 365.25 / 4)).toBeCloseTo(2250, 8);
  });

  it("changes angular velocity inversely with the configured path radius", () => {
    const summer = calculateDomeSeasonalRadiusAudit({
      dayOfYear: 172,
      localSiderealAngleDegrees: 120,
      observerDistanceFromPoleMiles: 4000,
    });
    const winter = calculateDomeSeasonalRadiusAudit({
      dayOfYear: 172 + 365.25 / 2,
      localSiderealAngleDegrees: 120,
      observerDistanceFromPoleMiles: 4000,
    });

    expect(summer.angularVelocityDegreesPerHour).toBeGreaterThan(
      winter.angularVelocityDegreesPerHour,
    );
  });

  it("returns a normalized Ascendant from the proposed horizon equation", () => {
    const ascendant = calculateAncientHorizonAscendant(120, 30);
    expect(ascendant).toBeGreaterThanOrEqual(0);
    expect(ascendant).toBeLessThan(360);
  });

  it("requires an explicit observer radial distance beyond the Cancer path", () => {
    expect(() =>
      calculateDomeSeasonalRadiusAudit({
        dayOfYear: 172,
        localSiderealAngleDegrees: 120,
        observerDistanceFromPoleMiles: 1600,
      }),
    ).toThrow(/observerDistanceFromPoleMiles/);
  });
});
