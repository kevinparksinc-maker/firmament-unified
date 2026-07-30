/**
 * FULL HOUSE EVALUATION
 *
 * All 12 houses evaluated independently.
 * For EACH house:
 * - House lord (ruler)
 * - Lord's dignity
 * - Lord's territory
 * - Planets IN the house (strength of the house itself)
 * - Aspects TO the house cusp
 * - Aspects FROM the house lord
 *
 * Then assign each house to Side A or Side B.
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS, EXALTATIONS, DEBILITATIONS } from "./astroEngine";
import { ASPECT_ORBS, BENEFIC_PLANETS, MALEFIC_PLANETS } from "./houseScoringConstants";
import type { PlanetPosition } from "./ephemeris";

interface HouseFullEval {
  house: number;
  sign: string;
  lord: string;
  lordDignity: string;
  lordPosition: string;
  lordTerritory: string;
  planetsInHouse: string[];
  aspectsToLord: Array<{ planet: string; type: string; orb: number }>;
  lordScore: number;
  houseScore: number;
  totalScore: number;
  side: "A" | "B";
}

async function fullHouseEvaluation() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("FULL HOUSE EVALUATION — All 12 Houses, All Aspects");
  console.log("════════════════════════════════════════════════════════════════\n");

  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = { latitude: 39.9526, longitude: -75.1652, altitude: 0 };

  const ephResult = await calculateChart(date, observer);
  const planetsArray = ephResult.planets;
  const houses = ephResult.houses;

  const planets: Record<string, PlanetPosition> = {};
  planetsArray.forEach((p) => {
    planets[p.name] = p;
  });

  const ZODIAC = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];
  const SIDE_A = [1, 3, 6, 10, 11];
  const SIDE_B = [4, 5, 7, 9, 12];
  const ANGULAR = [1, 4, 7, 10];
  const SUCCEDENT = [2, 5, 8, 11];
  const CADENT = [3, 6, 9, 12];

  const houseEvals: HouseFullEval[] = [];

  // Evaluate each house
  for (let h = 1; h <= 12; h++) {
    const lon = houses.cusps[h - 1]!;
    const signIdx = Math.floor(lon / 30);
    const sign = ZODIAC[signIdx] ?? "Aries";
    const lord = SIGN_RULERS[sign];
    const lordPlacement = planets[lord];

    if (!lordPlacement) continue;

    // 1. LORD DIGNITY
    let lordDignity = "";
    let dignityScore = 0;
    if (EXALTATIONS[lord] === lordPlacement.sign) {
      lordDignity = "exalted";
      dignityScore = 2;
    } else if (DEBILITATIONS[lord] === lordPlacement.sign) {
      lordDignity = "fall";
      dignityScore = -2;
    } else if (SIGN_RULERS[lordPlacement.sign] === lord) {
      lordDignity = "own";
      dignityScore = 1;
    } else {
      lordDignity = "peregrine";
      dignityScore = 0;
    }

    // 2. LORD TERRITORY
    let territoryScore = 0;
    const lordTerritory = SIDE_A.includes(lordPlacement.house)
      ? "own cluster"
      : "opponent cluster";

    // Harsh territory penalty/bonus
    if (SIDE_A.includes(h)) {
      // This house belongs to Side A
      territoryScore = SIDE_A.includes(lordPlacement.house) ? 2 : -3;
    } else {
      // This house belongs to Side B
      territoryScore = SIDE_B.includes(lordPlacement.house) ? 2 : -3;
    }

    const lordScore = dignityScore + territoryScore;

    // 3. PLANETS IN THIS HOUSE
    const planetsInHouse = planetsArray
      .filter((p) => p.house === h && p.name !== lord)
      .map((p) => p.name);

    let houseInternalScore = 0;
    for (const p of planetsInHouse) {
      if (BENEFIC_PLANETS.includes(p)) houseInternalScore += 1;
      if (MALEFIC_PLANETS.includes(p)) houseInternalScore -= 1;
    }

    // 4. ASPECTS TO THE LORD
    const aspectsToLord: Array<{ planet: string; type: string; orb: number }> = [];
    const aspectTypes = [
      { name: "Conjunction", angle: 0, orb: ASPECT_ORBS.CONJUNCTION },
      { name: "Sextile", angle: 60, orb: ASPECT_ORBS.SEXTILE },
      { name: "Square", angle: 90, orb: ASPECT_ORBS.SQUARE },
      { name: "Trine", angle: 120, orb: ASPECT_ORBS.TRINE },
      { name: "Opposition", angle: 180, orb: ASPECT_ORBS.OPPOSITION },
    ];

    let aspectScore = 0;
    for (const other of planetsArray) {
      if (other.name === lord) continue;

      const sep = Math.abs(lordPlacement.eclipticLon - other.eclipticLon);
      const minSep = Math.min(sep, 360 - sep);

      for (const aspect of aspectTypes) {
        const diff = Math.abs(minSep - aspect.angle);
        if (diff <= aspect.orb) {
          let aspectValue = 0;
          if (aspect.name === "Conjunction" || aspect.name === "Trine" || aspect.name === "Sextile") {
            aspectValue = BENEFIC_PLANETS.includes(other.name) ? 1 : 0;
            if (MALEFIC_PLANETS.includes(other.name)) aspectValue = -1;
          } else if (aspect.name === "Square" || aspect.name === "Opposition") {
            aspectValue = MALEFIC_PLANETS.includes(other.name) ? -1 : 0;
            if (BENEFIC_PLANETS.includes(other.name)) aspectValue = 0;
          }

          if (aspectValue !== 0) {
            aspectsToLord.push({
              planet: other.name,
              type: aspect.name,
              orb: diff,
            });
            aspectScore += aspectValue;
          }
        }
      }
    }

    const houseScore = houseInternalScore + aspectScore;
    const totalScore = lordScore + houseScore;

    houseEvals.push({
      house: h,
      sign,
      lord,
      lordDignity,
      lordPosition: `${lordPlacement.sign} H${lordPlacement.house}`,
      lordTerritory,
      planetsInHouse,
      aspectsToLord,
      lordScore,
      houseScore,
      totalScore,
      side: SIDE_A.includes(h) ? "A" : "B",
    });
  }

  // Print each house
  for (const houseEval of houseEvals) {
    console.log(`H${houseEval.house.toString().padStart(2)} (${houseEval.sign.padEnd(12)}) → ${houseEval.lord.padEnd(9)}`);
    console.log(`  Lord: ${houseEval.lordPosition} | Dignity: ${houseEval.lordDignity} | Territory: ${houseEval.lordTerritory}`);
    console.log(`  Lord Score: ${houseEval.lordScore > 0 ? "+" : ""}${houseEval.lordScore}`);

    if (houseEval.planetsInHouse.length > 0) {
      console.log(`  Planets in house: ${houseEval.planetsInHouse.join(", ")}`);
    }

    if (houseEval.aspectsToLord.length > 0) {
      console.log(`  Aspects to ${houseEval.lord}:`);
      houseEval.aspectsToLord.forEach((a) => {
        console.log(`    - ${a.planet} ${a.type} (orb ${a.orb.toFixed(1)}°)`);
      });
    }

    console.log(`  House Score: ${houseEval.houseScore > 0 ? "+" : ""}${houseEval.houseScore}`);
    console.log(`  TOTAL: ${houseEval.totalScore > 0 ? "+" : ""}${houseEval.totalScore}\n`);
  }

  // Aggregate by side
  console.log("════════════════════════════════════════════════════════════════");
  console.log("AGGREGATED BY SIDE");
  console.log("════════════════════════════════════════════════════════════════\n");

  const sideAEvals = houseEvals.filter((e) => e.side === "A");
  const sideBEvals = houseEvals.filter((e) => e.side === "B");

  const sideATotal = sideAEvals.reduce((sum, e) => sum + e.totalScore, 0);
  const sideBTotal = sideBEvals.reduce((sum, e) => sum + e.totalScore, 0);

  console.log("SIDE A (Phillies): H1, H3, H6, H10, H11");
  sideAEvals.filter((e) => SIDE_A.includes(e.house)).forEach((e) => {
    console.log(`  H${e.house}: ${e.totalScore > 0 ? "+" : ""}${e.totalScore}`);
  });
  const sideAClusterTotal = sideAEvals.filter((e) => SIDE_A.includes(e.house)).reduce((sum, e) => sum + e.totalScore, 0);
  console.log(`  TOTAL: ${sideAClusterTotal > 0 ? "+" : ""}${sideAClusterTotal}\n`);

  console.log("SIDE B (Mets): H4, H5, H7, H9, H12");
  sideBEvals.filter((e) => SIDE_B.includes(e.house)).forEach((e) => {
    console.log(`  H${e.house}: ${e.totalScore > 0 ? "+" : ""}${e.totalScore}`);
  });
  const sideBClusterTotal = sideBEvals.filter((e) => SIDE_B.includes(e.house)).reduce((sum, e) => sum + e.totalScore, 0);
  console.log(`  TOTAL: ${sideBClusterTotal > 0 ? "+" : ""}${sideBClusterTotal}\n`);

  console.log("Other houses (not in cluster): H2, H8");
  houseEvals.filter((e) => [2, 8].includes(e.house)).forEach((e) => {
    console.log(`  H${e.house}: ${e.totalScore > 0 ? "+" : ""}${e.totalScore}`);
  });

  const margin = Math.abs(sideAClusterTotal - sideBClusterTotal);
  const prediction = sideAClusterTotal > sideBClusterTotal ? "Side A" : sideAClusterTotal < sideBClusterTotal ? "Side B" : "Tie";

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log(`Phillies (Cluster): ${sideAClusterTotal > 0 ? "+" : ""}${sideAClusterTotal}`);
  console.log(`Mets (Cluster):     ${sideBClusterTotal > 0 ? "+" : ""}${sideBClusterTotal}`);
  console.log(`Margin:   ${margin}`);
  console.log(`Prediction: ${prediction}`);
  console.log("\nNOTE: H2 and H8 (not in clusters) show -4 and -6 respectively.");
  console.log("════════════════════════════════════════════════════════════════");
}

fullHouseEvaluation();
