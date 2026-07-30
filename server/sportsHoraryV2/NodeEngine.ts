import { SportsHoraryChartV2, EngineLayerOutput } from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export class NodeEngine {
  constructor(private chart: SportsHoraryChartV2) {}

  private dignityModifier(dignityLevel: "strong" | "weak" | "neutral"): number {
    if (dignityLevel === "strong") return 2;
    if (dignityLevel === "weak") return -2;
    return 0;
  }

  evaluate(): EngineLayerOutput {
    const factors: string[] = [];
    let score = 0;

    if (this.chart.rahuConjunctL1) {
      const mod = this.dignityModifier(
        this.chart.l1.dignity === "own" || this.chart.l1.dignity === "exalt"
          ? "strong"
          : this.chart.l1.dignity === "detriment" || this.chart.l1.dignity === "fall"
            ? "weak"
            : "neutral"
      );
      const baseScore = 5 + mod;
      score += baseScore;
      factors.push(`+${baseScore} Rahu conjunct L1${mod !== 0 ? ` (${mod > 0 ? "+" : ""}${mod} from L1 ${this.chart.l1.dignity})` : ""}`);
    }

    if (this.chart.rahuConjunctL7) {
      score -= 5;
      factors.push("-5 Rahu conjunct L7");
    }

    if (this.chart.ketuConjunctL1) {
      score -= 4;
      factors.push("-4 Ketu conjunct L1");
    }

    if (this.chart.ketuConjunctL7) {
      score += 4;
      factors.push("+4 Ketu conjunct L7");
    }

    if (this.chart.rahuHouse === 1) {
      score += 2;
      factors.push("+2 Rahu in H1");
    } else if (this.chart.rahuHouse === 7) {
      score -= 2;
      factors.push("-2 Rahu in H7");
    }

    if (this.chart.ketuHouse === 1) {
      score -= 2;
      factors.push("-2 Ketu in H1");
    } else if (this.chart.ketuHouse === 7) {
      score += 2;
      factors.push("+2 Ketu in H7");
    }

    score = clamp(score, -10, 10);

    return {
      score,
      confidence: 85,
      explanation: `Lunar nodes (Rahu/Ketu) ${factors.length ? "active" : "not prominent"}`,
      factors,
    };
  }
}
