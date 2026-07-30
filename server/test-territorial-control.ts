/**
 * TEST: Territorial Control Layer
 * Mets vs Phillies, July 16, 2026
 */

import { calculateChart } from "./ephemeris";
import { calculateTerritorialControl, formatTerritorialReport } from "./territorialControlEngine";
import { SIGN_RULERS } from "./astroEngine";
import type { HouseCusps } from "./ephemeris";

async function testTerritorialControl() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("TERRITORIAL CONTROL TEST — Mets vs Phillies");
  console.log("════════════════════════════════════════════════════════════════\n");

  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = {
    latitude: 39.9526,
    longitude: -75.1652,
    altitude: 0,
  };

  const result = await calculateChart(date, observer);
  const planetsArray = result.planets;
  const houses = result.houses;

  // Convert planets to object
  const planets: Record<string, any> = {};
  planetsArray.forEach((p: any) => {
    planets[p.name] = p;
  });

  // Build house lords map from house cusps
  const houseLords = new Map<number, string>();

  // Convert sidereal longitude to sign
  const ZODIAC_SIGNS = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];

  for (let i = 0; i < 12; i++) {
    const lon = houses.cusps[i]!;
    const signIndex = Math.floor(lon / 30);
    const sign = ZODIAC_SIGNS[signIndex] ?? "Aries";
    const ruler = SIGN_RULERS[sign];
    if (ruler) {
      houseLords.set(i + 1, ruler);
    }
  }

  console.log("HOUSE LORDS (from cusps):");
  for (let h = 1; h <= 12; h++) {
    const lord = houseLords.get(h);
    const pos = planets[lord!];
    if (lord && pos) {
      console.log(
        `  H${h.toString().padStart(2)} → ${lord.padEnd(9)} (currently in H${pos.house})`
      );
    }
  }
  console.log("");

  // Calculate territorial control
  const territorialResult = calculateTerritorialControl(planets, houseLords);

  console.log(formatTerritorialReport(territorialResult));

  // Summary
  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("SUMMARY");
  console.log("════════════════════════════════════════════════════════════════\n");

  console.log(`Phillies (Side A): ${territorialResult.sideATotal > 0 ? "+" : ""}${territorialResult.sideATotal}`);
  console.log(`Mets (Side B):     ${territorialResult.sideBTotal > 0 ? "+" : ""}${territorialResult.sideBTotal}`);
  console.log(`Swing:             ${territorialResult.sideBTotal - territorialResult.sideATotal} points (Mets favor)\n`);

  console.log("This swing ALONE explains why Mets could upset Phillies");
  console.log("despite Phillies' home field + better record advantage.");
  console.log("════════════════════════════════════════════════════════════════");
}

testTerritorialControl();
