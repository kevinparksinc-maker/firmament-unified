/**
 * NAKSHATRA FULL BREAKDOWN
 *
 * Show ALL 12 houses + ALL planets with their nakshatra profiles
 * Complete transparency: which planets/houses have strong execution? Weak execution?
 */

import { calculateChart } from "./ephemeris";
import { getNakshatraFromLongitude, calculateNakshatraModifier, NAKSHATRAS } from "./nakshatraData";
import { evaluateCluster } from "./houseClusterEngine";
import { SIGN_RULERS } from "./astroEngine";

interface GameTest {
  name: string;
  date: Date;
  location: { lat: number; lon: number };
  favorite: string;
  underdog: string;
  actualWinner: string;
}

const games: GameTest[] = [
  {
    name: "Mets vs Phillies",
    date: new Date(Date.UTC(2026, 6, 16, 22, 30, 0)),
    location: { lat: 39.9526, lon: -75.1652 },
    favorite: "Phillies",
    underdog: "Mets",
    actualWinner: "Mets",
  },
];

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const SIDE_A = [1, 3, 6, 10, 11];
const SIDE_B = [4, 5, 7, 9, 12];

async function testNakshatraFullBreakdown() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("NAKSHATRA FULL BREAKDOWN — All 12 Houses + All Planets");
  console.log("════════════════════════════════════════════════════════════════\n");

  for (const game of games) {
    console.log(`GAME: ${game.name} (${game.actualWinner} won)\n`);

    const ephResult = await calculateChart(game.date, {
      latitude: game.location.lat,
      longitude: game.location.lon,
      altitude: 0,
    });

    const planets: Record<string, any> = {};
    ephResult.planets.forEach((p) => {
      planets[p.name] = p;
    });

    // ═══════════════════════════════════════════════════════════════
    // PART 1: ALL 12 HOUSES WITH LORDS
    // ═══════════════════════════════════════════════════════════════

    console.log("ALL 12 HOUSES — Lords & Nakshatras:");
    console.log("─".repeat(100) + "\n");

    const houseData: any[] = [];

    for (let h = 1; h <= 12; h++) {
      const lon = ephResult.houses.cusps[h - 1]!;
      const signIdx = Math.floor(lon / 30);
      const sign = ZODIAC[signIdx] ?? "Aries";
      const lord = SIGN_RULERS[sign];
      const lordPlacement = planets[lord];

      if (!lordPlacement) continue;

      const lordNakshatra = getNakshatraFromLongitude(lordPlacement.eclipticLon);
      const lordModifier = calculateNakshatraModifier(lordNakshatra);
      const side = SIDE_A.includes(h) ? "A" : SIDE_B.includes(h) ? "B" : "—";

      houseData.push({
        house: h,
        sign,
        lord,
        lordNakshatra,
        lordModifier,
        side,
      });

      console.log(
        `H${h.toString().padStart(2)} (${sign.padEnd(12)}) → ${lord.padEnd(9)} in ${lordNakshatra.name.padEnd(18)} | Init:${lordNakshatra.initiative.padEnd(9)} Press:${lordNakshatra.pressureResponse.padEnd(9)} Cons:${lordNakshatra.consistency.padEnd(9)} Fin:${lordNakshatra.finishingAbility.padEnd(9)} | Mod: ${lordModifier.toFixed(3)} | Side ${side}`
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // PART 2: ALL PLANETS WITH NAKSHATRAS
    // ═══════════════════════════════════════════════════════════════

    console.log("\n" + "═".repeat(100));
    console.log("ALL PLANETS — Nakshatras & Execution Traits:");
    console.log("─".repeat(100) + "\n");

    for (const p of ephResult.planets) {
      const nakshatra = getNakshatraFromLongitude(p.eclipticLon);
      const modifier = calculateNakshatraModifier(nakshatra);

      console.log(
        `${p.name.padEnd(10)} ${p.sign.padEnd(12)} H${p.house} | ${nakshatra.name.padEnd(18)} | Init:${nakshatra.initiative.padEnd(9)} Press:${nakshatra.pressureResponse.padEnd(9)} Cons:${nakshatra.consistency.padEnd(9)} Fin:${nakshatra.finishingAbility.padEnd(9)} | Mod: ${modifier.toFixed(3)}`
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // PART 3: SIDE A vs SIDE B NAKSHATRA SUMMARY
    // ═══════════════════════════════════════════════════════════════

    console.log("\n" + "═".repeat(100));
    console.log("SIDE A (Phillies) vs SIDE B (Mets) — Nakshatra Execution Profile:");
    console.log("─".repeat(100) + "\n");

    const sideALords = houseData.filter((h) => h.side === "A");
    const sideBLords = houseData.filter((h) => h.side === "B");

    console.log("SIDE A (Phillies) — Houses 1, 3, 6, 10, 11:\n");
    for (const lord of sideALords) {
      console.log(
        `  H${lord.house.toString().padStart(2)}: ${lord.lord.padEnd(9)} in ${lord.lordNakshatra.name.padEnd(18)} | Mod: ${lord.lordModifier.toFixed(3)} (Init:${lord.lordNakshatra.initiative.padEnd(9)} Press:${lord.lordNakshatra.pressureResponse})`
      );
    }
    const sideATotal = sideALords.reduce((sum, l) => sum + l.lordModifier, 0);
    console.log(`\n  Total Nakshatra Bonus: +${sideATotal.toFixed(0)} points\n`);

    console.log("SIDE B (Mets) — Houses 4, 5, 7, 9, 12:\n");
    for (const lord of sideBLords) {
      console.log(
        `  H${lord.house.toString().padStart(2)}: ${lord.lord.padEnd(9)} in ${lord.lordNakshatra.name.padEnd(18)} | Bonus: ${lord.lordModifier.toFixed(0).padStart(2)} (Init:${lord.lordNakshatra.initiative.padEnd(9)} Press:${lord.lordNakshatra.pressureResponse})`
      );
    }
    const sideBTotal = sideBLords.reduce((sum, l) => sum + l.lordModifier, 0);
    console.log(`\n  Total Nakshatra Bonus: +${sideBTotal.toFixed(0)} points\n`);

    // ═══════════════════════════════════════════════════════════════
    // PART 4: CLUSTER SCORING BEFORE/AFTER
    // ═══════════════════════════════════════════════════════════════

    console.log("═".repeat(100));
    console.log("CLUSTER SCORING — Before vs After Nakshatra Modifier:");
    console.log("─".repeat(100) + "\n");

    const clusterOriginal = evaluateCluster(planets, ephResult.houses, game.favorite, game.underdog);

    // Calculate total nakshatra bonus for each side (sum of all lords' points)
    const sideABonus = sideALords.reduce((sum, l) => sum + l.lordModifier, 0);
    const sideBBonus = sideBLords.reduce((sum, l) => sum + l.lordModifier, 0);

    const sideAModified = clusterOriginal.sideAGrandTotal + sideABonus;
    const sideBModified = clusterOriginal.sideBGrandTotal + sideBBonus;

    console.log("BEFORE (Territorial Control only):");
    console.log(`  ${game.favorite.padEnd(20)} ${clusterOriginal.sideAGrandTotal.toFixed(0).padStart(8)}`);
    console.log(`  ${game.underdog.padEnd(20)} ${clusterOriginal.sideBGrandTotal.toFixed(0).padStart(8)}`);
    const predBefore = clusterOriginal.sideAGrandTotal > clusterOriginal.sideBGrandTotal ? game.favorite : clusterOriginal.sideBGrandTotal > clusterOriginal.sideAGrandTotal ? game.underdog : "Tie";
    console.log(`  Prediction: ${predBefore}\n`);

    console.log("AFTER (with Nakshatra Bonus Points):");
    console.log(`  ${game.favorite.padEnd(20)} ${sideAModified.toFixed(0).padStart(8)} (+ ${sideABonus.toFixed(0)} nakshatra)`);
    console.log(`  ${game.underdog.padEnd(20)} ${sideBModified.toFixed(0).padStart(8)} (+ ${sideBBonus.toFixed(0)} nakshatra)`);
    const predAfter = sideAModified > sideBModified ? game.favorite : sideBModified > sideAModified ? game.underdog : "Tie";
    console.log(`  Prediction: ${predAfter}\n`);

    console.log(`Flip: ${predBefore === predAfter ? "✓ Stable" : "⚠️ FLIPPED"}`);
    console.log(`Correct: ${predAfter === game.actualWinner ? "✓ YES" : "✗ NO"}\n`);
  }

  console.log("════════════════════════════════════════════════════════════════");
}

testNakshatraFullBreakdown();
