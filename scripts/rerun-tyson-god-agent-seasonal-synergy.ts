import { calculateGodAgentSeasonalSynergy } from "../server/godAgentSeasonalSynergy";

const result = await calculateGodAgentSeasonalSynergy({
  utcDate: new Date("1990-02-11T00:00:00.000Z"),
  latitude: 35.7056,
  longitude: 139.7519,
  altitude: 0,
  dayOfYear: 42,
  localModelAngleDegrees: 139.7519,
  observerDistanceFromPoleMiles: 4000,
  orientation: "standard",
});

console.log(JSON.stringify({
  protocol: result.version,
  event: {
    name: "Mike Tyson vs. James Buster Douglas",
    utc: result.eventUtcIso,
    venue: "Tokyo Dome",
    observer: result.topocentricObserver,
  },
  fields: {
    godView: "fixed background RA sectors; independent God polarity",
    agentView: "topocentric planetary ecliptic longitudes assigned to Ancient-Horizon Equal Houses",
    synthesis: result.synthesis.rule,
  },
  seasonalAudit: result.seasonalAudit,
  rows: result.agentView.rows,
  synthesis: result.synthesis,
}, null, 2));
