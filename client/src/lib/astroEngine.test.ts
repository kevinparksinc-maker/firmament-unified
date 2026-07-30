import { describe, it, expect } from "vitest";
import { parseInput, zodiacDegree } from "./astroEngine";

// Re-export the internal zodiacDegree for testing via the module
// (it's not exported, so we test it indirectly through parseInput)

describe("parseInput — degree formats", () => {
  it("parses whole-degree format: 'Sun: 3° Scorpio, 12th house'", () => {
    const { parsed } = parseInput("Sun: 3° Scorpio, 12th house", "natal");
    expect(parsed.Sun).toBeDefined();
    expect(parsed.Sun.sign).toBe("Scorpio");
    expect(parsed.Sun.degree).toBeCloseTo(3, 1);
    expect(parsed.Sun.house).toBe(12);
  });

  it("parses degree+minutes format: 'Moon: 18° 55' Gemini, 7th house'", () => {
    const { parsed } = parseInput("Moon: 18° 55' Gemini, 7th house", "natal");
    expect(parsed.Moon).toBeDefined();
    expect(parsed.Moon.sign).toBe("Gemini");
    expect(parsed.Moon.degree).toBeCloseTo(18 + 55 / 60, 2);
    expect(parsed.Moon.house).toBe(7);
  });

  it("parses retrograde planet: 'Mercury Rx: 18° 47' Libra, 11th house'", () => {
    const { parsed } = parseInput(
      "Mercury Rx: 18° 47' Libra, 11th house",
      "natal"
    );
    expect(parsed.Mercury).toBeDefined();
    expect(parsed.Mercury.rx).toBe(true);
    expect(parsed.Mercury.sign).toBe("Libra");
    expect(parsed.Mercury.degree).toBeCloseTo(18 + 47 / 60, 2);
  });

  it("parses transit format: 'Transit Saturn: 17° 30' Aquarius'", () => {
    const { parsed } = parseInput(
      "Transit Saturn: 17° 30' Aquarius",
      "transit"
    );
    expect(parsed.Saturn).toBeDefined();
    expect(parsed.Saturn.sign).toBe("Aquarius");
    expect(parsed.Saturn.degree).toBeCloseTo(17.5, 2);
    expect(parsed.Saturn.kind).toBe("transit");
  });

  it("parses Rahu/Ketu (North/South Node)", () => {
    const text =
      "Rahu: 25° 37' Pisces, 4th house\nKetu: 25° 37' Virgo, 10th house";
    const { parsed } = parseInput(text, "natal");
    expect(parsed.Rahu).toBeDefined();
    expect(parsed.Rahu.sign).toBe("Pisces");
    expect(parsed.Ketu).toBeDefined();
    expect(parsed.Ketu.sign).toBe("Virgo");
  });

  it("maps 'North Node' to Rahu and 'South Node' to Ketu", () => {
    const text =
      "North Node: 25° 37' Pisces, 4th house\nSouth Node: 25° 37' Virgo, 10th house";
    const { parsed } = parseInput(text, "natal");
    expect(parsed.Rahu).toBeDefined();
    expect(parsed.Rahu.sign).toBe("Pisces");
    expect(parsed.Ketu).toBeDefined();
    expect(parsed.Ketu.sign).toBe("Virgo");
  });

  it("parses multiple planets from a block of text", () => {
    const text = `Sun: 3° Scorpio, 12th house
Moon: 18° 55' Gemini, 7th house
Mercury Rx: 18° 47' Libra, 11th house
Venus Rx: 10° 56' Libra, 11th house
Mars: 1° 46' Aquarius, 3rd house
Jupiter: 18° 39' Aquarius, 3rd house
Saturn: 15° 58' Scorpio, 12th house
Rahu: 25° 37' Pisces, 4th house
Ketu: 25° 37' Virgo, 10th house
Asc: 12° 47' Sagittarius, 1st house`;
    const { parsed } = parseInput(text, "natal");
    expect(Object.keys(parsed).length).toBeGreaterThanOrEqual(9);
    expect(parsed.Sun.sign).toBe("Scorpio");
    expect(parsed.Asc.sign).toBe("Sagittarius");
  });
});
