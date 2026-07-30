import { calculateChart } from "./ephemeris";
import { SIGN_RULERS, EXALTATIONS, DEBILITATIONS } from "./astroEngine";
import { getNakshatraAt } from "./nakshatra";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

function getDignityStatus(planet: string, sign: string): string {
  if (EXALTATIONS[planet] === sign) return "Exalted";
  if (DEBILITATIONS[planet] === sign) return "Debilitated";
  if (SIGN_RULERS[sign] === planet) return "Own Sign";

  const ownSigns = Object.entries(SIGN_RULERS)
    .filter(([_, ruler]) => ruler === planet)
    .map(([s]) => s);

  if (ownSigns.length > 0) {
    const signIndex = ZODIAC_SIGNS.indexOf(ownSigns[0]);
    const oppositeIndex = (signIndex + 6) % 12;
    const oppositeSigns = ZODIAC_SIGNS;
    if (oppositeSigns[oppositeIndex] === sign) return "Detriment";
  }

  return "Neutral";
}

async function dumpChart() {
  const date = new Date(Date.UTC(2026, 5, 29, 20, 30, 0));
  const lat = 42.0909;
  const lon = -71.2643;

  const result = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });
  const planets = result.planets;
  const houses = result.houses;

  console.log("\n" + "═".repeat(100));
  console.log("CHART: Germany vs Paraguay — World Cup Round of 32");
  console.log("Date: June 29, 2026, 4:30 PM EDT");
  console.log("Location: Gillette Stadium, Foxborough, MA (42.0909°N, 71.2643°W)");
  console.log("═".repeat(100));

  // Display all 12 houses with signs
  console.log("\n## ALL 12 HOUSES — SIGN ON CUSP\n");
  for (let i = 0; i < 12; i++) {
    const cusp = houses.cusps[i];
    if (!cusp) continue;
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] || "Aries";
    const degree = cusp % 30;
    const lord = SIGN_RULERS[sign];
    console.log(`H${i + 1}: ${sign} ${degree.toFixed(2)}° — Ruled by ${lord}`);
  }

  // Display all planets with current positions
  console.log("\n## ALL PLANETS — CURRENT POSITIONS\n");
  planets.forEach(p => {
    const nak = getNakshatraAt(p.eclipticLon);
    const retroFlag = p.retrograde ? " [RETROGRADE]" : "";
    const dignityStatus = getDignityStatus(p.name, p.sign);
    console.log(
      `${p.name.padEnd(8)} | H${p.house} ${p.sign.padEnd(12)} ${p.degreeInSign.toFixed(2)}° | ` +
      `Sidereal: ${p.eclipticLon.toFixed(2)}° | ${dignityStatus.padEnd(12)} | ` +
      `${nak.nakshatra.name} P${nak.pada}${retroFlag}`
    );
  });

  // Build house lord table for Side A (1, 3, 6, 10, 11)
  console.log("\n" + "═".repeat(100));
  console.log("SIDE A CLUSTER — Houses 1, 3, 6, 10, 11 (Germany)");
  console.log("═".repeat(100));

  const sideAHouses = [1, 3, 6, 10, 11];
  for (const houseNum of sideAHouses) {
    const cusp = houses.cusps[houseNum - 1];
    if (!cusp) continue;
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] || "Aries";
    const lord = SIGN_RULERS[sign];
    const lordPlacement = planets.find(p => p.name === lord);
    const nak = lordPlacement ? getNakshatraAt(lordPlacement.eclipticLon) : null;
    const dignity = lordPlacement ? getDignityStatus(lord, lordPlacement.sign) : "N/A";

    console.log(`\n### HOUSE ${houseNum}`);
    console.log(`- **Sign on Cusp:** ${sign} ${(cusp % 30).toFixed(2)}°`);
    console.log(`- **Lord:** ${lord}`);
    if (lordPlacement) {
      console.log(`- **Lord's Current Position:** House ${lordPlacement.house}, ${lordPlacement.sign} ${lordPlacement.degreeInSign.toFixed(2)}°`);
      console.log(`- **Lord's Sidereal Longitude:** ${lordPlacement.eclipticLon.toFixed(2)}°`);
      console.log(`- **Dignity Status:** ${dignity}`);
      console.log(`- **Nakshatra:** ${nak?.nakshatra.name} Pada ${nak?.pada}`);
      console.log(`- **Retrograde:** ${lordPlacement.retrograde ? "YES" : "No"}`);
    }
  }

  // Build house lord table for Side B (7, 9, 12, 4, 5)
  console.log("\n" + "═".repeat(100));
  console.log("SIDE B CLUSTER — Houses 7, 9, 12, 4, 5 (Paraguay)");
  console.log("═".repeat(100));

  const sideBHouses = [7, 9, 12, 4, 5];
  for (const houseNum of sideBHouses) {
    const cusp = houses.cusps[houseNum - 1];
    if (!cusp) continue;
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] || "Aries";
    const lord = SIGN_RULERS[sign];
    const lordPlacement = planets.find(p => p.name === lord);
    const nak = lordPlacement ? getNakshatraAt(lordPlacement.eclipticLon) : null;
    const dignity = lordPlacement ? getDignityStatus(lord, lordPlacement.sign) : "N/A";

    console.log(`\n### HOUSE ${houseNum}`);
    console.log(`- **Sign on Cusp:** ${sign} ${(cusp % 30).toFixed(2)}°`);
    console.log(`- **Lord:** ${lord}`);
    if (lordPlacement) {
      console.log(`- **Lord's Current Position:** House ${lordPlacement.house}, ${lordPlacement.sign} ${lordPlacement.degreeInSign.toFixed(2)}°`);
      console.log(`- **Lord's Sidereal Longitude:** ${lordPlacement.eclipticLon.toFixed(2)}°`);
      console.log(`- **Dignity Status:** ${dignity}`);
      console.log(`- **Nakshatra:** ${nak?.nakshatra.name} Pada ${nak?.pada}`);
      console.log(`- **Retrograde:** ${lordPlacement.retrograde ? "YES" : "No"}`);
    }
  }

  // Summary table - Side A
  console.log("\n" + "═".repeat(100));
  console.log("SIDE A SUMMARY TABLE");
  console.log("═".repeat(100));
  console.log("\n| House | Lord | Lord Location | Dignity | Nakshatra | Retrograde |");
  console.log("|-------|------|---------------|---------|-----------|------------|");

  for (const houseNum of sideAHouses) {
    const cusp = houses.cusps[houseNum - 1];
    if (!cusp) continue;
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] || "Aries";
    const lord = SIGN_RULERS[sign];
    const lordPlacement = planets.find(p => p.name === lord);
    const nak = lordPlacement ? getNakshatraAt(lordPlacement.eclipticLon) : null;
    const dignity = lordPlacement ? getDignityStatus(lord, lordPlacement.sign) : "N/A";

    const lordLoc = lordPlacement ? `H${lordPlacement.house} ${lordPlacement.sign}` : "N/A";
    const retro = lordPlacement?.retrograde ? "YES" : "No";

    console.log(`| ${houseNum} | ${lord} | ${lordLoc} | ${dignity} | ${nak?.nakshatra.name} | ${retro} |`);
  }

  // Summary table - Side B
  console.log("\n" + "═".repeat(100));
  console.log("SIDE B SUMMARY TABLE");
  console.log("═".repeat(100));
  console.log("\n| House | Lord | Lord Location | Dignity | Nakshatra | Retrograde |");
  console.log("|-------|------|---------------|---------|-----------|------------|");

  for (const houseNum of sideBHouses) {
    const cusp = houses.cusps[houseNum - 1];
    if (!cusp) continue;
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] || "Aries";
    const lord = SIGN_RULERS[sign];
    const lordPlacement = planets.find(p => p.name === lord);
    const nak = lordPlacement ? getNakshatraAt(lordPlacement.eclipticLon) : null;
    const dignity = lordPlacement ? getDignityStatus(lord, lordPlacement.sign) : "N/A";

    const lordLoc = lordPlacement ? `H${lordPlacement.house} ${lordPlacement.sign}` : "N/A";
    const retro = lordPlacement?.retrograde ? "YES" : "No";

    console.log(`| ${houseNum} | ${lord} | ${lordLoc} | ${dignity} | ${nak?.nakshatra.name} | ${retro} |`);
  }

  console.log("\n" + "═".repeat(100));
  console.log("CHART DUMP COMPLETE");
  console.log("═".repeat(100) + "\n");
}

dumpChart().catch(console.error);
