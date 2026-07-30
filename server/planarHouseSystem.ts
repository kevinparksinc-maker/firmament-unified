/**
 * planarHouseSystem.ts
 *
 * Extracted from breakdown-every-lord.ts. This is an EQUAL HOUSE system
 * anchored to a "planar Ascendant" (via transformChartToFlatPlane), NOT the
 * standard houses.cusps returned by calculateChart(). House 1's cusp is the
 * exact Ascendant degree; every other cusp is a clean 30° step from that —
 * this is Equal House, not Whole Sign (Whole Sign would start House 1 at 0°
 * of the Ascendant's sign instead of at the Ascendant's exact degree).
 *
 * KNOWN OPEN ISSUE (carried over, not fixed here — flag before relying on this):
 * `localHours` below is just the UTC hour/minute, with no correction for the
 * observer's longitude or true local sidereal time. Since Ascendant drifts
 * roughly 1 degree per 4 minutes of time error, if `transformChartToFlatPlane`
 * doesn't independently apply a longitude correction internally using the
 * `lon` argument, this Ascendant (and therefore every cusp derived from it)
 * may be inaccurate depending on how far you are from UTC. Confirm what
 * transformChartToFlatPlane does with its arguments before trusting this in
 * production.
 */

import { SIGN_RULERS } from "./astroEngine";
import { transformChartToFlatPlane } from "./coordinateTransformer";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export interface PlanarHouseSystem {
  planarAscendant: number;
  cusps: number[]; // index 0 = House 1 cusp, ... index 11 = House 12 cusp
  houseSigns: string[]; // sign occupying each house's cusp, same indexing
  houseLords: Map<number, string>; // house number (1-12) -> ruling planet
}

/**
 * Build the equal-house system anchored to the planar Ascendant for a given
 * date, latitude, and longitude.
 */
export function buildPlanarHouseSystem(date: Date, lat: number, lon: number): PlanarHouseSystem {
  const localHours = (date.getUTCHours() + date.getUTCMinutes() / 60) % 24;
  const flatChart = transformChartToFlatPlane(lat, lon, localHours, 300, 1, 0);
  const planarAscendant = flatChart.planarAscendant;

  const cusps: number[] = [];
  for (let i = 0; i < 12; i++) {
    cusps.push((planarAscendant + i * 30) % 360);
  }

  const houseSigns = cusps.map((c) => ZODIAC_SIGNS[Math.floor(c / 30) % 12]);

  const houseLords = new Map<number, string>();
  houseSigns.forEach((sign, i) => {
    const ruler = SIGN_RULERS[sign];
    if (ruler) houseLords.set(i + 1, ruler);
  });

  return { planarAscendant, cusps, houseSigns, houseLords };
}

/**
 * Given a sidereal longitude, find which of the 12 equal houses it falls in,
 * using the cusps from buildPlanarHouseSystem.
 */
export function getPlanarHouse(eclipticLon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (start <= end) {
      if (eclipticLon >= start && eclipticLon < end) return i + 1;
    } else {
      // wraps past 0 degrees (e.g. cusp near 350 to cusp near 20)
      if (eclipticLon >= start || eclipticLon < end) return i + 1;
    }
  }
  return 1;
}
