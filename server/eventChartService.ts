import { createRequire } from "module";
import circularNatalPackage from "circular-natal-horoscope-js";

const require = createRequire(import.meta.url);
const Astronomy = require("astronomy-engine");

const {
  MakeTime,
  SunPosition,
  GeoVector,
  Ecliptic,
  Body,
} = Astronomy as {
  MakeTime: (date: Date) => unknown;
  SunPosition: (time: unknown) => { elon: number };
  GeoVector: (body: unknown, time: unknown, aberration: boolean) => { x: number; y: number; z: number };
  Ecliptic: (vector: { x: number; y: number; z: number }) => { elon: number; elat: number };
  Body: Record<string, unknown>;
};

type CircularNatalExports = {
  Origin: new (input: {
    year: number;
    month: number;
    date: number;
    hour: number;
    minute: number;
    latitude: number;
    longitude: number;
  }) => { utcTimeFormatted: string };
  Horoscope: new (input: {
    origin: unknown;
    houseSystem: "placidus";
    zodiac: "tropical";
  }) => {
    Houses: Array<{
      ChartPosition: {
        StartPosition: { Ecliptic: { DecimalDegrees: number } };
      };
    }>;
    Ascendant: { ChartPosition: { Ecliptic: { DecimalDegrees: number } } };
    Midheaven: { ChartPosition: { Ecliptic: { DecimalDegrees: number } } };
  };
};

const circularNatal = circularNatalPackage as unknown as CircularNatalExports;

export const TRADITIONAL_PLANETS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
] as const;

export type TraditionalPlanetName = (typeof TRADITIONAL_PLANETS)[number];

const BODY_BY_PLANET: Record<TraditionalPlanetName, unknown> = {
  Sun: Body.Sun,
  Moon: Body.Moon,
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
};

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export type EventLocalCivilTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export type EventChartRequest = {
  local: EventLocalCivilTime;
  utcDate: Date;
  latitude: number;
  longitude: number;
  altitude?: number;
};

export type EventPlanet = {
  name: TraditionalPlanetName;
  longitude: number;
  speedDegreesPerDay: number;
  retrograde: boolean;
  sign: ZodiacSign;
  degreeInSign: number;
  eclipticLatitude: number;
  declination: number;
};

export type PlacidusEventChart = {
  houseSystem: "Placidus";
  houseEngine: "circular-natal-horoscope-js@1.1.0";
  zodiac: "tropical";
  eventUtcIso: string;
  cusps: number[];
  ascendant: number;
  midheaven: number;
  planets: EventPlanet[];
};

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function signedArc(from: number, to: number): number {
  const difference = normalizeDegrees(to) - normalizeDegrees(from);
  return difference > 180 ? difference - 360 : difference <= -180 ? difference + 360 : difference;
}

export function shortestArc(first: number, second: number): number {
  return Math.abs(signedArc(first, second));
}

export function signAt(longitude: number): ZodiacSign {
  return ZODIAC_SIGNS[Math.floor(normalizeDegrees(longitude) / 30)] ?? "Aries";
}

export function longitudeAt(planet: TraditionalPlanetName, date: Date): number {
  const time = MakeTime(date);
  if (planet === "Sun") return normalizeDegrees(SunPosition(time).elon);
  const vector = GeoVector(BODY_BY_PLANET[planet], time, true);
  return normalizeDegrees(Ecliptic(vector).elon);
}

export function eventPlanetAt(planet: TraditionalPlanetName, date: Date): EventPlanet {
  const time = MakeTime(date);
  const vector = planet === "Sun" ? null : GeoVector(BODY_BY_PLANET[planet], time, true);
  const longitude = planet === "Sun"
    ? normalizeDegrees(SunPosition(time).elon)
    : normalizeDegrees(Ecliptic(vector!).elon);
  const ecliptic = vector ? Ecliptic(vector) : { elat: 0 };
  const halfDayMs = 12 * 60 * 60 * 1000;
  const before = longitudeAt(planet, new Date(date.getTime() - halfDayMs));
  const after = longitudeAt(planet, new Date(date.getTime() + halfDayMs));
  const speedDegreesPerDay = signedArc(before, after);
  const distance = vector ? Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2) : 1;
  const declination = vector ? Math.asin(vector.z / distance) * 180 / Math.PI : 0;

  return {
    name: planet,
    longitude,
    speedDegreesPerDay,
    retrograde: speedDegreesPerDay < 0,
    sign: signAt(longitude),
    degreeInSign: normalizeDegrees(longitude) % 30,
    eclipticLatitude: ecliptic.elat,
    declination,
  };
}

export function calculatePlacidusEventChart(request: EventChartRequest): PlacidusEventChart {
  const origin = new circularNatal.Origin({
    year: request.local.year,
    month: request.local.month - 1,
    date: request.local.day,
    hour: request.local.hour,
    minute: request.local.minute,
    latitude: request.latitude,
    longitude: request.longitude,
  });
  const derivedUtc = new Date(origin.utcTimeFormatted);
  if (!Number.isFinite(derivedUtc.getTime()) || Math.abs(derivedUtc.getTime() - request.utcDate.getTime()) > 60_000) {
    throw new Error("The Placidus service did not reproduce the verified UTC event instant.");
  }

  const horoscope = new circularNatal.Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
  });
  const cusps = Array.from({ length: 12 }, (_, index) =>
    Number(horoscope.Houses[index]?.ChartPosition.StartPosition.Ecliptic.DecimalDegrees),
  );
  if (cusps.length !== 12 || cusps.some(cusp => !Number.isFinite(cusp))) {
    throw new Error("The Placidus service did not return twelve finite house cusps.");
  }

  const ascendant = Number(horoscope.Ascendant.ChartPosition.Ecliptic.DecimalDegrees);
  const midheaven = Number(horoscope.Midheaven.ChartPosition.Ecliptic.DecimalDegrees);
  if (!Number.isFinite(ascendant) || !Number.isFinite(midheaven)) {
    throw new Error("The Placidus service did not return finite Ascendant and Midheaven values.");
  }

  return {
    houseSystem: "Placidus",
    houseEngine: "circular-natal-horoscope-js@1.1.0",
    zodiac: "tropical",
    eventUtcIso: request.utcDate.toISOString(),
    cusps: cusps.map(normalizeDegrees),
    ascendant: normalizeDegrees(ascendant),
    midheaven: normalizeDegrees(midheaven),
    planets: TRADITIONAL_PLANETS.map(planet => eventPlanetAt(planet, request.utcDate)),
  };
}
