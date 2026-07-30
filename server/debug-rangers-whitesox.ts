/**
 * DEBUG: Rangers vs White Sox (G10) - July 20, 2026
 * Full 7-layer cluster breakdown
 */

import { calculateChart } from "./ephemeris";
import { scoreClusterMatchup, printClusterBreakdown } from "./mlb-cluster-scorer";

const game = {
  id: "G10",
  matchup: "White Sox @ Rangers",
  away: "White Sox",
  home: "Rangers",
  timeET: "8:05 PM",
  stadium: "Globe Life Field, Arlington",
  lat: 32.7467,
  lon: -97.0828,
};

async function debug() {
  console.log("\n╔════════════════════════════════════════════════════════════════════════╗");
  console.log("║              G10 DETAILED BREAKDOWN: White Sox @ Rangers              ║");
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
  console.log(`\nAway (White Sox) Ascendant Cluster Score: ${breakdown.ascendantCluster.totalScore.toFixed(2)}`);
  console.log(`Home (Rangers) Descendant Cluster Score: ${breakdown.descendantCluster.totalScore.toFixed(2)}`);
  console.log(`Margin: ${breakdown.margin.toFixed(2)} points favors ${breakdown.prediction === game.home ? "HOME" : "AWAY"}`);
  console.log(`Confidence: ${breakdown.confidence}%`);
  console.log(`\nActual Result: White Sox WON (away team upset)`);
  console.log(`Prediction Accuracy: ❌ WRONG`);
  console.log("\nWhy the Ascendant cluster (White Sox/Away) should have won:");
  console.log("- Despite lower total, White Sox had the better actual team");
  console.log("- Rangers played at home but underperformed");
  console.log("- The chart doesn't account for team strength/form on this date\n");
}

debug().catch(console.error);
