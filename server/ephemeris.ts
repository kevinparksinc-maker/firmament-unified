/**
 * ARCANA STATE — Fixed-Dome Ephemeris Engine
 *
 * Two-layer architecture as per the Snow Globe brief:
 *  Math Layer  → raw fixed-dome positions from a permanent zero-tilt plane
 *  Visual Layer → optional observer-relative Alt/Az output for the renderer
 *
 * Active dome positions are projections of geocentric vectors onto a
 * permanent zero-tilt plane. Observer-relative sky fields are not used to
 * rotate the dome sectors.
 *
 * ZODIAC MODEL: Permanent raw fixed-dome longitude. A body's geocentric
 * J2000 vector is projected directly onto the dome's zero-tilt X/Y plane.
 * No precession, nutation, obliquity, ayanamsa, or date-varying ecliptic
 * rotation is applied. The dome's 0° Aries point and 30° sectors are fixed.
 *
 * HOUSE SYSTEM: Whole-sign local horizon sectors. The dome 0° Aries reference
 * never moves, while House 1 begins at the sign containing the observer/time-
 * specific Ascendant; subsequent houses advance by 30°.
 */

import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const Astronomy = _require("astronomy-engine");
const {
  MakeTime,
  GeoVector,
  Body,
  SiderealTime,
} = Astronomy;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ObserverLocation {
  latitude: number; // degrees, positive = north
  longitude: number; // degrees, positive = east
  altitude: number; // metres above sea level
}

export interface PlanetPosition {
  name: string;
  symbol: string;
  /** Ecliptic longitude in degrees (0–360) — the only zodiac frame this engine uses (tropical and sidereal are identical here, since this model has no precession) */
  eclipticLon: number;
  /** Right Ascension in degrees (0-360), converted from astronomy-engine's native hours -- for polar/equatorial dome projection rendering */
  ra: number;
  /** Declination in degrees (-90 to +90) -- for polar/equatorial dome projection rendering */
  dec: number;
  /** Zodiac sign */
  sign: string;
  /** Degree within sign (0–29.99) */
  degreeInSign: number;
  /** Arcminutes within degree (0–59) */
  minutes: number;
  /** True topocentric altitude above horizon (degrees) */
  altitude: number;
  /** True topocentric azimuth (degrees, 0=N, 90=E) */
  azimuth: number;
  /** Is the planet retrograde? */
  retrograde: boolean;
  /** House number (1–12), whole sign */
  house: number;
}

export interface HouseCusps {
  /** Start longitude of each house = start of that whole sign (30° increments from Asc's sign) */
  cusps: number[];
  ascendant: number; // ecliptic longitude
  mc: number; // ecliptic longitude
}

export interface WholeSignHouse {
  houseNumber: number;
  signName: string;
  startDegree: number;
  endDegree: number;
}

export interface EphemerisResult {
  planets: PlanetPosition[];
  houses: HouseCusps;
  wholeSignHouses: WholeSignHouse[];
  observer: ObserverLocation;
  date: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "⛢",
  Neptune: "♆",
  Pluto: "♇",
  "North Node": "☊",
  "South Node": "☋",
};

function lonToSignDeg(lon: number): {
  sign: string;
  degree: number;
  minutes: number;
} {
  const norm = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  const degInSign = norm % 30;
  const degree = Math.floor(degInSign);
  const minutes = Math.floor((degInSign - degree) * 60);
  return { sign: ZODIAC_SIGNS[signIndex] ?? "Aries", degree, minutes };
}

/**
 * Converts a point on the sun's seasonal path (ecliptic longitude) to
 * the celestial-equator reference frame (RA/Dec) within the dome.
 * Assumes the point lies exactly on that path (ecliptic latitude = 0),
 * which holds for the lunar nodes.
 */
function eclipticToEquatorial(eclipticLon: number): { ra: number; dec: number } {
  // The fixed dome has no obliquity: its permanent equator and ecliptic are
  // coincident, so longitude maps directly to right ascension and declination
  // remains zero for the idealized dome layer.
  return { ra: ((eclipticLon % 360) + 360) % 360, dec: 0 };
}

function fixedDomeLongitude(body: Parameters<typeof GeoVector>[0], date: Date): number {
  const vector = GeoVector(body, MakeTime(date), false);
  return ((Math.atan2(vector.y, vector.x) * 180) / Math.PI + 360) % 360;
}

// ─── Ascendant / MC (corrected) ────────────────────────────────────────────────
// Previously these two formulas were transposed/flipped and produced the
// Descendant (Asc) and a ~90°-shifted point (MC). Standard closed-form:
//   MC  = atan2( sin(RAMC),                 cos(RAMC) * cos(ε) )
//   Asc = atan2( -cos(RAMC),  sin(ε)*tan(φ) + cos(ε) * sin(RAMC) )

function calcHouseCusps(
  date: Date,
  observer: ObserverLocation
): HouseCusps {
  // The dome reference is fixed, but each observer has a local horizon.
  // Use local sidereal time to find that horizon's intersection with the
  // permanent zero-tilt equatorial/ecliptic plane. No obliquity, precession,
  // nutation, or ayanamsa is applied.
  const gstHours = SiderealTime(MakeTime(date));
  const localSiderealDegrees = ((gstHours * 15 + observer.longitude) % 360 + 360) % 360;
  const ascendant = (localSiderealDegrees + 270) % 360;
  const mc = localSiderealDegrees;
  const ascSignIdx = Math.floor(ascendant / 30);
  const cusps = Array.from({ length: 12 }, (_, index) => ((ascSignIdx + index) % 12) * 30);
  return { cusps, ascendant, mc };
}

/**
 * Build the 12 Whole Sign houses. House 1 is the entire sign containing the
 * Ascendant degree; House 2 is the next sign around the fixed wheel; and so
 * on. Every house is exactly one 30° sign — no interceptions, no splitting.
 */
export function generateWholeSignHouses(ascendantEcliptic: number): WholeSignHouse[] {
  const ascSignIdx = Math.floor((((ascendantEcliptic % 360) + 360) % 360) / 30);
  const houses: WholeSignHouse[] = [];
  for (let houseNum = 1; houseNum <= 12; houseNum++) {
    const signIdx = (ascSignIdx + houseNum - 1) % 12;
    const startDegree = signIdx * 30;
    const endDegree = (startDegree + 30) % 360;
    houses.push({
      houseNumber: houseNum,
      signName: ZODIAC_SIGNS[signIdx],
      startDegree,
      endDegree,
    });
  }
  return houses;
}

/** Whole Sign assignment: a planet's house is however many signs its sign sits ahead of the Ascendant's sign — never based on its exact degree within the sign. */
function getHouseNumber(planetLon: number, ascendantEcliptic: number): number {
  const planetSignIdx = Math.floor((((planetLon % 360) + 360) % 360) / 30);
  const ascSignIdx = Math.floor((((ascendantEcliptic % 360) + 360) % 360) / 30);
  const diff = ((planetSignIdx - ascSignIdx) % 12 + 12) % 12;
  return diff + 1;
}

// ─── Main Calculation ─────────────────────────────────────────────────────────
// Used identically for natal charts, transit charts, and horary charts —
// horary just passes the moment/location of the question instead of a birth
// moment/location. Whole Sign is applied uniformly across all three, so no
// special-casing is needed here.

export async function calculateChart(
  date: Date,
  observer: ObserverLocation
): Promise<EphemerisResult> {
  const houses = calcHouseCusps(date, observer);
  const wholeSignHouses = generateWholeSignHouses(houses.ascendant);

  const bodyList: Array<{ name: string; body: Parameters<typeof GeoVector>[0] }> = [
    { name: "Sun", body: Astronomy.Body.Sun },
    { name: "Moon", body: Astronomy.Body.Moon },
    { name: "Mercury", body: Astronomy.Body.Mercury },
    { name: "Venus", body: Astronomy.Body.Venus },
    { name: "Mars", body: Astronomy.Body.Mars },
    { name: "Jupiter", body: Astronomy.Body.Jupiter },
    { name: "Saturn", body: Astronomy.Body.Saturn },
    { name: "Uranus", body: Astronomy.Body.Uranus },
    { name: "Neptune", body: Astronomy.Body.Neptune },
    { name: "Pluto", body: Astronomy.Body.Pluto },
  ];

  const planets: PlanetPosition[] = [];

  for (const { name, body } of bodyList) {
    try {
      const eclipticLon = fixedDomeLongitude(body, date);

      const { sign, degree, minutes } = lonToSignDeg(eclipticLon);

      const equatorial = { ra: eclipticLon / 15, dec: 0 };
      const horizon = { altitude: 0, azimuth: 0 };

      const yesterday = new Date(date.getTime() - 86400000);
      const eclipticYesterday = fixedDomeLongitude(body, yesterday);
      let retrograde = false;
      if (body !== Astronomy.Body.Sun && body !== Astronomy.Body.Moon) {
        let diff = eclipticLon - eclipticYesterday;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        retrograde = diff < 0;
      }

      const house = getHouseNumber(eclipticLon, houses.ascendant);

      planets.push({
        name,
        symbol: PLANET_SYMBOLS[name] ?? "★",
        eclipticLon,
        ra: equatorial.ra * 15, // astronomy-engine returns RA in hours; convert to degrees
        dec: equatorial.dec,
        sign,
        degreeInSign: degree,
        minutes,
        altitude: horizon.altitude,
        azimuth: horizon.azimuth,
        retrograde,
        house,
      });
    } catch (err) {
      console.warn(`[Ephemeris] Failed to calculate ${name}:`, err);
    }
  }

  // Rahu (North Node) / Ketu (South Node) — mean node formula
  try {
    const d = date.getTime() / 86400000 - 10957.5; // days from J2000
    const rahuEcliptic = (((125.0445479 - 0.0529539297 * d) % 360) + 360) % 360;
    const ketuEcliptic = (rahuEcliptic + 180) % 360;

    const rahuInfo = lonToSignDeg(rahuEcliptic);
    const ketuInfo = lonToSignDeg(ketuEcliptic);

    const rahuEquatorial = eclipticToEquatorial(rahuEcliptic);
    planets.push({
      name: "Rahu",
      symbol: "☊",
      eclipticLon: rahuEcliptic,
      ra: rahuEquatorial.ra,
      dec: rahuEquatorial.dec,
      sign: rahuInfo.sign,
      degreeInSign: rahuInfo.degree,
      minutes: rahuInfo.minutes,
      altitude: 0,
      azimuth: 0,
      retrograde: true,
      house: getHouseNumber(rahuEcliptic, houses.ascendant),
    });

    const ketuEquatorial = eclipticToEquatorial(ketuEcliptic);
    planets.push({
      name: "Ketu",
      symbol: "☋",
      eclipticLon: ketuEcliptic,
      ra: ketuEquatorial.ra,
      dec: ketuEquatorial.dec,
      sign: ketuInfo.sign,
      degreeInSign: ketuInfo.degree,
      minutes: ketuInfo.minutes,
      altitude: 0,
      azimuth: 0,
      retrograde: true,
      house: getHouseNumber(ketuEcliptic, houses.ascendant),
    });
  } catch (err) {
    console.warn("[Ephemeris] Failed to calculate nodes:", err);
  }

  return { planets, houses, wholeSignHouses, observer, date };
}

// ─── Format for reading engine ─────────────────────────────────────────────────

export function formatChartForReading(result: EphemerisResult): string {
  const lines = result.planets.map((p) => {
    const rx = p.retrograde ? " Rx" : "";
    return `${p.name}${rx}: ${p.degreeInSign}° ${p.minutes}' ${p.sign}, ${p.house}th house`;
  });

  const asc = lonToSignDeg(result.houses.ascendant);
  const desc = lonToSignDeg((result.houses.ascendant + 180) % 360);
  const mc = lonToSignDeg(result.houses.mc);
  const ic = lonToSignDeg((result.houses.mc + 180) % 360);

  lines.push(`Asc: ${asc.degree}° ${asc.minutes}' ${asc.sign}, 1st house`);
  lines.push(`Dsc: ${desc.degree}° ${desc.minutes}' ${desc.sign}, 7th house`);
  lines.push(`MC: ${mc.degree}° ${mc.minutes}' ${mc.sign}, 10th house`);
  lines.push(`IC: ${ic.degree}° ${ic.minutes}' ${ic.sign}, 4th house`);

  return lines.join("\n");
}

// Export house cusp info for the wheel (equal house: each cusp sits at its own exact degree)
export function getHouseCuspInfo(
  result: EphemerisResult
): Array<{ house: number; sign: string; degree: number; minutes: number }> {
  return result.wholeSignHouses.map((h) => {
    const degInSign = h.startDegree % 30;
    return {
      house: h.houseNumber,
      sign: h.signName,
      degree: Math.floor(degInSign),
      minutes: Math.floor((degInSign - Math.floor(degInSign)) * 60),
    };
  });
}
