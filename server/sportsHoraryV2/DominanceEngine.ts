import { EngineResults, DominanceResult } from "./types";

export class DominanceEngine {
  evaluate(results: EngineResults): DominanceResult {
    const activeScores = [
      results.houseStrength.score,
      results.lordBattle.score,
      results.lunar.score,
      results.nodes.score,
      results.fixedStars.score,
      results.aspectNetwork.score,
      results.essentialDignity.score,
      results.accidentalDignity.score,
      results.houseThemes.score,
      results.momentum.score,
    ];

    const h1Total = activeScores.filter((s) => s > 0).reduce((a, b) => a + b, 0);
    const h7Total = Math.abs(activeScores.filter((s) => s < 0).reduce((a, b) => a + b, 0));
    const dominanceScore = h1Total - h7Total;

    let classification: DominanceResult["classification"];
    const magnitude = Math.abs(dominanceScore);

    if (magnitude <= 5) {
      classification = "toss-up";
    } else if (magnitude <= 12) {
      classification = "slight";
    } else if (magnitude <= 20) {
      classification = "strong";
    } else if (magnitude <= 30) {
      classification = "heavy";
    } else {
      classification = "blowout";
    }

    return {
      h1Strength: h1Total,
      h7Strength: h7Total,
      dominanceScore,
      classification,
    };
  }
}
