import { calculateGodAgentSeasonalSynergy } from "../server/godAgentSeasonalSynergy";

const base = {
  utcDate: new Date("1990-02-11T00:00:00.000Z"),
  latitude: 35.7056,
  longitude: 139.7519,
  altitude: 0,
  dayOfYear: 42,
  localModelAngleDegrees: 139.7519,
  observerDistanceFromPoleMiles: 4000,
};

for (const orientation of ["standard", "inverse-180"] as const) {
  const result = await calculateGodAgentSeasonalSynergy({ ...base, orientation });
  console.log(JSON.stringify({
    orientation,
    topocentricObserver: result.topocentricObserver,
    godAxes: result.godView.axes,
    godCounts: result.godView.counts,
    godPolarity: result.godView.polarity,
    ancientHorizonAscendant: result.agentView.ascendantDegrees,
    rows: result.agentView.rows.map((row) => ({
      planet: row.planet,
      godSector: row.godSector,
      godRaHours: row.godRaHours,
      agentRawLongitude: row.agentRawLongitude,
      agentSign: row.agentSign,
      agentHouse: row.agentHouse,
      agentFamily: row.agentFamily,
      synergyCell: row.synergyCell,
      sideASupport: row.sideASupport,
      sideBSupport: row.sideBSupport,
      sideAConflict: row.sideAConflict,
      sideBConflict: row.sideBConflict,
    })),
    synthesis: result.synthesis,
  }, null, 2));
}
