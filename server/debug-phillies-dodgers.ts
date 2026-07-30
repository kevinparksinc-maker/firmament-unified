/**
 * DEBUG: Phillies vs Dodgers (7/21/26)
 * Full 7-layer cluster breakdown
 */

import { calculateChart } from "./ephemeris";
import { scoreClusterMatchup, printClusterBreakdown } from "./mlb-cluster-scorer";

async function debug() {
  console.log("\n╔════════════════════════════════════════════════════════════════════════╗");
  console.log("║              PHILLIES VS DODGERS — FULL BREAKDOWN                     ║");
  console.log("║                    July 21, 2026 | 6:40 PM ET                         ║");
  console.log("╚════════════════════════════════════════════════════════════════════════╝\n");

  const timeET = "6:40 PM";
  const [time, period] = timeET.split(" ");
  let [hourStr, minStr] = time.split(":");
  let hour = parseInt(hourStr);
  const minute = parseInt(minStr);

  if (period === "PM" && hour !== 12) hour += 12;
  const utcHour = (hour + 4) % 24;

  const date = new Date(Date.UTC(2026, 6, 21, utcHour, minute, 0));

  console.log(`Game Time: ${timeET} ET = ${utcHour}:${String(minute).padStart(2, "0")} UTC`);
  console.log(`Location: Citizens Bank Park, Philadelphia (39.9061°N, 75.1675°W)`);
  console.log(`Date/Time Object: ${date.toISOString()}\n`);

  const ephemerisResult = await calculateChart(date, {
    latitude: 39.9061,
    longitude: -75.1675,
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
  console.log(`\nDay/Night: ${isNight ? "NIGHT" : "DAY"}\n`);

  const breakdown = scoreClusterMatchup("Dodgers", "Phillies", planets, houses, isNight);

  printClusterBreakdown(breakdown);

  console.log("\n" + "═".repeat(150));
  console.log("INTERPRETATION");
  console.log("═".repeat(150));
  console.log(`\nAscendant (Phillies/Favored):  ${breakdown.ascendantCluster.totalScore.toFixed(2)}`);
  console.log(`Descendant (Dodgers/Underdog): ${breakdown.descendantCluster.totalScore.toFixed(2)}`);
  console.log(`\nMargin: ${breakdown.margin.toFixed(2)} favors DESCENDANT (upset call)`);
  console.log(`Chart says: Dodgers (underdog) have stronger position\n`);
}

debug().catch(console.error);
