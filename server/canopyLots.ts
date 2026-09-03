import { bound360 } from "./canopyFirmamentEngine";

export type SectMode = "day" | "night";

export interface CanopyLotInputs {
  ascendant: number;
  sun: number;
  moon: number;
  jupiter: number;
  mars: number;
  saturn: number;
  sect: SectMode;
}

export interface LotResult {
  longitude: number;
  formula: string;
}

export interface CanopyLotsResult {
  sect: SectMode;
  partOfFortune: LotResult;
  lotOfVictory: LotResult;
  lotOfStrife: LotResult;
  audit: {
    rawAscendant: number;
    rawSun: number;
    rawMoon: number;
    rawJupiter: number;
    rawMars: number;
    rawSaturn: number;
    partOfFortuneRule: string;
  };
}

export function sectFromSunAltitude(sunAltitude: number): SectMode {
  return sunAltitude >= 0 ? "day" : "night";
}

export function calculateCanopyLots(input: CanopyLotInputs): CanopyLotsResult {
  const { ascendant, sun, moon, jupiter, mars, saturn, sect } = input;
  const fortuneFormula = sect === "day" ? "Ascendant + Moon - Sun" : "Ascendant + Sun - Moon";
  const partOfFortune = sect === "day" ? bound360(ascendant + moon - sun) : bound360(ascendant + sun - moon);
  return {
    sect,
    partOfFortune: { longitude: partOfFortune, formula: fortuneFormula },
    lotOfVictory: { longitude: bound360(ascendant + jupiter - mars), formula: "Ascendant + Jupiter - Mars" },
    lotOfStrife: { longitude: bound360(ascendant + mars - saturn), formula: "Ascendant + Mars - Saturn" },
    audit: {
      rawAscendant: ascendant,
      rawSun: sun,
      rawMoon: moon,
      rawJupiter: jupiter,
      rawMars: mars,
      rawSaturn: saturn,
      partOfFortuneRule: fortuneFormula,
    },
  };
}
