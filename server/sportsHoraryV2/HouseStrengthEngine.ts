import {
  SportsHoraryChartV2,
  HouseStrengthResult,
  PlanetPlacement,
  MALEFICS,
  BENEFICS,
} from "./types";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export class HouseStrengthEngine {
  constructor(private chart: SportsHoraryChartV2) {}

  private scoreCluster(houses: number[], factors: string[], label: string): number {
    const occupants: PlanetPlacement[] = this.chart.planets.filter(
      (p) => houses.includes(p.house)
    );

    let score = 0;

    const planetList = occupants.map((p) => `${p.planet}(H${p.house})`).join(", ");
    const planetBonus = clamp(occupants.length * 2, 0, 6);
    if (planetBonus > 0) {
      score += planetBonus;
      factors.push(`+${planetBonus} ${label} planets: ${planetList}`);
    }

    const benefics = occupants.filter((p) => BENEFICS.includes(p.planet));
    const beneficBonus = clamp(benefics.length * 3, 0, 9);
    if (beneficBonus > 0) {
      score += beneficBonus;
      const beneficList = benefics.map((p) => `${p.planet}(H${p.house})`).join(", ");
      factors.push(`+${beneficBonus} ${label} benefics: ${beneficList}`);
    }

    const malefics = occupants.filter((p) => MALEFICS.includes(p.planet));
    const maleficPenalty = clamp(malefics.length * 2, 0, 6);
    if (maleficPenalty > 0) {
      score -= maleficPenalty;
      const maleficList = malefics.map((p) => `${p.planet}(H${p.house})`).join(", ");
      factors.push(`-${maleficPenalty} ${label} malefics: ${maleficList}`);
    }

    let dignityTotal = 0;
    const dignityBreakdown: string[] = [];
    for (const p of occupants) {
      let dignityPts = 0;
      if (p.dignity === "exalt") dignityPts = 3;
      else if (p.dignity === "own") dignityPts = 2;
      else if (p.dignity === "detriment") dignityPts = -3;
      else if (p.dignity === "fall") dignityPts = -4;

      if (dignityPts !== 0) {
        dignityTotal += dignityPts;
        dignityBreakdown.push(`${p.planet}(${p.sign}/${p.dignity}:${dignityPts > 0 ? "+" : ""}${dignityPts})`);
      }
    }
    dignityTotal = clamp(dignityTotal, -9, 9);
    if (dignityTotal !== 0) {
      score += dignityTotal;
      factors.push(`${dignityTotal > 0 ? "+" : ""}${dignityTotal} ${label} dignities: ${dignityBreakdown.join(", ")}`);
    }

    const retrograde = occupants.filter((p) => p.retrograde);
    if (retrograde.length > 0) {
      score -= retrograde.length;
      const retroList = retrograde.map((p) => `${p.planet}(H${p.house})`).join(", ");
      factors.push(`-${retrograde.length} ${label} retrograde: ${retroList}`);
    }

    const combust = occupants.filter((p) => p.combust);
    if (combust.length > 0) {
      const combustPenalty = combust.length * 2;
      score -= combustPenalty;
      const combustList = combust.map((p) => `${p.planet}(H${p.house})`).join(", ");
      factors.push(`-${combustPenalty} ${label} combust: ${combustList}`);
    }

    const royalStarHits = this.chart.fixedStarHits.filter(
      (h) =>
        occupants.some((p) => p.planet === h.conjunctPlanet) &&
        h.favorable &&
        (h.star === "Regulus" || h.star === "Spica" || h.star === "Aldebaran")
    );
    if (royalStarHits.length > 0) {
      const bonus = royalStarHits.length * 4;
      score += bonus;
      const starList = royalStarHits.map((h) => `${h.conjunctPlanet} conjunct ${h.star}`).join(", ");
      factors.push(`+${bonus} ${label} royal stars: ${starList}`);
    }

    return score;
  }

  evaluate(): HouseStrengthResult {
    const favoriteHouses = [1, 3, 6, 10, 11];
    const challengerHouses = [7, 9, 12, 4, 5];

    const h1Factors: string[] = [];
    const h7Factors: string[] = [];

    const h1Score = this.scoreCluster(favoriteHouses, h1Factors, "Favorite");
    const h7Score = this.scoreCluster(challengerHouses, h7Factors, "Challenger");
    const netScore = clamp(h1Score - h7Score, -30, 30);

    const factors = [...h1Factors, ...h7Factors];

    return {
      score: netScore,
      h1Score,
      h7Score,
      netScore,
      confidence: 90,
      explanation:
        factors.length > 0
          ? `Favorite cluster (${h1Score >= 0 ? "+" : ""}${h1Score}) vs Challenger cluster (${h7Score >= 0 ? "+" : ""}${h7Score})`
          : "No significant cluster factors found",
      factors,
    };
  }
}
