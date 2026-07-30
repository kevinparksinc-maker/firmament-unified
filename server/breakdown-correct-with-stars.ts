import { calculateChart } from "./ephemeris";
import { SIGN_RULERS } from "./astroEngine";
import { getNakshatraAt } from "./nakshatra";
import { transformChartToFlatPlane } from "./coordinateTransformer";
import {
  getNakshatraLord,
  getNakshatraDignity,
  getFixedStarAmplification,
  getNakshatraLordStrength,
  findFixedStarConjunctions,
  FIXED_STARS_REFERENCE,
} from "./nakshatraStarEngine";
import { NAKSHATRAS, calculateNakshatraModifier } from "./nakshatraData";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIDE_A_HOUSES = [1, 3, 6, 10, 11];
const SIDE_B_HOUSES = [7, 9, 12, 4, 5];

function whichSide(house: number): "A" | "B" | "neutral" {
  if (SIDE_A_HOUSES.includes(house)) return "A";
  if (SIDE_B_HOUSES.includes(house)) return "B";
  return "neutral";
}

function getBasePoints(house: number): number {
  const baseMap: Record<number, number> = {
    1: 4, 7: 4,
    3: 2, 9: 2,
    6: 2, 12: 2,
    10: 4, 4: 4,
    11: 3, 5: 3,
  };
  return baseMap[house] ?? 0;
}

function getPlacementBonus(house: number): number {
  if ([1, 4, 7, 10].includes(house)) return 1;
  if ([2, 5, 8, 11].includes(house)) return 0.5;
  return 0;
}

function getDignityStatus(planet: string, sign: string): string {
  const EXALTATIONS = require("./astroEngine").EXALTATIONS;
  const DEBILITATIONS = require("./astroEngine").DEBILITATIONS;
  if (EXALTATIONS[planet] === sign) return "Exalted";
  if (DEBILITATIONS[planet] === sign) return "Debilitated";
  if (SIGN_RULERS[sign] === planet) return "Own";
  return "Neutral";
}

function dignityMultiplier(planet: string, sign: string): number {
  const status = getDignityStatus(planet, sign);
  switch (status) {
    case "Exalted": return 1.5;
    case "Own": return 1.25;
    case "Neutral": return 1.0;
    case "Debilitated": return 0.6;
    default: return 1.0;
  }
}

function nakshatraMultiplier(nakshatraName: string): number {
  const profile = NAKSHATRAS[nakshatraName];
  if (!profile) return 1.0;
  return calculateNakshatraModifier(profile);
}

async function breakdown() {
  const date = new Date(Date.UTC(2026, 5, 29, 20, 30, 0));
  const lat = 42.0909;
  const lon = -71.2643;

  const result = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });
  const planets = result.planets;
  const houses = result.houses;

  // Get planar Ascendant
  const localHours = (date.getUTCHours() + date.getUTCMinutes() / 60) % 24;
  const flatChart = transformChartToFlatPlane(lat, lon, localHours, 300, 1, 0);
  const planarAscendant = flatChart.planarAscendant;

  const adjustedCusps = [];
  for (let i = 0; i < 12; i++) {
    adjustedCusps.push((planarAscendant + i * 30) % 360);
  }

  // Build house lords CORRECTLY
  const houseLords = new Map<number, { sign: string; ruler: string }>();
  for (let i = 0; i < 12; i++) {
    const cusp = adjustedCusps[i];
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] || "Aries";
    const ruler = SIGN_RULERS[sign];
    if (ruler) {
      houseLords.set(i + 1, { sign, ruler });
    }
  }

  const getPlanarHouse = (eclipticLon: number): number => {
    for (let i = 0; i < 12; i++) {
      const start = adjustedCusps[i];
      const end = adjustedCusps[(i + 1) % 12];
      if (start <= end) {
        if (siderealLon >= start && siderealLon < end) return i + 1;
      } else {
        if (siderealLon >= start || siderealLon < end) return i + 1;
      }
    }
    return 1;
  };

  console.log("\n" + "═".repeat(130));
  console.log("DETAILED LORD BREAKDOWN WITH 27 LUNAR MANSIONS (NAKSHATRAS) & FIXED STARS");
  console.log("═".repeat(130));

  console.log("\n### HOUSE STRUCTURE (Planar Ascendant-based)");
  const allClusterHouses = [...SIDE_A_HOUSES, ...SIDE_B_HOUSES].sort((a, b) => a - b);
  for (const h of allClusterHouses) {
    const lord = houseLords.get(h);
    if (lord) {
      console.log(`H${h.toString().padEnd(2)} | ${whichSide(h)} | ${lord.sign.padEnd(12)} | Ruled by: ${lord.ruler}`);
    }
  }

  let sideATotal = 0;
  let sideBTotal = 0;
  const displaceCount = { A: new Set<string>(), B: new Set<string>() };

  console.log("\n" + "═".repeat(130));
  console.log("DETAILED SCORING");
  console.log("═".repeat(130));

  for (const houseNum of allClusterHouses) {
    const lordInfo = houseLords.get(houseNum);
    if (!lordInfo) continue;

    const lordName = lordInfo.ruler;
    const lordPlacement = planets.find(p => p.name === lordName);
    if (!lordPlacement) continue;

    const ruledSide = whichSide(houseNum);
    const occupiedHouse = getPlanarHouse(lordPlacement.eclipticLon);
    const occupiedSide = whichSide(occupiedHouse);

    const nak = getNakshatraAt(lordPlacement.eclipticLon);
    const nakshatraName = nak.nakshatra.name;
    const nakshatraLord = getNakshatraLord(nakshatraName);
    const nakshatra27 = nak.nakshatra;

    // Fixed stars
    const stars = findFixedStarConjunctions(lordPlacement.eclipticLon, 1.0);

    const dignity = getDignityStatus(lordName, lordPlacement.sign);
    const dMult = dignityMultiplier(lordName, lordPlacement.sign);
    const nMult = nakshatraMultiplier(nakshatraName);
    const starAmp = getFixedStarAmplification(lordPlacement.eclipticLon, 1.0);
    const nDignity = 1 + getNakshatraDignity(nakshatraName) * 0.1;
    const lordSupport = 1 + getNakshatraLordStrength(nakshatraName, dMult) * 0.5;

    const basePoints = getBasePoints(occupiedHouse);
    const placementBonus = getPlacementBonus(occupiedHouse);
    const controllingGain = (basePoints + placementBonus) * dMult * nMult * starAmp * nDignity * lordSupport;

    console.log(`\n${"─".repeat(130)}`);
    console.log(`H${houseNum} (${ruledSide === "A" ? "GERMANY" : "PARAGUAY"} — Rules ${lordInfo.sign})`);
    console.log(`  Lord: ${lordName}`);
    console.log(`  Currently: H${occupiedHouse} (${occupiedSide === "A" ? "GERMANY" : occupiedSide === "B" ? "PARAGUAY" : "NEUTRAL"} territory)`);
    console.log(`  Position: ${lordPlacement.sign} ${lordPlacement.degreeInSign.toFixed(1)}° | Sidereal ${lordPlacement.eclipticLon.toFixed(2)}°`);

    // 27 LUNAR MANSIONS
    console.log(`\n  ★ 27 LUNAR MANSION (NAKSHATRA):`);
    console.log(`    ${nakshatraName} (Pada ${nak.pada})`);
    console.log(`    Nakshatra Lord: ${nakshatraLord} | Nakshatra Dignity: ${getNakshatraDignity(nakshatraName)} (${nDignity.toFixed(3)}x)`);
    console.log(`    Keywords: ${nakshatra27.keywords?.join(", ") || "N/A"}`);

    // FIXED STARS
    if (stars.length > 0) {
      console.log(`\n  ★ FIXED STARS CONJUNCT (within 1°):`);
      stars.forEach(star => {
        const diff = Math.abs(lordPlacement.eclipticLon - star.longitude);
        const normalizedDiff = Math.min(diff, 360 - diff);
        console.log(`    ${star.name} (${star.nature.toUpperCase()}, ${star.group}) — Orb: ${normalizedDiff.toFixed(2)}°`);
      });
    } else {
      console.log(`\n  ★ FIXED STARS: None within 1° orb`);
    }

    // MULTIPLIERS
    console.log(`\n  MULTIPLIERS:`);
    console.log(`    Dignity (${dignity}): ${dMult.toFixed(2)}x`);
    console.log(`    Nakshatra: ${nMult.toFixed(3)}x`);
    console.log(`    Fixed Star Amp: ${starAmp.toFixed(3)}x`);
    console.log(`    Lord Support: ${lordSupport.toFixed(3)}x`);

    // CALCULATION
    console.log(`\n  CALCULATION:`);
    if (occupiedSide === "neutral") {
      console.log(`    ⚠️  NEUTRAL HOUSE — No points awarded`);
    } else if (occupiedSide === ruledSide) {
      console.log(`    ✓ HOME TERRITORY — ${ruledSide === "A" ? "Germany" : "Paraguay"} gains:`);
      console.log(`      (${basePoints} + ${placementBonus}) × ${dMult.toFixed(2)} × ${nMult.toFixed(3)} × ${starAmp.toFixed(3)} × ${nDignity.toFixed(3)} × ${lordSupport.toFixed(3)} = ${controllingGain.toFixed(3)}`);
      if (occupiedSide === "A") sideATotal += controllingGain;
      else sideBTotal += controllingGain;
    } else {
      console.log(`    ✗ DISPLACED — ${ruledSide === "A" ? "Germany" : "Paraguay"} loses, ${occupiedSide === "A" ? "Germany" : "Paraguay"} gains:`);
      console.log(`      Loss: -${basePoints} (no multipliers)`);
      console.log(`      Gain: (${basePoints} + ${placementBonus}) × ${dMult.toFixed(2)} × ${nMult.toFixed(3)} × ${starAmp.toFixed(3)} × ${nDignity.toFixed(3)} × ${lordSupport.toFixed(3)} = ${controllingGain.toFixed(3)}`);

      if (ruledSide === "A") {
        sideATotal -= basePoints;
        displaceCount.A.add(lordName);
      } else {
        sideBTotal -= basePoints;
        displaceCount.B.add(lordName);
      }

      if (occupiedSide === "A") sideATotal += controllingGain;
      else sideBTotal += controllingGain;
    }
  }

  console.log(`\n${"═".repeat(130)}`);
  console.log("FINAL TOTALS (Canonical Territorial Rules + Nakshatra + Fixed Stars)");
  console.log(`Germany: ${sideATotal.toFixed(3)}`);
  console.log(`Paraguay: ${sideBTotal.toFixed(3)}`);
  console.log(`Margin: ${(sideATotal - sideBTotal).toFixed(3)} (${sideATotal > sideBTotal ? "Germany" : "Paraguay"} ahead)`);
  console.log("═".repeat(130) + "\n");
}

breakdown().catch(console.error);
