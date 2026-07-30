import { EngineResults } from "./types";

export class ReportEngine {
  evaluate(results: EngineResults, chart: { favoriteTeam: string; challengerTeam: string }): string {
    const { prediction, confidence, dominance, radicality } = results;
    const lines: string[] = [];

    lines.push("═".repeat(80));
    lines.push("SPORTS HORARY PREDICTION REPORT — 16-LAYER ENGINE");
    lines.push("═".repeat(80));
    lines.push("");

    lines.push(`FAVORITE (Ascendant/H1):    ${chart.favoriteTeam}`);
    lines.push(`CHALLENGER (Descendant/H7): ${chart.challengerTeam}`);
    lines.push("");

    lines.push(`Radicality: ${radicality.explanation} (${radicality.confidence}% confidence)`);
    if (radicality.factors.length > 0) {
      radicality.factors.forEach((f) => lines.push(`  • ${f}`));
    }
    lines.push("");

    if (prediction.winner === "Cannot predict") {
      lines.push("VERDICT: Cannot predict (non-radical chart)");
      lines.push("");
      return lines.join("\n");
    }

    lines.push(`VERDICT: ${prediction.winner} favored`);
    lines.push(`Win Probability: ${prediction.winProbability}%`);
    lines.push(`Dominance Score: ${dominance.dominanceScore > 0 ? "+" : ""}${dominance.dominanceScore} (${dominance.classification})`);
    lines.push(`Confidence: ${confidence.percentage}% (${confidence.agreement})`);
    lines.push("");

    if (prediction.topStrengths.length > 0) {
      lines.push("Top Strengths Supporting Verdict:");
      prediction.topStrengths.forEach((s) => lines.push(`  ✓ ${s}`));
      lines.push("");
    }

    if (prediction.topWeaknesses.length > 0) {
      lines.push("Top Weaknesses Against Verdict:");
      prediction.topWeaknesses.forEach((w) => lines.push(`  ✗ ${w}`));
      lines.push("");
    }

    if (prediction.upsetWarning) {
      lines.push("⚠️  UPSET WARNING: Low confidence or narrow margin — expect surprises");
      lines.push("");
    }

    lines.push("─".repeat(80));
    lines.push("COMPLETE LAYER-BY-LAYER BREAKDOWN (ALL POINTS & FACTORS):");
    lines.push("─".repeat(80));
    lines.push("");

    const layerNames: Array<[string, { score: number; confidence: number; explanation: string; factors: string[] }]> = [
      ["Radicality", results.radicality],
      ["Team Assignment", results.teamAssignment],
      ["House Strength", results.houseStrength],
      ["Lord Battle", results.lordBattle],
      ["Lunar", results.lunar],
      ["Nodes", results.nodes],
      ["Fixed Stars", results.fixedStars],
      ["Aspect Network", results.aspectNetwork],
      ["Essential Dignity", results.essentialDignity],
      ["Accidental Dignity", results.accidentalDignity],
      ["House Themes", results.houseThemes],
      ["Momentum", results.momentum],
    ];

    for (const [name, layer] of layerNames) {
      const scoreStr = layer.score > 0 ? `+${layer.score}` : `${layer.score}`;
      const statusIcon = layer.confidence === 0 ? "◌" : layer.confidence >= 80 ? "●" : "◐";

      lines.push(`${statusIcon} ${name.padEnd(22)} Score: ${scoreStr.padStart(4)}  |  Confidence: ${layer.confidence}%`);
      lines.push(`  Explanation: ${layer.explanation}`);

      if (name === "House Strength" && "h1Score" in layer) {
        lines.push(`  ┌─ Favorite (${chart.favoriteTeam.padEnd(12)}) cluster score: ${layer.h1Score >= 0 ? "+" : ""}${layer.h1Score}`);
        lines.push(`  └─ Challenger (${chart.challengerTeam.padEnd(10)}) cluster score: ${layer.h7Score >= 0 ? "+" : ""}${layer.h7Score}`);
      }

      if (layer.factors.length > 0) {
        lines.push(`  All Factors (${layer.factors.length} total):`);
        layer.factors.forEach((f: string) => {
          const match = f.match(/^([+-])(\d+)\s+(.+)$/);
          if (match) {
            const sign = match[1];
            const points = match[2];
            const desc = match[3];
            const indicator = sign === "+" ? "↑" : "↓";
            lines.push(`    ${indicator} [${sign}${points.padStart(2)}pts] ${desc}`);
          } else {
            lines.push(`    • ${f}`);
          }
        });
      } else if (layer.confidence > 0) {
        lines.push(`  (No factors to report)`);
      }
      lines.push("");
    }

    lines.push("═".repeat(80));
    lines.push("LEGEND:");
    lines.push("  ↑ = positive contribution");
    lines.push("  ↓ = negative contribution");
    lines.push("═".repeat(80));

    return lines.join("\n");
  }
}
