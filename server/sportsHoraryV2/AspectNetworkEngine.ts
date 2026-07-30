import { SportsHoraryChartV2, EngineLayerOutput } from "./types";

export class AspectNetworkEngine {
  constructor(private chart: SportsHoraryChartV2) {}

  evaluate(): EngineLayerOutput {
    return {
      score: 0,
      confidence: 0,
      explanation: "AspectNetworkEngine stub — TODO: implement with aspectBetween() from sportsHorary.ts",
      factors: ["Aspect network analysis not yet implemented"],
    };
  }
}
