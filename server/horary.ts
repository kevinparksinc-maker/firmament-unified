/**
 * HORARY LAYER — The Firmament
 *
 * Accepts natal placements + current transits + a question.
 * Routes everything through the Firmament Engine → Anthropic SDK.
 *
 * Chain:
 *   question + natalText + transitText
 *     → detectIntent / detectFocus
 *     → buildPrompt() from firmamentEngine
 *     → Anthropic SDK
 *     → HoraryOutput
 */

import { invokeLLM, type Message } from "./_core/llm";
// import { buildPrompt } from "@shared/firmamentEngine"; // removed: pointed at a single-planet function in FirmamentEngine.tsx, not usable here
import {
  runAstroReading,
  type PlanetPlacement,
  type Activation,
} from "./astroEngine";
import {
  getDignityFlavor,
  buildStarBlock,
  buildKabbalahBlock,
} from "./firmamentKnowledge";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type HoraryIntent =
  | "general"
  | "explain"
  | "action"
  | "simulate"
  | "isolate"
  | "timing";

export type HoraryFocus =
  | "general"
  | "career"
  | "relationships"
  | "finance"
  | "health"
  | "spirituality"
  | "creativity"
  | "home";

export interface HoraryInput {
  question: string;
  natalText: string; // raw natal placement text
  transitText: string; // raw current sky / transit text
  name?: string;
  history?: Message[];
}

export interface HoraryOutput {
  answer: string;
  intent: HoraryIntent;
  focus: HoraryFocus;
  state: {
    lastQuestion: string;
    lastIntent: HoraryIntent;
    lastFocus: HoraryFocus;
  };
}

// ─── INTENT DETECTION ────────────────────────────────────────────────────────

function detectIntent(q: string): HoraryIntent {
  if (q.includes("why") || q.includes("reason")) return "explain";
  if (
    q.includes("what should") ||
    q.includes("what do i do") ||
    q.includes("how do i")
  )
    return "action";
  if (q.includes("what if") || q.includes("should i")) return "simulate";
  if (
    q.includes("which planet") ||
    q.includes("what energy") ||
    q.includes("which")
  )
    return "isolate";
  if (q.includes("when") || q.includes("timing") || q.includes("how long"))
    return "timing";
  return "general";
}

function detectFocus(q: string): HoraryFocus {
  if (
    q.includes("career") ||
    q.includes("work") ||
    q.includes("job") ||
    q.includes("business")
  )
    return "career";
  if (
    q.includes("love") ||
    q.includes("partner") ||
    q.includes("relationship") ||
    q.includes("marriage")
  )
    return "relationships";
  if (
    q.includes("money") ||
    q.includes("finance") ||
    q.includes("income") ||
    q.includes("wealth")
  )
    return "finance";
  if (
    q.includes("health") ||
    q.includes("body") ||
    q.includes("sick") ||
    q.includes("healing")
  )
    return "health";
  if (
    q.includes("spirit") ||
    q.includes("purpose") ||
    q.includes("dharma") ||
    q.includes("soul")
  )
    return "spirituality";
  if (
    q.includes("creat") ||
    q.includes("art") ||
    q.includes("music") ||
    q.includes("build")
  )
    return "creativity";
  if (
    q.includes("home") ||
    q.includes("family") ||
    q.includes("move") ||
    q.includes("living")
  )
    return "home";
  return "general";
}

// ─── INTENT / FOCUS INSTRUCTIONS ─────────────────────────────────────────────

const INTENT_INSTRUCTIONS: Record<HoraryIntent, string> = {
  general:
    "Give a complete reading of how the current sky speaks to this natal chart in relation to the question.",
  explain:
    "Focus on WHY this is happening. Trace it through the planetary contacts. Name the exact mechanism.",
  action:
    "Focus on WHAT TO DO. Be direct. Name the action, the timing, the planet to work with.",
  simulate:
    "Read the chart as a decision point. What does each path look like through these placements?",
  isolate:
    "Identify the KEY PLANET most relevant to this question. Name it, explain why, read it fully.",
  timing:
    "Focus on TIMING. Which planets are moving, what aspects are forming, when do they perfect.",
};

const FOCUS_INSTRUCTIONS: Record<HoraryFocus, string> = {
  general: "Read the full chart without narrowing the focus.",
  career:
    "Focus on 10th house, Saturn, Sun, and any planets in public-facing houses.",
  relationships: "Focus on 7th house, Venus, Moon, and the nodal axis.",
  finance: "Focus on 2nd and 8th house, Jupiter, Venus, and wealth indicators.",
  health:
    "Focus on 1st and 6th house, the Moon, Mars, and the Ascendant ruler.",
  spirituality:
    "Focus on 9th and 12th house, Jupiter, Ketu, and the nodal axis.",
  creativity: "Focus on 5th house, Sun, Venus, and Mercury.",
  home: "Focus on 4th house, Moon, Saturn, and the IC.",
};

// ─── STRUCTURED CHART DATA FORMATTING ────────────────────────────────────────
// These take the already-parsed output of runAstroReading() (the same engine
// the natal/transit reading pipeline uses) and render it as clean text the
// AI can read directly, instead of making the AI re-parse raw pasted input.

function formatPlacement(p: PlanetPlacement): string {
  const houseStr = p.house ? `, ${p.house}th house` : "";
  const flags = [
    p.rx ? "Rx" : null,
    p.combust ? "combust" : null,
    p.cazimi ? "cazimi" : null,
  ]
    .filter(Boolean)
    .join(", ");
  return `${p.planet}: ${p.degree.toFixed(2)}° ${p.sign}${houseStr}${flags ? ` (${flags})` : ""}`;
}

function formatPlacements(placements: Record<string, PlanetPlacement>): string {
  const lines = Object.values(placements).map(formatPlacement);
  return lines.length ? lines.join("\n") : "(none parsed)";
}

function formatActivations(activations: Activation[]): string {
  if (!activations.length) return "(no transit-to-natal activations detected)";
  return activations
    .map(
      a =>
        `Transit ${a.transitPlanet} (${a.transit.sign}${a.transit.house ? `, ${a.transit.house}th house` : ""}) ${a.aspect} Natal ${a.natalPlanet} (${a.natal.sign}${a.natal.house ? `, ${a.natal.house}th house` : ""}). Orb ${a.orb}°. Priority weight ${a.priority}. — ${a.summary}`
    )
    .join("\n");
}

// Builds the dignity / fixed-star / Kabbalah layer for EVERY natal planet at
// once (not one planet at a time) — pulling the same knowledge FirmamentEngine.tsx
// uses for its single-planet deep-dive readings, but applied across the whole
// chart so the horary AI gets the full symbolic layer, not just positional data.
function buildWholeChartKabbalahBlock(
  natal: Record<string, PlanetPlacement>,
  activations: Activation[]
): string {
  const planets = Object.values(natal);
  if (!planets.length) return "";

  const blocks = planets.map(p => {
    const planetActivations = activations
      .filter(a => a.natalPlanet === p.planet)
      .map(a => ({ type: a.aspect, planet2: a.transitPlanet }));

    const dignityFlavor = getDignityFlavor(p.planet, p.sign);
    const dignityLine = dignityFlavor
      ? `DIGNITY: ${dignityFlavor}`
      : `DIGNITY: ${p.planet} in ${p.sign} carries no notable dignity or debility.`;

    const starBlock = buildStarBlock(p.planet, p.sign, p.degree);
    const kabbalahBlock = buildKabbalahBlock(
      p.planet,
      p.sign,
      planetActivations
    );

    return `─── ${p.planet} (${p.degree.toFixed(2)}° ${p.sign}${p.house ? `, ${p.house}th house` : ""}) ───
${dignityLine}

${starBlock}

${kabbalahBlock}`;
  });

  return `KABBALAH / FIXED STAR / DIGNITY LAYER — THE OPERATING SYSTEM UNDERNEATH THE CHART
This is the symbolic substrate for every natal planet. Use it as the coordinate grid underneath the reading — weave it in as texture and undertone, do not announce it mechanically or list it back verbatim.

${blocks.join("\n\n")}`;
}


function buildHoraryPrompt(
  input: HoraryInput,
  intent: HoraryIntent,
  focus: HoraryFocus,
  structured: {
    natal: Record<string, PlanetPlacement>;
    transits: Record<string, PlanetPlacement>;
    activations: Activation[];
  } | null
): string {
  const { question, natalText, transitText, name } = input;

  // Prefer the structured, engine-parsed chart data (same parser/activation
  // detector the natal+transit reading pipeline uses) so the AI is reading
  // resolved degrees/signs/houses/aspects instead of re-parsing raw pasted
  // text itself. Falls back to the raw text if the engine couldn't parse
  // enough placements (e.g. too few lines recognized).
  const natalPrompt = structured
    ? formatPlacements(structured.natal)
    : natalText;
  const transitPrompt = structured
    ? formatPlacements(structured.transits)
    : transitText;
  const activationsBlock = structured
    ? `\n\nDETECTED TRANSIT-TO-NATAL ACTIVATIONS (engine-computed, already scored by orb/priority):\n${formatActivations(structured.activations)}`
    : "";
  const kabbalahBlock = structured
    ? `\n\n${buildWholeChartKabbalahBlock(structured.natal, structured.activations)}`
    : "";

  return `You are reading a horary chart through the Firmament cosmological framework — the fixed dome sky system used by the Babylonians, Vedics, Egyptians, and Hellenistic tradition.

THE FIXED SKY: Planets wander against a fixed star backdrop. Positions are tropical. Fixed stars are sidereal anchors. Royal Stars — Aldebaran, Regulus, Antares, Fomalhaut — are the four Watchers. Traditional Vedic rulers only. No outer planet rulerships. No precession.

You are a personal astrologer engaged in a deep, ongoing conversation with the querent. You have already provided an initial reading, and now you are answering their follow-up questions or continuing the dialogue.

CRITICAL INSTRUCTION: You must maintain a consistent, wise, and direct persona. You are not an AI; you are a master of the ancient sky. Every sentence must trace to a specific placement — degree, sign, house, aspect, orb — and every placement must be translated into something that happens in an actual human life.

═══════════════════════════════════════════════
QUERENT${name ? `: ${name}` : ""}
LATEST QUESTION: ${question}
═══════════════════════════════════════════════

NATAL CHART — THE FOUNDATION:
${natalPrompt}

CURRENT SKY — THE TRANSITS:
${transitPrompt}
${activationsBlock}
${kabbalahBlock}

═══════════════════════════════════════════════
FOCUS: ${focus.toUpperCase()} — ${FOCUS_INSTRUCTIONS[focus]}
MODE: ${intent.toUpperCase()} — ${INTENT_INSTRUCTIONS[intent]}
═══════════════════════════════════════════════

CONVERSATIONAL RULES:
1. If this is a follow-up question, refer back to what was discussed previously if relevant.
2. Maintain the "sitting across the table" feel. Use "I" and "you."
3. Be direct and specific. No generic affirmations.
4. If the user asks for more detail on a specific planet or house, dive deep into the Kabbalah and Fixed Star layers provided in the data above.
5. Every claim must be traceable to a named placement.

RESPONSE STRUCTURE:
- If the user asks a broad new question, follow the structured sections (## THE SKY SPEAKS, ## WHAT THIS MEANS, etc.).
- If the user is asking a specific follow-up or clarifying point, respond in a natural conversational flow (3-4 paragraphs), but still use Markdown headers to keep the reading organized.
- Always include a concrete "WHAT TO DO" or "WATCH FOR" element in every response.

STANDARD: No filler, no hedging, no astrology-book language ("this represents," "this symbolizes"). Write the way a real person would talk about another real person's actual life. This should feel like a living, breathing consultation.`;
}

// ─── MAIN HORARY FUNCTION ────────────────────────────────────────────────────

export async function horaryLayer(input: HoraryInput): Promise<HoraryOutput> {
  const q = input.question.toLowerCase();
  const intent = detectIntent(q);
  const focus = detectFocus(q);

  // Run the same structured engine the natal/transit reading pipeline uses.
  const { result: engineResult } = runAstroReading(
    input.natalText,
    input.transitText,
    ""
  );
  const structured = engineResult
    ? {
        natal: engineResult.natal,
        transits: engineResult.transits,
        activations: engineResult.activations,
      }
    : null;

  const systemPrompt = buildHoraryPrompt(input, intent, focus, structured);

  const messages: Message[] = [
    ...(input.history || []),
    { role: "user", content: input.question },
  ];

  const response = await invokeLLM({
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_tokens: 3500,
  });

  const answer = response.choices[0].message.content as string;

  return {
    answer: answer.trim(),
    intent,
    focus,
    state: {
      lastQuestion: input.question,
      lastIntent: intent,
      lastFocus: focus,
    },
  };
}
