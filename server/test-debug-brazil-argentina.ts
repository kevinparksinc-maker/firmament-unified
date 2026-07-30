/**
 * DEBUG: Brazil vs Argentina Game Analysis
 *
 * Why is Argentina (currently -17) winning against Brazil (+6)?
 * Full breakdown of all houses, lords, and nakshatra traits
 */

import { calculateChart } from "./ephemeris";
import { getNakshatraFromLongitude, calculateNakshatraModifier, NAKSHATRAS } from "./nakshatraData";
import { evaluateCluster } from "./houseClusterEngine";
import { SIGN_RULERS } from "./astroEngine";

const game = {
  name: "Brazil vs Argentina",
  date: new Date(Date.UTC(2026, 7, 17, 1, 0, 0)),
  location: { lat: -22.9122, lon: -43.2304 },
  favorite: "Brazil",
  underdog: "Argentina",
  actualWinner: "Argentina",
};

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

async function debug() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("DEBUG: Brazil vs Argentina");
  console.log("════════════════════════════════════════════════════════════════\n");

  const ephResult = await calculateChart(game.date, {
    latitude: game.location.lat,
    longitude: game.location.lon,
    altitude: 0,
  });

  const planets: Record<string, any> = {};
  ephResult.planets.forEach((p) => {
    planets[p.name] = p;
  });

  // Get cluster result
  const clusterResult = evaluateCluster(planets, ephResult.houses, game.favorite, game.underdog);

  console.log("TERRITORIAL CONTROL ONLY:");
  console.log(`  ${game.favorite.padEnd(20)} ${clusterResult.sideAGrandTotal.toFixed(0)}`);
  console.log(`  ${game.underdog.padEnd(20)} ${clusterResult.sideBGrandTotal.toFixed(0)}\n`);

  // House-by-house analysis
  console.log("HOUSE-BY-HOUSE ANALYSIS:");
  console.log("─".repeat(100) + "\n");

  for (let h = 1; h <= 12; h++) {
    const lon = ephResult.houses.cusps[h - 1]!;
    const signIdx = Math.floor(lon / 30);
    const sign = ZODIAC[signIdx] ?? "Aries";
    const lord = SIGN_RULERS[sign];
    const lordPlacement = planets[lord];

    if (!lordPlacement) continue;

    const lordNakshatra = getNakshatraFromLongitude(lordPlacement.eclipticLon);
    const modifier = calculateNakshatraModifier(lordNakshatra);
    const side = SIDE_A.includes(h) ? "Brazil" : SIDE_B.includes(h) ? "Argentina" : "Neutral";

    console.log(`H${h.toString().padStart(2)} (${sign.padEnd(12)}) → ${lord.padEnd(9)} in H${lordPlacement.house}`);
    console.log(
      `    Nakshatra: ${lordNakshatra.name.padEnd(20)} | Traits: Init=${lordNakshatra.initiative.padEnd(9)} Press=${lordNakshatra.pressureResponse.padEnd(9)} Cons=${lordNakshatra.consistency.padEnd(9)} Fin=${lordNakshatra.finishingAbility.padEnd(9)}`
    );
    console.log(`    Modifier: ${modifier.toFixed(0).padStart(2)} points | Side: ${side}\n`);
  }

  // Calculate nakshatra bonus
  let bonusA = 0;
  let bonusB = 0;

  for (let h = 1; h <= 12; h++) {
    const lon = ephResult.houses.cusps[h - 1]!;
    const signIdx = Math.floor(lon / 30);
    const sign = ZODIAC[signIdx] ?? "Aries";
    const lord = SIGN_RULERS[sign];
    const lordPlacement = planets[lord];

    if (!lordPlacement) continue;

    const lordNakshatra = getNakshatraFromLongitude(lordPlacement.eclipticLon);
    const modifier = calculateNakshatraModifier(lordNakshatra);

    if (SIDE_A.includes(h)) {
      bonusA += modifier;
    } else if (SIDE_B.includes(h)) {
      bonusB += modifier;
    }
  }

  console.log("════════════════════════════════════════════════════════════════");
  console.log("SUMMARY:");
  console.log(`  Brazil (Side A):    Territorial ${clusterResult.sideAGrandTotal.toFixed(0).padStart(3)} + Nakshatra ${bonusA.toFixed(0).padStart(2)} = ${(clusterResult.sideAGrandTotal + bonusA).toFixed(0).padStart(3)}`);
  console.log(`  Argentina (Side B): Territorial ${clusterResult.sideBGrandTotal.toFixed(0).padStart(3)} + Nakshatra ${bonusB.toFixed(0).padStart(2)} = ${(clusterResult.sideBGrandTotal + bonusB).toFixed(0).padStart(3)}`);
  console.log(`\nPrediction: ${clusterResult.sideAGrandTotal + bonusA > clusterResult.sideBGrandTotal + bonusB ? "Brazil" : "Argentina"}`);
  console.log(`Actual Winner: ${game.actualWinner}`);
  console.log("════════════════════════════════════════════════════════════════");
}

debug();
