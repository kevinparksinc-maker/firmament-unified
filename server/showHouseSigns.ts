/**
 * Show House Signs and Rulers
 * Why does one planet rule multiple houses?
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS } from "./astroEngine";

async function showHouseSigns() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("HOUSE CUSPS AND RULERS");
  console.log("════════════════════════════════════════════════════════════════\n");

  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = {
    latitude: 39.9526,
    longitude: -75.1652,
    altitude: 0,
  };

  const result = await calculateChart(date, observer);
  const houses = result.houses;

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

  console.log("VEDIC SIGN RULERS (what each planet rules):\n");
  const rulerships: Record<string, string[]> = {};
  for (const [sign, ruler] of Object.entries(SIGN_RULERS)) {
    if (!rulerships[ruler]) rulerships[ruler] = [];
    rulerships[ruler].push(sign);
  }

  for (const [ruler, signs] of Object.entries(rulerships)) {
    console.log(`  ${ruler.padEnd(10)} → ${signs.join(", ")}`);
  }

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("HOUSE CUSPS (Sidereal Longitude)");
  console.log("════════════════════════════════════════════════════════════════\n");

  console.log(
    `${"House".padEnd(8)} ${"Cusp °".padEnd(10)} ${"Sign".padEnd(15)} ${"Ruler".padEnd(10)} Notes`
  );
  console.log("─".repeat(80));

  const houseRulerCount: Record<string, number[]> = {};

  for (let h = 0; h < 12; h++) {
    const lon = houses.cusps[h]!;
    const signIdx = Math.floor(lon / 30);
    const sign = ZODIAC[signIdx] ?? "Aries";
    const degree = lon % 30;
    const ruler = SIGN_RULERS[sign] || "Unknown";

    if (!houseRulerCount[ruler]) houseRulerCount[ruler] = [];
    houseRulerCount[ruler].push(h + 1);

    let notes = "";
    if (h === 0) notes = "Ascendant";
    if (h === 9) notes = "Midheaven";
    if (h === 3) notes = "IC";
    if (h === 6) notes = "Descendant";

    console.log(
      `H${(h + 1).toString().padEnd(2)}    ${lon.toFixed(1).padEnd(10)} ${sign.padEnd(15)} ${ruler.padEnd(10)} ${notes}`
    );
  }

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("WHICH HOUSES EACH PLANET RULES (in this chart)");
  console.log("════════════════════════════════════════════════════════════════\n");

  for (const [ruler, houses] of Object.entries(houseRulerCount).sort()) {
    const signs = Object.entries(SIGN_RULERS)
      .filter(([_, r]) => r === ruler)
      .map(([s, _]) => s)
      .join(", ");

    console.log(`${ruler.padEnd(10)} rules ${signs.padEnd(30)} → H${houses.join(", H")}`);
  }

  console.log("\n" + "════════════════════════════════════════════════════════════════");
  console.log("EXAMPLE: Jupiter");
  console.log("════════════════════════════════════════════════════════════════\n");

  console.log("Jupiter rules Sagittarius and Pisces (Vedic astrology).");
  console.log(
    `In this chart: H1 cusp is in Pisces (Jupiter's sign) → Jupiter rules H1`
  );
  console.log(
    `               H10 cusp is in Sagittarius (Jupiter's sign) → Jupiter rules H10`
  );
  console.log(`\nResult: Jupiter is the lord of BOTH H1 and H10`);
  console.log(`        Jupiter is currently in Leo H4 (displaced from both houses)`);
}

showHouseSigns();
