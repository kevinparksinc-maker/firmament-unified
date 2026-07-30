/**
 * TEST: Comprehensive Scoring — All Layers
 * Shows how every signal contributes to the final prediction
 */

import { calculateChart } from "./ephemeris";
import { calculateComprehensiveScore, formatComprehensiveScore } from "./comprehensiveScoringEngine";
import { evaluateCluster } from "./houseClusterEngine";
import { calculateTerritorialControl } from "./territorialControlEngine";
import { SIGN_RULERS, SIGN_ORDER } from "./astroEngine";

async function testComprehensiveScoring() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("COMPREHENSIVE SCORING TEST");
  console.log("════════════════════════════════════════════════════════════════\n");

  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = {
    latitude: 39.9526,
    longitude: -75.1652,
    altitude: 0,
  };

  const ephemerisResult = await calculateChart(date, observer);
  const planetsArray = ephemerisResult.planets;
  const houses = ephemerisResult.houses;

  // Convert planets to object
  const planets: Record<string, any> = {};
  planetsArray.forEach((p: any) => {
    planets[p.name] = p;
  });

  // Calculate cluster scores (dignity/placement + territorial)
  const clusterResult = evaluateCluster(planets, houses, "Phillies", "Mets");

  console.log("LAYER BREAKDOWN:");
  console.log(
    `  Dignity/Placement: Phillies ${clusterResult.sideATotal > 0 ? "+" : ""}${clusterResult.sideATotal} vs Mets ${clusterResult.sideBTotal > 0 ? "+" : ""}${clusterResult.sideBTotal}`
  );
  console.log(
    `  Territorial:       Phillies ${clusterResult.sideATerritorial > 0 ? "+" : ""}${clusterResult.sideATerritorial} vs Mets ${clusterResult.sideBTerritorial > 0 ? "+" : ""}${clusterResult.sideBTerritorial}`
  );
  console.log("");

  // Now add all other layers
  const comprehensiveResult = calculateComprehensiveScore(
    planetsArray,
    clusterResult.sideATotal,
    clusterResult.sideBTotal,
    clusterResult.sideATerritorial,
    clusterResult.sideBTerritorial
  );

  console.log(formatComprehensiveScore(comprehensiveResult, "Phillies", "Mets"));

  console.log("\nACTUAL RESULT: Mets 3-0\n");

  const philliesCorrect = comprehensiveResult.prediction === "Side A";
  const metsCorrect = comprehensiveResult.prediction === "Side B";

  if (metsCorrect) {
    console.log("✓ COMPREHENSIVE SCORING PREDICTED METS UPSET");
  } else {
    console.log("✗ COMPREHENSIVE SCORING MISSED");
  }
}

testComprehensiveScoring();
