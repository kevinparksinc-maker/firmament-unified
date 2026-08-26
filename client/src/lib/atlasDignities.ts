export const STRICT_COMBUSTION_THRESHOLD_DEGREES = 15;
export const KAZIMI_THRESHOLD_DEGREES = 0.5;

export type EssentialDignityStatus =
  | "domicile"
  | "detriment"
  | "exaltation"
  | "fall"
  | "neutral"
  | "not-classically-assigned";

export type AtlasDignity = {
  status: EssentialDignityStatus;
  label: string;
  scope: "traditional seven planets" | "no classical assignment";
};

export type AtlasCombustion = {
  applicable: boolean;
  isKazimi: boolean;
  isCombust: boolean;
  status: "not-applicable" | "kazimi" | "combust" | "clear";
  angularDistance: number | null;
  threshold: number;
  rule: string;
};

const TRADITIONAL_PLANETS = new Set(["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"]);

const DOMICILES: Record<string, string[]> = {
  Sun: ["Leo"],
  Moon: ["Cancer"],
  Mercury: ["Gemini", "Virgo"],
  Venus: ["Taurus", "Libra"],
  Mars: ["Aries", "Scorpio"],
  Jupiter: ["Sagittarius", "Pisces"],
  Saturn: ["Capricorn", "Aquarius"],
};

const DETRIMENTS: Record<string, string[]> = {
  Sun: ["Aquarius"],
  Moon: ["Capricorn"],
  Mercury: ["Sagittarius", "Pisces"],
  Venus: ["Aries", "Scorpio"],
  Mars: ["Taurus", "Libra"],
  Jupiter: ["Gemini", "Virgo"],
  Saturn: ["Cancer", "Leo"],
};

const EXALTATIONS: Record<string, string> = {
  Sun: "Aries",
  Moon: "Taurus",
  Mercury: "Virgo",
  Venus: "Pisces",
  Mars: "Capricorn",
  Jupiter: "Cancer",
  Saturn: "Libra",
};

const FALLS: Record<string, string> = {
  Sun: "Libra",
  Moon: "Scorpio",
  Mercury: "Pisces",
  Venus: "Virgo",
  Mars: "Cancer",
  Jupiter: "Capricorn",
  Saturn: "Aries",
};

const normalize = (value: number) => ((value % 360) + 360) % 360;

export function shortestAngularDistance(first: number, second: number) {
  const difference = Math.abs(normalize(first) - normalize(second));
  return Math.min(difference, 360 - difference);
}

export function getAtlasDignity(planet: string, sign: string): AtlasDignity {
  if (!TRADITIONAL_PLANETS.has(planet)) {
    return { status: "not-classically-assigned", label: "No classical essential dignity assignment", scope: "no classical assignment" };
  }
  if (DOMICILES[planet]?.includes(sign)) {
    return { status: "domicile", label: "Domicile", scope: "traditional seven planets" };
  }
  if (EXALTATIONS[planet] === sign) {
    return { status: "exaltation", label: "Exaltation", scope: "traditional seven planets" };
  }
  if (DETRIMENTS[planet]?.includes(sign)) {
    return { status: "detriment", label: "Detriment", scope: "traditional seven planets" };
  }
  if (FALLS[planet] === sign) {
    return { status: "fall", label: "Fall", scope: "traditional seven planets" };
  }
  return { status: "neutral", label: "Neutral essential dignity", scope: "traditional seven planets" };
}

export function getStrictCombustion(planet: string, longitude: number, sunLongitude: number): AtlasCombustion {
  const applicable = planet !== "Sun";
  const angularDistance = applicable ? shortestAngularDistance(longitude, sunLongitude) : null;
  const isKazimi = angularDistance !== null && angularDistance <= KAZIMI_THRESHOLD_DEGREES;
  const isCombust = angularDistance !== null && !isKazimi && angularDistance <= STRICT_COMBUSTION_THRESHOLD_DEGREES;
  return {
    applicable,
    isKazimi,
    isCombust,
    status: !applicable ? "not-applicable" : isKazimi ? "kazimi" : isCombust ? "combust" : "clear",
    angularDistance,
    threshold: STRICT_COMBUSTION_THRESHOLD_DEGREES,
    rule: "Strict raw tropical longitude: shortest Sun–planet distance ≤ 15.0°",
  };
}
