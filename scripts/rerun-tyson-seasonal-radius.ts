import { readFile } from "node:fs/promises";
import {
  calculateDomeSeasonalRadiusAudit,
  DEFAULT_DOME_SEASONAL_RADIUS_CONFIG,
} from "../server/domeSeasonalRadius";

type FrozenRecord = {
  event: {
    localDate: string;
    localTime: string;
    timezone: string;
    venue: string;
    latitude: number;
    longitude: number;
    sideA: string;
    sideB: string;
  };
  outcomeProvenance: { winnerSide: string; winner: string; method: string };
};

const record = JSON.parse(
  await readFile(
    new URL("../data/historical/tyson-douglas-1990-02-11.json", import.meta.url),
    "utf8",
  ),
) as FrozenRecord;

const [year, month, day] = record.event.localDate.split("-").map(Number);
const utcDate = new Date("1990-02-11T00:00:00.000Z");
const utcDegrees =
  ((utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60) / 24) * 360;

// The existing direct-axis dome convention uses UTC degrees + venue longitude
// as its event meridian. We expose that value as the new path's explicit local
// angular input; this is a declared bridge, not a claim that it is sidereal time.
const localModelAngle = ((utcDegrees + record.event.longitude) % 360 + 360) % 360;

// No observer radial distance was present in the frozen historical record.
// This is a replaceable demonstration assumption and is printed in the output.
const observerDistanceFromPoleMiles = 4000;
const dayOfYear = Math.floor(
  (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86_400_000,
);

const audit = calculateDomeSeasonalRadiusAudit({
  dayOfYear,
  localSiderealAngleDegrees: localModelAngle,
  observerDistanceFromPoleMiles,
  config: DEFAULT_DOME_SEASONAL_RADIUS_CONFIG,
});

console.log(
  JSON.stringify(
    {
      protocol: "tyson-douglas-ancient-horizon-seasonal-radius-v1",
      evaluationBoundary:
        "Audit-only historical stress test. The observed result is post-calculation provenance and is not used by the calculation.",
      event: record.event,
      declaredAssumptions: {
        localModelAngleDegrees: localModelAngle,
        localModelAngleSource:
          "Existing direct-axis bridge: UTC degrees + Tokyo Dome longitude, normalized; not derived as conventional sidereal time.",
        observerDistanceFromPoleMiles,
        observerDistanceSource:
          "Demonstration assumption because the frozen historical record does not specify a dome radial distance.",
        seasonalRadiusConfig: DEFAULT_DOME_SEASONAL_RADIUS_CONFIG,
      },
      audit,
      outcomeProvenanceForPostCalculationEvaluationOnly: record.outcomeProvenance,
    },
    null,
    2,
  ),
);
