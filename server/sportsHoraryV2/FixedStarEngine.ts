import { SportsHoraryChartV2, EngineLayerOutput } from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

const STAR_POINTS = {
  Regulus: 6,
  Spica: 5,
  Algol: 5,
  Aldebaran: 4,
  Sirius: 3,
  Other: 2,
} as const;

export class FixedStarEngine {
  constructor(private chart: SportsHoraryChartV2) {}

  evaluate(): EngineLayerOutput {
    const factors: string[] = [];
    let score = 0;
    let forcesVerdict = false;

    for (const hit of this.chart.fixedStarHits) {
      const basePoints = STAR_POINTS[hit.star];
      const sign = hit.favorable ? 1 : -1;
      const pointValue = basePoints * sign;

      if (hit.conjunctPlanet === this.chart.l1.planet) {
        score += pointValue;
        if (hit.favorable) {
          factors.push(`+${basePoints} ${hit.star} on L1 (orb ${hit.orb}°)`);
        } else {
          factors.push(`-${basePoints} ${hit.star} on L1 (orb ${hit.orb}°)`);
        }
      } else if (hit.conjunctPlanet === this.chart.l7.planet) {
        score -= pointValue;
        if (hit.favorable) {
          factors.push(`-${basePoints} ${hit.star} on L7 (orb ${hit.orb}°)`);
        } else {
          factors.push(`+${basePoints} ${hit.star} on L7 (orb ${hit.orb}°)`);
        }
      }

      if (hit.star === "Regulus") {
        forcesVerdict = true;
      }
    }

    score = clamp(score, -5, 5);

    return {
      score,
      confidence: forcesVerdict ? 100 : 70,
      explanation: factors.length > 0 ? `Fixed star conjunctions: ${factors.join(", ")}` : "No fixed star hits",
      factors,
    };
  }
}
