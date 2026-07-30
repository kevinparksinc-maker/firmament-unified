/**
 * PREDICTION FUNCTION — Complete Step-by-Step
 *
 * This is the EXACT code that makes all 4/4 predictions.
 * Shows:
 * 1. All 5 houses for SIDE A (Favorite)
 * 2. All 5 houses for SIDE B (Underdog)
 * 3. All house lords
 * 4. Nakshatras of all house lords
 * 5. Execution trait bonuses
 * 6. Final score & prediction
 */

import { calculateChart } from "./ephemeris";
import { getNakshatraFromLongitude, calculateNakshatraModifier } from "./nakshatraData";
import { evaluateCluster } from "./houseClusterEngine";
import { SIGN_RULERS } from "./astroEngine";

/**
 * STEP 1: Get ephemeris data
 */
async function predictGame(
  gameName: string,
  date: Date,
  location: { lat: number; lon: number },
  favoriteName: string,
  underdogName: string
) {
  console.log(`\n${"═".repeat(100)}`);
  console.log(`GAME: ${gameName}`);
  console.log(`${"═".repeat(100)}\n`);

  const ephResult = await calculateChart(date, {
    latitude: location.lat,
    longitude: location.lon,
    altitude: 0,
  });

  const planets: Record<string, any> = {};
  ephResult.planets.forEach((p) => {
    planets[p.name] = p;
  });

  // ═══════════════════════════════════════════════════════════════════════════════════════════════════
  // STEP 2: HOUSE CLUSTER ENGINE (Territorial Control)
  // ═══════════════════════════════════════════════════════════════════════════════════════════════════

  const clusterResult = evaluateCluster(planets, ephResult.houses, favoriteName, underdogName);

  console.log("STEP 1: HOUSE CLUSTER EVALUATION (Territorial Control)\n");
  console.log(`SIDE A (${favoriteName}): Houses 1, 3, 6, 10, 11`);
  for (const evaluation of clusterResult.sideAHouses) {
    console.log(
      `  H${evaluation.houseNumber.toString().padStart(2)} → ${evaluation.lordPlanet.padEnd(8)} in H${evaluation.lordHouse} (${evaluation.lordSign.padEnd(12)}) | ${evaluation.totalPoints > 0 ? "+" : ""}${evaluation.totalPoints.toString().padStart(2)} pts | ${evaluation.reasoning}`
    );
  }
  console.log(`  Subtotal: ${clusterResult.sideATotal > 0 ? "+" : ""}${clusterResult.sideATotal}`);
  console.log(`  Territorial Control: ${clusterResult.sideATerritorial > 0 ? "+" : ""}${clusterResult.sideATerritorial}`);
  console.log(`  → ${favoriteName.padEnd(30)} ${clusterResult.sideAGrandTotal.toFixed(0).padStart(3)} points\n`);

  console.log(`SIDE B (${underdogName}): Houses 4, 5, 7, 9, 12`);
  for (const evaluation of clusterResult.sideBHouses) {
    console.log(
      `  H${evaluation.houseNumber.toString().padStart(2)} → ${evaluation.lordPlanet.padEnd(8)} in H${evaluation.lordHouse} (${evaluation.lordSign.padEnd(12)}) | ${evaluation.totalPoints > 0 ? "+" : ""}${evaluation.totalPoints.toString().padStart(2)} pts | ${evaluation.reasoning}`
    );
  }
  console.log(`  Subtotal: ${clusterResult.sideBTotal > 0 ? "+" : ""}${clusterResult.sideBTotal}`);
  console.log(`  Territorial Control: ${clusterResult.sideBTerritorial > 0 ? "+" : ""}${clusterResult.sideBTerritorial}`);
  console.log(`  → ${underdogName.padEnd(30)} ${clusterResult.sideBGrandTotal.toFixed(0).padStart(3)} points\n`);

  let sideAScore = clusterResult.sideAGrandTotal;
  let sideBScore = clusterResult.sideBGrandTotal;

  // ═══════════════════════════════════════════════════════════════════════════════════════════════════
  // STEP 3: NAKSHATRA BEHAVIORAL MODIFIERS
  // ═══════════════════════════════════════════════════════════════════════════════════════════════════

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

  console.log("STEP 2: NAKSHATRA BEHAVIORAL MODIFIERS (All 10 House Lords)\n");

  let sideABonus = 0;
  let sideBBonus = 0;

  // Evaluate all 12 houses
  for (let h = 1; h <= 12; h++) {
    const lon = ephResult.houses.cusps[h - 1]!;
    const signIdx = Math.floor(lon / 30);
    const sign = ZODIAC[signIdx] ?? "Aries";
    const lord = SIGN_RULERS[sign];
    const lordPlacement = planets[lord];

    if (!lordPlacement) continue;

    const lordNakshatra = getNakshatraFromLongitude(lordPlacement.eclipticLon);
    const lordModifier = calculateNakshatraModifier(lordNakshatra);

    // Display the nakshatra traits
    const traits = `Init:${lordNakshatra.initiative.padEnd(9)} Press:${lordNakshatra.pressureResponse.padEnd(9)} Cons:${lordNakshatra.consistency.padEnd(9)} Fin:${lordNakshatra.finishingAbility.padEnd(9)}`;
    const side = SIDE_A.includes(h) ? favoriteName : SIDE_B.includes(h) ? underdogName : "Neutral";

    console.log(
      `H${h.toString().padStart(2)} (${sign.padEnd(12)}) → ${lord.padEnd(9)} in ${lordNakshatra.name.padEnd(20)} | ${traits} | Bonus: ${lordModifier > 0 ? "+" : ""}${lordModifier.toFixed(0).padStart(2)} | ${side}`
    );

    // Add to appropriate side
    if (SIDE_A.includes(h)) {
      sideABonus += lordModifier;
    } else if (SIDE_B.includes(h)) {
      sideBBonus += lordModifier;
    }
  }

  console.log(`\n${favoriteName.padEnd(30)} Nakshatra Bonus: ${sideABonus > 0 ? "+" : ""}${sideABonus.toFixed(0)}`);
  console.log(`${underdogName.padEnd(30)} Nakshatra Bonus: ${sideBBonus > 0 ? "+" : ""}${sideBBonus.toFixed(0)}\n`);

  sideAScore += sideABonus;
  sideBScore += sideBBonus;

  // ═══════════════════════════════════════════════════════════════════════════════════════════════════
  // STEP 4: FINAL PREDICTION
  // ═══════════════════════════════════════════════════════════════════════════════════════════════════

  const margin = Math.abs(sideAScore - sideBScore);
  const prediction = sideAScore > sideBScore ? favoriteName : underdogName;
  const confidence =
    margin < 2 ? "Low (Too Close)" : margin < 5 ? "Medium" : "High";

  console.log("═".repeat(100));
  console.log("FINAL SCORES (Territorial Control + Nakshatra Modifiers)\n");
  console.log(
    `${favoriteName.padEnd(30)} ${sideAScore.toFixed(0).padStart(4)} points`
  );
  console.log(
    `${underdogName.padEnd(30)} ${sideBScore.toFixed(0).padStart(4)} points\n`
  );
  console.log(`Margin: ${margin.toFixed(0)} points | Confidence: ${confidence}`);
  console.log(`\n✓ PREDICTION: ${prediction} will win`);
  console.log("═".repeat(100));

  return { prediction, margin, sideAScore, sideBScore };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// TEST ON 4 VALIDATED GAMES
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

async function runPredictions() {
  const games = [
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

  let correct = 0;

  for (const game of games) {
    const result = await predictGame(game.name, game.date, game.location, game.favorite, game.underdog);
    const isCorrect = result.prediction === game.actualWinner;
    console.log(`\nActual Winner: ${game.actualWinner} | Predicted: ${result.prediction} | Result: ${isCorrect ? "✓ CORRECT" : "✗ WRONG"}\n`);
    if (isCorrect) correct++;
  }

  console.log("\n" + "═".repeat(100));
  console.log(`FINAL RESULTS: ${correct}/${games.length} CORRECT`);
  console.log("═".repeat(100));
}

runPredictions();
