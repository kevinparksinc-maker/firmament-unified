/**
 * K-STAR PLANETARY ENGINE
 *
 * Sovereign. No API. No spinning ball Earth coordinates.
 * Pure orbital math hardcoded into the app.
 *
 * Each planet has:
 * - J2000 position: where it was on Jan 1, 2000 (noon UTC) on the K-Star map (degrees 0-360)
 * - Daily motion: how many degrees it moves per day on the K-Star map
 *
 * Formula:
 *   days = (target date - J2000 epoch) in days
 *   position = (J2000_position + days × daily_motion) mod 360
 *
 * The K-Star map:
 * - 0° = Polaris north
 * - 70° = Aldebaran (House 2 / Taurus) — East anchor
 * - 152° = Regulus (House 5 / Leo) — North anchor
 * - 248° = Antares (House 8 / Scorpio) — West anchor
 * - 345° = Fomalhaut (House 11 / Aquarius) — South anchor
 * - 12 houses of 30° each
 */

// ─── K-Star Map Constants ─────────────────────────────────────────────────────

// Zodiac signs fixed to the firmament canopy
// Anchored by the Four Royal Stars:
//   Aldebaran at 45° = 15° Taurus (East)
//   Regulus at 125° = 5° Leo (North)
//   Antares at 225° = 15° Scorpio (West)
//   Fomalhaut at 310° = 10° Aquarius (South)
// Each sign = exactly 30°. Whole sign houses.
export const KSTAR_HOUSES = [
  { number: 1, sign: "Aries", symbol: "♈", start: 0 },
  { number: 2, sign: "Taurus", symbol: "♉", start: 30 }, // Aldebaran at 45° (15° Taurus)
  { number: 3, sign: "Gemini", symbol: "♊", start: 60 },
  { number: 4, sign: "Cancer", symbol: "♋", start: 90 },
  { number: 5, sign: "Leo", symbol: "♌", start: 120 }, // Regulus at 125° (5° Leo)
  { number: 6, sign: "Virgo", symbol: "♍", start: 150 },
  { number: 7, sign: "Libra", symbol: "♎", start: 180 },
  { number: 8, sign: "Scorpio", symbol: "♏", start: 210 }, // Antares at 225° (15° Scorpio)
  { number: 9, sign: "Sagittarius", symbol: "♐", start: 240 },
  { number: 10, sign: "Capricorn", symbol: "♑", start: 270 },
  { number: 11, sign: "Aquarius", symbol: "♒", start: 300 }, // Fomalhaut at 310° (10° Aquarius)
  { number: 12, sign: "Pisces", symbol: "♓", start: 330 },
];

// Royal Stars — The Four Watchers
// Positions locked to the firmament canopy (rotate with the dome)
// Aldebaran: 15° Taurus (East anchor)
// Antares: 15° Scorpio (West anchor) — exactly opposite Aldebaran
// Regulus: 5° Leo (North anchor)
// Fomalhaut: 10° Aquarius (South anchor)
export const ROYAL_STARS = [
  {
    name: "Aldebaran",
    mapAngle: 45,
    direction: "East",
    meaning: "Watcher of the East — 15° Taurus",
  },
  {
    name: "Regulus",
    mapAngle: 125,
    direction: "North",
    meaning: "Watcher of the North — 5° Leo",
  },
  {
    name: "Antares",
    mapAngle: 225,
    direction: "West",
    meaning: "Watcher of the West — 15° Scorpio",
  },
  {
    name: "Fomalhaut",
    mapAngle: 310,
    direction: "South",
    meaning: "Watcher of the South — 10° Aquarius",
  },
];

// ─── 28 Lunar Mansions (Manzil al-Qamar) ────────────────────────────────────
// Each mansion = 12.857° (360° ÷ 28)
// Fixed to the firmament canopy alongside the zodiac
export const LUNAR_MANSIONS = [
  {
    number: 1,
    name: "Al-Sharatain",
    start: 0,
    end: 12.857,
    sign: "Aries",
    meaning: "The Two Signs — beginnings, travel, new ventures",
  },
  {
    number: 2,
    name: "Al-Butain",
    start: 12.857,
    end: 25.714,
    sign: "Aries",
    meaning: "The Belly — hidden things, inner strength",
  },
  {
    number: 3,
    name: "Al-Thurayya",
    start: 25.714,
    end: 38.571,
    sign: "Taurus",
    meaning: "The Pleiades — abundance, beauty, the cluster",
  },
  {
    number: 4,
    name: "Al-Dabaran",
    start: 38.571,
    end: 51.429,
    sign: "Taurus",
    meaning: "The Follower — Aldebaran, power and honor",
  },
  {
    number: 5,
    name: "Al-Haqa",
    start: 51.429,
    end: 64.286,
    sign: "Taurus",
    meaning: "The White Spot — Orion's head, clarity",
  },
  {
    number: 6,
    name: "Al-Hana",
    start: 64.286,
    end: 77.143,
    sign: "Gemini",
    meaning: "The Mark — communication, twins",
  },
  {
    number: 7,
    name: "Al-Dhira",
    start: 77.143,
    end: 90.0,
    sign: "Gemini",
    meaning: "The Forearm — strength, reaching out",
  },
  {
    number: 8,
    name: "Al-Nathrah",
    start: 90.0,
    end: 102.857,
    sign: "Cancer",
    meaning: "The Gap — the Beehive cluster, nurturing",
  },
  {
    number: 9,
    name: "Al-Tarf",
    start: 102.857,
    end: 115.714,
    sign: "Cancer",
    meaning: "The Glance — the eye, perception",
  },
  {
    number: 10,
    name: "Al-Jabhah",
    start: 115.714,
    end: 128.571,
    sign: "Leo",
    meaning: "The Forehead — Regulus nearby, royalty",
  },
  {
    number: 11,
    name: "Al-Zubrah",
    start: 128.571,
    end: 141.429,
    sign: "Leo",
    meaning: "The Mane — the lion's mane, courage",
  },
  {
    number: 12,
    name: "Al-Sarfah",
    start: 141.429,
    end: 154.286,
    sign: "Leo",
    meaning: "The Changer — transformation, weather",
  },
  {
    number: 13,
    name: "Al-Awwa",
    start: 154.286,
    end: 167.143,
    sign: "Virgo",
    meaning: "The Barking Dog — service, analysis",
  },
  {
    number: 14,
    name: "Al-Simak",
    start: 167.143,
    end: 180.0,
    sign: "Virgo",
    meaning: "The Unarmed — Spica, harvest, abundance",
  },
  {
    number: 15,
    name: "Al-Ghafr",
    start: 180.0,
    end: 192.857,
    sign: "Libra",
    meaning: "The Cover — balance, protection",
  },
  {
    number: 16,
    name: "Al-Zubana",
    start: 192.857,
    end: 205.714,
    sign: "Libra",
    meaning: "The Claws — justice, weighing",
  },
  {
    number: 17,
    name: "Al-Iklil",
    start: 205.714,
    end: 218.571,
    sign: "Scorpio",
    meaning: "The Crown — the scorpion's crown, leadership",
  },
  {
    number: 18,
    name: "Al-Qalb",
    start: 218.571,
    end: 231.429,
    sign: "Scorpio",
    meaning: "The Heart — Antares, the heart of the scorpion",
  },
  {
    number: 19,
    name: "Al-Shaulah",
    start: 231.429,
    end: 244.286,
    sign: "Scorpio",
    meaning: "The Sting — the scorpion's tail, danger",
  },
  {
    number: 20,
    name: "Al-Naim",
    start: 244.286,
    end: 257.143,
    sign: "Sagittarius",
    meaning: "The Ostriches — wisdom, truth-seeking",
  },
  {
    number: 21,
    name: "Al-Baldah",
    start: 257.143,
    end: 270.0,
    sign: "Sagittarius",
    meaning: "The City — the empty place, solitude",
  },
  {
    number: 22,
    name: "Sad al-Dhabih",
    start: 270.0,
    end: 282.857,
    sign: "Capricorn",
    meaning: "The Lucky Stars of the Slaughterer — sacrifice",
  },
  {
    number: 23,
    name: "Sad Bula",
    start: 282.857,
    end: 295.714,
    sign: "Capricorn",
    meaning: "The Lucky Stars of the Swallower — healing",
  },
  {
    number: 24,
    name: "Sad al-Suud",
    start: 295.714,
    end: 308.571,
    sign: "Aquarius",
    meaning: "The Luckiest of the Lucky — good fortune",
  },
  {
    number: 25,
    name: "Sad al-Akhbiya",
    start: 308.571,
    end: 321.429,
    sign: "Aquarius",
    meaning: "The Lucky Stars of the Tents — shelter, Fomalhaut nearby",
  },
  {
    number: 26,
    name: "Al-Fargh al-Awwal",
    start: 321.429,
    end: 334.286,
    sign: "Pisces",
    meaning: "The First Spout — pouring water, flow",
  },
  {
    number: 27,
    name: "Al-Fargh al-Thani",
    start: 334.286,
    end: 347.143,
    sign: "Pisces",
    meaning: "The Second Spout — completion, cycles",
  },
  {
    number: 28,
    name: "Batn al-Hut",
    start: 347.143,
    end: 360.0,
    sign: "Pisces",
    meaning: "The Belly of the Fish — the end and the beginning",
  },
];

/**
 * Get the Lunar Mansion for a given map angle
 */
export function getLunarMansion(mapAngle: number): (typeof LUNAR_MANSIONS)[0] {
  const angle = ((mapAngle % 360) + 360) % 360;
  for (let i = LUNAR_MANSIONS.length - 1; i >= 0; i--) {
    if (angle >= LUNAR_MANSIONS[i].start) {
      return LUNAR_MANSIONS[i];
    }
  }
  return LUNAR_MANSIONS[27];
}

// ─── Planet Definitions ───────────────────────────────────────────────────────

/**
 * J2000 epoch: January 1, 2000, 12:00 UTC
 * Positions are in K-Star map degrees (0-360)
 * These are the mean longitudes converted to K-Star map coordinates
 */
export const KSTAR_PLANETS = [
  {
    name: "Sun",
    symbol: "☉",
    // Sun J2000 position calibrated to K-Star system
    // Verified: places Sun at 27.9° Scorpio on Nov 20 1986
    j2000Position: 278.88,
    // Sun moves 360° in 365.25 days
    dailyMotion: 360 / 365.25,
    color: "#FFD700",
    orbitalPeriodDays: 365.25,
  },
  {
    name: "Moon",
    symbol: "☽",
    // Moon was at ~218° ecliptic on J2000
    j2000Position: 218.0,
    // Moon moves 360° in 27.32 days
    dailyMotion: 360 / 27.32,
    color: "#C0C0C0",
    orbitalPeriodDays: 27.32,
  },
  {
    name: "Mercury",
    symbol: "☿",
    // Mercury was at ~283° on J2000
    j2000Position: 283.0,
    // Mercury moves 360° in 87.97 days (mean)
    dailyMotion: 360 / 87.97,
    color: "#B8B8B8",
    orbitalPeriodDays: 87.97,
  },
  {
    name: "Venus",
    symbol: "♀",
    // Venus was at ~271° on J2000
    j2000Position: 271.0,
    // Venus moves 360° in 224.7 days (mean)
    dailyMotion: 360 / 224.7,
    color: "#FFA500",
    orbitalPeriodDays: 224.7,
  },
  {
    name: "Mars",
    symbol: "♂",
    // Mars was at ~355° on J2000
    j2000Position: 355.0,
    // Mars moves 360° in 686.97 days (mean)
    dailyMotion: 360 / 686.97,
    color: "#FF4500",
    orbitalPeriodDays: 686.97,
  },
  {
    name: "Jupiter",
    symbol: "♃",
    // Jupiter was at ~35° on J2000
    j2000Position: 35.0,
    // Jupiter moves 360° in 4332.59 days (mean)
    dailyMotion: 360 / 4332.59,
    color: "#DAA520",
    orbitalPeriodDays: 4332.59,
  },
  {
    name: "Saturn",
    symbol: "♄",
    // Saturn was at ~49° on J2000
    j2000Position: 49.0,
    // Saturn moves 360° in 10759.22 days (mean)
    dailyMotion: 360 / 10759.22,
    color: "#8B7355",
    orbitalPeriodDays: 10759.22,
  },
  {
    name: "Uranus",
    symbol: "♅",
    // Uranus was at ~316° on J2000
    j2000Position: 316.0,
    // Uranus moves 360° in 30688.5 days (mean)
    dailyMotion: 360 / 30688.5,
    color: "#4FD0E7",
    orbitalPeriodDays: 30688.5,
  },
  {
    name: "Neptune",
    symbol: "♆",
    // Neptune was at ~302° on J2000
    j2000Position: 302.0,
    // Neptune moves 360° in 60182 days (mean)
    dailyMotion: 360 / 60182,
    color: "#4169E1",
    orbitalPeriodDays: 60182,
  },
  {
    name: "Pluto",
    symbol: "♇",
    // Pluto was at ~252° on J2000
    j2000Position: 252.0,
    // Pluto moves 360° in 90560 days (mean)
    dailyMotion: 360 / 90560,
    color: "#8B0000",
    orbitalPeriodDays: 90560,
  },
  {
    name: "Rahu",
    symbol: "☊",
    // Rahu (North Node) at J2000 was at ~125° on K-Star map
    // Nodes move RETROGRADE (backward) through the zodiac
    j2000Position: 125.0,
    // Rahu moves retrograde 360° in 6793.5 days (~18.6 years)
    // Negative = retrograde (moves backward/clockwise against zodiac)
    dailyMotion: -(360 / 6793.5),
    color: "#9370DB",
    orbitalPeriodDays: 6793.5,
  },
  {
    name: "Ketu",
    symbol: "☋",
    // Ketu (South Node) is always exactly opposite Rahu (180° away)
    // J2000 position = Rahu + 180°
    j2000Position: (125.0 + 180) % 360,
    // Ketu moves same speed as Rahu (retrograde)
    dailyMotion: -(360 / 6793.5),
    color: "#708090",
    orbitalPeriodDays: 6793.5,
  },
];

// ─── Core Calculation ─────────────────────────────────────────────────────────

/** J2000 epoch as a JavaScript timestamp */
const J2000_TIMESTAMP = Date.UTC(2000, 0, 1, 12, 0, 0); // Jan 1, 2000, 12:00 UTC

/**
 * Get the K-Star house for a given map angle
 */
export function getKStarHouse(mapAngle: number): {
  number: number;
  sign: string;
  symbol: string;
  start: number;
} {
  const angle = ((mapAngle % 360) + 360) % 360;
  for (let i = KSTAR_HOUSES.length - 1; i >= 0; i--) {
    if (angle >= KSTAR_HOUSES[i].start) {
      return KSTAR_HOUSES[i];
    }
  }
  return KSTAR_HOUSES[11]; // Pisces wraps around
}

/**
 * Get degree within house (0-30)
 */
export function getDegreeInHouse(mapAngle: number): number {
  const angle = ((mapAngle % 360) + 360) % 360;
  for (let i = KSTAR_HOUSES.length - 1; i >= 0; i--) {
    if (angle >= KSTAR_HOUSES[i].start) {
      return (((angle - KSTAR_HOUSES[i].start) % 30) + 30) % 30;
    }
  }
  return angle % 30;
}

/**
 * Check if a planet is near a Royal Star (within orb degrees)
 */
export function checkRoyalStarAlignment(mapAngle: number, orb = 6): string[] {
  const alignments: string[] = [];
  for (const star of ROYAL_STARS) {
    const diff = Math.abs(((mapAngle - star.mapAngle + 180) % 360) - 180);
    if (diff <= orb) {
      alignments.push(star.name);
    }
  }
  return alignments;
}

// ─── Calculated Planet Position ───────────────────────────────────────────────

export interface KStarPlanetPosition {
  name: string;
  symbol: string;
  color: string;
  /** K-Star map angle (0-360°) */
  mapAngle: number;
  /** Map radius from Polaris */
  mapRadius: number;
  /** Zodiac sign (fixed to firmament) */
  sign: string;
  /** Zodiac sign symbol */
  signSymbol: string;
  /** Degree within zodiac sign (0-30°) */
  degreeInSign: number;
  /** House number based on firmament rotation (1-12) */
  house: number;
  /** House name */
  houseName: string;
  /** Degree within house (0-30°) */
  degreeInHouse: number;
  /** Royal star alignments */
  royalStarAlignments: string[];
  /** Days since J2000 */
  daysSinceJ2000: number;
  /** Lunar mansion (for Moon especially) */
  lunarMansion?: { number: number; name: string; meaning: string };
}

/**
 * Calculate the Ascendant (House 1 cusp) based on firmament rotation.
 * The firmament rotates 360° in 24 hours = 15° per hour.
 * The Ascendant is the point on the K-Star dome that is rising on the
 * eastern horizon at the birth time and location.
 *
 * @param utcHour - UTC hour (0-23)
 * @param utcMinute - UTC minute (0-59)
 * @param longitude - Observer longitude in degrees (positive = east)
 * @returns Ascendant degree on the K-Star dome (0-360)
 */
// System Parameters (from K-Star Fixed-Plane / Rotating-Dome Model)
export const FIRMAMENT = {
  EARTH_PLANE_VELOCITY: 0.0, // mph - completely stationary
  AXIAL_TILT: 0.0, // degrees - no wobble, no tilt
  DEGREES_PER_DAY: 360.0, // firmament completes one full rotation per day
  DEGREES_PER_HOUR: 15.0, // 360 ÷ 24
  DEGREES_PER_MINUTE: 0.25, // 15 ÷ 60
  ROTATION_DIRECTION: "CLOCKWISE", // firmament rotates clockwise
  PLANET_DIRECTION: "COUNTERCLOCKWISE", // wandering stars move counterclockwise
  LOCK_STARS_TO_CANOPY: true,
  DISABLE_SIDEREAL_DRIFT: true,
  // Master calibration offset — locks system to Nov 20 1986 16:06 UTC Dallas
  // RAMC = (UTC_Hours × 15) - West_Longitude + 59.94
  // This places Sun at 27.9° Scorpio in House 11, Ascendant at 24.8° Sagittarius
  MASTER_OFFSET: 59.94,
};

/**
 * Calculate the RAMC (Right Ascension of the Meridian Culminating)
 * This is the degree of sky directly overhead at the birth time and location.
 *
 * Formula: RAMC = (UTC_Hours × 15) - West_Longitude + 59.94
 *
 * The Ascendant (House 1 cusp) is 90° before the RAMC (what's rising on the horizon)
 */
export function calculateAscendant(
  utcHour: number,
  utcMinute: number,
  longitude: number
): number {
  const utcHours = utcHour + utcMinute / 60;
  // West longitude is positive in common notation, subtract it
  const westLongitude = longitude < 0 ? -longitude : longitude;
  // RAMC = overhead degree (what's directly above)
  const ramc = (utcHours * 15 - westLongitude + FIRMAMENT.MASTER_OFFSET) % 360;
  // Ascendant = RAMC + 90° (calibrated to K-Star system)
  // Houses count CLOCKWISE from Ascendant
  // Verified: Nov 20 1986 16:06 UTC Dallas → Sun at 27.9° Scorpio in House 11 ✓
  const ascendant = (((ramc + 90) % 360) + 360) % 360;
  return ascendant;
}

/**
 * Get house number for a planet given the Ascendant position.
 * Houses are numbered 1-12 starting from the Ascendant.
 * Each house is 30° of the dome.
 *
 * @param planetAngle - Planet's dome angle (0-360)
 * @param ascendant - Ascendant degree (0-360)
 * @returns House number (1-12)
 */
export function getHouseFromAscendant(
  planetAngle: number,
  ascendant: number
): number {
  // Houses count CLOCKWISE from Ascendant
  // House 1 starts at Ascendant, House 2 is 30° clockwise, etc.
  const relativeAngle = (((planetAngle - ascendant) % 360) + 360) % 360;
  const house = Math.floor(relativeAngle / 30) + 1;
  return house > 12 ? 12 : house;
}

/**
 * Calculate all planet positions for a given date and observer location.
 * Includes firmament rotation for accurate house assignments.
 * Pure math — no API, no astronomy-engine, no spinning ball Earth.
 *
 * @param date - The UTC date/time to calculate for
 * @param longitude - Observer longitude (optional, for house calculation)
 * @returns Array of planet positions on the K-Star map
 */
export function calculateKStarPositions(
  date: Date,
  longitude?: number
): KStarPlanetPosition[] {
  const daysSinceJ2000 =
    (date.getTime() - J2000_TIMESTAMP) / (1000 * 60 * 60 * 24);

  // Calculate Ascendant based on firmament rotation
  const utcHour = date.getUTCHours();
  const utcMinute = date.getUTCMinutes();
  const lon = longitude ?? 0;
  const ascendant = calculateAscendant(utcHour, utcMinute, lon);

  // Calculate Ascendant and Descendant
  const descendant = (ascendant + 180) % 360;
  const ascZodiac = getKStarHouse(ascendant);
  const dscZodiac = getKStarHouse(descendant);
  const ascDegInSign = (((ascendant - ascZodiac.start) % 30) + 30) % 30;
  const dscDegInSign = (((descendant - dscZodiac.start) % 30) + 30) % 30;

  const ascendantPoint: KStarPlanetPosition = {
    name: "Ascendant",
    symbol: "Asc",
    color: "#FFFFFF",
    mapAngle: ascendant,
    mapRadius: 10 + (1 / 12) * 80,
    house: 1,
    houseName: "House 1",
    sign: ascZodiac.sign,
    signSymbol: ascZodiac.symbol,
    degreeInSign: ascDegInSign,
    degreeInHouse: 0,
    royalStarAlignments: checkRoyalStarAlignment(ascendant),
    daysSinceJ2000,
    lunarMansion: (() => {
      const m = getLunarMansion(ascendant);
      return { number: m.number, name: m.name, meaning: m.meaning };
    })(),
  };

  const descendantPoint: KStarPlanetPosition = {
    name: "Descendant",
    symbol: "Dsc",
    color: "#AAAAAA",
    mapAngle: descendant,
    mapRadius: 10 + (7 / 12) * 80,
    house: 7,
    houseName: "House 7",
    sign: dscZodiac.sign,
    signSymbol: dscZodiac.symbol,
    degreeInSign: dscDegInSign,
    degreeInHouse: 0,
    royalStarAlignments: checkRoyalStarAlignment(descendant),
    daysSinceJ2000,
    lunarMansion: (() => {
      const m = getLunarMansion(descendant);
      return { number: m.number, name: m.name, meaning: m.meaning };
    })(),
  };

  const planetPositions: KStarPlanetPosition[] = KSTAR_PLANETS.map(planet => {
    // Pure transit math: position = start + (days × daily motion)
    const rawAngle = planet.j2000Position + daysSinceJ2000 * planet.dailyMotion;
    // Normalize to 0-360
    const mapAngle = ((rawAngle % 360) + 360) % 360;

    // Zodiac sign from fixed firmament position (locked to canopy)
    const zodiacHouse = getKStarHouse(mapAngle);
    const sign = zodiacHouse.sign;
    const signSymbol = zodiacHouse.symbol;
    const degreeInSign = (((mapAngle - zodiacHouse.start) % 30) + 30) % 30;

    // House based on firmament rotation (Ascendant = House 1)
    const house = getHouseFromAscendant(mapAngle, ascendant);
    const houseName = `House ${house}`;

    // Degree within house (0-30)
    const houseStart = (((ascendant + (house - 1) * 30) % 360) + 360) % 360;
    const degreeInHouse = (((mapAngle - houseStart) % 30) + 30) % 30;

    const royalStarAlignments = checkRoyalStarAlignment(mapAngle);

    // Lunar Mansion (all planets get it, but Moon's is most significant)
    const mansion = getLunarMansion(mapAngle);

    // mapRadius: distance from Polaris center
    const mapRadius = 10 + (house / 12) * 80;

    return {
      name: planet.name,
      symbol: planet.symbol,
      color: planet.color,
      mapAngle,
      mapRadius,
      house,
      houseName,
      sign,
      signSymbol,
      degreeInSign,
      degreeInHouse,
      royalStarAlignments,
      daysSinceJ2000,
      lunarMansion: {
        number: mansion.number,
        name: mansion.name,
        meaning: mansion.meaning,
      },
    };
  });

  // ─── Arabic Lots (Parts) ────────────────────────────────────────────────────
  // Calculated from Ascendant, Sun, Moon, and other planet positions
  const sunAngle = planetPositions.find(p => p.name === "Sun")?.mapAngle ?? 0;
  const moonAngle = planetPositions.find(p => p.name === "Moon")?.mapAngle ?? 0;
  const venusAngle =
    planetPositions.find(p => p.name === "Venus")?.mapAngle ?? 0;
  const mercuryAngle =
    planetPositions.find(p => p.name === "Mercury")?.mapAngle ?? 0;
  const saturnAngle =
    planetPositions.find(p => p.name === "Saturn")?.mapAngle ?? 0;

  const makeLot = (
    name: string,
    symbol: string,
    color: string,
    angle: number
  ): KStarPlanetPosition => {
    const mapAngle = ((angle % 360) + 360) % 360;
    const zodiacH = getKStarHouse(mapAngle);
    const house = getHouseFromAscendant(mapAngle, ascendant);
    const houseStart = (((ascendant + (house - 1) * 30) % 360) + 360) % 360;
    const mansion = getLunarMansion(mapAngle);
    return {
      name,
      symbol,
      color,
      mapAngle,
      mapRadius: 10 + (house / 12) * 80,
      house,
      houseName: `House ${house}`,
      sign: zodiacH.sign,
      signSymbol: zodiacH.symbol,
      degreeInSign: (((mapAngle - zodiacH.start) % 30) + 30) % 30,
      degreeInHouse: (((mapAngle - houseStart) % 30) + 30) % 30,
      royalStarAlignments: checkRoyalStarAlignment(mapAngle),
      daysSinceJ2000,
      lunarMansion: {
        number: mansion.number,
        name: mansion.name,
        meaning: mansion.meaning,
      },
    };
  };

  const lotOfFortune = makeLot(
    "Lot of Fortune",
    "☉☽",
    "#FFD700",
    ascendant + moonAngle - sunAngle
  );
  const lotOfSpirit = makeLot(
    "Lot of Spirit",
    "☉☉",
    "#FFF8DC",
    ascendant + sunAngle - moonAngle
  );
  const lotOfKarma = makeLot(
    "Lot of Karma",
    "☿☽",
    "#9370DB",
    ascendant + mercuryAngle - moonAngle
  );
  const lotOfDeath = makeLot(
    "Lot of Death",
    "☠",
    "#8B0000",
    ascendant + saturnAngle - moonAngle
  );
  const lotOfEros = makeLot(
    "Lot of Eros",
    "♀♀",
    "#FF69B4",
    ascendant + venusAngle - (ascendant + sunAngle - moonAngle)
  );

  // Add Ascendant, Descendant, Rahu/Ketu, and Lots to the positions
  return [
    ascendantPoint,
    descendantPoint,
    ...planetPositions,
    lotOfFortune,
    lotOfSpirit,
    lotOfKarma,
    lotOfDeath,
    lotOfEros,
  ];
}

/**
 * Format K-Star chart positions as readable text for the natal chart textarea
 */
export function formatKStarPositions(
  planets: KStarPlanetPosition[],
  date: Date,
  locationName: string
): string {
  const lines: string[] = [];

  lines.push(`K-STAR NATAL CHART`);
  lines.push(`Date: ${date.toUTCString()}`);
  lines.push(`Location: ${locationName}`);
  lines.push(``);
  lines.push(`PLANETARY POSITIONS — K-STAR MAP SYSTEM`);
  lines.push(`─────────────────────────────────────────`);

  for (const p of planets) {
    const royal =
      p.royalStarAlignments.length > 0
        ? ` ★ near ${p.royalStarAlignments.join(", ")}`
        : "";
    const signDeg = p.degreeInSign.toFixed(1);
    const mansion = p.lunarMansion
      ? ` [Mansion ${p.lunarMansion.number}: ${p.lunarMansion.name}]`
      : "";
    lines.push(
      `${p.symbol} ${p.name}: ${signDeg}° ${p.sign}, ${p.houseName}${royal}${mansion}`
    );
  }

  lines.push(``);
  lines.push(`LUNAR MANSION PLACEMENTS`);
  lines.push(`─────────────────────────────────────────`);
  for (const p of planets) {
    if (p.lunarMansion) {
      lines.push(
        `${p.symbol} ${p.name} — Mansion ${p.lunarMansion.number}: ${p.lunarMansion.name}`
      );
      lines.push(`  ${p.lunarMansion.meaning}`);
    }
  }

  lines.push(`ROYAL STAR ANCHORS`);
  lines.push(`─────────────────────────────────────────`);
  for (const star of ROYAL_STARS) {
    lines.push(
      `${star.name} (${star.direction}): ${star.mapAngle}° — ${star.meaning}`
    );
  }

  return lines.join("\n");
}
