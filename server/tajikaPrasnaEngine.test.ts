import { describe, expect, it } from "vitest";
import { shortestArc } from "./eventChartService";
import { calculateTajikaPrasnaEvent } from "./tajikaPrasnaEngine";

const targetField = {
  local: { year: 2026, month: 6, day: 27, hour: 18, minute: 10 },
  utcDate: new Date("2026-06-27T23:10:00Z"),
  latitude: 44.982075,
  longitude: -93.278435,
  favoriteName: "Minnesota Twins",
  challengerName: "Colorado Rockies",
  favoriteSource: "Frozen contemporaneous moneyline source",
  venueName: "Target Field",
};

describe("tajika-prasna-v1", () => {
  it("returns a complete isolated event-chart evidence record", () => {
    const result = calculateTajikaPrasnaEvent(targetField);

    expect(result.version).toBe("tajika-prasna-v1");
    expect(result.event.houseSystem).toBe("Placidus");
    expect(result.event.eventUtcIso).toBe("2026-06-27T23:10:00.000Z");
    expect(result.cusps).toHaveLength(12);
    expect(result.planets.map(item => item.name)).toEqual(["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"]);
    expect(result.planets.every(item => item.house >= 1 && item.house <= 12)).toBe(true);
    expect(result.significators.map(item => item.role)).toEqual(["L1", "L10", "L7", "L4"]);
    expect(result.settings.perPlanetOrbs).toMatchObject({ Sun: 15, Moon: 12, Mars: 8, Mercury: 7, Jupiter: 9, Venus: 7, Saturn: 9 });
    expect(["side-a", "side-b", "no-call"]).toContain(result.outcome);
    expect("layerVotes" in result).toBe(false);
  });

  it("records only source-labeled separation, bridge, Kamboola, and war evidence", () => {
    const result = calculateTajikaPrasnaEvent(targetField);

    expect(result.separations.every(item => item.kind === "Eesaphala")).toBe(true);
    expect(result.bridges.every(item => item.kind === "Nakta" || item.kind === "Yamaya")).toBe(true);
    expect(result.kamboola.every(item => item.moonLink.kind !== "Eesaphala")).toBe(true);
    expect(result.grahaYuddha.every(item => item.separation <= 1)).toBe(true);
  });

  it("keeps team assignment constant while inverse rotates the chart separately", () => {
    const standard = calculateTajikaPrasnaEvent({ ...targetField, orientation: "standard" });
    const inverse = calculateTajikaPrasnaEvent({ ...targetField, orientation: "inverse-180" });

    expect(inverse.orientation).toBe("inverse-180");
    expect(shortestArc(standard.cusps[0]!.longitude, inverse.cusps[0]!.longitude)).toBeCloseTo(180, 4);
    expect(inverse.event.favoriteName).toBe(standard.event.favoriteName);
    expect(inverse.event.challengerName).toBe(standard.event.challengerName);
  });
});
