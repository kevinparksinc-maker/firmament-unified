import { calculateChart } from "../server/ephemeris";
import { ATLAS_CALCULATION_BASELINE, calculateZeteticChart, equalHouseForLongitude } from "../client/src/lib/zeteticAtlas";

const normalize = (value: number) => ((value % 360) + 360) % 360;
const utcDate = new Date(Date.UTC(1986, 10, 20, 16, 6, 0));
const legacy = await calculateChart(utcDate, { latitude: 32.7767, longitude: -96.797, altitude: 0 });
const atlas = calculateZeteticChart({
  birthDate: "1986-11-20",
  birthTime: "10:06",
  timezone: "America/Chicago",
  location: "Dallas, Texas",
  latitude: 32.7767,
  longitude: -96.797,
});
const legacyMars = legacy.planets.find(point => point.name === "Mars");
const atlasMars = atlas.points.find(point => point.name === "Mars");
const directUtcDegrees = 16 * 15 + 6 * 0.25;
const directMc = normalize(directUtcDegrees - 96.797);
const directAsc = normalize(directMc + 90);
const suppliedFixtureMars = 235;

console.log(JSON.stringify({
  atlasBaseline: ATLAS_CALCULATION_BASELINE,
  input: { local: "1986-11-20 10:06 America/Chicago", utc: utcDate.toISOString(), latitude: 32.7767, longitude: -96.797 },
  legacyNatal: { ascendant: legacy.houses.ascendant, mc: legacy.houses.mc, system: "sidereal-time axis + Whole Sign houses", mars: legacyMars },
  zeteticAtlasLive: { utc: atlas.utcDate.toISOString(), utcDegrees: atlas.utcDegrees, ascendant: atlas.ascendant, mc: atlas.midheaven, system: "direct UTC-degree axes + Equal Houses", mars: atlasMars },
  suppliedDirectReference: {
    utcDegrees: directUtcDegrees,
    ascendant: directAsc,
    mc: directMc,
    status: "historical reference only; never active live ephemeris data",
    suppliedMarsLongitude: suppliedFixtureMars,
    suppliedMarsHouse: equalHouseForLongitude(suppliedFixtureMars, directAsc),
  },
}, null, 2));
