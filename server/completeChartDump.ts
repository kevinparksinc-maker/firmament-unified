/**
 * COMPLETE CHART DUMP
 *
 * All planetary positions, aspects, conditions, dignities, fixed stars
 * Everything in the chart. No filtering. No game context.
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS, EXALTATIONS, DEBILITATIONS, SIGN_ORDER } from "./astroEngine";
import { COMBUSTION_ORBS, ASPECT_ORBS, BENEFIC_PLANETS, MALEFIC_PLANETS } from "./houseScoringConstants";
import { detectFixedStars } from "./fixedStarDetection";
import type { PlanetPosition } from "./ephemeris";

async function completeChartDump() {
  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = {
    latitude: 39.9526,
    longitude: -75.1652,
    altitude: 0,
  };

  const ephResult = await calculateChart(date, observer);
  const planetsArray = ephResult.planets;
  const houses = ephResult.houses;

  const fixedStars = detectFixedStars(planetsArray);

  console.log("════════════════════════════════════════════════════════════════");
  console.log("COMPLETE CHART DUMP");
  console.log("July 16, 2026 | 10:30 PM UTC (6:30 PM EDT)");
  console.log("Philadelphia, PA | 39.9526°N, 75.1652°W");
  console.log("════════════════════════════════════════════════════════════════\n");

  // ─────────────────────────────────────────────────────────────
  // EPHEMERIS DATA
  // ─────────────────────────────────────────────────────────────

  console.log("EPHEMERIS HEADER");
  console.log("─".repeat(80));
  console.log(`Ayanamsa (Lahiri): ${0}°`);
  console.log(`Ascendant: ${ephResult.houses.ascendant.toFixed(2)}°`);
  console.log(`MC: ${ephResult.houses.mc.toFixed(2)}°\n`);

  // ─────────────────────────────────────────────────────────────
  // ALL PLANETS - COMPLETE DATA
  // ─────────────────────────────────────────────────────────────

  console.log("PLANETARY POSITIONS (ALL PLANETS)");
  console.log("─".repeat(80));

  for (const p of planetsArray) {
    console.log(`\n${p.name.toUpperCase()}`);
    console.log(`  Tropical Longitude:  ${p.eclipticLon.toFixed(2)}°`);
    console.log(`  Sidereal Longitude:  ${p.eclipticLon.toFixed(2)}°`);
    console.log(`  Sign:                ${p.sign} ${p.degreeInSign.toFixed(1)}°${p.minutes}'`);
    console.log(`  House:               H${p.house}`);
    console.log(`  Altitude:            ${p.altitude.toFixed(2)}°`);
    console.log(`  Azimuth:             ${p.azimuth.toFixed(2)}°`);
    console.log(`  Retrograde:          ${p.retrograde ? "YES" : "No"}`);

    // Dignity
    let dignity = "";
    if (EXALTATIONS[p.name] === p.sign) {
      dignity = `EXALTED in ${p.sign}`;
    } else if (DEBILITATIONS[p.name] === p.sign) {
      dignity = `FALL in ${p.sign}`;
    } else if (SIGN_RULERS[p.sign] === p.name) {
      dignity = `OWN SIGN (${p.sign})`;
    } else {
      dignity = "PEREGRINE (no dignity)";
    }
    console.log(`  Dignity:             ${dignity}`);

    // Combustion/Cazimi
    const sun = planetsArray.find((x) => x.name === "Sun");
    if (sun && p.name !== "Sun") {
      const sep = Math.abs(p.eclipticLon - sun.eclipticLon);
      const minSep = Math.min(sep, 360 - sep);
      const orb = COMBUSTION_ORBS[p.name as keyof typeof COMBUSTION_ORBS] || COMBUSTION_ORBS.DEFAULT;

      if (minSep <= 0.1) {
        console.log(`  Cazimi:              YES (in Sun's heart)`);
      } else if (minSep <= orb) {
        console.log(`  Combustion:          YES (${minSep.toFixed(2)}° from Sun, orb ${orb}°)`);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HOUSE CUSPS
  // ─────────────────────────────────────────────────────────────

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("HOUSE CUSPS (SIDEREAL LONGITUDE)");
  console.log("─".repeat(80));

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

  for (let h = 0; h < 12; h++) {
    const lon = houses.cusps[h]!;
    const signIdx = Math.floor(lon / 30);
    const sign = ZODIAC[signIdx] ?? "Aries";
    const degree = lon % 30;
    console.log(`H${(h + 1).toString().padStart(2)}: ${lon.toFixed(2).padStart(7)}° | ${sign.padEnd(12)} ${degree.toFixed(1).padStart(5)}°`);
  }

  // ─────────────────────────────────────────────────────────────
  // ALL ASPECTS (MAJOR)
  // ─────────────────────────────────────────────────────────────

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("ALL ASPECTS (CONJUNCTION, SEXTILE, SQUARE, TRINE, OPPOSITION)");
  console.log("─".repeat(80));

  const aspects = [
    { name: "Conjunction", angle: 0, orb: ASPECT_ORBS.CONJUNCTION },
    { name: "Sextile", angle: 60, orb: ASPECT_ORBS.SEXTILE },
    { name: "Square", angle: 90, orb: ASPECT_ORBS.SQUARE },
    { name: "Trine", angle: 120, orb: ASPECT_ORBS.TRINE },
    { name: "Opposition", angle: 180, orb: ASPECT_ORBS.OPPOSITION },
  ];

  let aspectCount = 0;
  for (let i = 0; i < planetsArray.length; i++) {
    for (let j = i + 1; j < planetsArray.length; j++) {
      const p1 = planetsArray[i]!;
      const p2 = planetsArray[j]!;

      const sep = Math.abs(p1.eclipticLon - p2.eclipticLon);
      const minSep = Math.min(sep, 360 - sep);

      for (const aspect of aspects) {
        const diff = Math.abs(minSep - aspect.angle);
        if (diff <= aspect.orb) {
          console.log(
            `${p1.name.padEnd(10)} ${aspect.name.padEnd(12)} ${p2.name.padEnd(10)} (orb ${diff.toFixed(2)}°)`
          );
          aspectCount++;
        }
      }
    }
  }
  if (aspectCount === 0) console.log("(none within orbs)");

  // ─────────────────────────────────────────────────────────────
  // FIXED STARS
  // ─────────────────────────────────────────────────────────────

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("FIXED STARS");
  console.log("─".repeat(80));

  if (fixedStars.length > 0) {
    for (const star of fixedStars) {
      console.log(`${star.planet.padEnd(10)} ✦ ${star.name.padEnd(12)} (orb ±${star.orb.toFixed(1)}°) [${star.nature}]`);
      console.log(`  Meaning: ${star.meaning}`);
    }
  } else {
    console.log("(none active)");
  }

  // ─────────────────────────────────────────────────────────────
  // PLANETARY HOURS & DOMINANCE
  // ─────────────────────────────────────────────────────────────

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("PLANETARY STATISTICS");
  console.log("─".repeat(80));

  const angular = planetsArray.filter((p) => [1, 4, 7, 10].includes(p.house));
  const succedent = planetsArray.filter((p) => [2, 5, 8, 11].includes(p.house));
  const cadent = planetsArray.filter((p) => [3, 6, 9, 12].includes(p.house));
  const retrograde = planetsArray.filter((p) => p.retrograde);

  console.log(`\nPlanets in Angular Houses (1,4,7,10):   ${angular.length}`);
  angular.forEach((p) => console.log(`  - ${p.name} in H${p.house}`));

  console.log(`\nPlanets in Succedent Houses (2,5,8,11): ${succedent.length}`);
  succedent.forEach((p) => console.log(`  - ${p.name} in H${p.house}`));

  console.log(`\nPlanets in Cadent Houses (3,6,9,12):    ${cadent.length}`);
  cadent.forEach((p) => console.log(`  - ${p.name} in H${p.house}`));

  console.log(`\nRetrograde Planets:                      ${retrograde.length}`);
  retrograde.forEach((p) => console.log(`  - ${p.name} in ${p.sign} H${p.house}`));

  const benefic = planetsArray.filter((p) => BENEFIC_PLANETS.includes(p.name));
  const malefic = planetsArray.filter((p) => MALEFIC_PLANETS.includes(p.name));

  console.log(`\nBenefics (Jupiter, Venus):               ${benefic.length}`);
  benefic.forEach((p) => console.log(`  - ${p.name} in H${p.house}`));

  console.log(`\nMalefics (Mars, Saturn):                 ${malefic.length}`);
  malefic.forEach((p) => console.log(`  - ${p.name} in H${p.house}`));

  // ─────────────────────────────────────────────────════════════
  // MOON DATA
  // ─────────────────────────────────────════════════════════════

  const moon = planetsArray.find((p) => p.name === "Moon")!;
  const sun = planetsArray.find((p) => p.name === "Sun")!;

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("LUNAR DATA");
  console.log("─".repeat(80));

  const sep = Math.abs(moon.eclipticLon - sun.eclipticLon);
  const minSep = Math.min(sep, 360 - sep);
  const isWaxing = minSep < 180;

  console.log(`Moon: ${moon.sign} ${moon.degreeInSign.toFixed(1)}° in H${moon.house}`);
  console.log(`Sun:  ${sun.sign} ${sun.degreeInSign.toFixed(1)}° in H${sun.house}`);
  console.log(`Separation: ${minSep.toFixed(2)}°`);
  console.log(`Phase: ${isWaxing ? "WAXING" : "WANING"}`);

  console.log("\n" + "════════════════════════════════════════════════════════════════");
}

completeChartDump();
