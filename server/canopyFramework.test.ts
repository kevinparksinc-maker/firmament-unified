import { describe, expect, it } from "vitest";
import { calculateCanopyAscendant, calculateDueEastAscendant, calculateLocalCanopyPosition, wholeSignHouseForLongitude } from "./canopyFirmamentEngine";
import { calculateCanopyLots, sectFromSunAltitude } from "./canopyLots";
import { AWAY_TERRITORY_HOUSES, HOME_TERRITORY_HOUSES, evaluateStrifeLot, evaluateVictoryLot } from "./canopySportsEngine";
import { calculateCanopyFramework } from "./canopyFramework";
import { COMPLETE_28_MANSION_TABLE, mansionForLongitude } from "./lunarMansion28";

describe("confirmed canopy-firmament framework", () => {
  const dallasUtcMs = Date.parse("1986-11-20T16:06:00.000Z");
  const dallasLatitude = 32.7767;
  const dallasLongitude = -96.797;

  it("reproduces the locked Dallas 298 degree Ascendant through post-equation correction", () => {
    const audit = calculateCanopyAscendant(dallasUtcMs, dallasLatitude, dallasLongitude);
    expect(audit.localCanopyPosition).toBeCloseTo(283.619878, 5);
    expect(audit.rawGeometricAscendant).toBeCloseTo(191.593735, 5);
    expect(audit.trueAscendant).toBeCloseTo(298, 3);
    expect(audit.alignmentCorrection).toBe(106.406);
  });

  it("keeps the due-east equation separate from the linear alignment correction", () => {
    const localCanopyPosition = calculateLocalCanopyPosition(20.416878189193085, dallasLongitude);
    const raw = calculateDueEastAscendant(localCanopyPosition, dallasLatitude);
    expect(localCanopyPosition).toBeCloseTo(283.619878, 5);
    expect(raw).toBeCloseTo(191.593735, 5);
  });

  it("contains 28 contiguous stations with no placeholder fallback", () => {
    expect(COMPLETE_28_MANSION_TABLE).toHaveLength(28);
    expect(COMPLETE_28_MANSION_TABLE[0]?.startDegree).toBe(0);
    expect(COMPLETE_28_MANSION_TABLE[27]?.endDegree).toBe(360);
    expect(mansionForLongitude(0).transliterations[0]).toBe("Al-Sharatan");
    expect(mansionForLongitude(359.999).transliterations[0]).toBe("Al-Risha");
  });

  it("uses day and night sect branches for Part of Fortune", () => {
    const base = { ascendant: 298, sun: 237, moon: 110, jupiter: 341, mars: 340, saturn: 249 };
    const day = calculateCanopyLots({ ...base, sect: "day" });
    const night = calculateCanopyLots({ ...base, sect: "night" });
    expect(day.partOfFortune.longitude).toBe(171);
    expect(night.partOfFortune.longitude).toBe(65);
    expect(day.lotOfVictory.longitude).toBe(299);
    expect(day.lotOfStrife.longitude).toBe(29);
    expect(sectFromSunAltitude(1)).toBe("day");
    expect(sectFromSunAltitude(-1)).toBe("night");
  });

  it("reproduces the returned arbitrary-location Ascendant vectors", () => {
    const vectors = [
      { date: "2024-01-01T00:00:00Z", latitude: 51.5074, longitude: -0.1278, expected: 222.661314 },
      { date: "2024-06-15T12:00:00Z", latitude: 35.6762, longitude: 139.6503, expected: 314.082137 },
      { date: "2024-09-20T18:30:00Z", latitude: -33.8688, longitude: 151.2093, expected: 155.115896 },
    ];
    for (const vector of vectors) {
      const actual = calculateCanopyAscendant(Date.parse(vector.date), vector.latitude, vector.longitude).trueAscendant;
      expect(actual).toBeCloseTo(vector.expected, 5);
    }
  });

  it("orchestrates raw placements, mansion, Lots, and sports audit without changing inputs", () => {
    const result = calculateCanopyFramework({
      utcMs: dallasUtcMs,
      latitudeDegrees: dallasLatitude,
      longitudeDegrees: dallasLongitude,
      sunLongitude: 237,
      moonLongitude: 110,
      jupiterLongitude: 341,
      marsLongitude: 340,
      saturnLongitude: 249,
      sunAltitude: 35,
    });
    expect(result.ascendant.trueAscendant).toBeCloseTo(298, 3);
    expect(result.planets.sun.longitude).toBe(237);
    expect(result.lots.partOfFortune.formula).toBe("Ascendant + Moon - Sun");
    expect(result.lunarMansion.index).toBe(9);
    expect(result.sports.homeAssignment.house).toBe(1);
  });

  it("uses only the confirmed Home 1/2/11 and Away 7/8/9 territories", () => {
    expect(HOME_TERRITORY_HOUSES).toEqual([1, 2, 11]);
    expect(AWAY_TERRITORY_HOUSES).toEqual([7, 8, 9]);
    expect(wholeSignHouseForLongitude(10, 0)).toBe(1);
    expect(evaluateVictoryLot(10, 0)).toMatchObject({ territory: "home", homeBonus: 35, awayBonus: 0 });
    expect(evaluateVictoryLot(190, 0)).toMatchObject({ territory: "away", homeBonus: 0, awayBonus: 35 });
    expect(evaluateVictoryLot(70, 0)).toMatchObject({ territory: "neutral", homeBonus: 0, awayBonus: 0 });
    expect(evaluateStrifeLot(190, 0)).toMatchObject({ awayQuadrant: true, underdogVolatility: true, modifier: "underdog-aggression" });
  });
});
