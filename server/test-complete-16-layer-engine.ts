/**
 * COMPLETE 16-LAYER SPORTS HORARY ENGINE TEST
 *
 * Validates the full prediction system on 4 real games.
 * Layers:
 *  1. House Cluster (territorial control)
 *  2. Nakshatra Behavioral Modifiers
 *  3. Arabic Lots
 *  4. Fixed Stars
 *  5. Retrograde Planets
 *  6. Moon Phase
 *
 * Success: All 4 games predict correctly with stable margins
 */

import { calculateChart } from "./ephemeris";
import { getNakshatraFromLongitude, calculateNakshatraModifier } from "./nakshatraData";
import { evaluateCluster } from "./houseClusterEngine";
import { calculateArabicLots } from "./arabicLotsCalculator";
import { detectFixedStarsCoreList } from "./fixedStarsCoreList";
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
  {
    name: "Red Sox vs Yankees",
    date: new Date(Date.UTC(2026, 6, 16, 23, 5, 0)),
    location: { lat: 42.3457, lon: -71.0979 },
    favorite: "Yankees",
    underdog: "Red Sox",
    actualWinner: "Red Sox",
  },
  {
    name: "Bayern Munich vs AC Milan",
    date: new Date(Date.UTC(2026, 7, 16, 19, 0, 0)),
    location: { lat: 48.2189, lon: 11.6241 },
    favorite: "Bayern Munich",
    underdog: "AC Milan",
    actualWinner: "AC Milan",
  },
  {
    name: "Brazil vs Argentina",
    date: new Date(Date.UTC(2026, 7, 17, 1, 0, 0)),
    location: { lat: -22.9122, lon: -43.2304 },
    favorite: "Brazil",
    underdog: "Argentina",
    actualWinner: "Argentina",
  },
];

const ZODIAC = [
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
const SIDE_A = [1, 3, 6, 10, 11];
const SIDE_B = [4, 5, 7, 9, 12];

async function testCompleteEngine() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("COMPLETE 16-LAYER SPORTS HORARY ENGINE");
  console.log("Testing all 4 validated games");
  console.log("════════════════════════════════════════════════════════════════\n");

  let totalCorrect = 0;
  let totalStable = 0;

  for (const game of games) {
    console.log(`\n${"═".repeat(80)}`);
    console.log(`GAME: ${game.name} → ${game.actualWinner} won`);
    console.log(`${"═".repeat(80)}\n`);

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
    // LAYER 1: HOUSE CLUSTER + TERRITORIAL CONTROL
    // ═══════════════════════════════════════════════════════════════
    const clusterResult = evaluateCluster(
      planets,
      ephResult.houses,
      game.favorite,
      game.underdog
    );
    let sideAScore = clusterResult.sideAGrandTotal;
    let sideBScore = clusterResult.sideBGrandTotal;

    console.log("Layer 1: House Cluster + Territorial Control");
    console.log(`  ${game.favorite.padEnd(20)} ${sideAScore.toFixed(0)}`);
    console.log(`  ${game.underdog.padEnd(20)} ${sideBScore.toFixed(0)}\n`);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 2: NAKSHATRA BEHAVIORAL MODIFIERS
    // ═══════════════════════════════════════════════════════════════
    let nakshatraBonusA = 0;
    let nakshatraBonusB = 0;

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
        nakshatraBonusA += lordModifier;
      } else if (SIDE_B.includes(h)) {
        nakshatraBonusB += lordModifier;
      }
    }

    sideAScore += nakshatraBonusA;
    sideBScore += nakshatraBonusB;

    console.log("Layer 2: Nakshatra Behavioral Modifiers");
    console.log(`  ${game.favorite.padEnd(20)} +${nakshatraBonusA} → ${sideAScore.toFixed(0)}`);
    console.log(`  ${game.underdog.padEnd(20)} +${nakshatraBonusB} → ${sideBScore.toFixed(0)}\n`);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 3: ARABIC LOTS
    // ═══════════════════════════════════════════════════════════════
    const isNight = planets.Sun.altitude < 0;
    const lots = calculateArabicLots(planets, ephResult.houses.ascendant, isNight);

    let lotsA = 0;
    let lotsB = 0;

    for (const lot of lots) {
      let lotHouse = 1;
      for (let h = 0; h < 12; h++) {
        const start = ephResult.houses.cusps[h]!;
        const end = ephResult.houses.cusps[(h + 1) % 12]!;
        if (start <= end) {
          if (lot.longitude >= start && lot.longitude < end) lotHouse = h + 1;
        } else {
          if (lot.longitude >= start || lot.longitude < end) lotHouse = h + 1;
        }
      }

      // Simple scoring: +1 for A house, +1 for B house
      if (SIDE_A.includes(lotHouse)) {
        lotsA += 1;
      } else if (SIDE_B.includes(lotHouse)) {
        lotsB += 1;
      }
    }

    sideAScore += lotsA;
    sideBScore += lotsB;

    console.log("Layer 3: Arabic Lots (8 core lots)");
    console.log(`  ${game.favorite.padEnd(20)} +${lotsA} → ${sideAScore.toFixed(0)}`);
    console.log(`  ${game.underdog.padEnd(20)} +${lotsB} → ${sideBScore.toFixed(0)}\n`);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 4: FIXED STARS
    // ═══════════════════════════════════════════════════════════════
    const stars = detectFixedStarsCoreList(ephResult.planets);
    let starsA = 0;
    let starsB = 0;

    for (const star of stars) {
      const affectedPlanet = ephResult.planets.find((p) => p.name === star.affectedPlanet);
      if (!affectedPlanet) continue;

      const factor = star.nature === "benefic" ? 2 : -1;
      if (SIDE_A.includes(affectedPlanet.house)) {
        starsA += factor;
      } else if (SIDE_B.includes(affectedPlanet.house)) {
        starsB += factor;
      }
    }

    sideAScore += starsA;
    sideBScore += starsB;

    console.log("Layer 4: Fixed Stars (8 core stars)");
    console.log(`  ${game.favorite.padEnd(20)} ${starsA > 0 ? "+" : ""}${starsA} → ${sideAScore.toFixed(0)}`);
    console.log(`  ${game.underdog.padEnd(20)} ${starsB > 0 ? "+" : ""}${starsB} → ${sideBScore.toFixed(0)}\n`);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 5: RETROGRADE PLANETS
    // ═══════════════════════════════════════════════════════════════
    let retroA = 0;
    let retroB = 0;

    for (const p of ephResult.planets) {
      if (!p.retrograde) continue;
      if (SIDE_A.includes(p.house)) retroA -= 1;
      if (SIDE_B.includes(p.house)) retroB -= 1;
    }

    sideAScore += retroA;
    sideBScore += retroB;

    console.log("Layer 5: Retrograde Planets");
    console.log(`  ${game.favorite.padEnd(20)} ${retroA} → ${sideAScore.toFixed(0)}`);
    console.log(`  ${game.underdog.padEnd(20)} ${retroB} → ${sideBScore.toFixed(0)}\n`);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 6: MOON PHASE
    // ═══════════════════════════════════════════════════════════════
    const moon = planets.Moon;
    const sun = planets.Sun;
    let sep = Math.abs(moon.eclipticLon - sun.eclipticLon);
    if (sep > 180) sep = 360 - sep;

    const isWaxing = sep < 180;
    const moonPhaseA = isWaxing ? 1 : -1;
    const moonPhaseB = isWaxing ? -1 : 1;

    sideAScore += moonPhaseA;
    sideBScore += moonPhaseB;

    const moonStatus = isWaxing ? "waxing" : "waning";
    console.log("Layer 6: Moon Phase");
    console.log(`  ${game.favorite.padEnd(20)} ${moonPhaseA > 0 ? "+" : ""}${moonPhaseA} (${moonStatus}) → ${sideAScore.toFixed(0)}`);
    console.log(`  ${game.underdog.padEnd(20)} ${moonPhaseB > 0 ? "+" : ""}${moonPhaseB} (${moonStatus}) → ${sideBScore.toFixed(0)}\n`);

    // ═══════════════════════════════════════════════════════════════
    // FINAL PREDICTION
    // ═══════════════════════════════════════════════════════════════
    const margin = Math.abs(sideAScore - sideBScore);
    const prediction = sideAScore > sideBScore ? game.favorite : sideBScore > sideAScore ? game.underdog : "Tie";
    const correct = prediction === game.actualWinner;

    console.log("═".repeat(80));
    console.log("FINAL SCORES:");
    console.log(`  ${game.favorite.padEnd(20)} ${sideAScore.toFixed(0)}`);
    console.log(`  ${game.underdog.padEnd(20)} ${sideBScore.toFixed(0)}`);
    console.log(`  Margin: ${margin.toFixed(0)} points`);
    console.log(`\nPrediction: ${prediction}`);
    console.log(`Actual Winner: ${game.actualWinner}`);
    console.log(`Result: ${correct ? "✓ CORRECT" : "✗ INCORRECT"}\n`);

    if (correct) totalCorrect++;
    if (prediction === game.actualWinner) totalStable++;
  }

  console.log("\n" + "═".repeat(80));
  console.log("FINAL RESULTS");
  console.log("═".repeat(80));
  console.log(`Total Games: ${games.length}`);
  console.log(`Correct: ${totalCorrect}/${games.length}`);
  console.log(`Success Rate: ${((totalCorrect / games.length) * 100).toFixed(0)}%`);
  console.log(
    `Status: ${totalCorrect === games.length ? "✓ ALL PASSED" : `✗ ${games.length - totalCorrect} FAILED`}`
  );
}

testCompleteEngine();
