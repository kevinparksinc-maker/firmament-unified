/**
 * LIVE MLB PREDICTIONS - July 20, 2026
 * 15-Game Slate | Real-Time Chart Calculation | CLUSTER VS CLUSTER METHOD
 *
 * Converts game times to UTC, calculates charts at exact kickoff,
 * runs full cluster analysis (H1,3,6,10,11 vs H7,9,12,4,5).
 */

import { calculateChart } from "./ephemeris";
import { scoreClusterMatchup } from "./mlb-cluster-scorer";

interface Game {
  matchup: string;
  away: string;
  home: string;
  timeET: string;
  stadium: string;
  lat: number;
  lon: number;
}

const GAMES: Game[] = [
  { matchup: "Twins @ Guardians", away: "Twins", home: "Guardians", timeET: "6:40 PM", stadium: "Progressive Field, Cleveland", lat: 41.4955, lon: -81.6852 },
  { matchup: "Pirates @ Yankees", away: "Pirates", home: "Yankees", timeET: "7:05 PM", stadium: "Yankee Stadium, Bronx", lat: 40.8296, lon: -73.9262 },
  { matchup: "Rays @ Blue Jays", away: "Rays", home: "Blue Jays", timeET: "7:07 PM", stadium: "Rogers Centre, Toronto", lat: 43.6426, lon: -79.3957 },
  { matchup: "Orioles @ Red Sox", away: "Orioles", home: "Red Sox", timeET: "7:10 PM", stadium: "Fenway Park, Boston", lat: 42.3461, lon: -71.0972 },
  { matchup: "Dodgers @ Phillies", away: "Dodgers", home: "Phillies", timeET: "7:10 PM", stadium: "Citizens Bank Park, Philadelphia", lat: 39.9061, lon: -75.1675 },
  { matchup: "Padres @ Braves", away: "Padres", home: "Braves", timeET: "7:15 PM", stadium: "Truist Park, Atlanta", lat: 33.7490, lon: -84.3880 },
  { matchup: "Giants @ Royals", away: "Giants", home: "Royals", timeET: "7:40 PM", stadium: "Kauffman Stadium, Kansas City", lat: 39.0518, lon: -94.4803 },
  { matchup: "Mets @ Brewers", away: "Mets", home: "Brewers", timeET: "7:40 PM", stadium: "American Family Field, Milwaukee", lat: 43.0285, lon: -87.9712 },
  { matchup: "Tigers @ Cubs", away: "Tigers", home: "Cubs", timeET: "8:05 PM", stadium: "Wrigley Field, Chicago", lat: 41.9484, lon: -87.6553 },
  { matchup: "White Sox @ Rangers", away: "White Sox", home: "Rangers", timeET: "8:05 PM", stadium: "Globe Life Field, Arlington", lat: 32.7467, lon: -97.0828 },
  { matchup: "Marlins @ Astros", away: "Marlins", home: "Astros", timeET: "8:10 PM", stadium: "Daikin Park, Houston", lat: 29.7572, lon: -95.3555 },
  { matchup: "Nationals @ Rockies", away: "Nationals", home: "Rockies", timeET: "8:40 PM", stadium: "Coors Field, Denver", lat: 39.7561, lon: -104.9942 },
  { matchup: "Athletics @ D-backs", away: "Athletics", home: "D-backs", timeET: "9:40 PM", stadium: "Chase Field, Phoenix", lat: 33.4453, lon: -112.0667 },
  { matchup: "Reds @ Mariners", away: "Reds", home: "Mariners", timeET: "9:40 PM", stadium: "T-Mobile Park, Seattle", lat: 47.5912, lon: -122.3320 },
  { matchup: "Cardinals @ Angels", away: "Cardinals", home: "Angels", timeET: "10:10 PM", stadium: "Angel Stadium, Anaheim", lat: 33.7434, lon: -117.8727 },
];

function timeETToUTC(timeET: string): { hour: number; minute: number } {
  const [time, period] = timeET.split(" ");
  let [hourStr, minStr] = time.split(":");
  let hour = parseInt(hourStr);
  const minute = parseInt(minStr);

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  // ET to UTC: add 4 hours (EDT in July)
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
  const isNight = utcTime.hour > 18 || utcTime.hour < 6;

  const clusterBreakdown = scoreClusterMatchup(game.away, game.home, planets, houses, isNight);

  return {
    matchup: game.matchup,
    prediction: clusterBreakdown.prediction,
    confidence: clusterBreakdown.confidence.toString(),
    h1: `Asc: ${clusterBreakdown.ascendantCluster.totalScore.toFixed(2)}`,
    h7: `Dsc: ${clusterBreakdown.descendantCluster.totalScore.toFixed(2)}`,
  };
}

async function runAllPredictions() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║           LIVE MLB PREDICTIONS — July 20, 2026               ║");
  console.log("║                    15-Game Slate                             ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  console.log("PREDICTIONS:");
  console.log("─".repeat(90));
  console.log(`${"Matchup".padEnd(30)} | ${"Prediction".padEnd(20)} | ${"Confidence".padEnd(10)} | ${"H1/H7 Lords".padEnd(25)}`);
  console.log("─".repeat(90));

  const results = [];
  for (const game of GAMES) {
    const pred = await predictGame(game);
    results.push(pred);
    console.log(
      `${pred.matchup.padEnd(30)} | ${pred.prediction.padEnd(20)} | ${pred.confidence.padEnd(10)}% | ${pred.h1} / ${pred.h7}`
    );
  }

  console.log("─".repeat(90));
  console.log(
    `\nTotal Games: ${GAMES.length} | Predictions locked at ${new Date().toLocaleTimeString()}`
  );
  console.log("Awaiting live results...\n");
}

runAllPredictions().catch(console.error);
