/**
 * A/B TESTING: Old System vs New System
 *
 * Runs the same chart input through both prediction systems:
 * - OLD: houseClusterEngine + territorialControlEngine (HORARY_SCORING_RULES.md)
 * - NEW: masterPredictionEngine (multiplicative Vedic model)
 *
 * Outputs side-by-side predictions without merging, and logs to tracker.
 */

import { calculateChart } from "./ephemeris";
import { evaluateCluster, formatClusterReport } from "./houseClusterEngine";
import { calculateFullPrediction, ChartData } from "./masterPredictionEngine";
import { SIGN_RULERS } from "./astroEngine";
import { getNakshatraAt } from "./nakshatra";
import { calculateArabicLots } from "./arabicLotsCalculator";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GameTest {
  name: string;
  date: Date;
  location: { lat: number; lon: number };
  favorite: string;
  underdog: string;
  actualWinner: string;
  actualScore: string;
}

interface ABTestResult {
  timestamp: string;
  game: string;
  matchup: string;
  actualResult: string;
  oldSystem: {
    favorite: string;
    prediction: string;
    score: number;
    underdog: string;
    score2: number;
    margin: number;
  };
  newSystem: {
    favorite: string;
    prediction: string;
    score: number;
    underdog: string;
    score2: number;
    margin: number;
  };
  agreement: boolean;
  resultMatch: {
    oldCorrect: boolean;
    newCorrect: boolean;
  };
}

const TRACKER_FILE = path.join(__dirname, "AB_TEST_TRACKER.json");

function loadTracker(): ABTestResult[] {
  if (fs.existsSync(TRACKER_FILE)) {
    const data = fs.readFileSync(TRACKER_FILE, "utf-8");
    return JSON.parse(data);
  }
  return [];
}

function saveTracker(results: ABTestResult[]) {
  fs.writeFileSync(TRACKER_FILE, JSON.stringify(results, null, 2));
}

async function buildChartData(date: Date, lat: number, lon: number): Promise<ChartData> {
  const result = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });
  const planets = result.planets;

  const { transformChartToFlatPlane } = await import("./coordinateTransformer");
  const localHours = (date.getUTCHours() + date.getUTCMinutes() / 60) % 24;
  const flatChart = transformChartToFlatPlane(lat, lon, localHours, 300, 1, 0);

  const planarAscendant = flatChart.planarAscendant;
  const adjustedCusps = [];
  for (let i = 0; i < 12; i++) {
    adjustedCusps.push((planarAscendant + i * 30) % 360);
  }

  const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  const houseLords = new Map<number, string>();
  for (let i = 0; i < 12; i++) {
    const cusp = adjustedCusps[i];
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] || "Aries";
    const ruler = SIGN_RULERS[sign];
    if (ruler) {
      houseLords.set(i + 1, ruler);
    }
  }

  const getPlanarHouse = (eclipticLon: number): number => {
    for (let i = 0; i < 12; i++) {
      const start = adjustedCusps[i];
      const end = adjustedCusps[(i + 1) % 12];
      if (start <= end) {
        if (siderealLon >= start && siderealLon < end) return i + 1;
      } else {
        if (siderealLon >= start || siderealLon < end) return i + 1;
      }
    }
    return 1;
  };

  const planetsInHouses = planets.map((p) => ({
    planet: p.name,
    house: getPlanarHouse(p.eclipticLon),
    sign: p.sign,
    degree: p.degreeInSign,
    eclipticLon: p.eclipticLon,
    isRetrograde: p.retrograde,
    nakshatra: getNakshatraAt(p.eclipticLon).nakshatra.name,
  }));

  const houseLordsList = Array.from(houseLords.entries())
    .map(([house, lordName]) => {
      const placement = planetsInHouses.find((p) => p.planet === lordName);
      if (!placement) return null;
      return { house, lordPlanet: lordName, placement };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const asc = planarAscendant;
  const isNight = planets.find((p) => p.name === "Sun")?.altitude ?? 0 < 0;
  const planetsRecord: Record<string, any> = {};
  planets.forEach((p) => {
    planetsRecord[p.name] = { lon: p.eclipticLon };
  });

  const calculatedLots = calculateArabicLots(planetsRecord, asc, isNight);
  const lots: ChartData["lots"] = calculatedLots.map((lot) => ({
    name: lot.name,
    house: 0,
    sign: lot.sign,
    degree: lot.degree,
  }));

  return {
    houseLords: houseLordsList,
    planetsInHouses,
    lots,
    fixedStars: [],
    aspects: [],
    moon: {
      phase: "waxing",
      isVoidOfCourse: false,
      nakshatra: getNakshatraAt(planets.find(p => p.name === "Moon")?.eclipticLon || 0).nakshatra.name,
    },
  };
}

async function testGame(game: GameTest) {
  console.log("\n" + "═".repeat(100));
  console.log(`TEST: ${game.name}`);
  console.log(`Expected Winner: ${game.actualWinner} (${game.actualScore})`);
  console.log("═".repeat(100));

  const ephResult = await calculateChart(game.date, {
    latitude: game.location.lat,
    longitude: game.location.lon,
    altitude: 0,
  });

  const planets: Record<string, any> = {};
  ephResult.planets.forEach((p) => {
    planets[p.name] = p;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OLD SYSTEM: houseClusterEngine (additive, per HORARY_SCORING_RULES.md)
  // ─────────────────────────────────────────────────────────────────────────
  const oldResult = evaluateCluster(planets, ephResult.houses, game.favorite, game.underdog);
  const oldPrediction = oldResult.sideAGrandTotal > oldResult.sideBGrandTotal ? game.favorite : game.underdog;
  const oldMargin = Math.abs(oldResult.sideAGrandTotal - oldResult.sideBGrandTotal);

  console.log("\n┌─ OLD SYSTEM (Additive, HORARY_SCORING_RULES.md) ─────────────────────┐");
  console.log(`│ ${game.favorite.padEnd(25)} ${oldResult.sideAGrandTotal.toFixed(2).padStart(10)}`);
  console.log(`│ ${game.underdog.padEnd(25)} ${oldResult.sideBGrandTotal.toFixed(2).padStart(10)}`);
  console.log(`│ Prediction: ${oldPrediction.padEnd(20)} | Margin: ${oldMargin.toFixed(2)}`);
  console.log(`│ Correct: ${oldPrediction === game.actualWinner ? "✓ YES" : "✗ NO".padEnd(20)}`);
  console.log("└────────────────────────────────────────────────────────────────────────┘");

  // ─────────────────────────────────────────────────────────────────────────
  // NEW SYSTEM: masterPredictionEngine (multiplicative Vedic model)
  // ─────────────────────────────────────────────────────────────────────────
  const chartData = await buildChartData(game.date, game.location.lat, game.location.lon);
  const config = {
    sideAHouses: [1, 3, 6, 10, 11],
    sideBHouses: [7, 9, 12, 4, 5],
    sideALabel: game.favorite,
    sideBLabel: game.underdog,
  };

  const newResult = calculateFullPrediction(chartData, config);
  const territorial = newResult.breakdown[0];
  const newPrediction = territorial.sideAPoints > territorial.sideBPoints ? game.favorite : game.underdog;
  const newMargin = Math.abs(territorial.sideAPoints - territorial.sideBPoints);

  console.log("\n┌─ NEW SYSTEM (Multiplicative, Vedic Model) ─────────────────────────────┐");
  console.log(`│ ${game.favorite.padEnd(25)} ${territorial.sideAPoints.toFixed(2).padStart(10)}`);
  console.log(`│ ${game.underdog.padEnd(25)} ${territorial.sideBPoints.toFixed(2).padStart(10)}`);
  console.log(`│ Prediction: ${newPrediction.padEnd(20)} | Margin: ${newMargin.toFixed(2)}`);
  console.log(`│ Correct: ${newPrediction === game.actualWinner ? "✓ YES" : "✗ NO".padEnd(20)}`);
  console.log("└────────────────────────────────────────────────────────────────────────┘");

  // ─────────────────────────────────────────────────────────────────────────
  // COMPARISON
  // ─────────────────────────────────────────────────────────────────────────
  const agreement = oldPrediction === newPrediction ? "AGREE" : "DISAGREE";
  const bothCorrect = oldPrediction === game.actualWinner && newPrediction === game.actualWinner;
  const splitResult = oldPrediction === game.actualWinner ? "Old ✓ / New ✗" :
                      newPrediction === game.actualWinner ? "Old ✗ / New ✓" : "Old ✗ / New ✗";

  console.log("\n┌─ COMPARISON ──────────────────────────────────────────────────────────┐");
  console.log(`│ Systems: ${agreement}`);
  console.log(`│ Both correct: ${bothCorrect ? "✓ YES" : "✗ NO"}`);
  console.log(`│ Result split: ${splitResult}`);
  console.log(`│ Old margin: ${oldMargin.toFixed(2)} | New margin: ${newMargin.toFixed(2)}`);
  console.log("└────────────────────────────────────────────────────────────────────────┘");

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE TO TRACKER
  // ─────────────────────────────────────────────────────────────────────────
  const tracker = loadTracker();
  const testResult: ABTestResult = {
    timestamp: new Date().toISOString(),
    game: game.name,
    matchup: `${game.favorite} vs ${game.underdog}`,
    actualResult: `${game.actualWinner} (${game.actualScore})`,
    oldSystem: {
      favorite: game.favorite,
      prediction: oldPrediction,
      score: oldResult.sideAGrandTotal,
      underdog: game.underdog,
      score2: oldResult.sideBGrandTotal,
      margin: oldMargin,
    },
    newSystem: {
      favorite: game.favorite,
      prediction: newPrediction,
      score: territorial.sideAPoints,
      underdog: game.underdog,
      score2: territorial.sideBPoints,
      margin: newMargin,
    },
    agreement: oldPrediction === newPrediction,
    resultMatch: {
      oldCorrect: oldPrediction === game.actualWinner,
      newCorrect: newPrediction === game.actualWinner,
    },
  };

  tracker.push(testResult);
  saveTracker(tracker);
  console.log(`\n✓ Logged to ${TRACKER_FILE}`);
}

// Test games
const games: GameTest[] = [
  {
    name: "Mets vs Phillies",
    date: new Date(Date.UTC(2026, 6, 16, 22, 30, 0)),
    location: { lat: 39.9526, lon: -75.1652 },
    favorite: "Phillies",
    underdog: "Mets",
    actualWinner: "Mets",
    actualScore: "3-0",
  },
  {
    name: "Red Sox vs Yankees",
    date: new Date(Date.UTC(2026, 6, 16, 23, 5, 0)),
    location: { lat: 42.3457, lon: -71.0979 },
    favorite: "Yankees",
    underdog: "Red Sox",
    actualWinner: "Red Sox",
    actualScore: "5-2",
  },
  {
    name: "Bayern Munich vs AC Milan",
    date: new Date(Date.UTC(2026, 6, 16, 19, 0, 0)),
    location: { lat: 48.2189, lon: 11.6241 },
    favorite: "Bayern Munich",
    underdog: "AC Milan",
    actualWinner: "AC Milan",
    actualScore: "2-1",
  },
  {
    name: "Brazil vs Argentina",
    date: new Date(Date.UTC(2026, 6, 17, 1, 0, 0)),
    location: { lat: -22.9122, lon: -43.2304 },
    favorite: "Brazil",
    underdog: "Argentina",
    actualWinner: "Argentina",
    actualScore: "1-0",
  },
  // BLIND TEST GAMES (actual results TBD)
  {
    name: "Los Angeles Dodgers @ New York Yankees",
    date: new Date(Date.UTC(2024, 5, 8, 23, 35, 0)), // June 7, 2024, 7:35 PM EDT
    location: { lat: 40.8295, lon: -73.9262 }, // Yankee Stadium
    favorite: "New York Yankees",
    underdog: "Los Angeles Dodgers",
    actualWinner: "TBD",
    actualScore: "TBD",
  },
  {
    name: "Philadelphia Phillies @ Atlanta Braves",
    date: new Date(Date.UTC(2024, 6, 6, 23, 20, 0)), // July 5, 2024, 7:20 PM EDT
    location: { lat: 33.7490, lon: -84.3880 }, // Truist Park
    favorite: "Atlanta Braves",
    underdog: "Philadelphia Phillies",
    actualWinner: "TBD",
    actualScore: "TBD",
  },
];

async function runAllTests() {
  console.log("\n" + "═".repeat(100));
  console.log("A/B TESTING: OLD SYSTEM vs NEW SYSTEM");
  console.log("═".repeat(100));
  console.log(`Testing ${games.length} games with both prediction engines`);
  console.log("Results will be logged to: " + TRACKER_FILE);

  for (const game of games) {
    try {
      await testGame(game);
    } catch (error) {
      console.error(`\n✗ ERROR testing ${game.name}:`, error);
    }
  }

  // Print summary
  const tracker = loadTracker();
  const oldCorrect = tracker.filter(t => t.resultMatch.oldCorrect).length;
  const newCorrect = tracker.filter(t => t.resultMatch.newCorrect).length;
  const bothCorrect = tracker.filter(t => t.resultMatch.oldCorrect && t.resultMatch.newCorrect).length;
  const agree = tracker.filter(t => t.agreement).length;

  console.log("\n" + "═".repeat(100));
  console.log("SUMMARY");
  console.log("═".repeat(100));
  console.log(`Total tests: ${tracker.length}`);
  console.log(`Old system correct: ${oldCorrect}/${tracker.length}`);
  console.log(`New system correct: ${newCorrect}/${tracker.length}`);
  console.log(`Both correct: ${bothCorrect}/${tracker.length}`);
  console.log(`Systems agree: ${agree}/${tracker.length}`);
  console.log(`\nDetails saved to: ${TRACKER_FILE}`);
}

runAllTests().catch(console.error);
