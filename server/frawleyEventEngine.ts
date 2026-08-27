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

export const FRAWLEY_EVENT_VERSION = "frawley-event-v1" as const;

const RULER_BY_SIGN: Record<ZodiacSign, TraditionalPlanetName> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};

const FRAWLEY_ASPECTS = [0, 60, 90, 120, 180] as const;

export type FrawleyOrientation = "standard" | "inverse-180";
export type FrawleySide = "A" | "B";
export type FrawleyOutcome = "side-a" | "side-b" | "no-call";

export type FrawleyEventInput = EventChartRequest & {
  favoriteName: string;
  challengerName: string;
  favoriteSource: string;
  venueName: string;
  orientation?: FrawleyOrientation;
};

type FrawleyRole = "L1" | "L10" | "L7" | "L4";

export type FrawleySignificator = {
  role: FrawleyRole;
  side: FrawleySide;
  cusp: 1 | 4 | 7 | 10;
  cuspLongitude: number;
  cuspSign: ZodiacSign;
  ruler: TraditionalPlanetName;
  planet: EventPlanet;
  sharedRoles: FrawleyRole[];
};

export type FrawleyAngularEvidence = {
  role: FrawleyRole;
  side: FrawleySide;
  ruler: TraditionalPlanetName;
  targetCusp: 1 | 4 | 7 | 10;
  cuspLongitude: number;
  separation: number;
  thresholdClass: "core angular" | "extended angular evidence" | "outside configured range";
  motion: "applying" | "separating" | "exact" | "indeterminate";
  projectedPerfectionHours: number | null;
  relation: string;
};

export type FrawleyMoonCandidate = {
  target: TraditionalPlanetName;
  aspect: (typeof FRAWLEY_ASPECTS)[number];
  perfectionUtcIso: string;
  minutesFromStart: number;
  initialOrb: number;
  perfectionError: number;
  targetRoles: FrawleyRole[];
  targetSides: FrawleySide[];
};

export type FrawleyResult = {
  version: typeof FRAWLEY_EVENT_VERSION;
  orientation: FrawleyOrientation;
  method: "Frawley event chart";
  status: "ready" | "no-call";
  outcome: FrawleyOutcome;
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
    coreAngularOrb: 3;
    extendedAngularOrb: 5;
    moonMaximumInitialOrb: 5;
    moonSearchHorizonHours: 48;
    conjunctionStopsSequence: true;
    combustionReviewOrb: 2;
  };
  cusps: Array<{ house: number; longitude: number; sign: ZodiacSign }>;
  significators: FrawleySignificator[];
  angularEvidence: FrawleyAngularEvidence[];
  moon: {
    startLongitude: number;
    startSign: ZodiacSign;
    signExitUtcIso: string | null;
    conjunctionStopUtcIso: string | null;
    candidates: FrawleyMoonCandidate[];
    finalCandidate: FrawleyMoonCandidate | null;
  };
  supportingEvidence: Array<{
    kind: "combustion" | "node";
    status: "present" | "clear" | "not-configured";
    description: string;
  }>;
  conflicts: string[];
};

function rotate(longitude: number, orientation: FrawleyOrientation): number {
  return orientation === "inverse-180" ? normalizeDegrees(longitude + 180) : longitude;
}

function getPlanet(planets: EventPlanet[], name: TraditionalPlanetName): EventPlanet {
  const planet = planets.find(item => item.name === name);
  if (!planet) throw new Error(`Missing required traditional planet: ${name}.`);
  return planet;
}

function transformedPlanet(planet: EventPlanet, orientation: FrawleyOrientation): EventPlanet {
  const longitude = rotate(planet.longitude, orientation);
  return { ...planet, longitude, sign: signAt(longitude), degreeInSign: longitude % 30 };
}

function angularMotion(planet: EventPlanet, cuspLongitude: number): {
  motion: FrawleyAngularEvidence["motion"];
  projectedPerfectionHours: number | null;
} {
  const signedDifference = normalizeDegrees(planet.longitude - cuspLongitude);
  const delta = signedDifference > 180 ? signedDifference - 360 : signedDifference;
  if (Math.abs(delta) < 0.02) return { motion: "exact", projectedPerfectionHours: 0 };
  if (!Number.isFinite(planet.speedDegreesPerDay) || Math.abs(planet.speedDegreesPerDay) < 0.00001) {
    return { motion: "indeterminate", projectedPerfectionHours: null };
  }
  const applying = (delta < 0 && planet.speedDegreesPerDay > 0) || (delta > 0 && planet.speedDegreesPerDay < 0);
  return {
    motion: applying ? "applying" : "separating",
    projectedPerfectionHours: applying ? Math.abs(delta / planet.speedDegreesPerDay) * 24 : null,
  };
}

function angularRelation(longitude: number, cusps: number[]): string {
  for (let index = 0; index < cusps.length; index += 1) {
    const start = cusps[index]!;
    const end = cusps[(index + 1) % cusps.length]!;
    const span = normalizeDegrees(end - start);
    const offset = normalizeDegrees(longitude - start);
    if (offset < span || Math.abs(offset - span) < 0.0001) return `inside House ${index + 1}`;
  }
  return "house relation unavailable";
}

function aspectError(first: number, second: number, aspect: number): number {
  const difference = shortestArc(first, second);
  return Math.abs(difference - aspect);
}

function refineMoonPerfection(
  target: TraditionalPlanetName,
  aspect: number,
  startDate: Date,
  approximateMinutes: number,
  orientation: FrawleyOrientation,
): { date: Date; error: number } {
  let best = { date: new Date(startDate.getTime() + approximateMinutes * 60_000), error: Number.POSITIVE_INFINITY };
  for (let offset = -120; offset <= 120; offset += 5) {
    const date = new Date(startDate.getTime() + (approximateMinutes + offset) * 60_000);
    const moon = transformedPlanet(eventPlanetAt("Moon", date), orientation);
    const targetPlanet = transformedPlanet(eventPlanetAt(target, date), orientation);
    const error = aspectError(moon.longitude, targetPlanet.longitude, aspect);
    if (error < best.error) best = { date, error };
  }
  for (let offset = -5; offset <= 5; offset += 0.25) {
    const date = new Date(best.date.getTime() + offset * 60_000);
    const moon = transformedPlanet(eventPlanetAt("Moon", date), orientation);
    const targetPlanet = transformedPlanet(eventPlanetAt(target, date), orientation);
    const error = aspectError(moon.longitude, targetPlanet.longitude, aspect);
    if (error < best.error) best = { date, error };
  }
  return best;
}

function findMoonSignExit(startDate: Date, startSign: ZodiacSign, orientation: FrawleyOrientation): Date | null {
  for (let minutes = 10; minutes <= 48 * 60; minutes += 10) {
    const candidate = new Date(startDate.getTime() + minutes * 60_000);
    if (signAt(rotate(eventPlanetAt("Moon", candidate).longitude, orientation)) !== startSign) return candidate;
  }
  return null;
}

function labelOutcome(outcome: FrawleyOutcome, favorite: string, challenger: string): string {
  if (outcome === "side-a") return `SIDE A FAVORED — ${favorite} — experimental`;
  if (outcome === "side-b") return `SIDE B FAVORED — ${challenger} — experimental`;
  return "CONFLICT OR INSUFFICIENT DECISIVE EVIDENCE — NO CALL";
}

export function calculateFrawleyEvent(input: FrawleyEventInput): FrawleyResult {
  const orientation = input.orientation ?? "standard";
  const baseChart = calculatePlacidusEventChart(input);
  const cusps = baseChart.cusps.map(cusp => rotate(cusp, orientation));
  const planets = baseChart.planets.map(planet => transformedPlanet(planet, orientation));
  const cuspRows = cusps.map((longitude, index) => ({ house: index + 1, longitude, sign: signAt(longitude) }));

  const roleDefinitions: Array<{ role: FrawleyRole; side: FrawleySide; cusp: 1 | 4 | 7 | 10 }> = [
    { role: "L1", side: "A", cusp: 1 }, { role: "L10", side: "A", cusp: 10 },
    { role: "L7", side: "B", cusp: 7 }, { role: "L4", side: "B", cusp: 4 },
  ];
  const unshared = roleDefinitions.map(definition => {
    const cuspLongitude = cusps[definition.cusp - 1]!;
    const cuspSign = signAt(cuspLongitude);
    const ruler = RULER_BY_SIGN[cuspSign];
    return { ...definition, cuspLongitude, cuspSign, ruler, planet: getPlanet(planets, ruler) };
  });
  const rolesByRuler = new Map<TraditionalPlanetName, FrawleyRole[]>();
  unshared.forEach(item => rolesByRuler.set(item.ruler, [...(rolesByRuler.get(item.ruler) ?? []), item.role]));
  const significators: FrawleySignificator[] = unshared.map(item => ({
    ...item,
    sharedRoles: rolesByRuler.get(item.ruler) ?? [],
  }));

  const keyCusps: Array<1 | 4 | 7 | 10> = [1, 4, 7, 10];
  const angularEvidence = significators.flatMap(significator => keyCusps.map(targetCusp => {
    const cuspLongitude = cusps[targetCusp - 1]!;
    const separation = shortestArc(significator.planet.longitude, cuspLongitude);
    const thresholdClass = separation <= 3 ? "core angular" : separation <= 5 ? "extended angular evidence" : "outside configured range";
    const motion = angularMotion(significator.planet, cuspLongitude);
    return {
      role: significator.role,
      side: significator.side,
      ruler: significator.ruler,
      targetCusp,
      cuspLongitude,
      separation,
      thresholdClass,
      motion: motion.motion,
      projectedPerfectionHours: motion.projectedPerfectionHours,
      relation: separation <= 0.02 ? "on cusp" : angularRelation(significator.planet.longitude, cusps),
    };
  }));

  const moon = getPlanet(planets, "Moon");
  const signExit = findMoonSignExit(input.utcDate, moon.sign, orientation);
  const signExitMs = signExit?.getTime() ?? input.utcDate.getTime() + 48 * 60 * 60 * 1000;
  const candidates: FrawleyMoonCandidate[] = [];
  for (const target of baseChart.planets.filter(planet => planet.name !== "Moon")) {
    const orientedTarget = transformedPlanet(target, orientation);
    const relativeSpeed = moon.speedDegreesPerDay - orientedTarget.speedDegreesPerDay;
    if (relativeSpeed <= 0) continue;
    for (const aspect of FRAWLEY_ASPECTS) {
      const currentRelative = normalizeDegrees(moon.longitude - orientedTarget.longitude);
      const exactPositions = aspect === 0 || aspect === 180 ? [aspect] : [aspect, 360 - aspect];
      for (const exactPosition of exactPositions) {
        const gap = normalizeDegrees(exactPosition - currentRelative);
        const initialOrb = aspectError(moon.longitude, orientedTarget.longitude, aspect);
        const approximateMinutes = gap / relativeSpeed * 24 * 60;
        if (gap < 0.02 || initialOrb > 5 || approximateMinutes > 48 * 60) continue;
        const refined = refineMoonPerfection(target.name, aspect, input.utcDate, approximateMinutes, orientation);
        if (refined.date.getTime() > signExitMs || refined.error > 0.05) continue;
        const targetRoles = rolesByRuler.get(target.name) ?? [];
        const targetSides = [...new Set(significators.filter(item => item.ruler === target.name).map(item => item.side))];
        if (!candidates.some(existing => existing.target === target.name && existing.aspect === aspect && Math.abs(existing.minutesFromStart - approximateMinutes) < 20)) {
          candidates.push({
            target: target.name,
            aspect,
            perfectionUtcIso: refined.date.toISOString(),
            minutesFromStart: (refined.date.getTime() - input.utcDate.getTime()) / 60_000,
            initialOrb,
            perfectionError: refined.error,
            targetRoles,
            targetSides,
          });
        }
      }
    }
  }
  candidates.sort((first, second) => first.minutesFromStart - second.minutesFromStart);
  const conjunctionStop = candidates.find(candidate => candidate.aspect === 0) ?? null;
  const allowedCandidates = conjunctionStop
    ? candidates.filter(candidate => candidate.minutesFromStart <= conjunctionStop.minutesFromStart + 0.25)
    : candidates;
  const finalCandidate = allowedCandidates.length > 0 ? allowedCandidates[allowedCandidates.length - 1]! : null;

  const conflicts: string[] = [];
  const sharedAcrossSides = significators.filter(item => item.sharedRoles.some(role => {
    const matching = significators.find(other => other.role === role);
    return matching?.side !== item.side;
  }));
  if (sharedAcrossSides.length > 0) conflicts.push(`Shared significator across sides: ${[...new Set(sharedAcrossSides.map(item => item.ruler))].join(", ")}.`);

  let outcome: FrawleyOutcome = "no-call";
  let reason = "No qualifying final Moon perfection to a four-significator target was found before the Moon left its starting sign.";
  if (finalCandidate) {
    if (finalCandidate.targetRoles.length === 0) {
      reason = `The final qualifying Moon aspect is a ${finalCandidate.aspect}° aspect to ${finalCandidate.target}, which is not one of L1/L10/L7/L4.`;
    } else if (finalCandidate.targetSides.length !== 1) {
      reason = `The final qualifying Moon aspect reaches ${finalCandidate.target}, a significator shared across contest sides.`;
      conflicts.push(reason);
    } else if (finalCandidate.targetSides[0] === "A") {
      outcome = "side-a";
      reason = `The final qualifying Moon aspect is a ${finalCandidate.aspect}° aspect to ${finalCandidate.target} (${finalCandidate.targetRoles.join("/")}), resolving to Side A.`;
    } else {
      outcome = "side-b";
      reason = `The final qualifying Moon aspect is a ${finalCandidate.aspect}° aspect to ${finalCandidate.target} (${finalCandidate.targetRoles.join("/")}), resolving to Side B.`;
    }
  }

  const sun = getPlanet(planets, "Sun");
  const supportingEvidence: FrawleyResult["supportingEvidence"] = significators.map(significator => {
    const separation = shortestArc(sun.longitude, significator.planet.longitude);
    return {
      kind: "combustion" as const,
      status: separation <= 2 ? "present" as const : "clear" as const,
      description: `${significator.role} ${significator.ruler} is ${separation.toFixed(2)}° from the Sun; the ≤2° Frawley review threshold is supporting evidence only.`,
    };
  });
  supportingEvidence.push({
    kind: "node",
    status: "not-configured",
    description: "Node contact is retained as an unconfigured supporting check; it does not influence frawley-event-v1’s verdict.",
  });

  return {
    version: FRAWLEY_EVENT_VERSION,
    orientation,
    method: "Frawley event chart",
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
      coreAngularOrb: 3,
      extendedAngularOrb: 5,
      moonMaximumInitialOrb: 5,
      moonSearchHorizonHours: 48,
      conjunctionStopsSequence: true,
      combustionReviewOrb: 2,
    },
    cusps: cuspRows,
    significators,
    angularEvidence,
    moon: {
      startLongitude: moon.longitude,
      startSign: moon.sign,
      signExitUtcIso: signExit?.toISOString() ?? null,
      conjunctionStopUtcIso: conjunctionStop?.perfectionUtcIso ?? null,
      candidates,
      finalCandidate,
    },
    supportingEvidence,
    conflicts,
  };
}
