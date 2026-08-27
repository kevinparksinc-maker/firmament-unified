import { createRequire } from "node:module";
import {
  calculatePlacidusEventChart,
  normalizeDegrees,
  shortestArc,
  type EventChartRequest,
  type TraditionalPlanetName,
} from "./eventChartService";

const require = createRequire(import.meta.url);
const Astronomy = require("astronomy-engine") as {
  MakeTime: (date: Date) => unknown;
  GeoVector: (body: unknown, time: unknown, aberration: boolean) => { x: number; y: number; z: number };
  EquatorFromVector: (vector: { x: number; y: number; z: number }) => { ra: number; dec: number };
  Observer: new (latitude: number, longitude: number, height: number) => unknown;
  Equator: (body: unknown, time: unknown, observer: unknown, ofDate: boolean, aberration: boolean) => { ra: number; dec: number };
  Horizon: (time: unknown, observer: unknown, ra: number, dec: number, refraction: "normal") => { azimuth: number; altitude: number };
  Body: Record<string, unknown>;
};

export const GOD_AXIS_VERSION = "god-axis-v1" as const;
export const GOD_AGENT_FAMILY_FLOW_VERSION = "god-agent-family-flow-v1" as const;

export const GOD_AXIS_PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const;

export type GodAxisOrientation = "standard" | "inverse-180";
export type GodSector = "god-asc" | "god-dsc" | "quadrature" | "boundary";
export type GodPolarity = "asc" | "dsc" | "tie" | "abstain";
export type AgentFamily = "agent-asc-family" | "agent-dsc-family" | "agent-neutral";
export type SynthesisState = "asc-convergence" | "dsc-convergence" | "cross-view-conflict" | "neutral";
export type Strength = "none" | "weak" | "moderate" | "strong" | "extreme";

const GOD_AXIS_BOUNDARIES_HOURS = [0, 3, 9, 12, 15, 21] as const;
const AGENT_ASC_HOUSES = new Set([1, 3, 6, 10, 11]);
const AGENT_DSC_HOUSES = new Set([4, 5, 7, 9, 12]);
const BODY_BY_PLANET: Record<TraditionalPlanetName, unknown> = {
  Sun: Astronomy.Body.Sun,
  Moon: Astronomy.Body.Moon,
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
};

export type GodAxisPoint = {
  planet: TraditionalPlanetName;
  geocentricRaHours: number;
  orientedRaHours: number;
  declination: number;
  declinationBand: "north" | "equatorial" | "south";
  sector: GodSector;
  distanceToBoundaryHours: number;
  eligible: true;
};

export type GodAxisResult = {
  version: typeof GOD_AXIS_VERSION;
  method: "God Axis";
  orientation: GodAxisOrientation;
  eventUtcIso: string;
  referenceFrame: "Astronomy Engine geocentric equatorial EQJ/J2000";
  axes: { godAscRaHours: 0 | 12; godDscRaHours: 0 | 12 };
  settings: {
    godAscSectors: ["21h–24h", "0h–3h"];
    godDscSector: "9h–15h";
    neutralQuadratureSectors: ["3h–9h", "15h–21h"];
    boundaryToleranceHours: number;
    declinationBands: "north > +5°, equatorial −5° to +5°, south < −5°";
    eligibleBodies: readonly TraditionalPlanetName[];
  };
  points: GodAxisPoint[];
  counts: { asc: number; dsc: number; quadrature: number; boundary: number; eligible: number };
  polarity: GodPolarity;
  strength: Strength;
  reason: string;
};

export type GodAgentMatrixRow = GodAxisPoint & {
  agentHouse: number;
  agentFamily: AgentFamily;
  flowCell: "asc-to-asc" | "asc-to-dsc" | "asc-to-neutral" | "dsc-to-asc" | "dsc-to-dsc" | "dsc-to-neutral" | "neutral-to-asc" | "neutral-to-dsc" | "neutral-to-neutral";
};

type MajorAspectName = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export type GodAgentSecondaryAspect = {
  first: TraditionalPlanetName;
  second: TraditionalPlanetName;
  type: MajorAspectName;
  exactAngle: number;
  separation: number;
  orb: number;
  firstGodSector: GodSector;
  secondGodSector: GodSector;
  firstAgentFamily: AgentFamily;
  secondAgentFamily: AgentFamily;
};

export type GodAgentTopocentricPoint = {
  planet: TraditionalPlanetName;
  rightAscensionHours: number;
  declination: number;
  azimuth: number;
  altitude: number;
};

export type GodAgentTopocentricObservation = {
  status: "unscored observation";
  referenceFrame: "Astronomy Engine topocentric horizontal coordinates";
  observer: { latitude: number; longitude: number; altitude: number };
  points: GodAgentTopocentricPoint[];
  note: string;
};

export type GodAgentFlowInput = EventChartRequest & {
  venueName: string;
  favoriteName: string;
  challengerName: string;
  favoriteSource: string;
  orientation?: GodAxisOrientation;
};

export type GodAgentFlowResult = {
  version: typeof GOD_AGENT_FAMILY_FLOW_VERSION;
  method: "God View / Agent View Family Flow";
  orientation: GodAxisOrientation;
  status: "ready" | "no-call";
  outcome: "side-a-context" | "side-b-context" | "no-call";
  verdict: string;
  reason: string;
  event: {
    venueName: string;
    eventUtcIso: string;
    favoriteName: string;
    challengerName: string;
    favoriteSource: string;
    agentHouseSystem: "Placidus";
    agentHouseEngine: string;
    agentMapping: "local ASC = Side A / favorite; local DSC = Side B / challenger";
  };
  godView: GodAxisResult;
  topocentricObservation: GodAgentTopocentricObservation;
  agentView: {
    familyHouses: { asc: number[]; dsc: number[] };
    counts: { asc: number; dsc: number; neutral: number; eligible: number };
    polarity: GodPolarity;
    strength: Strength;
    cusps: Array<{ house: number; longitude: number }>;
  };
  familyFlow: {
    version: typeof GOD_AGENT_FAMILY_FLOW_VERSION;
    rows: GodAgentMatrixRow[];
    cells: Record<GodAgentMatrixRow["flowCell"], number>;
    note: string;
  };
  secondaryGeometry: {
    status: "unscored context";
    majorAspectOrb: 5;
    aspects: GodAgentSecondaryAspect[];
    note: string;
  };
  synthesis: {
    state: SynthesisState;
    agreementCount: 0 | 2;
    godPolarity: GodPolarity;
    agentPolarity: GodPolarity;
    godStrength: Strength;
    agentStrength: Strength;
    publicRule: string;
  };
  conflicts: string[];
};

function circularHourDistance(first: number, second: number): number {
  const difference = Math.abs(first - second) % 24;
  return Math.min(difference, 24 - difference);
}

function classifyGodSector(raHours: number, tolerance = 1e-6): { sector: GodSector; distanceToBoundaryHours: number } {
  const normalized = ((raHours % 24) + 24) % 24;
  const distanceToBoundaryHours = Math.min(...GOD_AXIS_BOUNDARIES_HOURS.map(boundary => circularHourDistance(normalized, boundary)));
  if (distanceToBoundaryHours <= tolerance) return { sector: "boundary", distanceToBoundaryHours };
  if (normalized > 0 && normalized < 3 || normalized > 21 && normalized < 24) return { sector: "god-asc", distanceToBoundaryHours };
  if (normalized > 9 && normalized < 15) return { sector: "god-dsc", distanceToBoundaryHours };
  return { sector: "quadrature", distanceToBoundaryHours };
}

function declinationBand(declination: number): GodAxisPoint["declinationBand"] {
  if (declination > 5) return "north";
  if (declination < -5) return "south";
  return "equatorial";
}

function strengthForMargin(margin: number): Strength {
  if (margin <= 0) return "none";
  if (margin === 1) return "weak";
  if (margin === 2) return "moderate";
  if (margin === 3) return "strong";
  return "extreme";
}

function polarityFromCounts(asc: number, dsc: number, eligible: number): GodPolarity {
  if (eligible === 0) return "abstain";
  if (asc > dsc) return "asc";
  if (dsc > asc) return "dsc";
  return "tie";
}

function polarityLabel(polarity: GodPolarity): string {
  if (polarity === "asc") return "God-ASC polarity";
  if (polarity === "dsc") return "God-DSC polarity";
  if (polarity === "tie") return "God View tie";
  return "God View abstain";
}

export function calculateGodAxis(utcDate: Date, orientation: GodAxisOrientation = "standard"): GodAxisResult {
  if (!Number.isFinite(utcDate.getTime())) throw new Error("God Axis requires a finite UTC event instant.");
  const time = Astronomy.MakeTime(utcDate);
  const shiftHours = orientation === "inverse-180" ? 12 : 0;
  const points = GOD_AXIS_PLANETS.map(planet => {
    const equatorial = Astronomy.EquatorFromVector(Astronomy.GeoVector(BODY_BY_PLANET[planet], time, false));
    const geocentricRaHours = ((equatorial.ra % 24) + 24) % 24;
    const orientedRaHours = (geocentricRaHours + shiftHours) % 24;
    const classified = classifyGodSector(orientedRaHours);
    return {
      planet,
      geocentricRaHours,
      orientedRaHours,
      declination: equatorial.dec,
      declinationBand: declinationBand(equatorial.dec),
      sector: classified.sector,
      distanceToBoundaryHours: classified.distanceToBoundaryHours,
      eligible: true,
    };
  });
  const counts = {
    asc: points.filter(point => point.sector === "god-asc").length,
    dsc: points.filter(point => point.sector === "god-dsc").length,
    quadrature: points.filter(point => point.sector === "quadrature").length,
    boundary: points.filter(point => point.sector === "boundary").length,
    eligible: points.length,
  };
  const polarity = polarityFromCounts(counts.asc, counts.dsc, counts.eligible);
  const margin = Math.abs(counts.asc - counts.dsc);
  const reason = `${polarityLabel(polarity)}: ${counts.asc} God-ASC-sector and ${counts.dsc} God-DSC-sector traditional planets; ${counts.quadrature} quadrature and ${counts.boundary} boundary records are neutral.`;
  return {
    version: GOD_AXIS_VERSION,
    method: "God Axis",
    orientation,
    eventUtcIso: utcDate.toISOString(),
    referenceFrame: "Astronomy Engine geocentric equatorial EQJ/J2000",
    axes: orientation === "standard" ? { godAscRaHours: 0, godDscRaHours: 12 } : { godAscRaHours: 12, godDscRaHours: 0 },
    settings: {
      godAscSectors: ["21h–24h", "0h–3h"],
      godDscSector: "9h–15h",
      neutralQuadratureSectors: ["3h–9h", "15h–21h"],
      boundaryToleranceHours: 1e-6,
      declinationBands: "north > +5°, equatorial −5° to +5°, south < −5°",
      eligibleBodies: GOD_AXIS_PLANETS,
    },
    points,
    counts,
    polarity,
    strength: strengthForMargin(margin),
    reason,
  };
}

function calculateTopocentricObservation(utcDate: Date, latitude: number, longitude: number, altitude = 0): GodAgentTopocentricObservation {
  const time = Astronomy.MakeTime(utcDate);
  const observer = new Astronomy.Observer(latitude, longitude, altitude);
  const points = GOD_AXIS_PLANETS.map(planet => {
    const equatorial = Astronomy.Equator(BODY_BY_PLANET[planet], time, observer, true, true);
    const horizon = Astronomy.Horizon(time, observer, equatorial.ra, equatorial.dec, "normal");
    return {
      planet,
      rightAscensionHours: equatorial.ra,
      declination: equatorial.dec,
      azimuth: horizon.azimuth,
      altitude: horizon.altitude,
    };
  });
  return {
    status: "unscored observation",
    referenceFrame: "Astronomy Engine topocentric horizontal coordinates",
    observer: { latitude, longitude, altitude },
    points,
    note: "Topocentric altitude/azimuth is displayed for coordinate audit only. It does not alter God-axis sectors, Agent-family counts, synthesis, strength labels, or outcome.",
  };
}

function houseForLongitude(longitude: number, cusps: number[]): number {
  for (let index = 0; index < cusps.length; index += 1) {
    const start = cusps[index]!;
    const end = cusps[(index + 1) % cusps.length]!;
    const span = normalizeDegrees(end - start);
    const offset = normalizeDegrees(longitude - start);
    if (offset < span || Math.abs(offset - span) < 0.0001) return index + 1;
  }
  throw new Error("Agent chart could not assign a finite planet to a Placidus house.");
}

function flowCell(sector: GodSector, family: AgentFamily): GodAgentMatrixRow["flowCell"] {
  if (sector === "god-asc") return family === "agent-asc-family" ? "asc-to-asc" : family === "agent-dsc-family" ? "asc-to-dsc" : "asc-to-neutral";
  if (sector === "god-dsc") return family === "agent-asc-family" ? "dsc-to-asc" : family === "agent-dsc-family" ? "dsc-to-dsc" : "dsc-to-neutral";
  return family === "agent-asc-family" ? "neutral-to-asc" : family === "agent-dsc-family" ? "neutral-to-dsc" : "neutral-to-neutral";
}

const MAJOR_ASPECTS: Array<{ type: MajorAspectName; exactAngle: number }> = [
  { type: "conjunction", exactAngle: 0 },
  { type: "sextile", exactAngle: 60 },
  { type: "square", exactAngle: 90 },
  { type: "trine", exactAngle: 120 },
  { type: "opposition", exactAngle: 180 },
];

function detectSecondaryAspects(rows: GodAgentMatrixRow[], agentLongitudes: Map<TraditionalPlanetName, number>): GodAgentSecondaryAspect[] {
  const aspects: GodAgentSecondaryAspect[] = [];
  for (let firstIndex = 0; firstIndex < rows.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < rows.length; secondIndex += 1) {
      const first = rows[firstIndex]!;
      const second = rows[secondIndex]!;
      const firstLongitude = agentLongitudes.get(first.planet);
      const secondLongitude = agentLongitudes.get(second.planet);
      if (firstLongitude === undefined || secondLongitude === undefined) continue;
      const separation = shortestArc(firstLongitude, secondLongitude);
      const closest = MAJOR_ASPECTS
        .map(aspect => ({ ...aspect, orb: Math.abs(separation - aspect.exactAngle) }))
        .sort((left, right) => left.orb - right.orb)[0];
      if (!closest || closest.orb > 5) continue;
      aspects.push({
        first: first.planet,
        second: second.planet,
        type: closest.type,
        exactAngle: closest.exactAngle,
        separation,
        orb: closest.orb,
        firstGodSector: first.sector,
        secondGodSector: second.sector,
        firstAgentFamily: first.agentFamily,
        secondAgentFamily: second.agentFamily,
      });
    }
  }
  return aspects;
}

export function classifyAgentFamily(house: number): AgentFamily {
  if (AGENT_ASC_HOUSES.has(house)) return "agent-asc-family";
  if (AGENT_DSC_HOUSES.has(house)) return "agent-dsc-family";
  return "agent-neutral";
}

function agentPolarityFromCounts(asc: number, dsc: number): GodPolarity {
  if (asc + dsc === 0) return "abstain";
  if (asc > dsc) return "asc";
  if (dsc > asc) return "dsc";
  return "tie";
}

function synthesisFor(god: GodAxisResult, agentPolarity: GodPolarity, agentStrength: Strength): GodAgentFlowResult["synthesis"] {
  if (god.polarity === "asc" && agentPolarity === "asc") {
    return { state: "asc-convergence", agreementCount: 2, godPolarity: god.polarity, agentPolarity, godStrength: god.strength, agentStrength, publicRule: "Both independent views favor ASC polarity. Agent View may translate local ASC to Side A context only after this result is fixed." };
  }
  if (god.polarity === "dsc" && agentPolarity === "dsc") {
    return { state: "dsc-convergence", agreementCount: 2, godPolarity: god.polarity, agentPolarity, godStrength: god.strength, agentStrength, publicRule: "Both independent views favor DSC polarity. Agent View may translate local DSC to Side B context only after this result is fixed." };
  }
  if ((god.polarity === "asc" && agentPolarity === "dsc") || (god.polarity === "dsc" && agentPolarity === "asc")) {
    return { state: "cross-view-conflict", agreementCount: 0, godPolarity: god.polarity, agentPolarity, godStrength: god.strength, agentStrength, publicRule: "Independent God and Agent polarities conflict. The public outcome is no call; retain this record for upset analysis." };
  }
  return { state: "neutral", agreementCount: 0, godPolarity: god.polarity, agentPolarity, godStrength: god.strength, agentStrength, publicRule: "At least one view is tied or abstaining. The public outcome is no call." };
}

export function calculateGodAgentFamilyFlow(input: GodAgentFlowInput): GodAgentFlowResult {
  const orientation = input.orientation ?? "standard";
  const godView = calculateGodAxis(input.utcDate, orientation);
  const agentChart = calculatePlacidusEventChart(input);
  const topocentricObservation = calculateTopocentricObservation(input.utcDate, input.latitude, input.longitude, input.altitude ?? 0);
  const agentByName = new Map(agentChart.planets.map(planet => [planet.name, planet]));
  const rows: GodAgentMatrixRow[] = godView.points.map(point => {
    const agentPlanet = agentByName.get(point.planet);
    if (!agentPlanet) throw new Error(`Missing ${point.planet} from Agent event chart.`);
    const agentHouse = houseForLongitude(agentPlanet.longitude, agentChart.cusps);
    const agentFamily = classifyAgentFamily(agentHouse);
    return { ...point, agentHouse, agentFamily, flowCell: flowCell(point.sector, agentFamily) };
  });
  const agentCounts = {
    asc: rows.filter(row => row.agentFamily === "agent-asc-family").length,
    dsc: rows.filter(row => row.agentFamily === "agent-dsc-family").length,
    neutral: rows.filter(row => row.agentFamily === "agent-neutral").length,
    eligible: rows.filter(row => row.agentFamily !== "agent-neutral").length,
  };
  const agentPolarity = agentPolarityFromCounts(agentCounts.asc, agentCounts.dsc);
  const agentStrength = strengthForMargin(Math.abs(agentCounts.asc - agentCounts.dsc));
  const cells: GodAgentFlowResult["familyFlow"]["cells"] = {
    "asc-to-asc": rows.filter(row => row.flowCell === "asc-to-asc").length,
    "asc-to-dsc": rows.filter(row => row.flowCell === "asc-to-dsc").length,
    "asc-to-neutral": rows.filter(row => row.flowCell === "asc-to-neutral").length,
    "dsc-to-asc": rows.filter(row => row.flowCell === "dsc-to-asc").length,
    "dsc-to-dsc": rows.filter(row => row.flowCell === "dsc-to-dsc").length,
    "dsc-to-neutral": rows.filter(row => row.flowCell === "dsc-to-neutral").length,
    "neutral-to-asc": rows.filter(row => row.flowCell === "neutral-to-asc").length,
    "neutral-to-dsc": rows.filter(row => row.flowCell === "neutral-to-dsc").length,
    "neutral-to-neutral": rows.filter(row => row.flowCell === "neutral-to-neutral").length,
  };
  const secondaryAspects = detectSecondaryAspects(rows, new Map(agentChart.planets.map(planet => [planet.name, planet.longitude])));
  const synthesis = synthesisFor(godView, agentPolarity, agentStrength);
  const conflicts: string[] = [];
  if (godView.polarity === "tie" || godView.polarity === "abstain") conflicts.push("God View has no directional polarity; it remains a no-call input to synthesis.");
  if (agentPolarity === "tie") conflicts.push("Agent family count is tied; it remains a no-call input to synthesis.");
  if (agentPolarity === "abstain") conflicts.push("Every Agent placement fell outside the declared ASC/DSC house families; it remains a no-call input to synthesis.");
  if (synthesis.state === "cross-view-conflict") conflicts.push("God and Agent polarity disagree. Do not force a winner or blend their margins.");
  if (orientation === "inverse-180") conflicts.push("Inverse God-axis output is the mechanical 12-hour complement of the symmetric standard axis and is audit-only, not independent confirming evidence.");

  const outcome = synthesis.state === "asc-convergence" ? "side-a-context" : synthesis.state === "dsc-convergence" ? "side-b-context" : "no-call";
  const verdict = outcome === "side-a-context"
    ? `ASCENDANT CONVERGENCE — ${input.favoriteName} context only — experimental`
    : outcome === "side-b-context"
      ? `DESCENDANT CONVERGENCE — ${input.challengerName} context only — experimental`
      : synthesis.state === "cross-view-conflict"
        ? "CROSS-VIEW POLARITY CONFLICT — NO CALL"
        : "NEUTRAL OR INSUFFICIENT POLARITY — NO CALL";
  const reason = `God View: ${polarityLabel(godView.polarity)} (${godView.counts.asc} ASC / ${godView.counts.dsc} DSC, ${godView.strength}). Agent View: ${agentPolarity === "tie" ? "Agent family tie" : `Agent-${agentPolarity.toUpperCase()} polarity`} (${agentCounts.asc} ASC-family / ${agentCounts.dsc} DSC-family, ${agentStrength}). Synthesis: ${synthesis.state.replaceAll("-", " ")}.`;

  return {
    version: GOD_AGENT_FAMILY_FLOW_VERSION,
    method: "God View / Agent View Family Flow",
    orientation,
    status: outcome === "no-call" ? "no-call" : "ready",
    outcome,
    verdict,
    reason,
    event: {
      venueName: input.venueName,
      eventUtcIso: input.utcDate.toISOString(),
      favoriteName: input.favoriteName,
      challengerName: input.challengerName,
      favoriteSource: input.favoriteSource,
      agentHouseSystem: agentChart.houseSystem,
      agentHouseEngine: agentChart.houseEngine,
      agentMapping: "local ASC = Side A / favorite; local DSC = Side B / challenger",
    },
    godView,
    topocentricObservation,
    agentView: {
      familyHouses: { asc: [...AGENT_ASC_HOUSES], dsc: [...AGENT_DSC_HOUSES] },
      counts: agentCounts,
      polarity: agentPolarity,
      strength: agentStrength,
      cusps: agentChart.cusps.map((longitude, index) => ({ house: index + 1, longitude })),
    },
    familyFlow: {
      version: GOD_AGENT_FAMILY_FLOW_VERSION,
      rows,
      cells,
      note: "Rows show God fixed-sector classification and the independently calculated local Agent receiving family. Cell counts are audit evidence, not a pooled predictive score.",
    },
    secondaryGeometry: {
      status: "unscored context",
      majorAspectOrb: 5,
      aspects: secondaryAspects,
      note: "Major traditional-planet aspects are displayed only as secondary geometry. They do not change God-axis counts, Agent-family counts, synthesis state, strength labels, or the public outcome.",
    },
    synthesis,
    conflicts,
  };
}
