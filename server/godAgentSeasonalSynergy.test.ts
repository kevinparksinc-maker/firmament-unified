import { describe, expect, it } from "vitest";
import { calculateGodAgentSeasonalSynergy } from "./godAgentSeasonalSynergy";

describe("God–Agent seasonal synergy", () => {
  it("cross-maps fixed God sectors with topocentric Ancient-Horizon Agent families", async () => {
    const result = await calculateGodAgentSeasonalSynergy({
      utcDate: new Date("1990-02-11T00:00:00.000Z"),
      latitude: 35.7056,
      longitude: 139.7519,
      altitude: 0,
      dayOfYear: 42,
      localModelAngleDegrees: 139.7519,
      observerDistanceFromPoleMiles: 4000,
    });

    expect(result.version).toBe("god-agent-seasonal-synergy-v1");
    expect(result.topocentricObserver).toEqual({
      latitude: 35.7056,
      longitude: 139.7519,
      altitude: 0,
    });
    expect(result.agentView.houseSystem).toBe("Ancient-Horizon Equal Houses");
    expect(result.agentView.rows).toHaveLength(7);
    expect(result.agentView.rows.every((row) => row.rule.includes("topocentric"))).toBe(true);
    expect(result.synthesis.sideASupport).toBeGreaterThanOrEqual(0);
    expect(result.synthesis.sideBSupport).toBeGreaterThanOrEqual(0);
    expect(result.synthesis.polarity).toMatch(/side-a|side-b|tie|no-call/);
  });

  it("does not silently treat neutral H2/H8 Agent houses as DSC family", async () => {
    const result = await calculateGodAgentSeasonalSynergy({
      utcDate: new Date("1990-02-11T00:00:00.000Z"),
      latitude: 35.7056,
      longitude: 139.7519,
      dayOfYear: 42,
      localModelAngleDegrees: 139.7519,
      observerDistanceFromPoleMiles: 4000,
    });

    expect(result.agentView.familyHouses.neutral).toEqual([2, 8]);
    expect(result.agentView.rows.filter((row) => row.agentHouse === 8).every((row) => row.agentFamily === "agent-neutral")).toBe(true);
  });

  it("exposes auditable major aspects without adding them to synthesis energy", async () => {
    const result = await calculateGodAgentSeasonalSynergy({
      utcDate: new Date("1990-02-11T00:00:00.000Z"),
      latitude: 35.7056,
      longitude: 139.7519,
      altitude: 0,
      dayOfYear: 42,
      localModelAngleDegrees: 139.7519,
      observerDistanceFromPoleMiles: 4000,
    });

    expect(result.aspects.length).toBeGreaterThan(0);
    expect(result.aspects.every((aspect) => aspect.scored === false)).toBe(true);
    expect(result.aspects.every((aspect) => aspect.separation >= 0 && aspect.separation <= 180)).toBe(true);
    expect(result.aspects.every((aspect) => aspect.orb >= 0)).toBe(true);
    expect(result.aspects).toEqual(expect.arrayContaining([
      expect.objectContaining({ first: "Moon", second: "Mars", type: "trine", exactAngle: 120 }),
      expect.objectContaining({ first: "Venus", second: "Saturn", type: "conjunction", exactAngle: 0 }),
    ]));
    expect(result.synthesis.sideANetEnergy).toBe(-1);
    expect(result.synthesis.sideBNetEnergy).toBe(-1);
  });

  it("returns all twelve house rows with visible occupants", async () => {
    const result = await calculateGodAgentSeasonalSynergy({
      utcDate: new Date("1990-02-11T00:00:00.000Z"),
      latitude: 35.7056,
      longitude: 139.7519,
      dayOfYear: 42,
      localModelAngleDegrees: 139.7519,
      observerDistanceFromPoleMiles: 4000,
    });

    expect(result.agentView.houses).toHaveLength(12);
    expect(result.agentView.houses[0]).toMatchObject({ house: 1, startSign: "Scorpio", family: "agent-asc-family" });
    expect(result.agentView.houses[2]?.planets.map((planet) => planet.planet)).toEqual(expect.arrayContaining(["Mercury", "Venus", "Mars", "Saturn"]));
    expect(result.agentView.houses[3]?.planets.map((planet) => planet.planet)).toEqual(expect.arrayContaining(["Sun"]));
    expect(result.agentView.houses[7]?.planets.map((planet) => planet.planet)).toEqual(["Jupiter"]);
  });
});
