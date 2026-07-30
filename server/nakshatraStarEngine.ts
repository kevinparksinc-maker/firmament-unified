/**
 * NAKSHATRA & FIXED STAR ENGINE
 *
 * Integrates the 27 vedic lunar mansions and fixed stars into territorial scoring.
 *
 * Each nakshatra has:
 * - A ruling planet (lord) whose strength affects planets in that nakshatra
 * - An intrinsic dignity/weakness that modifies planetary strength
 * - Behavioral traits (Pace, Style, Temperament, execution traits)
 *
 * Fixed stars provide:
 * - Benefic or malefic nature amplification
 * - Conjunction bonuses/penalties
 * - Override effects for major stars (Regulus, Aldebaran, etc.)
 */

import { NAKSHATRAS } from "./nakshatraData";

// ─────────────────────────────────────────────────────────────────────────
// NAKSHATRA DIGNITY & LORDS
// ─────────────────────────────────────────────────────────────────────────

export interface NakshatraProfile {
  name: string;
  lord: string; // The planet that rules this nakshatra
  nakshatraDignity: number; // -2 to +2, inherent strength of the nakshatra itself
  traits: {
    pace: "Slow" | "Moderate" | "Fast";
    style: string;
    temperament: "Stoic" | "Emotional" | "Volatile";
    initiative: "Low" | "Medium" | "High" | "Excellent";
    pressureResponse: "Low" | "Medium" | "High" | "Excellent";
    consistency: "Low" | "Medium" | "High" | "Excellent";
    adaptability: "Low" | "Medium" | "High" | "Excellent";
    finishing: "Low" | "Medium" | "High" | "Excellent";
  };
}

export interface FixedStarData {
  name: string;
  longitude: number; // Ecliptic longitude
  nature: "benefic" | "malefic" | "neutral";
  magnitude: number; // 0-4, brighter stars are more powerful
  group: "royal" | "major" | "minor"; // Royal: Regulus, Aldebaran, Antares, Fomalhaut; Major: Sirius, Polaris, etc.
  keywords: string[];
}

// ─────────────────────────────────────────────────────────────────────────
// NAKSHATRA LORDS & DIGNITY
// ─────────────────────────────────────────────────────────────────────────

const NAKSHATRA_LORDS: Record<string, string> = {
  Ashwini: "Ketu",
  Bharani: "Venus",
  Krittika: "Sun",
  Rohini: "Moon",
  Mrigashira: "Mars",
  Ardra: "Rahu",
  Punarvasu: "Jupiter",
  Pushya: "Saturn",
  Ashlesha: "Mercury",
  Magha: "Ketu",
  "Purva Phalguni": "Venus",
  "Uttara Phalguni": "Sun",
  Hasta: "Moon",
  Chitra: "Mars",
  Swati: "Rahu",
  Vishakha: "Jupiter",
  Anuradha: "Saturn",
  Jyeshtha: "Mercury",
  Mula: "Ketu",
  "Purva Ashadha": "Venus",
  "Uttara Ashadha": "Sun",
  Shravana: "Moon",
  Dhanishta: "Mars",
  Shatabhisha: "Rahu",
  "Purva Bhadrapada": "Jupiter",
  "Uttara Bhadrapada": "Saturn",
  Revati: "Mercury",
};

// Nakshatra inherent dignity: how naturally strong or weak the nakshatra itself is
const NAKSHATRA_DIGNITY: Record<string, number> = {
  Ashwini: 1,
  Bharani: 0,
  Krittika: 1,
  Rohini: 2,
  Mrigashira: 0,
  Ardra: -1,
  Punarvasu: 1,
  Pushya: 2,
  Ashlesha: -1,
  Magha: 1,
  "Purva Phalguni": 1,
  "Uttara Phalguni": 1,
  Hasta: 0,
  Chitra: 1,
  Swati: 0,
  Vishakha: 1,
  Anuradha: 1,
  Jyeshtha: -1,
  Mula: -2,
  "Purva Ashadha": 1,
  "Uttara Ashadha": 1,
  Shravana: 1,
  Dhanishta: 1,
  Shatabhisha: -1,
  "Purva Bhadrapada": 0,
  "Uttara Bhadrapada": 2,
  Revati: 1,
};

/**
 * Get the ruling planet (lord) of a nakshatra
 */
export function getNakshatraLord(nakshatraName: string): string {
  return NAKSHATRA_LORDS[nakshatraName] || "Sun";
}

/**
 * Get the inherent dignity of a nakshatra (-2 to +2)
 */
export function getNakshatraDignity(nakshatraName: string): number {
  return NAKSHATRA_DIGNITY[nakshatraName] ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────
// MAJOR FIXED STARS & CONJUNCTIONS
// ─────────────────────────────────────────────────────────────────────────

const MAJOR_FIXED_STARS: FixedStarData[] = [
  // Royal Stars (the four Watchers)
  {
    name: "Regulus",
    longitude: 135.0,     // 15° Leo (fixed-dome anchor)
    nature: "benefic",
    magnitude: 1,
    group: "royal",
    keywords: ["royalty", "leadership", "success", "power"],
  },
  {
    name: "Aldebaran",
    longitude: 45.0,      // 15° Taurus (fixed-dome anchor)
    nature: "benefic",
    magnitude: 1,
    group: "royal",
    keywords: ["prosperity", "courage", "success"],
  },
  {
    name: "Antares",
    longitude: 225.0,     // 15° Scorpio (fixed-dome anchor)
    nature: "malefic",
    magnitude: 1,
    group: "royal",
    keywords: ["conflict", "struggle", "intensity"],
  },
  {
    name: "Fomalhaut",
    longitude: 315.0,     // 15° Aquarius (fixed-dome anchor)
    nature: "malefic",
    magnitude: 1,
    group: "royal",
    keywords: ["loss", "fame", "downfall"],
  },
  // Major Stars
  {
    name: "Sirius",
    longitude: 104.0,     // ~14° Gemini (in sidereal)
    nature: "benefic",
    magnitude: 2,
    group: "major",
    keywords: ["brilliance", "fame", "intensity"],
  },
  {
    name: "Polaris",
    longitude: 0.0,       // Pole star - static
    nature: "benefic",
    magnitude: 2,
    group: "major",
    keywords: ["stability", "protection", "north point"],
  },
  {
    name: "Spica",
    longitude: 173.833,   // 23°50' Virgo (HORARY_SCORING_RULES.md documented)
    nature: "benefic",
    magnitude: 2,
    group: "major",
    keywords: ["wisdom", "eloquence", "virtue"],
  },
  {
    name: "Arcturus",
    longitude: 164.183,   // 14°11' Virgo (HORARY_SCORING_RULES.md documented)
    nature: "benefic",
    magnitude: 2,
    group: "major",
    keywords: ["leadership", "achievement", "execution", "strategy"],
  },
  {
    name: "Denebola",
    longitude: 182.0,     // ~2° Virgo (in sidereal)
    nature: "malefic",
    magnitude: 3,
    group: "major",
    keywords: ["severance", "loss", "hardship"],
  },
  // Minor Stars
  {
    name: "Algol",
    longitude: 56.683,    // 26°41' Taurus (HORARY_SCORING_RULES.md documented)
    nature: "malefic",
    magnitude: 4,
    group: "minor",
    keywords: ["violence", "crisis", "decapitation"],
  },
  {
    name: "Bellatrix",
    longitude: 162.0,     // ~12° Leo (in sidereal)
    nature: "malefic",
    magnitude: 3,
    group: "minor",
    keywords: ["aggression", "combativeness"],
  },
];

/**
 * Find fixed star conjunctions within orb
 * @param longitude Ecliptic longitude to check
 * @param orb Orb in degrees (default 1°)
 * @returns Array of fixed stars within orb
 */
export function findFixedStarConjunctions(
  longitude: number,
  orb: number = 1
): FixedStarData[] {
  return MAJOR_FIXED_STARS.filter((star) => {
    const diff = Math.abs(longitude - star.longitude);
    const normalizedDiff = Math.min(diff, 360 - diff); // Account for wraparound
    return normalizedDiff <= orb;
  });
}

/**
 * Get fixed star amplification for a planetary placement
 * Benefic stars amplify score, malefic stars dampen or penalize
 */
export function getFixedStarAmplification(
  longitude: number,
  orb: number = 1
): number {
  const conjunctions = findFixedStarConjunctions(longitude, orb);
  let amplification = 1.0;

  for (const star of conjunctions) {
    const diff = Math.abs(longitude - star.longitude);
    const normalizedDiff = Math.min(diff, 360 - diff);
    const orbTightness = 1 - normalizedDiff / orb; // 0 to 1, 1 = exact

    if (star.group === "royal") {
      // Royal stars have strong effects
      if (star.nature === "benefic") {
        amplification *= 1 + 0.3 * orbTightness; // Up to +30%
      } else {
        amplification *= 1 - 0.4 * orbTightness; // Down to -40%
      }
    } else if (star.group === "major") {
      // Major stars have moderate effects
      if (star.nature === "benefic") {
        amplification *= 1 + 0.15 * orbTightness; // Up to +15%
      } else {
        amplification *= 1 - 0.2 * orbTightness; // Down to -20%
      }
    } else {
      // Minor stars have small effects
      if (star.nature === "benefic") {
        amplification *= 1 + 0.05 * orbTightness; // Up to +5%
      } else {
        amplification *= 1 - 0.1 * orbTightness; // Down to -10%
      }
    }
  }

  return amplification;
}

/**
 * Get nakshatra lord strength modifier
 * If a planet is in a nakshatra ruled by a strong planet, it gains support
 */
export function getNakshatraLordStrength(
  nakshatraName: string,
  lordDignityMultiplier: number
): number {
  // The lord's own dignity affects how much it supports planets in its nakshatra
  // Strong lord (exalted) = +0.2 bonus to planets in its nakshatra
  // Weak lord (debilitated) = -0.1 penalty
  if (lordDignityMultiplier >= 1.5) return 0.2;    // Exalted
  if (lordDignityMultiplier >= 1.25) return 0.15;  // Own sign
  if (lordDignityMultiplier >= 1.0) return 0.0;    // Neutral (explicit)
  return -0.1; // Debilitated
}

/**
 * Nakshatra profile strength (behavioral traits)
 * Used for execution multiplier in territorial scoring
 */
export function getNakshatraExecution(nakshatraName: string): {
  initiative: number;
  pressureResponse: number;
  consistency: number;
  finishing: number;
} {
  const profile = NAKSHATRAS[nakshatraName];
  if (!profile) {
    return { initiative: 0, pressureResponse: 0, consistency: 0, finishing: 0 };
  }

  const ratingMap = { Low: 0, Medium: 1, High: 2, Excellent: 3 };

  return {
    initiative: ratingMap[profile.initiative] ?? 0,
    pressureResponse: ratingMap[profile.pressureResponse] ?? 0,
    consistency: ratingMap[profile.consistency] ?? 0,
    finishing: ratingMap[profile.finishing] ?? 0,
  };
}

export const FIXED_STARS_REFERENCE = MAJOR_FIXED_STARS;
export const NAKSHATRA_LORDS_MAP = NAKSHATRA_LORDS;
export const NAKSHATRA_DIGNITY_MAP = NAKSHATRA_DIGNITY;
