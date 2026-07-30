/**
 * DIAGNOSTIC: Isolate the nakshatra modifier's contribution to upset predictions
 *
 * Question: Is the upset prediction coming from base scoring, the nakshatra modifier,
 * or some combination? This test will show the impact by comparing:
 * - Base territorial control (no modifier)
 * - Territorial with nakshatra modifier
 * - Final grand total with all layers
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS } from "./astroEngine";
import { calculateTerritorialControl } from "./territorialControlEngine";
import { getNakshatraAt } from "./nakshatra";
import { NAKSHATRAS, calculateNakshatraModifier } from "./nakshatraData";
import { SIDE_A_HOUSES, SIDE_B_HOUSES } from "./houseScoringConstants";

async function diagnosticTest(gameName: string, date: Date, lat: number, lon: number) {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`DIAGNOSTIC: ${gameName}`);
  console.log(`${"═".repeat(70)}\n`);

  const ephemerisResult = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });
  const planets = ephemerisResult.planets;
  const houses = ephemerisResult.houses;

  const chart: Record<string, any> = {};
  planets.forEach((p) => {
    chart[p.name] = p;
  });

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

  // Build house lords
  const houseLords = new Map<number, string>();
  for (let i = 0; i < 12; i++) {
    const cusp = houses.cusps[i]!;
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] ?? "Aries";
    const ruler = SIGN_RULERS[sign];
    if (ruler) {
      houseLords.set(i + 1, ruler);
    }
  }

  // Calculate WITH nakshatra modifier (current system)
  const withModifier = calculateTerritorialControl(chart, houseLords);

  // Calculate WITHOUT nakshatra modifier (base points only)
  let sideABase = 0;
  let sideBBase = 0;
  withModifier.sideAEvals.forEach((e) => {
    sideABase += e.basePoints;
  });
  withModifier.sideBEvals.forEach((e) => {
    sideBBase += e.basePoints;
  });

  console.log("TERRITORIAL CONTROL LAYER ONLY:");
  console.log("───────────────────────────────");
  console.log(`Side A (base):        ${sideABase > 0 ? "+" : ""}${sideABase}`);
  console.log(`Side B (base):        ${sideBBase > 0 ? "+" : ""}${sideBBase}`);
  console.log(`Margin (base):        ${Math.abs(sideABase - sideBBase)}`);
  console.log(`Winner (base):        ${sideABase > sideBBase ? "A" : sideBBase > sideABase ? "B" : "Tied"}`);

  console.log(`\nSide A (with mod):    ${withModifier.sideATotal.toFixed(2)}`);
  console.log(`Side B (with mod):    ${withModifier.sideBTotal.toFixed(2)}`);
  console.log(`Margin (with mod):    ${withModifier.margin.toFixed(2)}`);
  console.log(`Winner (with mod):    ${withModifier.sideATotal > withModifier.sideBTotal ? "A" : withModifier.sideBTotal > withModifier.sideATotal ? "B" : "Tied"}`);

  const modifierSwing = withModifier.sideATotal - sideABase;
  const modifierSwingB = withModifier.sideBTotal - sideBBase;
  console.log(`\nModifier impact A:    ${modifierSwing > 0 ? "+" : ""}${modifierSwing.toFixed(2)} (${((modifierSwing / Math.abs(sideABase)) * 100).toFixed(0)}% change)`);
  console.log(`Modifier impact B:    ${modifierSwingB > 0 ? "+" : ""}${modifierSwingB.toFixed(2)} (${((modifierSwingB / Math.abs(sideBBase)) * 100).toFixed(0)}% change)`);

  console.log("\n\nNAKSHATRA MODIFIER BREAKDOWN:");
  console.log("─────────────────────────────");

  const sideAMods: number[] = [];
  const sideBMods: number[] = [];

  withModifier.sideAEvals.forEach((e) => {
    if (e.nakshatraModifier) sideAMods.push(e.nakshatraModifier);
  });
  withModifier.sideBEvals.forEach((e) => {
    if (e.nakshatraModifier) sideBMods.push(e.nakshatraModifier);
  });

  const avgModA = sideAMods.reduce((a, b) => a + b, 0) / sideAMods.length;
  const avgModB = sideBMods.reduce((a, b) => a + b, 0) / sideBMods.length;

  console.log(`Side A average modifier: ${avgModA.toFixed(3)}x`);
  console.log(`Side B average modifier: ${avgModB.toFixed(3)}x`);
  console.log(`Relative advantage:     ${((avgModB - avgModA) * 100).toFixed(1)}% favor B`);

  // Show which nakshatras are "dragging" vs "boosting"
  console.log("\nLords with strongest modifier impact:");
  const allEvals = [...withModifier.sideAEvals, ...withModifier.sideBEvals];
  const byImpact = allEvals.filter((e) => e.nakshatraModifier).sort((a, b) => {
    const swingA = Math.abs((a.points - a.basePoints) / Math.max(Math.abs(a.basePoints), 1));
    const swingB = Math.abs((b.points - b.basePoints) / Math.max(Math.abs(b.basePoints), 1));
    return swingB - swingA;
  });

  byImpact.slice(0, 5).forEach((e) => {
    const swing = e.points - e.basePoints;
    const pct = ((swing / Math.max(Math.abs(e.basePoints), 1)) * 100).toFixed(0);
    console.log(
      `  H${e.houseNumber} ${e.lord} (${e.nakshatraName}): ${e.basePoints > 0 ? "+" : ""}${e.basePoints} → ${e.points > 0 ? "+" : ""}${e.points.toFixed(2)} [${swing > 0 ? "+" : ""}${swing.toFixed(2)}, ${pct}%]`
    );
  });

  console.log("\n\nQUESTION: Does the base territorial already predict this upset?");
  if (sideABase < sideBBase && withModifier.sideATotal < withModifier.sideBTotal) {
    console.log(`✓ YES: Both base (${sideABase} vs ${sideBBase}) and modified (${withModifier.sideATotal.toFixed(2)} vs ${withModifier.sideBTotal.toFixed(2)}) predict Side B.`);
    console.log(`  The nakshatra modifier AMPLIFIED an existing base-level advantage.`);
    console.log(`  → Problem likely in base scoring, not nakshatra layer.`);
  } else if (sideABase > sideBBase && withModifier.sideATotal < withModifier.sideBTotal) {
    console.log(`⚠️  FLIPPED: Base predicted Side A, modifier flipped it to Side B.`);
    console.log(`  The nakshatra modifier is overriding the base scoring.`);
    console.log(`  → Problem likely in nakshatra amplification.`);
  } else {
    console.log(`? UNCERTAIN: Both or neither predict upset in the same direction.`);
  }
}

async function runDiagnostics() {
  // Test both upsets
  const germany = new Date(Date.UTC(2026, 5, 29, 20, 30, 0)); // June 29, 4:30 PM EDT
  await diagnosticTest("Germany vs Paraguay (June 29, 2026)", germany, 42.0909, -71.2643);

  const brazil = new Date(Date.UTC(2026, 6, 5, 20, 0, 0)); // July 5, 4:00 PM EDT
  await diagnosticTest("Brazil vs Norway (July 5, 2026)", brazil, 40.8135, -74.0745);
}

runDiagnostics().catch(console.error);
