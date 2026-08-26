import * as AstronomyModule from "astronomy-engine";
import { FIXED_STARS } from "./fixedStars";
import { getNakshatraAt } from "./nakshatra";
import { getAtlasDignity, getStrictCombustion, type AtlasCombustion, type AtlasDignity } from "./atlasDignities";
import { ATLAS_PHENOMENA_REGISTRY, findAtlasPlanetaryWars, getAtlasMotion, type AtlasMotion, type AtlasPlanetaryWar } from "./atlasPhenomena";

const astronomyDefault = Reflect.get(AstronomyModule, "default") as typeof AstronomyModule | undefined;
const Astronomy = astronomyDefault ?? AstronomyModule;

export const ATLAS_CALCULATION_BASELINE = {
  id: "atlas-live-engine-v1",
  ephemeris: "Astronomy Engine live geocentric tropical ecliptic-of-date longitude",
  axes: "Direct UTC-degree axes: MC = UTC° + longitude; ASC = MC + 90°",
  houses: "Equal Houses: 30° intervals beginning at the direct Ascendant",
  mapLayers: "RA/declination for Gleason; topocentric azimuth/altitude for local compass",
} as const;

export type ZeteticInput = {
  birthDate: string;
  birthTime: string;
  timezone: string;
  location: string;
  latitude: number;
  longitude: number;
};

export type ZeteticPoint = {
  key: string;
  name: string;
  short: string;
  kind: "planet" | "node" | "angle";
  longitude: number;
  sign: string;
  signSymbol: string;
  degree: number;
  house: number;
  rightAscension: number;
  declination: number;
  azimuth: number;
  altitude: number;
  nakshatra: { name: string; lord: string; pada: number };
  dignity: AtlasDignity;
  combustion: AtlasCombustion;
  motion: AtlasMotion;
  fixedStars: Array<{
    name: string;
    orb: number;
    nature: string;
    archetype: string;
    isRoyal: boolean;
    isPolar: boolean;
  }>;
  color: string;
};

export type ZeteticHouse = {
  number: number;
  start: number;
  end: number;
  startLabel: string;
  endLabel: string;
};

export type ZeteticChart = {
  baseline: typeof ATLAS_CALCULATION_BASELINE;
  input: ZeteticInput;
  utcDate: Date;
  utcDegrees: number;
  ascendant: number;
  descendant: number;
  midheaven: number;
  imumCoeli: number;
  houses: ZeteticHouse[];
  points: ZeteticPoint[];
  planetaryWars: AtlasPlanetaryWar[];
};

const ZODIAC = [
  ["Aries", "♈"], ["Taurus", "♉"], ["Gemini", "♊"], ["Cancer", "♋"],
  ["Leo", "♌"], ["Virgo", "♍"], ["Libra", "♎"], ["Scorpio", "♏"],
  ["Sagittarius", "♐"], ["Capricorn", "♑"], ["Aquarius", "♒"], ["Pisces", "♓"],
] as const;

const PLANETS = [
  ["Sun", "Su", Astronomy.Body.Sun, "#f4c96b"],
  ["Moon", "Mo", Astronomy.Body.Moon, "#c7d8e8"],
  ["Mercury", "Me", Astronomy.Body.Mercury, "#a8c5bb"],
  ["Venus", "Ve", Astronomy.Body.Venus, "#e4a6bf"],
  ["Mars", "Ma", Astronomy.Body.Mars, "#df826b"],
  ["Jupiter", "Ju", Astronomy.Body.Jupiter, "#cda36e"],
  ["Saturn", "Sa", Astronomy.Body.Saturn, "#8f999d"],
  ["Uranus", "Ur", Astronomy.Body.Uranus, "#7cb7c7"],
  ["Neptune", "Ne", Astronomy.Body.Neptune, "#7995db"],
  ["Pluto", "Pl", Astronomy.Body.Pluto, "#b78ec9"],
] as const;

const normalize = (value: number) => ((value % 360) + 360) % 360;

export function zodiacFor(longitude: number) {
  const normalized = normalize(longitude);
  const index = Math.floor(normalized / 30);
  const [name, symbol] = ZODIAC[index] ?? ZODIAC[0];
  return { name, symbol, degree: normalized % 30 };
}

export function localWallTimeToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let instant = target;
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  for (let index = 0; index < 3; index += 1) {
    const parts = formatter.formatToParts(new Date(instant));
    const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
    const represented = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second || 0);
    const delta = target - represented;
    instant += delta;
    if (Math.abs(delta) < 1000) break;
  }
  return new Date(instant);
}

export function gleasonPoint(rightAscension: number, declination: number, mapRadius = 405) {
  const radius = (mapRadius / Math.PI) * (Math.PI / 2 - (declination * Math.PI) / 180);
  const angle = (rightAscension * 15 * Math.PI) / 180;
  return { x: 500 + radius * Math.sin(angle), y: 500 - radius * Math.cos(angle), radius };
}

export function compassPoint(azimuth: number, altitude: number, mapRadius = 405) {
  const radius = ((90 - altitude) / 90) * mapRadius;
  const angle = (azimuth * Math.PI) / 180;
  return { x: 500 + radius * Math.sin(angle), y: 500 - radius * Math.cos(angle), radius, visible: altitude >= 0 };
}

export function equalHouseForLongitude(longitude: number, ascendant: number) {
  return Math.floor(normalize(longitude - ascendant) / 30) + 1;
}

function shortestAngularDistance(first: number, second: number) {
  const difference = Math.abs(normalize(first) - normalize(second));
  return Math.min(difference, 360 - difference);
}

function fixedGridStarContext(longitude: number) {
  return FIXED_STARS
    .map(star => {
      const orb = shortestAngularDistance(longitude, star.sidDegree);
      const maximumOrb = star.isRoyal || star.isPolar ? 2 : 1.5;
      return { star, orb, maximumOrb };
    })
    .filter(({ orb, maximumOrb }) => orb <= maximumOrb)
    .sort((first, second) => first.orb - second.orb)
    .map(({ star, orb }) => ({
      name: star.name,
      orb: Math.round(orb * 100) / 100,
      nature: star.nature,
      archetype: star.archetype,
      isRoyal: Boolean(star.isRoyal),
      isPolar: Boolean(star.isPolar),
    }));
}

function eclipticToEquatorial(longitude: number) {
  const obliquity = (23.4392911 * Math.PI) / 180;
  const lambda = (longitude * Math.PI) / 180;
  const rightAscensionDegrees = normalize(Math.atan2(Math.sin(lambda) * Math.cos(obliquity), Math.cos(lambda)) * 180 / Math.PI);
  const declination = Math.asin(Math.sin(lambda) * Math.sin(obliquity)) * 180 / Math.PI;
  return { rightAscension: rightAscensionDegrees / 15, declination };
}

function meanNorthNode(time: AstronomyModule.AstroTime) {
  const centuries = time.tt / 36525;
  return normalize(125.04452 - 1934.136261 * centuries + 0.0020708 * centuries * centuries + (centuries ** 3) / 450000);
}

function makePoint(
  key: string,
  name: string,
  short: string,
  kind: ZeteticPoint["kind"],
  longitude: number,
  rightAscension: number,
  declination: number,
  azimuth: number,
  altitude: number,
  ascendant: number,
  color: string,
  sunLongitude: number,
  motion: AtlasMotion,
): ZeteticPoint {
  const zodiac = zodiacFor(longitude);
  const nakshatra = getNakshatraAt(longitude);
  return {
    key,
    name,
    short,
    kind,
    longitude,
    sign: zodiac.name,
    signSymbol: zodiac.symbol,
    degree: zodiac.degree,
    house: equalHouseForLongitude(longitude, ascendant),
    dignity: getAtlasDignity(name, zodiac.name),
    combustion: kind === "planet"
      ? getStrictCombustion(name, longitude, sunLongitude)
      : { applicable: false, isKazimi: false, isCombust: false, status: "not-applicable", angularDistance: null, threshold: 15, rule: "Strict raw tropical longitude: shortest Sun–planet distance ≤ 15.0°" },
    motion,
    rightAscension,
    declination,
    azimuth,
    altitude,
    nakshatra: { name: nakshatra.nakshatra.name, lord: nakshatra.nakshatra.lord, pada: nakshatra.pada },
    // Permanent catalog anchors on Firmament's fixed grid, explicitly separate
    // from live tropical planetary positions and not an ayanamsa correction.
    fixedStars: kind === "planet" ? fixedGridStarContext(longitude) : [],
    color,
  };
}

export function calculateZeteticChart(input: ZeteticInput): ZeteticChart {
  const utcDate = localWallTimeToUtc(input.birthDate, input.birthTime, input.timezone);
  const time = Astronomy.MakeTime(utcDate);
  const observer = new Astronomy.Observer(input.latitude, input.longitude, 0);
  const utcDegrees = utcDate.getUTCHours() * 15 + utcDate.getUTCMinutes() * 0.25 + utcDate.getUTCSeconds() / 240;
  const midheaven = normalize(utcDegrees + input.longitude);
  const ascendant = normalize(midheaven + 90);
  const descendant = normalize(ascendant + 180);
  const imumCoeli = normalize(midheaven + 180);

  const livePlanetCoordinates = PLANETS.map(([name, short, body, color]) => {
    const longitude = normalize(Astronomy.Ecliptic(Astronomy.GeoVector(body, time, false)).elon);
    const halfWindowDays = ATLAS_PHENOMENA_REGISTRY.retrograde.sampleHalfWindowDays;
    const longitudeBefore = normalize(Astronomy.Ecliptic(Astronomy.GeoVector(body, time.AddDays(-halfWindowDays), false)).elon);
    const longitudeAfter = normalize(Astronomy.Ecliptic(Astronomy.GeoVector(body, time.AddDays(halfWindowDays), false)).elon);
    const motion = getAtlasMotion(longitudeBefore, longitudeAfter, halfWindowDays * 2);
    const equator = Astronomy.Equator(body, time, observer, true, true);
    const horizon = Astronomy.Horizon(time, observer, equator.ra, equator.dec, "normal");
    return { name, short, color, longitude, motion, equator, horizon };
  });
  const sunLongitude = livePlanetCoordinates.find(point => point.name === "Sun")?.longitude;
  if (sunLongitude === undefined) throw new Error("Live Sun longitude is required to evaluate combustion.");
  const planets = livePlanetCoordinates.map(({ name, short, color, longitude, motion, equator, horizon }) =>
    makePoint(name.toLowerCase(), name, short, "planet", longitude, equator.ra, equator.dec, horizon.azimuth, horizon.altitude, ascendant, color, sunLongitude, motion)
  );
  const planetaryWars = findAtlasPlanetaryWars(planets);

  const markers = [
    ["north-node", "North Node", "☊", "node", meanNorthNode(time), "#72c5b4"],
    ["south-node", "South Node", "☋", "node", normalize(meanNorthNode(time) + 180), "#b78ec9"],
    ["ascendant", "Ascendant", "ASC", "angle", ascendant, "#81cabc"],
    ["descendant", "Descendant", "DSC", "angle", descendant, "#df826b"],
    ["midheaven", "Midheaven", "MC", "angle", midheaven, "#f4c96b"],
    ["imum-coeli", "Imum Coeli", "IC", "angle", imumCoeli, "#a8c5bb"],
  ] as const;

  const points = markers.map(([key, name, short, kind, longitude, color]) => {
    const equatorial = eclipticToEquatorial(longitude);
    const horizon = Astronomy.Horizon(time, observer, equatorial.rightAscension, equatorial.declination, "normal");
    return makePoint(key, name, short, kind, longitude, equatorial.rightAscension, equatorial.declination, horizon.azimuth, horizon.altitude, ascendant, color, sunLongitude, { applicable: false, speedDegreesPerDay: null, isRetrograde: false, rule: ATLAS_PHENOMENA_REGISTRY.retrograde.rule });
  });

  const houses = Array.from({ length: 12 }, (_, index) => {
    const start = normalize(ascendant + index * 30);
    const end = normalize(start + 30);
    const startZodiac = zodiacFor(start);
    const endZodiac = zodiacFor(end);
    return { number: index + 1, start, end, startLabel: `${startZodiac.symbol} ${startZodiac.name} ${startZodiac.degree.toFixed(1)}°`, endLabel: `${endZodiac.symbol} ${endZodiac.name} ${endZodiac.degree.toFixed(1)}°` };
  });

  return { baseline: ATLAS_CALCULATION_BASELINE, input, utcDate, utcDegrees, ascendant, descendant, midheaven, imumCoeli, houses, points: [...planets, ...points], planetaryWars };
}
