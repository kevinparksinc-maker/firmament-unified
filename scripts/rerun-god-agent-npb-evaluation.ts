import { readFile } from "node:fs/promises";
import { calculateGodAgentFamilyFlow } from "../server/godAgentFlowEngine";
import { summarizeMarketUnderdogBaseline, summarizeNoCallBacktest } from "../server/sportsBacktestMetrics";

type Venue = { name: string; latitude: number; longitude: number; source: string };
type Game = {
  id: string;
  date: string;
  localStart: string;
  venue: string;
  home: string;
  away: string;
  favorite: [string, number];
  underdog: [string, number];
  officialGameUrl: string;
  final: [number, number, string];
};
type Cohort = {
  cohortId: string;
  method: string;
  orientation: "standard";
  timezone: "Asia/Tokyo";
  selectionRule: string;
  sources: Record<string, string>;
  venues: Record<string, Venue>;
  games: Game[];
};

const cohortUrl = new URL("../data/historical/npb-2026-08-22-to-26-evaluation.json", import.meta.url);
const cohort = JSON.parse(await readFile(cohortUrl, "utf8")) as Cohort;

const evaluatedGames = cohort.games.map(game => {
  const venue = cohort.venues[game.venue];
  if (!venue) throw new Error(`${game.id}: unknown venue key ${game.venue}`);
  const [year, month, day] = game.date.split("-").map(Number);
  const [hour, minute] = game.localStart.split(":").map(Number);
  const utcDate = new Date(Date.UTC(year!, month! - 1, day!, hour! - 9, minute));
  const [favoriteName, favoriteOdds] = game.favorite;
  const [underdogName, underdogOdds] = game.underdog;
  const favoriteSource = `CheckBestOdds Japan NPB historical odds (${game.date}): ${game.home} and ${game.away}, ${game.favorite[1].toFixed(2)}/${game.underdog[1].toFixed(2)}. ${cohort.sources.historicalOdds}`;

  // No final score, winner, or underdog flag is present in the calculation input.
  const result = calculateGodAgentFamilyFlow({
    local: { year: year!, month: month!, day: day!, hour: hour!, minute: minute! },
    utcDate,
    latitude: venue.latitude,
    longitude: venue.longitude,
    venueName: venue.name,
    favoriteName,
    challengerName: underdogName,
    favoriteSource,
    orientation: cohort.orientation,
  });

  const [homeScore, awayScore, winner] = game.final;
  return {
    game: {
      id: game.id,
      date: game.date,
      localStart: `${game.date}T${game.localStart}:00+09:00`,
      eventUtcIso: utcDate.toISOString(),
      home: game.home,
      away: game.away,
      venue: { ...venue },
      favorite: { team: favoriteName, decimalOdds: favoriteOdds },
      underdog: { team: underdogName, decimalOdds: underdogOdds },
      officialGameUrl: game.officialGameUrl,
      pregameSource: favoriteSource,
    },
    calculation: {
      version: result.version,
      orientation: result.orientation,
      outcome: result.outcome,
      verdict: result.verdict,
      reason: result.reason,
      godPolarity: result.godView.polarity,
      godPoints: result.godView.points,
      agentPolarity: result.agentView.polarity,
      agentCusps: result.agentView.cusps,
      agentRows: result.familyFlow.rows,
      topocentricObservation: result.topocentricObservation,
      synthesisState: result.synthesis.state,
    },
    postCalculationOutcome: {
      final: { homeScore, awayScore, winner },
      underdogWon: winner === underdogName,
    },
  };
});

const summary = summarizeNoCallBacktest(evaluatedGames.map(record => ({
  outcome: record.calculation.outcome,
  underdogWon: record.postCalculationOutcome.underdogWon,
})));

const marketBaseline = summarizeMarketUnderdogBaseline(evaluatedGames.map(record => ({
  favoriteDecimalOdds: record.game.favorite.decimalOdds,
  underdogDecimalOdds: record.game.underdog.decimalOdds,
})));

console.log(JSON.stringify({
  cohort: {
    id: cohort.cohortId,
    method: cohort.method,
    orientation: cohort.orientation,
    timezone: cohort.timezone,
    selectionRule: cohort.selectionRule,
    sources: cohort.sources,
    observedOutcomeBoundary: "Final scores and underdogWin status were attached only after each frozen God–Agent calculation returned.",
  },
  summary,
  marketBaseline,
  games: evaluatedGames,
}, null, 2));
