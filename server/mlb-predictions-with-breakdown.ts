/**
 * LIVE MLB PREDICTIONS WITH CLUSTER BREAKDOWN
 * Makes predictions AND shows the full cluster analysis for each matchup
 * CLUSTER VS CLUSTER METHOD: Ascendant (H1,3,6,10,11) vs Descendant (H4,5,7,9,12)
 */

import { calculateChart } from "./ephemeris";
import { scoreClusterMatchup, printClusterBreakdown, type MatchupClusterBreakdown } from "./mlb-cluster-scorer";

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
  { id: "G7", matchup: "Giants @ Royals", away: "Giants", home: "Royals", timeET: "7:40 PM", stadium: "Kauffman Stadium, Kansas City", lat: 39.0518, lon: -94.4803 },
  { id: "G14", matchup: "Reds @ Mariners", away: "Reds", home: "Mariners", timeET: "9:40 PM", stadium: "T-Mobile Park, Seattle", lat: 47.5912, lon: -122.3320 },
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

async function predictGameWithBreakdown(game: Game): Promise<MatchupClusterBreakdown> {
  const utcTime = timeETToUTC(game.timeET);
  const date = new Date(Date.UTC(2026, 6, 20, utcTime.hour, utcTime.minute, 0));

  const ephemerisResult = await calculateChart(date, {
    latitude: game.lat,
    longitude: game.lon,
    altitude: 0,
  });

  const planets = ephemerisResult.planets;
  const houses = ephemerisResult.houses;

  // Determine if night (Sun below horizon)
  const isNight = utcTime.hour > 18 || utcTime.hour < 6;

  return scoreClusterMatchup(game.away, game.home, planets, houses, isNight);
}

async function runAllPredictions() {
  console.log("\n╔════════════════════════════════════════════════════════════════════════╗");
  console.log("║       LIVE MLB PREDICTIONS WITH CLUSTER BREAKDOWN                    ║");
  console.log("║              July 20, 2026 | All Matchups | Full Audit Trail        ║");
  console.log("╚════════════════════════════════════════════════════════════════════════╝");
  console.log("\nMETHOD: Ascendant cluster (H1,3,6,10,11) vs Descendant cluster (H4,5,7,9,12)\n");

  for (const game of GAMES) {
    const breakdown = await predictGameWithBreakdown(game);
    printClusterBreakdown(breakdown);
  }

  console.log("\n✅ Full cluster breakdowns locked for audit trail.\n");
}

runAllPredictions().catch(console.error);
