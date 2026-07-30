/**
 * NAKSHATRA VALIDATION TEST
 *
 * Re-run 4 validated games with nakshatra territorial modifier
 * Show BEFORE (original) vs AFTER (nakshatra-modified) predictions
 * Validate whether nakshatra adds signal or noise
 */

import { calculateChart } from "./ephemeris";
import { getNakshatraFromLongitude, calculateNakshatraModifier } from "./nakshatraData";
import { evaluateCluster } from "./houseClusterEngine";
import { SIGN_RULERS } from "./astroEngine";

interface GameTest {
  name: string;
  date: Date;
  location: { lat: number; lon: number };
  favorite: string;
  underdog: string;
  actualWinner: string;
  actualScore: string;
}

const games: GameTest[] = [
  {
    name: "Mets vs Phillies",
    date: new Date(Date.UTC(2026, 6, 16, 22, 30, 0)),
    location: { lat: 39.9526, lon: -75.1652 },
    favorite: "Phillies",
    underdog: "Mets",
    actualWinner: "Mets",
    actualScore: "3-0",
  },
  {
    name: "Red Sox vs Yankees",
    date: new Date(Date.UTC(2026, 6, 16, 23, 5, 0)),
    location: { lat: 42.3457, lon: -71.0979 },
    favorite: "Yankees",
    underdog: "Red Sox",
    actualWinner: "Red Sox",
    actualScore: "5-2",
  },
  {
    name: "Bayern Munich vs AC Milan",
    date: new Date(Date.UTC(2026, 6, 16, 19, 0, 0)),
    location: { lat: 48.2189, lon: 11.6241 },
    favorite: "Bayern Munich",
    underdog: "AC Milan",
    actualWinner: "AC Milan",
    actualScore: "2-1",
  },
  {
    name: "Brazil vs Argentina",
    date: new Date(Date.UTC(2026, 6, 17, 1, 0, 0)),
    location: { lat: -22.9122, lon: -43.2304 },
    favorite: "Brazil",
    underdog: "Argentina",
    actualWinner: "Argentina",
    actualScore: "1-0",
  },
];

async function testNakshatraValidation() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("NAKSHATRA VALIDATION TEST");
  console.log("Re-running 4 validated games with nakshatra modifier");
  console.log("════════════════════════════════════════════════════════════════\n");

  for (const game of games) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`GAME: ${game.name}`);
    console.log(`Result: ${game.actualWinner} won ${game.actualScore}`);
    console.log(`${"─".repeat(80)}\n`);

    const ephResult = await calculateChart(game.date, {
      latitude: game.location.lat,
      longitude: game.location.lon,
      altitude: 0,
    });

    const planets: Record<string, any> = {};
    ephResult.planets.forEach((p) => {
      planets[p.name] = p;
    });

    // ORIGINAL (no nakshatra)
    const clusterOriginal = evaluateCluster(planets, ephResult.houses, game.favorite, game.underdog);
    const predictionOriginal = clusterOriginal.sideAGrandTotal > clusterOriginal.sideBGrandTotal ? game.favorite : clusterOriginal.sideBGrandTotal > clusterOriginal.sideAGrandTotal ? game.underdog : "Tie";

    console.log("BEFORE (Territorial Control Only):");
    console.log(`  ${game.favorite.padEnd(20)} ${clusterOriginal.sideAGrandTotal.toFixed(1).padStart(6)}`);
    console.log(`  ${game.underdog.padEnd(20)} ${clusterOriginal.sideBGrandTotal.toFixed(1).padStart(6)}`);
    console.log(`  Prediction: ${predictionOriginal}`);
    console.log(`  Correct: ${(predictionOriginal === game.actualWinner ? "✓" : "✗")}\n`);

    // WITH NAKSHATRA BONUS POINTS (additive)
    console.log("AFTER (with Nakshatra Bonus Points):");

    // Calculate nakshatra bonus from key house lords
    const ZODIAC = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const SIDE_A = [1, 3, 6, 10, 11];
    const SIDE_B = [4, 5, 7, 9, 12];

    let sideABonus = 0;
    let sideBBonus = 0;

    for (let h = 1; h <= 12; h++) {
      const lon = ephResult.houses.cusps[h - 1]!;
      const signIdx = Math.floor(lon / 30);
      const sign = ZODIAC[signIdx] ?? "Aries";
      const lord = SIGN_RULERS[sign];
      const lordPlacement = planets[lord];

      if (!lordPlacement) continue;

      const lordNakshatra = getNakshatraFromLongitude(lordPlacement.eclipticLon);
      const lordModifier = calculateNakshatraModifier(lordNakshatra);

      if (SIDE_A.includes(h)) {
        sideABonus += lordModifier;
      } else if (SIDE_B.includes(h)) {
        sideBBonus += lordModifier;
      }
    }

    const sideAModified = clusterOriginal.sideAGrandTotal + sideABonus;
    const sideBModified = clusterOriginal.sideBGrandTotal + sideBBonus;
    const predictionModified = sideAModified > sideBModified ? game.favorite : sideBModified > sideAModified ? game.underdog : "Tie";

    console.log(`  ${game.favorite.padEnd(20)} ${sideAModified.toFixed(0).padStart(6)} (+ ${sideABonus.toFixed(0)} nakshatra)`);
    console.log(`  ${game.underdog.padEnd(20)} ${sideBModified.toFixed(0).padStart(6)} (+ ${sideBBonus.toFixed(0)} nakshatra)`);
    console.log(`  Prediction: ${predictionModified}`);
    console.log(`  Correct: ${(predictionModified === game.actualWinner ? "✓" : "✗")}`);

    const moonProfile = getNakshatraFromLongitude(planets.Moon.eclipticLon);
    const moonModifier = calculateNakshatraModifier(moonProfile);
    const marsProfile = getNakshatraFromLongitude(planets.Mars.eclipticLon);
    const marsModifier = calculateNakshatraModifier(marsProfile);

    console.log(`\n  Moon (${moonProfile.name}): ${moonModifier.toFixed(0)} points`);
    console.log(`  Mars (${marsProfile.name}): ${marsModifier.toFixed(0)} points`);

    // Flip detection
    if (predictionOriginal !== predictionModified) {
      console.log(`\n  ⚠️  PREDICTION FLIPPED: ${predictionOriginal} → ${predictionModified}`);
    } else {
      console.log(`\n  ✓ Prediction stable`);
    }
  }

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("TEST COMPLETE");
  console.log("════════════════════════════════════════════════════════════════");
}

testNakshatraValidation();
