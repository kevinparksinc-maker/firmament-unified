/**
 * FULL DIAGNOSTIC BREAKDOWN
 *
 * Shows EVERYTHING:
 * - All 12 houses
 * - Each house's lord
 * - Where that lord currently sits
 * - EVERY condition affecting that lord
 * - Points for each condition
 * - Grand totals
 *
 * No hiding. No subtotals. Raw data.
 */

import { calculateChart } from "./ephemeris";
import { EXALTATIONS, DEBILITATIONS, SIGN_RULERS, SIGN_ORDER } from "./astroEngine";
import { COMBUSTION_ORBS, ASPECT_ORBS, BENEFIC_PLANETS, MALEFIC_PLANETS } from "./houseScoringConstants";
import { detectFixedStars } from "./fixedStarDetection";
import type { PlanetPosition } from "./ephemeris";

interface ConditionScore {
  condition: string;
  points: number;
  detail: string;
}

interface HouseDiagnostic {
  houseNumber: number;
  sign: string;
  lord: string;
  lordCurrentHouse: number;
  lordSign: string;
  conditions: ConditionScore[];
  subtotal: number;
  cluster: "A" | "B";
}

async function fullDiagnostic() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("FULL DIAGNOSTIC BREAKDOWN — ALL HOUSES, ALL CONDITIONS");
  console.log("════════════════════════════════════════════════════════════════\n");

  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = {
    latitude: 39.9526,
    longitude: -75.1652,
    altitude: 0,
  };

  const ephResult = await calculateChart(date, observer);
  const planetsArray = ephResult.planets;
  const houses = ephResult.houses;

  const planets: Record<string, PlanetPosition> = {};
  planetsArray.forEach((p) => {
    planets[p.name] = p;
  });

  const fixedStars = detectFixedStars(planetsArray);
  const SIDE_A = [1, 3, 6, 10, 11];
  const SIDE_B = [4, 5, 7, 9, 12];
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

  const diagnostics: HouseDiagnostic[] = [];

  // Process all 12 houses
  for (let h = 1; h <= 12; h++) {
    const lon = houses.cusps[h - 1]!;
    const signIdx = Math.floor(lon / 30);
    const sign = ZODIAC[signIdx] ?? "Aries";
    const lord = SIGN_RULERS[sign] || "Unknown";
    const lordPlacement = planets[lord];

    if (!lordPlacement) {
      diagnostics.push({
        houseNumber: h,
        sign,
        lord,
        lordCurrentHouse: 0,
        lordSign: "Unknown",
        conditions: [
          {
            condition: "Lord not in chart",
            points: 0,
            detail: "",
          },
        ],
        subtotal: 0,
        cluster: SIDE_A.includes(h) ? "A" : "B",
      });
      continue;
    }

    const conditions: ConditionScore[] = [];
    let subtotal = 0;

    // 1. DIGNITY (by sign)
    let dignityPts = 0;
    let dignityStatus = "";
    if (EXALTATIONS[lord] === lordPlacement.sign) {
      dignityPts = 2;
      dignityStatus = "exalted";
    } else if (DEBILITATIONS[lord] === lordPlacement.sign) {
      dignityPts = -2;
      dignityStatus = "fall";
    } else if (SIGN_RULERS[lordPlacement.sign] === lord) {
      dignityPts = 1;
      dignityStatus = "own sign";
    } else {
      // Check for detriment (opposite sign of own)
      const ownSigns = Object.entries(SIGN_RULERS)
        .filter(([_, r]) => r === lord)
        .map(([s, _]) => s);
      if (
        ownSigns.length > 0 &&
        ownSigns.some((s) => SIGN_RULERS[lordPlacement.sign] === s)
      ) {
        dignityPts = -1;
        dignityStatus = "detriment";
      } else {
        dignityStatus = "peregrine";
      }
    }
    conditions.push({
      condition: "Dignity",
      points: dignityPts,
      detail: dignityStatus,
    });
    subtotal += dignityPts;

    // 2. COMBUSTION
    const sun = planets.Sun;
    if (sun) {
      const sep = Math.abs(lordPlacement.eclipticLon - sun.eclipticLon);
      const minSep = Math.min(sep, 360 - sep);
      const orb = COMBUSTION_ORBS[lord as keyof typeof COMBUSTION_ORBS] || COMBUSTION_ORBS.DEFAULT;

      if (minSep <= orb && minSep > 0.1) {
        conditions.push({
          condition: "Combustion",
          points: -1,
          detail: `${minSep.toFixed(1)}° from Sun (orb ${orb}°)`,
        });
        subtotal -= 1;
      } else if (minSep <= 0.1) {
        conditions.push({
          condition: "Cazimi",
          points: 2,
          detail: "In Sun's heart (very close)",
        });
        subtotal += 2;
      }
    }

    // 3. RETROGRADE
    if (lordPlacement.retrograde) {
      conditions.push({
        condition: "Retrograde",
        points: -1,
        detail: "Moving backwards",
      });
      subtotal -= 1;
    }

    // 4. HOUSE PLACEMENT TYPE
    let placementPts = 0;
    let placementType = "";
    const currentHouse = lordPlacement.house;
    if ([1, 4, 7, 10].includes(currentHouse)) {
      placementPts = 1;
      placementType = "angular";
    } else if ([2, 5, 8, 11].includes(currentHouse)) {
      placementType = "succedent";
    } else {
      placementPts = -1;
      placementType = "cadent";
    }
    if (placementPts !== 0) {
      conditions.push({
        condition: "House Type",
        points: placementPts,
        detail: `${placementType} (H${currentHouse})`,
      });
      subtotal += placementPts;
    }

    // 5. FIXED STARS
    const starsOnLord = fixedStars.filter((s) => s.planet === lord);
    for (const star of starsOnLord) {
      const starPts = star.nature === "benefic" ? 1 : -1;
      conditions.push({
        condition: "Fixed Star",
        points: starPts,
        detail: `${star.name} (${star.nature}, orb ±${star.orb.toFixed(1)}°)`,
      });
      subtotal += starPts;
    }

    // 6. ASPECTS TO PLANETS
    for (const other of planetsArray) {
      if (other.name === lord) continue;

      const sep = Math.abs(lordPlacement.eclipticLon - other.eclipticLon);
      const minSep = Math.min(sep, 360 - sep);

      // Check major aspects
      const aspects = [
        { name: "Conjunction", angle: 0, orb: ASPECT_ORBS.CONJUNCTION },
        { name: "Sextile", angle: 60, orb: ASPECT_ORBS.SEXTILE },
        { name: "Square", angle: 90, orb: ASPECT_ORBS.SQUARE },
        { name: "Trine", angle: 120, orb: ASPECT_ORBS.TRINE },
        { name: "Opposition", angle: 180, orb: ASPECT_ORBS.OPPOSITION },
      ];

      for (const aspect of aspects) {
        const diff = Math.abs(minSep - aspect.angle);
        if (diff <= aspect.orb) {
          let aspectPts = 0;
          if (aspect.name === "Conjunction") {
            aspectPts = BENEFIC_PLANETS.includes(other.name) ? 1 : MALEFIC_PLANETS.includes(other.name) ? -1 : 0;
          } else if (aspect.name === "Trine" || aspect.name === "Sextile") {
            aspectPts = BENEFIC_PLANETS.includes(other.name) ? 1 : 0;
          } else if (aspect.name === "Square" || aspect.name === "Opposition") {
            aspectPts = MALEFIC_PLANETS.includes(other.name) ? -1 : 0;
          }

          if (aspectPts !== 0) {
            conditions.push({
              condition: `Aspect`,
              points: aspectPts,
              detail: `${aspect.name} ${other.name} (orb ${diff.toFixed(1)}°)`,
            });
            subtotal += aspectPts;
          }
        }
      }
    }

    // 7. BESIEGED CHECK (malefics on either side)
    const maleficsNear = planetsArray.filter((p) => {
      if (!MALEFIC_PLANETS.includes(p.name)) return false;
      const sep = Math.abs(lordPlacement.eclipticLon - p.eclipticLon);
      return sep <= 8 && sep > 0.1;
    });
    if (maleficsNear.length >= 2) {
      conditions.push({
        condition: "Besieged",
        points: -1,
        detail: `Trapped between ${maleficsNear.map((m) => m.name).join(", ")}`,
      });
      subtotal -= 1;
    }

    diagnostics.push({
      houseNumber: h,
      sign,
      lord,
      lordCurrentHouse: currentHouse,
      lordSign: lordPlacement.sign,
      conditions,
      subtotal,
      cluster: SIDE_A.includes(h) ? "A" : "B",
    });
  }

  // Print diagnostics
  for (const diag of diagnostics) {
    console.log(
      `H${diag.houseNumber} (${diag.sign.padEnd(12)}) → ${diag.lord.padEnd(9)} in ${diag.lordSign} H${diag.lordCurrentHouse}`
    );
    for (const cond of diag.conditions) {
      console.log(
        `   ${cond.condition.padEnd(15)} ${cond.points > 0 ? "+" : ""}${cond.points.toString().padStart(2)}   ${cond.detail}`
      );
    }
    console.log(
      `   SUBTOTAL: ${diag.subtotal > 0 ? "+" : ""}${diag.subtotal} (Cluster ${diag.cluster})\n`
    );
  }

  // Totals
  console.log("════════════════════════════════════════════════════════════════");
  const sideATotal = diagnostics
    .filter((d) => d.cluster === "A")
    .reduce((sum, d) => sum + d.subtotal, 0);
  const sideBTotal = diagnostics
    .filter((d) => d.cluster === "B")
    .reduce((sum, d) => sum + d.subtotal, 0);

  console.log(`SIDE A (Phillies, H1,3,6,10,11): ${sideATotal > 0 ? "+" : ""}${sideATotal}`);
  console.log(`SIDE B (Mets, H4,5,7,9,12):     ${sideBTotal > 0 ? "+" : ""}${sideBTotal}`);
  console.log(`Margin: ${Math.abs(sideATotal - sideBTotal)}`);
  console.log("════════════════════════════════════════════════════════════════");
}

fullDiagnostic();
