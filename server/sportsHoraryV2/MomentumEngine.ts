import { SportsHoraryChartV2, EngineLayerOutput } from "./types";

export class MomentumEngine {
  constructor(private chart: SportsHoraryChartV2) {}

  evaluate(): EngineLayerOutput {
    return {
      score: 0,
      confidence: 0,
      explanation: "MomentumEngine stub — TODO: implement applying vs separating, station proximity",
      factors: ["Momentum scoring not yet implemented"],
    };
  }
}
