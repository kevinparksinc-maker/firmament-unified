import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const Astronomy = _require("astronomy-engine");
const { MakeTime, Observer, SiderealTime } = Astronomy;

const date = new Date(Date.UTC(2026, 5, 29, 20, 30, 0));
const lat = 42.0909;
const lon = -71.2643;

console.log("Test Chart: Germany vs Paraguay");
console.log(`Date: ${date.toISOString()}`);
console.log(`Location: ${lat}°N, ${lon}°E`);
console.log("");

try {
  const astroObs = new Observer(lat, lon, 0);
  const time = MakeTime(date);
  const sidereal = SiderealTime(time);

  console.log(`Sidereal Time: ${sidereal.toFixed(6)} hours`);
  const ramc = sidereal * 15;
  console.log(`RAMC: ${ramc.toFixed(2)}°`);

  // Standard ASC calculation
  const obliquity = 23.4367;
  const latRad = (lat * Math.PI) / 180;
  const eRad = (obliquity * Math.PI) / 180;
  const ramcRad = (ramc * Math.PI) / 180;

  // Method 1: Standard formula: tan(ASC) = -cos(RAMC) / (sin(RAMC)*cos(obliquity) + tan(lat)*sin(obliquity))
  const numerator1 = -Math.cos(ramcRad);
  const denominator1 = Math.sin(ramcRad) * Math.cos(eRad) + Math.tan(latRad) * Math.sin(eRad);
  const asc1 = Math.atan2(numerator1, denominator1) * (180 / Math.PI);
  const asc1Norm = ((asc1 % 360) + 360) % 360;

  console.log(`\nMethod 1 (Standard Formula):`);
  console.log(`  Result: ${asc1Norm.toFixed(2)}°`);

  // Method 2: What the code actually does
  const numerator2 = Math.cos(ramcRad);
  const denominator2 = -(Math.sin(ramcRad) * Math.cos(eRad) + Math.tan(latRad) * Math.sin(eRad));
  const asc2 = Math.atan2(numerator2, denominator2) * (180 / Math.PI);
  const asc2Norm = ((asc2 % 360) + 360) % 360;

  console.log(`\nMethod 2 (Code's Current Implementation):`);
  console.log(`  Result: ${asc2Norm.toFixed(2)}°`);

  // What we got from the chart dump
  console.log(`\nFrom Chart Dump (Sidereal):`);
  console.log(`  Sagittarius 28.54° = 268.54° (tropical)`);

  console.log(`\nComparison:`);
  console.log(`  Method 1: ${asc1Norm.toFixed(2)}° (should be correct)`);
  console.log(`  Method 2: ${asc2Norm.toFixed(2)}° (code's current)`);
  console.log(`  Dumped:   268.54° (what we got)`);

} catch (err) {
  console.error("Error:", err);
}
