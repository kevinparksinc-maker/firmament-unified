import { writeFile } from "node:fs/promises";
import { calculateCoordinateComparison } from "../server/coordinateComparison";

const comparison = calculateCoordinateComparison({
  local: { year: 1990, month: 2, day: 11, hour: 9, minute: 0 },
  utcDate: new Date("1990-02-11T00:00:00.000Z"),
  latitude: 35.7056,
  longitude: 139.7519,
  altitude: 0,
  venueName: "Tokyo Dome",
  timezone: "Asia/Tokyo",
});

await writeFile("/tmp/tyson-douglas-coordinate-comparison.json", `${JSON.stringify(comparison, null, 2)}\n`);
console.log("Wrote /tmp/tyson-douglas-coordinate-comparison.json");
