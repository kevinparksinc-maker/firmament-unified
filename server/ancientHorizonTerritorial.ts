import { calculateChart } from "./ephemeris";
import { evaluateCluster, type ClusterResult } from "./houseClusterEngine";
import { SIGN_ORDER, type PlanetPlacement } from "./astroEngine";
import { calculateDomeSeasonalRadiusAudit, type DomeSeasonalRadiusAudit } from "./domeSeasonalRadius";
import type { GodAxisOrientation } from "./godAgentFlowEngine";

export const ANCIENT_HORIZON_TERRITORIAL_VERSION = "ancient-horizon-territorial-v1" as const;

const normalize = (value: number) => ((value % 360) + 360) % 360;

function signAt(longitude: number) {
  const normalized = normalize(longitude);
  const index = Math.floor(normalized / 30);
  return { sign: SIGN_ORDER[index]!, degree: normalized - index * 30 };
}

function houseFor(longitude: number, ascendant: number) {
  return Math.floor(normalize(longitude - ascendant) / 30) + 1;
}

function makeEqualHouseCusps(ascendant: number) {
  return Object.fromEntries(Array.from({ length: 12 }, (_, index) => {
    const cusp = signAt(ascendant + index * 30);
    return [index + 1, cusp];
  }));
}

function adaptPlanet(planet: any, ascendant: number, orientation: GodAxisOrientation): PlanetPlacement {
  const longitude = normalize(planet.eclipticLon + (orientation === "inverse-180" ? 180 : 0));
  const position = signAt(longitude);
  return {
    planet: planet.name,
    sign: position.sign,
    degree: position.degree,
    house: houseFor(longitude, ascendant),
    rx: Boolean(planet.rx),
    eclipticLon: longitude,
  } as PlanetPlacement;
}

export type AncientHorizonTerritorialResult = {
  version: typeof ANCIENT_HORIZON_TERRITORIAL_VERSION;
  method: "Ancient-Horizon Territorial / Cluster";
  orientation: GodAxisOrientation;
  source: {
    longitudeFrame: "topocentric-apparent-ecliptic";
    observer: { latitude: number; longitude: number; altitude: number };
    houseSystem: "Ancient-Horizon Equal Houses";
    ascendantDegrees: number;
  };
  seasonalAudit: DomeSeasonalRadiusAudit;
  chart: Record<string, PlanetPlacement>;
  houses: Record<number, { sign: string; degree: number }>;
  cluster: ClusterResult;
};

export async function calculateAncientHorizonTerritorial(input: {
  utcDate: Date;
  latitude: number;
  longitude: number;
  altitude?: number;
  dayOfYear: number;
  localModelAngleDegrees: number;
  observerDistanceFromPoleMiles: number;
  orientation?: GodAxisOrientation;
  sideAName?: string;
  sideBName?: string;
}): Promise<AncientHorizonTerritorialResult> {
  const altitude = input.altitude ?? 0;
  const orientation = input.orientation ?? "standard";
  const seasonalAudit = calculateDomeSeasonalRadiusAudit({
    dayOfYear: input.dayOfYear,
    localSiderealAngleDegrees: input.localModelAngleDegrees,
    observerDistanceFromPoleMiles: input.observerDistanceFromPoleMiles,
  });
  const ephemeris = await calculateChart(input.utcDate, {
    latitude: input.latitude,
    longitude: input.longitude,
    altitude,
  });
  const orientedAscendant = normalize(seasonalAudit.ascendantDegrees + (orientation === "inverse-180" ? 180 : 0));
  const chart = Object.fromEntries(
    ephemeris.planets.map((planet) => [planet.name, adaptPlanet(planet, seasonalAudit.ascendantDegrees, orientation)]),
  ) as Record<string, PlanetPlacement>;
  const houses = makeEqualHouseCusps(orientedAscendant);
  const cluster = evaluateCluster(
    chart,
    houses,
    input.sideAName ?? "Side A",
    input.sideBName ?? "Side B",
  );
  return {
    version: ANCIENT_HORIZON_TERRITORIAL_VERSION,
    method: "Ancient-Horizon Territorial / Cluster",
    orientation,
    source: {
      longitudeFrame: "topocentric-apparent-ecliptic",
      observer: { latitude: input.latitude, longitude: input.longitude, altitude },
      houseSystem: "Ancient-Horizon Equal Houses",
      ascendantDegrees: orientedAscendant,
    },
    seasonalAudit,
    chart,
    houses,
    cluster,
  };
}
