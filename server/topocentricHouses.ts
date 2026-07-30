// ============================================================================
//   TOPOCENTRIC HOUSE SPINNER (CANVAS OVERLAY LAYER)
//   Architecture: 12 equal 30° spokes spun from the Topocentric East Vector
// ============================================================================

import {
  getFixedBackgroundSign,
  getFixedNakshatra,
} from "./firmamentBaseline";

export interface HouseCusp {
  houseNumber: number;
  startDegree: number; // Absolute degree on fixed background
  endDegree: number; // Absolute degree on fixed background
}

/**
 * Generates the 12 equal house slices starting exactly from the Topocentric East vector.
 */
export function generateTopocentricHouses(
  topocentricAscendant: number
): HouseCusp[] {
  const houses: HouseCusp[] = [];
  const normalizedAsc = (topocentricAscendant % 360 + 360) % 360;

  for (let i = 0; i < 12; i++) {
    const houseNumber = i + 1;
    const startDegree = (normalizedAsc + i * 30) % 360;
    const endDegree = (startDegree + 30) % 360;

    houses.push({
      houseNumber,
      startDegree: Number(startDegree.toFixed(4)),
      endDegree: Number(endDegree.toFixed(4)),
    });
  }
  return houses;
}

/**
 * PARSER: Evaluates exactly which House and Fixed Sign a moving planet is sitting in.
 */
export function evaluatePlanetPlacement(
  planetDegree: number,
  houses: HouseCusp[]
) {
  const pDeg = (planetDegree % 360 + 360) % 360;

  const permanentSign = getFixedBackgroundSign(pDeg);
  const permanentNakshatra = getFixedNakshatra(pDeg);

  const localHouse = houses.find((h) => {
    if (h.startDegree < h.endDegree) {
      return pDeg >= h.startDegree && pDeg < h.endDegree;
    } else {
      return pDeg >= h.startDegree || pDeg < h.endDegree;
    }
  });

  return {
    planetDegree: pDeg,
    fixedSign: permanentSign,
    nakshatra: permanentNakshatra.name,
    nakshatraIndex: permanentNakshatra.index,
    assignedHouse: localHouse ? localHouse.houseNumber : 1,
  };
}
