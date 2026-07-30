// types.ts — Shared interfaces for Sports Horary Engine V2.0

// ---------------------------------------------------------------------------
// TODO: Replace this with an import from your existing chart-building code,
// e.g.:
//   import { SportsHoraryChart as SportsHoraryChartV2 } from "../sportsHorary";
// Below is a minimal shape covering everything referenced in this spec so the
// engine compiles standalone. Merge in any fields your real chart has that
// aren't listed here (aspects list, planet degrees, house cusps, etc).
// ---------------------------------------------------------------------------

export type PlanetName =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars"
  | "Jupiter" | "Saturn" | "Rahu" | "Ketu";

export interface LordFacts {
  planet: PlanetName;
  sign: string;
  degree: number;
  house: number;
  dignity: "exalt" | "own" | "detriment" | "fall" | "peregrine";
  retrograde: boolean;
  combust: boolean;
  cazimi: boolean;
}

export interface PlanetPlacement {
  planet: PlanetName;
  house: number;
  sign: string;
  degree: number;
  dignity: LordFacts["dignity"];
  retrograde: boolean;
  combust: boolean;
}

export interface SportsHoraryChartV2 {
  l1: LordFacts;
  l7: LordFacts;
  voidOfCourseMoon: boolean;
  moon: {
    house: number;
    phase: "waxing" | "waning";
    applyingTo: PlanetName | null;
    lastAspectTo: PlanetName | null;
  };
  ascendantDegree: number;
  planets: PlanetPlacement[]; // all placements, used by house/aspect scans
  rahuHouse: number;
  ketuHouse: number;
  rahuConjunctL1: boolean;
  rahuConjunctL7: boolean;
  ketuConjunctL1: boolean;
  ketuConjunctL7: boolean;
  fixedStarHits: Array<{
    star: "Regulus" | "Spica" | "Algol" | "Aldebaran" | "Sirius" | "Other";
    conjunctPlanet: PlanetName;
    orb: number;
    favorable: boolean;
  }>;
  chartRulerIdentifiable: boolean;
  favoriteTeam: string;
  challengerTeam: string;
}

// ---------------------------------------------------------------------------
// Engine output contract — every layer returns this shape
// ---------------------------------------------------------------------------

export interface EngineLayerOutput {
  score: number; // whole numbers only
  confidence: number; // 0-100
  explanation: string;
  factors: string[];
}

export interface HouseStrengthResult extends EngineLayerOutput {
  h1Score: number;
  h7Score: number;
  netScore: number; // h1 - h7
}

export interface DominanceResult {
  h1Strength: number;
  h7Strength: number;
  dominanceScore: number;
  classification: "toss-up" | "slight" | "strong" | "heavy" | "blowout";
}

export interface ConfidenceResult {
  percentage: number;
  agreement: string;
}

export interface PredictionResult {
  winner: "Favorite" | "Challenger" | "Even" | "Cannot predict";
  winProbability: number;
  topStrengths: string[];
  topWeaknesses: string[];
  upsetWarning: boolean;
}

export interface EngineResults {
  radicality: EngineLayerOutput;
  teamAssignment: EngineLayerOutput;
  houseStrength: HouseStrengthResult;
  lordBattle: EngineLayerOutput;
  lunar: EngineLayerOutput;
  nodes: EngineLayerOutput;
  fixedStars: EngineLayerOutput;
  aspectNetwork: EngineLayerOutput;
  essentialDignity: EngineLayerOutput;
  accidentalDignity: EngineLayerOutput;
  houseThemes: EngineLayerOutput;
  momentum: EngineLayerOutput;
  dominance: DominanceResult;
  confidence: ConfidenceResult;
  prediction: PredictionResult;
}

export const LAYER_WEIGHTS = {
  houseStrength: 30,
  lordBattle: 25,
  lunar: 10,
  nodes: 10,
  aspectNetwork: 10,
  fixedStars: 5,
  momentum: 5,
  special: 5,
  // totalMax: 100
} as const;

export const MALEFICS: PlanetName[] = ["Mars", "Saturn", "Rahu", "Ketu"];
export const BENEFICS: PlanetName[] = ["Venus", "Jupiter"];
