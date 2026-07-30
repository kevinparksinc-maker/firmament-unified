/**
 * Nakshatra Behavioral Data
 * 27 lunar mansions with 8-trait profiles
 */

export interface NakshatraProfile {
  name: string;
  pace: "Fast" | "Moderate" | "Slow";
  style: string;
  temperament: "Stoic" | "Emotional" | "Volatile";
  initiative: "Low" | "Medium" | "High" | "Excellent";
  pressureResponse: "Low" | "Medium" | "High" | "Excellent";
  consistency: "Low" | "Medium" | "High" | "Excellent";
  adaptability: "Low" | "Medium" | "High" | "Excellent";
  finishingAbility: "Low" | "Medium" | "High" | "Excellent";
}

export const NAKSHATRAS: Record<string, NakshatraProfile> = {
  Ashwini: {
    name: "Ashwini",
    pace: "Fast",
    style: "Opportunistic",
    temperament: "Stoic",
    initiative: "Excellent",
    pressureResponse: "High",
    consistency: "Medium",
    adaptability: "High",
    finishingAbility: "Medium",
  },
  Bharani: {
    name: "Bharani",
    pace: "Fast",
    style: "Resilient",
    temperament: "Volatile",
    initiative: "High",
    pressureResponse: "Medium",
    consistency: "Medium",
    adaptability: "Medium",
    finishingAbility: "High",
  },
  Krittika: {
    name: "Krittika",
    pace: "Fast",
    style: "Aggressive",
    temperament: "Volatile",
    initiative: "Excellent",
    pressureResponse: "Medium",
    consistency: "Medium",
    adaptability: "Medium",
    finishingAbility: "Medium",
  },
  Rohini: {
    name: "Rohini",
    pace: "Slow",
    style: "Patient",
    temperament: "Stoic",
    initiative: "Low",
    pressureResponse: "High",
    consistency: "High",
    adaptability: "Medium",
    finishingAbility: "High",
  },
  Mrigashira: {
    name: "Mrigashira",
    pace: "Fast",
    style: "Tactical",
    temperament: "Emotional",
    initiative: "High",
    pressureResponse: "Medium",
    consistency: "Medium",
    adaptability: "High",
    finishingAbility: "Medium",
  },
  Ardra: {
    name: "Ardra",
    pace: "Fast",
    style: "Explosive",
    temperament: "Volatile",
    initiative: "High",
    pressureResponse: "Low",
    consistency: "Low",
    adaptability: "Medium",
    finishingAbility: "Low",
  },
  Punarvasu: {
    name: "Punarvasu",
    pace: "Moderate",
    style: "Resilient",
    temperament: "Emotional",
    initiative: "Medium",
    pressureResponse: "High",
    consistency: "Medium",
    adaptability: "High",
    finishingAbility: "Medium",
  },
  Pushya: {
    name: "Pushya",
    pace: "Slow",
    style: "Defensive",
    temperament: "Stoic",
    initiative: "Low",
    pressureResponse: "Excellent",
    consistency: "High",
    adaptability: "Medium",
    finishingAbility: "High",
  },
  Ashlesha: {
    name: "Ashlesha",
    pace: "Moderate",
    style: "Tactical",
    temperament: "Volatile",
    initiative: "Medium",
    pressureResponse: "Medium",
    consistency: "Low",
    adaptability: "High",
    finishingAbility: "Medium",
  },
  Magha: {
    name: "Magha",
    pace: "Moderate",
    style: "Methodical",
    temperament: "Stoic",
    initiative: "Medium",
    pressureResponse: "High",
    consistency: "High",
    adaptability: "Low",
    finishingAbility: "High",
  },
  "Purva Phalguni": {
    name: "Purva Phalguni",
    pace: "Moderate",
    style: "Opportunistic",
    temperament: "Emotional",
    initiative: "Medium",
    pressureResponse: "Low",
    consistency: "Low",
    adaptability: "Medium",
    finishingAbility: "Low",
  },
  "Uttara Phalguni": {
    name: "Uttara Phalguni",
    pace: "Slow",
    style: "Methodical",
    temperament: "Stoic",
    initiative: "Low",
    pressureResponse: "High",
    consistency: "High",
    adaptability: "Medium",
    finishingAbility: "High",
  },
  Hasta: {
    name: "Hasta",
    pace: "Fast",
    style: "Tactical",
    temperament: "Stoic",
    initiative: "High",
    pressureResponse: "High",
    consistency: "High",
    adaptability: "High",
    finishingAbility: "Medium",
  },
  Chitra: {
    name: "Chitra",
    pace: "Fast",
    style: "Explosive",
    temperament: "Emotional",
    initiative: "High",
    pressureResponse: "Medium",
    consistency: "Low",
    adaptability: "Medium",
    finishingAbility: "Medium",
  },
  Swati: {
    name: "Swati",
    pace: "Moderate",
    style: "Opportunistic",
    temperament: "Stoic",
    initiative: "Medium",
    pressureResponse: "Medium",
    consistency: "Medium",
    adaptability: "Excellent",
    finishingAbility: "Medium",
  },
  Vishakha: {
    name: "Vishakha",
    pace: "Fast",
    style: "Aggressive",
    temperament: "Emotional",
    initiative: "High",
    pressureResponse: "Medium",
    consistency: "Medium",
    adaptability: "Medium",
    finishingAbility: "High",
  },
  Anuradha: {
    name: "Anuradha",
    pace: "Slow",
    style: "Methodical",
    temperament: "Stoic",
    initiative: "Low",
    pressureResponse: "High",
    consistency: "Excellent",
    adaptability: "Medium",
    finishingAbility: "High",
  },
  Jyeshtha: {
    name: "Jyeshtha",
    pace: "Moderate",
    style: "Defensive",
    temperament: "Stoic",
    initiative: "Medium",
    pressureResponse: "Excellent",
    consistency: "High",
    adaptability: "High",
    finishingAbility: "High",
  },
  Mula: {
    name: "Mula",
    pace: "Fast",
    style: "Explosive",
    temperament: "Volatile",
    initiative: "High",
    pressureResponse: "Low",
    consistency: "Low",
    adaptability: "Medium",
    finishingAbility: "Low",
  },
  "Purva Ashadha": {
    name: "Purva Ashadha",
    pace: "Fast",
    style: "Aggressive",
    temperament: "Stoic",
    initiative: "Excellent",
    pressureResponse: "High",
    consistency: "Medium",
    adaptability: "Medium",
    finishingAbility: "Medium",
  },
  "Uttara Ashadha": {
    name: "Uttara Ashadha",
    pace: "Slow",
    style: "Resilient",
    temperament: "Stoic",
    initiative: "Low",
    pressureResponse: "Excellent",
    consistency: "High",
    adaptability: "Medium",
    finishingAbility: "Excellent",
  },
  Shravana: {
    name: "Shravana",
    pace: "Moderate",
    style: "Tactical",
    temperament: "Stoic",
    initiative: "Medium",
    pressureResponse: "High",
    consistency: "High",
    adaptability: "High",
    finishingAbility: "Medium",
  },
  Dhanishta: {
    name: "Dhanishta",
    pace: "Fast",
    style: "Aggressive",
    temperament: "Emotional",
    initiative: "High",
    pressureResponse: "Medium",
    consistency: "Medium",
    adaptability: "Medium",
    finishingAbility: "High",
  },
  Shatabhisha: {
    name: "Shatabhisha",
    pace: "Slow",
    style: "Opportunistic",
    temperament: "Volatile",
    initiative: "Medium",
    pressureResponse: "Medium",
    consistency: "Low",
    adaptability: "High",
    finishingAbility: "Medium",
  },
  "Purva Bhadrapada": {
    name: "Purva Bhadrapada",
    pace: "Fast",
    style: "Explosive",
    temperament: "Volatile",
    initiative: "High",
    pressureResponse: "Low",
    consistency: "Low",
    adaptability: "Medium",
    finishingAbility: "Medium",
  },
  "Uttara Bhadrapada": {
    name: "Uttara Bhadrapada",
    pace: "Slow",
    style: "Patient",
    temperament: "Stoic",
    initiative: "Low",
    pressureResponse: "High",
    consistency: "High",
    adaptability: "Medium",
    finishingAbility: "High",
  },
  Revati: {
    name: "Revati",
    pace: "Slow",
    style: "Patient",
    temperament: "Emotional",
    initiative: "Low",
    pressureResponse: "Medium",
    consistency: "Medium",
    adaptability: "High",
    finishingAbility: "Medium",
  },
};

/**
 * Get nakshatra from longitude
 */
export function getNakshatraFromLongitude(lon: number): NakshatraProfile {
  const normalizedLon = ((lon % 360) + 360) % 360;
  const nakshatraIndex = Math.floor(normalizedLon / (360 / 27));
  const nakshatraNames = Object.keys(NAKSHATRAS);
  return NAKSHATRAS[nakshatraNames[nakshatraIndex] || "Ashwini"]!;
}

/**
 * Convert trait rating to multiplier (Excellent=1.3, High=1.15, Medium=1.0, Low=0.85)
 */
export function traitToMultiplier(trait: "Low" | "Medium" | "High" | "Excellent"): number {
  const multipliers: Record<string, number> = {
    Excellent: 1.3,
    High: 1.15,
    Medium: 1.0,
    Low: 0.85,
  };
  return multipliers[trait] || 1.0;
}

/**
 * Calculate nakshatra territorial modifier from 4 execution traits
 * Returns average multiplier across Initiative, Pressure Response, Consistency, Finishing Ability
 */
export function calculateNakshatraModifier(profile: NakshatraProfile): number {
  const traits = [profile.initiative, profile.pressureResponse, profile.consistency, profile.finishingAbility];
  const multipliers = traits.map(traitToMultiplier);
  const average = multipliers.reduce((a, b) => a + b, 0) / multipliers.length;
  return average;
}

/**
 * Get temperament volatility adjustment
 * Stoic = no adjustment, Emotional = ±10%, Volatile = ±20%
 */
export function getTemperamentVolatility(temperament: "Stoic" | "Emotional" | "Volatile"): number {
  const volatility: Record<string, number> = {
    Stoic: 0,
    Emotional: 0.1,
    Volatile: 0.2,
  };
  return volatility[temperament] || 0;
}
