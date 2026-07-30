/**
 * LIVE TEST: Brazil vs Norway
 * Quarterfinals, July 5, 2026, 4:00 PM EDT
 * MetLife Stadium, East Rutherford, New Jersey
 *
 * Brazil = Side A (Expected Favorite)
 * Norway = Side B (Expected Challenger)
 */

import { calculateChart } from "./ephemeris";
import { evaluateCluster, formatClusterReport } from "./houseClusterEngine";
import { SIGN_RULERS } from "./astroEngine";
import { getNakshatraAt } from "./nakshatra";
import { NAKSHATRAS, calculateNakshatraModifier } from "./nakshatraData";

async function testBrazilNorway() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("NAKSHATRA SPORTS PREDICTION TEST — PRE-REGISTRATION");
  console.log("Brazil vs Norway — Quarterfinals");
  console.log("July 5, 2026, 4:00 PM EDT, East Rutherford, NJ");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // MetLife Stadium coordinates
  const date = new Date(Date.UTC(2026, 6, 5, 20, 0, 0)); // 4:00 PM EDT = 20:00 UTC
  const observer = {
    latitude: 40.8135,
    longitude: -74.0745,
    altitude: 0,
  };

  const ephemerisResult = await calculateChart(date, observer);
  const planets = ephemerisResult.planets;
  const houses = ephemerisResult.houses;

  // Convert to object
  const chart: Record<string, any> = {};
  planets.forEach((p) => {
    chart[p.name] = p;
  });

  console.log("STEP 1: KEY PLANETARY POSITIONS & NAKSHATRAS\n");

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

  ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"].forEach((name) => {
    const p = chart[name];
    if (p) {
      const { nakshatra } = getNakshatraAt(p.eclipticLon);
      const profile = NAKSHATRAS[nakshatra.name];
      console.log(
        `${name.padEnd(10)} @ ${p.eclipticLon.toFixed(1)}° in ${p.sign.padEnd(9)} (H${p.house}) → ${nakshatra.name.padEnd(16)} [${profile.pace.padEnd(8)} / ${profile.temperament}]`
      );
    }
  });

  console.log("\n");
  console.log("STEP 2: HOUSE LORDS & EXECUTION PROFILES\n");

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

  const sideAHouses = [1, 3, 6, 10, 11];
  const sideBHouses = [7, 9, 12, 4, 5];

  console.log("BRAZIL (Side A) — House Lords:");
  console.log("─────────────────────────────");
  sideAHouses.forEach((h) => {
    const lord = houseLords.get(h);
    if (lord && chart[lord]) {
      const p = chart[lord];
      const { nakshatra } = getNakshatraAt(p.eclipticLon);
      const profile = NAKSHATRAS[nakshatra.name];
      const modifier = calculateNakshatraModifier(profile);
      console.log(
        `H${h.toString().padStart(2)} lord ${lord.padEnd(10)} (${nakshatra.name.padEnd(16)}) → mod ${modifier.toFixed(3)}x [${profile.pace.padEnd(8)} / ${profile.style.padEnd(12)} / Init:${profile.initiative.padEnd(9)} / Fin:${profile.finishingAbility}]`
      );
    }
  });

  console.log("\nNORWAY (Side B) — House Lords:");
  console.log("──────────────────────────────");
  sideBHouses.forEach((h) => {
    const lord = houseLords.get(h);
    if (lord && chart[lord]) {
      const p = chart[lord];
      const { nakshatra } = getNakshatraAt(p.eclipticLon);
      const profile = NAKSHATRAS[nakshatra.name];
      const modifier = calculateNakshatraModifier(profile);
      console.log(
        `H${h.toString().padStart(2)} lord ${lord.padEnd(10)} (${nakshatra.name.padEnd(16)}) → mod ${modifier.toFixed(3)}x [${profile.pace.padEnd(8)} / ${profile.style.padEnd(12)} / Init:${profile.initiative.padEnd(9)} / Fin:${profile.finishingAbility}]`
      );
    }
  });

  console.log("\n");
  console.log("STEP 3: FULL SCORING ANALYSIS\n");

  const result = evaluateCluster(chart, houses, "Brazil", "Norway");

  console.log(formatClusterReport(result, "Brazil", "Norway"));

  console.log("\n");
  console.log("STEP 4: PRE-REGISTERED BEHAVIORAL PREDICTIONS\n");

  const l1 = houseLords.get(1);
  const l7 = houseLords.get(7);
  const l10 = houseLords.get(10);
  const l4 = houseLords.get(4);
  const l6 = houseLords.get(6);
  const l12 = houseLords.get(12);

  console.log("IF BRAZIL WINS (as predicted):");
  if (l1 && chart[l1]) {
    const l1nak = getNakshatraAt(chart[l1].eclipticLon).nakshatra.name;
    const l1profile = NAKSHATRAS[l1nak];
    console.log(
      `  • Brazil's L1 (${l1nak}, ${l1profile.style} / ${l1profile.temperament}) will dictate the match through [specific mechanism based on traits]`
    );
  }
  if (l10 && chart[l10]) {
    const l10nak = getNakshatraAt(chart[l10].eclipticLon).nakshatra.name;
    const l10profile = NAKSHATRAS[l10nak];
    console.log(
      `  • Brazil's L10 (${l10nak}, ${l10profile.finishingAbility} finishing) will convert opportunities [expected conversion rate]`
    );
  }
  console.log(
    `  • Brazil's territorial advantage (${result.sideATerritorial > 0 ? "+" : ""}${result.sideATerritorial.toFixed(2)}) translates to dominance in possession/shots`
  );

  console.log("\nIF NORWAY UPSETS (alternative mechanism):");
  if (l7 && chart[l7]) {
    const l7nak = getNakshatraAt(chart[l7].eclipticLon).nakshatra.name;
    const l7profile = NAKSHATRAS[l7nak];
    console.log(
      `  • Norway's L7 (${l7nak}, ${l7profile.style} / ${l7profile.consistency}) defends against Brazil's attack with [specific trait advantage]`
    );
  }
  if (l12 && chart[l12]) {
    const l12nak = getNakshatraAt(chart[l12].eclipticLon).nakshatra.name;
    const l12profile = NAKSHATRAS[l12nak];
    console.log(
      `  • Norway's L12 (${l12nak}, ${l12profile.style}) creates dangerous hidden/counter opportunities [mechanism]`
    );
  }
  console.log(
    `  • [WATCH FOR: Does Norway's actual statistical dominance/weakness match territorial prediction? Does finishing explain the result or does narrative fail?]`
  );

  console.log("\n");
  console.log("PREDICTION:");
  console.log("──────────");

  const prediction = result.prediction;
  const confidence = result.confidence;
  const marginStr =
    result.sideAGrandTotal > result.sideBGrandTotal
      ? `+${(result.sideAGrandTotal - result.sideBGrandTotal).toFixed(1)}`
      : result.sideBGrandTotal > result.sideAGrandTotal
        ? `+${(result.sideBGrandTotal - result.sideAGrandTotal).toFixed(1)}`
        : "Tied";

  console.log(`${prediction === "Brazil" ? "BRAZIL" : "NORWAY"} favored`);
  console.log(`Confidence: ${confidence}%`);
  console.log(`Margin: ${marginStr} points`);
  console.log(`\n⚠️  NOTE: If this game goes to extra time or penalties, confidence should be treated as SUSPECT`);
  console.log(`    (Germany vs Paraguay went to penalties despite 93.75% prediction confidence)`);

  console.log("\n");
  console.log("CHART COORDINATES:");
  console.log("──────────────────");
  console.log(`Date: July 5, 2026, 4:00 PM EDT`);
  console.log(`Location: MetLife Stadium (40.8135°N, 74.0745°W)`);
  console.log(`Julian Date: ${date.toISOString()}`);
}

testBrazilNorway().catch(console.error);
