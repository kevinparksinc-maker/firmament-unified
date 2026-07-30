import { SportsHoraryChartV2, EngineLayerOutput } from "./types";

export class HouseThemeEngine {
  constructor(private chart: SportsHoraryChartV2) {}

  evaluate(): EngineLayerOutput {
    return {
      score: 0,
      confidence: 0,
      explanation: "HouseThemeEngine stub — TODO: implement dispositor scoring, angular house themes",
      factors: ["House theme analysis not yet implemented"],
    };
  }
}
