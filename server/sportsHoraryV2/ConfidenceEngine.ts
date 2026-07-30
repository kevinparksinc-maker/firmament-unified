import { EngineResults, ConfidenceResult } from "./types";

export class ConfidenceEngine {
  evaluate(results: EngineResults): ConfidenceResult {
    const activeLayers = [
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
    ].filter((layer) => layer.confidence > 0);

    if (activeLayers.length === 0) {
      return {
        percentage: 50,
        agreement: "No active layers; confidence defaulted to 50%",
      };
    }

    const verdictSign = results.dominance.dominanceScore > 0 ? 1 : results.dominance.dominanceScore < 0 ? -1 : 0;
    const agreeing = activeLayers.filter(
      (layer) => (layer.score > 0 && verdictSign > 0) || (layer.score < 0 && verdictSign < 0) || (layer.score === 0)
    );

    const agreeRatio = agreeing.length / activeLayers.length;

    let basePercentage = 50;
    if (agreeRatio >= 0.95) {
      basePercentage = 95;
    } else if (agreeRatio >= 0.85) {
      basePercentage = 85;
    } else if (agreeRatio >= 0.75) {
      basePercentage = 75;
    } else {
      basePercentage = Math.round(agreeRatio * 90);
    }

    let finalPercentage = basePercentage;
    if (results.radicality.confidence === 50) {
      finalPercentage = Math.round(basePercentage * 0.8);
    }

    finalPercentage = Math.max(1, Math.min(99, finalPercentage));

    const agreement = `${agreeing.length}/${activeLayers.length} layers agree`;

    return {
      percentage: finalPercentage,
      agreement,
    };
  }
}
