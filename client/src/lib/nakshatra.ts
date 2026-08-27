// FIRMAMENT MODEL: 27 fixed Nakshatras, 13°20' each, no precession.
// Absolute degrees 0–360, starting at 0° Aries = 0°.

export interface Nakshatra {
  index: number;
  name: string;
  startAbs: number;
  endAbs: number;
  lord: string;
  startSignDeg: string;
  endSignDeg: string;
}

const lords = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
];

const nakshatraNames = [
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
  "Svati",
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

const step = 360 / 27;
const BOUNDARY_EPSILON = 1e-10;

function absToSignDeg(abs: number): string {
  const signs = [
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
  let deg = abs;
  const signIndex = Math.floor(deg / 30) % 12;
  const inSign = deg % 30;
  const d = Math.floor(inSign);
  const m = Math.floor((inSign - d) * 60);
  return `${d.toString().padStart(2, "0")}° ${m.toString().padStart(2, "0")}' ${signs[signIndex]}`;
}

export const NAKSHATRAS: Nakshatra[] = nakshatraNames.map((name, i) => {
  const startAbs = i * step;
  const endAbs = (i + 1) * step;
  const lord = lords[i % lords.length];
  return {
    index: i + 1,
    name,
    startAbs,
    endAbs,
    lord,
    startSignDeg: absToSignDeg(startAbs),
    endSignDeg: absToSignDeg(endAbs),
  };
});

export function getNakshatraAt(absDeg: number): {
  nakshatra: Nakshatra;
  pada: number;
} {
  const deg = ((absDeg % 360) + 360) % 360;
  // JavaScript's modulo can represent a mathematically exact repeating-decimal
  // boundary (for example 360 / 27) a few ulps below that boundary. The tiny
  // guard preserves the declared half-open intervals: boundary belongs to the
  // next mansion; it is not an expanded interpretive orb.
  const boundaryAdjusted = Math.min(360 - BOUNDARY_EPSILON, deg + BOUNDARY_EPSILON);
  const mansionIndex = Math.floor(boundaryAdjusted / step);
  const nakshatra = NAKSHATRAS[mansionIndex]!;
  const padaSize = step / 4;
  const offset = boundaryAdjusted - nakshatra.startAbs;
  const pada = Math.min(4, Math.floor(offset / padaSize) + 1);
  return { nakshatra, pada };
}
