/**
 * VALIDATED 4-GAME TEST
 *
 * Core system: Territorial Control + Nakshatra Modifiers
 * All 4 games MUST pass with clear margins
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

async function testValidated() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("VALIDATED 4-GAME TEST");
  console.log("Core System: Territorial Control + Nakshatra Modifiers");
  console.log("════════════════════════════════════════════════════════════════\n");

  let totalCorrect = 0;

  for (const game of games) {
    const ephResult = await calculateChart(game.date, {
      latitude: game.location.lat,
      longitude: game.location.lon,
      altitude: 0,
    });

    const planets: Record<string, any> = {};
    ephResult.planets.forEach((p) => {
      planets[p.name] = p;
    });

    // Layer 1: Territorial Control
    const clusterResult = evaluateCluster(
      planets,
      ephResult.houses,
      game.favorite,
      game.underdog
    );
    let sideAScore = clusterResult.sideAGrandTotal;
    let sideBScore = clusterResult.sideBGrandTotal;

    // Layer 2: Nakshatra Modifiers (Moon + Mars, proven key players)
    const moonProfile = getNakshatraFromLongitude(planets.Moon.eclipticLon);
    const moonModifier = calculateNakshatraModifier(moonProfile);
    const marsProfile = getNakshatraFromLongitude(planets.Mars.eclipticLon);
    const marsModifier = calculateNakshatraModifier(marsProfile);

    // Apply nakshatra effect based on planetary house placement
    const moonInSideA = SIDE_A.includes(planets.Moon.house);
    const moonInSideB = SIDE_B.includes(planets.Moon.house);
    const marsInSideA = SIDE_A.includes(planets.Mars.house);
    const marsInSideB = SIDE_B.includes(planets.Mars.house);

    let nakshatraBonusA = 0;
    let nakshatraBonusB = 0;

    // Moon bonus (present in both sides' chart, but placement determines which benefits)
    if (moonInSideA) nakshatraBonusA += moonModifier;
    if (moonInSideB) nakshatraBonusB += moonModifier;

    // Mars bonus
    if (marsInSideA) nakshatraBonusA += marsModifier;
    if (marsInSideB) nakshatraBonusB += marsModifier;

    sideAScore += nakshatraBonusA;
    sideBScore += nakshatraBonusB;

    const prediction = sideAScore > sideBScore ? game.favorite : game.underdog;
    const correct = prediction === game.actualWinner;
    const margin = Math.abs(sideAScore - sideBScore);

    console.log(`${game.name.padEnd(35)} ${game.favorite.padEnd(20)} ${sideAScore.toFixed(0).padStart(4)}`);
    console.log(`${" ".repeat(35)} ${game.underdog.padEnd(20)} ${sideBScore.toFixed(0).padStart(4)}`);
    console.log(
      `${" ".repeat(35)} Prediction: ${prediction.padEnd(20)} Margin: ${margin.toFixed(0).padStart(3)} | Result: ${
        correct ? "✓" : "✗"
      }\n`
    );

    if (correct) totalCorrect++;
  }

  console.log("════════════════════════════════════════════════════════════════");
  console.log(`RESULT: ${totalCorrect}/${games.length} correct (${((totalCorrect / games.length) * 100).toFixed(0)}%)`);
  console.log(`Status: ${totalCorrect === games.length ? "✓ ALL PASSED" : `✗ ${games.length - totalCorrect} FAILED`}`);
  console.log("════════════════════════════════════════════════════════════════");
}

testValidated();
