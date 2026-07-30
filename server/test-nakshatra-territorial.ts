/**
 * Test: Nakshatra Modifier Integration with Territorial Control
 *
 * This test verifies that the nakshatra behavioral layer (Initiative,
 * Pressure Response, Consistency, Finishing Ability) correctly modifies
 * the territorial control scores via multipliers.
 */

import type { PlanetPlacement } from "./astroEngine";
import { calculateTerritorialControl, formatTerritorialReport } from "./territorialControlEngine";
import { SIDE_A_HOUSES, SIDE_B_HOUSES } from "./houseScoringConstants";
import { getNakshatraAt } from "./nakshatra";
import { NAKSHATRAS, calculateNakshatraModifier } from "./nakshatraData";

// Test Case 1: Mets vs Phillies (sample horary chart)
// Using realistic planetary positions with nakshatras that have varied execution traits

const testChart: Record<string, PlanetPlacement> = {
  Mercury: {
    planet: "Mercury",
    lon: 112.5, // Purva Phalguni (Low consistency, Low finishing)
    lat: 0.1,
    ra: 111.2,
    dec: 5.3,
    sign: "Leo",
    degree: 22,
    minute: 30,
    house: 1,
    rasi: 4,
  },
  Venus: {
    planet: "Venus",
    lon: 78.3, // Mrigashira (High adaptability, Medium consistency)
    lat: 2.8,
    ra: 77.5,
    dec: 4.2,
    sign: "Gemini",
    degree: 18,
    minute: 18,
    house: 7,
    rasi: 2,
  },
  Mars: {
    planet: "Mars",
    lon: 145.0, // Vishakha (High finishing, Medium consistency)
    lat: 1.4,
    ra: 143.8,
    dec: -8.1,
    sign: "Virgo",
    degree: 5,
    minute: 0,
    house: 3,
    rasi: 5,
  },
  Sun: {
    planet: "Sun",
    lon: 52.5, // Krittika (Excellent initiative, Medium consistency)
    lat: 0.0,
    ra: 51.8,
    dec: 21.1,
    sign: "Taurus",
    degree: 22,
    minute: 30,
    house: 10,
    rasi: 1,
  },
  Moon: {
    planet: "Moon",
    lon: 185.0, // Jyeshtha (Excellent pressure response, High consistency)
    lat: 5.2,
    ra: 183.5,
    dec: -15.0,
    sign: "Libra",
    degree: 5,
    minute: 0,
    house: 6,
    rasi: 6,
  },
  Jupiter: {
    planet: "Jupiter",
    lon: 210.5, // Uttara Ashadha (Excellent finishing, Excellent pressure response)
    lat: 1.2,
    ra: 209.0,
    dec: -22.5,
    sign: "Scorpio",
    degree: 0,
    minute: 30,
    house: 4,
    rasi: 7,
  },
  Saturn: {
    planet: "Saturn",
    lon: 295.0, // Pushya... wait that's wrong zone. Let me recalc. Pushya is 106.67-120. This is Shravana (High consistency, High pressure response)
    lat: -2.1,
    ra: 293.2,
    dec: -18.3,
    sign: "Capricorn",
    degree: 5,
    minute: 0,
    house: 9,
    rasi: 9,
  },
};

// House lords (Side A = H1,3,6,10,11; Side B = H7,9,12,4,5)
// For this test: simple assignments
const houseLords = new Map<number, string>([
  // Side A (Favorable)
  [1, "Mercury"],   // L1 in H1, Purva Phalguni
  [3, "Mars"],      // L3 in H3, Vishakha
  [6, "Moon"],      // L6 in H6, Jyeshtha
  [10, "Sun"],      // L10 in H10, Krittika
  [11, "Venus"],    // L11 in H7 (opponent cluster, angle)
  // Side B (Challenger)
  [7, "Venus"],     // L7 in H7, Mrigashira
  [9, "Saturn"],    // L9 in H9, Shravana
  [12, "Jupiter"],  // L12 in H4 (own cluster but 12th lord)
  [4, "Jupiter"],   // L4 in H4, Uttara Ashadha
  [5, "Moon"],      // L5 in H6 (own cluster)
]);

console.log("═══════════════════════════════════════════════════════════════");
console.log("TEST: NAKSHATRA TERRITORIAL MODIFIER");
console.log("═══════════════════════════════════════════════════════════════\n");

console.log("STEP 1: Verify nakshatra lookups and modifiers\n");

const planetsToCheck = ["Mercury", "Venus", "Mars", "Sun", "Moon", "Jupiter", "Saturn"];
planetsToCheck.forEach((planet) => {
  const placement = testChart[planet];
  if (placement) {
    const { nakshatra } = getNakshatraAt(placement.lon);
    const profile = NAKSHATRAS[nakshatra.name];
    const modifier = calculateNakshatraModifier(profile);
    console.log(
      `${planet.padEnd(10)} @ ${placement.lon.toFixed(1)}° → ${nakshatra.name.padEnd(16)} [${profile.initiative} init, ${profile.pressureResponse} PR, ${profile.consistency} cons, ${profile.finishingAbility} fin] = ${modifier.toFixed(3)}x`
    );
  }
});

console.log("\n");
console.log("STEP 2: Calculate territorial control with nakshatra modifiers\n");

const result = calculateTerritorialControl(testChart, houseLords);

console.log(formatTerritorialReport(result));

console.log("\nSTEP 3: Interpretation\n");
console.log("Base scoring (without nakshatra) ranges from -2 to +2 per lord.");
console.log("Nakshatra modifier scales that: 0.85x (Low) to 1.3x (Excellent).");
console.log("A lord with Low execution traits (0.85x) weakens strong positions.");
console.log("A lord with Excellent traits (1.3x) strengthens positions.\n");

// Show which nakshatras are "lifting" or "dragging" the score
console.log("Modifier Impact Summary:");
console.log("─────────────────────────");
[...result.sideAEvals, ...result.sideBEvals].forEach((e) => {
  if (e.nakshatraModifier) {
    const effect =
      e.nakshatraModifier > 1.0
        ? `↑ lifting (${(e.nakshatraModifier - 1).toFixed(1)}x boost)`
        : e.nakshatraModifier < 1.0
          ? `↓ dragging (${((1 - e.nakshatraModifier) * 100).toFixed(0)}% penalty)`
          : "neutral";
    console.log(`  H${e.houseNumber} ${e.lord} (${e.nakshatraName}): ${effect}`);
  }
});
