import { calculateGodAgentSeasonalSynergy } from "../server/godAgentSeasonalSynergy";
const result = await calculateGodAgentSeasonalSynergy({
  utcDate: new Date("1990-02-11T00:00:00.000Z"), latitude: 35.7056, longitude: 139.7519,
  altitude: 0, dayOfYear: 42, localModelAngleDegrees: 139.7519, observerDistanceFromPoleMiles: 4000,
});
console.log(JSON.stringify(result.aspects, null, 2));
