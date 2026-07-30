import { calculateChart } from "./ephemeris";
import { SIGN_RULERS } from "./astroEngine";
import { calculateFullPrediction, ChartData, ClusterConfig } from "./masterPredictionEngine";
import { getNakshatraAt } from "./nakshatra";
import { calculateArabicLots } from "./arabicLotsCalculator";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

async function buildChartData(date: Date, lat: number, lon: number): Promise<ChartData> {
  const result = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });
  const planets = result.planets;
  const houses = result.houses;

  const houseLords = new Map<number, string>();
  for (let i = 0; i < 12; i++) {
    const cusp = houses.cusps[i];
    if (!cusp) continue;
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] || "Aries";
    const ruler = SIGN_RULERS[sign];
    if (ruler) {
      houseLords.set(i + 1, ruler);
    }
  }

  const planetsInHouses = planets.map((p) => ({
    planet: p.name,
    house: p.house,
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
      return {
        house,
        lordPlanet: lordName,
        placement,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const asc = houses.cusps[0];
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

async function testGame(name: string, date: Date, lat: number, lon: number, config: ClusterConfig, expectedWinner: string) {
  console.log(`\n${"═".repeat(80)}`);
  console.log(`${name}`);
  console.log(`${"═".repeat(80)}`);

  const chart = await buildChartData(date, lat, lon);
  const result = calculateFullPrediction(chart, config);

  const predictedWinnerName = result.predictedWinner === "A" ? config.sideALabel : config.sideBLabel;
  console.log(`PREDICTION: ${predictedWinnerName}`);
  console.log(`CONFIDENCE: ${result.confidence}%`);
  console.log(`MARGIN: ${result.margin.toFixed(2)}`);
  console.log(`\nEXPECTED: ${expectedWinner}`);
  console.log(`ACTUAL RESULT: ${predictedWinnerName}`);
  const isCorrect = expectedWinner === predictedWinnerName;
  console.log(isCorrect ? "✓ CORRECT" : "✗ WRONG");
}

async function run() {
  console.log("\n" + "═".repeat(80));
  console.log("TESTING CRITICAL GAMES WITH CORRECTED FORMULA");
  console.log("═".repeat(80));

  // Game 1: Germany vs Paraguay
  await testGame(
    "Game 1: Germany vs Paraguay (June 29, 2026, 4:30 PM EDT)",
    new Date(Date.UTC(2026, 5, 29, 20, 30, 0)),
    42.0909,
    -71.2643,
    {
      sideAHouses: [1, 3, 6, 10, 11],
      sideBHouses: [7, 9, 12, 4, 5],
      sideALabel: "Germany",
      sideBLabel: "Paraguay",
    },
    "Paraguay"
  );

  // Game 4: Doha
  await testGame(
    "Game 4: Doha — Sinner vs Mensik (Feb 19, 2026, 8:15 PM AST)",
    new Date(Date.UTC(2026, 1, 19, 19, 15, 0)),
    25.276,
    51.516,
    {
      sideAHouses: [1, 3, 6, 10, 11],
      sideBHouses: [7, 9, 12, 4, 5],
      sideALabel: "Sinner",
      sideBLabel: "Mensik",
    },
    "Mensik"
  );

  console.log(`\n${"═".repeat(80)}\nTEST COMPLETE\n${"═".repeat(80)}\n`);
}

run().catch(console.error);
