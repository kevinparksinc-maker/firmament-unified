/**
 * LIVE MLB PREDICTIONS — CLUSTER VS CLUSTER METHOD
 * July 20, 2026 | All 15 Games
 *
 * Evaluates Ascendant cluster (H1,3,6,10,11) vs Descendant cluster (H7,9,12,4,5)
 * This is the correct methodology: full planetary weight, not lord sampling
 */

import { calculateChart } from "./ephemeris";
import { scoreClusterMatchup, printClusterBreakdown, MatchupClusterBreakdown } from "./mlb-cluster-scorer";

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

async function predictGameCluster(game: Game): Promise<MatchupClusterBreakdown> {
  const utcTime = timeETToUTC(game.timeET);
  const date = new Date(Date.UTC(2026, 6, 20, utcTime.hour, utcTime.minute, 0));

  const ephemerisResult = await calculateChart(date, {
    latitude: game.lat,
    longitude: game.lon,
    altitude: 0,
  });

  const planets = ephemerisResult.planets;

  return scoreClusterMatchup(game.away, game.home, planets);
}

async function runAllPredictions() {
  console.log("\n╔════════════════════════════════════════════════════════════════════════╗");
  console.log("║       LIVE MLB PREDICTIONS — CLUSTER VS CLUSTER METHOD                ║");
  console.log("║              July 20, 2026 | 15 Games | All Predictions               ║");
  console.log("╚════════════════════════════════════════════════════════════════════════╝\n");

  console.log("METHOD: Ascendant cluster (H1,3,6,10,11) vs Descendant cluster (H7,9,12,4,5)");
  console.log("Each planet scored by nakshatra, dignity, placement, retrograde, fixed stars");
  console.log("Clusters compared as total planetary weight, not lord sampling\n");

  let predictions: MatchupClusterBreakdown[] = [];

  for (const game of GAMES) {
    const breakdown = await predictGameCluster(game);
    predictions.push(breakdown);
    printClusterBreakdown(breakdown);
  }

  console.log("\n" + "═".repeat(140));
  console.log("SUMMARY");
  console.log("═".repeat(140));
  console.log(`\n${"Matchup".padEnd(35)} | ${"Pick".padEnd(12)} | ${"Conf".padEnd(6)} | ${"Margin".padEnd(8)}`);
  console.log("─".repeat(140));

  predictions.forEach((p) => {
    console.log(
      `${p.matchup.padEnd(35)} | ${p.prediction.padEnd(12)} | ${p.confidence.toString().padEnd(6)}% | ${p.margin.toFixed(2).padEnd(8)}`
    );
  });

  console.log("─".repeat(140));
  console.log(`\nTotal: ${predictions.length} games locked`);
  console.log(`Timestamp: ${new Date().toLocaleString()}`);
  console.log("\n✅ Predictions ready for comparison against actual results\n");

  return predictions;
}

runAllPredictions().catch(console.error);
