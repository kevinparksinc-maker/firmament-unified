/**
 * LINEUP DIAGNOSTIC
 *
 * Part 1: Houses 1-12 with their signs and conditions
 * Part 2: Planets with what they rule and their conditions
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS, EXALTATIONS, DEBILITATIONS } from "./astroEngine";
import { detectFixedStars } from "./fixedStarDetection";
import type { PlanetPosition } from "./ephemeris";

async function lineupDiagnostic() {
  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = {
    latitude: 39.9526,
    longitude: -75.1652,
    altitude: 0,
  };

  const ephResult = await calculateChart(date, observer);
  const planetsArray = ephResult.planets;
  const houses = ephResult.houses;

  const planets: Record<string, PlanetPosition> = {};
  planetsArray.forEach((p) => {
    planets[p.name] = p;
  });

  const fixedStars = detectFixedStars(planetsArray);

  const ZODIAC = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];

  // ─────────────────────────────────────────────────────────────
  // PART 1: HOUSES 1-12
  // ─────────────────────────────────────────────────────────────

  console.log("════════════════════════════════════════════════════════════════");
  console.log("PART 1: HOUSES 1-12 WITH SIGNS AND CONDITIONS");
  console.log("════════════════════════════════════════════════════════════════\n");

  for (let h = 1; h <= 12; h++) {
    const lon = houses.cusps[h - 1]!;
    const signIdx = Math.floor(lon / 30);
    const sign = ZODIAC[signIdx] ?? "Aries";
    const degree = lon % 30;
    const ruler = SIGN_RULERS[sign] || "Unknown";

    let houseType = "";
    if (h === 1 || h === 7 || h === 4 || h === 10) houseType = "ANGLE";
    if (h === 2 || h === 5 || h === 8 || h === 11) houseType = "SUCCEDENT";
    if (h === 3 || h === 6 || h === 9 || h === 12) houseType = "CADENT";

    console.log(`H${h.toString().padStart(2)} | ${sign.padEnd(12)} ${degree.toFixed(1).padStart(5)}° | Ruler: ${ruler.padEnd(9)} | ${houseType}`);
  }

  // ─────────────────────────────────────────────────────────────
  // PART 2: PLANETS AND WHAT THEY RULE
  // ─────────────────────────────────────────────────────────────

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("PART 2: PLANETS AND WHAT THEY RULE");
  console.log("════════════════════════════════════════════════════════════════\n");

  // Build ruler to houses map
  const rulerHouses: Record<string, number[]> = {};
  for (let h = 1; h <= 12; h++) {
    const lon = houses.cusps[h - 1]!;
    const signIdx = Math.floor(lon / 30);
    const sign = ZODIAC[signIdx] ?? "Aries";
    const ruler = SIGN_RULERS[sign];
    if (ruler) {
      if (!rulerHouses[ruler]) rulerHouses[ruler] = [];
      rulerHouses[ruler].push(h);
    }
  }

  // Get all unique planets
  const allPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Rahu", "Ketu"];

  for (const planetName of allPlanets) {
    const p = planets[planetName];
    if (!p) continue;

    const rulesHouses = rulerHouses[planetName] || [];
    const rulesStr = rulesHouses.length > 0 ? `H${rulesHouses.join(", H")}` : "—";

    // Determine dignity
    let dignity = "";
    if (EXALTATIONS[planetName] === p.sign) {
      dignity = "EXALTED";
    } else if (DEBILITATIONS[planetName] === p.sign) {
      dignity = "FALL";
    } else if (SIGN_RULERS[p.sign] === planetName) {
      dignity = "OWN SIGN";
    } else {
      dignity = "PEREGRINE";
    }

    // Check for fixed star
    const starsOnPlanet = fixedStars.filter((s) => s.planet === planetName);
    const starStr = starsOnPlanet.length > 0 ? `, ✦${starsOnPlanet.map((s) => s.name).join(", ")}` : "";

    // Retrograde
    const rxStr = p.retrograde ? " Rx" : "";

    console.log(`${planetName.padEnd(9)} | Rules: ${rulesStr.padEnd(15)} | Position: ${p.sign} ${p.degreeInSign.toFixed(1)}° H${p.house}${rxStr} | ${dignity}${starStr}`);
  }

  // ─────────────────────────────────────────────────────────────
  // SUMMARY TABLE
  // ─────────────────────────────────────────────────────────────

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("QUICK REFERENCE: RULER → HOUSES & POSITION");
  console.log("════════════════════════════════════════════════════════════════\n");

  console.log(
    `${"Planet".padEnd(10)} ${"Rules".padEnd(20)} ${"Now In".padEnd(15)} ${"Status"}`
  );
  console.log("─".repeat(80));

  for (const planetName of allPlanets) {
    const p = planets[planetName];
    if (!p) continue;

    const rulesHouses = rulerHouses[planetName] || [];
    const rulesStr = rulesHouses.length > 0 ? `H${rulesHouses.join(", H")}` : "—";
    const posStr = `${p.sign} H${p.house}`;

    let status = "";
    if (EXALTATIONS[planetName] === p.sign) {
      status = "EXALTED";
    } else if (DEBILITATIONS[planetName] === p.sign) {
      status = "FALL";
    } else if (SIGN_RULERS[p.sign] === planetName) {
      status = "OWN";
    } else {
      status = "PEREGRINE";
    }

    if (p.retrograde) status += " Rx";

    const starsOnPlanet = fixedStars.filter((s) => s.planet === planetName);
    if (starsOnPlanet.length > 0) {
      status += ` ✦${starsOnPlanet[0].name}`;
    }

    console.log(
      `${planetName.padEnd(10)} ${rulesStr.padEnd(20)} ${posStr.padEnd(15)} ${status}`
    );
  }
}

lineupDiagnostic();
