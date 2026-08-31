import { describe, expect, it } from "vitest";
import { calculateCoordinateComparison } from "./coordinateComparison";

describe("dome-model and conventional tropical reference comparison", () => {
  it("uses one frozen Tokyo Dome instant while retaining separate axes, house systems, and non-scoring boundaries", () => {
    const comparison = calculateCoordinateComparison({
      local: { year: 1990, month: 2, day: 11, hour: 9, minute: 0 },
      utcDate: new Date("1990-02-11T00:00:00.000Z"),
      latitude: 35.7056,
      longitude: 139.7519,
      altitude: 0,
      venueName: "Tokyo Dome",
      timezone: "Asia/Tokyo",
    });

    expect(comparison.event.utcIso).toBe("1990-02-11T00:00:00.000Z");
    expect(comparison.domeModel.ascendant).toBeCloseTo(229.7519, 4);
    expect(comparison.domeModel.houseSystem).toContain("Equal Houses");
    expect(comparison.conventionalTropicalReference.houseSystem).toContain("Placidus");
    expect(comparison.domeModel.points).toHaveLength(12);
    expect(comparison.conventionalTropicalReference.points).toHaveLength(12);
    expect(comparison.domeModel.points.find(point => point.name === "Moon")).toEqual(expect.objectContaining({
      sign: "Virgo",
      house: 10,
    }));
    expect(comparison.conventionalTropicalReference.points.find(point => point.name === "Moon")).toEqual(expect.objectContaining({
      sign: "Virgo",
      house: 6,
    }));
    expect(comparison.boundary).toContain("Neither coordinate view");
  });
});
