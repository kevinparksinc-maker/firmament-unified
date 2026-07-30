/**
 * MLB LIVE INTEGRATED PREDICTIONS
 * Scores all 15 games using full 5-house cluster system per side
 * Away (H1, H3, H6, H10, H11) vs Home (H7, H9, H12, H4, H5)
 */

import { calculateChart } from "./ephemeris";
import { scoreMatchup, printIntegratedBreakdown } from "./mlb-integrated-scorer";
import { SIGN_RULERS } from "./astroEngine";

interface Game {
  id: string;
  matchup: string;
  away: string;
  home: string;
  timeET: string;
  stadium: string;
  lat: number;
  lon: number;
}

const GAMES: Game[] = [
  { id: "G1", matchup: "Twins @ Guardians", away: "Twins", home: "Guardians", timeET: "6:40 PM", stadium: "Progressive Field, Cleveland", lat: 41.4955, lon: -81.6852 },
  { id: "G2", matchup: "Pirates @ Yankees", away: "Pirates", home: "Yankees", timeET: "7:05 PM", stadium: "Yankee Stadium, Bronx", lat: 40.8296, lon: -73.9262 },
  { id: "G3", matchup: "Rays @ Blue Jays", away: "Rays", home: "Blue Jays", timeET: "7:07 PM", stadium: "Rogers Centre, Toronto", lat: 43.6426, lon: -79.3957 },
  { id: "G4", matchup: "Orioles @ Red Sox", away: "Orioles", home: "Red Sox", timeET: "7:10 PM", stadium: "Fenway Park, Boston", lat: 42.3461, lon: -71.0972 },
  { id: "G5", matchup: "Dodgers @ Phillies", away: "Dodgers", home: "Phillies", timeET: "7:10 PM", stadium: "Citizens Bank Park, Philadelphia", lat: 39.9061, lon: -75.1675 },
  { id: "G6", matchup: "Padres @ Braves", away: "Padres", home: "Braves", timeET: "7:15 PM", stadium: "Truist Park, Atlanta", lat: 33.7490, lon: -84.3880 },
  { id: "G7", matchup: "Giants @ Royals", away: "Giants", home: "Royals", timeET: "7:40 PM", stadium: "Kauffman Stadium, Kansas City", lat: 39.0518, lon: -94.4803 },
  { id: "G8", matchup: "Mets @ Brewers", away: "Mets", home: "Brewers", timeET: "7:40 PM", stadium: "American Family Field, Milwaukee", lat: 43.0285, lon: -87.9712 },
  { id: "G9", matchup: "Tigers @ Cubs", away: "Tigers", home: "Cubs", timeET: "8:05 PM", stadium: "Wrigley Field, Chicago", lat: 41.9484, lon: -87.6553 },
  { id: "G10", matchup: "White Sox @ Rangers", away: "White Sox", home: "Rangers", timeET: "8:05 PM", stadium: "Globe Life Field, Arlington", lat: 32.7467, lon: -97.0828 },
  { id: "G11", matchup: "Marlins @ Astros", away: "Marlins", home: "Astros", timeET: "8:10 PM", stadium: "Daikin Park, Houston", lat: 29.7572, lon: -95.3555 },
  { id: "G12", matchup: "Nationals @ Rockies", away: "Nationals", home: "Rockies", timeET: "8:40 PM", stadium: "Coors Field, Denver", lat: 39.7561, lon: -104.9942 },
  { id: "G13", matchup: "Athletics @ D-backs", away: "Athletics", home: "D-backs", timeET: "9:40 PM", stadium: "Chase Field, Phoenix", lat: 33.4453, lon: -112.0667 },
  { id: "G14", matchup: "Reds @ Mariners", away: "Reds", home: "Mariners", timeET: "9:40 PM", stadium: "T-Mobile Park, Seattle", lat: 47.5912, lon: -122.3320 },
  { id: "G15", matchup: "Cardinals @ Angels", away: "Cardinals", home: "Angels", timeET: "10:10 PM", stadium: "Angel Stadium, Anaheim", lat: 33.7434, lon: -117.8727 },
];

function timeETToUTC(timeET: string): { hour: number; minute: number } {
  const [time, period] = timeET.split(" ");
  let [hourStr, minStr] = time.split(":");
  let hour = parseInt(hourStr);
  const minute = parseInt(minStr);

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  const utcHour = (hour + 4) % 24;
  return { hour: utcHour, minute };
}

async function predictGame(game: Game) {
  const utcTime = timeETToUTC(game.timeET);
  const date = new Date(Date.UTC(2026, 6, 20, utcTime.hour, utcTime.minute, 0));

  const ephemerisResult = await calculateChart(date, {
    latitude: game.lat,
    longitude: game.lon,
    altitude: 0,
  });

  const planets = ephemerisResult.planets;
  const houses = ephemerisResult.houses;

  // Build chart map
  const chart: Record<string, any> = {};
  planets.forEach((p) => {
    chart[p.name] = p;
  });

  const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];

  // Build house cusps map
  const houseCusps: Record<number, string> = {};
  const ascendant = houses.cusps[0] ?? 0; // H1 cusp
  for (let i = 0; i < 12; i++) {
    const cusp = houses.cusps[i]!;
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] ?? "Aries";
    houseCusps[i + 1] = sign;
  }

  // Determine if night (Sun below horizon = H7-H12)
  const sunHouseIdx = Math.floor(chart["Sun"]?.eclipticLon ?? 0 / 30) % 12;
  const isNight = sunHouseIdx > 5; // Houses 7-12 = night

  // Score the matchup
  const breakdown = scoreMatchup(game.matchup, game.away, game.home, chart, houseCusps, ascendant, isNight);
  printIntegratedBreakdown(breakdown);

  return breakdown;
}

async function runAllGames() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║   LIVE MLB INTEGRATED PREDICTIONS — July 20, 2026             ║");
  console.log("║         5-House Cluster System (Dignity, Retrograde, etc)     ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const predictions = [];
  for (const game of GAMES) {
    try {
      const result = await predictGame(game);
      predictions.push({
        id: game.id,
        matchup: game.matchup,
        prediction: result.prediction,
        confidence: result.confidence,
        margin: result.margin,
        awayTotal: result.awayBreakdown.totalPoints,
        homeTotal: result.homeBreakdown.totalPoints,
      });
    } catch (error) {
      console.error(`Error processing ${game.matchup}:`, error);
    }
  }

  // Summary table
  console.log("\n" + "═".repeat(120));
  console.log("SUMMARY TABLE");
  console.log("═".repeat(120));
  console.log(`${"ID".padEnd(4)} | ${"Matchup".padEnd(30)} | ${"Prediction".padEnd(20)} | ${"Confidence".padEnd(10)} | ${"Margin".padEnd(6)} | ${"Away/Home Totals".padEnd(20)}`);
  console.log("─".repeat(120));

  predictions.forEach((p) => {
    console.log(
      `${p.id.padEnd(4)} | ${p.matchup.padEnd(30)} | ${p.prediction.padEnd(20)} | ${p.confidence.toString().padEnd(10)}% | ${p.margin.toFixed(1).padEnd(6)} | ${p.awayTotal}/${p.homeTotal}`.padEnd(20)
    );
  });

  console.log("═".repeat(120));
  console.log(`\n✅ All ${predictions.length} games scored with full 5-house breakdown\n`);
}

runAllGames().catch(console.error);
