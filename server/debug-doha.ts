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
  if (SIGN_RULERS[sign] === planet) return "Own";
  return "Neutral";
}

function dignityScore(planet: string, sign: string): number {
  const status = getDignityStatus(planet, sign);
  switch (status) {
    case "Exalted": return 3;
    case "Own": return 2;
    case "Neutral": return 0;
    case "Debilitated": return -3;
    default: return 0;
  }
}

function houseTypeMagnitude(house: number): number {
  if ([1, 4, 7, 10].includes(house)) return 3;
  if ([2, 5, 8, 11].includes(house)) return 2;
  return 1;
}

function whichSide(house: number): "A" | "B" | "neutral" {
  if (SIDE_A_HOUSES.includes(house)) return "A";
  if (SIDE_B_HOUSES.includes(house)) return "B";
  return "neutral";
}

async function debug() {
  const date = new Date(Date.UTC(2026, 1, 19, 19, 15, 0));
  const lat = 25.276;
  const lon = 51.516;

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

  console.log("\n" + "═".repeat(100));
  console.log("DOHA CHART DEBUG — Layer 1 Scoring");
  console.log("═".repeat(100));

  let sideATotal = 0, sideBTotal = 0;

  console.log("\nSIDE A HOUSES (1, 3, 6, 10, 11) — Sinner:\n");
  for (const houseNum of SIDE_A_HOUSES) {
    const lord = houseLords.get(houseNum);
    if (!lord) continue;

    const side = whichSide(lord.placement.house);
    const dignity = dignityScore(lord.planet, lord.placement.sign);
    const houseMag = houseTypeMagnitude(lord.placement.house);
    const nak = getNakshatraAt(lord.placement.eclipticLon);
    const nakProfile = NAKSHATRAS[nak.nakshatra.name];
    const nakMult = nakProfile ? calculateNakshatraModifier(nakProfile) : 1.0;

    const strength = (dignity + houseMag) * nakMult;
    const dinStatus = getDignityStatus(lord.planet, lord.placement.sign);

    console.log(`  H${houseNum} (${lord.planet}): sits in H${lord.placement.house} (${side}) ${lord.placement.sign}`);
    console.log(`    Dignity: ${dignity} (${dinStatus}), House Mag: ${houseMag}, Nak Mult: ${nakMult.toFixed(3)}`);
    console.log(`    Strength: (${dignity}+${houseMag})×${nakMult.toFixed(3)} = ${strength.toFixed(3)} → ${side}`);

    if (side === "A") sideATotal += strength;
    else if (side === "B") sideBTotal += strength;
    console.log();
  }

  console.log("SIDE B HOUSES (7, 9, 12, 4, 5) — Mensik:\n");
  for (const houseNum of SIDE_B_HOUSES) {
    const lord = houseLords.get(houseNum);
    if (!lord) continue;

    const side = whichSide(lord.placement.house);
    const dignity = dignityScore(lord.planet, lord.placement.sign);
    const houseMag = houseTypeMagnitude(lord.placement.house);
    const nak = getNakshatraAt(lord.placement.eclipticLon);
    const nakProfile = NAKSHATRAS[nak.nakshatra.name];
    const nakMult = nakProfile ? calculateNakshatraModifier(nakProfile) : 1.0;

    const strength = (dignity + houseMag) * nakMult;
    const dinStatus = getDignityStatus(lord.planet, lord.placement.sign);

    console.log(`  H${houseNum} (${lord.planet}): sits in H${lord.placement.house} (${side}) ${lord.placement.sign}`);
    console.log(`    Dignity: ${dignity} (${dinStatus}), House Mag: ${houseMag}, Nak Mult: ${nakMult.toFixed(3)}`);
    console.log(`    Strength: (${dignity}+${houseMag})×${nakMult.toFixed(3)} = ${strength.toFixed(3)} → ${side}`);

    if (side === "A") sideATotal += strength;
    else if (side === "B") sideBTotal += strength;
    console.log();
  }

  console.log("═".repeat(100));
  console.log(`SIDE A (Sinner) TOTAL: ${sideATotal.toFixed(3)}`);
  console.log(`SIDE B (Mensik) TOTAL: ${sideBTotal.toFixed(3)}`);
  console.log(`MARGIN: ${(sideATotal - sideBTotal).toFixed(3)} (${sideATotal > sideBTotal ? "Sinner wins" : "Mensik wins"})`);
  console.log("═".repeat(100) + "\n");
}

debug().catch(console.error);
