/**
 * OLD SYSTEM BREAKDOWN
 * Shows how houseClusterEngine scores the same chart
 */

import { calculateChart } from "./ephemeris";
import { evaluateCluster } from "./houseClusterEngine";

async function analyzeOldSystem() {
  const date = new Date(Date.UTC(2024, 5, 8, 23, 35, 0)); // June 7, 2024, 11:35 PM UTC
  const lat = 40.8295;  // Yankee Stadium
  const lon = -73.9262;

  const ephResult = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });

  const planets: Record<string, any> = {};
  ephResult.planets.forEach((p) => {
    planets[p.name] = p;
  });

  const result = evaluateCluster(planets, ephResult.houses, "New York Yankees", "Los Angeles Dodgers");

  console.log("\n" + "═".repeat(100));
  console.log("OLD SYSTEM BREAKDOWN (House Cluster Engine)");
  console.log("═".repeat(100));

  console.log("\n┌─ SIDE A: NEW YORK YANKEES (Houses 1, 3, 6, 10, 11) ─────────────────────────┐");
  result.sideAHouses.forEach((h) => {
    console.log(`│ H${h.houseNumber}  ${h.lordPlanet.padEnd(8)} in H${h.lordHouse} (${h.lordSign.padEnd(10)}) | Dignity: ${h.dignityStatus.padEnd(10)} | Placement: ${h.placementStatus.padEnd(10)} | Points: ${h.totalPoints.toFixed(0).padStart(3)}`);
  });
  console.log(`│ Subtotal (Dignity/Placement): ${result.sideATotal.toFixed(2)}`);
  console.log(`│ Territorial Control:          ${result.sideATerritorial.toFixed(2)}`);
  console.log(`│ GRAND TOTAL:                  ${result.sideAGrandTotal.toFixed(2)}`);
  console.log("└─────────────────────────────────────────────────────────────────────────────┘");

  console.log("\n┌─ SIDE B: LOS ANGELES DODGERS (Houses 4, 5, 7, 9, 12) ──────────────────────┐");
  result.sideBHouses.forEach((h) => {
    console.log(`│ H${h.houseNumber}  ${h.lordPlanet.padEnd(8)} in H${h.lordHouse} (${h.lordSign.padEnd(10)}) | Dignity: ${h.dignityStatus.padEnd(10)} | Placement: ${h.placementStatus.padEnd(10)} | Points: ${h.totalPoints.toFixed(0).padStart(3)}`);
  });
  console.log(`│ Subtotal (Dignity/Placement): ${result.sideBTotal.toFixed(2)}`);
  console.log(`│ Territorial Control:          ${result.sideBTerritorial.toFixed(2)}`);
  console.log(`│ GRAND TOTAL:                  ${result.sideBGrandTotal.toFixed(2)}`);
  console.log("└─────────────────────────────────────────────────────────────────────────────┘");

  console.log("\n" + "─".repeat(100));
  console.log(`Yankees: ${result.sideAGrandTotal.toFixed(2).padStart(10)}  |  Dodgers: ${result.sideBGrandTotal.toFixed(2).padStart(10)}  |  Margin: ${Math.abs(result.sideAGrandTotal - result.sideBGrandTotal).toFixed(2).padStart(10)}`);
  console.log(`Prediction: ${result.prediction.padEnd(20)} | Confidence: ${result.confidence}%`);
  console.log("═".repeat(100));
}

analyzeOldSystem().catch(console.error);
