/**
 * SPORTS HORARY READING — The Firmament
 * ============================================================================
 * Uses the Master Prediction Engine for territorial cluster scoring.
 * Evaluates all 10 cluster houses per side with multipliers and LLM narration.
 * ============================================================================
 */

import { invokeLLM, type Message } from "./_core/llm";
import {
  runAstroReading,
  SIGN_RULERS,
  SIGN_ORDER,
  buildEqualHouseCusps,
  detectMoonPhase,
  type PlanetPlacement,
} from "./astroEngine";
import {
  calculateFullPrediction,
  type ChartData,
  type ClusterConfig,
  type SportsHoraryPlacement,
  assignHousesToLots,
} from "./masterPredictionEngine";
import { getNakshatraAt } from "./nakshatra";
import { isNight, calculateCanonicalArabicLots } from "./astrologyCore";

type Chart = Record<string, PlanetPlacement>;

function toSportsHoraryPlacement(
  planetName: string,
  eclipticLon: number,
  placement: PlanetPlacement
): SportsHoraryPlacement {
  const nakshatra = getNakshatraAt(eclipticLon);
  return {
    planet: planetName,
    house: placement.house,
    sign: placement.sign,
    degree: placement.degree,
    eclipticLon,
    isRetrograde: placement.rx || false,
    nakshatra: nakshatra.nakshatra.name,
  };
}

// A planet's house isn't always stated explicitly in pasted chart text —
// parseInput() only sets it when the text literally says "Nth house".
// When it's missing, derive it from the planet's actual longitude against
// the house cusps, same walking logic assignHousesToLots() uses for lots.
function getHouseFromLon(
  lon: number,
  cusps: Record<number, { sign: string; degree: number }>
): number {
  for (let i = 1; i <= 12; i++) {
    const cusp = cusps[i];
    const nextCusp = cusps[(i % 12) + 1];
    const cuspLon = SIGN_ORDER.indexOf(cusp.sign) * 30 + cusp.degree;
    const nextCuspLon = SIGN_ORDER.indexOf(nextCusp.sign) * 30 + nextCusp.degree;
    if (cuspLon <= nextCuspLon) {
      if (lon >= cuspLon && lon < nextCuspLon) return i;
    } else {
      if (lon >= cuspLon || lon < nextCuspLon) return i;
    }
  }
  return 1;
}

// Aspects layer in masterPredictionEngine.ts was always receiving [] because
// nothing computed real aspects here — this fixes that. Aspect TYPE is
// computed from real angular separation; "applying" is NOT true motion-based
// applying/separating (that needs planetary speed, which PlanetPlacement
// doesn't carry) — defaulted to false (treated as separating/half-weight)
// as the conservative assumption until real speed data exists upstream.
function computeAspects(planetsInHouses: ChartData["planetsInHouses"]): ChartData["aspects"] {
  const aspects: ChartData["aspects"] = [];
  const ORBS: Record<string, number> = {
    conjunction: 8,
    sextile: 6,
    square: 8,
    trine: 8,
    opposition: 8,
  };
  const ANGLES: Record<string, number> = {
    conjunction: 0,
    sextile: 60,
    square: 90,
    trine: 120,
    opposition: 180,
  };

  for (let i = 0; i < planetsInHouses.length; i++) {
    for (let j = i + 1; j < planetsInHouses.length; j++) {
      const a = planetsInHouses[i];
      const b = planetsInHouses[j];
      const rawDiff = Math.abs(a.eclipticLon - b.eclipticLon) % 360;
      const sep = rawDiff > 180 ? 360 - rawDiff : rawDiff;

      for (const [type, angle] of Object.entries(ANGLES)) {
        if (Math.abs(sep - angle) <= ORBS[type]) {
          aspects.push({
            planetA: a.planet,
            planetB: b.planet,
            aspectType: type as ChartData["aspects"][number]["aspectType"],
            applying: false, // see note above — real applying/separating needs speed data
          });
          break; // one aspect type per pair, tightest match wins by iteration order
        }
      }
    }
  }
  return aspects;
}

export interface SportsHoraryOutput {
  answer: string;
  score: { score: number; verdict: string; flags: string[]; breakdown: string[] };
  usedChart: "transit" | "natal";
}

export function buildChartData(chart: Chart, ascendant?: number): ChartData {
  const planetsInHouses: ChartData["planetsInHouses"] = [];
  const planetLookup: Record<string, SportsHoraryPlacement> = {};
  const cusps = ascendant !== undefined ? buildEqualHouseCusps(ascendant) : undefined;

  // Compute absolute house cusp longitudes once, reuse for lots and downstream layers (KP, etc.)
  const houseCuspLons: number[] | undefined = cusps
    ? Array.from({ length: 12 }, (_, i) => {
        const c = cusps[i + 1];
        return SIGN_ORDER.indexOf(c.sign) * 30 + c.degree;
      })
    : undefined;

  for (const [planetName, placement] of Object.entries(chart)) {
    const eclipticLon = placement.eclipticLon ?? (SIGN_ORDER.indexOf(placement.sign) * 30 + placement.degree);
    const house = placement.house ?? (cusps ? getHouseFromLon(eclipticLon, cusps) : 1);

    const planetPlacement = toSportsHoraryPlacement(planetName, eclipticLon, { ...placement, house });

    planetsInHouses.push(planetPlacement);
    planetLookup[planetName] = planetPlacement;
  }

  // Real house-lord assignment: house N's lord is whoever rules the SIGN ON
  // HOUSE N'S CUSP — not "any planet that happens to be sitting in its own
  // sign somewhere." The previous version only picked up planets in own-sign
  // (a rare coincidence) and mislabeled them as ruling their OWN current
  // house, which is a different concept entirely and usually just wrong.
  const houseLords: ChartData["houseLords"] = [];
  const houseAudit: ChartData["houseAudit"] = [];
  if (ascendant !== undefined) {
    const cusps = buildEqualHouseCusps(ascendant);
    for (let house = 1; house <= 12; house++) {
      const cuspSign = cusps[house].sign;
      const lordPlanet = SIGN_RULERS[cuspSign];
      const lordPlacement = lordPlanet ? planetLookup[lordPlanet] : undefined;

      houseAudit.push({
        house,
        cuspSign,
        lordPlanet: lordPlanet ?? null,
        lordSign: lordPlacement?.sign ?? null,
        lordHouse: lordPlacement?.house ?? null,
      });

      if (lordPlanet && lordPlacement) {
        houseLords.push({
          house,
          lordPlanet,
          placement: lordPlacement,
        });
      }
    }
  }

  // Calculate Arabic Lots using unified core and canonical house assignment
  let lots: ChartData["lots"] = [];
  if (ascendant !== undefined) {
    const sunHouse = planetLookup["Sun"]?.house;
    const night = sunHouse !== undefined ? isNight(sunHouse) : false;
    
    // Convert Record<number, {sign, degree}> to number[] for astrologyCore
    const cuspsMap = buildEqualHouseCusps(ascendant);
    const houseCusps = Object.values(cuspsMap).map(c => (SIGN_ORDER.indexOf(c.sign) * 30) + c.degree);

    const canonicalLots = calculateCanonicalArabicLots(chart, ascendant, night, houseCusps);
    lots = canonicalLots.map(lot => ({
      name: lot.name,
      house: lot.house,
      sign: lot.sign,
      degree: lot.degree,
      longitude: lot.longitude,
      meaning: lot.meaning,
      formula: lot.formula,
    }));
  }

  // Real Moon phase from the chart instead of a hardcoded stub.
  // Void-of-course detection isn't implemented yet — flagged false rather than
  // silently faked as a specific state; the Moon layer still fires, just
  // without a VOC penalty until that detection exists.
  const moonTone = detectMoonPhase(chart);
  const moonPhase: ChartData["moon"]["phase"] =
    moonTone?.includes("New Moon") ? "new" :
    moonTone?.includes("Full Moon") ? "full" :
    moonTone?.includes("Waning") ? "waning" : "waxing";

  return {
    houseLords,
    houseAudit,
    planetsInHouses,
    lots,
    fixedStars: [],
    aspects: computeAspects(planetsInHouses),
    moon: {
      phase: moonPhase,
      isVoidOfCourse: false,
      nakshatra: chart.Moon ? getNakshatraAt(SIGN_ORDER.indexOf(chart.Moon.sign) * 30 + chart.Moon.degree).nakshatra.name : "Ashwini",
    },
    houseCusps: houseCuspLons,
  };
}

export async function buildSportsHoraryChartViaLLM(
  chart: Chart,
  _favoriteTeam: string,
  _challengerTeam: string,
  ascendant?: number,
): Promise<ChartData | null> {
  const placementCount = Object.keys(chart).length;
  if (placementCount < 5) {
    return null;
  }
  return buildChartData(chart, ascendant);
}

function buildReadingPrompt(
  input: { question: string; favoriteName?: string; challengerName?: string },
  prediction: ReturnType<typeof calculateFullPrediction>,
  breakdown: string,
): string {
  const fav = input.favoriteName || "Favorite";
  const chall = input.challengerName || "Challenger";
  const winner =
    prediction.predictedWinner === "A"
      ? fav
      : prediction.predictedWinner === "B"
        ? chall
        : "Neither — too close to call";

  const margin = Math.abs(prediction.margin);
  const favTotal = prediction.sideATotal;
  const challTotal = prediction.sideBTotal;
  const isCloseCall = margin < 10;

  return `You are the Firmament oracle — master of territorial control and celestial verdict.

CRITICAL: Do NOT generate template prose. Do NOT say "dead even" or "both hands empty" if the data shows a clear winner.

ACTUAL ENGINE COMPUTED DATA (reference these exact values in your narration):
- ${fav} (Side A) Total: ${favTotal.toFixed(2)} points
- ${chall} (Side B) Total: ${challTotal.toFixed(2)} points
- Margin: ${margin.toFixed(2)} points
- Confidence: ${prediction.confidence}%
- Verdict: ${winner}
- Call Type: ${isCloseCall ? "Close call" : "Clear call"}

SCORING BREAKDOWN (cite these in your reading):
${breakdown}

MANDATORY INSTRUCTIONS:
1. **NEVER say "dead even" if margin is NOT zero.** If margin is ${margin}, explicitly state the gap.
2. **Reference the actual totals.** Example: "${fav} accumulated ${favTotal.toFixed(1)} points across the cluster, while ${chall} registered ${challTotal.toFixed(1)} — a swing of ${margin.toFixed(1)} in favor of ${favTotal > challTotal ? fav : chall}."
3. **If lots are scored, reference them.** Don't say "both hands empty" — say which lots landed where and what side they favor.
4. **Confidence language:** Margin < 5 = "genuine uncertainty"; 5–15 = "moderate edge"; > 15 = "clear advantage"
5. **No generic templates.** Every sentence must trace to the specific numbers above.

STRUCTURE:
- **The Verdict** (state the winner plainly, cite the margin)
- **Why** (which houses/lords dominated, reference the breakdown)
- **Confidence** (tie it to the margin value — don't invent a generic percentage)
- **Final Word** (one sentence oracle wisdom)

TONE: Direct, specific, data-grounded oracle. Every claim is traceable to a named placement or scored layer above.`;
}

export async function sportsHoraryLayer(input: {
  question: string;
  natalText: string;
  transitText: string;
  favoriteName?: string;
  challengerName?: string;
  history?: Message[];
}): Promise<SportsHoraryOutput> {
  const { result } = runAstroReading(input.natalText, input.transitText, "");

  const transits = result?.transits ?? {};
  const natal = result?.natal ?? {};
  const usedChart: "transit" | "natal" =
    Object.keys(transits).length >= 5 ? "transit" : "natal";

  const chart = usedChart === "transit" ? transits : natal;
  // This was the root bug: ascendant was parsed by astroEngine but never
  // retrieved here, so it was always undefined and Arabic Lots were always [].
  const ascendant = result?.ascendant ?? undefined;
  const chartData = await buildSportsHoraryChartViaLLM(
    chart,
    input.favoriteName || "Favorite",
    input.challengerName || "Challenger",
    ascendant
  );

  if (!chartData || chartData.houseLords.length === 0) {
    return {
      answer:
        "I couldn't resolve enough placements to cast the sports chart — I need at least 5+ planets with signs and houses. Paste a full chart and try again.",
      score: { score: 0, verdict: "Even", flags: ["insufficient_data"], breakdown: [] },
      usedChart,
    };
  }

  const config: ClusterConfig = {
    sideAHouses: [1, 3, 6, 10, 11],
    sideBHouses: [7, 9, 12, 4, 5],
    sideALabel: input.favoriteName || "Favorite",
    sideBLabel: input.challengerName || "Challenger",
  };

  const prediction = calculateFullPrediction(chartData, config);

  const breakdown = prediction.breakdown
    .map(layer => `• ${layer.layer}: A=${layer.sideAPoints} B=${layer.sideBPoints}`)
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

  const verdict = prediction.predictedWinner === "A" ? "Favorite" : prediction.predictedWinner === "B" ? "Challenger" : "Even";

  return {
    answer: (response.choices[0].message.content as string).trim(),
    score: {
      score: prediction.sideATotal - prediction.sideBTotal,
      verdict,
      flags: [],
      breakdown: prediction.breakdown.map(b => `${b.layer}: A=${b.sideAPoints} B=${b.sideBPoints}`)
    },
    usedChart,
  };
}
