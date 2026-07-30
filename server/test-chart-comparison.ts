/**
 * DUAL CHART READING TEST
 * Shows how ephemeris houses vs flat-plane transformer calculate your chart
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS } from "./astroEngine";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function compareCharts() {
  const date = new Date(Date.UTC(1986, 10, 20, 16, 6, 0)); // Nov 20, 1986, 10:06 AM CST = 4:06 PM UTC
  const lat = 32.7767;  // Dallas, TX
  const lon = -96.7970;

  const ephResult = await calculateChart(date, { latitude: lat, longitude: lon, altitude: 0 });

  console.log("\n" + "═".repeat(120));
  console.log("YOUR NATAL CHART: November 20, 1986, 10:06 AM CDT, Dallas, TX");
  console.log("═".repeat(120));

  // ──────────────────────────────────────────────────────────────────────────────────────
  // METHOD 1: EPHEMERIS HOUSES (from astronomy-engine)
  // ──────────────────────────────────────────────────────────────────────────────────────
  console.log("\n┌─ METHOD 1: EPHEMERIS HOUSES (astronomy-engine) ────────────────────────────┐");
  console.log("│ (Standard astronomical house cusps)                                          │");

  const ZODIAC = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];

  console.log("\n│ HOUSE CUSPS:");
  for (let i = 0; i < 12; i++) {
    const lon = ephResult.houses.cusps[i];
    const signIdx = Math.floor(lon / 30);
    const deg = lon % 30;
    const sign = ZODIAC[signIdx];
    console.log(`│   H${(i + 1).toString().padStart(2)}:  ${lon.toFixed(2).padStart(8)}°  (${deg.toFixed(2).padStart(6)}° ${sign})`);
  }

  console.log("\n│ PLANET POSITIONS:");
  const planets = ephResult.planets;
  for (const p of planets) {
    const signIdx = Math.floor(p.eclipticLon / 30);
    const deg = p.eclipticLon % 30;
    const sign = ZODIAC[signIdx];

    // Calculate house using ephemeris cusps
    let house = 1;
    for (let i = 0; i < 12; i++) {
      const start = ephResult.houses.cusps[i];
      const end = ephResult.houses.cusps[(i + 1) % 12];
      if (start <= end) {
        if (p.eclipticLon >= start && p.eclipticLon < end) {
          house = i + 1;
          break;
        }
      } else {
        if (p.eclipticLon >= start || p.eclipticLon < end) {
          house = i + 1;
          break;
        }
      }
    }

    console.log(`│   ${p.name.padEnd(8)} ${p.eclipticLon.toFixed(2).padStart(8)}°  (${deg.toFixed(2).padStart(6)}° ${sign.padEnd(12)}) → H${house}`);
  }

  // ──────────────────────────────────────────────────────────────────────────────────────
  // METHOD 2: FLAT-PLANE TRANSFORMER (your system)
  // ──────────────────────────────────────────────────────────────────────────────────────
  console.log("\n└────────────────────────────────────────────────────────────────────────────┘\n");
  console.log("┌─ METHOD 2: FLAT-PLANE TRANSFORMER (Your Coordinate System) ──────────────┐");

  const { transformChartToFlatPlane } = await import("./coordinateTransformer");
  const localHours = (date.getUTCHours() + date.getUTCMinutes() / 60) % 24;
  const flatChart = transformChartToFlatPlane(lat, lon, localHours, 300, 1, 0);

  const planarAscendant = flatChart.planarAscendant;
  const adjustedCusps = [];
  for (let i = 0; i < 12; i++) {
    adjustedCusps.push((planarAscendant + i * 30) % 360);
  }

  console.log(`│ Planar Ascendant: ${planarAscendant.toFixed(2)}°`);
  console.log("\n│ ADJUSTED CUSPS (30° intervals from planar ascendant):");
  for (let i = 0; i < 12; i++) {
    const lon = adjustedCusps[i];
    const signIdx = Math.floor(lon / 30);
    const deg = lon % 30;
    const sign = ZODIAC[signIdx % 12];
    console.log(`│   H${(i + 1).toString().padStart(2)}:  ${lon.toFixed(2).padStart(8)}°  (${deg.toFixed(2).padStart(6)}° ${sign})`);
  }

  console.log("\n│ PLANET POSITIONS (calculated to flat-plane houses):");
  for (const p of planets) {
    const signIdx = Math.floor(p.eclipticLon / 30);
    const deg = p.eclipticLon % 30;
    const sign = ZODIAC[signIdx];

    // Calculate house using flat-plane cusps
    let house = 1;
    for (let i = 0; i < 12; i++) {
      const start = adjustedCusps[i];
      const end = adjustedCusps[(i + 1) % 12];
      if (start <= end) {
        if (p.eclipticLon >= start && p.eclipticLon < end) {
          house = i + 1;
          break;
        }
      } else {
        if (p.eclipticLon >= start || p.eclipticLon < end) {
          house = i + 1;
          break;
        }
      }
    }

    console.log(`│   ${p.name.padEnd(8)} ${p.eclipticLon.toFixed(2).padStart(8)}°  (${deg.toFixed(2).padStart(6)}° ${sign.padEnd(12)}) → H${house}`);
  }

  // ──────────────────────────────────────────────────────────────────────────────────────
  // COMPARISON
  // ──────────────────────────────────────────────────────────────────────────────────────
  console.log("\n└────────────────────────────────────────────────────────────────────────────┘\n");
  console.log("┌─ COMPARISON: DIFFERENCES ────────────────────────────────────────────────┐");
  console.log(`│ Ephemeris Ascendant:  ${ephResult.houses.cusps[0].toFixed(2).padStart(8)}°`);
  console.log(`│ Planar Ascendant:     ${planarAscendant.toFixed(2).padStart(8)}°`);
  console.log(`│ Difference:           ${Math.abs(ephResult.houses.cusps[0] - planarAscendant).toFixed(2).padStart(8)}°`);
  console.log("└────────────────────────────────────────────────────────────────────────────┘");

  console.log("\n" + "═".repeat(120));
}

compareCharts().catch(console.error);
