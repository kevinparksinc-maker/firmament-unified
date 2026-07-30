/**
 * YOUR NATAL CHART ON THE ROYAL STAR FIXED WHEEL
 * November 20, 1986, 10:06 AM CDT, Dallas, TX
 */

import { calculateChart } from "./ephemeris";
import { mapToRoyalStarWheel, transformChartToFlatPlane } from "./coordinateTransformer";
import { getNakshatraAt } from "./nakshatra";

const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hastha", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanistha", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

async function showNatalChartRoyalWheel() {
  const date = new Date(Date.UTC(1986, 10, 20, 16, 6, 0)); // Nov 20, 1986, 10:06 AM CDT
  const lat = 32.7767;  // Dallas, TX
  const lon = -96.7970;

  const ephResult = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });

  const { transformChartToFlatPlane } = await import("./coordinateTransformer");
  const localHours = (date.getUTCHours() + date.getUTCMinutes() / 60) % 24;
  const flatChart = transformChartToFlatPlane(lat, lon, localHours, 300, 1, 0);
  const planarAscendant = flatChart.planarAscendant;

  console.log("\n" + "═".repeat(160));
  console.log("YOUR NATAL CHART ON THE ROYAL STAR FIXED WHEEL");
  console.log("November 20, 1986, 10:06 AM CDT, Dallas, Texas");
  console.log("═".repeat(160));

  // Calculate house cusps on the wheel
  const adjustedCusps = [];
  for (let i = 0; i < 12; i++) {
    adjustedCusps.push((planarAscendant + i * 30) % 360);
  }

  console.log("\n┌─ PLANAR ASCENDANT & HOUSE CUSPS (on Royal Star Wheel) ─────────────────────────────┐");
  console.log(`│ Planar Ascendant (from flat-plane geometry): ${planarAscendant.toFixed(2).padStart(8)}°`);
  console.log(`│`);
  console.log(`│ HOUSE CUSPS ON ROYAL STAR WHEEL:`);

  const ZODIAC = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
                  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  for (let i = 0; i < 12; i++) {
    const wheelDeg = adjustedCusps[i];
    const signIdx = Math.floor(wheelDeg / 30);
    const degInSign = wheelDeg % 30;
    const sign = ZODIAC[signIdx % 12];
    console.log(`│   H${(i + 1).toString().padStart(2)} Cusp: ${wheelDeg.toFixed(2).padStart(8)}°  (${degInSign.toFixed(1).padStart(5)}° ${sign})`);
  }
  console.log("└──────────────────────────────────────────────────────────────────────────────────────┘");

  // Planet positions
  console.log("\n┌─ PLANETS ON THE ROYAL STAR FIXED WHEEL ────────────────────────────────────────────┐");
  console.log("│");
  console.log("│ SIDEREAL → ROYAL WHEEL MAPPING (with Nakshatra)");
  console.log("│");

  for (const planet of ephResult.planets) {
    const siderealDeg = planet.eclipticLon;
    const wheelDeg = mapToRoyalStarWheel(siderealDeg);

    const siderealSign = Math.floor(siderealDeg / 30);
    const siderealDegInSign = siderealDeg % 30;
    const siderealZodiac = ZODIAC[siderealSign];

    const wheelSign = Math.floor(wheelDeg / 30);
    const wheelDegInSign = wheelDeg % 30;
    const wheelZodiac = ZODIAC[wheelSign % 12];

    const nakshatra = getNakshatraAt(siderealDeg).nakshatra.name;
    const nakshatraIndex = Math.floor(siderealDeg / (360 / 27));

    console.log(`│ ${planet.name.padEnd(8)} │ Sidereal: ${siderealDeg.toFixed(2).padStart(8)}° (${siderealDegInSign.toFixed(1).padStart(5)}° ${siderealZodiac.padEnd(12)}) [${nakshatra.padEnd(20)}]`);
    console.log(`│           │ Royal Wheel: ${wheelDeg.toFixed(2).padStart(8)}° (${wheelDegInSign.toFixed(1).padStart(5)}° ${wheelZodiac.padEnd(12)}) [Nakshatra ${nakshatraIndex.toString().padStart(2)}]`);
    console.log(`│`);
  }

  console.log("└──────────────────────────────────────────────────────────────────────────────────────┘");

  // Royal Star Grid
  console.log("\n┌─ ROYAL STAR FIXED WHEEL ANCHORS (Your Reference Grid) ─────────────────────────────┐");
  console.log("│");
  console.log("│   EAST (Aldebaran):      0° / 360°    ← 3 o'clock");
  console.log("│   NORTH (Regulus):       90°           ← 12 o'clock");
  console.log("│   WEST (Antares):        180°          ← 9 o'clock");
  console.log("│   SOUTH (Fomalhaut):     270°          ← 6 o'clock");
  console.log("│");
  console.log("│   Offset Applied: -45° (Aldebaran mapped to 0°)");
  console.log("│   Grid Rotation: All nakshatras preserved through rotation");
  console.log("│");
  console.log("└──────────────────────────────────────────────────────────────────────────────────────┘\n");

  // Quick interpretation
  console.log("┌─ YOUR CHART SNAPSHOT ──────────────────────────────────────────────────────────────┐");
  console.log("│");
  const sunWheelSign = ZODIAC[Math.floor(mapToRoyalStarWheel(ephResult.planets[0].eclipticLon) / 30)];
  const moonWheelSign = ZODIAC[Math.floor(mapToRoyalStarWheel(ephResult.planets[1].eclipticLon) / 30)];
  console.log(`│ Sun:  Scorpio (sidereal) → ${sunWheelSign.padEnd(12)} (Royal Wheel)`);
  console.log(`│ Moon: Gemini (sidereal)  → ${moonWheelSign.padEnd(12)} (Royal Wheel)`);
  console.log(`│ Ascendant: ${planarAscendant.toFixed(2)}° on Royal Wheel`);
  console.log("│");
  console.log("└──────────────────────────────────────────────────────────────────────────────────────┘\n");

  console.log("═".repeat(160));
}

showNatalChartRoyalWheel().catch(console.error);
