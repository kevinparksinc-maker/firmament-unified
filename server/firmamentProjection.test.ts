import { describe, expect, it } from "vitest";
import {
  computeSeasonalRadius,
  evaluateAspect,
  fixedHouseOf,
  FIRMAMENT_SEASONAL_RADIUS,
  inverseFirmamentPosition,
  projectToDisk,
  seasonalRadiusFromCancerCapricorn,
} from "./firmamentProjection";

const center = { cx: 100, cy: 100 };
const pos = (body: string, azimuth: number, radius: number) => ({ body, azimuth, radius, sourceCoordinate: `${body}-fixture`, calculationMode: "agent-view" as const });

describe("Firmament fixed-frame projection", () => {
  it("keeps the four screen anchors fixed", () => {
    expect(projectToDisk(0, 10, center)).toEqual({ x: 100, y: 90 });
    expect(projectToDisk(90, 10, center)).toEqual({ x: 110, y: 100 });
    expect(projectToDisk(180, 10, center)).toEqual({ x: 100, y: 110 });
    expect(projectToDisk(270, 10, center)).toEqual({ x: 90, y: 100 });
  });

  it("assigns fixed houses from East in decreasing azimuth", () => {
    expect(fixedHouseOf(90)).toBe(1);
    expect(fixedHouseOf(0)).toBe(4);
    expect(fixedHouseOf(270)).toBe(7);
    expect(fixedHouseOf(180)).toBe(10);
    expect(fixedHouseOf(60)).toBe(2);
    expect(fixedHouseOf(120)).toBe(12);
  });

  it("maps the declared Cancer and Capricorn radii to the configured phase", () => {
    expect(seasonalRadiusFromCancerCapricorn(172)).toBeCloseTo(FIRMAMENT_SEASONAL_RADIUS.R_CAPRICORN);
    expect(seasonalRadiusFromCancerCapricorn(172 + 365.25 / 2)).toBeCloseTo(FIRMAMENT_SEASONAL_RADIUS.R_CANCER);
  });

  it("supports explicit clamping and rejects invalid periods", () => {
    expect(computeSeasonalRadius({ dayOfYear: 1, baseRadius: 100, seasonalAmplitude: 100, minRadius: 50, maxRadius: 150 })).toBeLessThanOrEqual(150);
    expect(() => computeSeasonalRadius({ dayOfYear: 1, baseRadius: 100, seasonalAmplitude: 1, periodDays: 0 })).toThrow();
  });

  it("adds radial strength without replacing angular aspect detection", () => {
    const result = evaluateAspect(pos("A", 0, 100), pos("B", 120, 104), 2, 5);
    expect(result.angularSeparation).toBe(120);
    expect(result.isAngularAspect).toBe(true);
    expect(result.radialSeparation).toBe(4);
    expect(result.isRadiallyStrong).toBe(true);
  });

  it("rejects positions without declared radius provenance", () => {
    expect(() => evaluateAspect({ body: "A", azimuth: 0, radius: Number.NaN, calculationMode: "agent-view" }, pos("B", 120, 100), 2, 5)).toThrow(/radius/);
    expect(() => evaluateAspect({ body: "A", azimuth: 0, radius: 100, calculationMode: "agent-view" }, { ...pos("B", 120, 100), sourceCoordinate: "" }, 2, 5)).toThrow(/provenance/);
  });

  it("rotates a complete position by exactly 180 degrees", () => {
    const result = inverseFirmamentPosition(pos("A", 12.5, 100));
    expect(result.azimuth).toBeCloseTo(192.5);
    expect(result.radius).toBe(100);
    expect(result.body).toBe("A");
  });
});
