import { describe, expect, it } from "vitest";
import { buildRecoveredEvidenceFromEphemeris, buildRecoveredLayerEvidence, summarizeRecoveredLayerScores, type RecoveredPlanetInput } from "./recoveredLayerEvidence";

const basePlanets: RecoveredPlanetInput[] = [
  { planet: "Sun", longitude: 200, sign: "Libra", house: 1, sourceCoordinate: "topocentric apparent ecliptic longitude", calculationMode: "agent-view" },
  { planet: "Moon", longitude: 40, sign: "Taurus", house: 10, sourceCoordinate: "topocentric apparent ecliptic longitude", calculationMode: "agent-view" },
  { planet: "Mars", longitude: 100, sign: "Cancer", house: 3, sourceCoordinate: "topocentric apparent ecliptic longitude", calculationMode: "agent-view" },
  { planet: "Saturn", longitude: 108, sign: "Cancer", house: 7, rx: true, sourceCoordinate: "topocentric apparent ecliptic longitude", calculationMode: "agent-view" },
  { planet: "Rahu", longitude: 136, sign: "Leo", house: 11, sourceCoordinate: "topocentric apparent ecliptic longitude", calculationMode: "agent-view" },
  { planet: "Ketu", longitude: 316, sign: "Aquarius", house: 5, sourceCoordinate: "topocentric apparent ecliptic longitude", calculationMode: "agent-view" },
];

describe("recovered Sports Horary layer evidence", () => {
  it("returns the recovered layer registry in a stable order", () => {
    const result = buildRecoveredLayerEvidence({ planets: basePlanets, orientation: "standard" });
    expect(result.map((layer) => layer.name)).toEqual([
      "Fixed-star amplifications",
      "Retrograde condition",
      "Lunar flow",
      "Chart-wide aspects",
      "Moon phase / VOC",
      "Nodes (Rahu/Ketu)",
      "Upachaya growth",
      "Via Combusta",
      "Besiegement",
      "Mutual reception",
      "Translation of light",
      "Harmonious vs friction aspects",
    ]);
    expect(result.every((layer) => layer.version === "recovered-layer-evidence-v1")).toBe(true);
  });

  it("keeps candidate scores visible but disabled by default", () => {
    const result = buildRecoveredLayerEvidence({ planets: basePlanets, orientation: "standard" });
    const retrograde = result.find((layer) => layer.name === "Retrograde condition")!;
    expect(retrograde.candidateScoreB).toBe(-0.5);
    expect(retrograde.scoreA).toBe(0);
    expect(retrograde.scoreB).toBe(0);
    expect(retrograde.enabledForScoring).toBe(false);
  });

  it("exposes the recovered fixed-star hit and topocentric provenance", () => {
    const result = buildRecoveredLayerEvidence({ planets: basePlanets, orientation: "standard" });
    const stars = result.find((layer) => layer.name === "Fixed-star amplifications")!;
    expect(stars.detail).toContain("Regulus");
    expect(stars.inputs).toContain("Rahu:136°");
    expect(stars.source).toBe("recovered-archive-master");
  });

  it("preserves explicit limitations for VOC, translation, and aspect duplication", () => {
    const result = buildRecoveredLayerEvidence({ planets: basePlanets, orientation: "standard" });
    expect(result.find((layer) => layer.name === "Moon phase / VOC")!.limitation).toContain("VOC");
    expect(result.find((layer) => layer.name === "Translation of light")!.limitation).toContain("applying/separating");
    expect(result.find((layer) => layer.name === "Harmonious vs friction aspects")!.limitation).toContain("same cross-family aspects");
  });

  it("bridges live topocentric ephemeris values without rewriting them", () => {
    const result = buildRecoveredEvidenceFromEphemeris({
      planets: [{
        name: "Saturn",
        symbol: "♄",
        eclipticLon: 108.25,
        ra: 120,
        dec: 5,
        sign: "Cancer",
        degreeInSign: 18.25,
        minutes: 15,
        altitude: 24,
        azimuth: 140,
        retrograde: true,
        house: 7,
      }],
      houses: { cusps: Array.from({ length: 12 }, (_, index) => index * 30), ascendant: 0, mc: 90 },
      wholeSignHouses: [],
      observer: { latitude: 40, longitude: -75, altitude: 0 },
      date: new Date("2026-08-31T20:00:00Z"),
    }, "standard");
    const retrograde = result.find((layer) => layer.name === "Retrograde condition")!;
    expect(retrograde.inputs).toEqual(["Saturn:rx"]);
    expect(retrograde.detail).toContain("Saturn H7");
  });

  it("keeps recovered score totals opt-in and explicit", () => {
    const readOnly = buildRecoveredLayerEvidence({ planets: basePlanets, orientation: "standard" });
    expect(summarizeRecoveredLayerScores(readOnly)).toMatchObject({ enabled: false, scoreA: 0, scoreB: 0, contributingLayers: [] });

    const enabled = buildRecoveredLayerEvidence({ planets: basePlanets, orientation: "standard", enableScoring: true });
    const summary = summarizeRecoveredLayerScores(enabled);
    expect(summary.enabled).toBe(true);
    expect(summary.contributingLayers).toHaveLength(12);
    expect(summary.scoreA).not.toBe(0);
  });

  it("requires source-coordinate provenance for every input", () => {
    expect(() => buildRecoveredLayerEvidence({
      planets: [{ ...basePlanets[0]!, sourceCoordinate: "" }],
      orientation: "standard",
    })).toThrow("source-coordinate provenance");
  });
});
