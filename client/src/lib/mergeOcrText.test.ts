import { describe, it, expect } from "vitest";
import { mergeOcrText } from "./mergeOcrText";

describe("mergeOcrText", () => {
  it("appends new planets to empty existing text", () => {
    const result = mergeOcrText(
      "",
      "Sun: 4° Scorpio, 11th house\nMoon: 18° Gemini, 7th house"
    );
    expect(result).toBe(
      "Sun: 4° Scorpio, 11th house\nMoon: 18° Gemini, 7th house"
    );
  });

  it("appends new planets not already in existing text", () => {
    const existing = "Sun: 4° Scorpio, 11th house";
    const newText = "Moon: 18° Gemini, 7th house\nMercury: 12° Scorpio";
    const result = mergeOcrText(existing, newText);
    expect(result).toContain("Sun: 4° Scorpio");
    expect(result).toContain("Moon: 18° Gemini");
    expect(result).toContain("Mercury: 12° Scorpio");
  });

  it("deduplicates planets already present in existing text", () => {
    const existing = "Sun: 4° Scorpio, 11th house\nMoon: 18° Gemini, 7th house";
    const newText = "Sun: 5° Scorpio\nMercury: 12° Scorpio";
    const result = mergeOcrText(existing, newText);
    // Sun should NOT be duplicated
    const sunMatches = result.match(/Sun:/gi);
    expect(sunMatches).toHaveLength(1);
    // Mercury should be added
    expect(result).toContain("Mercury: 12° Scorpio");
  });

  it("deduplicates planets within newText itself", () => {
    const newText = "Sun: 4° Scorpio\nMoon: 18° Gemini\nSun: 5° Scorpio";
    const result = mergeOcrText("", newText);
    const sunMatches = result.match(/Sun:/gi);
    expect(sunMatches).toHaveLength(1);
  });

  it("handles Transit prefix deduplication", () => {
    const existing = "Transit Sun: 25° Pisces\nTransit Moon: 8° Cancer";
    const newText = "Transit Sun: 26° Pisces\nTransit Mercury: 14° Aries";
    const result = mergeOcrText(existing, newText);
    const sunMatches = result.match(/Transit Sun:/gi);
    expect(sunMatches).toHaveLength(1);
    expect(result).toContain("Transit Mercury: 14° Aries");
  });

  it("returns existing text unchanged when all new planets are duplicates", () => {
    const existing = "Sun: 4° Scorpio\nMoon: 18° Gemini";
    const newText = "Sun: 5° Scorpio\nMoon: 19° Gemini";
    const result = mergeOcrText(existing, newText);
    expect(result).toBe("Sun: 4° Scorpio\nMoon: 18° Gemini");
  });

  it("handles empty newText gracefully", () => {
    const existing = "Sun: 4° Scorpio";
    const result = mergeOcrText(existing, "");
    expect(result).toBe("Sun: 4° Scorpio");
  });
});
