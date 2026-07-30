/**
 * Debug: Why are house cusps not being found?
 */

import { calculateChart } from "./ephemeris";

async function debugHouseCusps() {
  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = { latitude: 39.9526, longitude: -75.1652, altitude: 0 };

  console.log("Calculating chart with house cusps...\n");

  const result = await calculateChart(date, observer);

  console.log("House cusps structure:");
  console.log(JSON.stringify(result.houses, null, 2));

  console.log("\nPlanets:");
  result.planets.slice(0, 5).forEach((p: any) => {
    console.log(`${p.name.padEnd(10)} House: ${p.house}, Sidereal: ${p.eclipticLon?.toFixed(1) || "undefined"}°`);
  });

  console.log("\nExpected cusps format for getHouseNumber():");
  console.log("cusps[0] = H1 start, cusps[1] = H2 start, ... cusps[11] = H12 start");
}

debugHouseCusps();
