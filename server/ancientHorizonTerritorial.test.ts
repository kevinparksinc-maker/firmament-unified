import { describe, expect, it } from "vitest";
import { calculateAncientHorizonTerritorial } from "./ancientHorizonTerritorial";

describe("Ancient-Horizon Territorial / Cluster variant", () => {
  it("preserves topocentric source and uses the Ancient-Horizon Equal-House anchor", async () => {
    const result = await calculateAncientHorizonTerritorial({
      utcDate: new Date("1990-02-11T00:00:00.000Z"),
      latitude: 35.7056,
      longitude: 139.7519,
      altitude: 0,
      dayOfYear: 42,
      localModelAngleDegrees: 139.7519,
      observerDistanceFromPoleMiles: 4000,
    });

    expect(result.version).toBe("ancient-horizon-territorial-v1");
    expect(result.source.longitudeFrame).toBe("topocentric-apparent-ecliptic");
    expect(result.source.houseSystem).toBe("Ancient-Horizon Equal Houses");
    expect(result.source.observer).toEqual({ latitude: 35.7056, longitude: 139.7519, altitude: 0 });
    expect(result.source.ascendantDegrees).toBeCloseTo(212.834554, 5);
    expect(result.chart.Mars?.eclipticLon).toBeCloseTo(278.9754535, 5);
    expect(result.chart.Mars?.house).toBe(3);
    expect(result.cluster.sideAHouses.map((house) => house.houseNumber)).toEqual([1, 3, 6, 10, 11]);
    expect(result.cluster.sideBHouses.map((house) => house.houseNumber)).toEqual([4, 5, 7, 9, 12]);
  });

  it("rotates the full topocentric chart by exactly 180 degrees in inverse mode", async () => {
    const input = {
      utcDate: new Date("1990-02-11T00:00:00.000Z"),
      latitude: 35.7056,
      longitude: 139.7519,
      altitude: 0,
      dayOfYear: 42,
      localModelAngleDegrees: 139.7519,
      observerDistanceFromPoleMiles: 4000,
    };
    const standard = await calculateAncientHorizonTerritorial(input);
    const inverse = await calculateAncientHorizonTerritorial({ ...input, orientation: "inverse-180" });

    expect(inverse.orientation).toBe("inverse-180");
    expect(inverse.source.ascendantDegrees).toBeCloseTo((standard.source.ascendantDegrees + 180) % 360, 8);
    expect(inverse.chart.Sun?.eclipticLon).toBeCloseTo((standard.chart.Sun!.eclipticLon! + 180) % 360, 8);
    expect(inverse.source.longitudeFrame).toBe("topocentric-apparent-ecliptic");
  });
});
