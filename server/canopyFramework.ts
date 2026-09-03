import { bound360, calculateCanopyAscendant, wholeSignHouseForLongitude } from "./canopyFirmamentEngine";
import { ChartMode, createFrameContext, type TopocentricComparisonData } from "./canopyIntegration";
import { calculateCanopyLots, sectFromSunAltitude, type SectMode } from "./canopyLots";
import { buildCanopySportsAudit } from "./canopySportsEngine";
import { mansionForLongitude } from "./lunarMansion28";

export interface CanopyFrameworkInput {
  utcMs: number;
  latitudeDegrees: number;
  longitudeDegrees: number;
  sunLongitude: number;
  moonLongitude: number;
  jupiterLongitude: number;
  marsLongitude: number;
  saturnLongitude: number;
  sunAltitude?: number;
  sect?: SectMode;
  chartMode?: ChartMode;
  topocentricComparison?: TopocentricComparisonData;
}

export function calculateCanopyFramework(input: CanopyFrameworkInput) {
  const chartMode = input.chartMode ?? ChartMode.CANOPY_LOCAL;
  if (chartMode !== ChartMode.CANOPY_LOCAL) {
    throw new Error("calculateCanopyFramework requires ChartMode.CANOPY_LOCAL; use the existing standard topocentric path for STANDARD_TOPOCENTRIC.");
  }
  const frame = createFrameContext(chartMode, input.topocentricComparison, {
    latitudeDegrees: input.latitudeDegrees,
    longitudeDegrees: input.longitudeDegrees,
  });
  const ascendantAudit = calculateCanopyAscendant(input.utcMs, input.latitudeDegrees, input.longitudeDegrees);
  const sect = input.sect ?? (input.sunAltitude === undefined ? "day" : sectFromSunAltitude(input.sunAltitude));
  const lots = calculateCanopyLots({
    ascendant: ascendantAudit.trueAscendant,
    sun: bound360(input.sunLongitude),
    moon: bound360(input.moonLongitude),
    jupiter: bound360(input.jupiterLongitude),
    mars: bound360(input.marsLongitude),
    saturn: bound360(input.saturnLongitude),
    sect,
  });
  const lunarMansion = mansionForLongitude(input.moonLongitude);
  const sports = buildCanopySportsAudit(lots.lotOfVictory.longitude, lots.lotOfStrife.longitude, ascendantAudit.trueAscendant);
  return {
    frame,
    ascendant: ascendantAudit,
    planets: {
      sun: { longitude: bound360(input.sunLongitude), house: wholeSignHouseForLongitude(input.sunLongitude, ascendantAudit.trueAscendant) },
      moon: { longitude: bound360(input.moonLongitude), house: wholeSignHouseForLongitude(input.moonLongitude, ascendantAudit.trueAscendant) },
      jupiter: { longitude: bound360(input.jupiterLongitude), house: wholeSignHouseForLongitude(input.jupiterLongitude, ascendantAudit.trueAscendant) },
      mars: { longitude: bound360(input.marsLongitude), house: wholeSignHouseForLongitude(input.marsLongitude, ascendantAudit.trueAscendant) },
      saturn: { longitude: bound360(input.saturnLongitude), house: wholeSignHouseForLongitude(input.saturnLongitude, ascendantAudit.trueAscendant) },
    },
    lunarMansion,
    lots,
    sports,
    provenance: {
      chartMode,
      topocentricComparisonRetained: input.topocentricComparison !== undefined,
      rawEphemerisLongitudesUnchanged: true,
      canopyClockIsFrameOrientation: true,
      sportsLayersExcludedFromPersonalNatalInterpretation: true,
      alignmentCorrectionDegrees: ascendantAudit.alignmentCorrection,
    },
  };
}
