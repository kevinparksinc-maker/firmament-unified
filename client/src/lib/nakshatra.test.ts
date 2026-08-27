import { describe, expect, it } from "vitest";
import { getNakshatraAt, NAKSHATRAS } from "./nakshatra";

describe("Atlas tropical 27-lunar-mansion lookup", () => {
  it("uses 27 fixed equal tropical divisions beginning at 0° Aries", () => {
    expect(NAKSHATRAS).toHaveLength(27);
    expect(NAKSHATRAS[0]).toMatchObject({ index: 1, name: "Ashwini", startAbs: 0, lord: "Ketu" });
    expect(NAKSHATRAS[26]?.endAbs).toBeCloseTo(360, 10);
  });

  it("moves to the next mansion and resets the pada exactly at the declared boundary", () => {
    const boundary = 360 / 27;
    expect(getNakshatraAt(boundary - 0.0001)).toMatchObject({ nakshatra: { name: "Ashwini", lord: "Ketu" }, pada: 4 });
    expect(getNakshatraAt(boundary)).toMatchObject({ nakshatra: { name: "Bharani", lord: "Venus" }, pada: 1 });
  });

  it("normalizes wrapped absolute longitudes without changing the lookup convention", () => {
    expect(getNakshatraAt(-0.001)).toMatchObject({ nakshatra: { name: "Revati", lord: "Mercury" }, pada: 4 });
    expect(getNakshatraAt(360)).toMatchObject({ nakshatra: { name: "Ashwini", lord: "Ketu" }, pada: 1 });
  });
});
