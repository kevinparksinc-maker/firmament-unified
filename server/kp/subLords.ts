// server/kp/subLords.ts
// KP Sub-Lord System — Each nakshatra is divided into 9 parts,
// each ruled by a planet in a fixed sequence.
// No offset needed — nakshatras are already fixed in the dome.

const SUB_LORD_SEQUENCE = [
  'Ketu',    // 1
  'Sun',     // 2
  'Moon',    // 3
  'Mars',    // 4
  'Rahu',    // 5
  'Jupiter', // 6
  'Saturn',  // 7
  'Mercury', // 8
  'Venus'    // 9
] as const;

const NAKSHATRA_SIZE = 360 / 27; // 13.3333333333°
const SUB_LORD_SIZE = NAKSHATRA_SIZE / 9; // 1.48148148148° (~1°28′53″)

export interface SubLordResult {
  lord: string;
  index: number;          // 0-8
  startDegree: number;    // Absolute degree where this sub-lord starts
  endDegree: number;      // Absolute degree where this sub-lord ends
  nakshatraIndex: number; // 0-26
  subLordNumber: number;  // 1-9 (human-readable)
}

/**
 * Get the sub-lord for a given ecliptic longitude (sidereal, 0-360°)
 * No offset needed — nakshatras are already fixed in the dome.
 */
export function getSubLord(eclipticLon: number): SubLordResult {
  const deg = ((eclipticLon % 360) + 360) % 360;
  
  const nakshatraIndex = Math.floor(deg / NAKSHATRA_SIZE);
  const offsetInNakshatra = deg % NAKSHATRA_SIZE;
  const subLordIndex = Math.floor(offsetInNakshatra / SUB_LORD_SIZE);
  const index = Math.min(subLordIndex, 8);
  
  const startDegree = (nakshatraIndex * NAKSHATRA_SIZE) + (index * SUB_LORD_SIZE);
  const endDegree = startDegree + SUB_LORD_SIZE;
  
  return {
    lord: SUB_LORD_SEQUENCE[index],
    index: index,
    startDegree: startDegree,
    endDegree: endDegree,
    nakshatraIndex: nakshatraIndex,
    subLordNumber: index + 1
  };
}

/**
 * Get sub-lord for a specific planet position
 * Extends the existing nakshatra data
 */
export function getSubLordForPlanet(
  planetName: string,
  eclipticLon: number,
  nakshatraName: string
): SubLordResult & { planetName: string; nakshatraName: string } {
  const subLord = getSubLord(eclipticLon);
  return {
    ...subLord,
    planetName,
    nakshatraName
  };
}
