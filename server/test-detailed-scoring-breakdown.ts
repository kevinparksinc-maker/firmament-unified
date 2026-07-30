/**
 * DETAILED SCORING AUDIT
 * Shows exactly what's being detected and scored for each side
 * Mets vs Phillies, July 16, 2026, Philadelphia
 */

import { calculateChart } from "./ephemeris";
import { detectFixedStars } from "./fixedStarDetection";
import { buildSportsHoraryChartViaLLM } from "./sportsHoraryReading";
import { evaluateCluster } from "./houseClusterEngine";
import {
  EXALTATIONS,
  DEBILITATIONS,
  SIGN_RULERS,
  SIGN_ORDER,
} from "./astroEngine";
import {
  DIGNITY_POINTS,
  SIDE_A_HOUSES,
  SIDE_B_HOUSES,
} from "./houseScoringConstants";
import type { PlanetPosition } from "./ephemeris";

async function auditScoring() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("DETAILED SCORING AUDIT — Mets vs Phillies");
  console.log("════════════════════════════════════════════════════════════════\n");

  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = {
    latitude: 39.9526,
    longitude: -75.1652,
    altitude: 0,
  };

  const result = await calculateChart(date, observer);
  const planetsArray = result.planets;
  const houseCusps = result.houses;

  // Convert planets to object for analysis
  const planets: Record<string, any> = {};
  planetsArray.forEach((p: any) => {
    planets[p.name] = p;
  });

  // Build chart via LLM
  const chartFacts = await buildSportsHoraryChartViaLLM(planets, "Phillies", "Mets");

  console.log("CHART CONTEXT:");
  console.log("  Favorite (L1): Phillies");
  console.log("  Challenger (L7): Mets");
  console.log("  Location: Philadelphia (home field advantage for Phillies)");
  console.log("  Record: Phillies 54-43 (better) vs Mets 40-57\n");

  // FIXED STARS
  console.log("════════════════════════════════════════════════════════════════");
  console.log("FIXED STARS DETECTED");
  console.log("════════════════════════════════════════════════════════════════\n");

  const stars = detectFixedStars(planetsArray);
  if (stars.length > 0) {
    stars.forEach((s) => {
      console.log(`  ${s.planet} ✦ ${s.name}`);
      console.log(`    Orb: ±${s.orb.toFixed(1)}°`);
      console.log(`    Nature: ${s.nature} → "${s.meaning}"`);
      console.log(`    House: ${planets[s.planet]?.house || "?"}${s.planet.includes("Node") ? " (axis)" : ""}`);
      console.log("");
    });
  }

  // LORD ANALYSIS
  console.log("════════════════════════════════════════════════════════════════");
  console.log("LORD ANALYSIS");
  console.log("════════════════════════════════════════════════════════════════\n");

  const ascSign = Object.entries(SIGN_RULERS).find(
    ([sign, ruler]) =>
      ruler === "Sun" && Math.abs(houseCusps.ascendant - SIGN_ORDER.indexOf(sign) * 30) < 30
  )?.[0];

  console.log("PHILLIES (L1 = Lord of Ascendant):");
  const l1Planet = planets[chartFacts?.l1?.planet || "Mercury"] || planets.Mercury;
  if (l1Planet) {
    console.log(`  Planet: ${l1Planet.name}`);
    console.log(`  Position: ${l1Planet.sign} ${l1Planet.degreeInSign.toFixed(1)}°, House ${l1Planet.house}`);
    console.log(`  Retrograde: ${l1Planet.retrograde ? "YES (WEAKNESS)" : "No"}`);

    // Dignity check
    const l1Dignity =
      EXALTATIONS[l1Planet.name] === l1Planet.sign
        ? "exalted"
        : DEBILITATIONS[l1Planet.name] === l1Planet.sign
          ? "fall"
          : SIGN_RULERS[l1Planet.sign] === l1Planet.name
            ? "own"
            : "peregrine";
    console.log(`  Dignity: ${l1Dignity}`);
    if (l1Dignity === "peregrine") {
      console.log(`    → PEREGRINE = ZERO essential dignity = WEAK`);
    }
  }
  console.log("");

  console.log("METS (L7 = Lord of Descendant):");
  const l7Planet = planets[chartFacts?.l7?.planet || "Saturn"] || planets.Saturn;
  if (l7Planet) {
    console.log(`  Planet: ${l7Planet.name}`);
    console.log(`  Position: ${l7Planet.sign} ${l7Planet.degreeInSign.toFixed(1)}°, House ${l7Planet.house}`);
    console.log(`  Retrograde: ${l7Planet.retrograde ? "YES" : "No"}`);

    const l7Dignity =
      EXALTATIONS[l7Planet.name] === l7Planet.sign
        ? "exalted"
        : DEBILITATIONS[l7Planet.name] === l7Planet.sign
          ? "fall"
          : SIGN_RULERS[l7Planet.sign] === l7Planet.name
            ? "own"
            : "peregrine";
    console.log(`  Dignity: ${l7Dignity}`);
  }
  console.log("");

  // HOUSE CLUSTER ANALYSIS
  console.log("════════════════════════════════════════════════════════════════");
  console.log("HOUSE CLUSTER SCORING");
  console.log("════════════════════════════════════════════════════════════════\n");

  const clusterResult = evaluateCluster(planets, houseCusps, "Phillies", "Mets");

  console.log("PHILLIES (H1, H3, H6, H10, H11):");
  clusterResult.sideAHouses.forEach((h) => {
    console.log(`  H${h.houseNumber}: ${h.lordPlanet} (in ${h.lordSign}, H${h.lordHouse})`);
    console.log(`    Dignity: ${h.dignityStatus} (${h.dignityPoints > 0 ? "+" : ""}${h.dignityPoints})`);
    console.log(`    Combustion: ${h.combustPoints > 0 ? "+" : ""}${h.combustPoints}`);
    console.log(`    Retrograde: ${h.retrogradePoints > 0 ? "+" : ""}${h.retrogradePoints}`);
    console.log(`    Placement: ${h.placementStatus} (${h.placementPoints > 0 ? "+" : ""}${h.placementPoints})`);
    console.log(`    Aspects: ${h.aspectPoints > 0 ? "+" : ""}${h.aspectPoints}`);
    console.log(`    SUBTOTAL: ${h.totalPoints > 0 ? "+" : ""}${h.totalPoints}`);
    console.log("");
  });
  console.log(`PHILLIES TOTAL: ${clusterResult.sideATotal > 0 ? "+" : ""}${clusterResult.sideATotal}\n`);

  console.log("METS (H4, H5, H7, H9, H12):");
  clusterResult.sideBHouses.forEach((h) => {
    console.log(`  H${h.houseNumber}: ${h.lordPlanet} (in ${h.lordSign}, H${h.lordHouse})`);
    console.log(`    Dignity: ${h.dignityStatus} (${h.dignityPoints > 0 ? "+" : ""}${h.dignityPoints})`);
    console.log(`    Combustion: ${h.combustPoints > 0 ? "+" : ""}${h.combustPoints}`);
    console.log(`    Retrograde: ${h.retrogradePoints > 0 ? "+" : ""}${h.retrogradePoints}`);
    console.log(`    Placement: ${h.placementStatus} (${h.placementPoints > 0 ? "+" : ""}${h.placementPoints})`);
    console.log(`    Aspects: ${h.aspectPoints > 0 ? "+" : ""}${h.aspectPoints}`);
    console.log(`    SUBTOTAL: ${h.totalPoints > 0 ? "+" : ""}${h.totalPoints}`);
    console.log("");
  });
  console.log(`METS TOTAL: ${clusterResult.sideBTotal > 0 ? "+" : ""}${clusterResult.sideBTotal}\n`);

  // SUMMARY
  console.log("════════════════════════════════════════════════════════════════");
  console.log("SCORING SUMMARY");
  console.log("════════════════════════════════════════════════════════════════\n");

  console.log(`Phillies:  ${clusterResult.sideATotal > 0 ? "+" : ""}${clusterResult.sideATotal}`);
  console.log(`Mets:      ${clusterResult.sideBTotal > 0 ? "+" : ""}${clusterResult.sideBTotal}`);
  console.log(`Margin:    ${clusterResult.margin} (prediction: ${clusterResult.prediction})\n`);

  console.log("WHAT'S MISSING:");
  console.log("  ☐ Fixed star weight in scoring (Mars/Sirius = +vigor for Mets)");
  console.log("  ☐ L1 retrograde penalty (Mercury Rx = vulnerability for Phillies)");
  console.log("  ☐ Strong L7 placement bonus (Mercury in H7 = strength for Mets)");
  console.log("  ☐ Home field / record advantage baseline (Phillies should start higher)\n");

  console.log("ACTUAL RESULT: Mets 3-0 (UPSET)");
  console.log("════════════════════════════════════════════════════════════════");
}

auditScoring();
