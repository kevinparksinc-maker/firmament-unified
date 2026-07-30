// Decans - 36 divisions, 10° each
// Source: Egyptian/Hellenistic tradition. Lightweight flavor layer.

export const DECAN_DATA: Record<
  string,
  Record<number, { ruler: string; flavor: string }>
> = {
  Aries: {
    1: { ruler: "Mars", flavor: "raw impulse" },
    2: { ruler: "Sun", flavor: "visible leadership" },
    3: { ruler: "Jupiter", flavor: "expansive risk" },
  },
  Taurus: {
    1: { ruler: "Mercury", flavor: "practical mind" },
    2: { ruler: "Moon", flavor: "emotional roots" },
    3: { ruler: "Saturn", flavor: "patient build" },
  },
  Gemini: {
    1: { ruler: "Jupiter", flavor: "playful curiosity" },
    2: { ruler: "Mars", flavor: "sharp wit" },
    3: { ruler: "Sun", flavor: "expressive voice" },
  },
  Cancer: {
    1: { ruler: "Venus", flavor: "nurturing touch" },
    2: { ruler: "Mercury", flavor: "moody mind" },
    3: { ruler: "Moon", flavor: "deep feeling" },
  },
  Leo: {
    1: { ruler: "Saturn", flavor: "disciplined show" },
    2: { ruler: "Jupiter", flavor: "generous heart" },
    3: { ruler: "Mars", flavor: "fiery will" },
  },
  Virgo: {
    1: { ruler: "Sun", flavor: "organized mind" },
    2: { ruler: "Venus", flavor: "practical beauty" },
    3: { ruler: "Mercury", flavor: "analytical depth" },
  },
  Libra: {
    1: { ruler: "Moon", flavor: "emotional balance" },
    2: { ruler: "Saturn", flavor: "fair judgment" },
    3: { ruler: "Jupiter", flavor: "social grace" },
  },
  Scorpio: {
    1: { ruler: "Mars", flavor: "intense drive" },
    2: { ruler: "Sun", flavor: "magnetic presence" },
    3: { ruler: "Venus", flavor: "transformative desire" },
  },
  Sagittarius: {
    1: { ruler: "Mercury", flavor: "restless search" },
    2: { ruler: "Moon", flavor: "wandering soul" },
    3: { ruler: "Saturn", flavor: "disciplined vision" },
  },
  Capricorn: {
    1: { ruler: "Jupiter", flavor: "ambitious reach" },
    2: { ruler: "Mars", flavor: "strategic climb" },
    3: { ruler: "Sun", flavor: "authority earned" },
  },
  Aquarius: {
    1: { ruler: "Venus", flavor: "eccentric charm" },
    2: { ruler: "Mercury", flavor: "innovative mind" },
    3: { ruler: "Moon", flavor: "emotional detachment" },
  },
  Pisces: {
    1: { ruler: "Saturn", flavor: "structured dream" },
    2: { ruler: "Jupiter", flavor: "expansive vision" },
    3: { ruler: "Mars", flavor: "mystic drive" },
  },
};

export function getDecanFlavor(sign: string, degree: number): string {
  const decanNum = Math.floor(degree / 10) + 1;
  return DECAN_DATA[sign]?.[decanNum]?.flavor || "";
}

export function getDecanRuler(sign: string, degree: number): string {
  const decanNum = Math.floor(degree / 10) + 1;
  return DECAN_DATA[sign]?.[decanNum]?.ruler || "";
}

// Wrapper functions for Home.tsx compatibility
export function getDecan(signIndex: number, degrees: number): number {
  return Math.floor(degrees / 10) + 1;
}

export function getDecanLord(signIndex: number, degrees: number): string {
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
  const sign = signs[signIndex];
  return getDecanRuler(sign, degrees);
}
