// ─── Synthesize Router ────────────────────────────────────────────────────────
// Drop-in replacement for the synthesize section of your appRouter file.
// Change from previous version: HOUSE_TOPICS and PLANET_CORE from astroEngine
// are now injected into the synthesis prompt so Claude reasons from your
// semantic vocabulary rather than inventing its own.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { publicProcedure, router } from "./trpc";
// import { enrichChartData } from "./enrichChartData"; // adjust if inline
import { HOUSE_TOPICS, PLANET_CORE } from "../astroEngine";
import { detectAspects } from "../patternEngine";
import { buildWisdomBlock } from "../wisdomLayer";

// ─── Semantic Block Builder ───────────────────────────────────────────────────
// Converts the engine's dictionaries into a plain-text reference block that
// Claude reads before writing. This keeps the reading and the pillar scores
// anchored to the same definitions.

function buildSemanticBlock(): string {
  const houseLines = Object.entries(HOUSE_TOPICS)
    .map(([n, v]) => `  House ${n}: ${v}`)
    .join("\n");

  const planetLines = Object.entries(PLANET_CORE)
    .map(
      ([planet, dims]) =>
        `  ${planet}\n    mind:   ${(dims as any).mind}\n    soul:   ${(dims as any).soul}\n    spirit: ${(dims as any).spirit}`
    )
    .join("\n\n");

  return `
━━━ SEMANTIC REFERENCE — USE THESE EXACT MEANINGS ━━━

HOUSE MEANINGS
When a planet's house number is known, interpret it through this vocabulary.
Do not substitute generic house keywords — use these specific ones.
${houseLines}

PLANET CORE MEANINGS
Each planet operates on three dimensions. Use the relevant dimension(s)
depending on which pillar (Mind / Soul / Spirit) you are writing about.
${planetLines}

━━━ END SEMANTIC REFERENCE ━━━`;
}

// ─── Base Prompt ──────────────────────────────────────────────────────────────

const BASE_SYNTHESIS_PROMPT = `You are a skilled astrologer operating within the ancient sky-observation tradition — Babylonian, Vedic, Hellenistic, Arab, and Egyptian sources combined.

${buildSemanticBlock()}

CRITICAL INSTRUCTION — FIXED STARS:
If the enriched chart data contains FIXED STAR CONJUNCTIONS, especially Royal Stars
(Aldebaran, Regulus, Antares, Fomalhaut), lead the reading with them. Fixed star
conjunctions are the most ancient and powerful layer of any chart. A planet conjunct
a Royal Star is a defining signature of that person's life — it overrides sign and
house interpretation in terms of prominence. Name the star, name its tradition,
explain what it means for this specific planet and person. Give it full paragraphs,
not a passing mention.

Multiple fixed star conjunctions in one chart are extremely rare and must be treated
as the dominant theme of the reading.

INSTRUCTION — ROYAL STAR WEIGHT:
When Venus, Sun, Moon, or Jupiter conjunct a Royal Star — this is a mark of someone
cosmically designated for their field. Do not soften this. State it plainly and build
the reading around it.

BEFORE WRITING — ask yourself three questions about this specific chart:
1. What is the strongest force in this chart?
2. What is the rarest force in this chart?
3. What would make this chart recognizable from a distance?
Lead with those themes. Do not spend equal space on minor and major indicators.

READING STRUCTURE:
1. Open with fixed star conjunctions if present — these are the headline
2. Then move through the chart by pillar:
   - MIND: governed by Mercury (analysis, language, nervous system) and Moon (habit mind, memory). 
     Use the PLANET CORE meanings above. Reference the house the planet falls in using HOUSE MEANINGS above.
   - SOUL: governed by Moon (nourishment, belonging, safety) and Venus (love, attachment, self-worth).
     Use the PLANET CORE meanings above. Reference the house the planet falls in using HOUSE MEANINGS above.
   - SPIRIT: governed by Sun (will, identity, life-force) and Jupiter (meaning-making, blessing, dharma).
     Use the PLANET CORE meanings above. Reference the house the planet falls in using HOUSE MEANINGS above.
3. KEY PLACEMENTS: name the 2–3 most powerful placements — exaltations, debilitations, angular houses, 
   rare conjunctions. Use the house meanings to describe what life arena each one operates in.
4. Close with dharmic synthesis — the overall story, the central tension, the one true thing.

DIGNITY RULES (apply when relevant):
- Exalted planet: operating at peak expression of its PLANET CORE meaning
- Debilitated planet: the PLANET CORE meaning is distorted, suppressed, or overcompensated
- Own sign: the planet expresses its PLANET CORE meaning directly, without friction
- Retrograde: the PLANET CORE meaning turns inward — internalized, delayed, or intensified privately

Write with directness and depth. No generic affirmations. Speak to what is actually in the chart.
Every paragraph should be traceable back to a specific placement. This is a real person's life.`;

// ─── Router ───────────────────────────────────────────────────────────────────

export const synthesizeRouter = router({
  synthesize: publicProcedure
    .input(
      z.object({
        chartData: z.any(),
        userQuestion: z.string().optional(),
        systemPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const { chartData, userQuestion, systemPrompt } = input;

      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const enriched = chartData; // enrichChartData removed

      let wisdomBlock = "";
      try {
        const planetsForAspects = (chartData as any)?.planets || (chartData as any)?.chart?.planets;
        if (planetsForAspects) {
          const aspectConfig = { orbConjunction: 7, orbOpposition: 7, orbTrine: 5, orbSquare: 5, orbSextile: 4, orbQuincunx: 3 };
          const aspects = detectAspects(planetsForAspects, aspectConfig);
          const aspectMotions = aspects.map((a: any) => a.motion).filter(Boolean);
          if (aspectMotions.length > 0) {
            wisdomBlock = buildWisdomBlock({ aspectMotions: aspectMotions as any });
          }
        }
      } catch (err) {
        console.error("wisdom block generation skipped:", err);
      }

      const userMessage = [
        `Chart data:\n${JSON.stringify(chartData, null, 2)}`,
        `\nEnriched Analysis:\n${enriched}`,
        wisdomBlock ? `\nAspect Motion Notes:\n${wisdomBlock}` : "",
        `\nQuestion: ${userQuestion || "Please provide a general reading."}`,
      ].join("");

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: systemPrompt || BASE_SYNTHESIS_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });

      return { reading: (response.content[0] as { text: string }).text };
    }),
});
