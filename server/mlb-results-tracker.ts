/**
 * MLB RESULTS TRACKER - July 20, 2026
 * Stores predictions, tracks results, calculates accuracy in real-time
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface Prediction {
  id: string;
  matchup: string;
  away: string;
  home: string;
  timeET: string;
  prediction: string;
  confidence: number;
  h1Lord: string;
  h7Lord: string;
  reasoning: string;
  locked_at: string;
  result?: string;
  correct?: boolean;
  updated_at?: string;
}

export interface TrackerData {
  date: string;
  total_games: number;
  predictions: Prediction[];
  summary: {
    total: number;
    correct: number;
    accuracy: number;
    by_confidence: Record<string, { total: number; correct: number }>;
  };
}

const TRACKER_FILE = path.join(__dirname, "mlb-tracker-july-20-2026.json");

export function initializeTracker(predictions: Prediction[]): TrackerData {
  const tracker: TrackerData = {
    date: "2026-07-20",
    total_games: predictions.length,
    predictions: predictions.map((p) => ({
      ...p,
      locked_at: new Date().toISOString(),
    })),
    summary: {
      total: predictions.length,
      correct: 0,
      accuracy: 0,
      by_confidence: {},
    },
  };

  fs.writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2));
  return tracker;
}

export function recordResult(matchupId: string, actualWinner: string) {
  let tracker = JSON.parse(fs.readFileSync(TRACKER_FILE, "utf-8")) as TrackerData;

  const pred = tracker.predictions.find((p) => p.id === matchupId);
  if (!pred) {
    console.error(`Prediction ${matchupId} not found`);
    return;
  }

  pred.result = actualWinner;
  pred.correct = pred.prediction === actualWinner;
  pred.updated_at = new Date().toISOString();

  // Recalculate summary
  const correct = tracker.predictions.filter((p) => p.correct).length;
  const completed = tracker.predictions.filter((p) => p.result).length;

  tracker.summary.correct = correct;
  tracker.summary.accuracy = completed > 0 ? (correct / completed) * 100 : 0;

  // Group by confidence
  tracker.summary.by_confidence = {};
  tracker.predictions.forEach((p) => {
    if (p.result) {
      const confBucket = `${Math.floor(p.confidence / 10) * 10}-${Math.floor(p.confidence / 10) * 10 + 9}%`;
      if (!tracker.summary.by_confidence[confBucket]) {
        tracker.summary.by_confidence[confBucket] = { total: 0, correct: 0 };
      }
      tracker.summary.by_confidence[confBucket].total++;
      if (p.correct) tracker.summary.by_confidence[confBucket].correct++;
    }
  });

  fs.writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2));
}

export function printTracker() {
  const tracker = JSON.parse(fs.readFileSync(TRACKER_FILE, "utf-8")) as TrackerData;

  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║             MLB RESULTS TRACKER — July 20, 2026              ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  console.log(
    `Date: ${tracker.date} | Total Games: ${tracker.total_games} | Completed: ${tracker.predictions.filter((p) => p.result).length}/${tracker.total_games}`
  );
  console.log(`Accuracy: ${tracker.summary.accuracy.toFixed(1)}% (${tracker.summary.correct}/${tracker.predictions.filter((p) => p.result).length})`);
  console.log("\nRESULTS:");
  console.log("─".repeat(110));
  console.log(
    `${"Matchup".padEnd(30)} | ${"Pred".padEnd(15)} | ${"Conf".padEnd(6)} | ${"Result".padEnd(15)} | ${"Status".padEnd(10)}`
  );
  console.log("─".repeat(110));

  tracker.predictions.forEach((p) => {
    const status = p.result
      ? p.correct
        ? "✅ CORRECT"
        : "❌ WRONG"
      : "⏳ Pending";
    console.log(
      `${p.matchup.padEnd(30)} | ${p.prediction.padEnd(15)} | ${p.confidence.toFixed(0).padEnd(6)}% | ${(p.result || "—").padEnd(15)} | ${status.padEnd(10)}`
    );
  });

  console.log("─".repeat(110));
  console.log("\nBY CONFIDENCE LEVEL:");
  Object.entries(tracker.summary.by_confidence).forEach(([conf, data]) => {
    const acc = data.total > 0 ? ((data.correct / data.total) * 100).toFixed(0) : "—";
    console.log(`  ${conf}: ${acc}% (${data.correct}/${data.total})`);
  });

  console.log("\n");
}

export function getTracker(): TrackerData {
  return JSON.parse(fs.readFileSync(TRACKER_FILE, "utf-8"));
}
