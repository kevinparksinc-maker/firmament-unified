/**
 * DEBUG: Athletics vs D-backs (G13) - July 20, 2026
 * Full 7-layer cluster breakdown
 */

import { calculateChart } from "./ephemeris";
import { scoreClusterMatchup, printClusterBreakdown } from "./mlb-cluster-scorer";

const game = {
  id: "G13",
  matchup: "Athletics @ D-backs",
  away: "Athletics",
  home: "D-backs",
  timeET: "9:40 PM",
  stadium: "Chase Field, Phoenix",
  lat: 33.4453,
  lon: -112.0667,
};

async function debug() {
  console.log("\n╔════════════════════════════════════════════════════════════════════════╗");
  console.log("║              G13 DETAILED BREAKDOWN: Athletics @ D-backs              ║");
  console.log("║                    July 20, 2026 | 9:40 PM ET                         ║");
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
  console.log(`\nAway (Athletics) Ascendant Cluster Score: ${breakdown.ascendantCluster.totalScore.toFixed(2)}`);
  console.log(`Home (D-backs) Descendant Cluster Score: ${breakdown.descendantCluster.totalScore.toFixed(2)}`);
  console.log(`Margin: ${breakdown.margin.toFixed(2)} points favors ${breakdown.prediction === game.home ? "HOME" : "AWAY"}`);
  console.log(`Confidence: ${breakdown.confidence}% (HIGH CONFIDENCE)`);
  console.log(`\nActual Result: Athletics WON (away team upset)`);
  console.log(`Prediction Accuracy: ❌ WRONG (and HIGH confidence = worse miss)`);
  console.log("\nWhy Athletics won despite lower cluster score:");
  console.log("- D-backs had overwhelmingly stronger planetary weight");
  console.log("- But Athletics were the favored team (better record)");
  console.log("- Chart favored home despite Athletics being the actual favorite\n");
}

debug().catch(console.error);
