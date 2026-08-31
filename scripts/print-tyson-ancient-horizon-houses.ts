import { calculateChart } from "../server/ephemeris";
import { calculateDomeSeasonalRadiusAudit } from "../server/domeSeasonalRadius";

const event = {
  utcDate: new Date("1990-02-11T00:00:00.000Z"),
  venue: "Tokyo Dome",
  latitude: 35.7056,
  longitude: 139.7519,
};

const localModelAngleDegrees = event.longitude;
const observerDistanceFromPoleMiles = 4000;
const dayOfYear = 42;
const seasonal = calculateDomeSeasonalRadiusAudit({
  dayOfYear,
  localSiderealAngleDegrees: localModelAngleDegrees,
  observerDistanceFromPoleMiles,
});
const ascendant = seasonal.ascendantDegrees;

const normalize = (value: number) => ((value % 360) + 360) % 360;
const zodiac = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
const signAt = (longitude: number) => {
  const normalized = normalize(longitude);
  const index = Math.floor(normalized / 30);
  return {
    sign: zodiac[index],
    degree: normalized - index * 30,
  };
};
const houseFor = (longitude: number) =>
  Math.floor(normalize(longitude - ascendant) / 30) + 1;
const houseStart = (house: number) => normalize(ascendant + (house - 1) * 30);

const chart = await calculateChart(event.utcDate, {
  latitude: event.latitude,
  longitude: event.longitude,
  altitude: 0,
});

const houses = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1;
  const startLongitude = houseStart(number);
  const endLongitude = houseStart(number === 12 ? 1 : number + 1);
  const start = signAt(startLongitude);
  const end = signAt(endLongitude);
  const planets = chart.planets
    .filter((planet) => houseFor(planet.eclipticLon) === number)
    .map((planet) => ({
      name: planet.name,
      rawLongitude: normalize(planet.eclipticLon),
      sign: signAt(planet.eclipticLon).sign,
      degreeInSign: signAt(planet.eclipticLon).degree,
      longitudeSource: planet.longitudeSource,
    }));
  return {
    house: number,
    startLongitude,
    endLongitude,
    startLabel: `${start.degree.toFixed(4)}° ${start.sign}`,
    endLabel: `${end.degree.toFixed(4)}° ${end.sign}`,
    planets,
  };
});

console.log(JSON.stringify({
  protocol: "tyson-douglas-ancient-horizon-house-lineup-v1",
  event,
  methodBoundary: "Planetary longitudes are the frozen event chart; only the house anchor comes from the experimental Ancient-Horizon seasonal-radius path.",
  assumptions: {
    dayOfYear,
    localModelAngleDegrees,
    observerDistanceFromPoleMiles,
    ascendantDegrees: ascendant,
    houseSystem: "Equal Houses, 30° sectors from Ancient-Horizon Ascendant",
  },
  seasonal,
  houses,
}, null, 2));
