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
import { assignEqualHousesToChart, buildChartData } from "./sportsHoraryReading";
import { calculateFullPrediction, type ChartData, type ClusterConfig } from "./masterPredictionEngine";
import { calculateTerritorialControl, formatTerritorialReport } from "./territorialControlEngine";

type Chart = Record<string, PlanetPlacement>;
export type SportsMapOrientation = "standard" | "inverse-180";

export type StructuredLegacyTransit = {
  planet: string;
  eclipticLon: number;
  rx: boolean;
  longitudeSource: "topocentric-apparent-ecliptic" | "mean-node-ecliptic";
};

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

/**
 * Creates the legacy scorer's chart directly from structured coordinates.
 * Client-supplied sign, degree, and Whole Sign house labels never enter this
 * path; Equal Houses are assigned later from exact longitude plus Ascendant.
 */
export function structuredLegacyChartFromInput(planets: StructuredLegacyTransit[]): Chart {
  return Object.fromEntries(planets.map((placement) => {
    const longitude = normalizeDegree(placement.eclipticLon);
    const sign = SIGN_ORDER[Math.floor(longitude / 30)] ?? "Aries";
    return [placement.planet, {
      planet: placement.planet,
      degree: longitude % 30,
      sign,
      house: null,
      rx: placement.rx,
      combust: false,
      cazimi: false,
      eclipticLon: longitude,
      raw: `structured:${placement.longitudeSource}`,
      kind: "transit" as const,
    }];
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
  /** Exact local-observer or explicitly named node coordinates for Cluster. */
  structuredTransit?: StructuredLegacyTransit[];
  /** Exact Ascendant from the same event observer and instant. */
  structuredAscendant?: number;
}

export interface SportsHoraryV2Output {
  answer: string;
  verdict: string;
  score: number;
  flags: string[];
  usedChart: "transit" | "natal";
  mapOrientation: SportsMapOrientation;
  margin: number;
  layerVotes?: ReturnType<typeof calculateFullPrediction>["layerVoteScorecard"];
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
  const voteCard = result.layerVoteScorecard;
  const voteRows = voteCard.votes
    .map((vote) => `  ${vote.layer}: ${vote.choice.toUpperCase()} (${vote.reason})`)
    .join("\n");

  return `You are the Firmament sports oracle, reading a horary chart cast for a contest through the sidereal, traditional-Vedic framework (fixed dome sky, Vedic rulers, fixed stars, territorial control).

CRITICAL: Do NOT generate template prose. The experimental verdict is determined only by the eligible layer count. A raw-point lead must never override a tied layer count or turn a no-call into a winner.

ACTUAL COMPUTED DATA (cite these exact values):
- ${fav} (Side A) Total: ${favTotal.toFixed(2)} points
- ${chall} (Side B) Total: ${challTotal.toFixed(2)} points
- Raw point margin (audit only): ${margin.toFixed(2)} points
- Layer votes: Side A ${voteCard.sideAVotes}; Side B ${voteCard.sideBVotes}; ties ${voteCard.ties}; abstentions ${voteCard.abstentions}
- Verdict: ${winner}
- Aggregate reason: ${voteCard.aggregateReason}

LAYER CHOICES (the experimental verdict is determined by eligible vote count, not by raw point totals):
${voteRows}

CONTEST:
- FAVORITE: ${fav}
- CHALLENGER: ${chall}
- QUESTION: ${input.question}

TERRITORIAL SCORING LAYERS (reference these):
${breakdown}

MANDATORY:
1. **Lead with the layer-count verdict.** State Side A votes, Side B votes, ties, and abstentions. If the aggregate verdict is "Neither — too close to call," preserve that no-call even when one side has more raw points.
2. **Raw totals are audit evidence only.** You may state the actual territorial totals and their gap in the Territorial Audit section, but never use that gap as the decisive result or as a probability.
3. **Reference specific lots.** State which lots landed where and their impact, without generalizing their result into the overall winner.
4. **Every sentence traces to the data above.** No generic oracle boilerplate and no claim that a tied/abstaining layer favors either side.

WRITE THE READING:
1. **The Verdict:** State the aggregate winner or no-call plainly, then cite the eligible vote count, ties, and abstentions. Do not cite the point margin as the decision.
2. **Layer Vote Audit:** Name the layers that choose each side and explain the material conflict or abstention.
3. **Territorial Audit:** Explain the raw territory, lords, lots, and friction multipliers as diagnostic evidence only. Cite any raw gap accurately, but state that it does not decide the result.
4. **Major Shifts:** Note reversals or displaced lords that explain a layer's choice, without converting a raw total into a different verdict.

TONE: Direct, specific, grounded in the data. Every claim is checkable against the layers above.

VOICE: A master of the ancient sky. Direct, specific, no hedging. Every claim traces to house lord positions and dignity. Use Markdown headers.`;
}

/**
 * The Cluster decision itself is deterministic. If its optional prose narrator
 * is unavailable, retain the real layer evidence rather than replacing the
 * calculation with an error state or invented explanation.
 */
export function formatDeterministicSportsHoraryFallback(
  input: SportsHoraryV2Input,
  prediction: ReturnType<typeof calculateFullPrediction>,
): string {
  const favorite = input.favoriteName || "the Favorite";
  const challenger = input.challengerName || "the Challenger";
  const verdict =
    prediction.predictedWinner === "A"
      ? `${favorite} / Side A`
      : prediction.predictedWinner === "B"
        ? `${challenger} / Side B`
        : "No decisive Cluster result";
  const votes = prediction.layerVoteScorecard;
  const sideALayers = votes.votes.filter((vote) => vote.choice === "A").map((vote) => vote.layer);
  const sideBLayers = votes.votes.filter((vote) => vote.choice === "B").map((vote) => vote.layer);

  return [
    "## Deterministic Cluster result",
    "The optional narrative service is unavailable. The calculation below is preserved from the deterministic Territorial, KP, and layer-vote outputs; no generated interpretation has been substituted.",
    "",
    `**Result: ${verdict}.** ${votes.aggregateReason}`,
    `Eligible layer choices: Side A ${votes.sideAVotes}; Side B ${votes.sideBVotes}; ties ${votes.ties}; abstentions ${votes.abstentions}.`,
    "",
    "### Directional layer evidence",
    `- **Side A:** ${sideALayers.length > 0 ? sideALayers.join("; ") : "No eligible directional layers"}.`,
    `- **Side B:** ${sideBLayers.length > 0 ? sideBLayers.join("; ") : "No eligible directional layers"}.`,
    "",
    "### Audit boundary",
    `Raw point totals remain diagnostics only: Side A ${prediction.sideATotal.toFixed(2)}, Side B ${prediction.sideBTotal.toFixed(2)}, margin ${prediction.margin.toFixed(2)}. They do not override the layer-count result.`,
  ].join("\n");
}

export async function sportsHoraryV2Layer(
  input: SportsHoraryV2Input,
): Promise<SportsHoraryV2Output> {
  const parsedReading = input.structuredTransit?.length
    ? null
    : runAstroReading(input.natalText, input.transitText, "");
  const result = parsedReading?.result;

  const transits = result?.transits ?? {};
  const natal = result?.natal ?? {};
  const usedChart: "transit" | "natal" = input.structuredTransit?.length
    ? "transit"
    : Object.keys(transits).length >= 5 ? "transit" : "natal";

  const standardChart = input.structuredTransit?.length
    ? structuredLegacyChartFromInput(input.structuredTransit)
    : usedChart === "transit" ? transits : natal;
  const mapOrientation = input.mapOrientation ?? "standard";
  const chart = mapOrientation === "inverse-180" ? invertSportsChart180(standardChart) : standardChart;
  // Root bug (same as v1): ascendant was parsed by astroEngine but never
  // retrieved here, so Arabic Lots were always [] and, when a duplicate
  // local buildChartData existed, always defaulted to house 1.
  const standardAscendant = input.structuredAscendant ?? result?.ascendant ?? undefined;
  const ascendant = standardAscendant === undefined
    ? undefined
    : mapOrientation === "inverse-180"
      ? normalizeDegree(standardAscendant + 180)
      : standardAscendant;
  const calculationChart = assignEqualHousesToChart(chart, ascendant);
  const chartData = buildChartData(calculationChart, ascendant);

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
  const territorialResult = calculateTerritorialControl(calculationChart, houseLordsMap, ascendant, chartData.houseAudit);
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

  let answer: string;
  let narrationUnavailable = false;
  try {
    const response = await invokeLLM({
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 2500,
    });
    answer = (response.choices[0].message.content as string).trim();
  } catch {
    narrationUnavailable = true;
    answer = formatDeterministicSportsHoraryFallback(input, prediction);
  }

  return {
    answer,
    verdict: prediction.predictedWinner === "A" ? "Favorite" : prediction.predictedWinner === "B" ? "Challenger" : "Even",
    score: prediction.sideATotal - prediction.sideBTotal,
    flags: narrationUnavailable ? ["narration_unavailable"] : [],
    usedChart,
    mapOrientation,
    margin: prediction.margin,
    layerVotes: prediction.layerVoteScorecard,
    territorialControl,
  };
}
