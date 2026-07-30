/**
 * YOUR COMPLETE NATAL CHART
 * November 20, 1986, 10:06 AM CDT, Dallas, Texas
 *
 * Royal Star Fixed Wheel: 0° = East (Aries), 90° = North (Cancer),
 * 180° = West (Libra), 270° = South (Capricorn)
 *
 * Sidereal positions map DIRECTLY to wheel (NO offset)
 */

import { calculateChart } from "./ephemeris";
import { transformChartToFlatPlane } from "./coordinateTransformer";
import { getNakshatraAt } from "./nakshatra";

const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hastha", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanistha", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

function getDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized >= 348.75 || normalized < 11.25) return "East";
  if (normalized >= 11.25 && normalized < 33.75) return "East-Northeast";
  if (normalized >= 33.75 && normalized < 56.25) return "Northeast";
  if (normalized >= 56.25 && normalized < 78.75) return "North-Northeast";
  if (normalized >= 78.75 && normalized < 101.25) return "North";
  if (normalized >= 101.25 && normalized < 123.75) return "North-Northwest";
  if (normalized >= 123.75 && normalized < 146.25) return "Northwest";
  if (normalized >= 146.25 && normalized < 168.75) return "West-Northwest";
  if (normalized >= 168.75 && normalized < 191.25) return "West";
  if (normalized >= 191.25 && normalized < 213.75) return "West-Southwest";
  if (normalized >= 213.75 && normalized < 236.25) return "Southwest";
  if (normalized >= 236.25 && normalized < 258.75) return "South-Southwest";
  if (normalized >= 258.75 && normalized < 281.25) return "South";
  if (normalized >= 281.25 && normalized < 303.75) return "South-Southeast";
  if (normalized >= 303.75 && normalized < 326.25) return "Southeast";
  return "East-Southeast";
}

async function showCompleteNatalChart() {
  const date = new Date(Date.UTC(1986, 10, 20, 16, 6, 0)); // Nov 20, 1986, 10:06 AM CDT
  const lat = 32.7767;  // Dallas, TX
  const lon = -96.7970;

  const ephResult = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });

  const { transformChartToFlatPlane } = await import("./coordinateTransformer");
  const localHours = (date.getUTCHours() + date.getUTCMinutes() / 60) % 24;
  const flatChart = transformChartToFlatPlane(lat, lon, localHours, 300, 1, 0);
  const planarAscendant = flatChart.planarAscendant;

  console.log("\n" + "═".repeat(180));
  console.log("YOUR COMPLETE NATAL CHART — ROYAL STAR FIXED WHEEL");
  console.log("November 20, 1986, 10:06 AM CDT, Dallas, Texas");
  console.log("═".repeat(180));

  // Planar Ascendant
  console.log("\n┌─ PLANAR ASCENDANT (From Flat-Plane Geometry) ────────────────────────────────────┐");
  const ascSign = Math.floor(planarAscendant / 30);
  const ascDegInSign = planarAscendant % 30;
  const ascDirection = getDirection(planarAscendant);
  console.log(`│ Ascendant: ${planarAscendant.toFixed(2)}°  (${ascDegInSign.toFixed(2)}° ${ZODIAC[ascSign].padEnd(12)}) → ${ascDirection}`);
  console.log("└──────────────────────────────────────────────────────────────────────────────────┘");

  // House Cusps
  console.log("\n┌─ HOUSE CUSPS (30° intervals from Planar Ascendant) ────────────────────────────────┐");
  const houseCusps = [];
  for (let i = 0; i < 12; i++) {
    const cusp = (planarAscendant + i * 30) % 360;
    houseCusps.push(cusp);
    const sign = Math.floor(cusp / 30);
    const degInSign = cusp % 30;
    const dir = getDirection(cusp);
    console.log(`│ H${(i + 1).toString().padStart(2)}: ${cusp.toFixed(2).padStart(8)}° (${degInSign.toFixed(2).padStart(5)}° ${ZODIAC[sign].padEnd(12)}) → ${dir.padEnd(20)}`);
  }
  console.log("└──────────────────────────────────────────────────────────────────────────────────┘");

  // All Planets
  console.log("\n┌─ PLANETS (All Placements on Royal Star Wheel) ────────────────────────────────────┐");
  console.log("│");

  for (const planet of ephResult.planets) {
    const wheelDeg = planet.eclipticLon; // NO offset — use sidereal directly
    const sign = Math.floor(wheelDeg / 30);
    const degInSign = wheelDeg % 30;
    const direction = getDirection(wheelDeg);

    const nakshatraData = getNakshatraAt(wheelDeg);
    const nakshatra = nakshatraData.nakshatra.name;
    const nakshatraIndex = Math.floor(wheelDeg / (360 / 27));

    console.log(`│ ${planet.name.padEnd(8)} │ ${wheelDeg.toFixed(2).padStart(8)}° (${degInSign.toFixed(2).padStart(5)}° ${ZODIAC[sign].padEnd(12)}) [${nakshatra.padEnd(20)}] → ${direction}`);
  }
  console.log("└──────────────────────────────────────────────────────────────────────────────────┘");

  // Royal Star Anchors
  console.log("\n┌─ ROYAL STAR FIXED WHEEL ANCHORS ────────────────────────────────────────────────────┐");
  console.log("│");
  console.log("│ Aldebaran (15° Taurus):   45°  → East-Northeast");
  console.log("│ Regulus (15° Leo):        135° → North-Northwest");
  console.log("│ Antares (15° Scorpio):    225° → West-Southwest");
  console.log("│ Fomalhaut (15° Aquarius): 315° → South-Southeast");
  console.log("│");
  console.log("└──────────────────────────────────────────────────────────────────────────────────┘");

  // Quick Summary
  console.log("\n┌─ YOUR NATAL PROFILE ────────────────────────────────────────────────────────────────┐");
  console.log("│");

  const sunIdx = ephResult.planets.findIndex(p => p.name === "Sun");
  const moonIdx = ephResult.planets.findIndex(p => p.name === "Moon");
  const mercuryIdx = ephResult.planets.findIndex(p => p.name === "Mercury");

  if (sunIdx >= 0) {
    const sun = ephResult.planets[sunIdx];
    const sunSign = Math.floor(sun.eclipticLon / 30);
    const sunDeg = sun.eclipticLon % 30;
    const sunDir = getDirection(sun.eclipticLon);
    console.log(`│ Sun:     ${sun.eclipticLon.toFixed(2)}° (${sunDeg.toFixed(2)}° ${ZODIAC[sunSign].padEnd(12)}) → ${sunDir}`);
  }

  if (moonIdx >= 0) {
    const moon = ephResult.planets[moonIdx];
    const moonSign = Math.floor(moon.eclipticLon / 30);
    const moonDeg = moon.eclipticLon % 30;
    const moonDir = getDirection(moon.eclipticLon);
    console.log(`│ Moon:    ${moon.eclipticLon.toFixed(2)}° (${moonDeg.toFixed(2)}° ${ZODIAC[moonSign].padEnd(12)}) → ${moonDir}`);
  }

  console.log(`│ Ascendant: ${planarAscendant.toFixed(2)}° (${ascDegInSign.toFixed(2)}° ${ZODIAC[ascSign].padEnd(12)}) → ${ascDirection}`);
  console.log("│");
  console.log("└──────────────────────────────────────────────────────────────────────────────────┘\n");

  console.log("═".repeat(180));
}

showCompleteNatalChart().catch(console.error);
