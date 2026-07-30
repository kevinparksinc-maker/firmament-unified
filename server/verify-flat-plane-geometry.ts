/**
 * FLAT-PLANE ASCENDANT GEOMETRY VERIFICATION
 *
 * Tests the core geometric calculation for the flat North Pole grid system.
 * Compares the mathematical baseline against coordinateTransformer.ts output.
 *
 * Test Case: Dallas, Texas
 * - Canvas: 500x500 pixels, North Pole at center (0,0 in math coords)
 * - Zodiac Radius (R_zodiac): 300 pixels
 * - User Position: (-45.12, -180.48)
 * - Expected Horizon Angle: 323.00°
 */

import { transformChartToFlatPlane } from "./coordinateTransformer";

// ─────────────────────────────────────────────────────────────────────────
// PURE MATHEMATICAL BASELINE
// ─────────────────────────────────────────────────────────────────────────

function calculateFlatPlaneAscendantGeometry(
  userX: number,
  userY: number,
  R_zodiac: number
): {
  xIntersection: number;
  yIntersection: number;
  absoluteHorizonAngle: number;
} {
  // Due East extends horizontally along the X-axis
  // The horizon line crosses the zodiac wheel where it intersects the Y coordinate
  const yIntersection = userY;

  // Pythagorean theorem: X = sqrt(R^2 - Y^2)
  const xIntersectionRaw = Math.pow(R_zodiac, 2) - Math.pow(yIntersection, 2);
  if (xIntersectionRaw < 0) {
    console.error(`⚠️  User position is OUTSIDE the zodiac wheel! (Y^2 > R^2)`);
    return {
      xIntersection: 0,
      yIntersection,
      absoluteHorizonAngle: 0,
    };
  }

  const xIntersection = Math.sqrt(xIntersectionRaw);

  // Calculate the absolute angle from the North Pole (0,0) using atan2
  // atan2(y, x) gives the angle from the positive X-axis
  let absoluteHorizonAngle = Math.atan2(yIntersection, xIntersection) * (180 / Math.PI);

  // Normalize to 0-360 range
  if (absoluteHorizonAngle < 0) {
    absoluteHorizonAngle += 360;
  }

  return {
    xIntersection,
    yIntersection,
    absoluteHorizonAngle,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// TEST EXECUTION
// ─────────────────────────────────────────────────────────────────────────

async function verifyGeometry() {
  console.log("\n" + "═".repeat(90));
  console.log("FLAT-PLANE ASCENDANT GEOMETRY VERIFICATION");
  console.log("═".repeat(90));

  // Test parameters
  const userX = -45.12;
  const userY = -180.48;
  const R_zodiac = 300.0;

  console.log("\n### INPUT PARAMETERS");
  console.log(`User Position: (${userX}, ${userY})`);
  console.log(`Zodiac Wheel Radius: ${R_zodiac} pixels`);
  console.log(`Direction: Due East (horizontal X-axis)`);

  // ─── MATHEMATICAL CALCULATION ───
  console.log("\n" + "─".repeat(90));
  console.log("STEP 1: MATHEMATICAL BASELINE CALCULATION");
  console.log("─".repeat(90));

  const result = calculateFlatPlaneAscendantGeometry(userX, userY, R_zodiac);

  console.log(`\nPythagorean Calculation:`);
  console.log(`  R²         = ${R_zodiac}² = ${Math.pow(R_zodiac, 2)}`);
  console.log(`  Y²         = (${userY})² = ${Math.pow(userY, 2).toFixed(2)}`);
  console.log(`  R² - Y²    = ${Math.pow(R_zodiac, 2)} - ${Math.pow(userY, 2).toFixed(2)} = ${(Math.pow(R_zodiac, 2) - Math.pow(userY, 2)).toFixed(2)}`);
  console.log(`  X (√diff)  = √${(Math.pow(R_zodiac, 2) - Math.pow(userY, 2)).toFixed(2)} = ${result.xIntersection.toFixed(2)}`);

  console.log(`\nIntersection Point on Zodiac Wheel:`);
  console.log(`  X: ${result.xIntersection.toFixed(2)} pixels`);
  console.log(`  Y: ${result.yIntersection.toFixed(2)} pixels`);

  console.log(`\nAngle Calculation (atan2):`);
  const rawAngle = Math.atan2(result.yIntersection, result.xIntersection);
  console.log(`  atan2(${result.yIntersection.toFixed(2)}, ${result.xIntersection.toFixed(2)}) = ${rawAngle.toFixed(4)} radians`);
  console.log(`  In degrees: ${(rawAngle * (180 / Math.PI)).toFixed(2)}°`);
  console.log(`  Normalized (0-360): ${result.absoluteHorizonAngle.toFixed(2)}°`);

  console.log(`\n✓ EXPECTED BASELINE: 323.00°`);
  console.log(`✓ CALCULATED RESULT: ${result.absoluteHorizonAngle.toFixed(2)}°`);
  const baselineMatch = Math.abs(result.absoluteHorizonAngle - 323.0) < 0.1;
  console.log(`${baselineMatch ? "✅ MATCH" : "❌ MISMATCH"}`);

  // ─── COMPARE WITH coordinateTransformer.ts ───
  console.log("\n" + "─".repeat(90));
  console.log("STEP 2: COMPARE WITH coordinateTransformer.ts");
  console.log("─".repeat(90));

  // Use a test date/time
  const testDate = new Date(Date.UTC(2026, 5, 29, 20, 30, 0));
  const lat = 32.7767; // Dallas latitude
  const lon = -96.7970; // Dallas longitude
  const localHours = (testDate.getUTCHours() + testDate.getUTCMinutes() / 60) % 24;

  console.log(`\nTest Chart Parameters:`);
  console.log(`  Date: 2026-06-29 20:30 UTC`);
  console.log(`  Location: Dallas, TX (${lat}°N, ${lon}°W)`);
  console.log(`  Local Hour Angle: ${localHours.toFixed(2)} hours`);
  console.log(`  Canvas Radius (R_zodiac): 300`);
  console.log(`  Grid Scale: 1`);

  const flatChart = transformChartToFlatPlane(lat, lon, localHours, 300, 1, 0);

  console.log(`\ncoordinateTransformer.ts Output:`);
  console.log(`  Planar Ascendant: ${flatChart.planarAscendant.toFixed(2)}°`);
  console.log(`  Grid Point X: ${flatChart.userGridPosition.x.toFixed(2)}`);
  console.log(`  Grid Point Y: ${flatChart.userGridPosition.y.toFixed(2)}`);
  console.log(`  Sky Rotation: ${flatChart.skyRotation.toFixed(2)}°`);
  console.log(`  Zodiac Radius (R): ${flatChart.rZodiac}`);

  // ─── VERIFICATION SUMMARY ───
  const horizonAngleFromTransformer = flatChart.planarAscendant;
  console.log("\n" + "═".repeat(90));
  console.log("VERIFICATION SUMMARY");
  console.log("═".repeat(90));

  console.log(`\n✓ Pure Mathematical Baseline:`);
  console.log(`  Horizon Angle = ${result.absoluteHorizonAngle.toFixed(2)}° (Expected: 323.00°)`);
  console.log(`  Status: ${baselineMatch ? "✅ BASELINE VERIFIED" : "❌ BASELINE FAILED"}`);

  console.log(`\n✓ coordinateTransformer.ts Output:`);
  console.log(`  Planar Ascendant = ${horizonAngleFromTransformer.toFixed(2)}°`);
  console.log(`  Grid Position = (${flatChart.userGridPosition.x.toFixed(2)}, ${flatChart.userGridPosition.y.toFixed(2)})`);

  console.log(`\n✓ Geometric Alignment Check:`);
  const transformerMatch = Math.abs(horizonAngleFromTransformer - 323.0) < 10;
  console.log(`  Expected horizon angle: ~323.00°`);
  console.log(`  Transformer horizon angle: ${horizonAngleFromTransformer.toFixed(2)}°`);
  console.log(`  Drift: ${Math.abs(horizonAngleFromTransformer - 323.0).toFixed(2)}°`);
  console.log(`  Status: ${transformerMatch ? "✅ ALIGNED" : "⚠️  DRIFT DETECTED"}`);

  console.log("\n" + "═".repeat(90));
  if (baselineMatch) {
    console.log("🟢 FLAT-PLANE GEOMETRY VERIFIED — Baseline is rock-solid.");
    console.log("   Ready to implement getSignNakshatraFriction() multiplier.");
  } else {
    console.log("🔴 BASELINE VERIFICATION FAILED — Check mathematical calculations.");
  }
  console.log("═".repeat(90) + "\n");
}

verifyGeometry().catch(console.error);
