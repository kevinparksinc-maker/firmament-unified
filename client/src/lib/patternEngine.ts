/**
 * PATTERN ENGINE v3.0 - TRUTH LAYER
 *
 * Detects planetary patterns without interpretation bias.
 * Outputs raw patterns, tensions, and strengths.
 * No cheerleading. Just the mechanics.
 */

import type { PlanetPlacement } from "./astroEngine";

// ============================================================================
// TYPES
// ============================================================================

export type AstroFramework = "vedic" | "western" | "hybrid";

export interface PatternConfig {
  framework: AstroFramework;
  orbConjunction: number;
  orbOpposition: number;
  orbTrine: number;
  orbSquare: number;
  orbSextile: number;
  orbQuincunx: number;
  includeRahuKetu: boolean;
  includeOuterPlanets: boolean;
  includePlanetaryWar: boolean;
  includeParivartana: boolean;
  minimalPatternStrength: number;
}

export const DEFAULT_CONFIG: PatternConfig = {
  framework: "hybrid",
  orbConjunction: 7,
  orbOpposition: 7,
  orbTrine: 5,
  orbSquare: 5,
  orbSextile: 4,
  orbQuincunx: 3,
  includeRahuKetu: true,
  includeOuterPlanets: true,
  includePlanetaryWar: true,
  includeParivartana: true,
  minimalPatternStrength: 0.3,
};

export interface RawAspect {
  planet1: string;
  planet2: string;
  type:
    | "conjunction"
    | "opposition"
    | "trine"
    | "square"
    | "sextile"
    | "quincunx";
  angle: number;
  orb: number;
  strength: number;
  isHard: boolean;
  isSoft: boolean;
}

export interface PatternScore {
  name: string;
  strength: number;
  planets: string[];
  houses: number[];
  signs: string[];
  description: string;
  type:
    | "stellium"
    | "grand_trine"
    | "t_square"
    | "rahu_ketu_axis"
    | "parivartana"
    | "planetary_war";
}

export interface PlanetaryWar {
  planet1: string;
  planet2: string;
  winner: string;
  loser: string;
  degreeDiff: number;
}

export interface PlanetaryStrength {
  planet: string;
  rawStrength: number;
  isExalted: boolean;
  isDebilitated: boolean;
  isInOwnSign: boolean;
  isRetrograde: boolean;
}

export interface PatternAnalysis {
  aspects: RawAspect[];
  patterns: PatternScore[];
  wars: PlanetaryWar[];
  strengths: Record<string, PlanetaryStrength>;
  houseClusters: Record<number, string[]>;
  summary: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

function getAngleDiff(deg1: number, deg2: number): number {
  let diff = Math.abs(deg1 - deg2);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function getHouseDiff(house1: number, house2: number): number {
  let diff = Math.abs(house1 - house2);
  if (diff > 12) diff = 24 - diff;
  return diff;
}

// ============================================================================
// PLANETARY STRENGTH (Raw, no interpretation)
// ============================================================================

const EXALTATIONS: Record<string, string> = {
  Sun: "Aries",
  Moon: "Taurus",
  Mercury: "Virgo",
  Venus: "Pisces",
  Mars: "Capricorn",
  Jupiter: "Cancer",
  Saturn: "Libra",
  Uranus: "Scorpio",
  Neptune: "Aquarius",
  Pluto: "Leo",
};

const DEBILITATIONS: Record<string, string> = {
  Sun: "Libra",
  Moon: "Scorpio",
  Mercury: "Pisces",
  Venus: "Virgo",
  Mars: "Cancer",
  Jupiter: "Capricorn",
  Saturn: "Aries",
  Uranus: "Taurus",
  Neptune: "Leo",
  Pluto: "Aquarius",
};

const SIGN_RULERS: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Uranus",
  Pisces: "Neptune",
};

export function calculateRawStrength(
  planet: string,
  sign: string,
  rx: boolean
): PlanetaryStrength {
  let rawStrength = 0.5;
  const isExalted = EXALTATIONS[planet] === sign;
  const isDebilitated = DEBILITATIONS[planet] === sign;
  const isInOwnSign = SIGN_RULERS[sign] === planet;

  if (isExalted) rawStrength += 0.3;
  if (isDebilitated) rawStrength -= 0.3;
  if (isInOwnSign) rawStrength += 0.2;
  if (rx) rawStrength -= 0.1;

  rawStrength = Math.max(0.1, Math.min(0.95, rawStrength));

  return {
    planet,
    rawStrength,
    isExalted,
    isDebilitated,
    isInOwnSign,
    isRetrograde: rx,
  };
}

// ============================================================================
// ASPECT DETECTION (Pure geometry)
// ============================================================================

export function detectAspects(
  planets: Record<string, PlanetPlacement>,
  config: PatternConfig
): RawAspect[] {
  const aspects: RawAspect[] = [];
  const planetList = Object.entries(planets);

  const aspectDefs = [
    {
      type: "conjunction" as const,
      angle: 0,
      orb: config.orbConjunction,
      isHard: true,
      isSoft: false,
    },
    {
      type: "opposition" as const,
      angle: 180,
      orb: config.orbOpposition,
      isHard: true,
      isSoft: false,
    },
    {
      type: "square" as const,
      angle: 90,
      orb: config.orbSquare,
      isHard: true,
      isSoft: false,
    },
    {
      type: "trine" as const,
      angle: 120,
      orb: config.orbTrine,
      isHard: false,
      isSoft: true,
    },
    {
      type: "sextile" as const,
      angle: 60,
      orb: config.orbSextile,
      isHard: false,
      isSoft: true,
    },
    {
      type: "quincunx" as const,
      angle: 150,
      orb: config.orbQuincunx,
      isHard: true,
      isSoft: false,
    },
  ];

  for (let i = 0; i < planetList.length; i++) {
    for (let j = i + 1; j < planetList.length; j++) {
      const [name1, p1] = planetList[i];
      const [name2, p2] = planetList[j];

      if (p1.eclipticLon === null || p2.eclipticLon === null) continue;

      const diff = getAngleDiff(p1.eclipticLon, p2.eclipticLon);

      for (const def of aspectDefs) {
        const delta = Math.abs(diff - def.angle);
        if (delta <= def.orb) {
          const strength = 1 - delta / def.orb;
          aspects.push({
            planet1: name1,
            planet2: name2,
            type: def.type,
            angle: def.angle,
            orb: delta,
            strength,
            isHard: def.isHard,
            isSoft: def.isSoft,
          });
        }
      }
    }
  }

  return aspects.sort((a, b) => b.strength - a.strength);
}

// ============================================================================
// PATTERN DETECTION (No interpretation, just geometry)
// ============================================================================

export function detectStellium(
  planets: Record<string, PlanetPlacement>
): PatternScore | null {
  const bySign: Record<string, string[]> = {};

  for (const [name, p] of Object.entries(planets)) {
    if (!bySign[p.sign]) bySign[p.sign] = [];
    bySign[p.sign].push(name);
  }

  for (const [sign, planetList] of Object.entries(bySign)) {
    if (planetList.length >= 3) {
      return {
        name: `Stellium in ${sign}`,
        strength: Math.min(0.9, planetList.length / 5),
        planets: planetList,
        houses: planetList.map(p => planets[p]?.house || 0).filter(h => h > 0),
        signs: [sign],
        description: `${planetList.length} planets in ${sign}`,
        type: "stellium",
      };
    }
  }

  return null;
}

export function detectGrandTrine(
  aspects: RawAspect[],
  planets: Record<string, PlanetPlacement>
): PatternScore | null {
  const trines = aspects.filter(a => a.type === "trine" && a.strength > 0.6);

  for (let i = 0; i < trines.length; i++) {
    for (let j = i + 1; j < trines.length; j++) {
      const t1 = trines[i];
      const t2 = trines[j];

      const planetsSet = new Set([
        t1.planet1,
        t1.planet2,
        t2.planet1,
        t2.planet2,
      ]);

      if (planetsSet.size === 3) {
        const planetList = Array.from(planetsSet);
        return {
          name: "Grand Trine",
          strength: (t1.strength + t2.strength) / 2,
          planets: planetList,
          houses: planetList
            .map(p => planets[p]?.house || 0)
            .filter(h => h > 0),
          signs: planetList.map(p => planets[p]?.sign || ""),
          description: `Three planets in harmonious trine aspect`,
          type: "grand_trine",
        };
      }
    }
  }

  return null;
}

export function detectTSquare(
  aspects: RawAspect[],
  planets: Record<string, PlanetPlacement>
): PatternScore | null {
  const squares = aspects.filter(a => a.type === "square" && a.strength > 0.5);
  const oppositions = aspects.filter(
    a => a.type === "opposition" && a.strength > 0.5
  );

  for (const opp of oppositions) {
    const p1 = opp.planet1;
    const p2 = opp.planet2;

    const squareToP1 = squares.find(
      s =>
        (s.planet1 === p1 || s.planet2 === p1) &&
        s.planet1 !== p2 &&
        s.planet2 !== p2
    );

    const squareToP2 = squares.find(
      s =>
        (s.planet1 === p2 || s.planet2 === p2) &&
        s.planet1 !== p1 &&
        s.planet2 !== p1
    );

    if (squareToP1 && squareToP2) {
      const thirdPlanet =
        squareToP1.planet1 === p1 ? squareToP1.planet2 : squareToP1.planet1;
      if (
        thirdPlanet ===
        (squareToP2.planet1 === p2 ? squareToP2.planet2 : squareToP2.planet1)
      ) {
        return {
          name: `T-Square: ${p1}–${p2} opposition squared by ${thirdPlanet}`,
          strength:
            (opp.strength + squareToP1.strength + squareToP2.strength) / 3,
          planets: [p1, p2, thirdPlanet],
          houses: [p1, p2, thirdPlanet]
            .map(p => planets[p]?.house || 0)
            .filter(h => h > 0),
          signs: [p1, p2, thirdPlanet].map(p => planets[p]?.sign || ""),
          description: `Dynamic tension requiring action`,
          type: "t_square",
        };
      }
    }
  }

  return null;
}

export function detectRahuKetuAxis(
  planets: Record<string, PlanetPlacement>
): PatternScore | null {
  const rahu = planets["Rahu"] || planets["NorthNode"];
  const ketu = planets["Ketu"] || planets["SouthNode"];

  if (!rahu || !ketu || rahu.eclipticLon === null || ketu.eclipticLon === null)
    return null;

  const diff = getAngleDiff(rahu.eclipticLon, ketu.eclipticLon);
  const isOpposition = Math.abs(diff - 180) < 3;

  if (isOpposition) {
    return {
      name: "Rahu-Ketu Axis Active",
      strength: 0.85,
      planets: ["Rahu", "Ketu"],
      houses: [rahu.house || 0, ketu.house || 0],
      signs: [rahu.sign, ketu.sign],
      description: `Rahu in ${rahu.sign} (amplification) opposite Ketu in ${ketu.sign} (release)`,
      type: "rahu_ketu_axis",
    };
  }

  return null;
}

export function detectParivartana(
  planets: Record<string, PlanetPlacement>
): PatternScore | null {
  const planetList = Object.entries(planets);

  for (let i = 0; i < planetList.length; i++) {
    for (let j = i + 1; j < planetList.length; j++) {
      const [name1, p1] = planetList[i];
      const [name2, p2] = planetList[j];

      const ruler1 = SIGN_RULERS[p1.sign];
      const ruler2 = SIGN_RULERS[p2.sign];

      if (ruler1 === name2 && ruler2 === name1) {
        return {
          name: `Parivartana: ${name1} ↔ ${name2}`,
          strength: 0.8,
          planets: [name1, name2],
          houses: [p1.house || 0, p2.house || 0],
          signs: [p1.sign, p2.sign],
          description: `Mutual reception: ${name1} in ${name2}'s sign, ${name2} in ${name1}'s sign`,
          type: "parivartana",
        };
      }
    }
  }

  return null;
}

export function detectPlanetaryWar(
  planets: Record<string, PlanetPlacement>
): PlanetaryWar[] {
  const wars: PlanetaryWar[] = [];
  const planetList = Object.entries(planets);

  const PRIORITY: Record<string, number> = {
    Saturn: 5,
    Jupiter: 4,
    Pluto: 3.8,
    Rahu: 3.5,
    Ketu: 3.5,
    Mars: 3,
    Uranus: 3.2,
    Neptune: 3.1,
    Sun: 2,
    Venus: 2,
    Mercury: 2,
    Moon: 1.5,
  };

  for (let i = 0; i < planetList.length; i++) {
    for (let j = i + 1; j < planetList.length; j++) {
      const [name1, p1] = planetList[i];
      const [name2, p2] = planetList[j];

      if (p1.eclipticLon === null || p2.eclipticLon === null) continue;

      const diff = getAngleDiff(p1.eclipticLon, p2.eclipticLon);

      if (diff < 1.0) {
        const priority1 = PRIORITY[name1] || 1;
        const priority2 = PRIORITY[name2] || 1;
        const winner = priority1 > priority2 ? name1 : name2;
        const loser = priority1 > priority2 ? name2 : name1;

        wars.push({
          planet1: name1,
          planet2: name2,
          winner,
          loser,
          degreeDiff: diff,
        });
      }
    }
  }

  return wars;
}

// ============================================================================
// HOUSE CLUSTER DETECTION
// ============================================================================

export function detectHouseClusters(
  planets: Record<string, PlanetPlacement>
): Record<number, string[]> {
  const clusters: Record<number, string[]> = {};

  for (const [name, p] of Object.entries(planets)) {
    if (p.house && p.house >= 1 && p.house <= 12) {
      if (!clusters[p.house]) clusters[p.house] = [];
      clusters[p.house].push(name);
    }
  }

  return clusters;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function analyzePatterns(
  planets: Record<string, PlanetPlacement>,
  userConfig: Partial<PatternConfig> = {}
): PatternAnalysis {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Filter planets based on config
  let filteredPlanets = { ...planets };
  if (!config.includeRahuKetu) {
    delete filteredPlanets["Rahu"];
    delete filteredPlanets["Ketu"];
    delete filteredPlanets["NorthNode"];
    delete filteredPlanets["SouthNode"];
  }
  if (!config.includeOuterPlanets) {
    delete filteredPlanets["Uranus"];
    delete filteredPlanets["Neptune"];
    delete filteredPlanets["Pluto"];
  }

  // Detect everything
  const aspects = detectAspects(filteredPlanets, config);
  const wars = detectPlanetaryWar(filteredPlanets);

  const patterns: PatternScore[] = [];

  const stellium = detectStellium(filteredPlanets);
  if (stellium && stellium.strength >= config.minimalPatternStrength)
    patterns.push(stellium);

  const grandTrine = detectGrandTrine(aspects, filteredPlanets);
  if (grandTrine && grandTrine.strength >= config.minimalPatternStrength)
    patterns.push(grandTrine);

  const tSquare = detectTSquare(aspects, filteredPlanets);
  if (tSquare && tSquare.strength >= config.minimalPatternStrength)
    patterns.push(tSquare);

  const rahuKetu = detectRahuKetuAxis(filteredPlanets);
  if (rahuKetu && config.includeRahuKetu) patterns.push(rahuKetu);

  const parivartana = detectParivartana(filteredPlanets);
  if (parivartana && config.includeParivartana) patterns.push(parivartana);

  // Calculate strengths
  const strengths: Record<string, PlanetaryStrength> = {};
  for (const [name, p] of Object.entries(filteredPlanets)) {
    strengths[name] = calculateRawStrength(name, p.sign, p.rx);
  }

  const houseClusters = detectHouseClusters(filteredPlanets);

  // Generate summary (raw facts, no interpretation)
  const summaryParts: string[] = [];
  if (aspects.length > 0) {
    const hardAspects = aspects.filter(a => a.isHard).length;
    const softAspects = aspects.filter(a => a.isSoft).length;
    summaryParts.push(
      `${aspects.length} aspects (${hardAspects} hard, ${softAspects} soft)`
    );
  }
  if (patterns.length > 0) {
    summaryParts.push(
      `${patterns.length} pattern(s): ${patterns.map(p => p.type).join(", ")}`
    );
  }
  if (wars.length > 0) {
    summaryParts.push(`${wars.length} planetary war(s)`);
  }

  return {
    aspects,
    patterns: patterns.sort((a, b) => b.strength - a.strength),
    wars,
    strengths,
    houseClusters,
    summary: summaryParts.join(" · ") || "No significant patterns detected",
  };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export function getHardAspects(analysis: PatternAnalysis): RawAspect[] {
  return analysis.aspects.filter(a => a.isHard && a.strength > 0.6);
}

export function getSoftAspects(analysis: PatternAnalysis): RawAspect[] {
  return analysis.aspects.filter(a => a.isSoft && a.strength > 0.6);
}

export function getStrongestPlanets(
  analysis: PatternAnalysis,
  limit: number = 3
): string[] {
  return Object.values(analysis.strengths)
    .sort((a, b) => b.rawStrength - a.rawStrength)
    .slice(0, limit)
    .map(s => s.planet);
}

export function getWeakestPlanets(
  analysis: PatternAnalysis,
  limit: number = 3
): string[] {
  return Object.values(analysis.strengths)
    .sort((a, b) => a.rawStrength - b.rawStrength)
    .slice(0, limit)
    .map(s => s.planet);
}
