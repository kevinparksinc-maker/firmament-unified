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
    case "Exalted":
      return 3;
    case "Own Sign":
      return 2;
    case "Neutral":
      return 0;
    case "Debilitated":
      return -3;
    default:
      return 0;
  }
}

function houseTypeMagnitude(house: number): number {
  if ([1, 4, 7, 10].includes(house)) return 3;
  if ([2, 5, 8, 11].includes(house)) return 2;
  return 1;
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

  // Build house lords
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

  console.log("\n### LAYER 1: Dignity + Territorial + Nakshatra (House Lords Only)");
  console.log("Scoring based on WHERE PLANET IS PHYSICALLY SITTING:\n");

  let sideATotal = 0,
    sideBTotal = 0;

  // Side A houses
  console.log("SIDE A HOUSES (1, 3, 6, 10, 11):");
  for (const houseNum of SIDE_A_HOUSES) {
    const lord = houseLords.get(houseNum);
    if (!lord) continue;

    const physicalSide = whichSide(lord.placement.house);
    const territorial = territorialPoints(lord.placement.house);
    const dignity = dignityScore(lord.planet, lord.placement.sign);
    const nak = getNakshatraAt(lord.placement.eclipticLon);
    const nakProfile = NAKSHATRAS[nak.nakshatra.name];
    const nakMult = nakProfile ? calculateNakshatraModifier(nakProfile) : 1.0;
    const score = (territorial + dignity) * nakMult;

    console.log(
      `  H${houseNum} (${lord.planet}): sitting in H${lord.placement.house} (${physicalSide}), score=${score.toFixed(2)} → ${physicalSide}`
    );

    if (physicalSide === "A") sideATotal += score;
    else if (physicalSide === "B") sideBTotal += score;
  }

  // Side B houses
  console.log("\nSIDE B HOUSES (7, 9, 12, 4, 5):");
  for (const houseNum of SIDE_B_HOUSES) {
    const lord = houseLords.get(houseNum);
    if (!lord) continue;

    const physicalSide = whichSide(lord.placement.house);
    const territorial = territorialPoints(lord.placement.house);
    const dignity = dignityScore(lord.planet, lord.placement.sign);
    const nak = getNakshatraAt(lord.placement.eclipticLon);
    const nakProfile = NAKSHATRAS[nak.nakshatra.name];
    const nakMult = nakProfile ? calculateNakshatraModifier(nakProfile) : 1.0;
    const score = (territorial + dignity) * nakMult;

    console.log(
      `  H${houseNum} (${lord.planet}): sitting in H${lord.placement.house} (${physicalSide}), score=${score.toFixed(2)} → ${physicalSide}`
    );

    if (physicalSide === "A") sideATotal += score;
    else if (physicalSide === "B") sideBTotal += score;
  }

  console.log(`\nSIDE A TOTAL: ${sideATotal.toFixed(2)}`);
  console.log(`SIDE B TOTAL: ${sideBTotal.toFixed(2)}`);
  console.log(`MARGIN: ${(sideATotal - sideBTotal).toFixed(2)} (${sideATotal > sideBTotal ? "A wins" : "B wins"})`);
}

debug().catch(console.error);
