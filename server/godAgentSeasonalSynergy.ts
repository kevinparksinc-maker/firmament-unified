import { calculateChart, type PlanetPosition } from "./ephemeris";
import {
  calculateGodAxis,
  classifyAgentFamily,
  type GodAxisOrientation,
  type GodSector,
  type AgentFamily,
} from "./godAgentFlowEngine";
import {
  calculateDomeSeasonalRadiusAudit,
  type DomeSeasonalRadiusAudit,
} from "./domeSeasonalRadius";

export const GOD_AGENT_SEASONAL_SYNERGY_VERSION =
  "god-agent-seasonal-synergy-v1" as const;

const SYNERGY_PLANETS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
] as const;

type SynergyPlanet = (typeof SYNERGY_PLANETS)[number];

export type GodAgentHouseAuditRow = {
  house: number;
  startLongitude: number;
  endLongitude: number;
  startSign: string;
  startDegree: number;
  endSign: string;
  endDegree: number;
  family: AgentFamily;
  planets: Array<{ planet: SynergyPlanet; rawLongitude: number; sign: string; degreeInSign: number }>;
};

export type GodAgentAspectRow = {
  first: SynergyPlanet;
  second: SynergyPlanet;
  type: "conjunction" | "sextile" | "square" | "trine" | "opposition";
  exactAngle: number;
  separation: number;
  orb: number;
  motionState: "unavailable";
  firstGodSector: GodSector;
  secondGodSector: GodSector;
  firstAgentFamily: AgentFamily;
  secondAgentFamily: AgentFamily;
  scored: false;
};

type SynergyCell =
  | "asc-to-asc"
  | "asc-to-dsc"
  | "asc-to-neutral"
  | "dsc-to-asc"
  | "dsc-to-dsc"
  | "dsc-to-neutral"
  | "neutral-to-asc"
  | "neutral-to-dsc"
  | "neutral-to-neutral";

export type GodAgentSeasonalSynergyRow = {
  planet: SynergyPlanet;
  godSector: GodSector;
  godRaHours: number;
  declination: number;
  agentRawLongitude: number;
  agentSign: string;
  agentDegreeInSign: number;
  agentHouse: number;
  agentFamily: AgentFamily;
  synergyCell: SynergyCell;
  sideASupport: number;
  sideBSupport: number;
  sideAConflict: number;
  sideBConflict: number;
  rule: string;
};

export type GodAgentSeasonalSynergyResult = {
  version: typeof GOD_AGENT_SEASONAL_SYNERGY_VERSION;
  method: "God–Agent Seasonal Synergy";
  orientation: GodAxisOrientation;
  eventUtcIso: string;
  topocentricObserver: { latitude: number; longitude: number; altitude: number };
  godView: ReturnType<typeof calculateGodAxis>;
  seasonalAudit: DomeSeasonalRadiusAudit;
  aspects: GodAgentAspectRow[];
  agentView: {
    houseSystem: "Ancient-Horizon Equal Houses";
    ascendantDegrees: number;
    familyHouses: { asc: number[]; dsc: number[]; neutral: number[] };
    houses: GodAgentHouseAuditRow[];
    rows: GodAgentSeasonalSynergyRow[];
  };
  synthesis: {
    sideASupport: number;
    sideBSupport: number;
    sideAConflict: number;
    sideBConflict: number;
    sideANetEnergy: number;
    sideBNetEnergy: number;
    polarity: "side-a" | "side-b" | "tie" | "no-call";
    state: "synergy" | "cross-view-conflict" | "neutral" | "abstain";
    rule: string;
  };
};

const normalize = (value: number) => ((value % 360) + 360) % 360;
const zodiac = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function signAt(longitude: number): { sign: string; degreeInSign: number } {
  const normalized = normalize(longitude);
  const index = Math.floor(normalized / 30);
  return { sign: zodiac[index]!, degreeInSign: normalized - index * 30 };
}

function houseFromAncientAscendant(longitude: number, ascendant: number): number {
  return Math.floor(normalize(longitude - ascendant) / 30) + 1;
}

function synergyCell(godSector: GodSector, agentFamily: AgentFamily): SynergyCell {
  const god = godSector === "god-asc" ? "asc" : godSector === "god-dsc" ? "dsc" : "neutral";
  const agent = agentFamily === "agent-asc-family" ? "asc" : agentFamily === "agent-dsc-family" ? "dsc" : "neutral";
  return `${god}-to-${agent}` as SynergyCell;
}

function energyFor(cell: SynergyCell) {
  return {
    sideASupport: cell === "asc-to-asc" ? 1 : 0,
    sideBSupport: cell === "dsc-to-dsc" ? 1 : 0,
    sideAConflict: cell === "asc-to-dsc" ? 1 : 0,
    sideBConflict: cell === "dsc-to-asc" ? 1 : 0,
  };
}

const ASPECT_RULES = [
  { type: "conjunction" as const, angle: 0, orb: 7 },
  { type: "sextile" as const, angle: 60, orb: 4 },
  { type: "square" as const, angle: 90, orb: 5 },
  { type: "trine" as const, angle: 120, orb: 5 },
  { type: "opposition" as const, angle: 180, orb: 7 },
];

function angularSeparation(a: number, b: number) {
  const raw = Math.abs(normalize(a) - normalize(b));
  return raw > 180 ? 360 - raw : raw;
}

function houseFamilyLabel(house: number): AgentFamily {
  return classifyAgentFamily(house);
}

function buildHouseAudit(rows: GodAgentSeasonalSynergyRow[], ascendant: number): GodAgentHouseAuditRow[] {
  return Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const startLongitude = normalize(ascendant + index * 30);
    const endLongitude = normalize(startLongitude + 30);
    const start = signAt(startLongitude);
    const end = signAt(endLongitude);
    return {
      house,
      startLongitude,
      endLongitude,
      startSign: start.sign,
      startDegree: start.degreeInSign,
      endSign: end.sign,
      endDegree: end.degreeInSign,
      family: houseFamilyLabel(house),
      planets: rows.filter((row) => row.agentHouse === house).map((row) => ({
        planet: row.planet,
        rawLongitude: row.agentRawLongitude,
        sign: row.agentSign,
        degreeInSign: row.agentDegreeInSign,
      })),
    };
  });
}

function calculateAspects(chart: { planets: PlanetPosition[] }, rows: GodAgentSeasonalSynergyRow[]): GodAgentAspectRow[] {
  const eligible = SYNERGY_PLANETS.map((name) => chart.planets.find((planet) => planet.name === name)).filter(Boolean) as PlanetPosition[];
  const rowMap = new Map(rows.map((row) => [row.planet, row]));
  const aspects: GodAgentAspectRow[] = [];
  for (let i = 0; i < eligible.length; i += 1) {
    for (let j = i + 1; j < eligible.length; j += 1) {
      const first = eligible[i]!;
      const second = eligible[j]!;
      const separation = angularSeparation(first.eclipticLon, second.eclipticLon);
      const match = ASPECT_RULES.find((rule) => Math.abs(separation - rule.angle) <= rule.orb);
      if (!match) continue;
      const firstRow = rowMap.get(first.name as SynergyPlanet)!;
      const secondRow = rowMap.get(second.name as SynergyPlanet)!;
      aspects.push({
        first: first.name as SynergyPlanet,
        second: second.name as SynergyPlanet,
        type: match.type,
        exactAngle: match.angle,
        separation,
        orb: Math.abs(separation - match.angle),
        motionState: "unavailable",
        firstGodSector: firstRow.godSector,
        secondGodSector: secondRow.godSector,
        firstAgentFamily: firstRow.agentFamily,
        secondAgentFamily: secondRow.agentFamily,
        scored: false,
      });
    }
  }
  return aspects;
}

function polarityFor(sideA: number, sideB: number): "side-a" | "side-b" | "tie" | "no-call" {
  if (sideA === 0 && sideB === 0) return "no-call";
  if (sideA > sideB) return "side-a";
  if (sideB > sideA) return "side-b";
  return "tie";
}

export async function calculateGodAgentSeasonalSynergy(input: {
  utcDate: Date;
  latitude: number;
  longitude: number;
  altitude?: number;
  dayOfYear: number;
  localModelAngleDegrees: number;
  observerDistanceFromPoleMiles: number;
  orientation?: GodAxisOrientation;
}): Promise<GodAgentSeasonalSynergyResult> {
  const orientation = input.orientation ?? "standard";
  const altitude = input.altitude ?? 0;
  const chart = await calculateChart(input.utcDate, {
    latitude: input.latitude,
    longitude: input.longitude,
    altitude,
  });
  const seasonalAudit = calculateDomeSeasonalRadiusAudit({
    dayOfYear: input.dayOfYear,
    localSiderealAngleDegrees: input.localModelAngleDegrees,
    observerDistanceFromPoleMiles: input.observerDistanceFromPoleMiles,
  });
  const godView = calculateGodAxis(input.utcDate, orientation);
  const planetMap = new Map(chart.planets.map((planet) => [planet.name, planet]));
  const godMap = new Map(godView.points.map((point) => [point.planet, point]));

  const rows = SYNERGY_PLANETS.map((planet) => {
    const placement = planetMap.get(planet) as PlanetPosition | undefined;
    const godPoint = godMap.get(planet);
    if (!placement || !godPoint) throw new Error(`Synergy chart missing ${planet}`);
    const agentHouse = houseFromAncientAscendant(
      placement.eclipticLon,
      seasonalAudit.ascendantDegrees,
    );
    const agentFamily = classifyAgentFamily(agentHouse);
    const cell = synergyCell(godPoint.sector, agentFamily);
    const energy = energyFor(cell);
    const placementSign = signAt(placement.eclipticLon);
    return {
      planet,
      godSector: godPoint.sector,
      godRaHours: godPoint.orientedRaHours,
      declination: godPoint.declination,
      agentRawLongitude: normalize(placement.eclipticLon),
      agentSign: placementSign.sign,
      agentDegreeInSign: placementSign.degreeInSign,
      agentHouse,
      agentFamily,
      synergyCell: cell,
      ...energy,
      rule: "Fixed God sector × topocentric Ancient-Horizon Agent house family; support and cross-view conflict are counted separately.",
    };
  });

  const houses = buildHouseAudit(rows, seasonalAudit.ascendantDegrees);
  const aspects = calculateAspects(chart, rows);
  const sideASupport = rows.reduce((sum, row) => sum + row.sideASupport, 0);
  const sideBSupport = rows.reduce((sum, row) => sum + row.sideBSupport, 0);
  const sideAConflict = rows.reduce((sum, row) => sum + row.sideAConflict, 0);
  const sideBConflict = rows.reduce((sum, row) => sum + row.sideBConflict, 0);
  const sideANetEnergy = sideASupport - sideAConflict;
  const sideBNetEnergy = sideBSupport - sideBConflict;
  const polarity = polarityFor(sideANetEnergy, sideBNetEnergy);
  const state = polarity === "no-call" ? "abstain" : polarity === "tie" ? "neutral" : sideAConflict + sideBConflict > 0 ? "cross-view-conflict" : "synergy";

  return {
    version: GOD_AGENT_SEASONAL_SYNERGY_VERSION,
    method: "God–Agent Seasonal Synergy",
    orientation,
    eventUtcIso: input.utcDate.toISOString(),
    topocentricObserver: { latitude: input.latitude, longitude: input.longitude, altitude },
    godView,
    seasonalAudit,
    aspects,
    agentView: {
      houseSystem: "Ancient-Horizon Equal Houses",
      ascendantDegrees: seasonalAudit.ascendantDegrees,
      familyHouses: { asc: [1, 3, 6, 10, 11], dsc: [4, 5, 7, 9, 12], neutral: [2, 8] },
      houses,
      rows,
    },
    synthesis: {
      sideASupport,
      sideBSupport,
      sideAConflict,
      sideBConflict,
      sideANetEnergy,
      sideBNetEnergy,
      polarity,
      state,
      rule: "Side A is the local ASC family and Side B is the local DSC family. Net energy = matching-polarity support minus cross-polarity conflict; neutral God sectors and neutral Agent houses do not force a result.",
    },
  };
}
