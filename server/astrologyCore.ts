/**
 * UNIFIED ASTROLOGICAL CORE LIBRARY
 * ============================================================================
 * This module consolidates canonical implementations for core astrological
 * calculations, including sect (day/night) determination, Arabic Lots
 * calculation and house assignment, and planetary dignity scoring.
 * All other engine modules should import and use these functions to ensure
 * consistency and eliminate duplication.
 * ============================================================================
 */

import type { PlanetPosition } from "./ephemeris";
import { SIGN_RULERS } from "./astroEngine";

// ----------------------------------------------------------------------------
// 1. Sect (Day/Night) Determination
// ----------------------------------------------------------------------------

/**
 * Determines if it is night based on the Sun's house placement.
 * Canonical implementation: Sun in houses 1-6 is day, Sun in houses 7-12 is night.
 * @param sunHouse The house number (1-12) where the Sun is located.
 * @returns True if it is night, false if it is day.
 */
export function isNight(sunHouse: number): boolean {
  return sunHouse > 6;
}

// ----------------------------------------------------------------------------
// 2. Arabic Lots Calculation and Canonical House Assignment
// ----------------------------------------------------------------------------

export interface ArabicLot {
  name: string;
  longitude: number;
  sign: string;
  degree: number;
  meaning: string;
  formula: string;
  house: number; // Canonical house assignment
}

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function lonToSign(lon: number): { sign: string; degree: number } {
  const signIdx = Math.floor(lon / 30);
  const degree = Math.floor(lon % 30);
  return { sign: ZODIAC[signIdx] ?? "Aries", degree };
}

function normalizeLon(lon: number): number {
  while (lon < 0) lon += 360;
  while (lon >= 360) lon -= 360;
  return lon;
}

/**
 * Assigns a house number (1-12) to a given longitude based on house cusps.
 * This is the canonical method for assigning lots to houses.
 * @param longitude The ecliptic longitude of the point.
 * @param houseCusps An array of 12 house cusps, where index 0 is the 1st house cusp.
 * @returns The house number (1-12) the longitude falls into.
 */
export function assignLotToHouse(longitude: number, houseCusps: number[]): number {
  const normalizedLon = normalizeLon(longitude);
  for (let i = 0; i < 12; i++) {
    const cuspStart = houseCusps[i];
    const cuspEnd = houseCusps[(i + 1) % 12];

    if (cuspStart <= cuspEnd) {
      // Normal case: house does not cross Aries point
      if (normalizedLon >= cuspStart && normalizedLon < cuspEnd) {
        return i + 1;
      }
    } else {
      // House crosses Aries point (e.g., 350° to 20°)
      if (normalizedLon >= cuspStart || normalizedLon < cuspEnd) {
        return i + 1;
      }
    }
  }
  // Should not happen if cusps cover 360 degrees, but as a fallback
  return 1;
}

/**
 * Calculates Arabic Lots based on traditional formulas and assigns them to houses.
 * This is the canonical implementation for Arabic Lots.
 * @param planets A record of planet positions, including eclipticLon.
 * @param ascendant The ecliptic longitude of the Ascendant.
 * @param isNightFlag True if it is night, false if it is day.
 * @param houseCusps An array of 12 house cusps for canonical house assignment.
 * @returns An array of calculated Arabic Lots with assigned houses.
 */
export function calculateCanonicalArabicLots(
  planets: Record<string, any>,
  ascendant: number,
  isNightFlag: boolean,
  houseCusps: number[]
): ArabicLot[] {
  const sunLon = planets.Sun?.eclipticLon ?? 0;
  const moonLon = planets.Moon?.eclipticLon ?? 0;
  const marsLon = planets.Mars?.eclipticLon ?? 0;
  const venusLon = planets.Venus?.eclipticLon ?? 0;
  const jupiterLon = planets.Jupiter?.eclipticLon ?? 0;
  const saturnLon = planets.Saturn?.eclipticLon ?? 0;

  const lots: ArabicLot[] = [];

  // 1. Lot of Fortune
  const fortuneLon = isNightFlag
    ? normalizeLon(ascendant + sunLon - moonLon)
    : normalizeLon(ascendant + moonLon - sunLon);
  const fortuneSign = lonToSign(fortuneLon);
  lots.push({
    name: "Lot of Fortune",
    longitude: fortuneLon,
    sign: fortuneSign.sign,
    degree: fortuneSign.degree,
    meaning: "Overall luck and favorable outcomes",
    formula: isNightFlag ? "Asc + Sun - Moon" : "Asc + Moon - Sun",
    house: assignLotToHouse(fortuneLon, houseCusps),
  });

  // 2. Lot of Spirit
  const spiritLon = isNightFlag
    ? normalizeLon(ascendant + moonLon - sunLon)
    : normalizeLon(ascendant + sunLon - moonLon);
  const spiritSign = lonToSign(spiritLon);
  lots.push({
    name: "Lot of Spirit",
    longitude: spiritLon,
    sign: spiritSign.sign,
    degree: spiritSign.degree,
    meaning: "Willpower, execution, competitive drive",
    formula: isNightFlag ? "Asc + Moon - Sun" : "Asc + Sun - Moon",
    house: assignLotToHouse(spiritLon, houseCusps),
  });

  // 3. Lot of Victory
  const victoryLon = normalizeLon(ascendant + marsLon - saturnLon);
  const victorySign = lonToSign(victoryLon);
  lots.push({
    name: "Lot of Victory",
    longitude: victoryLon,
    sign: victorySign.sign,
    degree: victorySign.degree,
    meaning: "Winning the contest",
    formula: "Asc + Mars - Saturn",
    house: assignLotToHouse(victoryLon, houseCusps),
  });

  // 4. Lot of Success
  const successLon = normalizeLon(ascendant + jupiterLon - saturnLon);
  const successSign = lonToSign(successLon);
  lots.push({
    name: "Lot of Success",
    longitude: successLon,
    sign: successSign.sign,
    degree: successSign.degree,
    meaning: "Achieving objectives",
    formula: "Asc + Jupiter - Saturn",
    house: assignLotToHouse(successLon, houseCusps),
  });

  // 5. Lot of Courage
  const courageLon = normalizeLon(ascendant + marsLon - sunLon);
  const courageSign = lonToSign(courageLon);
  lots.push({
    name: "Lot of Courage",
    longitude: courageLon,
    sign: courageSign.sign,
    degree: courageSign.degree,
    meaning: "Fighting spirit under pressure",
    formula: "Asc + Mars - Sun",
    house: assignLotToHouse(courageLon, houseCusps),
  });

  // 6. Lot of Triumph
  const triumphLon = normalizeLon(ascendant + venusLon - saturnLon);
  const triumphSign = lonToSign(triumphLon);
  lots.push({
    name: "Lot of Triumph",
    longitude: triumphLon,
    sign: triumphSign.sign,
    degree: triumphSign.degree,
    meaning: "Decisive victories",
    formula: "Asc + Venus - Saturn",
    house: assignLotToHouse(triumphLon, houseCusps),
  });

  // 7. Lot of Glory
  const gloryLon = normalizeLon(ascendant + sunLon - saturnLon);
  const glorySign = lonToSign(gloryLon);
  lots.push({
    name: "Lot of Glory",
    longitude: gloryLon,
    sign: glorySign.sign,
    degree: glorySign.degree,
    meaning: "Recognition, standout performances",
    formula: "Asc + Sun - Saturn",
    house: assignLotToHouse(gloryLon, houseCusps),
  });

  // 8. Lot of Nemesis
  const nemesisLon = normalizeLon(ascendant + saturnLon - sunLon);
  const nemesisSign = lonToSign(nemesisLon);
  lots.push({
    name: "Lot of Nemesis",
    longitude: nemesisLon,
    sign: nemesisSign.sign,
    degree: nemesisSign.degree,
    meaning: "Obstacles, self-sabotage, bad breaks",
    formula: "Asc + Saturn - Sun",
    house: assignLotToHouse(nemesisLon, houseCusps),
  });

  return lots;
}

// ----------------------------------------------------------------------------
// 3. Canonical Dignity Scoring
// ----------------------------------------------------------------------------

export type DignityStatus = "Exalted" | "Own Sign" | "Neutral" | "Debilitated";

/**
 * Calculates the canonical dignity score for a planet based on its sign.
 * This implementation is based on the point-based system from masterPredictionEngine.ts.
 * @param planetName The name of the planet (e.g., "Sun", "Mars").
 * @param sign The sign the planet is in.
 * @returns An object containing the dignity status and its corresponding score.
 */
export function getCanonicalDignityScore(planetName: string, sign: string): { status: DignityStatus; score: number } {
  const EXALTATIONS: Record<string, string> = {
    Sun: "Aries", Moon: "Taurus", Mercury: "Virgo", Venus: "Pisces", Mars: "Capricorn",
    Jupiter: "Cancer", Saturn: "Libra",
  };
  const DEBILITATIONS: Record<string, string> = {
    Sun: "Libra", Moon: "Scorpio", Mercury: "Pisces", Venus: "Virgo", Mars: "Cancer",
    Jupiter: "Capricorn", Saturn: "Aries",
  };

  if (EXALTATIONS[planetName] === sign) {
    return { status: "Exalted", score: 2 };
  } else if (DEBILITATIONS[planetName] === sign) {
    return { status: "Debilitated", score: -2 };
  } else if (SIGN_RULERS[sign] === planetName) {
    return { status: "Own Sign", score: 1 };
  } else {
    return { status: "Neutral", score: 0 };
  }
}

// ----------------------------------------------------------------------------
// 4. KP Stellar Core (Star-Lord and Sub-Lord)
// ----------------------------------------------------------------------------

export interface KPStellarDetails {
  starLord: string;
  subLord: string;
  nakshatraName: string;
  degreeInNakshatra: number;
}

const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const VIMSHOTTARI_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
];

const VIMSHOTTARI_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17
};

/**
 * Maps a planet's local surface Azimuth directly onto the 12 Fixed Vertical Houses.
 * Anchored to East (90°). Flowing counter-clockwise.
 * 
 * Logic from the Technical Brief:
 * - House 1 / Aries: Starts at East (90°) and goes CCW (towards North).
 * - House 4 / Cancer: Aligns with North (0°/360°).
 * - House 7 / Libra: Aligns with West (270°).
 * - House 10 / Capricorn: Aligns with South (180°).
 * 
 * Standard Azimuth (SA): N=0, E=90, S=180, W=270.
 * CCW Flow: 90 -> 60 -> 30 -> 0 -> 330 -> 300 -> 270 -> 240 -> 210 -> 180 -> 150 -> 120 -> 90.
 *
 * NOTE: this function returns a HOUSE only. Do not use its `sign`/`degree`
 * output to reassign a planet's zodiac sign — sign comes exclusively from
 * ecliptic longitude on the fixed firmament grid and must never be derived
 * from azimuth (see masterPredictionEngine.ts fixedDomeMode handling).
 */
export function calculateTopocentricHouse(standardAzimuth: number): { house: number; degree: number; sign: string } {
  const normAz = ((standardAzimuth % 360) + 360) % 360;
  
  // The grid is CCW from East (90).
  // We calculate how many degrees CCW we are from 90.
  // Degrees CCW = (90 - normAz) % 360
  let degCCW = (90 - normAz) % 360;
  if (degCCW < 0) degCCW += 360;

  const houseNumber = Math.floor(degCCW / 30) + 1;
  const cuspDegree = degCCW % 30;

  const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const sign = ZODIAC_SIGNS[houseNumber - 1];

  return { house: houseNumber, degree: cuspDegree, sign };
}

/**
 * Calculates the KP Star-Lord and Sub-Lord for a given ecliptic longitude.
 * Implements the precise 249 Sub-Lord logic from the Fixed Dome brief.
 * @param longitude The ecliptic longitude (0-360).
 * @returns KPStellarDetails containing star lord, sub lord, and nakshatra info.
 */
export function getKPStellarDetails(longitude: number): KPStellarDetails {
  const normalizedLon = normalizeLon(longitude);
  const nakshatraSpan = 360 / 27; // 13.333333°
  
  // 1. Nakshatra calculation
  const nakIdx = Math.floor(normalizedLon / nakshatraSpan);
  const nakshatraName = NAKSHATRA_NAMES[nakIdx % 27];
  
  // 2. Star-Lord calculation
  // Mapping of Nakshatras to their Vedic ruling planets
  const NAKSHATRA_LORDS = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
  ];
  const starLord = NAKSHATRA_LORDS[nakIdx % 27];
  
  // 3. Sub-Lord calculation using precise unequal boundaries
  const remainingDeg = normalizedLon % nakshatraSpan;
  const startPlanetIdx = VIMSHOTTARI_LORDS.indexOf(starLord);
  
  let currentBoundary = 0.0;
  let subLord = starLord;
  
  for (let i = 0; i < 9; i++) {
    const currentPlanet = VIMSHOTTARI_LORDS[(startPlanetIdx + i) % 9];
    const years = VIMSHOTTARI_YEARS[currentPlanet];
    const spanWidth = (years / 120) * nakshatraSpan;
    currentBoundary += spanWidth;
    
    if (remainingDeg <= currentBoundary) {
      subLord = currentPlanet;
      break;
    }
  }
  
  return {
    starLord,
    subLord,
    nakshatraName,
    degreeInNakshatra: remainingDeg
  };
}
