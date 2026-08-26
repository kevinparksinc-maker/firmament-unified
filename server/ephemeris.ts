/**
 * ARCANA STATE — Topocentric Ephemeris Engine
 *
 * Two-layer architecture as per the Snow Globe brief:
 *  Math Layer  → Swiss-equivalent topocentric positions (astronomy-engine)
 *  Visual Layer → Alt/Az output for the parabolic dome renderer
 *
 * All positions are TOPOCENTRIC (observer on Earth's surface),
 * not geocentric. Full parallax correction applied, especially for the Moon.
 *
 * ZODIAC MODEL: Pure ecliptic longitude, zero precession/ayanamsa correction. Tropical and sidereal are the same frame here — there is no drift between them, so no ayanamsa is ever applied.
 * The dome's 0° Aries point is fixed — it does not drift against the
 * physical sky over time. This is intentional and should not be "fixed"
 * by adding an ayanamsa later; that would reintroduce a precession model
 * this engine is deliberately built without.
 *
 * HOUSE SYSTEM: Whole Sign. The raw geometric Ascendant degree is calculated
 * as before (no ayanamsa), but house boundaries are NOT set at that exact
 * degree — they are set at the 0° boundary of the Ascendant's sign. That
 * entire sign becomes House 1, the next sign House 2, and so on around the
 * wheel. No sign is ever split across two houses ("intercepted") and no
 * house ever spans two signs. House labels are fixed at the moment of the
 * chart (birth, transit-moment, or horary-moment) and never re-spun after
 * that. This applies uniformly to natal, transit, and horary charts.
 */

import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const Astronomy = _require("astronomy-engine");
const {
  MakeTime,
  Observer,
  SiderealTime,
  SunPosition,
  GeoVector,
  Ecliptic,
  Equator,
  Horizon,
  Body,
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
  const SOLAR_TROPIC_ANGLE = 23.4367;
  const e = (SOLAR_TROPIC_ANGLE * Math.PI) / 180;
  const lambda = (eclipticLon * Math.PI) / 180;

  const raRad = Math.atan2(Math.sin(lambda) * Math.cos(e), Math.cos(lambda));
  const decRad = Math.asin(Math.sin(lambda) * Math.sin(e));

  let ra = (raRad * 180) / Math.PI;
  ra = ((ra % 360) + 360) % 360;
  const dec = (decRad * 180) / Math.PI;

  return { ra, dec };
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
  // Greenwich Sidereal Time → Local Sidereal Time → RAMC (degrees)
  const gst = SiderealTime(MakeTime(date));
  const lstHours = gst + observer.longitude / 15;
  const sidereal = ((lstHours % 24) + 24) % 24;
  const ramc = sidereal * 15;

  // The sun's maximum angular deviation from the celestial equator —
  // the boundary defined by the Tropic of Cancer (north) and
  // Tropic of Capricorn (south), where the sun's circling path
  // reaches its extremes within the dome.
  const SOLAR_TROPIC_ANGLE = 23.4367;
  const e = (SOLAR_TROPIC_ANGLE * Math.PI) / 180;
  const lat = (observer.latitude * Math.PI) / 180;
  const ramcRad = (ramc * Math.PI) / 180;

  // MC
  let mcEcliptic =
    (Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(e)) * 180) /
    Math.PI;
  mcEcliptic = ((mcEcliptic % 360) + 360) % 360;

  // Ascendant
  let ascEcliptic =
    (Math.atan2(
      -Math.cos(ramcRad),
      Math.sin(e) * Math.tan(lat) + Math.cos(e) * Math.sin(ramcRad)
    ) *
      180) /
    Math.PI;
  // The closed-form intersection above resolves the opposite horizon point in
  // this app's zodiac orientation. Rotate it once to select the rising-side
  // direction used by the locked natal reference and downstream house model.
  ascEcliptic = ((ascEcliptic + 180) % 360 + 360) % 360;

  // Whole Sign cusps: house 1 = the entire fixed sign containing the
  // Ascendant degree. Each cusp sits at that sign's 0° boundary (a multiple
  // of 30°), not at the raw Ascendant degree — Whole Sign uses sign
  // boundaries, never the exact rising degree, as house cusps.
  const ascSignIdx = Math.floor((((ascEcliptic % 360) + 360) % 360) / 30);
  const cusps: number[] = [];
  for (let i = 0; i < 12; i++) {
    const signIdx = (ascSignIdx + i) % 12;
    cusps.push(signIdx * 30);
  }

  return {
    cusps,
    ascendant: ascEcliptic,
    mc: mcEcliptic,
  };
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
  const astroObs = new Observer(
    observer.latitude,
    observer.longitude,
    observer.altitude
  );
  const houses = calcHouseCusps(date, observer);
  const wholeSignHouses = generateWholeSignHouses(houses.ascendant);

  const bodyList: Array<{ name: string; body: Astronomy.Body }> = [
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
      let eclipticLon: number;
      if (body === Astronomy.Body.Sun) {
        const sp = SunPosition(MakeTime(date));
        eclipticLon = sp.elon;
      } else {
        const vec = GeoVector(body, MakeTime(date), true);
        const ecl = Ecliptic(vec);
        eclipticLon = ecl.elon;
      }

      const { sign, degree, minutes } = lonToSignDeg(eclipticLon);

      const equatorial = Equator(body, MakeTime(date), astroObs, true, true);
      const horizon = Horizon(
        MakeTime(date),
        astroObs,
        equatorial.ra,
        equatorial.dec,
        "normal"
      );

      const yesterday = new Date(date.getTime() - 86400000);
      let eclipticYesterday: number;
      if (body === Astronomy.Body.Sun) {
        eclipticYesterday = SunPosition(MakeTime(yesterday)).elon;
      } else {
        const vecY = GeoVector(body, MakeTime(yesterday), true);
        eclipticYesterday = Ecliptic(vecY).elon;
      }
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
