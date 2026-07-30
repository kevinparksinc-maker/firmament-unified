/**
 * DIAGNOSTIC: Compare Master Engine vs Detailed Breakdown
 * Shows side-by-side lord calculations to identify discrepancies
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS } from "./astroEngine";
import { calculateFullPrediction, ChartData, ClusterConfig } from "./masterPredictionEngine";
import { getNakshatraAt } from "./nakshatra";
import { calculateArabicLots } from "./arabicLotsCalculator";
import { findFixedStarConjunctions, getNakshatraLord, getNakshatraDignity, getFixedStarAmplification, getNakshatraLordStrength } from "./nakshatraStarEngine";
import { getSignNakshatraFriction, PlanetName } from "./planetRelationships";
import { NAKSHATRAS, calculateNakshatraModifier } from "./nakshatraData";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIDE_A_HOUSES = [1, 3, 6, 10, 11];
const SIDE_B_HOUSES = [7, 9, 12, 4, 5];

function getBasePoints(house: number): number {
  const baseMap: Record<number, number> = {
    1: 4, 7: 4, 3: 2, 9: 2, 6: 2, 12: 2, 10: 4, 4: 4, 11: 3, 5: 3,
  };
  return baseMap[house] ?? 0;
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

async function compareCalculations() {
  console.log("\n" + "═".repeat(120));
  console.log("DIAGNOSTIC: Comparing Master Engine vs Detailed Breakdown");
  console.log("═".repeat(120));

  const date = new Date(Date.UTC(2026, 5, 29, 20, 30, 0));
  const lat = 42.0909;
  const lon = -71.2643;

  const chart = await buildChartData(date, lat, lon);
  const config: ClusterConfig = {
    sideAHouses: SIDE_A_HOUSES,
    sideBHouses: SIDE_B_HOUSES,
    sideALabel: "Germany",
    sideBLabel: "Paraguay",
  };

  // Run master engine
  const masterResult = calculateFullPrediction(chart, config);
  console.log("\n### MASTER ENGINE TERRITORIAL CONTROL RESULTS:");
  console.log(`Germany: ${masterResult.breakdown[0].sideAPoints.toFixed(3)}`);
  console.log(`Paraguay: ${masterResult.breakdown[0].sideBPoints.toFixed(3)}`);

  // Show each lord's calculation from master engine
  console.log("\n### LORD-BY-LORD BREAKDOWN FROM MASTER ENGINE:");
  console.log("House | Lord      | Occupied | Ruled | Points");
  console.log("─".repeat(60));

  for (const lord of chart.houseLords) {
    const ruledSide = SIDE_A_HOUSES.includes(lord.house) ? "A" : SIDE_B_HOUSES.includes(lord.house) ? "B" : "N";
    const occupied = lord.placement.house;
    const occupiedSide = SIDE_A_HOUSES.includes(occupied) ? "A" : SIDE_B_HOUSES.includes(occupied) ? "B" : "N";

    const basePoints = getBasePoints(occupied);
    console.log(`H${lord.house} | ${lord.lordPlanet.padEnd(9)} | H${occupied} (${occupiedSide}) | ${ruledSide} | ${basePoints}`);
  }

  console.log("\n### NAKSHATRA DATA AVAILABILITY:");
  for (const lord of chart.houseLords) {
    const nak = getNakshatraAt(lord.placement.eclipticLon).nakshatra.name;
    console.log(`${lord.lordPlanet}: ${nak} (${lord.placement.nakshatra})`);
  }

  console.log("\n" + "═".repeat(120));
}

compareCalculations().catch(console.error);
