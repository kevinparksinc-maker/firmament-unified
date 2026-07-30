import { SportsHoraryChartV2, EngineLayerOutput } from "./types";

export class TeamAssignmentEngine {
  constructor(private chart: SportsHoraryChartV2) {}

  evaluate(): EngineLayerOutput {
    return {
      score: 0,
      confidence: 100,
      explanation: `Favorite (${this.chart.favoriteTeam}) assigned to H1, Challenger (${this.chart.challengerTeam}) to H7`,
      factors: [],
    };
  }
}
