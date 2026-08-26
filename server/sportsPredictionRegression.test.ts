import { describe, expect, it } from "vitest";
import { kpDecisionLayer } from "./kpEngine";
import type { ChartData } from "./masterPredictionEngine";
import { invertSportsChart180 } from "./sportsHoraryV2Reading";

describe("sports KP and inverse-map regression", () => {
  it("evaluates KP cuspal sub-lords from supplied numeric house cusps without crashing", () => {
    const chart: ChartData = {
      houses: Array.from({ length: 12 }, (_, index) => ({ house: index + 1, degree: index * 30 })),
      houseLords: [],
      planetsInHouses: [
        { planet: "Sun", house: 1, sign: "Aries", degree: 10, eclipticLon: 10, isRetrograde: false },
        { planet: "Moon", house: 7, sign: "Libra", degree: 10, eclipticLon: 190, isRetrograde: false },
      ],
      lots: [],
      fixedStars: [],
      aspects: [],
      moon: { phase: "waxing", isVoidOfCourse: false, nakshatra: "Ashwini" },
    };

    expect(kpDecisionLayer(chart, {
      sideAHouses: [1, 3, 6, 10, 11],
      sideBHouses: [4, 5, 7, 9, 12],
      sideALabel: "A",
      sideBLabel: "B",
    })).toEqual(expect.objectContaining({ layer: "KP Stellar (Sub-Lord & Significators)" }));
  });

  it("rotates every supplied event-chart longitude by 180 degrees for comparison without mutating the standard chart", () => {
    const standard = {
      Sun: { planet: "Sun", degree: 10, sign: "Aries", house: 1, rx: false, combust: false, cazimi: false, eclipticLon: 10, raw: "", kind: "transit" as const },
      Moon: { planet: "Moon", degree: 25, sign: "Scorpio", house: 8, rx: false, combust: false, cazimi: false, eclipticLon: 235, raw: "", kind: "transit" as const },
    };
    const inverse = invertSportsChart180(standard);

    expect(inverse.Sun).toEqual(expect.objectContaining({ sign: "Libra", degree: 10, eclipticLon: 190 }));
    expect(inverse.Moon).toEqual(expect.objectContaining({ sign: "Taurus", degree: 25, eclipticLon: 55 }));
    expect(standard.Sun.eclipticLon).toBe(10);
  });
});
