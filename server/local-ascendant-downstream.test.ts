import { describe, expect, it } from "vitest";
import { calculateFullPrediction, type ChartData } from "./masterPredictionEngine";

describe("local Ascendant downstream contract", () => {
  it("preserves upstream local whole-sign houses in fixed-dome scoring", () => {
    const chart: ChartData = {
      planetsInHouses: [
        { planet: "Sun", house: 10, sign: "Cancer", degree: 4, eclipticLon: 94, isRetrograde: false },
        { planet: "Moon", house: 4, sign: "Capricorn", degree: 4, eclipticLon: 274, isRetrograde: false },
      ],
      houseLords: [],
      lots: [],
      fixedStars: [],
      aspects: [],
      moon: { phase: "waxing", isVoidOfCourse: false, nakshatra: "Ashwini" },
      houses: Array.from({ length: 12 }, (_, index) => ({ house: index + 1, degree: index * 30 })),
    } as ChartData & { houses: Array<{ house: number; degree: number }> };
    calculateFullPrediction(chart, {
      fixedDomeMode: true,
      sideAHouses: [1, 3, 6, 10, 11],
      sideBHouses: [7, 9, 12, 4, 5],
      sideALabel: "A",
      sideBLabel: "B",
    });
    expect(chart.planetsInHouses.map((planet) => planet.house)).toEqual([10, 4]);
  });
});
