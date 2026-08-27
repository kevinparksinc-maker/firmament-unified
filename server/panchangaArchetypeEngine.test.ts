import { describe, expect, it } from "vitest";
import { calculatePanchangaArchetype, type PanchangaArchetypeRequest, type TeamArchetypeProfile } from "./panchangaArchetypeEngine";

const favoriteProfile: TeamArchetypeProfile = {
  teamName: "Minnesota Twins",
  primaryArchetype: "warrior",
  studyWindow: "2026 regular season through June 26, before the frozen event.",
  evidenceNote: "Example only: documented pregame study describes an overall physical, pressure-oriented style over the stated study window.",
  sources: ["https://example.test/minnesota-pregame-profile"],
  effectiveDate: "2026-03-01",
  validThroughDate: "2026-10-01",
};

const challengerProfile: TeamArchetypeProfile = {
  teamName: "Colorado Rockies",
  primaryArchetype: "laborer",
  studyWindow: "2026 regular season through June 26, before the frozen event.",
  evidenceNote: "Example only: documented pregame study describes an overall resilient, defensive, grind-oriented style over the stated study window.",
  sources: ["https://example.test/colorado-pregame-profile"],
  effectiveDate: "2026-03-01",
  validThroughDate: "2026-10-01",
};

function request(overrides: Partial<PanchangaArchetypeRequest> = {}): PanchangaArchetypeRequest {
  return {
    local: { year: 2026, month: 6, day: 27, hour: 18, minute: 10 },
    utcDate: new Date("2026-06-27T23:10:00.000Z"),
    latitude: 44.982075,
    longitude: -93.278435,
    timezone: "America/Chicago",
    venueName: "Target Field",
    favoriteName: "Minnesota Twins",
    challengerName: "Colorado Rockies",
    favoriteSource: "Frozen pregame source for test only.",
    sideAProfile: favoriteProfile,
    sideBProfile: challengerProfile,
    ...overrides,
  };
}

describe("panchanga-archetype-v1", () => {
  it("calculates a real tropical Panchanga record with sunrise-based Vara", () => {
    const result = calculatePanchangaArchetype(request());

    expect(result.version).toBe("panchanga-archetype-v1");
    expect(result.panchanga.coordinateConvention).toBe("tropical ecliptic-of-date");
    expect(result.panchanga.sunriseUtcIso).not.toBeNull();
    expect(result.panchanga.vara).toEqual({ day: "Saturday", ruler: "Saturn" });
    expect(result.panchanga.elongation).toBeGreaterThanOrEqual(0);
    expect(result.panchanga.elongation).toBeLessThan(360);
    expect(result.panchanga.tithi.number).toBeGreaterThanOrEqual(1);
    expect(result.panchanga.tithi.number).toBeLessThanOrEqual(30);
    expect(result.panchanga.nakshatra.status).toBe("calculated-tropical-not-scored");
    expect(result.panchanga.karana.name).toBeTruthy();
    expect(result.panchanga.yoga.name).toBeTruthy();
  });

  it("uses the frozen documented profiles and emits the transparent compatibility result", () => {
    const result = calculatePanchangaArchetype(request());

    expect(result.profiles[0]?.total).toBe(-5);
    expect(result.profiles[1]?.total).toBe(5);
    expect(result.scoreDifference).toBe(-10);
    expect(result.outcome).toBe("side-b");
    expect(result.verdict).toContain("Colorado Rockies");
  });

  it("refuses a stale or unsupported team profile instead of assigning a default archetype", () => {
    const stale = { ...challengerProfile, sources: [], validThroughDate: "2026-06-26" };
    const result = calculatePanchangaArchetype(request({ sideBProfile: stale }));

    expect(result.outcome).toBe("no-call");
    expect(result.status).toBe("no-call");
    expect(result.profiles[1]?.total).toBeNull();
    expect(result.noCallReasons.join(" ")).toContain("At least one profile source is required.");
    expect(result.noCallReasons.join(" ")).toContain("Profile is stale");
  });
});
