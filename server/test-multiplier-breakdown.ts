/**
 * MULTIPLIER BREAKDOWN DIAGNOSTIC
 * Shows which layer is causing extreme scores in failing predictions
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS } from "./astroEngine";
import { getNakshatraAt } from "./nakshatra";
import { calculateArabicLots } from "./arabicLotsCalculator";
import { NAKSHATRAS, calculateNakshatraModifier } from "./nakshatraData";
import {
  getNakshatraLord,
  getNakshatraDignity,
  getFixedStarAmplification,
  getNakshatraLordStrength,
} from "./nakshatraStarEngine";
import { getSignNakshatraFriction } from "./planetRelationships";
import { SIDE_A_HOUSES, SIDE_B_HOUSES } from "./houseScoringConstants";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MultiplierBreakdown {
  planet: string;
  house: number;
  sign: string;
  nakshatra: string;
  dignity: number;
  nakshatraMult: number;
  friction: number;
  fixedStar: number;
  nakshatraDignity: number;
  lordSupport: number;
  basePoints: number;
  placementBonus: number;
  final: number;
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
  const angularHouses = [1, 4, 7, 10];
  const succedentHouses = [2, 5, 8, 11];
  if (angularHouses.includes(house)) return 1;
  if (succedentHouses.includes(house)) return 0.5;
  return 0;
}

function getDignityStatus(planet: string, sign: string): string {
  const EXALTATIONS: Record<string, string> = {
    Sun: "Aries", Moon: "Taurus", Mars: "Capricorn", Mercury: "Virgo",
    Jupiter: "Cancer", Venus: "Pisces", Saturn: "Libra",
  };
  const DEBILITATIONS: Record<string, string> = {
    Sun: "Libra", Moon: "Scorpio", Mars: "Cancer", Mercury: "Pisces",
    Jupiter: "Capricorn", Venus: "Virgo", Saturn: "Aries",
  };

  if (EXALTATIONS[planet] === sign) return "exalted";
  if (DEBILITATIONS[planet] === sign) return "debilitated";
  if (SIGN_RULERS[sign] === planet) return "own";
  return "neutral";
}

function dignityMultiplier(status: string): number {
  switch (status) {
    case "exalted": return 1.5;
    case "own": return 1.25;
    case "neutral": return 1.0;
    case "debilitated": return 0.6;
    default: return 1.0;
  }
}

function nakshatraMultiplier(nakshatraName: string): number {
  const profile = NAKSHATRAS[nakshatraName];
  if (!profile) return 1.0;
  return calculateNakshatraModifier(profile);
}

async function analyzeGame(
  date: Date,
  lat: number,
  lon: number,
  favorite: string,
  underdog: string
) {
  const result = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });
  const planets = result.planets;

  const { transformChartToFlatPlane } = await import("./coordinateTransformer");
  const localHours = (date.getUTCHours() + date.getUTCMinutes() / 60) % 24;
  const flatChart = transformChartToFlatPlane(lat, lon, localHours, 300, 1, 0);

  const planarAscendant = flatChart.planarAscendant;
  const adjustedCusps = [];
  for (let i = 0; i < 12; i++) {
    adjustedCusps.push((planarAscendant + i * 30) % 360);
  }

  const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  const houseLords = new Map<number, string>();
  for (let i = 0; i < 12; i++) {
    const cusp = adjustedCusps[i];
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] || "Aries";
    const ruler = SIGN_RULERS[sign];
    if (ruler) houseLords.set(i + 1, ruler);
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

  const planetsInHouses = planets.map((p) => ({
    planet: p.name,
    house: getPlanarHouse(p.eclipticLon),
    sign: p.sign,
    degree: p.degreeInSign,
    eclipticLon: p.eclipticLon,
    isRetrograde: p.retrograde,
    nakshatra: getNakshatraAt(p.eclipticLon).nakshatra.name,
  }));

  const houseLordsList = Array.from(houseLords.entries())
    .map(([house, lordName]) => {
      const placement = planetsInHouses.find((p) => p.planet === lordName);
      if (!placement) return null;
      return { house, lordPlanet: lordName, placement };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  // Analyze each lord
  console.log("\n" + "═".repeat(120));
  console.log(`MULTIPLIER BREAKDOWN: ${favorite} vs ${underdog}`);
  console.log("═".repeat(120));

  let sideATotal = 0;
  let sideBTotal = 0;

  for (const lord of houseLordsList) {
    const ruledSide = SIDE_A_HOUSES.includes(lord.house) ? "A" : SIDE_B_HOUSES.includes(lord.house) ? "B" : "N";
    if (ruledSide === "N") continue;

    const occupiedHouse = lord.placement.house;
    const occupiedSide = SIDE_A_HOUSES.includes(occupiedHouse) ? "A" : SIDE_B_HOUSES.includes(occupiedHouse) ? "B" : "N";
    if (occupiedSide === "N") continue;

    const basePoints = getBasePoints(occupiedHouse);
    const placementBonus = getPlacementBonus(occupiedHouse);

    const dignityStatus = getDignityStatus(lord.lordPlanet, lord.placement.sign);
    const dMult = dignityMultiplier(dignityStatus);
    const nMult = nakshatraMultiplier(lord.placement.nakshatra);
    const starAmp = getFixedStarAmplification(lord.placement.eclipticLon, 1.0);
    const nDignity = 1 + getNakshatraDignity(lord.placement.nakshatra) * 0.1;
    const lordSupport = 1 + getNakshatraLordStrength(lord.placement.nakshatra, dMult) * 0.5;

    const signLord = SIGN_RULERS[lord.placement.sign] as string || "Sun";
    const nakshatraLord = getNakshatraLord(lord.placement.nakshatra) as string || "Sun";
    const frictionResult = getSignNakshatraFriction(signLord, nakshatraLord);
    const frictionMult = frictionResult.multiplier;

    const controllingGain = (basePoints + placementBonus) * dMult * nMult * frictionMult * starAmp * nDignity * lordSupport;

    const side = occupiedSide === "A" ? favorite : underdog;
    const occupiedSideStr = occupiedSide === "A" ? favorite : underdog;

    console.log(`\nH${lord.house} Lord: ${lord.lordPlanet.padEnd(8)} → H${occupiedHouse} (${occupiedSideStr})`);
    console.log(`  Sign: ${lord.placement.sign.padEnd(12)} Nakshatra: ${lord.placement.nakshatra.padEnd(15)}`);
    console.log(`  Base: ${basePoints} + Placement: ${placementBonus} = ${basePoints + placementBonus}`);
    console.log(`  Dignity (${dignityStatus.padEnd(12)}): ${dMult.toFixed(2)}`);
    console.log(`  Nakshatra Mult:                    ${nMult.toFixed(3)}`);
    console.log(`  Friction (${frictionResult.status.padEnd(20)}): ${frictionMult.toFixed(2)}`);
    console.log(`  Fixed Star:                        ${starAmp.toFixed(3)}`);
    console.log(`  Nakshatra Dignity:                 ${nDignity.toFixed(3)}`);
    console.log(`  Lord Support:                      ${lordSupport.toFixed(3)}`);
    console.log(`  FINAL GAIN: (${basePoints}+${placementBonus}) × ${dMult.toFixed(2)} × ${nMult.toFixed(3)} × ${frictionMult.toFixed(2)} × ${starAmp.toFixed(3)} × ${nDignity.toFixed(3)} × ${lordSupport.toFixed(3)} = ${controllingGain.toFixed(2)}`);

    if (occupiedSide === "A") sideATotal += controllingGain;
    else sideBTotal += controllingGain;
  }

  console.log("\n" + "─".repeat(120));
  console.log(`${favorite.padEnd(30)} ${sideATotal.toFixed(2)}`);
  console.log(`${underdog.padEnd(30)} ${sideBTotal.toFixed(2)}`);
  console.log(`PREDICTION: ${sideATotal > sideBTotal ? favorite : underdog} (margin: ${Math.abs(sideATotal - sideBTotal).toFixed(2)})`);
  console.log("═".repeat(120));
}

async function run() {
  // Dodgers @ Yankees
  await analyzeGame(
    new Date(Date.UTC(2024, 5, 8, 23, 35, 0)),
    40.8295, -73.9262,
    "New York Yankees",
    "Los Angeles Dodgers"
  );
}

run().catch(console.error);
