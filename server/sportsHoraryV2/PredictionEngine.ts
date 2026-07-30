import { EngineResults, PredictionResult } from "./types";

export class PredictionEngine {
  evaluate(results: EngineResults): PredictionResult {
    if (results.radicality.confidence === 0) {
      return {
        winner: "Cannot predict",
        winProbability: 0,
        topStrengths: [],
        topWeaknesses: [],
        upsetWarning: false,
      };
    }

    const { dominanceScore, classification } = results.dominance;
    const { percentage: confidencePercent } = results.confidence;

    let winner: PredictionResult["winner"];
    if (dominanceScore > 0) {
      winner = "Favorite";
    } else if (dominanceScore < 0) {
      winner = "Challenger";
    } else {
      winner = "Even";
    }

    // Probability: base confidence, but pull toward 50 if low confidence weakens the signal
    const dominanceInfluence = (Math.abs(dominanceScore) / 30) * 15;
    const confidenceWeight = confidencePercent / 100;
    const baseProb = confidencePercent + dominanceInfluence;
    let winProbability = 50 + (baseProb - 50) * confidenceWeight;
    winProbability = Math.max(1, Math.min(99, Math.round(winProbability)));

    const allLayers = [
      results.houseStrength,
      results.lordBattle,
      results.lunar,
      results.nodes,
      results.fixedStars,
      results.aspectNetwork,
      results.essentialDignity,
      results.accidentalDignity,
      results.houseThemes,
      results.momentum,
    ];

    const allFactors: Array<{ factor: string; score: number }> = [];
    for (const layer of allLayers) {
      for (const factor of layer.factors) {
        const match = factor.match(/^([+-])(\d+)\s+(.+)$/);
        if (match) {
          const sign = match[1] === "+" ? 1 : -1;
          const points = parseInt(match[2], 10);
          allFactors.push({
            factor: match[3],
            score: points * sign,
          });
        }
      }
    }

    allFactors.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));

    const topStrengths = allFactors
      .filter((f) => f.score > 0)
      .slice(0, 3)
      .map((f) => `+${f.score} ${f.factor}`);

    const topWeaknesses = allFactors
      .filter((f) => f.score < 0)
      .slice(0, 3)
      .map((f) => `-${Math.abs(f.score)} ${f.factor}`);

    const upsetWarning = confidencePercent < 60 || Math.abs(dominanceScore) < 6;

    return {
      winner,
      winProbability,
      topStrengths,
      topWeaknesses,
      upsetWarning,
    };
  }
}
