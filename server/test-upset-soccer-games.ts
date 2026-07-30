/**
 * TEST: Comprehensive Scoring on Football (Soccer) Upsets
 * July 16-17, 2026
 */

import { calculateChart } from "./ephemeris";
import { calculateComprehensiveScore, formatComprehensiveScore } from "./comprehensiveScoringEngine";
import { evaluateCluster } from "./houseClusterEngine";

interface GameTest {
  name: string;
  favorite: string;
  underdog: string;
  date: Date;
  location: { name: string; lat: number; lon: number };
  result: string;
  actualWinner: string;
}

const games: GameTest[] = [
  {
    name: "Champions League Qualifier: Bayern Munich vs AC Milan",
    favorite: "Bayern Munich",
    underdog: "AC Milan",
    date: new Date(Date.UTC(2026, 6, 16, 19, 0, 0)), // 7 PM UTC = 9 PM CEST (Munich)
    location: { name: "Allianz Arena, Munich, Germany", lat: 48.2189, lon: 11.6241 },
    result: "2-1 Milan (UPSET)",
    actualWinner: "AC Milan",
  },
  {
    name: "Copa América Final Preview: Argentina vs Brazil",
    favorite: "Brazil",
    underdog: "Argentina",
    date: new Date(Date.UTC(2026, 6, 17, 1, 0, 0)), // 1 AM UTC July 17 = 8 PM July 16 Rio time
    location: { name: "Maracanã Stadium, Rio de Janeiro, Brazil", lat: -22.9122, lon: -43.2304 },
    result: "1-0 Argentina (UPSET)",
    actualWinner: "Argentina",
  },
];

async function testSoccerUpsets() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("FOOTBALL (SOCCER) UPSET TESTS");
  console.log("════════════════════════════════════════════════════════════════\n");

  for (const game of games) {
    console.log("─".repeat(80));
    console.log(`\n${game.name}`);
    console.log(`Favorite: ${game.favorite} | Underdog: ${game.underdog}`);
    console.log(`Location: ${game.location.name}`);
    console.log(`Result: ${game.result}\n`);

    const ephResult = await calculateChart(game.date, {
      latitude: game.location.lat,
      longitude: game.location.lon,
      altitude: 0,
    });

    const planetsArray = ephResult.planets;
    const houses = ephResult.houses;

    const planets: Record<string, any> = {};
    planetsArray.forEach((p) => {
      planets[p.name] = p;
    });

    // Show chart snapshot
    console.log("Chart positions:");
    console.log(
      `  Sun: ${planetsArray.find((p) => p.name === "Sun")?.sign} H${planetsArray.find((p) => p.name === "Sun")?.house}`
    );
    console.log(
      `  Moon: ${planetsArray.find((p) => p.name === "Moon")?.sign} H${planetsArray.find((p) => p.name === "Moon")?.house}`
    );
    console.log(
      `  Mercury: ${planetsArray.find((p) => p.name === "Mercury")?.sign} ${planetsArray.find((p) => p.name === "Mercury")?.retrograde ? "Rx" : ""} H${planetsArray.find((p) => p.name === "Mercury")?.house}`
    );
    console.log("");

    // Run cluster engine
    const clusterResult = evaluateCluster(planets, houses, game.favorite, game.underdog);

    // Run comprehensive scoring
    const comprehensiveResult = calculateComprehensiveScore(
      planetsArray,
      clusterResult.sideATotal,
      clusterResult.sideBTotal,
      clusterResult.sideATerritorial,
      clusterResult.sideBTerritorial
    );

    // Show results
    console.log("Comprehensive Scoring Results:");
    console.log(`  ${game.favorite.padEnd(20)} ${comprehensiveResult.layers[0].sideA > 0 ? "+" : ""}${comprehensiveResult.layers[0].sideA}`);
    for (let i = 1; i < comprehensiveResult.layers.length; i++) {
      console.log(
        `  ${" ".repeat(20)} ${comprehensiveResult.layers[i].sideA > 0 ? "+" : ""}${comprehensiveResult.layers[i].sideA} ${comprehensiveResult.layers[i].layer}`
      );
    }
    console.log(`  TOTAL: ${comprehensiveResult.sideAGrandTotal > 0 ? "+" : ""}${comprehensiveResult.sideAGrandTotal}\n`);

    console.log(`  ${game.underdog.padEnd(20)} ${comprehensiveResult.layers[0].sideB > 0 ? "+" : ""}${comprehensiveResult.layers[0].sideB}`);
    for (let i = 1; i < comprehensiveResult.layers.length; i++) {
      console.log(
        `  ${" ".repeat(20)} ${comprehensiveResult.layers[i].sideB > 0 ? "+" : ""}${comprehensiveResult.layers[i].sideB} ${comprehensiveResult.layers[i].layer}`
      );
    }
    console.log(`  TOTAL: ${comprehensiveResult.sideBGrandTotal > 0 ? "+" : ""}${comprehensiveResult.sideBGrandTotal}\n`);

    // Check prediction
    const predicted = comprehensiveResult.prediction;
    const correct = (predicted === "Side A" && game.actualWinner === game.favorite) ||
                    (predicted === "Side B" && game.actualWinner === game.underdog);

    console.log(`Margin: ${comprehensiveResult.margin} points`);
    console.log(`Predicted: ${predicted}`);
    console.log(`Actual: ${game.actualWinner} (${game.result})`);
    console.log(`Result: ${correct ? "✓ CORRECT" : "✗ WRONG"}\n`);
  }

  console.log("─".repeat(80));
  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("SUMMARY");
  console.log("════════════════════════════════════════════════════════════════");
}

testSoccerUpsets();
