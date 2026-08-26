import { describe, expect, it } from "vitest";
import { getAtlasDignity, getStrictCombustion, KAZIMI_THRESHOLD_DEGREES, STRICT_COMBUSTION_THRESHOLD_DEGREES } from "./atlasDignities";
import { calculateZeteticChart } from "./zeteticAtlas";

describe("Atlas dignities and strict combustion", () => {
  it("declares the four classical essential-dignity states and scopes outer planets honestly", () => {
    expect(getAtlasDignity("Jupiter", "Pisces")).toMatchObject({ status: "domicile", label: "Domicile" });
    expect(getAtlasDignity("Saturn", "Aries")).toMatchObject({ status: "fall", label: "Fall" });
    expect(getAtlasDignity("Mars", "Libra")).toMatchObject({ status: "detriment", label: "Detriment" });
    expect(getAtlasDignity("Venus", "Pisces")).toMatchObject({ status: "exaltation", label: "Exaltation" });
    expect(getAtlasDignity("Uranus", "Sagittarius")).toMatchObject({ status: "not-classically-assigned", scope: "no classical assignment" });
  });

  it("uses the selected strict 15° raw-longitude combustion rule", () => {
    const combustSaturn = getStrictCombustion("Saturn", 250.59, 238.044);
    expect(combustSaturn.angularDistance).toBeCloseTo(12.546, 3);
    expect(combustSaturn.threshold).toBe(STRICT_COMBUSTION_THRESHOLD_DEGREES);
    expect(combustSaturn.isCombust).toBe(true);
    expect(getStrictCombustion("Mars", 326.352, 238.044).isCombust).toBe(false);
    expect(getStrictCombustion("Sun", 238.044, 238.044)).toMatchObject({ applicable: false, isCombust: false, angularDistance: null });
  });

  it("gives the 0.5° kazimi state precedence over the 15° combustion state", () => {
    const kazimiMercury = getStrictCombustion("Mercury", 238.4, 238.044);
    expect(kazimiMercury.angularDistance).toBeCloseTo(0.356, 3);
    expect(kazimiMercury).toMatchObject({ isKazimi: true, isCombust: false, status: "kazimi" });
    expect(KAZIMI_THRESHOLD_DEGREES).toBe(0.5);
  });

  it("records the live Dallas Saturn combustion evidence on the calculated chart", () => {
    const chart = calculateZeteticChart({
      birthDate: "1986-11-20",
      birthTime: "10:06",
      timezone: "America/Chicago",
      location: "Dallas, Texas",
      latitude: 32.7767,
      longitude: -96.797,
    });
    const saturn = chart.points.find(point => point.key === "saturn");
    const jupiter = chart.points.find(point => point.key === "jupiter");

    expect(saturn?.dignity).toMatchObject({ status: "neutral", scope: "traditional seven planets" });
    expect(saturn?.combustion).toMatchObject({ applicable: true, isCombust: true, threshold: 15 });
    expect(saturn?.combustion.angularDistance).toBeCloseTo(12.55, 1);
    expect(jupiter?.dignity).toMatchObject({ status: "domicile", label: "Domicile" });
  });
});
