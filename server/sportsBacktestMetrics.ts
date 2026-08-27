export type BacktestRecord = {
  outcome: "side-a-context" | "side-b-context" | "no-call";
  underdogWon: boolean;
};

export type Proportion = {
  wins: number;
  games: number;
  rate: number | null;
  wilson95: { lower: number; upper: number } | null;
};

export type NoCallBacktestSummary = {
  eligibleGames: number;
  noCallGames: number;
  directionalGames: number;
  overallUnderdog: Proportion;
  noCallUnderdog: Proportion;
  directionalUnderdog: Proportion;
};

export type TwoWayMarketRecord = {
  favoriteDecimalOdds: number;
  underdogDecimalOdds: number;
};

export type MarketUnderdogBaseline = {
  games: number;
  meanNoVigUnderdogProbability: number | null;
  expectedUnderdogWins: number | null;
};

function wilson95(wins: number, games: number): { lower: number; upper: number } | null {
  if (games === 0) return null;
  const z = 1.96;
  const p = wins / games;
  const denominator = 1 + z ** 2 / games;
  const center = (p + z ** 2 / (2 * games)) / denominator;
  const halfWidth = z * Math.sqrt((p * (1 - p) + z ** 2 / (4 * games)) / games) / denominator;
  return { lower: Math.max(0, center - halfWidth), upper: Math.min(1, center + halfWidth) };
}

function proportion(records: readonly BacktestRecord[]): Proportion {
  const wins = records.filter(record => record.underdogWon).length;
  return {
    wins,
    games: records.length,
    rate: records.length === 0 ? null : wins / records.length,
    wilson95: wilson95(wins, records.length),
  };
}

export function summarizeNoCallBacktest(records: readonly BacktestRecord[]): NoCallBacktestSummary {
  const noCalls = records.filter(record => record.outcome === "no-call");
  const directional = records.filter(record => record.outcome !== "no-call");
  return {
    eligibleGames: records.length,
    noCallGames: noCalls.length,
    directionalGames: directional.length,
    overallUnderdog: proportion(records),
    noCallUnderdog: proportion(noCalls),
    directionalUnderdog: proportion(directional),
  };
}

/**
 * Normalizes a two-outcome decimal-odds market to remove the quoted overround.
 * It is a descriptive market baseline only, not a price, edge, or wagering instruction.
 */
export function summarizeMarketUnderdogBaseline(records: readonly TwoWayMarketRecord[]): MarketUnderdogBaseline {
  if (records.length === 0) {
    return { games: 0, meanNoVigUnderdogProbability: null, expectedUnderdogWins: null };
  }

  const probabilities = records.map(record => {
    if (!Number.isFinite(record.favoriteDecimalOdds) || !Number.isFinite(record.underdogDecimalOdds)
      || record.favoriteDecimalOdds <= 1 || record.underdogDecimalOdds <= 1) {
      throw new Error("Two-way market records require finite decimal odds greater than 1.");
    }
    const favoriteImplied = 1 / record.favoriteDecimalOdds;
    const underdogImplied = 1 / record.underdogDecimalOdds;
    return underdogImplied / (favoriteImplied + underdogImplied);
  });

  const expectedUnderdogWins = probabilities.reduce((total, probability) => total + probability, 0);
  return {
    games: records.length,
    meanNoVigUnderdogProbability: expectedUnderdogWins / records.length,
    expectedUnderdogWins,
  };
}
