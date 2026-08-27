import { describe, expect, it } from "vitest";
import { assignEqualHousesToChart, buildChartData } from "./sportsHoraryReading";

describe("legacy Cluster Equal House normalization", () => {
  it("reassigns an ephemeris Whole Sign chart against the exact supplied Ascendant before Territorial and KP consume it", () => {
    const ascendant = 16.55092506828646;
    const wholeSignLabeledChart = {
      Moon: { planet: "Moon", degree: 6.32819922322972, sign: "Virgo", house: 6, rx: false, combust: false, cazimi: false, eclipticLon: 156.32819922322972, raw: "", kind: "transit" as const },
      Mars: { planet: "Mars", degree: 8.97553506804593, sign: "Capricorn", house: 10, rx: false, combust: false, cazimi: false, eclipticLon: 278.97553506804593, raw: "", kind: "transit" as const },
      Jupiter: { planet: "Jupiter", degree: 1.12543356518631, sign: "Cancer", house: 4, rx: true, combust: false, cazimi: false, eclipticLon: 91.12543356518631, raw: "", kind: "transit" as const },
      Rahu: { planet: "Rahu", degree: 16.28766501154996, sign: "Aquarius", house: 11, rx: true, combust: false, cazimi: false, eclipticLon: 316.28766501154996, raw: "", kind: "transit" as const },
      Ketu: { planet: "Ketu", degree: 16.28766501154996, sign: "Leo", house: 5, rx: true, combust: false, cazimi: false, eclipticLon: 136.28766501154996, raw: "", kind: "transit" as const },
    };

    const normalized = assignEqualHousesToChart(wholeSignLabeledChart, ascendant);
    const chartData = buildChartData(wholeSignLabeledChart, ascendant);

    expect(normalized.Moon.house).toBe(5);
    expect(normalized.Mars.house).toBe(9);
    expect(normalized.Jupiter.house).toBe(3);
    expect(normalized.Rahu.house).toBe(10);
    expect(normalized.Ketu.house).toBe(4);
    expect(wholeSignLabeledChart.Mars.house).toBe(10);

    expect(chartData.planetsInHouses).toEqual(expect.arrayContaining([
      expect.objectContaining({ planet: "Moon", house: 5 }),
      expect.objectContaining({ planet: "Mars", house: 9 }),
      expect.objectContaining({ planet: "Jupiter", house: 3 }),
      expect.objectContaining({ planet: "Rahu", house: 10 }),
      expect.objectContaining({ planet: "Ketu", house: 4 }),
    ]));
  });
});
