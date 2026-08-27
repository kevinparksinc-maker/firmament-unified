import { describe, expect, it } from "vitest";
import { calculatePlacidusEventChart, shortestArc } from "./eventChartService";
import { calculateFrawleyEvent } from "./frawleyEventEngine";

const targetField = {
  local: { year: 2026, month: 6, day: 27, hour: 18, minute: 10 },
  utcDate: new Date("2026-06-27T23:10:00Z"),
  latitude: 44.982075,
  longitude: -93.278435,
};

describe("frawley-event-v1", () => {
  it("casts a named Placidus event chart with twelve finite raw cusps", () => {
    const chart = calculatePlacidusEventChart(targetField);

    expect(chart.houseSystem).toBe("Placidus");
    expect(chart.eventUtcIso).toBe("2026-06-27T23:10:00.000Z");
    expect(chart.cusps).toHaveLength(12);
    expect(chart.cusps.every(Number.isFinite)).toBe(true);
    expect(chart.planets.map(planet => planet.name)).toEqual([
      "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
    ]);
  });

  it("returns the independent Frawley evidence trace without cluster fields", () => {
    const result = calculateFrawleyEvent({
      ...targetField,
      favoriteName: "Minnesota Twins",
      challengerName: "Colorado Rockies",
      favoriteSource: "Frozen contemporaneous moneyline source",
      venueName: "Target Field",
    });

    expect(result.version).toBe("frawley-event-v1");
    expect(result.event.houseSystem).toBe("Placidus");
    expect(result.planets).toHaveLength(7);
    expect(result.planets.map(item => item.name)).toEqual(["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"]);
    expect(result.planets.every(item => item.house >= 1 && item.house <= 12)).toBe(true);
    expect(result.significators.map(item => item.role)).toEqual(["L1", "L10", "L7", "L4"]);
    expect(result.angularEvidence).toHaveLength(16);
    expect(result.moon.startSign).toBeTruthy();
    expect(result.moon.candidates.every(candidate => candidate.minutesFromStart >= 0)).toBe(true);
    expect(["side-a", "side-b", "no-call"]).toContain(result.outcome);
    expect("layerVotes" in result).toBe(false);
  });

  it("keeps the inverse event chart separate and rotates its raw cusps", () => {
    const standard = calculateFrawleyEvent({
      ...targetField,
      favoriteName: "Minnesota Twins",
      challengerName: "Colorado Rockies",
      favoriteSource: "Frozen contemporaneous moneyline source",
      venueName: "Target Field",
      orientation: "standard",
    });
    const inverse = calculateFrawleyEvent({
      ...targetField,
      favoriteName: "Minnesota Twins",
      challengerName: "Colorado Rockies",
      favoriteSource: "Frozen contemporaneous moneyline source",
      venueName: "Target Field",
      orientation: "inverse-180",
    });

    expect(inverse.orientation).toBe("inverse-180");
    expect(shortestArc(standard.cusps[0]!.longitude, inverse.cusps[0]!.longitude)).toBeCloseTo(180, 4);
    expect(inverse.event.favoriteName).toBe("Minnesota Twins");
    expect(inverse.event.challengerName).toBe("Colorado Rockies");
  });
});
