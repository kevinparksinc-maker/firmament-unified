/**
 * DEBUG: Tigers vs Cubs (G9) - July 20, 2026
 * Full 7-layer cluster breakdown
 */

import { calculateChart } from "./ephemeris";
import { scoreClusterMatchup, printClusterBreakdown } from "./mlb-cluster-scorer";

const game = {
  id: "G9",
  matchup: "Tigers @ Cubs",
  away: "Tigers",
  home: "Cubs",
  timeET: "8:05 PM",
  stadium: "Wrigley Field, Chicago",
  lat: 41.9484,
  lon: -87.6553,
};

async function debug() {
  console.log("\n╔════════════════════════════════════════════════════════════════════════╗");
  console.log("║              G9 DETAILED BREAKDOWN: Tigers @ Cubs                    ║");
  console.log("║                    July 20, 2026 | 8:05 PM ET                         ║");
  console.log("╚════════════════════════════════════════════════════════════════════════╝\n");

  // Convert time
  const [time, period] = game.timeET.split(" ");
  let [hourStr, minStr] = time.split(":");
  let hour = parseInt(hourStr);
  const minute = parseInt(minStr);

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  const utcHour = (hour + 4) % 24;
  const date = new Date(Date.UTC(2026, 6, 20, utcHour, minute, 0));

  console.log(`Game Time: ${game.timeET} ET = ${utcHour}:${String(minute).padStart(2, "0")} UTC`);
  console.log(`Location: ${game.stadium} (${game.lat}°N, ${game.lon}°W)`);
  console.log(`Date/Time Object: ${date.toISOString()}\n`);

  const ephemerisResult = await calculateChart(date, {
    latitude: game.lat,
    longitude: game.lon,
    altitude: 0,
  });

  const planets = ephemerisResult.planets;
  const houses = ephemerisResult.houses;

  console.log("PLANETS AT GAME TIME:");
  console.log("─".repeat(150));
  planets.forEach((p) => {
    console.log(
      `${p.name.padEnd(12)} H${p.house.toString().padEnd(2)} Tropical: ${p.eclipticLon.toFixed(2)}° Retrograde: ${p.retrograde ? "YES" : "no"}`
    );
  });

  console.log("\nHOUSE CUSPS:");
  console.log("─".repeat(150));
  houses.cusps.forEach((cusp, i) => {
    if (cusp !== undefined) {
      console.log(`H${(i + 1).toString().padEnd(2)} cusp: ${cusp.toFixed(2)}°`);
    }
  });

  const isNight = utcHour > 18 || utcHour < 6;
  console.log(`\nDay/Night: ${isNight ? "NIGHT" : "DAY"} (for Arabic Lots formula)\n`);

  // Score it
  const breakdown = scoreClusterMatchup(game.away, game.home, planets, houses, isNight);

  // Print detailed breakdown
  printClusterBreakdown(breakdown);

  // Additional analysis
  console.log("\n" + "═".repeat(150));
  console.log("COMPARATIVE ANALYSIS");
  console.log("═".repeat(150));
  console.log(`\nAway (Tigers) Ascendant Cluster Score: ${breakdown.ascendantCluster.totalScore.toFixed(2)}`);
  console.log(`Home (Cubs) Descendant Cluster Score: ${breakdown.descendantCluster.totalScore.toFixed(2)}`);
  console.log(`Margin: ${breakdown.margin.toFixed(2)} points favors ${breakdown.prediction === game.home ? "HOME" : "AWAY"}`);
  console.log(`Confidence: ${breakdown.confidence}%`);
  console.log(`\nActual Result: Tigers WON (away team)`);
  console.log(`Prediction Accuracy: ❌ WRONG`);
  console.log("\nNote: Both clusters scored almost identically (24.71 vs 32.32)");
  console.log("This is a tight matchup where Cubs were predicted but Tigers prevailed\n");
}

debug().catch(console.error);
