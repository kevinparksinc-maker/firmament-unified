/**
 * Test: buildSportsHoraryChartViaLLM with real chart
 * Sports horary: Will the Lakers beat the Celtics?
 * Chart: Event time 7:30 PM, Los Angeles, 2024-06-18
 */

import { buildSportsHoraryChartViaLLM } from "./sportsHoraryReading";
import { calculateSportsHoraryV2, generateSportsHoraryV2Report } from "./sportsHoraryV2";
import { calculateCompositeScore } from "./sportsHorary";
import type { PlanetPlacement } from "./astroEngine";

// Real chart: Lakers vs Celtics, June 18, 2024, 7:30 PM PDT, Los Angeles
// Using actual ephemeris positions (sidereal/Fagan-Bradley)
const realChart: Record<string, PlanetPlacement> = {
  Sun: {
    planet: "Sun",
    degree: 27.5,
    sign: "Gemini",
    house: 9,
    rx: false,
    combust: false,
    cazimi: false,
    absolute: 87.5,
    raw: "Sun 27°30' Gemini",
    kind: "natal",
  },
  Moon: {
    planet: "Moon",
    degree: 8.2,
    sign: "Libra",
    house: 12,
    rx: false,
    combust: false,
    cazimi: false,
    absolute: 188.2,
    raw: "Moon 8°12' Libra",
    kind: "natal",
  },
  Mercury: {
    planet: "Mercury",
    degree: 15.1,
    sign: "Cancer",
    house: 10,
    rx: false,
    combust: false,
    cazimi: false,
    absolute: 105.1,
    raw: "Mercury 15°06' Cancer",
    kind: "natal",
  },
  Venus: {
    planet: "Venus",
    degree: 19.8,
    sign: "Gemini",
    house: 9,
    rx: false,
    combust: false,
    cazimi: false,
    absolute: 79.8,
    raw: "Venus 19°48' Gemini",
    kind: "natal",
  },
  Mars: {
    planet: "Mars",
    degree: 5.3,
    sign: "Aries",
    house: 6,
    rx: false,
    combust: false,
    cazimi: false,
    absolute: 5.3,
    raw: "Mars 5°18' Aries",
    kind: "natal",
  },
  Jupiter: {
    planet: "Jupiter",
    degree: 12.7,
    sign: "Gemini",
    house: 9,
    rx: false,
    combust: false,
    cazimi: false,
    absolute: 72.7,
    raw: "Jupiter 12°42' Gemini",
    kind: "natal",
  },
  Saturn: {
    planet: "Saturn",
    degree: 21.4,
    sign: "Pisces",
    house: 4,
    rx: false,
    combust: false,
    cazimi: false,
    absolute: 351.4,
    raw: "Saturn 21°24' Pisces",
    kind: "natal",
  },
  Rahu: {
    planet: "Rahu",
    degree: 3.6,
    sign: "Pisces",
    house: 4,
    rx: true,
    combust: false,
    cazimi: false,
    absolute: 333.6,
    raw: "Rahu 3°36' Pisces",
    kind: "natal",
  },
  Ketu: {
    planet: "Ketu",
    degree: 3.6,
    sign: "Virgo",
    house: 11,
    rx: true,
    combust: false,
    cazimi: false,
    absolute: 153.6,
    raw: "Ketu 3°36' Virgo",
    kind: "natal",
  },
};

async function testChartAdapter() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("TESTING CHART ADAPTER: buildSportsHoraryChartViaLLM");
  console.log("════════════════════════════════════════════════════════════════\n");

  console.log("QUESTION: Will the Lakers (Favorite) beat the Celtics (Challenger)?");
  console.log("CHART TIME: June 18, 2024, 7:30 PM PDT, Los Angeles\n");

  console.log("Raw chart placements:");
  Object.entries(realChart).forEach(([name, place]) => {
    const rx = place.rx ? " (rx)" : "";
    console.log(`  ${name.padEnd(10)} ${place.sign} ${place.degree.toFixed(1)}° H${place.house}${rx}`);
  });
  console.log("\n");

  try {
    console.log("→ Invoking Claude to analyze chart...\n");
    const chartFacts = await buildSportsHoraryChartViaLLM(
      realChart,
      "Lakers",
      "Celtics"
    );

    if (!chartFacts) {
      console.error("❌ Chart adapter returned null");
      return;
    }

    console.log("✓ Chart adapter completed\n");

    console.log("LORD FACTS:");
    console.log(`  L1 (Favorite): ${chartFacts.l1.planet} in ${chartFacts.l1.sign} H${chartFacts.l1.house} (${chartFacts.l1.dignity})`);
    console.log(`  L7 (Challenger): ${chartFacts.l7.planet} in ${chartFacts.l7.sign} H${chartFacts.l7.house} (${chartFacts.l7.dignity})`);
    console.log(`\n  Moon: H${chartFacts.moon.house} (${chartFacts.moon.phase})`);
    console.log(`  Ascendant degree: ${chartFacts.ascendantDegree}°`);
    console.log(`  Radical: ${chartFacts.voidOfCourseMoon === false ? "likely yes" : "questionable"}\n`);

    console.log("════════════════════════════════════════════════════════════════\n");

    console.log("→ Running 16-layer engine...\n");
    const v2Results = calculateSportsHoraryV2(chartFacts);
    const v2Report = generateSportsHoraryV2Report(v2Results, {
      favoriteTeam: "Lakers",
      challengerTeam: "Celtics",
    });

    console.log(v2Report);
    console.log("\n");

    console.log("════════════════════════════════════════════════════════════════\n");

    // Also run V1 for comparison
    const v1Score = calculateCompositeScore(chartFacts);
    console.log("V1 MASTER RULEBOOK (for comparison):");
    console.log(`  Score: ${v1Score.score}`);
    console.log(`  Verdict: ${v1Score.verdict}`);
    console.log(`  Flags: ${v1Score.flags.join(", ") || "(none)"}`);
    console.log(`\n  Breakdown:`);
    v1Score.breakdown.forEach(line => console.log(`    ${line}`));

  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
  }
}

testChartAdapter();
