import {
  calculatePlacidusEventChart,
  eventPlanetAt,
  normalizeDegrees,
  shortestArc,
  signAt,
  type EventChartRequest,
  type EventPlanet,
  type TraditionalPlanetName,
  type ZodiacSign,
} from "./eventChartService";

export const TAJIKA_PRASNA_VERSION = "tajika-prasna-v1" as const;
export type TajikaOrientation = "standard" | "inverse-180";
export type TajikaSide = "A" | "B";
export type TajikaOutcome = "side-a" | "side-b" | "no-call";

const TRADITIONAL_RULERS: Record<ZodiacSign, TraditionalPlanetName> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};

const TAJIKA_ORBS: Record<TraditionalPlanetName, number> = {
  Sun: 15, Moon: 12, Mars: 8, Mercury: 7, Jupiter: 9, Venus: 7, Saturn: 9,
};

const SPEED_ORDER: TraditionalPlanetName[] = [
  "Moon", "Mercury", "Venus", "Sun", "Mars", "Jupiter", "Saturn",
];

const WAR_PLANETS: TraditionalPlanetName[] = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
const WAR_AUTHORITY: Record<(typeof WAR_PLANETS)[number], number> = {
  Saturn: 5, Jupiter: 4, Venus: 3, Mercury: 2, Mars: 1,
};

type TajikaRole = "L1" | "L10" | "L7" | "L4";
type TajikaYogaKind = "Itthashala" | "Muthashila" | "Eesaphala";
type TajikaRelation = "friendly" | "hostile";

export type TajikaPrasnaInput = EventChartRequest & {
  favoriteName: string;
  challengerName: string;
  favoriteSource: string;
  venueName: string;
  orientation?: TajikaOrientation;
};

export type TajikaSignificator = {
  role: TajikaRole;
  side: TajikaSide;
  cusp: 1 | 4 | 7 | 10;
  cuspLongitude: number;
  cuspSign: ZodiacSign;
  ruler: TraditionalPlanetName;
  planet: EventPlanet;
  sharedRoles: TajikaRole[];
};

export type TajikaYoga = {
  kind: TajikaYogaKind;
  first: TraditionalPlanetName;
  second: TraditionalPlanetName;
  faster: TraditionalPlanetName;
  slower: TraditionalPlanetName;
  relation: TajikaRelation;
  relativeHouses: string;
  aspect: 0 | 60 | 90 | 120 | 180;
  initialOrb: number;
  permittedOrb: number;
  perfectionUtcIso: string | null;
  minutesFromStart: number | null;
  reason: string;
};

export type TajikaBridge = {
  side: TajikaSide;
  kind: "Nakta" | "Yamaya";
  bridge: TraditionalPlanetName;
  firstLink: TajikaYoga;
  secondLink: TajikaYoga;
  reason: string;
};

export type TajikaWar = {
  first: TraditionalPlanetName;
  second: TraditionalPlanetName;
  separation: number;
  winner: TraditionalPlanetName;
  loser: TraditionalPlanetName;
  rule: string;
  involvesPrincipalSignificator: boolean;
};

export type TajikaEventPlanetEvidence = EventPlanet & {
  house: number;
};

export type TajikaPrasnaResult = {
  version: typeof TAJIKA_PRASNA_VERSION;
  orientation: TajikaOrientation;
  method: "Tajika / Prasna event chart";
  status: "ready" | "no-call";
  outcome: TajikaOutcome;
  verdict: string;
  reason: string;
  event: {
    venueName: string;
    favoriteName: string;
    challengerName: string;
    favoriteSource: string;
    eventUtcIso: string;
    houseSystem: "Placidus";
    houseEngine: string;
    zodiac: "tropical";
  };
  settings: {
    source: "Tajik Yogas in Prasna Shastra (reviewed implementation reference)";
    aspectPolicy: "relative-house 5/9, 3/11, 4/10, and 1/7 relations";
    perPlanetOrbs: Record<TraditionalPlanetName, number>;
    muthashilaOrb: 1;
    eesaphalaMinimumSeparation: 1;
    grahaYuddhaOrb: 1;
  };
  cusps: Array<{ house: number; longitude: number; sign: ZodiacSign }>;
  planets: TajikaEventPlanetEvidence[];
  significators: TajikaSignificator[];
  sideALink: TajikaYoga | null;
  sideBLink: TajikaYoga | null;
  separations: TajikaYoga[];
  bridges: TajikaBridge[];
  kamboola: Array<{ side: TajikaSide; moonLink: TajikaYoga; teamLink: TajikaYoga }>;
  grahaYuddha: TajikaWar[];
  conflicts: string[];
};

function rotate(longitude: number, orientation: TajikaOrientation): number {
  return orientation === "inverse-180" ? normalizeDegrees(longitude + 180) : longitude;
}

function transformedPlanet(planet: EventPlanet, orientation: TajikaOrientation): EventPlanet {
  const longitude = rotate(planet.longitude, orientation);
  return { ...planet, longitude, sign: signAt(longitude), degreeInSign: longitude % 30 };
}

function speedIndex(name: TraditionalPlanetName): number {
  return SPEED_ORDER.indexOf(name);
}

function getPlanet(planets: EventPlanet[], name: TraditionalPlanetName): EventPlanet {
  const planet = planets.find(item => item.name === name);
  if (!planet) throw new Error(`Missing required traditional planet: ${name}.`);
  return planet;
}

function relativeRelation(first: EventPlanet, second: EventPlanet): {
  relation: TajikaRelation;
  relativeHouses: string;
  aspect: 0 | 60 | 90 | 120 | 180;
} | null {
  const firstSign = Math.floor(first.longitude / 30);
  const secondSign = Math.floor(second.longitude / 30);
  const forward = (secondSign - firstSign + 12) % 12;
  const houseDistance = forward + 1;
  if (houseDistance === 5 || houseDistance === 9) return { relation: "friendly", relativeHouses: `${houseDistance}/${houseDistance === 5 ? 9 : 5}`, aspect: 120 };
  if (houseDistance === 3 || houseDistance === 11) return { relation: "friendly", relativeHouses: `${houseDistance}/${houseDistance === 3 ? 11 : 3}`, aspect: 60 };
  if (houseDistance === 4 || houseDistance === 10) return { relation: "hostile", relativeHouses: `${houseDistance}/${houseDistance === 4 ? 10 : 4}`, aspect: 90 };
  if (houseDistance === 1) return { relation: "hostile", relativeHouses: "1/1", aspect: 0 };
  if (houseDistance === 7) return { relation: "hostile", relativeHouses: "7/7", aspect: 180 };
  return null;
}

function aspectError(first: number, second: number, aspect: number): number {
  return Math.abs(shortestArc(first, second) - aspect);
}

function houseForLongitude(longitude: number, cusps: number[]): number {
  for (let index = 0; index < cusps.length; index += 1) {
    const start = cusps[index]!;
    const end = cusps[(index + 1) % cusps.length]!;
    const span = normalizeDegrees(end - start);
    const offset = normalizeDegrees(longitude - start);
    if (offset < span || Math.abs(offset - span) < 0.0001) return index + 1;
  }
  throw new Error("Unable to assign the live planet to a Placidus house.");
}

function refinePerfection(
  faster: TraditionalPlanetName,
  slower: TraditionalPlanetName,
  aspect: 0 | 60 | 90 | 120 | 180,
  startDate: Date,
  estimateMinutes: number,
  orientation: TajikaOrientation,
): { date: Date; error: number } {
  let best = { date: new Date(startDate.getTime() + estimateMinutes * 60_000), error: Number.POSITIVE_INFINITY };
  for (let offset = -120; offset <= 120; offset += 5) {
    const date = new Date(startDate.getTime() + (estimateMinutes + offset) * 60_000);
    const fast = transformedPlanet(eventPlanetAt(faster, date), orientation);
    const slow = transformedPlanet(eventPlanetAt(slower, date), orientation);
    const error = aspectError(fast.longitude, slow.longitude, aspect);
    if (error < best.error) best = { date, error };
  }
  for (let offset = -5; offset <= 5; offset += 0.25) {
    const date = new Date(best.date.getTime() + offset * 60_000);
    const fast = transformedPlanet(eventPlanetAt(faster, date), orientation);
    const slow = transformedPlanet(eventPlanetAt(slower, date), orientation);
    const error = aspectError(fast.longitude, slow.longitude, aspect);
    if (error < best.error) best = { date, error };
  }
  return best;
}

function calculateYoga(
  first: EventPlanet,
  second: EventPlanet,
  startDate: Date,
  orientation: TajikaOrientation,
): TajikaYoga | null {
  const relation = relativeRelation(first, second);
  if (!relation) return null;
  const faster = speedIndex(first.name) < speedIndex(second.name) ? first : second;
  const slower = faster === first ? second : first;
  const permittedOrb = Math.min(TAJIKA_ORBS[first.name], TAJIKA_ORBS[second.name]);
  const initialOrb = aspectError(first.longitude, second.longitude, relation.aspect);
  if (initialOrb > permittedOrb) return null;

  const currentRelative = normalizeDegrees(faster.longitude - slower.longitude);
  const positiveTarget = relation.aspect;
  const negativeTarget = relation.aspect === 0 || relation.aspect === 180 ? relation.aspect : 360 - relation.aspect;
  const targetRelative = Math.abs(currentRelative - positiveTarget) <= Math.abs(currentRelative - negativeTarget)
    ? positiveTarget
    : negativeTarget;
  const relativeSpeed = faster.speedDegreesPerDay - slower.speedDegreesPerDay;
  const forwardGap = normalizeDegrees(targetRelative - currentRelative);
  const backwardGap = normalizeDegrees(currentRelative - targetRelative);

  if (faster.speedDegreesPerDay > 0 && relativeSpeed > 0 && forwardGap > 0.02 && forwardGap <= permittedOrb) {
    const estimateMinutes = forwardGap / relativeSpeed * 24 * 60;
    const refined = refinePerfection(faster.name, slower.name, relation.aspect, startDate, estimateMinutes, orientation);
    if (refined.error <= 0.05) {
      const kind: TajikaYogaKind = initialOrb <= 1 ? "Muthashila" : "Itthashala";
      return {
        kind,
        first: first.name,
        second: second.name,
        faster: faster.name,
        slower: slower.name,
        relation: relation.relation,
        relativeHouses: relation.relativeHouses,
        aspect: relation.aspect,
        initialOrb,
        permittedOrb,
        perfectionUtcIso: refined.date.toISOString(),
        minutesFromStart: (refined.date.getTime() - startDate.getTime()) / 60_000,
        reason: `${faster.name} is the faster traditional body, behind ${slower.name} in a ${relation.relativeHouses} ${relation.relation} relation, and perfects the ${relation.aspect}° aspect in the forward search.`,
      };
    }
  }

  if (relativeSpeed > 0 && backwardGap >= 1 && backwardGap <= permittedOrb) {
    return {
      kind: "Eesaphala",
      first: first.name,
      second: second.name,
      faster: faster.name,
      slower: slower.name,
      relation: relation.relation,
      relativeHouses: relation.relativeHouses,
      aspect: relation.aspect,
      initialOrb,
      permittedOrb,
      perfectionUtcIso: null,
      minutesFromStart: null,
      reason: `${faster.name} is beyond the relevant ${relation.aspect}° perfection point by ${backwardGap.toFixed(2)}°; this is recorded as separating Eesaphala/Musaripha, not completion evidence.`,
    };
  }

  return null;
}

function labelOutcome(outcome: TajikaOutcome, favorite: string, challenger: string): string {
  if (outcome === "side-a") return `SIDE A FAVORED — ${favorite} — experimental`;
  if (outcome === "side-b") return `SIDE B FAVORED — ${challenger} — experimental`;
  return "NO DECISIVE TAJIKA COMPLETION — NO CALL";
}

export function calculateTajikaPrasnaEvent(input: TajikaPrasnaInput): TajikaPrasnaResult {
  const orientation = input.orientation ?? "standard";
  const baseChart = calculatePlacidusEventChart(input);
  const cusps = baseChart.cusps.map(cusp => rotate(cusp, orientation));
  const planets = baseChart.planets.map(planet => transformedPlanet(planet, orientation));
  const planetEvidence: TajikaEventPlanetEvidence[] = planets.map(planet => ({
    ...planet,
    house: houseForLongitude(planet.longitude, cusps),
  }));
  const roleDefinitions: Array<{ role: TajikaRole; side: TajikaSide; cusp: 1 | 4 | 7 | 10 }> = [
    { role: "L1", side: "A", cusp: 1 }, { role: "L10", side: "A", cusp: 10 },
    { role: "L7", side: "B", cusp: 7 }, { role: "L4", side: "B", cusp: 4 },
  ];
  const rawSignificators = roleDefinitions.map(definition => {
    const cuspLongitude = cusps[definition.cusp - 1]!;
    const cuspSign = signAt(cuspLongitude);
    const ruler = TRADITIONAL_RULERS[cuspSign];
    return { ...definition, cuspLongitude, cuspSign, ruler, planet: getPlanet(planets, ruler) };
  });
  const rolesByRuler = new Map<TraditionalPlanetName, TajikaRole[]>();
  rawSignificators.forEach(item => rolesByRuler.set(item.ruler, [...(rolesByRuler.get(item.ruler) ?? []), item.role]));
  const significators: TajikaSignificator[] = rawSignificators.map(item => ({ ...item, sharedRoles: rolesByRuler.get(item.ruler) ?? [] }));

  const l1 = significators.find(item => item.role === "L1")!;
  const l10 = significators.find(item => item.role === "L10")!;
  const l7 = significators.find(item => item.role === "L7")!;
  const l4 = significators.find(item => item.role === "L4")!;
  const sideALink = l1.ruler === l10.ruler ? null : calculateYoga(l1.planet, l10.planet, input.utcDate, orientation);
  const sideBLink = l7.ruler === l4.ruler ? null : calculateYoga(l7.planet, l4.planet, input.utcDate, orientation);
  const allPairYogas = planets.flatMap((first, index) => planets.slice(index + 1).map(second => calculateYoga(first, second, input.utcDate, orientation)).filter((item): item is TajikaYoga => Boolean(item)));
  const separations = allPairYogas.filter(item => item.kind === "Eesaphala");

  const bridges: TajikaBridge[] = [];
  const findBridge = (side: TajikaSide, first: TajikaSignificator, second: TajikaSignificator, direct: TajikaYoga | null) => {
    if (direct && direct.kind !== "Eesaphala") return;
    for (const bridge of planets) {
      if (bridge.name === first.ruler || bridge.name === second.ruler) continue;
      const firstLink = calculateYoga(first.planet, bridge, input.utcDate, orientation);
      const secondLink = calculateYoga(bridge, second.planet, input.utcDate, orientation);
      if (!firstLink || !secondLink || firstLink.kind === "Eesaphala" || secondLink.kind === "Eesaphala") continue;
      const bridgeSpeed = speedIndex(bridge.name);
      const endpointSpeeds = [speedIndex(first.ruler), speedIndex(second.ruler)];
      const kind = bridgeSpeed > Math.max(...endpointSpeeds)
        ? "Yamaya"
        : bridgeSpeed > Math.min(...endpointSpeeds) && bridgeSpeed < Math.max(...endpointSpeeds)
          ? "Nakta"
          : null;
      if (!kind) continue;
      bridges.push({
        side,
        kind,
        bridge: bridge.name,
        firstLink,
        secondLink,
        reason: `${bridge.name} supplies two qualifying completion links between ${first.ruler} and ${second.ruler} with the declared ${kind} speed relation.`,
      });
      break;
    }
  };
  findBridge("A", l1, l10, sideALink);
  findBridge("B", l7, l4, sideBLink);

  const kamboola: TajikaPrasnaResult["kamboola"] = [];
  for (const [side, direct] of [["A", sideALink], ["B", sideBLink]] as const) {
    if (!direct || direct.kind === "Eesaphala") continue;
    for (const endpoint of [direct.first, direct.second]) {
      if (endpoint === "Moon") continue;
      const moonLink = calculateYoga(getPlanet(planets, "Moon"), getPlanet(planets, endpoint), input.utcDate, orientation);
      if (moonLink && moonLink.kind !== "Eesaphala") kamboola.push({ side, moonLink, teamLink: direct });
    }
  }

  const principalRulers = new Set(significators.map(item => item.ruler));
  const grahaYuddha: TajikaWar[] = [];
  for (let index = 0; index < WAR_PLANETS.length; index += 1) {
    for (let other = index + 1; other < WAR_PLANETS.length; other += 1) {
      const first = getPlanet(planets, WAR_PLANETS[index]!);
      const second = getPlanet(planets, WAR_PLANETS[other]!);
      const separation = shortestArc(first.longitude, second.longitude);
      if (separation > 1) continue;
      const winner = WAR_AUTHORITY[first.name as keyof typeof WAR_AUTHORITY] >= WAR_AUTHORITY[second.name as keyof typeof WAR_AUTHORITY] ? first.name : second.name;
      const loser = winner === first.name ? second.name : first.name;
      grahaYuddha.push({
        first: first.name,
        second: second.name,
        separation,
        winner,
        loser,
        rule: "Detected at ≤1° among Mercury/Venus/Mars/Jupiter/Saturn; v1 authority ordering Saturn > Jupiter > Venus > Mercury > Mars is displayed as supporting evidence only.",
        involvesPrincipalSignificator: principalRulers.has(first.name) || principalRulers.has(second.name),
      });
    }
  }

  const conflicts: string[] = [];
  if (l1.ruler === l10.ruler) conflicts.push(`Side A shares ${l1.ruler} as L1 and L10; no independent Side A completion pair exists.`);
  if (l7.ruler === l4.ruler) conflicts.push(`Side B shares ${l7.ruler} as L7 and L4; no independent Side B completion pair exists.`);
  const sharedAcrossSides = significators.filter(item => item.sharedRoles.some(role => significators.find(other => other.role === role)?.side !== item.side));
  if (sharedAcrossSides.length > 0) conflicts.push(`Shared significator across sides: ${[...new Set(sharedAcrossSides.map(item => item.ruler))].join(", ")}.`);

  const sideACompletion = sideALink && sideALink.kind !== "Eesaphala";
  const sideBCompletion = sideBLink && sideBLink.kind !== "Eesaphala";
  let outcome: TajikaOutcome = "no-call";
  let reason = "Neither side has the required direct L1–L10 or L7–L4 Tajika completion link.";
  if (sideACompletion && sideBCompletion) {
    conflicts.push("Both sides have a direct Tajika completion link.");
    reason = "Both side-pairs have qualifying direct completion evidence, so the v1 conflict rule abstains.";
  } else if (sideACompletion && conflicts.length === 0) {
    outcome = "side-a";
    reason = `Side A has a direct ${sideALink!.kind} link between ${l1.ruler} (L1) and ${l10.ruler} (L10), while Side B has no direct completion link.`;
  } else if (sideBCompletion && conflicts.length === 0) {
    outcome = "side-b";
    reason = `Side B has a direct ${sideBLink!.kind} link between ${l7.ruler} (L7) and ${l4.ruler} (L4), while Side A has no direct completion link.`;
  } else if (conflicts.length > 0) {
    reason = conflicts.join(" ");
  }

  return {
    version: TAJIKA_PRASNA_VERSION,
    orientation,
    method: "Tajika / Prasna event chart",
    status: outcome === "no-call" ? "no-call" : "ready",
    outcome,
    verdict: labelOutcome(outcome, input.favoriteName, input.challengerName),
    reason,
    event: {
      venueName: input.venueName,
      favoriteName: input.favoriteName,
      challengerName: input.challengerName,
      favoriteSource: input.favoriteSource,
      eventUtcIso: baseChart.eventUtcIso,
      houseSystem: baseChart.houseSystem,
      houseEngine: baseChart.houseEngine,
      zodiac: baseChart.zodiac,
    },
    settings: {
      source: "Tajik Yogas in Prasna Shastra (reviewed implementation reference)",
      aspectPolicy: "relative-house 5/9, 3/11, 4/10, and 1/7 relations",
      perPlanetOrbs: TAJIKA_ORBS,
      muthashilaOrb: 1,
      eesaphalaMinimumSeparation: 1,
      grahaYuddhaOrb: 1,
    },
    cusps: cusps.map((longitude, index) => ({ house: index + 1, longitude, sign: signAt(longitude) })),
    planets: planetEvidence,
    significators,
    sideALink,
    sideBLink,
    separations,
    bridges,
    kamboola,
    grahaYuddha,
    conflicts,
  };
}
