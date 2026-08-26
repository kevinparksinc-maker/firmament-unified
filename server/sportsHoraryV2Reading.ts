/**
 * SPORTS HORARY MASTER READING — The Firmament
 * ============================================================================
 * Uses the Master Prediction Engine (territorial cluster scoring with all multipliers).
 * Evaluates all 10 cluster houses per side, applies friction multipliers,
 * territorial control, and fixed star influences.
 * ============================================================================
 */

import { invokeLLM, type Message } from "./_core/llm";
import {
  runAstroReading,
  type PlanetPlacement,
  SIGN_RULERS,
  SIGN_ORDER,
} from "./astroEngine";
import { buildChartData } from "./sportsHoraryReading";
import { calculateFullPrediction, type ChartData, type ClusterConfig } from "./masterPredictionEngine";
import { calculateTerritorialControl, formatTerritorialReport } from "./territorialControlEngine";

type Chart = Record<string, PlanetPlacement>;
export type SportsMapOrientation = "standard" | "inverse-180";

const normalizeDegree = (value: number) => ((value % 360) + 360) % 360;

/**
 * Produces a comparison-only antipodal chart. Every ecliptic point and the
 * Ascendant move by 180°, preserving their mutual spacing and equal-house
 * relationship. This never replaces the standard event chart.
 */
export function invertSportsChart180(chart: Chart): Chart {
  return Object.fromEntries(Object.entries(chart).map(([name, placement]) => {
    const longitude = normalizeDegree((placement.eclipticLon ?? SIGN_ORDER.indexOf(placement.sign) * 30 + placement.degree) + 180);
    const sign = SIGN_ORDER[Math.floor(longitude / 30)] ?? "Aries";
    return [name, { ...placement, eclipticLon: longitude, sign, degree: longitude % 30 }];
  }));
}

export interface SportsHoraryV2Input {
  question: string;
  natalText: string;
  transitText: string;
  favoriteName?: string;
  challengerName?: string;
  history?: Message[];
  mapOrientation?: SportsMapOrientation;
}

export interface SportsHoraryV2Output {
  answer: string;
  verdict: string;
  score: number;
  flags: string[];
  usedChart: "transit" | "natal";
  mapOrientation: SportsMapOrientation;
  margin: number;
  territorialControl: {
    sideATotal: number;
    sideBTotal: number;
    swing: number;
    summary: string;
    arabicLots?: Array<{ name: string; sign: string; sideInfluence: "A" | "B" | "neutral" }>;
    fullReport: string;
  };
}

function buildReadingPrompt(
  input: SportsHoraryV2Input,
  result: ReturnType<typeof calculateFullPrediction>,
  breakdown: string,
): string {
  const fav = input.favoriteName || "the Favorite";
  const chall = input.challengerName || "the Challenger";
  const winner =
    result.predictedWinner === "A"
      ? fav
      : result.predictedWinner === "B"
        ? chall
        : "Neither — too close to call";

  const margin = Math.abs(result.margin);
  const favTotal = result.sideATotal;
  const challTotal = result.sideBTotal;

  return `You are the Firmament sports oracle, reading a horary chart cast for a contest through the sidereal, traditional-Vedic framework (fixed dome sky, Vedic rulers, fixed stars, territorial control).

CRITICAL: Do NOT generate template prose. Do NOT say territories are "even" if the data shows a clear advantage.

ACTUAL COMPUTED DATA (cite these exact values):
- ${fav} (Side A) Total: ${favTotal.toFixed(2)} points
- ${chall} (Side B) Total: ${challTotal.toFixed(2)} points
- Margin: ${margin.toFixed(2)} points
- Confidence: ${result.confidence}%
- Verdict: ${winner}

CONTEST:
- FAVORITE: ${fav}
- CHALLENGER: ${chall}
- QUESTION: ${input.question}

TERRITORIAL SCORING LAYERS (reference these):
${breakdown}

MANDATORY:
1. **Never say "even territory" if margin ≠ 0.** Cite the actual totals: "${fav} holds ${favTotal.toFixed(1)}, ${chall} holds ${challTotal.toFixed(1)} — a gap of ${margin.toFixed(1)}."
2. **Reference specific lots.** State which lots landed where and their impact, don't generalize.
3. **Confidence tie-in:** Margin < 5 = "too close"; 5–15 = "slight edge"; > 15 = "strong dominion"
4. **Every sentence traces to the data above.** No generic oracle boilerplate.

WRITE THE READING:
1. **The Verdict:** State the winner plainly + cite the margin in points.
2. **Territorial Dominance:** Which side accumulated more, why (lords, lots, friction multipliers).
3. **Major Shifts:** Any reversals or displaced lords that swung the contest.
4. **Confidence Statement:** Tie it directly to the margin—don't invent certainty you don't have.

TONE: Direct, specific, grounded in the data. Every claim is checkable against the layers above.

VOICE: A master of the ancient sky. Direct, specific, no hedging. Every claim traces to house lord positions and dignity. Use Markdown headers.`;
}

export async function sportsHoraryV2Layer(
  input: SportsHoraryV2Input,
): Promise<SportsHoraryV2Output> {
  const { result } = runAstroReading(input.natalText, input.transitText, "");

  const transits = result?.transits ?? {};
  const natal = result?.natal ?? {};
  const usedChart: "transit" | "natal" =
    Object.keys(transits).length >= 5 ? "transit" : "natal";

  const standardChart = usedChart === "transit" ? transits : natal;
  const mapOrientation = input.mapOrientation ?? "standard";
  const chart = mapOrientation === "inverse-180" ? invertSportsChart180(standardChart) : standardChart;
  // Root bug (same as v1): ascendant was parsed by astroEngine but never
  // retrieved here, so Arabic Lots were always [] and, when a duplicate
  // local buildChartData existed, always defaulted to house 1.
  const standardAscendant = result?.ascendant ?? undefined;
  const ascendant = standardAscendant === undefined
    ? undefined
    : mapOrientation === "inverse-180"
      ? normalizeDegree(standardAscendant + 180)
      : standardAscendant;
  const chartData = buildChartData(chart, ascendant);

  if (chartData.houseLords.length === 0) {
    return {
      answer: "Could not resolve enough placements to cast the sports chart.",
      verdict: "Even",
      score: 0,
      flags: ["insufficient_data"],
      usedChart,
      mapOrientation,
      margin: 0,
      territorialControl: {
        sideATotal: 0,
        sideBTotal: 0,
        swing: 0,
        summary: "No lords resolved — insufficient chart data.",
        arabicLots: undefined,
        fullReport: "",
      },
    };
  }

  const config: ClusterConfig = {
    sideAHouses: [1, 3, 6, 10, 11],
    sideBHouses: [7, 9, 12, 4, 5],
    sideALabel: input.favoriteName || "Favorite",
    sideBLabel: input.challengerName || "Challenger",
  };

  const prediction = calculateFullPrediction(chartData, config);

  // Build the same territorial-control view from the SAME chart + ascendant
  // the narrative above already used — this used to be computed completely
  // separately (in routers.ts, from client-supplied houseCusps), which is
  // exactly why the narrative and the "territorial control" numbers could
  // disagree. Now there's one chart, one ascendant, one set of house lords,
  // feeding both.
  const houseLordsMap = new Map<number, string>();
  for (const hl of chartData.houseLords) {
    houseLordsMap.set(hl.house, hl.lordPlanet);
  }
  const territorialResult = calculateTerritorialControl(chart, houseLordsMap, ascendant, chartData.houseAudit);
  const territorialControl = {
    sideATotal: territorialResult.sideATotal,
    sideBTotal: territorialResult.sideBTotal,
    swing: territorialResult.sideBTotal - territorialResult.sideATotal,
    summary: territorialResult.summary,
    arabicLots: territorialResult.arabicLots,
    fullReport: formatTerritorialReport(territorialResult),
  };

  const breakdown = prediction.breakdown
    .map(layer => `  ${layer.layer}: A=${layer.sideAPoints} B=${layer.sideBPoints}`)
    .join("\n");

  const systemPrompt = buildReadingPrompt(input, prediction, breakdown);

  const messages: Message[] = [
    ...(input.history || []),
    { role: "user", content: input.question },
  ];

  const response = await invokeLLM({
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_tokens: 2500,
  });

  return {
    answer: (response.choices[0].message.content as string).trim(),
    verdict: prediction.predictedWinner === "A" ? "Favorite" : prediction.predictedWinner === "B" ? "Challenger" : "Even",
    score: prediction.sideATotal - prediction.sideBTotal,
    flags: [],
    usedChart,
    mapOrientation,
    margin: prediction.margin,
    territorialControl,
  };
}
