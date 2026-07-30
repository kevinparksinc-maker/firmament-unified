// ============================================================================
//   THE UNMOVING FIRMAMENT BASELINE (SINGLE SOURCE OF TRUTH)
//   Architecture: 360° Fixed Plane Grid centered at Polaris (0,0)
// ============================================================================

export type FirmamentSign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

// --- ANCHOR LAYER 1: THE 4 ROYAL PILLARS ---
export interface RoyalStarAnchor {
  name: string;
  sign: FirmamentSign;
  absoluteDegree: number; // Permanent address on the 360° layout
  quadrant: "East" | "North" | "West" | "South";
}

export const ROYAL_STAR_ANCHORS: Record<string, RoyalStarAnchor> = {
  ALDEBARAN: {
    name: "Aldebaran",
    sign: "Taurus",
    absoluteDegree: 45.0,
    quadrant: "East",
  },
  REGULUS: {
    name: "Regulus",
    sign: "Leo",
    absoluteDegree: 135.0,
    quadrant: "North",
  },
  ANTARES: {
    name: "Antares",
    sign: "Scorpio",
    absoluteDegree: 225.0,
    quadrant: "West",
  },
  FOMALHAUT: {
    name: "Fomalhaut",
    sign: "Aquarius",
    absoluteDegree: 315.0,
    quadrant: "South",
  },
};

// --- ANCHOR LAYER 2: THE 27 FIXED LUNAR MANSIONS (NAKSHATRAS) ---
// Total Sky (360°) / 27 Mansions = Exactly 13.3333° (13°20') per Nakshatra slot.
export const NAKSHATRA_NAMES = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];

export interface NakshatraData {
  index: number;
  name: string;
  startDegree: number;
  endDegree: number;
}

// --- CORE COORDINATE RESOLVER FUNCTIONS ---

/**
 * Maps any raw physical sky degree directly to its unmoving 12-Sign Sector.
 */
export function getFixedBackgroundSign(degree: number): FirmamentSign {
  const normalizedDeg = (degree % 360 + 360) % 360;

  if (normalizedDeg >= 0 && normalizedDeg < 30) return "Aries";
  if (normalizedDeg >= 30 && normalizedDeg < 60) return "Taurus"; // Aldebaran @ 45°
  if (normalizedDeg >= 60 && normalizedDeg < 90) return "Gemini";
  if (normalizedDeg >= 90 && normalizedDeg < 120) return "Cancer";
  if (normalizedDeg >= 120 && normalizedDeg < 150) return "Leo"; // Regulus @ 135°
  if (normalizedDeg >= 150 && normalizedDeg < 180) return "Virgo";
  if (normalizedDeg >= 180 && normalizedDeg < 210) return "Libra";
  if (normalizedDeg >= 210 && normalizedDeg < 240) return "Scorpio"; // Antares @ 225°
  if (normalizedDeg >= 240 && normalizedDeg < 270) return "Sagittarius";
  if (normalizedDeg >= 270 && normalizedDeg < 300) return "Capricorn";
  if (normalizedDeg >= 300 && normalizedDeg < 330) return "Aquarius"; // Fomalhaut @ 315°
  return "Pisces";
}

/**
 * DOUBLE CONFIRMATION LAYER: Resolves the exact fixed Nakshatra slot for a planet.
 */
export function getFixedNakshatra(degree: number): NakshatraData {
  const normalizedDeg = (degree % 360 + 360) % 360;
  const NAKSHATRA_WIDTH = 360 / 27;

  const index = Math.floor(normalizedDeg / NAKSHATRA_WIDTH);
  const name = NAKSHATRA_NAMES[index];

  return {
    index,
    name,
    startDegree: Number((index * NAKSHATRA_WIDTH).toFixed(4)),
    endDegree: Number(((index + 1) * NAKSHATRA_WIDTH).toFixed(4)),
  };
}

/**
 * VISUAL CANVAS ASSIGNMENT UTILITY
 * Translates an unadjusted degree directly into an X, Y coordinate for rendering.
 */
export function getCanvasCoordinates(
  degree: number,
  orbitRadius: number,
  canvasCenterX: number = 500,
  canvasCenterY: number = 500
) {
  const radians = (degree * Math.PI) / 180;
  return {
    x: canvasCenterX + orbitRadius * Math.cos(radians),
    y: canvasCenterY + orbitRadius * Math.sin(radians),
  };
}
