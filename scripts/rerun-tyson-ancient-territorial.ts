import { calculateAncientHorizonTerritorial } from "../server/ancientHorizonTerritorial";

const result = await calculateAncientHorizonTerritorial({
  utcDate: new Date("1990-02-11T00:00:00.000Z"),
  latitude: 35.7056,
  longitude: 139.7519,
  altitude: 0,
  dayOfYear: 42,
  localModelAngleDegrees: 139.7519,
  observerDistanceFromPoleMiles: 4000,
  sideAName: "Mike Tyson / Side A",
  sideBName: "Buster Douglas / Side B",
});

console.log(JSON.stringify({
  protocol: result.version,
  method: result.method,
  source: result.source,
  seasonalAudit: result.seasonalAudit,
  chart: result.chart,
  houses: result.houses,
  cluster: result.cluster,
}, null, 2));
