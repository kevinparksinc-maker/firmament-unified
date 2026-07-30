/**
 * BLIND TEST: Doha Tennis Match
 * February 19, 2026, 8:15 PM AST (19:15 UTC)
 * Khalifa International Tennis and Squash Complex, Doha, Qatar
 *
 * Full 5-house cluster model with explicit H6 (endurance) analysis.
 * No player names, seeding, or context — chart reading only.
 *
 * NOTE: Pay special attention to H6. Flag any mismatch between chart
 * (which houses look strong/weak) and expected seeding dynamics
 * (which player should be favored).
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS } from "./astroEngine";
import { getNakshatraAt } from "./nakshatra";
import { NAKSHATRAS, calculateNakshatraModifier } from "./nakshatraData";
import { SIDE_A_HOUSES, SIDE_B_HOUSES } from "./houseScoringConstants";

async function analyzeAthleteFullCluster(
  athleteLabel: string,
  athleteNumber: "1" | "2",
  date: Date,
  lat: number,
  lon: number
) {
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

  console.log(`\n${"─".repeat(80)}\n${athleteLabel}\n${"─".repeat(80)}\n`);

  const houseSet = athleteNumber === "1" ? SIDE_A_HOUSES : SIDE_B_HOUSES;
  const houseMap: Record<string, number> = {
    identity: athleteNumber === "1" ? 1 : 7,
    effort: athleteNumber === "1" ? 3 : 9,
    competition: athleteNumber === "1" ? 6 : 12,
    achievement: athleteNumber === "1" ? 10 : 4,
    fulfillment: athleteNumber === "1" ? 11 : 5,
  };

  interface HouseAnalysis {
    name: string;
    houseNumber: number;
    lord?: string;
    nakshatra?: string;
    pace?: string;
    style?: string;
    temperament?: string;
    initiative?: string;
    pressureResponse?: string;
    consistency?: string;
    finishingAbility?: string;
    modifier?: number;
    strength?: number;
    h6Alert?: string;
  }

  const analyses: HouseAnalysis[] = [];
  let totalStrength = 0;
  let h6Critical: string | null = null;

  for (const [houseName, houseNumber] of Object.entries(houseMap)) {
    const lord = houseLords.get(houseNumber);
    const placement = lord ? chart[lord] : null;

    const analysis: HouseAnalysis = {
      name: houseName.charAt(0).toUpperCase() + houseName.slice(1),
      houseNumber,
    };

    if (lord && placement) {
      const { nakshatra } = getNakshatraAt(placement.eclipticLon);
      const profile = NAKSHATRAS[nakshatra.name];
      const modifier = calculateNakshatraModifier(profile);

      analysis.lord = lord;
      analysis.nakshatra = nakshatra.name;
      analysis.pace = profile.pace;
      analysis.style = profile.style;
      analysis.temperament = profile.temperament;
      analysis.initiative = profile.initiative;
      analysis.pressureResponse = profile.pressureResponse;
      analysis.consistency = profile.consistency;
      analysis.finishingAbility = profile.finishingAbility;
      analysis.modifier = modifier;

      const initScore = profile.initiative === "Excellent" ? 3 : profile.initiative === "High" ? 2 : 1;
      const prScore = profile.pressureResponse === "Excellent" ? 3 : profile.pressureResponse === "High" ? 2 : 1;
      const finScore = profile.finishingAbility === "Excellent" ? 3 : profile.finishingAbility === "High" ? 2 : 1;
      analysis.strength = (initScore + prScore + finScore) * modifier;
      totalStrength += analysis.strength;

      // H6/H12 (competition/endurance) critical analysis
      if (houseName === "competition") {
        const alerts: string[] = [];
        if (profile.consistency === "Low") alerts.push("Low consistency");
        if (profile.pressureResponse === "Low") alerts.push("Low PR under sustained pressure");
        if (profile.finishingAbility === "Low") alerts.push("Low finishing ability");
        if (profile.pace === "Fast" && profile.temperament === "Volatile") alerts.push("Fast + Volatile = high variance");

        if (alerts.length > 0) {
          analysis.h6Alert = `⚠️  ENDURANCE RISK: ${alerts.join(" + ")}`;
          h6Critical = analysis.h6Alert;
        } else if (profile.consistency === "High" && profile.pressureResponse === "High") {
          analysis.h6Alert = `✓ STRONG ENDURANCE: High consistency + High PR`;
        }
      }

      console.log(
        `H${houseNumber} ${analysis.name.padEnd(12)} | ${lord.padEnd(10)} in ${nakshatra.name.padEnd(16)} | ${analysis.pace.padEnd(8)} ${analysis.style.padEnd(12)} ${analysis.temperament.padEnd(9)}`
      );
      console.log(
        `                        Init=${analysis.initiative.padEnd(9)} PR=${analysis.pressureResponse.padEnd(9)} Cons=${analysis.consistency.padEnd(9)} Fin=${analysis.finishingAbility}`
      );
      console.log(`                        Modifier: ${analysis.modifier?.toFixed(3)}x | Strength: ${analysis.strength?.toFixed(2)}`);
      if (analysis.h6Alert) {
        console.log(`                        ${analysis.h6Alert}`);
      }
      console.log("");
    }

    analyses.push(analysis);
  }

  console.log(`${"─".repeat(80)}`);
  console.log(`TOTAL CLUSTER STRENGTH: ${totalStrength.toFixed(2)}`);
  if (h6Critical) {
    console.log(`CRITICAL H6 SIGNAL: ${h6Critical}`);
  }
  console.log(`${"─".repeat(80)}\n`);

  return {
    label: athleteLabel,
    totalStrength,
    h6Alert: h6Critical,
    analyses,
  };
}

async function dohaBlindTest() {
  console.log("\n\n");
  console.log("╔════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                         BLIND TEST: DOHA TENNIS                            ║");
  console.log("║                                                                            ║");
  console.log("║  February 19, 2026, 8:15 PM local time (AST, UTC+3)                        ║");
  console.log("║  Khalifa International Tennis & Squash Complex, Doha, Qatar                ║");
  console.log("║                                                                            ║");
  console.log("║  Full 5-house cluster with explicit H6 (endurance) analysis.               ║");
  console.log("║  WATCH FOR: H6 mismatches vs expected seeding dynamics.                    ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════╝\n");

  const date = new Date(Date.UTC(2026, 1, 19, 19, 15, 0)); // Feb 19, 8:15 PM AST = 19:15 UTC

  const player1 = await analyzeAthleteFullCluster(
    "PLAYER 1 (H1 Athlete — Higher Seed / Expected Favorite)",
    "1",
    date,
    25.276,
    51.516
  );

  const player2 = await analyzeAthleteFullCluster(
    "PLAYER 2 (H7 Athlete — Lower Seed / Expected Underdog)",
    "2",
    date,
    25.276,
    51.516
  );

  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                          PREDICTION & ANALYSIS                             ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════╝\n");

  const p1Strength = player1.totalStrength;
  const p2Strength = player2.totalStrength;
  const margin = Math.abs(p1Strength - p2Strength);
  const marginPercent = (margin / Math.max(p1Strength, p2Strength)) * 100;

  console.log(`Player 1 cluster strength: ${p1Strength.toFixed(2)}`);
  if (player1.h6Alert) console.log(`  → ${player1.h6Alert}`);

  console.log(`\nPlayer 2 cluster strength: ${p2Strength.toFixed(2)}`);
  if (player2.h6Alert) console.log(`  → ${player2.h6Alert}`);

  console.log(`\nMargin: ${margin.toFixed(2)} points (${marginPercent.toFixed(1)}% separation)`);

  let prediction: string;
  let confidence: number;
  let rationale: string;

  if (margin < 1.0) {
    prediction = "50/50 / TOO CLOSE TO CALL";
    confidence = 50;
    rationale = "Essentially tied. Chart does not support seeding disparity — underdog getting value.";
  } else if (margin < 2.0) {
    const favored = p1Strength > p2Strength ? "Player 1" : "Player 2";
    confidence = 55 + margin * 5;
    prediction = `${favored}, but WEAK edge`;
    rationale = `Marginal advantage (${margin.toFixed(2)} points). Chart tighter than expected seeding gap.`;
  } else if (margin < 4.0) {
    const favored = p1Strength > p2Strength ? "Player 1" : "Player 2";
    confidence = 60 + margin * 5;
    prediction = `${favored}, MODERATE edge`;
    rationale = `Clear but not dominant advantage. Match likely competitive.`;
  } else {
    const favored = p1Strength > p2Strength ? "Player 1" : "Player 2";
    confidence = Math.min(85, 65 + margin * 3);
    prediction = `${favored}, STRONG edge`;
    rationale = `Significant structural advantage. Expect dominant performance.`;
  }

  console.log(`\n${"═".repeat(80)}`);
  console.log(`PREDICTION: ${prediction}`);
  console.log(`Confidence: ${confidence.toFixed(0)}%`);
  console.log(`Rationale: ${rationale}`);
  console.log(`${"═".repeat(80)}\n`);

  // H6 comparison specifically
  console.log("H6 (ENDURANCE/STAMINA) COMPARISON:");
  console.log("─────────────────────────────────");
  const p1h6 = player1.analyses.find((a) => a.name === "Competition");
  const p2h6 = player2.analyses.find((a) => a.name === "Competition");

  console.log(`Player 1 H6: ${p1h6?.strength?.toFixed(2)} strength${p1h6?.h6Alert ? ` — ${p1h6.h6Alert}` : ""}`);
  console.log(`Player 2 H6: ${p2h6?.strength?.toFixed(2)} strength${p2h6?.h6Alert ? ` — ${p2h6.h6Alert}` : ""}`);

  if (p1h6?.h6Alert?.includes("RISK") && !p2h6?.h6Alert?.includes("RISK")) {
    console.log(
      `\n⚠️  KEY SIGNAL: Player 1 shows endurance risk while Player 2 does not. This could explain underdog resilience.`
    );
  } else if (!p1h6?.h6Alert?.includes("RISK") && p2h6?.h6Alert?.includes("RISK")) {
    console.log(`\n✓ KEY SIGNAL: Player 1 shows endurance strength while Player 2 shows risk. Confirms favorite advantage.`);
  }

  console.log("\n\n");
  console.log("╔════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                      BLIND PREDICTION LOCKED                               ║");
  console.log("║                                                                            ║");
  console.log("║  Awaiting actual match result and player identities.                       ║");
  console.log("║  Ready to score: outcome prediction, mechanism description, H6 accuracy.   ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════╝\n");
}

dohaBlindTest().catch(console.error);
