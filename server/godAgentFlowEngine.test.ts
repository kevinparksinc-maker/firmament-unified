import { describe, expect, it } from "vitest";
import { calculateGodAgentFamilyFlow, calculateGodAxis } from "./godAgentFlowEngine";

const COLORADO_TWINS = {
  local: { year: 2026, month: 6, day: 27, hour: 18, minute: 10 },
  utcDate: new Date("2026-06-27T23:10:00.000Z"),
  latitude: 44.9817,
  longitude: -93.2778,
  venueName: "Target Field",
  favoriteName: "Minnesota Twins",
  challengerName: "Colorado Rockies",
  favoriteSource: "Frozen historical pregame record: Minnesota -172, Colorado +144.",
} as const;

describe("god-axis-v1", () => {
  it("uses only an exact UTC instant and records every traditional planet once", () => {
    const result = calculateGodAxis(COLORADO_TWINS.utcDate);

    expect(result.referenceFrame).toBe("Astronomy Engine geocentric equatorial EQJ/J2000");
    expect(result.points).toHaveLength(7);
    expect(result.counts.eligible).toBe(7);
    expect(result.counts.asc + result.counts.dsc + result.counts.quadrature + result.counts.boundary).toBe(7);
    expect(result.points.every(point => Number.isFinite(point.geocentricRaHours) && Number.isFinite(point.declination))).toBe(true);
    expect(result.points.every(point => point.sector === "god-asc" || point.sector === "god-dsc" || point.sector === "quadrature" || point.sector === "boundary")).toBe(true);
  });

  it("treats the inverse as an explicit mechanical complement of the fixed symmetric axis", () => {
    const standard = calculateGodAxis(COLORADO_TWINS.utcDate, "standard");
    const inverse = calculateGodAxis(COLORADO_TWINS.utcDate, "inverse-180");

    expect(inverse.counts.asc).toBe(standard.counts.dsc);
    expect(inverse.counts.dsc).toBe(standard.counts.asc);
    expect(inverse.counts.quadrature).toBe(standard.counts.quadrature);
    expect(inverse.counts.boundary).toBe(standard.counts.boundary);
    expect(inverse.points.every((point, index) => Math.abs(((point.orientedRaHours - standard.points[index]!.orientedRaHours + 24) % 24) - 12) < 0.000001)).toBe(true);
  });
});

describe("god-agent-family-flow-v1", () => {
  it("keeps the God calculation and Agent receiving field visible as separate values", () => {
    const result = calculateGodAgentFamilyFlow(COLORADO_TWINS);

    expect(result.godView.points).toHaveLength(7);
    expect(result.agentView.counts.eligible).toBe(7);
    expect(result.agentView.counts.asc + result.agentView.counts.dsc).toBe(7);
    expect(result.familyFlow.rows).toHaveLength(7);
    expect(Object.values(result.familyFlow.cells).reduce((total, count) => total + count, 0)).toBe(7);
    expect(result.familyFlow.rows.every(row => row.agentHouse >= 1 && row.agentHouse <= 12)).toBe(true);
    expect(result.familyFlow.rows.every(row => row.agentFamily === "agent-asc-family" || row.agentFamily === "agent-dsc-family")).toBe(true);
  });

  it("keeps the frozen Colorado–Twins record at a neutral no-call when God ties and Agent favors DSC", () => {
    const result = calculateGodAgentFamilyFlow(COLORADO_TWINS);

    expect(result.godView.polarity).toBe("tie");
    expect(result.agentView.polarity).toBe("dsc");
    expect(result.synthesis.state).toBe("neutral");
    expect(result.outcome).toBe("no-call");
    expect(result.verdict).toContain("NO CALL");
  });
});
