/**
 * houseScoringConstants.ts
 *
 * Centralized, tunable scoring values for the house-cluster
 * sports prediction engine. Adjust weights here without
 * touching the core evaluation logic in houseClusterEngine.ts.
 */

// ---------------------------------------------------------
// HOUSE CLUSTERS
// ---------------------------------------------------------

export const SIDE_A_HOUSES = [1, 3, 6, 10, 11] as const;
export const SIDE_B_HOUSES = [7, 9, 12, 4, 5] as const;

// ---------------------------------------------------------
// DIGNITY POINTS
// Based on condition of the house lord's placement by sign
// ---------------------------------------------------------

export const DIGNITY_POINTS = {
  EXALTED: 2,
  OWN_SIGN: 1,
  NEUTRAL: 0,
  DETRIMENT: -1,
  FALL: -2,
} as const;

// ---------------------------------------------------------
// CONDITION PENALTIES
// Applied independently of dignity (can stack)
// ---------------------------------------------------------

export const CONDITION_PENALTIES = {
  COMBUST: -1,
  RETROGRADE: -1,
  MALEFIC_ASPECT_GENERAL: -1,
} as const;

// Combustion orb thresholds (degrees from the Sun)
export const COMBUSTION_ORBS = {
  DEFAULT: 8,
  Mercury: 4,
  Venus: 5,
} as const;

// ---------------------------------------------------------
// PLACEMENT BONUSES
// Based on the house lord's current house placement type
// ---------------------------------------------------------

export const PLACEMENT_POINTS = {
  ANGULAR: 1,
  SUCCEDENT: 0,
  CADENT: -1,
} as const;

export const ANGULAR_HOUSES = [1, 4, 7, 10];
export const SUCCEDENT_HOUSES = [2, 5, 8, 11];
export const CADENT_HOUSES = [3, 6, 9, 12];

// ---------------------------------------------------------
// ASPECT POINTS
// Applied per aspect found to the house cusp or its lord
// ---------------------------------------------------------

export const ASPECT_POINTS = {
  CONJUNCTION_BENEFIC: 1,
  CONJUNCTION_MALEFIC: -1,
  TRINE_BENEFIC: 1,
  SEXTILE_BENEFIC: 1,
  SQUARE_MALEFIC: -1,
  OPPOSITION_MALEFIC: -1,
} as const;

export const BENEFIC_PLANETS = ["Jupiter", "Venus"];
export const MALEFIC_PLANETS = ["Mars", "Saturn"];

// Standard aspect orbs (degrees)
export const ASPECT_ORBS = {
  CONJUNCTION: 8,
  SEXTILE: 6,
  SQUARE: 8,
  TRINE: 8,
  OPPOSITION: 8,
} as const;

// ---------------------------------------------------------
// PREDICTION THRESHOLD
// ---------------------------------------------------------

export const TOO_CLOSE_TO_CALL_MARGIN = 2;

// ---------------------------------------------------------
// COMBINED EXPORT (convenience for engine imports)
// ---------------------------------------------------------

export const SCORING_CONFIG = {
  SIDE_A_HOUSES,
  SIDE_B_HOUSES,
  DIGNITY_POINTS,
  CONDITION_PENALTIES,
  COMBUSTION_ORBS,
  PLACEMENT_POINTS,
  ANGULAR_HOUSES,
  SUCCEDENT_HOUSES,
  CADENT_HOUSES,
  ASPECT_POINTS,
  BENEFIC_PLANETS,
  MALEFIC_PLANETS,
  ASPECT_ORBS,
  TOO_CLOSE_TO_CALL_MARGIN,
};
