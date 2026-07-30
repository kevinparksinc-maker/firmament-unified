/**
 * DEBUG: Check which planets are assigned as lords and their nakshatras
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS, SIGN_ORDER } from "./astroEngine";
import { getNakshatraAt } from "./nakshatra";
import { NAKSHATRAS } from "./nakshatraData";

async function debugLords() {
  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = {
    latitude: 39.9526,
    longitude: -75.1652,
    altitude: 0,
  };

  const ephemerisResult = await calculateChart(date, observer);
  const planets = ephemerisResult.planets;
  const houses = ephemerisResult.houses;

  console.log("House Cusps and their Rulers:");
  console.log("─────────────────────────────");

  const ZODIAC_SIGNS = [
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

  for (let i = 0; i < 12; i++) {
    const cusp = houses.cusps[i]!;
    const signIndex = Math.floor(cusp / 30) % 12;
    const sign = ZODIAC_SIGNS[signIndex] ?? "Aries";
    const ruler = SIGN_RULERS[sign];
    const degree = Math.floor(cusp % 30);

    const rulesPlanet = planets.find((p) => p.name === ruler);
    const ruleLon = rulesPlanet?.lon ?? 0;

    console.log(`H${(i + 1).toString().padStart(2)} cusp ${cusp.toFixed(1)}° (${sign} ${degree}°)  → ruler ${ruler} @ ${ruleLon.toFixed(1)}°`);

    if (rulesPlanet) {
      const { nakshatra } = getNakshatraAt(ruleLon);
      const profile = NAKSHATRAS[nakshatra.name];
      console.log(`       [${nakshatra.name}] Init=${profile.initiative} PR=${profile.pressureResponse} Con=${profile.consistency} Fin=${profile.finishingAbility}`);
    }
  }

  console.log("\n\nAll Planets in Chart:");
  console.log("────────────────────");
  planets.forEach((p) => {
    const { nakshatra } = getNakshatraAt(p.lon);
    const profile = NAKSHATRAS[nakshatra.name];
    console.log(
      `${p.name.padEnd(10)} @ ${p.lon.toFixed(1).padStart(6)}° in H${p.house}  [${nakshatra.name.padEnd(16)}] Init=${profile.initiative.padEnd(9)} PR=${profile.pressureResponse}`
    );
  });
}

debugLords().catch(console.error);
