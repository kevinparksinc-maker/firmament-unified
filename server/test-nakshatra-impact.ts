/**
 * TEST: Nakshatra Modifier Impact
 *
 * Shows the difference in territorial control scores WITH and WITHOUT
 * the nakshatra behavioral modifier, using a real game scenario.
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS, SIGN_ORDER } from "./astroEngine";
import { calculateTerritorialControl } from "./territorialControlEngine";
import { getNakshatraAt } from "./nakshatra";
import { NAKSHATRAS, calculateNakshatraModifier } from "./nakshatraData";

async function testNakshatraImpact() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("TEST: NAKSHATRA MODIFIER IMPACT ON TERRITORIAL CONTROL");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Use the Mets vs Phillies game (July 16, 2026, 6:30 PM ET)
  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = {
    latitude: 39.9526,
    longitude: -75.1652,
    altitude: 0,
  };

  const ephemerisResult = await calculateChart(date, observer);
  const planets = ephemerisResult.planets;
  const houses = ephemerisResult.houses;

  // Convert to object
  const chart: Record<string, any> = {};
  planets.forEach((p) => {
    chart[p.name] = p;
  });

  // Build house lords map
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
  const houseLords = new Map<number, string>();
  for (let i = 0; i < 12; i++) {
    const cusp = houses.cusps[i]!;
    const signIndex = Math.floor(cusp / 30);
    const sign = ZODIAC_SIGNS[signIndex] ?? "Aries";
    const ruler = SIGN_RULERS[sign];
    if (ruler) {
      houseLords.set(i + 1, ruler);
    }
  }

  // Calculate territorial control WITH nakshatra modifier
  const withModifier = calculateTerritorialControl(chart, houseLords);

  console.log("TERRITORIAL CONTROL WITH NAKSHATRA MODIFIER:");
  console.log("─────────────────────────────────────────────");
  console.log(`Phillies: ${withModifier.sideATotal.toFixed(2)}`);
  console.log(`Mets:     ${withModifier.sideBTotal.toFixed(2)}`);
  console.log(`Margin:   ${withModifier.margin.toFixed(2)}\n`);

  // Simulate WITHOUT nakshatra modifier (base points only)
  let philliesBase = 0;
  let metsBase = 0;

  withModifier.sideAEvals.forEach((e) => {
    philliesBase += e.basePoints;
  });

  withModifier.sideBEvals.forEach((e) => {
    metsBase += e.basePoints;
  });

  console.log("TERRITORIAL CONTROL WITHOUT NAKSHATRA MODIFIER (BASE POINTS ONLY):");
  console.log("─────────────────────────────────────────────────────────────────");
  console.log(`Phillies: ${philliesBase.toFixed(0)}`);
  console.log(`Mets:     ${metsBase.toFixed(0)}`);
  console.log(`Margin:   ${Math.abs(philliesBase - metsBase).toFixed(0)}\n`);

  // Calculate impact per lord
  console.log("NAKSHATRA MODIFIER BREAKDOWN (showing swing in execution quality):");
  console.log("───────────────────────────────────────────────────────────────");

  const allEvals = [...withModifier.sideAEvals, ...withModifier.sideBEvals];

  let totalPhilliesSwing = 0;
  let totalMetsSwing = 0;

  allEvals.forEach((e) => {
    if (e.nakshatraModifier) {
      const swing = e.points - e.basePoints;
      if (e.houseNumber <= 6 || [10, 11].includes(e.houseNumber)) {
        totalPhilliesSwing += swing;
      } else {
        totalMetsSwing += swing;
      }

      const sideLabel = e.houseNumber <= 6 || [10, 11].includes(e.houseNumber) ? "Phillies" : "Mets";
      console.log(
        `${sideLabel.padEnd(10)} H${e.houseNumber} ${e.lord.padEnd(10)} (${e.nakshatraName}): ` +
        `base ${e.basePoints > 0 ? "+" : ""}${e.basePoints.toFixed(0)} ` +
        `→ ${e.points > 0 ? "+" : ""}${e.points.toFixed(2)} ` +
        `[${swing > 0 ? "+" : ""}${swing.toFixed(2)} from ${e.nakshatraModifier.toFixed(3)}x]`
      );
    }
  });

  console.log("\n");
  console.log("SUMMARY:");
  console.log("────────");
  console.log(`Score WITHOUT modifier: Phillies ${philliesBase}, Mets ${metsBase} (margin ${Math.abs(philliesBase - metsBase)})`);
  console.log(`Score WITH modifier:    Phillies ${withModifier.sideATotal.toFixed(2)}, Mets ${withModifier.sideBTotal.toFixed(2)} (margin ${withModifier.margin.toFixed(2)})`);
  console.log(
    `\nNakshatra impact: Phillies ${totalPhilliesSwing > 0 ? "+" : ""}${totalPhilliesSwing.toFixed(2)}, Mets ${totalMetsSwing > 0 ? "+" : ""}${totalMetsSwing.toFixed(2)}`
  );

  const philliesDelta = withModifier.sideATotal - philliesBase;
  const metsDelta = withModifier.sideBTotal - metsBase;

  if (philliesDelta !== 0 || metsDelta !== 0) {
    console.log(`\nModifier CHANGED THE MARGIN by ${Math.abs(withModifier.margin - Math.abs(philliesBase - metsBase)).toFixed(2)} points`);
    if (metsDelta > philliesDelta) {
      console.log(
        `The Mets benefited more from their nakshatras (+${(metsDelta - philliesDelta).toFixed(2)} relative advantage)`
      );
    } else if (philliesDelta > metsDelta) {
      console.log(
        `The Phillies benefited more from their nakshatras (+${(philliesDelta - metsDelta).toFixed(2)} relative advantage)`
      );
    }
  }

  console.log("\nACTUAL RESULT: Mets 3-0 (Phillies lost)");
}

testNakshatraImpact().catch(console.error);
