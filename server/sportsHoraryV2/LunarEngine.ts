import { SportsHoraryChartV2, EngineLayerOutput } from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export class LunarEngine {
  constructor(private chart: SportsHoraryChartV2) {}

  evaluate(): EngineLayerOutput {
    const factors: string[] = [];
    let score = 0;

    const { house, phase, applyingTo, lastAspectTo } = this.chart.moon;

    if (house === 1) {
      score += 3;
      factors.push("+3 Moon in H1");
    } else if (house === 7) {
      score -= 3;
      factors.push("-3 Moon in H7");
    } else if (house >= 2 && house <= 6) {
      score += 1;
      factors.push(`+1 Moon in H${house}`);
    } else if (house >= 8 && house <= 12) {
      score -= 1;
      factors.push(`-1 Moon in H${house}`);
    }

    if (phase === "waxing") {
      score += 2;
      factors.push("+2 Waxing moon");
    } else if (phase === "waning") {
      score -= 2;
      factors.push("-2 Waning moon");
    }

    if (lastAspectTo) {
      if (lastAspectTo === this.chart.l1.planet) {
        score += 2;
        factors.push("+2 Last aspect to L1");
      } else if (lastAspectTo === this.chart.l7.planet) {
        score -= 2;
        factors.push("-2 Last aspect to L7");
      }
    }

    if (applyingTo) {
      if (applyingTo === this.chart.l1.planet) {
        score += 2;
        factors.push("+2 Applying to L1");
      } else if (applyingTo === this.chart.l7.planet) {
        score -= 2;
        factors.push("-2 Applying to L7");
      }
    }

    score = clamp(score, -10, 10);

    return {
      score,
      confidence: 80,
      explanation: `Lunar position (H${house}) & phase (${phase})`,
      factors,
    };
  }
}
