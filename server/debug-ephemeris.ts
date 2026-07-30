/**
 * Debug: What's actually coming from ephemeris?
 * Test each step of the calculation
 */

import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const Astronomy = _require("astronomy-engine");
const {
  MakeTime,
  Observer,
  SiderealTime,
  SunPosition,
  GeoVector,
  Ecliptic,
  Body,
} = Astronomy;

async function debugEphemeris() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("EPHEMERIS DEBUG — What data is coming back?");
  console.log("════════════════════════════════════════════════════════════════\n");

  // Test date: July 16, 2026, 10:30 PM UTC (6:30 PM EDT in Philadelphia)
  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  console.log(`Test Date: ${date.toISOString()}`);
  console.log(`Local: July 16, 2026, 6:30 PM EDT\n`);

  try {
    // Step 1: Make time object
    console.log("Step 1: MakeTime()");
    const time = MakeTime(date);
    console.log(`  Result: ${JSON.stringify(time)}\n`);

    // Step 2: Observer location
    console.log("Step 2: Observer (Philadelphia)");
    const observer = new Observer(39.9526, -75.1652, 0);
    console.log(`  Latitude: 39.9526°N`);
    console.log(`  Longitude: 75.1652°W`);
    console.log(`  Altitude: 0m\n`);

    // Step 3: Sidereal time
    console.log("Step 3: SiderealTime()");
    const sidereal = SiderealTime(time);
    console.log(`  Result: ${sidereal} (hours)`);
    console.log(`  RAMC: ${sidereal * 15}° (degrees)\n`);

    // Step 4: Sun position
    console.log("Step 4: SunPosition()");
    const sunPos = SunPosition(time);
    console.log(`  Result: ${JSON.stringify(sunPos)}\n`);

    // Step 5: Mercury position via GeoVector
    console.log("Step 5: GeoVector(Mercury)");
    const mercVec = GeoVector(Body.Mercury, time, true);
    console.log(`  Result: ${JSON.stringify(mercVec)}\n`);

    // Step 6: Convert to ecliptic
    console.log("Step 6: Ecliptic(Mercury vector)");
    const mercEcl = Ecliptic(mercVec);
    console.log(`  Result: ${JSON.stringify(mercEcl)}\n`);

    // Step 7: Try all planets
    console.log("Step 7: All planet longitudes");
    const bodies = [
      { name: "Sun", body: Body.Sun },
      { name: "Moon", body: Body.Moon },
      { name: "Mercury", body: Body.Mercury },
      { name: "Venus", body: Body.Venus },
      { name: "Mars", body: Body.Mars },
      { name: "Jupiter", body: Body.Jupiter },
      { name: "Saturn", body: Body.Saturn },
    ];

    for (const { name, body } of bodies) {
      try {
        let lon: number;
        if (body === Body.Sun) {
          const sp = SunPosition(time);
          lon = sp.elon;
        } else {
          const vec = GeoVector(body, time, true);
          const ecl = Ecliptic(vec);
          lon = ecl.elon;
        }
        console.log(`  ${name.padEnd(10)} lon=${lon.toFixed(2)}°`);
      } catch (e: any) {
        console.log(`  ${name.padEnd(10)} ERROR: ${e.message}`);
      }
    }

    console.log("\n" + "════════════════════════════════════════════════════════════════");
    console.log("ANALYSIS");
    console.log("════════════════════════════════════════════════════════════════\n");

    const sunPos2 = SunPosition(time);
    const mercVec2 = GeoVector(Body.Mercury, time, true);
    const mercEcl2 = Ecliptic(mercVec2);

    if (sunPos2.elon === 0) {
      console.log("⚠️  SUN LONGITUDE IS 0 — astronomy-engine returning defaults?");
    } else if (sunPos2.elon > 350 || sunPos2.elon < 10) {
      console.log(`✓ Sun longitude looks real: ${sunPos2.elon.toFixed(2)}°`);
    } else {
      console.log(`✓ Sun longitude looks real: ${sunPos2.elon.toFixed(2)}°`);
    }

    if (mercEcl2.elon === 0) {
      console.log("⚠️  MERCURY LONGITUDE IS 0 — calculation broken?");
    } else {
      console.log(`✓ Mercury longitude looks real: ${mercEcl2.elon.toFixed(2)}°`);
    }

    console.log("\n" + "════════════════════════════════════════════════════════════════");
  } catch (error) {
    console.error("ERROR:", error instanceof Error ? error.message : error);
    console.error(error);
  }
}

debugEphemeris();
