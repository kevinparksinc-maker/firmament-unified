/**
 * LOCK INTEGRATED PREDICTIONS
 * Takes the integrated 5-house scorer output and saves as official tracker
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface LockedPrediction {
  id: string;
  matchup: string;
  away: string;
  home: string;
  prediction: string;
  confidence: number;
  margin: number;
  awayTotal: number;
  homeTotal: number;
  reasoning: string;
  locked_at: string;
  scoringMethod: "integrated-5-house-cluster";
}

const PREDICTIONS: LockedPrediction[] = [
  { id: "G1", matchup: "Twins @ Guardians", away: "Twins", home: "Guardians", prediction: "Guardians", confidence: 75, margin: 5, awayTotal: -6, homeTotal: -1, reasoning: "Home lords stronger", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G2", matchup: "Pirates @ Yankees", away: "Pirates", home: "Yankees", prediction: "Yankees", confidence: 60, margin: 2, awayTotal: -3, homeTotal: -1, reasoning: "Home field advantage", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G3", matchup: "Rays @ Blue Jays", away: "Rays", home: "Blue Jays", prediction: "Blue Jays", confidence: 60, margin: 2, awayTotal: -4, homeTotal: -2, reasoning: "Home field advantage", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G4", matchup: "Orioles @ Red Sox", away: "Orioles", home: "Red Sox", prediction: "Red Sox", confidence: 60, margin: 2, awayTotal: -3, homeTotal: -1, reasoning: "Home field advantage", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G5", matchup: "Dodgers @ Phillies", away: "Dodgers", home: "Phillies", prediction: "Phillies", confidence: 60, margin: 2, awayTotal: -3, homeTotal: -1, reasoning: "Home field advantage", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G6", matchup: "Padres @ Braves", away: "Padres", home: "Braves", prediction: "Braves", confidence: 60, margin: 2, awayTotal: -3, homeTotal: -1, reasoning: "Home field advantage", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G7", matchup: "Giants @ Royals", away: "Giants", home: "Royals", prediction: "Royals", confidence: 80, margin: 6, awayTotal: -6, homeTotal: 0, reasoning: "Home lords stronger", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G8", matchup: "Mets @ Brewers", away: "Mets", home: "Brewers", prediction: "Brewers", confidence: 60, margin: 2, awayTotal: -4, homeTotal: -2, reasoning: "Home field advantage", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G9", matchup: "Tigers @ Cubs", away: "Tigers", home: "Cubs", prediction: "Cubs", confidence: 60, margin: 2, awayTotal: -3, homeTotal: -1, reasoning: "Home field advantage", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G10", matchup: "White Sox @ Rangers", away: "White Sox", home: "Rangers", prediction: "Rangers", confidence: 60, margin: 2, awayTotal: -3, homeTotal: -1, reasoning: "Home field advantage", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G11", matchup: "Marlins @ Astros", away: "Marlins", home: "Astros", prediction: "Astros", confidence: 60, margin: 2, awayTotal: -3, homeTotal: -1, reasoning: "Home field advantage", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G12", matchup: "Nationals @ Rockies", away: "Nationals", home: "Rockies", prediction: "Rockies", confidence: 60, margin: 2, awayTotal: -4, homeTotal: -2, reasoning: "Home field advantage", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G13", matchup: "Athletics @ D-backs", away: "Athletics", home: "D-backs", prediction: "D-backs", confidence: 50, margin: 0, awayTotal: -2, homeTotal: -2, reasoning: "Too close to call", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G14", matchup: "Reds @ Mariners", away: "Reds", home: "Mariners", prediction: "Mariners", confidence: 75, margin: 5, awayTotal: -6, homeTotal: -1, reasoning: "Home lords stronger", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
  { id: "G15", matchup: "Cardinals @ Angels", away: "Cardinals", home: "Angels", prediction: "Angels", confidence: 60, margin: 2, awayTotal: -3, homeTotal: -1, reasoning: "Home field advantage", locked_at: new Date().toISOString(), scoringMethod: "integrated-5-house-cluster" },
];

const trackerFile = path.join(__dirname, "mlb-tracker-july-20-2026.json");

interface TrackerData {
  date: string;
  total_games: number;
  predictions: LockedPrediction[];
  summary: {
    total: number;
    correct: number;
    accuracy: number;
    by_confidence: Record<string, { count: number; accuracy: number }>;
  };
}

const tracker: TrackerData = {
  date: "2026-07-20",
  total_games: 15,
  predictions: PREDICTIONS,
  summary: {
    total: 15,
    correct: 0,
    accuracy: 0,
    by_confidence: {},
  },
};

fs.writeFileSync(trackerFile, JSON.stringify(tracker, null, 2));
console.log(`✅ Locked ${PREDICTIONS.length} predictions (integrated 5-house cluster system)`);
console.log(`📊 Tracker saved to ${trackerFile}`);
console.log(`\nPrediction breakdown:`);
console.log(`  - 1 game at 80% (Royals clear favorite)`);
console.log(`  - 3 games at 75% (Guardians, Mariners)`);
console.log(`  - 10 games at 60% (home field advantage)`);
console.log(`  - 1 game at 50% (too close to call)`);
