/**
 * TEST: Hybrid Engine with REAL Ephemeris
 * Mets vs Phillies
 * July 16, 2026, 6:30 PM ET
 * LOCATION: Philadelphia (actual game location)
 * 39.9526°N, 75.1652°W
 */

import { calculateChart } from "./ephemeris";
import { runHybridPrediction, formatHybridReport } from "./sportsHoraryHybrid";
import { calculateSportsHoraryV2, generateSportsHoraryV2Report } from "./sportsHoraryV2";
import { evaluateCluster, formatClusterReport } from "./houseClusterEngine";
import { buildSportsHoraryChartViaLLM } from "./sportsHoraryReading";
import { detectFixedStars, formatFixedStarsList } from "./fixedStarDetection";
import type { SportsHoraryChart } from "./sportsHorary";

async function testHybridRealEphemeris() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("HYBRID ENGINE TEST — REAL EPHEMERIS");
  console.log("════════════════════════════════════════════════════════════════\n");

  console.log("EVENT: Mets vs Phillies (MLB)");
  console.log("DATE: July 16, 2026");
  console.log("TIME: 6:30 PM ET");
  console.log("LOCATION: Citizens Bank Park, Philadelphia, PA");
  console.log("COORDINATES: 39.9526°N, 75.1652°W\n");

  console.log("FAVORITE (L1): Philadelphia Phillies (54-43)");
  console.log("UNDERDOG (L7): New York Mets (40-57)\n");

  console.log("ACTUAL RESULT: Mets won 3-0 (UPSET)\n");

  console.log("════════════════════════════════════════════════════════════════\n");

  try {
    // Calculate REAL ephemeris for Philadelphia
    console.log("Calculating real ephemeris positions...\n");

    // Create date: July 16, 2026, 6:30 PM ET (converted to UTC)
    // EDT is UTC-4, so 6:30 PM EDT = 10:30 PM UTC
    const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0)); // July is month 6 (0-indexed)

    const observer = {
      latitude: 39.9526,
      longitude: -75.1652,
      altitude: 0,
    };

    const ephemerisResult = await calculateChart(date, observer);

    if (!ephemerisResult || !ephemerisResult.planets) {
      console.error("Failed to calculate ephemeris");
      return;
    }

    const planetsArray = ephemerisResult.planets;
    const houseCusps = ephemerisResult.houses || {};

    console.log("✓ Real ephemeris calculated\n");

    // Convert array to object format for backwards compatibility
    const planets: Record<string, any> = {};
    planetsArray.forEach((p: any) => {
      planets[p.name] = p;
    });

    // Show the actual planetary positions
    console.log("ACTUAL PLANETARY POSITIONS (Sidereal, Philadelphia):\n");
    planetsArray.forEach((p: any) => {
      const rx = p.retrograde ? " (Rx)" : "";
      const degree = (p.degreeInSign !== undefined ? p.degreeInSign : (p.eclipticLon % 30)).toFixed(1);
      console.log(`  ${(p.name || "Unknown").padEnd(10)} ${p.sign} ${degree}° H${p.house || "?"}${rx}`);
    });
    console.log("");

    // Detect fixed stars
    console.log("FIXED STARS:\n");
    const fixedStars = detectFixedStars(planetsArray);
    if (fixedStars.length > 0) {
      console.log(formatFixedStarsList(fixedStars));
    } else {
      console.log("No fixed stars active");
    }
    console.log("");

    // Build the chart using the AI adapter
    console.log("Building chart with AI adapter...\n");
    const chartFacts = await buildSportsHoraryChartViaLLM(
      planets,
      "Phillies",
      "Mets"
    );

    if (!chartFacts) {
      console.error("Chart adapter failed");
      return;
    }

    console.log("✓ Chart analysis complete\n");

    // Run cluster engine
    console.log("════════════════════════════════════════════════════════════════");
    console.log("10-HOUSE CLUSTER ENGINE");
    console.log("════════════════════════════════════════════════════════════════\n");
    const clusterResults = evaluateCluster(planets, houseCusps, "Phillies", "Mets");
    const clusterReport = formatClusterReport(clusterResults, "Phillies", "Mets");
    console.log(clusterReport);

    // Run V2 engine
    console.log("\n" + "════════════════════════════════════════════════════════════════");
    console.log("16-LAYER V2 ENGINE");
    console.log("════════════════════════════════════════════════════════════════\n");
    const v2Results = calculateSportsHoraryV2(chartFacts);
    const v2Report = generateSportsHoraryV2Report(v2Results, {
      favoriteTeam: "Phillies",
      challengerTeam: "Mets",
    });
    console.log(v2Report);

    // Compare
    console.log("\n" + "════════════════════════════════════════════════════════════════");
    console.log("HYBRID COMPARISON");
    console.log("════════════════════════════════════════════════════════════════\n");

    const hybridResult = runHybridPrediction(chartFacts, planets, houseCusps, "Phillies", "Mets");

    console.log(`Cluster Engine: ${hybridResult.clusterPrediction.prediction}`);
    console.log(`  Margin: ${hybridResult.clusterPrediction.margin} pts`);
    console.log(`  Side A (Phillies): ${hybridResult.clusterPrediction.sideATotal}`);
    console.log(`  Side B (Mets): ${hybridResult.clusterPrediction.sideBTotal}\n`);

    console.log(`V2 Engine: ${hybridResult.v2Prediction.winner}`);
    console.log(`  Score: ${hybridResult.v2Prediction.score}`);
    console.log(`  Dominance: ${hybridResult.v2Prediction.dominance}\n`);

    console.log(`Agreement: ${hybridResult.agreement ? "YES ✓" : "NO ⚠️"}`);
    console.log(`Recommendation: ${hybridResult.recommendedCall}\n`);

    // Validation
    console.log("════════════════════════════════════════════════════════════════");
    console.log("VALIDATION");
    console.log("════════════════════════════════════════════════════════════════\n");

    const clusterCorrect = hybridResult.clusterPrediction.prediction === "Side B";
    const v2Correct = hybridResult.v2Prediction.winner === "Challenger";

    console.log(`Cluster prediction: ${hybridResult.clusterPrediction.prediction}`);
    console.log(`  ${clusterCorrect ? "✓ CORRECT" : "✗ WRONG"}\n`);

    console.log(`V2 prediction: ${hybridResult.v2Prediction.winner}`);
    console.log(`  ${v2Correct ? "✓ CORRECT" : "✗ WRONG"}\n`);

    if (clusterCorrect && v2Correct) {
      console.log("🎯 BOTH ENGINES NAILED IT");
    } else if (clusterCorrect || v2Correct) {
      console.log("⚡ ONE ENGINE GOT IT");
    } else {
      console.log("❌ BOTH MISSED");
    }

    console.log("════════════════════════════════════════════════════════════════");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
  }
}

testHybridRealEphemeris();
