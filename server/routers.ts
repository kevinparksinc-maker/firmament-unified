import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./_core/authRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { buildLensPrompt } from "./lib/readings/buildLensPrompt";
import { LENSES } from "./lib/readings/lensRules";
import { saveChart, getUserCharts, getChart, deleteChart } from "./db";
import {
  calculateChart,
  formatChartForReading,
  getHouseCuspInfo,
} from "./ephemeris";
import { transformChartToFlatPlane } from "./coordinateTransformer";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { fromZonedTime } from "date-fns-tz";
import tzLookup from "tz-lookup";
import { horaryLayer } from "./horary";
import { askZeteticAtlas } from "./zeteticAtlasDialogue";
import { sportsHoraryLayer } from "./sportsHoraryReading";
import { sportsHoraryV2Layer } from "./sportsHoraryV2Reading";

import {
  detectFixedStarConjunctions,
  formatStarConjunctions,
} from "./fixedStars";
import { getNakshatraAt } from "./nakshatra";
import { getDecanFlavor } from "./decan";
import { isNight, calculateCanonicalArabicLots } from "./astrologyCore";
import { getPlanetInHouse } from "./planetInHouse";

// ─── Core Cosmology Framework ─────────────────────────────────────────────────
// This is the foundation of every reading in this app.

const COSMOLOGY_PREAMBLE = `COSMOLOGICAL FRAMEWORK — READ THIS FIRST:

This app operates on the original, ancient sky-observation system — the same framework used by the Babylonians, Vedic astronomers, Egyptians, and Hellenistic astrologers who first mapped the heavens.

THE CORE PRINCIPLE: The sky is observed as it actually appears from Earth. The fixed stars form the permanent backdrop — they are truly fixed, they do not move in any meaningful human timeframe. Polaris sits at the celestial north pole, the still center that everything else rotates around. Every star, every planet traces a circle around Polaris. It never rises, it never sets. The ancient navigators and astronomers built entire civilizations around this observable fact.

THE PLANETS are wanderers — they move against the fixed star backdrop. Their positions are measured against the fixed stars, not against a theoretical precessing equinox. This is the Sidereal system — the real sky, not a mathematical correction.

DO NOT use heliocentric language ("Earth orbits the Sun"). DO NOT reference precession or wobble. Speak from the perspective of the observer on Earth watching the sky. The sky moves around us. That is what is observable and measurable.

FIXED STARS matter deeply. When a planet sits conjunct a fixed star, that star's nature and meaning infuses the planet. The Royal Stars — Aldebaran, Regulus, Antares, Fomalhaut — are the four Watchers of the Sky, the most powerful stars. Polaris conjunctions are rare and profound.

ALL PLANETS are valid — including Pluto, Neptune, and Uranus. They have been observed and their positions are measurable. They are wanderers like the rest.

TRADITIONAL VEDIC RULERS govern the signs: Mars rules Aries and Scorpio, Venus rules Taurus and Libra, Mercury rules Gemini and Virgo, Moon rules Cancer, Sun rules Leo, Jupiter rules Sagittarius and Pisces, Saturn rules Capricorn and Aquarius.

Write from this worldview. This is the truth of the sky as it can be directly observed.`;

// ─── Shared Constants ─────────────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

// ─── Chart Enrichment Helper ──────────────────────────────────────────────────

function enrichChartData(
  planets: Record<
    string,
    { sign: string; degree: number; house?: number; absolute?: number }
  >,
  fullPlanets?: any[],
  ascendant?: number
): string {
  const lines: string[] = [];

  for (const [name, p] of Object.entries(planets)) {
    const abs =
      p.eclipticLon ??
      (() => {
        const i = ZODIAC_SIGNS.indexOf(p.sign);
        return i >= 0 ? i * 30 + p.degree : null;
      })();

    if (abs == null) continue;

    const { nakshatra, pada } = getNakshatraAt(abs);
    const decan = getDecanFlavor(p.sign, p.degree);
    const house = p.house ? `, ${p.house}th house` : "";

    const houseMeaning = p.house ? getPlanetInHouse(name, p.house) : null;
    const houseText = houseMeaning ? ` | House theme: ${houseMeaning.core}` : "";

    lines.push(
      `${name}: ${p.degree}° ${p.sign}${house} | Nakshatra: ${nakshatra.name} pada ${pada} (${nakshatra.lord}) | Decan: ${decan}${houseText}`
    );
  }

  // Fixed star conjunctions
  const placementsForStars: Record<
    string,
    { sign: string; degree: number; planet: string; absolute: number | null }
  > = {};
  for (const [name, p] of Object.entries(planets)) {
    const i = ZODIAC_SIGNS.indexOf(p.sign);
    placementsForStars[name] = {
      sign: p.sign,
      degree: p.degree,
      planet: name,
      absolute: p.eclipticLon ?? (i >= 0 ? i * 30 + p.degree : null),
    };
  }

  const conjunctions = detectFixedStarConjunctions(placementsForStars);
  const starText = formatStarConjunctions(conjunctions);

  // Calculate Arabic Lots (if full planets and ascendant provided)
  let lotsText = "";
  if (fullPlanets && ascendant !== undefined) {
    const planetsMap = fullPlanets.reduce(
      (acc: any, p: any) => {
        acc[p.name] = p;
        return acc;
      },
      {} as Record<string, any>
    );
    const sunPlacement = fullPlanets.find((p: any) => p.name === "Sun");
    const sunHouse = sunPlacement?.house ?? 1;
    const night = isNight(sunHouse);
    
    // For general readings, we approximate house cusps as whole sign boundaries
    const houseCusps = Array.from({ length: 12 }, (_, i) => i * 30);
    const lots = calculateCanonicalArabicLots(planetsMap, ascendant, night, houseCusps);
    lotsText = lots
      .map(
        (lot: any) =>
          `${lot.name}: ${lot.degree}° ${lot.sign} | ${lot.meaning}`
      )
      .join("\n");
  }

  return (
    lines.join("\n") +
    "\n\nFIXED STAR CONJUNCTIONS:\n" +
    starText +
    (lotsText ? "\n\nARABIC LOTS:\n" + lotsText : "")
  );
}

// ─── OCR Router ───────────────────────────────────────────────────────────────

const ocrRouter = router({
  extractText: publicProcedure
    .input(
      z.object({
        images: z.array(z.string()).min(1).max(10),
        type: z.enum(["natal", "transit"]),
      })
    )
    .mutation(async ({ input }) => {
      const { images, type } = input;

      const systemPrompt =
        type === "natal"
          ? `You are an expert ancient sky-chart reader. Extract ALL planetary and fixed star placements from the provided screenshot(s).
Output ONLY the raw placement data, one item per line, in this exact format:
Planet: Degree° Arcminutes' Sign, Nth house

CRITICAL RULES:
- NEVER write "Transit" before any planet name — these are NATAL placements
- Map "North Node" or "North Node (True)" → write as "Rahu"
- Map "South Node" or "South Node (True)" → write as "Ketu"
- Map "Ascendant" or "AC" → write as "Asc"
- Include ALL planets shown: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Rahu, Ketu, Asc
- Include fixed stars if shown (Antares, Aldebaran, Regulus, Polaris, Sirius, Spica, etc.)
- Note Rx (retrograde) if shown
- Include arcminutes and house number if visible
- Do NOT include any explanation, headers, or extra text — only the placement lines

Example output:
Sun: 3° 27' Scorpio, 12th house
Moon: 18° 55' Gemini, 7th house
Mercury Rx: 18° 47' Libra, 11th house
Pluto: 13° 32' Libra, 11th house
Rahu: 25° 37' Pisces, 4th house
Antares: 15° 00' Scorpio, 12th house`
          : `You are an expert ancient sky-chart reader. Extract ALL current planetary positions from the provided screenshot(s).
Output ONLY the raw transit data, one planet per line, in this exact format:
Transit Planet: Degree° Sign

Rules:
- Include ALL planets: Transit Sun, Transit Moon, Transit Mercury, Transit Venus, Transit Mars, Transit Jupiter, Transit Saturn, Transit Uranus, Transit Neptune, Transit Pluto, Transit Rahu, Transit Ketu
- Note Rx (retrograde) if shown
- If house number is visible, include it
- Do NOT include any explanation, headers, or extra text`;

      const imageContents = images.map(imgUrl => ({
        type: "image_url" as const,
        image_url: { url: imgUrl, detail: "high" as const },
      }));

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              ...imageContents,
              {
                type: "text" as const,
                text: `Extract all ${type === "natal" ? "natal birth chart" : "current transit"} planetary placements from these ${images.length} screenshot(s). Output only the placement lines.`,
              },
            ],
          },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content ?? "";
      const extracted = typeof rawContent === "string" ? rawContent : "";
      return { text: extracted.trim() };
    }),
});

// ─── AI Interpretation Router ─────────────────────────────────────────────────

const aiRouter = router({
  interpretChart: publicProcedure
    .input(
      z.object({
        placements: z.string().min(10),
        context: z.string().optional(),
        mode: z.enum(["natal", "transit", "full"]),
        transitPlacements: z.string().optional(),
        fixedStarConjunctions: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        placements,
        context,
        mode,
        transitPlacements,
        fixedStarConjunctions,
      } = input;

      // Auto-enrich if structured data available (fallback to passed-in fixedStarConjunctions)
      const starSection =
        fixedStarConjunctions &&
        fixedStarConjunctions !== "No exact fixed star conjunctions detected."
          ? `\nFIXED STAR CONJUNCTIONS DETECTED:\n${fixedStarConjunctions}\n`
          : "";

      let userPrompt = "";

      if (mode === "natal") {
        userPrompt = `Here is the natal chart:

${placements}
${starSection}
${context ? `\nPersonal context from the person: ${context}\n` : ""}

Please write a complete natal chart reading. This person wants to understand themselves deeply — who they are, how they think, what drives them, what their challenges and gifts are. Write as if you are speaking directly to them.

Use these exact section headers:

## MIND
How does this person think and communicate? Interpret Mercury's sign, house, and condition. What is their mental style — how do they process information, make decisions, express themselves? Include the Moon's influence on the mind. Be specific about what Mercury in ${placements.includes("Libra") ? "Libra" : "their sign"} actually means for how they think day to day.

## SOUL
What does this person need to feel whole? Interpret the Moon — their emotional nature, what nourishes them, what wounds them, how they love and need to be loved. Include Venus. Be honest about the emotional patterns this chart shows.

## SPIRIT
What is this person here to do? Interpret the Sun — their core identity, life purpose, where they're meant to shine. Include Jupiter. What is the dharmic path this chart points toward?

## KEY PLACEMENTS
Identify the 2-3 most powerful, unusual, or significant placements in this chart. These could be planets in their own sign or exaltation, debilitated planets, planets in angular houses, or any placement that stands out as defining. Explain what each one means for this person's actual life.
${starSection ? `\nAlso interpret any fixed star conjunctions listed above — these are ancient sky markers that infuse the planet with the star's power and meaning.\n` : ""}
## SYNTHESIS
What is the overall story of this chart? What are the main themes — the tensions, the gifts, the life lessons? If you could tell this person one true thing about who they are based on this chart, what would it be?

Write in flowing paragraphs. Be personal, specific, and honest. This person is reading their chart to understand their life — give them something real.`;
      } else if (mode === "transit") {
        userPrompt = `Here are the current planetary positions in the sky:

${placements}
${starSection}
${context ? `\nContext: ${context}\n` : ""}

Write a reading of the current sky — what energies are active right now, what themes are present for everyone, what the major planets are saying about this moment in time. Speak from the ancient sky-observation tradition — these are wanderers moving against the fixed star backdrop.

## CURRENT SKY
What are the dominant energies in the sky right now? What do Saturn, Jupiter, Mars, and the nodes indicate about the current period?

## WHAT THIS MEANS
What themes are active? What should people be aware of, lean into, or watch out for during this period?

## THE BIGGER PICTURE
What is the larger story the sky is telling right now?`;
      } else {
        // Full natal + transit
        userPrompt = `Here is the natal chart:
${placements}

Current sky positions:
${transitPlacements || ""}
${starSection}
${context ? `\nQUESTION FROM THE PERSON — answer this directly in your reading: ${context}\n` : ""}

Write a complete reading showing how the current sky is activating this natal chart right now. If a specific question was asked above, answer it directly using the chart and transits. This is personal — show how these specific transits are hitting this specific person's chart.

## CURRENT ACTIVATIONS
What are the most significant contacts between the current sky and this natal chart? Name the specific transit planet, the natal planet it's hitting, the aspect, and what it means for this person right now.

## MIND RIGHT NOW
How is the current sky affecting this person's thinking, communication, and mental state?

## SOUL RIGHT NOW
How is the current sky affecting this person's emotional life, relationships, and inner world?

## SPIRIT RIGHT NOW
How is the current sky affecting this person's sense of purpose, direction, and confidence?

## THE BIGGER PICTURE
What is the overall theme of this period for this person? What should they focus on, watch out for, or lean into right now?

Write in flowing paragraphs. Be specific — name the planets, the signs, the houses. This is a real person reading about their real life.`;
      }

      const response = await invokeLLM({
        messages: [
          { role: "system", content: COSMOLOGY_PREAMBLE },
          { role: "user", content: userPrompt },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content ?? "";
      const reading = typeof rawContent === "string" ? rawContent : "";
      return { reading: reading.trim() };
    }),
});

// ─── Ephemeris Router ───────────────────────────────────────────────────────────────

const ephemerisRouter = router({
  calculate: publicProcedure
    .input(
      z.object({
        year: z.number().int().min(1900).max(2100),
        month: z.number().int().min(1).max(12),
        day: z.number().int().min(1).max(31),
        hour: z.number().min(0).max(23),
        minute: z.number().min(0).max(59),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        altitude: z.number().min(0).max(9000).default(0),
      })
    )
    .mutation(async ({ input }) => {
      // The birth time entered is LOCAL civil time at the given coordinates,
      // not UTC. Derive the IANA timezone from lat/long and convert properly,
      // respecting whatever DST rules were in effect on this historical date.
      const timezone = tzLookup(input.latitude, input.longitude);
      const localTimeString = `${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")} ${String(input.hour).padStart(2, "0")}:${String(input.minute).padStart(2, "0")}:00`;
      const date = fromZonedTime(localTimeString, timezone);

      const observer = {
        latitude: input.latitude,
        longitude: input.longitude,
        altitude: input.altitude,
      };

      const result = await calculateChart(date, observer);

      // Use the correct tropical Ascendant from the astronomy library
      // (NOT from coordinateTransformer, which is for visualization only)
      const tropicalAsc = result.houses.ascendant;
      const mc = result.houses.mc;
      const desc = (tropicalAsc + 180) % 360;
      const ic = (mc + 180) % 360;

      // Generate 12 equal house cusps from the correct topocentric Ascendant
      const houseCusps = [];
      for (let i = 0; i < 12; i++) {
        houseCusps.push((tropicalAsc + i * 30) % 360);
      }

      const readingText = formatChartForReading(result);
      const enrichedText = enrichChartData(
        result.planets.reduce(
          (acc, p) => ({
            ...acc,
            [p.name]: {
              sign: p.sign,
              degree: p.degreeInSign,
              house: p.house,
              absolute: ZODIAC_SIGNS.indexOf(p.sign) * 30 + p.degreeInSign,
            },
          }),
          {} as Record<string, any>
        ),
        result.planets,
        tropicalAsc
      );

      return {
        planets: result.planets,
        houses: {
          cusps: houseCusps,
          ascendant: tropicalAsc,
          mc: mc,
        },
        angles: { asc: tropicalAsc, desc, mc, ic },
        ayanamsa: result.ayanamsa,
        readingText,
        enrichedText,
      };
    }),
});

// ─── Charts Router ───────────────────────────────────────────────────────────────

const chartsRouter = router({
  save: protectedProcedure
    .input(
      z.object({
        chartName: z.string().min(1).max(255),
        placements: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      await saveChart(ctx.user.id, input.chartName, input.placements);
      return { success: true };
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    return await getUserCharts(ctx.user.id);
  }),

  load: protectedProcedure
    .input(z.object({ chartId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return await getChart(input.chartId, ctx.user.id);
    }),

  delete: protectedProcedure
    .input(z.object({ chartId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      await deleteChart(input.chartId, ctx.user.id);
      return { success: true };
    }),
});

// ─── Synthesize Router ────────────────────────────────────────────────────────

const synthesizeRouter = router({
  synthesize: publicProcedure
    .input(
      z.object({
        chartText: z.string(),
        userQuestion: z.string().optional(),
        systemPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { chartText, userQuestion, systemPrompt } = input;

      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const defaultPrompt = `You are a skilled astrologer operating within the ancient sky-observation tradition. Synthesize the following birth chart data into a warm, insightful reading. Use clear, natural language.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: systemPrompt || defaultPrompt,
        messages: [
          {
            role: "user",
            content: `Chart data:\n${chartText}\n\nQuestion: ${userQuestion || "Please provide a general reading."}`,
          },
        ],
      });

      return { reading: (response.content[0] as any).text };
    }),
});

// ─── Natal Placement Router ──────────────────────────────────────────────────

const natalPlacementRouter = router({
  getReading: publicProcedure
    .input(
      z.object({
        prompt: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{ role: "user", content: input.prompt }],
      });
      const text = response.content
        .map((b: any) => (b.type === "text" ? b.text : ""))
        .join("");
      return { reading: text };
    }),

  getLensReading: publicProcedure
    .input(
      z.object({
        chartText: z.string(),
        lensId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      const prompt = buildLensPrompt(input.chartText, input.lensId);
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });
      const text = response.content
        .map((b: any) => (b.type === "text" ? b.text : ""))
        .join("");
      return { reading: text };
    }),

  listLenses: publicProcedure.query(() => {
    return LENSES.map(({ id, label, description }) => ({
      id,
      label,
      description,
    }));
  }),
});

// ─── Horary Router ───────────────────────────────────────────────────────────

const horaryRouter = router({
  followUp: publicProcedure
    .input(
      z.object({
        question: z.string().min(1),
        natalPlacements: z.string().optional(),
        transitPlacements: z.string().optional(),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        question,
        natalPlacements,
        transitPlacements,
        history = [],
      } = input;
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const chartContext = `${natalPlacements ? "NATAL CHART:\n" + natalPlacements + "\n\n" : ""}${transitPlacements ? "CURRENT SKY:\n" + transitPlacements : ""}`;

      const messages = [
        ...history.map(h => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user" as const, content: question },
      ];

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: `${COSMOLOGY_PREAMBLE}

You are a personal astrologer in an ongoing conversation. You already did a full reading of this chart. The user has follow-up questions. The chart data is below — use it to answer directly.

${chartContext}

Rules: Answer directly. Use specific placements. No preamble. Keep it conversational but precise.`,
        messages,
      });

      const text = response.content
        .map((b: any) => (b.type === "text" ? b.text : ""))
        .join("");
      return { answer: text };
    }),

  ask: publicProcedure
    .input(
      z.object({
        question: z.string().min(1),
        natalPlacements: z.string().optional(),
        transitPlacements: z.string().optional(),
        name: z.string().optional(),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        question,
        natalPlacements,
        transitPlacements,
        name,
        history,
      } = input;
      const result = await horaryLayer({
        question,
        natalText: natalPlacements ?? "",
        transitText: transitPlacements ?? "",
        name,
        history: history as any,
      });
      return {
        answer: result.answer,
        intent: result.intent,
        focus: result.focus,
      };
    }),
});

// ─── Zetetic Atlas Dialogue Router ────────────────────────────────────────────
// Kept separate from natal, horary, and sports procedures because its active
// direct-angle/Equal-House calculation conventions are intentionally isolated.

const atlasPointSchema = z.object({
  name: z.string().min(1).max(80),
  kind: z.enum(["planet", "node", "angle"]),
  longitude: z.number().min(0).lt(360),
  sign: z.string().min(1).max(24),
  degree: z.number().min(0).lt(30),
  house: z.number().int().min(1).max(12),
  rightAscension: z.number().min(0).lt(24),
  declination: z.number().min(-90).max(90),
  azimuth: z.number().min(0).lt(360),
  altitude: z.number().min(-90).max(90),
  nakshatra: z.object({
    name: z.string().min(1).max(48),
    lord: z.string().min(1).max(24),
    pada: z.number().int().min(1).max(4),
  }),
  fixedStars: z.array(z.object({
    name: z.string().min(1).max(80),
    orb: z.number().min(0).max(2),
    nature: z.string().min(1).max(80),
    archetype: z.string().min(1).max(120),
    isRoyal: z.boolean(),
    isPolar: z.boolean(),
  })).max(8),
  dignity: z.object({
    status: z.enum(["domicile", "detriment", "exaltation", "fall", "neutral", "not-classically-assigned"]),
    label: z.string().min(1).max(80),
    scope: z.enum(["traditional seven planets", "no classical assignment"]),
  }),
  combustion: z.object({
    applicable: z.boolean(),
    isKazimi: z.boolean(),
    isCombust: z.boolean(),
    status: z.enum(["not-applicable", "kazimi", "combust", "clear"]),
    angularDistance: z.number().min(0).max(180).nullable(),
    threshold: z.literal(15),
    rule: z.string().min(1).max(160),
  }),
  motion: z.object({
    applicable: z.boolean(),
    speedDegreesPerDay: z.number().min(-360).max(360).nullable(),
    isRetrograde: z.boolean(),
    rule: z.string().min(1).max(200),
  }),
});

const zeteticAtlasRouter = router({
  ask: publicProcedure
    .input(
      z.object({
        question: z.string().min(1).max(2000),
        chart: z.object({
          baseline: z.object({
            id: z.literal("atlas-live-engine-v1"),
            ephemeris: z.string().min(1).max(160),
            axes: z.string().min(1).max(160),
            houses: z.string().min(1).max(160),
            mapLayers: z.string().min(1).max(160),
          }),
          input: z.object({
            birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            birthTime: z.string().regex(/^\d{2}:\d{2}$/),
            timezone: z.string().min(1).max(80),
            location: z.string().max(160),
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
          }),
          utcIso: z.string().min(10).max(80),
          utcDegrees: z.number().min(0).lt(360),
          ascendant: z.number().min(0).lt(360),
          descendant: z.number().min(0).lt(360),
          midheaven: z.number().min(0).lt(360),
          imumCoeli: z.number().min(0).lt(360),
          houses: z.array(z.object({
            number: z.number().int().min(1).max(12),
            startLabel: z.string().max(80),
            endLabel: z.string().max(80),
          })).length(12),
          points: z.array(atlasPointSchema).min(10).max(20),
          planetaryWars: z.array(z.object({
            first: z.string().min(1).max(80),
            second: z.string().min(1).max(80),
            distance: z.number().min(0).max(180),
            threshold: z.literal(1),
            rule: z.string().min(1).max(200),
          })).max(10),
          aspectScan: z.object({
            aspects: z.array(z.object({
              first: z.string().min(1).max(80), second: z.string().min(1).max(80), type: z.enum(["conjunction", "sextile", "square", "trine", "opposition", "quincunx"]),
              angle: z.number().min(0).max(180), separation: z.number().min(0).max(180), orb: z.number().min(0).max(8), orbLimit: z.number().min(0).max(8), state: z.enum(["applying", "separating", "exact", "static-angle"]), rule: z.string().min(1).max(300),
            })).max(80),
            angularContacts: z.array(z.object({ planet: z.string().min(1).max(80), angle: z.enum(["Ascendant", "Descendant", "Midheaven", "Imum Coeli"]), distance: z.number().min(0).max(5), orbLimit: z.literal(5), rule: z.string().min(1).max(200) })).max(40),
            stelliums: z.array(z.object({ scope: z.enum(["sign", "Equal House"]), location: z.string().min(1).max(80), planets: z.array(z.string().min(1).max(80)).min(3).max(10), minimum: z.literal(3), rule: z.string().min(1).max(200) })).max(24),
            dispositorChains: z.array(z.object({ planet: z.string().min(1).max(80), sign: z.string().min(1).max(24), immediateRuler: z.string().min(1).max(80), chain: z.array(z.string().min(1).max(80)).min(1).max(12), terminal: z.string().min(1).max(80), isLoop: z.boolean(), rule: z.string().min(1).max(220) })).max(10),
            mutualReceptions: z.array(z.object({ first: z.string().min(1).max(80), second: z.string().min(1).max(80), firstSign: z.string().min(1).max(24), secondSign: z.string().min(1).max(24), rule: z.string().min(1).max(200) })).max(20),
            configurations: z.array(z.object({ type: z.enum(["Grand Trine", "T-Square", "Grand Cross", "Yod", "Kite"]), planets: z.array(z.string().min(1).max(80)).min(3).max(4), evidence: z.string().min(1).max(240), rule: z.string().min(1).max(300) })).max(20),
          }),
        }),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().min(1).max(6000),
        })).max(10).optional(),
      })
    )
    .mutation(({ input }) => askZeteticAtlas(input)),
});

// ─── Sports Horary Router ─────────────────────────────────────────────────────
// Deterministic sports-prediction engine (server/sportsHorary.ts) drives the
// call; the LLM narrates the engine's verdict/score/flags.

const sportsHoraryRouter = router({
  ask: publicProcedure
    .input(
      z.object({
        question: z.string().min(1),
        natalPlacements: z.string().optional(),
        transitPlacements: z.string().optional(),
        favoriteName: z.string().optional(),
        challengerName: z.string().optional(),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sportsHoraryLayer({
        question: input.question,
        natalText: input.natalPlacements ?? "",
        transitText: input.transitPlacements ?? "",
        favoriteName: input.favoriteName,
        challengerName: input.challengerName,
        history: input.history as any,
      });
      return {
        answer: result.answer,
        score: result.score.score,
        verdict: result.score.verdict,
        flags: result.score.flags,
        usedChart: result.usedChart,
      };
    }),
  askV2: publicProcedure
    .input(
      z.object({
        question: z.string().min(1),
        natalPlacements: z.string().optional(),
        transitPlacements: z.string().optional(),
        favoriteName: z.string().optional(),
        challengerName: z.string().optional(),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sportsHoraryV2Layer({
        question: input.question,
        natalText: input.natalPlacements ?? "",
        transitText: input.transitPlacements ?? "",
        favoriteName: input.favoriteName,
        challengerName: input.challengerName,
        history: input.history as any,
      });
      return {
        answer: result.answer,
        score: result.score,
        verdict: result.verdict,
        flags: result.flags,
        usedChart: result.usedChart,
        territorialControl: result.territorialControl,
      };
    }),
  askWithChart: publicProcedure
    .input(
      z.object({
        question: z.string().min(1),
        planets: z.array(
          z.object({
            planet: z.string(),
            degree: z.number(),
            sign: z.string(),
            house: z.number().nullable(),
            rx: z.boolean().default(false),
            absolute: z.number().nullable(),
          })
        ),
        houseCusps: z.array(z.number()),
        favoriteName: z.string().optional(),
        challengerName: z.string().optional(),
        mapOrientation: z.enum(["standard", "inverse-180"]).optional(),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Format planets into readable chart text for the LLM
      const transitText = input.planets
        .map(p => {
          const rx = p.rx ? " Rx" : "";
          const house = p.house ? `, ${p.house}th house` : "";
          return `${p.planet}: ${p.degree}° ${p.sign}${house}${rx}`;
        })
        .join("\n");

      // The ascendant was previously only used for the separate
      // calculateTerritorialControl call below and never told to
      // sportsHoraryV2Layer — its parser only knows the ascendant if an
      // "Asc:" line is present in the text it's given. Without this, the
      // narrative and the territorial-control numbers were computed from
      // two different ideas of the chart (one with a real ascendant, one
      // with none), which is why they could disagree even when both were
      // individually correct.
      const ascendantLon = input.houseCusps[0];
      const ascSignIndex = Math.floor(((ascendantLon % 360) + 360) % 360 / 30);
      const ascDegreeInSign = ((ascendantLon % 360) + 360) % 360 % 30;
      const ascLine = `Asc: ${ascDegreeInSign.toFixed(2)}° ${ZODIAC_SIGNS[ascSignIndex] || "Aries"}`;
      const transitTextWithAsc = `${ascLine}\n${transitText}`;

      // Get V2 reading — this now also computes territorialControl
      // internally from this exact same chart, so there's one source of
      // truth instead of two independent engines.
      const result = await sportsHoraryV2Layer({
        question: input.question,
        natalText: "",
        transitText: transitTextWithAsc,
        favoriteName: input.favoriteName,
        challengerName: input.challengerName,
        mapOrientation: input.mapOrientation,
        history: input.history as any,
      });

      return {
        answer: result.answer,
        score: result.score,
        verdict: result.verdict,
        flags: result.flags,
        usedChart: result.usedChart,
        layerVotes: result.layerVotes,
        territorialControl: result.territorialControl,
      };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  auth: authRouter,
  system: systemRouter,
  ocr: ocrRouter,
  ai: aiRouter,
  charts: chartsRouter,
  ephemeris: ephemerisRouter,
  synthesize: synthesizeRouter,
  natalPlacement: natalPlacementRouter,
  horary: horaryRouter,
  zeteticAtlas: zeteticAtlasRouter,
  sportsHorary: sportsHoraryRouter,
});

export type AppRouter = typeof appRouter;
