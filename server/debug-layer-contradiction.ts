/**
 * DEBUG: Trace Jupiter, Venus, Mercury through both layers
 * to see if they're being scored for opposing sides.
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS, EXALTATIONS, DEBILITATIONS } from "./astroEngine";
import { getNakshatraAt } from "./nakshatra";
import { calculateNakshatraModifier, NAKSHATRAS } from "./nakshatraData";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIDE_A_HOUSES = [1, 3, 6, 10, 11];
const SIDE_B_HOUSES = [7, 9, 12, 4, 5];

function getDignityStatus(planet: string, sign: string): string {
  if (EXALTATIONS[planet] === sign) return "Exalted";
  if (DEBILITATIONS[planet] === sign) return "Debilitated";
  if (SIGN_RULERS[sign] === planet) return "Own Sign";
  return "Neutral";
}

function dignityScore(planet: string, sign: string): number {
  const status = getDignityStatus(planet, sign);
  switch (status) {
    case "Exalted": return 3;
    case "Own Sign": return 2;
    case "Neutral": return 0;
    case "Debilitated": return -3;
    default: return 0;
  }
}

function houseTypeMagnitude(house: number): number {
  if ([1, 4, 7, 10].includes(house)) return 3; // angular
  if ([2, 5, 8, 11].includes(house)) return 2; // succedent
  return 1; // cadent
}

function territorialPoints(house: number): number {
  if (SIDE_A_HOUSES.includes(house)) return houseTypeMagnitude(house);
  if (SIDE_B_HOUSES.includes(house)) return -houseTypeMagnitude(house);
  return 0;
}

function whichSide(house: number): "A" | "B" | "neutral" {
  if (SIDE_A_HOUSES.includes(house)) return "A";
  if (SIDE_B_HOUSES.includes(house)) return "B";
  return "neutral";
}

async function debug() {
  const date = new Date(Date.UTC(2026, 5, 29, 20, 30, 0));
  const lat = 42.0909;
  const lon = -71.2643;

  const result = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });
  const planets = result.planets;
  const houses = result.houses;

  // Build house lords map
  const houseLords = new Map<number, { planet: string; placement: typeof planets[0] }>();
  for (let i = 0; i < 12; i++) {
    const cusp = houses.cusps[i];
    if (!cusp) continue;
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] || "Aries";
    const ruler = SIGN_RULERS[sign];
    const placement = planets.find(p => p.name === ruler);
    if (ruler && placement) {
      houseLords.set(i + 1, { planet: ruler, placement });
    }
  }

  console.log("\n" + "═".repeat(100));
  console.log("DEBUG: Jupiter, Venus, Mercury — Scoring Contradiction Check");
  console.log("═".repeat(100));

  const trackedPlanets = ["Jupiter", "Venus", "Mercury"];

  for (const planetName of trackedPlanets) {
    const placement = planets.find(p => p.name === planetName);
    if (!placement) continue;

    console.log(`\n### ${planetName.toUpperCase()}`);
    console.log(`Physical Position: House ${placement.house} ${placement.sign} ${placement.degreeInSign.toFixed(2)}°`);
    console.log(`Sidereal Longitude: ${placement.eclipticLon.toFixed(2)}°`);
    console.log(`Dignity: ${getDignityStatus(planetName, placement.sign)}`);

    // Find which houses this planet rules
    const ruledHouses: number[] = [];
    for (const [houseNum, lord] of houseLords) {
      if (lord.planet === planetName) {
        ruledHouses.push(houseNum);
      }
    }

    console.log(`\n**LAYER 1: Dignity + Territorial + Nakshatra (House Lords Only)**`);
    if (ruledHouses.length === 0) {
      console.log("  → Not a house lord, not scored in Layer 1");
    } else {
      for (const houseNum of ruledHouses) {
        const side = whichSide(houseNum);
        const territorial = territorialPoints(houseNum);
        const dignity = dignityScore(planetName, placement.sign);
        const nak = getNakshatraAt(placement.eclipticLon);
        const nakProfile = NAKSHATRAS[nak.nakshatra.name];
        const nakMultiplier = nakProfile ? calculateNakshatraModifier(nakProfile) : 1.0;

        const combined = (territorial + dignity) * nakMultiplier;
        const signStr = side === "A" ? "Germany" : "Paraguay";

        console.log(`  House ${houseNum} (owned by ${signStr}):`);
        console.log(`    Territorial: ${territorial}, Dignity: ${dignity}`);
        console.log(`    Nakshatra Multiplier: ${nakMultiplier.toFixed(3)}`);
        console.log(`    Score: (${territorial} + ${dignity}) × ${nakMultiplier.toFixed(3)} = ${combined.toFixed(3)} → ${signStr}`);
      }
    }

    console.log(`\n**LAYER 2: Planets-in-House (All Planets)**`);
    const sidePlacedIn = whichSide(placement.house);
    const territorial = territorialPoints(placement.house);
    const dignity = dignityScore(planetName, placement.sign);
    const nak = getNakshatraAt(placement.eclipticLon);
    const nakProfile = NAKSHATRAS[nak.nakshatra.name];
    const nakMultiplier = nakProfile ? calculateNakshatraModifier(nakProfile) : 1.0;
    const retroFlag = placement.retrograde ? -1 : 0;

    const combined = (territorial + dignity + retroFlag) * nakMultiplier;
    const signStr = sidePlacedIn === "A" ? "Germany" : "Paraguay";

    console.log(`  Physical placement in House ${placement.house} (owned by ${signStr}):`);
    console.log(`    Territorial: ${territorial}, Dignity: ${dignity}, Retrograde: ${retroFlag}`);
    console.log(`    Nakshatra Multiplier: ${nakMultiplier.toFixed(3)}`);
    console.log(`    Score: (${territorial} + ${dignity} + ${retroFlag}) × ${nakMultiplier.toFixed(3)} = ${combined.toFixed(3)} → ${signStr}`);

    // Check for contradiction
    if (ruledHouses.length > 0) {
      const layer1Side = whichSide(ruledHouses[0]);
      const layer2Side = sidePlacedIn;

      if (layer1Side !== layer2Side) {
        console.log(`\n⚠️  CONTRADICTION DETECTED:`);
        console.log(`    Layer 1 credits ${planetName} to ${layer1Side === "A" ? "GERMANY" : "PARAGUAY"} (as lord)`);
        console.log(`    Layer 2 credits ${planetName} to ${layer2Side === "A" ? "GERMANY" : "PARAGUAY"} (as placed planet)`);
        console.log(`    Same planet scored for BOTH SIDES`);
      }
    }
  }

  console.log("\n" + "═".repeat(100));
  console.log("END DEBUG");
  console.log("═".repeat(100) + "\n");
}

debug().catch(console.error);
