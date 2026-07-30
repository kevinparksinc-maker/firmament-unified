/**
 * JULY 21, 2026 GAMES — CLUSTER SCORES ONLY
 * No team assignment — user will assign Asc/Dsc after
 */

import { calculateChart } from "./ephemeris";
import { scoreClusterMatchup } from "./mlb-cluster-scorer";

interface Game {
  matchup: string;
  timeET: string;
  lat: number;
  lon: number;
}

const GAMES: Game[] = [
  {
    matchup: "Dodgers @ Phillies",
    timeET: "6:40 PM",
    lat: 39.9061,
    lon: -75.1675,
  },
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

async function scoreGames() {
  console.log("\n╔════════════════════════════════════════════════════════════════════════╗");
  console.log("║              JULY 21, 2026 — CLUSTER SCORES (No Assignment)           ║");
  console.log("╚════════════════════════════════════════════════════════════════════════╝\n");

  for (const game of GAMES) {
    const utcTime = timeETToUTC(game.timeET);
    const date = new Date(Date.UTC(2026, 6, 21, utcTime.hour, utcTime.minute, 0));

    const ephemerisResult = await calculateChart(date, {
      latitude: game.lat,
      longitude: game.lon,
      altitude: 0,
    });

    const planets = ephemerisResult.planets;
    const houses = ephemerisResult.houses;
    const isNight = utcTime.hour > 18 || utcTime.hour < 6;

    // Score with placeholder team names
    const breakdown = scoreClusterMatchup("Team1", "Team2", planets, houses, isNight);

    console.log(`\n${game.matchup} — ${game.timeET} ET`);
    console.log("─".repeat(80));
    console.log(`Ascendant Cluster:  ${breakdown.ascendantCluster.totalScore.toFixed(2)}`);
    console.log(`Descendant Cluster: ${breakdown.descendantCluster.totalScore.toFixed(2)}`);
    console.log(
      `Margin: ${breakdown.margin.toFixed(2)} (${breakdown.prediction === "Team2" ? "Dsc" : "Asc"} favored by chart)`
    );
    console.log();
  }
}

scoreGames().catch(console.error);
