import { readFile } from "node:fs/promises";
import { calculateGodAgentFamilyFlow } from "../server/godAgentFlowEngine";
import { summarizeNoCallBacktest } from "../server/sportsBacktestMetrics";

type PilotGame = {
  id: string;
  date: string;
  localStart: { hour: number; minute: number };
  venueName: string;
  latitude: number;
  longitude: number;
  venueCoordinateSource: string;
  homeTeam: string;
  awayTeam: string;
  favorite: { team: string; decimalOdds: number };
  underdog: { team: string; decimalOdds: number };
  pregameSource: string;
  officialGameUrl: string;
  observedFinal: { homeScore: number; awayScore: number; winner: string };
};

type PilotFile = {
  cohortId: string;
  method: string;
  orientation: "standard";
  timezone: "Asia/Tokyo";
  selectionRule: string;
  sources: Record<string, string>;
  games: PilotGame[];
};

const fileUrl = new URL("../data/historical/npb-2026-08-26-pilot.json", import.meta.url);
const pilot = JSON.parse(await readFile(fileUrl, "utf8")) as PilotFile;

const evaluatedGames = pilot.games.map(game => {
  const [year, month, day] = game.date.split("-").map(Number);
  // Japan Standard Time is UTC+09:00 throughout this fixed historical sample.
  const utcDate = new Date(Date.UTC(year!, month! - 1, day!, game.localStart.hour - 9, game.localStart.minute));

  // Deliberately restricted to frozen pregame data. observedFinal is attached only after this call.
  const result = calculateGodAgentFamilyFlow({
    local: { year: year!, month: month!, day: day!, hour: game.localStart.hour, minute: game.localStart.minute },
    utcDate,
    latitude: game.latitude,
    longitude: game.longitude,
    venueName: game.venueName,
    favoriteName: game.favorite.team,
    challengerName: game.underdog.team,
    favoriteSource: game.pregameSource,
    orientation: "standard",
  });

  return {
    game: {
      id: game.id,
      date: game.date,
      localStart: `${game.date}T${String(game.localStart.hour).padStart(2, "0")}:${String(game.localStart.minute).padStart(2, "0")}:00+09:00`,
      eventUtcIso: utcDate.toISOString(),
      venue: { name: game.venueName, latitude: game.latitude, longitude: game.longitude, source: game.venueCoordinateSource },
      favorite: game.favorite,
      underdog: game.underdog,
      pregameSource: game.pregameSource,
      officialGameUrl: game.officialGameUrl,
    },
    calculation: {
      version: result.version,
      orientation: result.orientation,
      outcome: result.outcome,
      verdict: result.verdict,
      godPolarity: result.godView.polarity,
      agentPolarity: result.agentView.polarity,
      synthesisState: result.synthesis.state,
      noCallReason: result.outcome === "no-call" ? result.reason : null,
    },
    postCalculationOutcome: {
      final: game.observedFinal,
      underdogWon: game.observedFinal.winner === game.underdog.team,
    },
  };
});

const summary = summarizeNoCallBacktest(evaluatedGames.map(record => ({
  outcome: record.calculation.outcome,
  underdogWon: record.postCalculationOutcome.underdogWon,
})));

console.log(JSON.stringify({
  cohort: {
    id: pilot.cohortId,
    method: pilot.method,
    orientation: pilot.orientation,
    timezone: pilot.timezone,
    selectionRule: pilot.selectionRule,
    sources: pilot.sources,
    observedOutcomeBoundary: "Final scores and underdogWon are associated only after the frozen God–Agent calculation returns.",
  },
  summary,
  games: evaluatedGames,
}, null, 2));
