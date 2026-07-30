/**
 * TEST: Comprehensive Scoring on Yankees vs Red Sox Upset
 * July 16, 2026, 7:05 PM EDT (11:05 PM UTC)
 * Fenway Park, Boston
 * Actual: Red Sox 5-2 (UPSET)
 */

import { calculateChart } from "./ephemeris";
import { calculateComprehensiveScore, formatComprehensiveScore } from "./comprehensiveScoringEngine";
import { evaluateCluster } from "./houseClusterEngine";

async function testYankeesRedSoxUpset() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("UPSET TEST #2: Yankees vs Red Sox");
  console.log("════════════════════════════════════════════════════════════════\n");

  console.log("Game: Yankees (Favorite) vs Red Sox (Underdog)");
  console.log("Date: July 16, 2026");
  console.log("Time: 7:05 PM EDT (11:05 PM UTC)");
  console.log("Location: Fenway Park, Boston, MA (42.3457°N, 71.0979°W)");
  console.log("Record: Yankees 56-41 vs Red Sox 44-53\n");
  console.log("ACTUAL RESULT: Red Sox 5-2 (UPSET)\n");

  const date = new Date(Date.UTC(2026, 6, 16, 23, 5, 0)); // 7:05 PM EDT = 11:05 PM UTC
  const observer = {
    latitude: 42.3457,
    longitude: -71.0979,
    altitude: 0,
  };

  const ephResult = await calculateChart(date, observer);
  const planetsArray = ephResult.planets;
  const houses = ephResult.houses;

  const planets: Record<string, any> = {};
  planetsArray.forEach((p) => {
    planets[p.name] = p;
  });

  // Show chart
  console.log("CHART POSITIONS (Boston, Fenway Park):\n");
  planetsArray.slice(0, 7).forEach((p: any) => {
    const rx = p.retrograde ? " Rx" : "";
    console.log(`  ${p.name.padEnd(10)} ${p.sign} ${p.degreeInSign.toFixed(1)}° H${p.house}${rx}`);
  });
  console.log("");

  // Run cluster engine
  const clusterResult = evaluateCluster(planets, houses, "Yankees", "Red Sox");

  console.log("════════════════════════════════════════════════════════════════");
  console.log("10-HOUSE CLUSTER SCORING");
  console.log("════════════════════════════════════════════════════════════════\n");

  console.log(`Yankees (Favorite):  ${clusterResult.sideATotal > 0 ? "+" : ""}${clusterResult.sideATotal} (dignity/placement) + ${clusterResult.sideATerritorial > 0 ? "+" : ""}${clusterResult.sideATerritorial} (territorial) = ${clusterResult.sideAGrandTotal > 0 ? "+" : ""}${clusterResult.sideAGrandTotal}`);
  console.log(`Red Sox (Underdog):  ${clusterResult.sideBTotal > 0 ? "+" : ""}${clusterResult.sideBTotal} (dignity/placement) + ${clusterResult.sideBTerritorial > 0 ? "+" : ""}${clusterResult.sideBTerritorial} (territorial) = ${clusterResult.sideBGrandTotal > 0 ? "+" : ""}${clusterResult.sideBGrandTotal}\n`);

  // Run comprehensive scoring
  const comprehensiveResult = calculateComprehensiveScore(
    planetsArray,
    clusterResult.sideATotal,
    clusterResult.sideBTotal,
    clusterResult.sideATerritorial,
    clusterResult.sideBTerritorial
  );

  console.log("════════════════════════════════════════════════════════════════");
  console.log("COMPREHENSIVE SCORING");
  console.log("════════════════════════════════════════════════════════════════\n");

  console.log(formatComprehensiveScore(comprehensiveResult, "Yankees", "Red Sox"));

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("PREDICTION vs ACTUAL");
  console.log("════════════════════════════════════════════════════════════════\n");

  const predicted = comprehensiveResult.prediction;
  const actual = "Side B"; // Red Sox won
  const correct = predicted === actual;

  console.log(`Predicted: ${predicted}`);
  console.log(`Actual:    ${actual} (Red Sox won 5-2)`);
  console.log(`Result:    ${correct ? "✓ CORRECT" : "✗ WRONG"}\n`);

  if (correct) {
    console.log("🎯 COMPREHENSIVE SCORING CAUGHT THE UPSET");
  } else {
    console.log("❌ COMPREHENSIVE SCORING MISSED");
  }

  console.log("════════════════════════════════════════════════════════════════");
}

testYankeesRedSoxUpset();
