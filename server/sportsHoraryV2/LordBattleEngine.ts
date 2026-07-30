import { SportsHoraryChartV2, EngineLayerOutput, LordFacts } from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export class LordBattleEngine {
  constructor(private chart: SportsHoraryChartV2) {}

  private scoreLord(lord: LordFacts, label: string, factors: string[]): number {
    let score = 0;

    let dignity = 0;
    if (lord.dignity === "exalt") dignity = 6;
    else if (lord.dignity === "own") dignity = 5;
    else if (lord.dignity === "detriment") dignity = -6;
    else if (lord.dignity === "fall") dignity = -4;
    dignity = clamp(dignity, -6, 6);
    if (dignity !== 0) {
      score += dignity;
      factors.push(`${dignity > 0 ? "+" : ""}${dignity} ${label} ${lord.dignity}`);
    }

    if (lord.house === 1 || lord.house === 10) {
      score += 3;
      factors.push(`+3 ${label} in H${lord.house}`);
    } else if (lord.house === 8 || lord.house === 12) {
      score -= 3;
      factors.push(`-3 ${label} in H${lord.house}`);
    }

    if (lord.cazimi) {
      score += 5;
      factors.push(`+5 ${label} cazimi`);
    } else if (lord.combust) {
      score -= 4;
      factors.push(`-4 ${label} combust`);
    }

    if (lord.retrograde) {
      score -= 2;
      factors.push(`-2 ${label} retrograde`);
    }

    // TODO: Planetary war (winner +3, loser -5) — requires degree-exact
    // conjunction comparison against contending planets; wire in once your
    // aspect/degree data is available on the chart object.

    // TODO: Benefic/malefic aspects to this lord (+2 each max +4 / -2 each max -4)
    // — requires an aspect list on the chart; stub until AspectNetworkEngine
    // (layer 8) is built out, then pull shared aspect data from there.

    return score;
  }

  evaluate(): EngineLayerOutput {
    const factors: string[] = [];
    const l1Score = this.scoreLord(this.chart.l1, "L1", factors);
    const l7Score = this.scoreLord(this.chart.l7, "L7", factors);
    const net = clamp(l1Score - l7Score, -25, 25);

    return {
      score: net,
      confidence: 85,
      explanation: `L1 (${l1Score >= 0 ? "+" : ""}${l1Score}) vs L7 (${l7Score >= 0 ? "+" : ""}${l7Score})`,
      factors,
    };
  }
}
