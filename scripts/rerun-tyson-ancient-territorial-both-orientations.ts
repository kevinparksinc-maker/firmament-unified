import { calculateAncientHorizonTerritorial } from "../server/ancientHorizonTerritorial";

const base = {
  utcDate: new Date("1990-02-11T00:00:00.000Z"),
  latitude: 35.7056,
  longitude: 139.7519,
  altitude: 0,
  dayOfYear: 42,
  localModelAngleDegrees: 139.7519,
  observerDistanceFromPoleMiles: 4000,
  sideAName: "Mike Tyson / Side A",
  sideBName: "Buster Douglas / Side B",
};

for (const orientation of ["standard", "inverse-180"] as const) {
  const result = await calculateAncientHorizonTerritorial({ ...base, orientation });
  console.log(JSON.stringify({
    orientation,
    ascendantDegrees: result.source.ascendantDegrees,
    observer: result.source.observer,
    longitudeFrame: result.source.longitudeFrame,
    houseSystem: result.source.houseSystem,
    houseLords: [...result.cluster.sideAHouses, ...result.cluster.sideBHouses].map((house) => ({
      side: house.side,
      house: house.houseNumber,
      lord: house.lordPlanet,
      lordSign: house.lordSign,
      lordHouse: house.lordHouse,
      totalPoints: house.totalPoints,
      reasoning: house.reasoning,
    })),
    sideATotal: result.cluster.sideATotal,
    sideBTotal: result.cluster.sideBTotal,
    sideATerritorial: result.cluster.sideATerritorial,
    sideBTerritorial: result.cluster.sideBTerritorial,
    sideAGrandTotal: result.cluster.sideAGrandTotal,
    sideBGrandTotal: result.cluster.sideBGrandTotal,
    margin: result.cluster.margin,
    prediction: result.cluster.prediction,
  }, null, 2));
}
