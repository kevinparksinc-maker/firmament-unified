import { calculateChart } from "./ephemeris";
import { SIGN_RULERS, EXALTATIONS, DEBILITATIONS } from "./astroEngine";
import { getNakshatraAt } from "./nakshatra";
import { transformChartToFlatPlane } from "./coordinateTransformer";
import {
  getNakshatraLord,
  getNakshatraDignity,
  getFixedStarAmplification,
  getNakshatraLordStrength,
  findFixedStarConjunctions,
} from "./nakshatraStarEngine";
import { getSignNakshatraFriction, PlanetName } from "./planetRelationships";
import { NAKSHATRAS, calculateNakshatraModifier } from "./nakshatraData";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIDE_A_HOUSES = [1, 3, 6, 10, 11];
const SIDE_B_HOUSES = [7, 9, 12, 4, 5];

// 27 Lunar Mansions - Keywords for each Nakshatra
const NAKSHATRA_KEYWORDS: Record<string, string> = {
  Ashwini: "swift, pioneering, healing, initiations",
  Bharani: "transformative, intense, restraint, hidden power",
  Krittika: "sharp, cutting, purification, brilliant, critical",
  Rohini: "fertile, nourishing, growth, abundance, beauty",
  Mrigashira: "searching, curious, gentle, travel, tracking",
  Ardra: "stormy, sharp, chaotic, emotional upheaval, clarity",
  Punarvasu: "renewal, return of light, nurturing, safety",
  Pushya: "deeply nourishing, protective, spiritual growth, law",
  Ashlesha: "intense, hypnotic, secretive, sharp insight, poison",
  Magha: "regal, ancestral, traditional, authority, legacy",
  "Purva Phalguni": "creative, relaxing, sensual, marital bliss",
  "Uttara Phalguni": "helpful, patronizing, alliance, contracts",
  Hasta: "craftsmanship, clever, manifested skill, control",
  Chitra: "brilliant, structural, artistic illusion, design",
  Swati: "independent, scattering, diplomatic, adaptable",
  Vishakha: "focused, goal-driven, competitive, late triumph",
  Anuradha: "devoted, friendly, network building, resilience",
  Jyeshtha: "protective, senior, powerful presence, jealousy",
  Mula: "rooted, uprooting, radical destruction, core truth",
  "Purva Ashadha": "invincible, declaration, early victory, fluid",
  "Uttara Ashadha": "enduring, victorious, universal duty, structure",
  Shravana: "listening, learning, oral tradition, reputation",
  Dhanishta: "wealthy, rhythmic, musical, high ambitions",
  Shatabhisha: "healing, secretive, collective vision, 100 physicians",
  "Purva Bhadrapada": "sacrificial, dual-natured, fiery passion",
  "Uttara Bhadrapada": "stable, deep, cosmic awareness, stillness",
  Revati: "safe journey, final exit, wealthy, nourishing finish",
};

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

  // Build house lords
  const houseLords = new Map<number, string>();
  for (let i = 0; i < 12; i++) {
    const cusp = adjustedCusps[i];
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] || "Aries";
    const ruler = SIGN_RULERS[sign];
    if (ruler) {
      houseLords.set(i + 1, ruler);
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
      const sign = ZODIAC_SIGNS[Math.floor(adjustedCusps[h-1] / 30) % 12];
      console.log(`H${h.toString().padEnd(2)} | ${whichSide(h)} | ${sign.padEnd(12)} | Ruled by: ${lord}`);
    }
  }

  let sideATotal = 0;
  let sideBTotal = 0;
  const displaceCount = { A: new Set<string>(), B: new Set<string>() };

  console.log("\n" + "═".repeat(130));
  console.log("DETAILED SCORING");
  console.log("═".repeat(130));

  for (const houseNum of allClusterHouses) {
    const lordName = houseLords.get(houseNum);
    if (!lordName) {
      console.log(`\nH${houseNum}: [NO LORD FOUND]`);
      continue;
    }

    const lordPlacement = planets.find(p => p.name === lordName);
    if (!lordPlacement) continue;

    const ruledSide = whichSide(houseNum);
    const occupiedHouse = getPlanarHouse(lordPlacement.eclipticLon);
    const occupiedSide = whichSide(occupiedHouse);

    const nak = getNakshatraAt(lordPlacement.eclipticLon);
    const nakshatraName = nak.nakshatra.name;
    const nakshatraLord = getNakshatraLord(nakshatraName) as PlanetName || "Sun";
    const nakshatra27 = nak.nakshatra;

    // Fixed stars
    const stars = findFixedStarConjunctions(lordPlacement.eclipticLon, 1.0);

    // Friction Modifier: Sign Lord ↔ Nakshatra Lord relationship
    const ruledSign = ZODIAC_SIGNS[Math.floor(adjustedCusps[houseNum-1] / 30) % 12];
    const signLord = SIGN_RULERS[ruledSign] as PlanetName || "Sun";
    const frictionResult = getSignNakshatraFriction(signLord, nakshatraLord);

    const dignity = getDignityStatus(lordName, lordPlacement.sign);
    const dMult = dignityMultiplier(lordName, lordPlacement.sign);
    const nMult = nakshatraMultiplier(nakshatraName);
    const frictionMult = frictionResult.multiplier;
    const starAmp = getFixedStarAmplification(lordPlacement.eclipticLon, 1.0);
    const nDignity = 1 + getNakshatraDignity(nakshatraName) * 0.1;
    const lordSupport = 1 + getNakshatraLordStrength(nakshatraName, dMult) * 0.5;

    const basePoints = getBasePoints(occupiedHouse);
    const placementBonus = getPlacementBonus(occupiedHouse);
    const controllingGain = (basePoints + placementBonus) * dMult * nMult * frictionMult * starAmp * nDignity * lordSupport;

    console.log(`\n${"─".repeat(130)}`);
    console.log(`H${houseNum} (${ruledSide === "A" ? "GERMANY" : "PARAGUAY"} — Rules ${ZODIAC_SIGNS[Math.floor(adjustedCusps[houseNum-1] / 30) % 12]})`);
    console.log(`  Lord: ${lordName}`);
    console.log(`  Currently: H${occupiedHouse} (${occupiedSide === "A" ? "GERMANY" : occupiedSide === "B" ? "PARAGUAY" : "NEUTRAL"} territory)`);
    console.log(`  Position: ${lordPlacement.sign} ${lordPlacement.degreeInSign.toFixed(1)}° | Sidereal ${lordPlacement.eclipticLon.toFixed(2)}°`);

    // 27 LUNAR MANSIONS
    const nakshatraKeywords = NAKSHATRA_KEYWORDS[nakshatraName] || "mystical, energetic, cosmic archetype";
    console.log(`\n  ★ 27 LUNAR MANSION (NAKSHATRA): ${nakshatraName}`);
    console.log(`    Pada ${nak.pada} | Nakshatra Lord: ${nakshatraLord}`);
    console.log(`    Nakshatra Dignity: ${getNakshatraDignity(nakshatraName)} (multiplier: ${nDignity.toFixed(3)}x)`);
    console.log(`    Keywords: ${nakshatraKeywords}`);

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

    // MULTIPLIERS - Semantically Grouped
    console.log(`\n  MULTIPLIERS:`);
    console.log(`    [MACRO TERRITORY LAYER]`);
    console.log(`      Dignity (${dignity}): ${dMult.toFixed(2)}x`);
    console.log(`      Friction (${signLord} ↔ ${nakshatraLord}): ${frictionMult.toFixed(2)}x [${frictionResult.status}]`);
    console.log(`    [MICRO MANSION LAYER]`);
    console.log(`      Nakshatra Support: ${nMult.toFixed(3)}x`);
    console.log(`      Nakshatra Dignity: ${nDignity.toFixed(3)}x`);
    console.log(`    [STELLAR & FEEDBACK LAYER]`);
    console.log(`      Fixed Star Amp: ${starAmp.toFixed(3)}x`);
    console.log(`      Lord Support: ${lordSupport.toFixed(3)}x`);

    console.log(`\n  CALCULATION FILE TRACE:`);
    if (occupiedSide === "neutral") {
      console.log(`    ⚠️  NEUTRAL HOUSE — No points awarded`);
    } else if (occupiedSide === ruledSide) {
      console.log(`    ✓ HOME TERRITORY — ${ruledSide === "A" ? "Germany" : "Paraguay"} gains:`);
      console.log(`      Base: (${basePoints} + ${placementBonus}) = ${(basePoints + placementBonus).toFixed(1)}`);
      console.log(`      × Dignity(${dMult.toFixed(2)}) × Friction(${frictionMult.toFixed(2)}) × NakshatraSup(${nMult.toFixed(3)}) × NakshatraDig(${nDignity.toFixed(3)}) × FixedStar(${starAmp.toFixed(3)}) × LordSupp(${lordSupport.toFixed(3)}) = ${controllingGain.toFixed(3)}`);
      if (occupiedSide === "A") sideATotal += controllingGain;
      else sideBTotal += controllingGain;
    } else {
      console.log(`    ✗ DISPLACED — ${ruledSide === "A" ? "Germany" : "Paraguay"} loses, ${occupiedSide === "A" ? "Germany" : "Paraguay"} gains:`);
      console.log(`      Loss: -${basePoints} (canonical rule: base points only, no multipliers)`);
      console.log(`      Gain: Base(${basePoints} + ${placementBonus}) × Dignity(${dMult.toFixed(2)}) × Friction(${frictionMult.toFixed(2)}) × NakshatraSup(${nMult.toFixed(3)}) × NakshatraDig(${nDignity.toFixed(3)}) × FixedStar(${starAmp.toFixed(3)}) × LordSupp(${lordSupport.toFixed(3)}) = ${controllingGain.toFixed(3)}`);

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

  // Multiple displacement penalty
  console.log(`\n${"═".repeat(130)}`);
  console.log("MULTIPLE DISPLACEMENT PENALTY");
  console.log(`Germany displaced: ${Array.from(displaceCount.A).join(", ") || "none"} (count: ${displaceCount.A.size})`);
  console.log(`Paraguay displaced: ${Array.from(displaceCount.B).join(", ") || "none"} (count: ${displaceCount.B.size})`);

  if (displaceCount.A.size > 1) {
    const penalty = displaceCount.A.size - 1;
    console.log(`Germany penalty: -${penalty} (${displaceCount.A.size} displaced lords)`);
    sideATotal -= penalty;
  }
  if (displaceCount.B.size > 1) {
    const penalty = displaceCount.B.size - 1;
    console.log(`Paraguay penalty: -${penalty} (${displaceCount.B.size} displaced lords)`);
    sideBTotal -= penalty;
  }

  console.log(`\n${"═".repeat(130)}`);
  console.log("FINAL TOTALS (Canonical Territorial Rules + Nakshatra + Fixed Stars)");
  console.log(`Germany: ${sideATotal.toFixed(3)}`);
  console.log(`Paraguay: ${sideBTotal.toFixed(3)}`);
  console.log(`Margin: ${(sideATotal - sideBTotal).toFixed(3)} (${sideATotal > sideBTotal ? "Germany" : "Paraguay"} ahead)`);
  console.log("═".repeat(130) + "\n");
}

breakdown().catch(console.error);
