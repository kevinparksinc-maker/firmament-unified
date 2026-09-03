import { bound360, calculateCanopyAscendant, wholeSignHouseForLongitude } from "./canopyFirmamentEngine";
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
}

export function calculateCanopyFramework(input: CanopyFrameworkInput) {
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
    frame: "fixed-canopy-firmament",
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
      rawEphemerisLongitudesUnchanged: true,
      canopyClockIsFrameOrientation: true,
      sportsLayersExcludedFromPersonalNatalInterpretation: true,
      alignmentCorrectionDegrees: ascendantAudit.alignmentCorrection,
    },
  };
}
