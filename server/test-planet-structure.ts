/**
 * Debug: Check actual planet structure returned from ephemeris
 */

import { calculateChart } from "./ephemeris";

async function checkStructure() {
  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = {
    latitude: 39.9526,
    longitude: -75.1652,
    altitude: 0,
  };

  const result = await calculateChart(date, observer);

  console.log("First planet object:");
  console.log(JSON.stringify(result.planets[0], null, 2));

  console.log("\n\nAll planets (summary):");
  result.planets.forEach((p) => {
    console.log(`${p.name}: lon=${(p as any).lon}, absolute=${(p as any).eclipticLon}, degree=${p.degree}`);
  });
}

checkStructure().catch(console.error);
