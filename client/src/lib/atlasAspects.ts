import { shortestAngularDistance } from "./atlasDignities";

export const ATLAS_ASPECTS_REGISTRY = {
  version: "atlas-aspects-v1",
  majorAspects: [
    { type: "conjunction", angle: 0, orb: 8 },
    { type: "sextile", angle: 60, orb: 4 },
    { type: "square", angle: 90, orb: 6 },
    { type: "trine", angle: 120, orb: 6 },
    { type: "opposition", angle: 180, orb: 8 },
    { type: "quincunx", angle: 150, orb: 3 },
  ],
  angularContactOrb: 5,
  stelliumMinimum: 3,
  rule: "All aspect and configuration geometry uses the active live tropical longitudes. House stelliums use the active direct-Ascendant Equal Houses.",
} as const;

export type AtlasAspectType = typeof ATLAS_ASPECTS_REGISTRY.majorAspects[number]["type"];
export type AtlasAspectState = "applying" | "separating" | "exact" | "static-angle";

export type AtlasAspectPoint = {
  key: string;
  name: string;
  kind: "planet" | "node" | "angle";
  longitude: number;
  speedDegreesPerDay?: number | null;
  sign?: string;
  house?: number;
};

export type AtlasAspect = {
  first: string;
  second: string;
  type: AtlasAspectType;
  angle: number;
  separation: number;
  orb: number;
  orbLimit: number;
  state: AtlasAspectState;
  rule: string;
};

export type AtlasAngularContact = {
  planet: string;
  angle: "Ascendant" | "Descendant" | "Midheaven" | "Imum Coeli";
  distance: number;
  orbLimit: number;
  rule: string;
};

export type AtlasStellium = {
  scope: "sign" | "Equal House";
  location: string;
  planets: string[];
  minimum: number;
  rule: string;
};

export type AtlasDispositorChain = {
  planet: string;
  sign: string;
  immediateRuler: string;
  chain: string[];
  terminal: string;
  isLoop: boolean;
  rule: string;
};

export type AtlasMutualReception = {
  first: string;
  second: string;
  firstSign: string;
  secondSign: string;
  rule: string;
};

export type AtlasConfigurationType = "Grand Trine" | "T-Square" | "Grand Cross" | "Yod" | "Kite";
export type AtlasConfiguration = {
  type: AtlasConfigurationType;
  planets: string[];
  evidence: string;
  rule: string;
};

export type AtlasAspectScan = {
  aspects: AtlasAspect[];
  angularContacts: AtlasAngularContact[];
  stelliums: AtlasStellium[];
  dispositorChains: AtlasDispositorChain[];
  mutualReceptions: AtlasMutualReception[];
  configurations: AtlasConfiguration[];
};

const SIGN_RULERS: Record<string, string> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon", Leo: "Sun", Virgo: "Mercury",
  Libra: "Venus", Scorpio: "Mars", Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};

const exactCombinations = <T>(items: T[], size: number) => {
  const results: T[][] = [];
  const choose = (start: number, chosen: T[]) => {
    if (chosen.length === size) { results.push(chosen); return; }
    for (let index = start; index <= items.length - (size - chosen.length); index += 1) choose(index + 1, [...chosen, items[index] as T]);
  };
  choose(0, []);
  return results;
};

const pairKey = (first: string, second: string) => [first, second].sort().join("|");

function nearestAspect(first: AtlasAspectPoint, second: AtlasAspectPoint): AtlasAspect | null {
  const separation = shortestAngularDistance(first.longitude, second.longitude);
  const definition = ATLAS_ASPECTS_REGISTRY.majorAspects
    .map(item => ({ ...item, orbDistance: Math.abs(separation - item.angle) }))
    .filter(item => item.orbDistance <= item.orb)
    .sort((a, b) => a.orbDistance - b.orbDistance)[0];
  if (!definition) return null;

  const firstSpeed = first.speedDegreesPerDay;
  const secondSpeed = second.speedDegreesPerDay;
  let state: AtlasAspectState = "static-angle";
  if (typeof firstSpeed === "number" && typeof secondSpeed === "number") {
    const projectedSeparation = shortestAngularDistance(first.longitude + firstSpeed, second.longitude + secondSpeed);
    const projectedOrb = Math.abs(projectedSeparation - definition.angle);
    state = definition.orbDistance < 0.01 ? "exact" : projectedOrb < definition.orbDistance ? "applying" : "separating";
  }
  return {
    first: first.name,
    second: second.name,
    type: definition.type,
    angle: definition.angle,
    separation,
    orb: definition.orbDistance,
    orbLimit: definition.orb,
    state,
    rule: `Live tropical ${definition.type}: ${definition.angle}° ± ${definition.orb}°; state compares the current orb with a one-day projection from recorded longitude speeds.`,
  };
}

export function findAtlasAspects(planets: AtlasAspectPoint[]): AtlasAspect[] {
  const aspects: AtlasAspect[] = [];
  for (let index = 0; index < planets.length; index += 1) {
    for (let compare = index + 1; compare < planets.length; compare += 1) {
      const first = planets[index];
      const second = planets[compare];
      if (!first || !second) continue;
      const aspect = nearestAspect(first, second);
      if (aspect) aspects.push(aspect);
    }
  }
  return aspects.sort((a, b) => a.orb - b.orb);
}

export function findAtlasAngularContacts(planets: AtlasAspectPoint[], angles: AtlasAspectPoint[]): AtlasAngularContact[] {
  const supportedAngles = new Set(["Ascendant", "Descendant", "Midheaven", "Imum Coeli"]);
  return planets.flatMap(planet => angles
    .filter(angle => supportedAngles.has(angle.name))
    .map(angle => ({ planet, angle, distance: shortestAngularDistance(planet.longitude, angle.longitude) }))
    .filter(contact => contact.distance <= ATLAS_ASPECTS_REGISTRY.angularContactOrb)
    .map(contact => ({
      planet: contact.planet.name,
      angle: contact.angle.name as AtlasAngularContact["angle"],
      distance: contact.distance,
      orbLimit: ATLAS_ASPECTS_REGISTRY.angularContactOrb,
      rule: `Live tropical planet-to-angle contact within ${ATLAS_ASPECTS_REGISTRY.angularContactOrb}° of the active direct-chart angle.`,
    })));
}

export function findAtlasStelliums(planets: AtlasAspectPoint[]): AtlasStellium[] {
  const signGroups = new Map<string, string[]>();
  const houseGroups = new Map<number, string[]>();
  for (const planet of planets) {
    if (planet.sign) signGroups.set(planet.sign, [...(signGroups.get(planet.sign) ?? []), planet.name]);
    if (planet.house) houseGroups.set(planet.house, [...(houseGroups.get(planet.house) ?? []), planet.name]);
  }
  const fromGroups = <T extends string | number>(groups: Map<T, string[]>, scope: AtlasStellium["scope"], location: (key: T) => string) =>
    [...groups.entries()]
      .filter(([, planetsInGroup]) => planetsInGroup.length >= ATLAS_ASPECTS_REGISTRY.stelliumMinimum)
      .map(([key, planetsInGroup]) => ({
        scope,
        location: location(key),
        planets: planetsInGroup,
        minimum: ATLAS_ASPECTS_REGISTRY.stelliumMinimum,
        rule: `${ATLAS_ASPECTS_REGISTRY.stelliumMinimum}+ live planets in the same ${scope === "sign" ? "tropical sign" : "direct-Ascendant Equal House"}.`,
      }));
  return [...fromGroups(signGroups, "sign", key => key), ...fromGroups(houseGroups, "Equal House", key => `House ${key}`)];
}

export function findAtlasDispositorChains(planets: AtlasAspectPoint[]): AtlasDispositorChain[] {
  const byName = new Map(planets.map(planet => [planet.name, planet]));
  return planets.map(root => {
    let current = root;
    const chain = [root.name];
    const seen = new Set([root.name]);
    let isLoop = false;
    while (current.sign) {
      const ruler = SIGN_RULERS[current.sign];
      if (!ruler) break;
      chain.push(ruler);
      if (seen.has(ruler)) { isLoop = true; break; }
      seen.add(ruler);
      const next = byName.get(ruler);
      if (!next) break;
      current = next;
    }
    return {
      planet: root.name,
      sign: root.sign ?? "Unknown",
      immediateRuler: SIGN_RULERS[root.sign ?? ""] ?? "Unassigned",
      chain,
      terminal: chain[chain.length - 1] ?? root.name,
      isLoop,
      rule: "Traditional sign rulers only; chain follows each live planet's tropical sign ruler until a loop or unavailable ruler occurs.",
    };
  });
}

export function findAtlasMutualReceptions(planets: AtlasAspectPoint[]): AtlasMutualReception[] {
  const byName = new Map(planets.map(planet => [planet.name, planet]));
  const receptions: AtlasMutualReception[] = [];
  for (let index = 0; index < planets.length; index += 1) {
    for (let compare = index + 1; compare < planets.length; compare += 1) {
      const first = planets[index];
      const second = planets[compare];
      if (!first || !second || !first.sign || !second.sign) continue;
      if (SIGN_RULERS[first.sign] === second.name && SIGN_RULERS[second.sign] === first.name && byName.has(first.name) && byName.has(second.name)) {
        receptions.push({ first: first.name, second: second.name, firstSign: first.sign, secondSign: second.sign, rule: "Traditional mutual reception: each planet occupies a sign ruled by the other." });
      }
    }
  }
  return receptions;
}

function configurationEvidence(planets: AtlasAspectPoint[], aspects: AtlasAspect[], expected: Record<string, AtlasAspectType>) {
  return Object.entries(expected).every(([pair, type]) => aspects.some(aspect => pairKey(aspect.first, aspect.second) === pair && aspect.type === type));
}

export function findAtlasConfigurations(planets: AtlasAspectPoint[], aspects: AtlasAspect[]): AtlasConfiguration[] {
  const configurations: AtlasConfiguration[] = [];
  const emitted = new Set<string>();
  const add = (type: AtlasConfigurationType, bodies: AtlasAspectPoint[], evidence: string) => {
    const key = `${type}:${bodies.map(body => body.name).sort().join("|")}`;
    if (!emitted.has(key)) {
      emitted.add(key);
      configurations.push({ type, planets: bodies.map(body => body.name), evidence, rule: "Configuration requires the explicitly detected live tropical aspects and their declared orb limits in atlas-aspects-v1." });
    }
  };

  for (const trio of exactCombinations(planets, 3)) {
    const [a, b, c] = trio;
    if (!a || !b || !c) continue;
    const ab = pairKey(a.name, b.name); const ac = pairKey(a.name, c.name); const bc = pairKey(b.name, c.name);
    if (configurationEvidence(trio, aspects, { [ab]: "trine", [ac]: "trine", [bc]: "trine" })) add("Grand Trine", trio, "Three declared trines among the three planets.");
    const pairs = [ab, ac, bc];
    const opposition = pairs.find(pair => aspects.some(aspect => pairKey(aspect.first, aspect.second) === pair && aspect.type === "opposition"));
    if (opposition) {
      const others = pairs.filter(pair => pair !== opposition);
      if (others.every(pair => aspects.some(aspect => pairKey(aspect.first, aspect.second) === pair && aspect.type === "square"))) add("T-Square", trio, "One declared opposition plus two declared squares.");
    }
    const sextile = pairs.find(pair => aspects.some(aspect => pairKey(aspect.first, aspect.second) === pair && aspect.type === "sextile"));
    if (sextile) {
      const others = pairs.filter(pair => pair !== sextile);
      if (others.every(pair => aspects.some(aspect => pairKey(aspect.first, aspect.second) === pair && aspect.type === "quincunx"))) add("Yod", trio, "One declared sextile plus two declared quincunxes to the apex.");
    }
  }

  for (const quartet of exactCombinations(planets, 4)) {
    const [a, b, c, d] = quartet;
    if (!a || !b || !c || !d) continue;
    const pairs = exactCombinations(quartet, 2).map(pair => pairKey((pair[0] as AtlasAspectPoint).name, (pair[1] as AtlasAspectPoint).name));
    const oppositions = pairs.filter(pair => aspects.some(aspect => pairKey(aspect.first, aspect.second) === pair && aspect.type === "opposition"));
    const squares = pairs.filter(pair => aspects.some(aspect => pairKey(aspect.first, aspect.second) === pair && aspect.type === "square"));
    if (oppositions.length === 2 && squares.length === 4) add("Grand Cross", quartet, "Two declared oppositions plus four declared squares.");
  }

  for (const trine of configurations.filter(configuration => configuration.type === "Grand Trine")) {
    const trineBodies = trine.planets.map(name => planets.find(planet => planet.name === name)).filter((planet): planet is AtlasAspectPoint => Boolean(planet));
    for (const candidate of planets.filter(planet => !trine.planets.includes(planet.name))) {
      const types = trineBodies.map(body => aspects.find(aspect => pairKey(aspect.first, aspect.second) === pairKey(candidate.name, body.name))?.type);
      if (types.filter(type => type === "opposition").length === 1 && types.filter(type => type === "sextile").length === 2) add("Kite", [...trineBodies, candidate], "A Grand Trine plus one declared opposition to a trine vertex and declared sextiles to the other two.");
    }
  }
  return configurations;
}

export function calculateAtlasAspectScan(planets: AtlasAspectPoint[], angles: AtlasAspectPoint[]): AtlasAspectScan {
  const aspects = findAtlasAspects(planets);
  return {
    aspects,
    angularContacts: findAtlasAngularContacts(planets, angles),
    stelliums: findAtlasStelliums(planets),
    dispositorChains: findAtlasDispositorChains(planets),
    mutualReceptions: findAtlasMutualReceptions(planets),
    configurations: findAtlasConfigurations(planets, aspects),
  };
}
