#!/usr/bin/env npx ts-node

/**
 * LIVE RESULTS UPDATE CLI
 * Usage: npx ts-node update-mlb-results.ts <gameId> <winner>
 * Example: npx ts-node update-mlb-results.ts G1 Twins
 */

import { recordResult, printTracker } from "./mlb-results-tracker";

const args = process.argv.slice(2);

if (args.length === 0) {
  // No arguments - just print current tracker status
  console.log("\n📊 Current Tracker Status:\n");
  printTracker();
  console.log(
    "Usage: npx ts-node update-mlb-results.ts <gameId> <winner>"
  );
  console.log("Example: npx ts-node update-mlb-results.ts G1 Twins\n");
  process.exit(0);
}

const gameId = args[0];
const winner = args[1];

if (!gameId || !winner) {
  console.error(
    "❌ Missing arguments. Usage: update-mlb-results.ts <gameId> <winner>"
  );
  console.error("Example: update-mlb-results.ts G1 Twins");
  process.exit(1);
}

try {
  recordResult(gameId, winner);
  console.log(`\n✅ Recorded: ${gameId} → ${winner}`);
  console.log("\n📊 Updated Tracker:\n");
  printTracker();
} catch (error) {
  console.error(`\n❌ Error: ${error}`);
  process.exit(1);
}
