import { describe, expect, it } from "vitest";
import { summarizeMarketUnderdogBaseline, summarizeNoCallBacktest } from "./sportsBacktestMetrics";

describe("no-call backtest metrics", () => {
  it("keeps no-call and directional underdog rates separate", () => {
    const summary = summarizeNoCallBacktest([
      { outcome: "no-call", underdogWon: true },
      { outcome: "no-call", underdogWon: false },
      { outcome: "side-a-context", underdogWon: true },
      { outcome: "side-b-context", underdogWon: false },
    ]);

    expect(summary).toMatchObject({ eligibleGames: 4, noCallGames: 2, directionalGames: 2 });
    expect(summary.overallUnderdog.rate).toBe(0.5);
    expect(summary.noCallUnderdog.rate).toBe(0.5);
    expect(summary.directionalUnderdog.rate).toBe(0.5);
    expect(summary.noCallUnderdog.wilson95?.lower).toBeGreaterThanOrEqual(0);
    expect(summary.noCallUnderdog.wilson95?.upper).toBeLessThanOrEqual(1);
  });

  it("returns no rate for an empty eligible cohort instead of inventing a baseline", () => {
    const summary = summarizeNoCallBacktest([]);
    expect(summary.noCallUnderdog).toEqual({ wins: 0, games: 0, rate: null, wilson95: null });
  });

  it("normalizes two-sided decimal prices before describing the market underdog baseline", () => {
    const baseline = summarizeMarketUnderdogBaseline([
      { favoriteDecimalOdds: 1.5, underdogDecimalOdds: 2.5 },
    ]);
    expect(baseline.games).toBe(1);
    expect(baseline.meanNoVigUnderdogProbability).toBeCloseTo(0.375, 8);
    expect(baseline.expectedUnderdogWins).toBeCloseTo(0.375, 8);
  });
});
