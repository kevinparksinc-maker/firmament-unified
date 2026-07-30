import { calculateChart } from "./ephemeris";
import { transformChartToFlatPlane } from "./coordinateTransformer";
import { generateTopocentricHouses, evaluatePlanetPlacement } from "./topocentricHouses";
import { getFixedBackgroundSign, getFixedNakshatra, ROYAL_STAR_ANCHORS } from "./firmamentBaseline";

async function testUserNatal() {
  console.log("\n" + "═".repeat(90));
  console.log("FIRMAMENT NATAL CHART TEST");
  console.log("User: Born November 20, 1986, 10:06 AM, Dallas, TX");
  console.log("═".repeat(90));

  // Birth data
  const birthDate = new Date(Date.UTC(1986, 10, 20, 16, 6, 0)); // 10:06 AM CST = 16:06 UTC (CST is UTC-6)
  const birthLat = 32.7767; // Dallas latitude
  const birthLon = -96.797; // Dallas longitude
  const birthAlt = 0;

  // Calculate ephemeris
  console.log("\n### STEP 1: EPHEMERIS CALCULATION");
  const result = await calculateChart(birthDate, {
    latitude: birthLat,
    longitude: birthLon,
    altitude: birthAlt,
  });

  console.log(`\nRaw Tropical Planetary Positions:`);
  console.log(`────────────────────────────────────────────────────────`);
  for (const planet of result.planets) {
    const sign = getFixedBackgroundSign(planet.eclipticLon);
    const nak = getFixedNakshatra(planet.eclipticLon);
    console.log(
      `${planet.name.padEnd(10)} → ${planet.eclipticLon.toFixed(2)}° (${sign} ${planet.degreeInSign}°${planet.minutes}') [${nak.name}]`
    );
  }

  // Use the correct topocentric Ascendant from the astronomy library
  console.log(`\n### STEP 2: TOPOCENTRIC ASCENDANT (From Ephemeris)`);
  const tropicalAscendant = result.houses.ascendant;

  console.log(`\nGeographic Location: ${birthLat}°N, ${birthLon}°W`);
  console.log(`Tropical Ascendant: ${tropicalAscendant.toFixed(2)}°`);
  console.log(`Ascendant Sign: ${getFixedBackgroundSign(tropicalAscendant)}`);

  // Generate houses
  console.log(`\n### STEP 3: 12 EQUAL HOUSES (30° slices from Ascendant)`);
  const houses = generateTopocentricHouses(tropicalAscendant);
  console.log(`────────────────────────────────────────────────────────`);
  for (const house of houses) {
    console.log(
      `H${house.houseNumber.toString().padStart(2)} → ${house.startDegree.toFixed(2)}°–${house.endDegree.toFixed(2)}° (${getFixedBackgroundSign(house.startDegree)})`
    );
  }

  // Map planets to houses
  console.log(`\n### STEP 4: PLANETS IN HOUSES ON FIXED WHEEL`);
  console.log(`────────────────────────────────────────────────────────`);
  const planetPlacements = result.planets.map((p) => ({
    ...p,
    placement: evaluatePlanetPlacement(p.eclipticLon, houses),
  }));

  for (const planet of planetPlacements) {
    const p = planet.placement;
    console.log(
      `${planet.name.padEnd(10)} @ ${planet.eclipticLon.toFixed(2)}° → H${p.assignedHouse} (${p.fixedSign} ${p.nakshatra})`
    );
  }

  // Royal star alignments
  console.log(`\n### STEP 5: ROYAL STAR ALIGNMENTS`);
  console.log(`────────────────────────────────────────────────────────`);
  for (const [key, star] of Object.entries(ROYAL_STAR_ANCHORS)) {
    console.log(`${star.name.padEnd(12)} @ ${star.absoluteDegree.toFixed(2)}° (${star.sign}, ${star.quadrant})`);
  }

  // Closest planets to royal stars
  console.log(`\nClosest Planets to Royal Stars:`);
  for (const [key, star] of Object.entries(ROYAL_STAR_ANCHORS)) {
    let closestPlanet = null;
    let minDistance = Infinity;

    for (const planet of result.planets) {
      const distance = Math.min(
        Math.abs(planet.eclipticLon - star.absoluteDegree),
        360 - Math.abs(planet.eclipticLon - star.absoluteDegree)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestPlanet = planet;
      }
    }

    if (closestPlanet) {
      console.log(`  ${star.name}: ${closestPlanet.name} (${minDistance.toFixed(2)}° away)`);
    }
  }

  console.log("\n" + "═".repeat(90));
  console.log("END OF FIRMAMENT NATAL TEST");
  console.log("═".repeat(90) + "\n");
}

testUserNatal().catch(console.error);
