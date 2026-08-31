import { describe, expect, it } from "vitest";
import { getNakshatraDetails } from "./summarizePillarRich";

describe("chart transparency data", () => {
  it("returns a named mansion, ruler, and pada for raw longitude", () => {
    const details = getNakshatraDetails(238);
    expect(details).toMatchObject({ name: "Jyeshtha", ruler: "Mercury", pada: 4 });
    expect(details?.archetype).toBe("The Elder");
    expect(details?.shakti).toContain("authority");
  });

  it("normalizes wrapped longitudes and protects missing values", () => {
    expect(getNakshatraDetails(360)?.name).toBe("Ashwini");
    expect(getNakshatraDetails(-1)?.name).toBe("Revati");
    expect(getNakshatraDetails(null)).toBeNull();
    expect(getNakshatraDetails(Number.NaN)).toBeNull();
  });
});
