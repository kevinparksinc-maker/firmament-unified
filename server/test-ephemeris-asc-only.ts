import { calculateChart } from "./ephemeris";

async function testAsc() {
  const birthDate = new Date(Date.UTC(1986, 10, 20, 16, 6, 0)); // Nov 20, 1986, 10:06 AM CST = 16:06 UTC
  const result = await calculateChart(birthDate, {
    latitude: 32.7767,
    longitude: -96.797,
    altitude: 0,
  });

  console.log("Ascendant (tropical) from astronomy library:", result.houses.ascendant.toFixed(2), "°");
  console.log("MC (tropical) from astronomy library:", result.houses.mc.toFixed(2), "°");

  const ascSign = Math.floor(result.houses.ascendant / 30);
  const mcSign = Math.floor(result.houses.mc / 30);
  const signNames = [
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
  console.log("Ascendant sign:", signNames[ascSign]);
  console.log("MC sign:", signNames[mcSign]);

  console.log("\nExpected for this user:");
  console.log("  Tropical Ascendant: Capricorn (~270-300°)");
  console.log("  Sidereal Ascendant: Sagittarius (~240-270°)");
}

testAsc().catch(console.error);
