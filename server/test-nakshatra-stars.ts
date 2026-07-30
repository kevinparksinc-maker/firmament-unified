import { calculateChart } from "./ephemeris";
import { SIGN_RULERS } from "./astroEngine";
import { calculateFullPrediction, ChartData, ClusterConfig } from "./masterPredictionEngine";
import { getNakshatraAt } from "./nakshatra";
import { calculateArabicLots } from "./arabicLotsCalculator";
import { findFixedStarConjunctions, FIXED_STARS_REFERENCE } from "./nakshatraStarEngine";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

async function buildChartData(date: Date, lat: number, lon: number): Promise<ChartData> {
  const result = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });
  const planets = result.planets;
  const houses = result.houses;

  // Transform to flat-plane North Pole grid (planar Ascendant)
  const { transformChartToFlatPlane } = await import("./coordinateTransformer");
  const localHours = (date.getUTCHours() + date.getUTCMinutes() / 60) % 24;
  const flatChart = transformChartToFlatPlane(lat, lon, localHours, 300, 1, 0);

  // Use planar Ascendant for house cusps
  const planarAscendant = flatChart.planarAscendant;
  const adjustedCusps = [];
  for (let i = 0; i < 12; i++) {
    adjustedCusps.push((planarAscendant + i * 30) % 360);
  }

  // Build house lords using planar cusps
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

  // Helper to determine house
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

  // Convert planets
  const planetsInHouses = planets.map((p) => ({
    planet: p.name,
    house: getPlanarHouse(p.eclipticLon),
    sign: p.sign,
    degree: p.degreeInSign,
    eclipticLon: p.eclipticLon,
    isRetrograde: p.retrograde,
    nakshatra: getNakshatraAt(p.eclipticLon).nakshatra.name,
  }));

  // Build house lords list
  const houseLordsList = Array.from(houseLords.entries())
    .map(([house, lordName]) => {
      const placement = planetsInHouses.find((p) => p.planet === lordName);
      if (!placement) return null;
      return { house, lordPlanet: lordName, placement };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  // Arabic Lots
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

async function testGame() {
  console.log("\n" + "═".repeat(100));
  console.log("TEST: Germany vs Paraguay with Nakshatra & Fixed Star Integration");
  console.log("═".repeat(100));

  const date = new Date(Date.UTC(2026, 5, 29, 20, 30, 0));
  const lat = 42.0909;
  const lon = -71.2643;

  const chart = await buildChartData(date, lat, lon);
  const config: ClusterConfig = {
    sideAHouses: [1, 3, 6, 10, 11],
    sideBHouses: [7, 9, 12, 4, 5],
    sideALabel: "Germany",
    sideBLabel: "Paraguay",
  };

  // Show fixed star conjunctions for lords
  console.log("\n### FIXED STAR CONJUNCTIONS (within 1°)\n");
  for (const lord of chart.houseLords) {
    const conjunctions = findFixedStarConjunctions(lord.placement.eclipticLon, 1.0);
    if (conjunctions.length > 0) {
      console.log(`${lord.lordPlanet} (H${lord.house}) at ${lord.placement.eclipticLon.toFixed(2)}°:`);
      conjunctions.forEach((star) => {
        const diff = Math.abs(lord.placement.eclipticLon - star.longitude);
        const normalizedDiff = Math.min(diff, 360 - diff);
        console.log(`  → ${star.name} (${star.nature}, ${star.group}) — orb: ${normalizedDiff.toFixed(2)}°`);
      });
    }
  }

  const result = calculateFullPrediction(chart, config);

  console.log("\n" + "═".repeat(100));
  console.log("FULL PREDICTION BREAKDOWN");
  console.log("═".repeat(100));

  console.log("\nLAYER BREAKDOWN:");
  for (const layer of result.breakdown) {
    console.log(`${layer.layer.padEnd(45)} | A: ${layer.sideAPoints.toFixed(2).padStart(8)} | B: ${layer.sideBPoints.toFixed(2).padStart(8)}`);
  }

  console.log("\n" + "─".repeat(100));
  console.log(`SIDE A (Germany) TOTAL: ${result.sideATotal.toFixed(2)}`);
  console.log(`SIDE B (Paraguay) TOTAL: ${result.sideBTotal.toFixed(2)}`);
  console.log(`MARGIN: ${result.margin.toFixed(2)}`);
  console.log(`\nPREDICTION: ${result.predictedWinner === "A" ? "Germany" : result.predictedWinner === "B" ? "Paraguay" : "Too Close"}`);
  console.log(`CONFIDENCE: ${result.confidence}%`);
  if (result.volatilityWarning) {
    console.log(`⚠️  ${result.volatilityWarning}`);
  }

  console.log("\n" + "═".repeat(100));
  console.log("ACTUAL RESULT: Paraguay won");
  const isCorrect = result.predictedWinner === "B";
  console.log(isCorrect ? "✓ PREDICTION CORRECT" : "✗ PREDICTION WRONG");
  console.log("═".repeat(100) + "\n");
}

testGame().catch(console.error);
