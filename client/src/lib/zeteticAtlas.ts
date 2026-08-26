import * as Astronomy from "astronomy-engine";

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
  input: ZeteticInput;
  utcDate: Date;
  utcDegrees: number;
  ascendant: number;
  descendant: number;
  midheaven: number;
  imumCoeli: number;
  houses: ZeteticHouse[];
  points: ZeteticPoint[];
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

function houseFor(longitude: number, ascendant: number) {
  return Math.floor(normalize(longitude - ascendant) / 30) + 1;
}

function eclipticToEquatorial(longitude: number) {
  const obliquity = (23.4392911 * Math.PI) / 180;
  const lambda = (longitude * Math.PI) / 180;
  const rightAscensionDegrees = normalize(Math.atan2(Math.sin(lambda) * Math.cos(obliquity), Math.cos(lambda)) * 180 / Math.PI);
  const declination = Math.asin(Math.sin(lambda) * Math.sin(obliquity)) * 180 / Math.PI;
  return { rightAscension: rightAscensionDegrees / 15, declination };
}

function meanNorthNode(time: Astronomy.AstroTime) {
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
): ZeteticPoint {
  const zodiac = zodiacFor(longitude);
  return { key, name, short, kind, longitude, sign: zodiac.name, signSymbol: zodiac.symbol, degree: zodiac.degree, house: houseFor(longitude, ascendant), rightAscension, declination, azimuth, altitude, color };
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

  const planets = PLANETS.map(([name, short, body, color]) => {
    const longitude = normalize(Astronomy.Ecliptic(Astronomy.GeoVector(body, time, false)).elon);
    const equator = Astronomy.Equator(body, time, observer, true, true);
    const horizon = Astronomy.Horizon(time, observer, equator.ra, equator.dec, "normal");
    return makePoint(name.toLowerCase(), name, short, "planet", longitude, equator.ra, equator.dec, horizon.azimuth, horizon.altitude, ascendant, color);
  });

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
    return makePoint(key, name, short, kind, longitude, equatorial.rightAscension, equatorial.declination, horizon.azimuth, horizon.altitude, ascendant, color);
  });

  const houses = Array.from({ length: 12 }, (_, index) => {
    const start = normalize(ascendant + index * 30);
    const end = normalize(start + 30);
    const startZodiac = zodiacFor(start);
    const endZodiac = zodiacFor(end);
    return { number: index + 1, start, end, startLabel: `${startZodiac.symbol} ${startZodiac.name} ${startZodiac.degree.toFixed(1)}°`, endLabel: `${endZodiac.symbol} ${endZodiac.name} ${endZodiac.degree.toFixed(1)}°` };
  });

  return { input, utcDate, utcDegrees, ascendant, descendant, midheaven, imumCoeli, houses, points: [...planets, ...points] };
}
