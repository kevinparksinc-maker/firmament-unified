/**
 * RE-TEST ALL GAMES — Through Unified Master Prediction Engine
 *
 * Takes all 4 previous test games and runs them through the complete
 * master prediction engine. Reports:
 * 1. Full layer-by-layer breakdown for each game
 * 2. Side-by-side comparison: previous prediction vs. unified prediction
 * 3. Flags any outcome changes
 * 4. Confidence changes
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS } from "./astroEngine";
import { calculateFullPrediction, ChartData, ClusterConfig, PredictionResult } from "./masterPredictionEngine";
import { getNakshatraAt } from "./nakshatra";
import { isNight, calculateCanonicalArabicLots } from "./astrologyCore";
import { transformChartToFlatPlane } from "./coordinateTransformer";

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

// Helper: convert ephemeris chart to master engine ChartData
async function buildChartData(date: Date, lat: number, lon: number): Promise<ChartData> {
  const ephemerisResult = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });
  const planets = ephemerisResult.planets;
  const houses = ephemerisResult.houses;

  // Transform to flat-plane North Pole grid (planar Ascendant)
  const localHours = (date.getUTCHours() + date.getUTCMinutes() / 60) % 24;
  const rZodiac = 300; // Zodiac ring radius (adjustable)
  const gridScale = 1; // Scale factor for geographic->grid conversion
  const seasonalOffset = 0; // Can be calculated from day-of-year if needed
  const flatChart = transformChartToFlatPlane(lat, lon, localHours, rZodiac, gridScale, seasonalOffset);

  // Use planar Ascendant to recalculate house cusps
  const planarAscendant = flatChart.planarAscendant;
  const adjustedCusps = [];
  for (let i = 0; i < 12; i++) {
    const cusp = (planarAscendant + i * 30) % 360;
    adjustedCusps.push(cusp);
  }

  // Build house lords map using planar Ascendant-based cusps
  const houseLords = new Map<number, string>();
  for (let i = 0; i < 12; i++) {
    const cusp = adjustedCusps[i];
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] ?? "Aries";
    const ruler = SIGN_RULERS[sign];
    if (ruler) {
      houseLords.set(i + 1, ruler);
    }
  }

  // Helper: determine which house a planet is in based on planar cusps
  const getPlanarHouse = (eclipticLon: number): number => {
    for (let i = 0; i < 12; i++) {
      const start = adjustedCusps[i];
      const end = adjustedCusps[(i + 1) % 12];
      if (start <= end) {
        if (eclipticLon >= start && eclipticLon < end) return i + 1;
      } else {
        if (eclipticLon >= start || eclipticLon < end) return i + 1;
      }
    }
    return 1;
  };

  // Convert planets to internal format using planar house assignments
  const planetsInHouses = planets.map((p) => ({
    planet: p.name,
    house: getPlanarHouse(p.eclipticLon),
    sign: p.sign,
    degree: p.degreeInSign,
    eclipticLon: p.eclipticLon,
    isRetrograde: p.retrograde,
    nakshatra: getNakshatraAt(p.eclipticLon).nakshatra.name,
  }));

  // Extract house lords
  const houseLordsList = Array.from(houseLords.entries())
    .map(([house, lordName]) => {
      const placement = planetsInHouses.find((p) => p.planet === lordName);
      if (!placement) return null;
      return {
        house,
        lordPlanet: lordName,
        placement,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  // Calculate Arabic Lots using planar Ascendant and unified core
  const asc = planarAscendant;
  const sunPlacement = planetsInHouses.find(p => p.planet === "Sun");
  const night = isNight(sunPlacement?.house ?? 1);

  const planetsRecord: Record<string, any> = {};
  planets.forEach((p) => {
    planetsRecord[p.name] = { eclipticLon: p.eclipticLon };
  });

  const calculatedLots = calculateCanonicalArabicLots(planetsRecord, asc, night, adjustedCusps);
  const lots: ChartData["lots"] = calculatedLots.map((lot) => ({
    name: lot.name,
    house: lot.house,
    sign: lot.sign,
    degree: lot.degree,
  }));

  // Fixed Stars (TODO: integrate from fixedStars.ts)
  const fixedStars: ChartData["fixedStars"] = [];

  // Aspects (TODO: integrate findAspects + classifyMotion from patternEngine/aspectMotion)
  const aspects: ChartData["aspects"] = [];

  // Moon data
  const moonData = planets.find((p) => p.name === "Moon");
  const moonNak = moonData ? getNakshatraAt(moonData.eclipticLon).nakshatra.name : "Ashwini";
  // TODO: Calculate actual moon phase and VOC status
  const moonPhase: "new" | "waxing" | "full" | "waning" = "waxing"; // placeholder

  return {
    houseLords: houseLordsList,
    planetsInHouses,
    lots,
    fixedStars,
    aspects,
    moon: {
      phase: moonPhase,
      isVoidOfCourse: false, // TODO: calculate
      nakshatra: moonNak,
    },
  };
}

function formatPredictionResult(result: PredictionResult, label: string): string {
  const lines: string[] = [];
  lines.push(`\n${"═".repeat(80)}\n${label}\n${"═".repeat(80)}\n`);

  lines.push("LAYER BREAKDOWN:");
  lines.push("─────────────────");
  result.breakdown.forEach((layer) => {
    lines.push(
      `${layer.layer.padEnd(40)} | A: ${layer.sideAPoints.toFixed(2).padStart(7)} | B: ${layer.sideBPoints.toFixed(2).padStart(7)}`
    );
  });

  lines.push(`\n${"─".repeat(80)}`);
  lines.push(`SIDE A TOTAL: ${result.sideATotal.toFixed(2)}`);
  lines.push(`SIDE B TOTAL: ${result.sideBTotal.toFixed(2)}`);
  const marginPercent = (Math.abs(result.margin / Math.max(result.sideATotal, result.sideBTotal)) * 100).toFixed(1);
  lines.push(`MARGIN: ${result.margin.toFixed(2)} (${marginPercent}%)`);
  const winnerLabel = result.predictedWinner === "A" ? "SIDE A" : result.predictedWinner === "B" ? "SIDE B" : "TOO CLOSE TO CALL";
  lines.push(`\nPREDICTION: ${winnerLabel}`);
  lines.push(`CONFIDENCE: ${result.confidence}%`);
  if (result.volatilityWarning) {
    lines.push(`⚠️  ${result.volatilityWarning}`);
  }

  return lines.join("\n");
}

async function testGame(
  label: string,
  date: Date,
  lat: number,
  lon: number,
  config: ClusterConfig,
  previousPrediction: string
): Promise<void> {
  console.log(`\n\n${"╔" + "═".repeat(78) + "╗"}`);
  console.log(`║ ${label.padEnd(76)} ║`);
  console.log(`${"╚" + "═".repeat(78) + "╝"}`);

  const chartData = await buildChartData(date, lat, lon);
  const result = calculateFullPrediction(chartData, config);

  console.log(formatPredictionResult(result, "UNIFIED PREDICTION (Full Master Engine)"));

  console.log(`\nPREVIOUS PREDICTION: ${previousPrediction}`);
  console.log(
    `MATCH: ${result.predictedWinner === "A" || result.predictedWinner === "B" ? (previousPrediction.includes(result.predictedWinner === "A" ? "A" : "B") ? "✓ YES" : "✗ NO — OUTCOME CHANGED") : "INCONCLUSIVE"}`
  );
}

async function runAllRetests() {
  console.log("\n\n");
  console.log("╔════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                 RE-TEST ALL GAMES — UNIFIED ENGINE                         ║");
  console.log("║                                                                            ║");
  console.log("║  Running all 4 previous test games through the complete master prediction  ║");
  console.log("║  engine. Comparing outcomes, confidence, and layer-by-layer breakdown.     ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════╝");

  // Game 1: Germany vs Paraguay
  await testGame(
    "Game 1: Germany vs Paraguay — World Cup Round of 32, June 29, 2026, 4:30 PM EDT",
    new Date(Date.UTC(2026, 5, 29, 20, 30, 0)),
    42.0909,
    -71.2643,
    {
      sideAHouses: [1, 3, 6, 10, 11],
      sideBHouses: [7, 9, 12, 4, 5],
      sideALabel: "Germany",
      sideBLabel: "Paraguay",
    },
    "Paraguay upsets Germany"
  );

  // Game 2: Roland-Garros (Sinner vs Cerundolo)
  await testGame(
    "Game 2: Roland-Garros — Sinner (H1) vs Cerundolo (H7), May 28, 2026, 11:00 AM CEST",
    new Date(Date.UTC(2026, 4, 28, 9, 0, 0)),
    48.847,
    2.253,
    {
      sideAHouses: [1, 3, 6, 10, 11],
      sideBHouses: [7, 9, 12, 4, 5],
      sideALabel: "Sinner",
      sideBLabel: "Cerundolo",
    },
    "Cerundolo (Side B) wins"
  );

  // Game 3: Wimbledon (Sinner vs Zverev)
  await testGame(
    "Game 3: Wimbledon — Sinner (H1) vs Zverev (H7), July 12, 2026, 4:00 PM BST",
    new Date(Date.UTC(2026, 6, 12, 15, 0, 0)),
    51.434,
    -0.214,
    {
      sideAHouses: [1, 3, 6, 10, 11],
      sideBHouses: [7, 9, 12, 4, 5],
      sideALabel: "Sinner",
      sideBLabel: "Zverev",
    },
    "Sinner (Side A) wins"
  );

  // Game 4: Doha (Sinner vs Mensik)
  await testGame(
    "Game 4: Doha — Sinner (H1) vs Mensik (H7), February 19, 2026, 8:15 PM AST",
    new Date(Date.UTC(2026, 1, 19, 19, 15, 0)),
    25.276,
    51.516,
    {
      sideAHouses: [1, 3, 6, 10, 11],
      sideBHouses: [7, 9, 12, 4, 5],
      sideALabel: "Sinner",
      sideBLabel: "Mensik",
    },
    "Sinner (Side A) wins"
  );

  console.log("\n\n");
  console.log("╔════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                         UNIFIED RE-TEST COMPLETE                           ║");
  console.log("║                                                                            ║");
  console.log("║  All 4 games have run through the complete master prediction engine.       ║");
  console.log("║  Check layer breakdowns above to see what each component contributed.      ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════╝\n");
}

runAllRetests().catch(console.error);
