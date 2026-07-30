import { SportsHoraryChartV2, EngineLayerOutput } from "./types";

export class RadicalityEngine {
  constructor(private chart: SportsHoraryChartV2) {}

  evaluate(): EngineLayerOutput {
    const factors: string[] = [];
    let flags = 0;

    const earlyAsc = this.chart.ascendantDegree <= 5;
    const lateAsc = this.chart.ascendantDegree >= 25;
    if (earlyAsc) { factors.push("Early Asc (0-5°)"); flags++; }
    if (lateAsc) { factors.push("Late Asc (25-30°)"); flags++; }

    if (this.chart.voidOfCourseMoon) {
      factors.push("VOC Moon present");
      flags++;
    }

    const moonMakingFurtherAspects = this.chart.moon.applyingTo !== null;
    if (!moonMakingFurtherAspects) {
      factors.push("Moon makes no further aspects");
      flags++;
    }

    if (!this.chart.chartRulerIdentifiable) {
      factors.push("Chart ruler not identifiable");
      flags++;
    }

    if (!this.chart.chartRulerIdentifiable || (lateAsc && flags >= 2)) {
      return {
        score: 0,
        confidence: 0,
        explanation: "Non-radical",
        factors,
      };
    }

    if ((earlyAsc || lateAsc) || this.chart.voidOfCourseMoon || !moonMakingFurtherAspects) {
      return {
        score: 0,
        confidence: 50,
        explanation: "Questionable",
        factors,
      };
    }

    return {
      score: 0,
      confidence: 100,
      explanation: "Chart is radical",
      factors: factors.length ? factors : ["No radicality concerns"],
    };
  }
}
