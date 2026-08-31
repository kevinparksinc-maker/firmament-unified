import { createRequire } from "module";
import {
  calculatePlacidusEventChart,
  normalizeDegrees,
  signAt,
  type EventChartRequest,
} from "./eventChartService";

const require = createRequire(import.meta.url);
const Astronomy = require("astronomy-engine");

const { MakeTime, SunPosition, GeoVector, Ecliptic, Equator, Horizon, Observer, Body } = Astronomy;

const PHYSICAL_BODIES = [
  ["Sun", Body.Sun], ["Moon", Body.Moon], ["Mercury", Body.Mercury],
  ["Venus", Body.Venus], ["Mars", Body.Mars], ["Jupiter", Body.Jupiter],
  ["Saturn", Body.Saturn], ["Uranus", Body.Uranus], ["Neptune", Body.Neptune],
  ["Pluto", Body.Pluto],
] as const;

export type CoordinateComparisonInput = EventChartRequest & {
  venueName: string;
  timezone: string;
};

type CoordinatePoint = {
  name: string;
  longitude: number;
  sign: string;
  degreeInSign: number;
  house: number;
  rightAscension?: number;
  declination?: number;
  azimuth?: number;
  altitude?: number;
  mapX: number;
  mapY: number;
};

export type CoordinateComparison = {
  event: {
    venueName: string;
    latitude: number;
    longitude: number;
    timezone: string;
    local: EventChartRequest["local"];
    utcIso: string;
  };
  domeModel: {
    id: "atlas-live-engine-v1";
    ephemeris: string;
    axes: string;
    houseSystem: string;
    projection: string;
    ascendant: number;
    midheaven: number;
    points: CoordinatePoint[];
  };
  conventionalTropicalReference: {
    ephemeris: string;
    houseSystem: string;
    houseEngine: string;
    ascendant: number;
    midheaven: number;
    points: CoordinatePoint[];
  };
  boundary: string;
};

function equalHouseFor(longitude: number, ascendant: number) {
  return Math.floor(normalizeDegrees(longitude - ascendant) / 30) + 1;
}

function placidusHouseFor(longitude: number, cusps: number[]) {
  for (let index = 0; index < cusps.length; index += 1) {
    const start = cusps[index]!;
    const end = cusps[(index + 1) % cusps.length]!;
    const span = normalizeDegrees(end - start);
    const offset = normalizeDegrees(longitude - start);
    if (offset < span || Math.abs(offset - span) < 0.0001) return index + 1;
  }
  throw new Error("Unable to assign the conventional tropical placement to a Placidus house.");
}

function gleasonMapPoint(rightAscensionHours: number, declinationDegrees: number) {
  const radius = (405 / Math.PI) * (Math.PI / 2 - (declinationDegrees * Math.PI) / 180);
  const angle = (rightAscensionHours * 15 * Math.PI) / 180;
  return { mapX: 50 + (radius * Math.sin(angle)) / 10, mapY: 50 - (radius * Math.cos(angle)) / 10 };
}

function tropicalWheelPoint(longitude: number) {
  const angle = ((longitude - 90) * Math.PI) / 180;
  return { mapX: 50 + 42 * Math.cos(angle), mapY: 50 + 42 * Math.sin(angle) };
}

function meanNorthNode(time: any) {
  const centuries = time.tt / 36525;
  return normalizeDegrees(125.04452 - 1934.136261 * centuries + 0.0020708 * centuries * centuries + (centuries ** 3) / 450000);
}

function eclipticToEquatorial(longitude: number) {
  const obliquity = (23.4392911 * Math.PI) / 180;
  const lambda = (longitude * Math.PI) / 180;
  const rightAscensionDegrees = normalizeDegrees(Math.atan2(Math.sin(lambda) * Math.cos(obliquity), Math.cos(lambda)) * 180 / Math.PI);
  const declination = Math.asin(Math.sin(lambda) * Math.sin(obliquity)) * 180 / Math.PI;
  return { rightAscension: rightAscensionDegrees / 15, declination };
}

function pointLabel(name: string, longitude: number, house: number, map: { mapX: number; mapY: number }, observation?: { ra: number; dec: number; azimuth: number; altitude: number }): CoordinatePoint {
  return {
    name,
    longitude,
    sign: signAt(longitude),
    degreeInSign: normalizeDegrees(longitude) % 30,
    house,
    ...observation ? { rightAscension: observation.ra, declination: observation.dec, azimuth: observation.azimuth, altitude: observation.altitude } : {},
    ...map,
  };
}

/**
 * Produces two explicitly separate coordinate views for inspection only.
 * The dome-model view follows the existing Atlas direct UTC-degree axes and
 * Gleason RA/declination projection. The conventional reference follows a
 * tropical geocentric ecliptic plus local Placidus house construction.
 */
export function calculateCoordinateComparison(input: CoordinateComparisonInput): CoordinateComparison {
  const time = MakeTime(input.utcDate);
  const observer = new Observer(input.latitude, input.longitude, input.altitude ?? 0);
  const utcDegrees = input.utcDate.getUTCHours() * 15 + input.utcDate.getUTCMinutes() * 0.25 + input.utcDate.getUTCSeconds() / 240;
  const domeMidheaven = normalizeDegrees(utcDegrees + input.longitude);
  const domeAscendant = normalizeDegrees(domeMidheaven + 90);
  const placidus = calculatePlacidusEventChart(input);

  const domePoints = PHYSICAL_BODIES.map(([name, body]) => {
    const longitude = normalizeDegrees(name === "Sun" ? SunPosition(time).elon : Ecliptic(GeoVector(body, time, false)).elon);
    const equator = Equator(body, time, observer, true, true);
    const horizon = Horizon(time, observer, equator.ra, equator.dec, "normal");
    return pointLabel(name, longitude, equalHouseFor(longitude, domeAscendant), gleasonMapPoint(equator.ra, equator.dec), {
      ra: equator.ra,
      dec: equator.dec,
      azimuth: horizon.azimuth,
      altitude: horizon.altitude,
    });
  });
  const nodePairs = [["Rahu", meanNorthNode(time)], ["Ketu", normalizeDegrees(meanNorthNode(time) + 180)]] as const;
  for (const [name, longitude] of nodePairs) {
    const equatorial = eclipticToEquatorial(longitude);
    const horizon = Horizon(time, observer, equatorial.rightAscension, equatorial.declination, "normal");
    domePoints.push(pointLabel(name, longitude, equalHouseFor(longitude, domeAscendant), gleasonMapPoint(equatorial.rightAscension, equatorial.declination), {
      ra: equatorial.rightAscension,
      dec: equatorial.declination,
      azimuth: horizon.azimuth,
      altitude: horizon.altitude,
    }));
  }

  const conventionalPoints = PHYSICAL_BODIES.map(([name, body]) => {
    const longitude = normalizeDegrees(name === "Sun" ? SunPosition(time).elon : Ecliptic(GeoVector(body, time, true)).elon);
    return pointLabel(name, longitude, placidusHouseFor(longitude, placidus.cusps), tropicalWheelPoint(longitude));
  });
  for (const [name, longitude] of nodePairs) {
    conventionalPoints.push(pointLabel(name, longitude, placidusHouseFor(longitude, placidus.cusps), tropicalWheelPoint(longitude)));
  }

  return {
    event: {
      venueName: input.venueName,
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: input.timezone,
      local: input.local,
      utcIso: input.utcDate.toISOString(),
    },
    domeModel: {
      id: "atlas-live-engine-v1",
      ephemeris: "Astronomy Engine geocentric tropical ecliptic-of-date longitude; local RA/declination and horizon used for the Gleason map.",
      axes: "Direct UTC-degree axes: MC = UTC° + longitude; ASC = MC + 90°.",
      houseSystem: "Equal Houses: twelve 30° sectors from the direct Ascendant.",
      projection: "RA/declination Gleason polar projection; local azimuth and altitude are shown as observer readings.",
      ascendant: domeAscendant,
      midheaven: domeMidheaven,
      points: domePoints,
    },
    conventionalTropicalReference: {
      ephemeris: "Astronomy Engine geocentric apparent tropical ecliptic longitude.",
      houseSystem: "Tropical Placidus houses from the local event observer.",
      houseEngine: placidus.houseEngine,
      ascendant: placidus.ascendant,
      midheaven: placidus.midheaven,
      points: conventionalPoints,
    },
    boundary: "This comparison is an inspection reference only. Neither coordinate view, its houses, map points, or differences are supplied to Cluster, Territorial, KP, Frawley, Tajika/Prasna, Panchanga, God–Agent, or the cross-method ledger.",
  };
}
