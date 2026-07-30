// lensRules.ts
// Each "lens" is a fixed, traditional rule for which houses/planets answer
// a specific life question. This is the hardcoded knowledge layer that
// differentiates The Firmament — the AI never decides what's relevant,
// it only synthesizes within the boundaries you define here.

export type Lens = {
  id: string;
  label: string;
  description: string; // shown in UI under the button
  houses: number[];
  planets?: string[]; // force-include these planets regardless of house
  includeNodes?: boolean; // Rahu/Ketu axis
  includeAscendant?: boolean;
  promptFrame: string; // structure Claude must follow
};

export const LENSES: Lens[] = [
  {
    id: "wealth",
    label: "Wealth & Work Circuit",
    description: "Where your income comes from and how to recognize it.",
    houses: [2, 6, 10],
    includeNodes: true,
    promptFrame: `
You are analyzing the user's WEALTH CIRCUIT using only the 2nd house (resources/cash flow),
6th house (daily work/service), 10th house (career/public role), and the Rahu/Ketu axis.

Structure your answer as:
1. 2nd House Pillar (resources/cash flow)
2. 10th House Pillar (career/reputation)
3. 6th House Pillar (daily routine/service)
4. Karmic Compass (Rahu/Ketu direction — what to build vs. what to release)
5. Daily Check-In practice (one question the user asks themselves each morning)
6. Bottom Line summary (3-4 bullet points naming the core income pattern)

Do not reference houses or planets outside this list.
    `.trim(),
  },

  {
    id: "relationships",
    label: "Relationship Circuit",
    description:
      "Your partnership patterns, attraction style, and emotional needs.",
    houses: [5, 7],
    planets: ["Venus", "Moon"],
    includeNodes: false,
    promptFrame: `
You are analyzing the user's RELATIONSHIP CIRCUIT using the 7th house (committed partnership),
5th house (romance/attraction), Venus (what you value/give), and Moon (emotional needs).

Structure your answer as:
1. 7th House Pillar (commitment style, what partnership looks like for you)
2. 5th House Pillar (attraction pattern, what draws you in)
3. Venus Pillar (what you offer / what you're drawn to value)
4. Moon Pillar (what you actually need to feel secure)
5. Daily Check-In practice
6. Bottom Line summary

Do not reference houses or planets outside this list.
    `.trim(),
  },

  {
    id: "health",
    label: "Vitality & Body Circuit",
    description:
      "Physical stability, energy patterns, and what depletes vs. restores you.",
    houses: [1, 6, 8],
    planets: ["Moon", "Mars"],
    includeNodes: false,
    includeAscendant: true,
    promptFrame: `
You are analyzing the user's VITALITY CIRCUIT using the Ascendant (the body/vital force),
6th house (illness, routine, daily strain), 8th house (chronic/hidden stress, transformation),
Moon (emotional-physical regulation), and Mars (energy expenditure, inflammation, drive).

Structure your answer as:
1. Ascendant Pillar (baseline constitution)
2. 6th House Pillar (what daily habits are draining or sustaining you)
3. 8th House Pillar (what hidden/chronic stress pattern needs attention)
4. Moon/Mars Pillar (emotional-physical feedback loop)
5. Daily Check-In practice
6. Bottom Line summary

Do not reference houses or planets outside this list. Do not give medical advice or diagnoses —
frame everything as energetic/behavioral pattern recognition only.
    `.trim(),
  },

  {
    id: "purpose",
    label: "Dharma & Direction Circuit",
    description:
      "Your soul's mission, karmic direction, and the work only you can do.",
    houses: [1, 9, 10],
    planets: ["Sun"],
    includeNodes: true,
    includeAscendant: true,
    promptFrame: `
You are analyzing the user's DHARMA CIRCUIT using the Ascendant (how you meet the world),
Sun (core identity/soul purpose), 9th house (higher belief, teaching, expansion),
10th house (public role/legacy), and the Rahu/Ketu axis (karmic direction).

Structure your answer as:
1. Ascendant Pillar (how your purpose is expressed outwardly)
2. Sun Pillar (the core truth you're here to embody)
3. 9th House Pillar (the belief system or wisdom you're meant to carry)
4. 10th House Pillar (the legacy/public form your purpose takes)
5. Karmic Compass (Rahu/Ketu — what to move toward vs. what to release)
6. Bottom Line summary

Do not reference houses or planets outside this list.
    `.trim(),
  },

  {
    id: "timing",
    label: "Timing & Transit Circuit",
    description:
      "When to act vs. when to wait, based on your natal sensitivity points.",
    houses: [1, 10],
    planets: ["Moon", "Saturn"],
    includeNodes: true,
    includeAscendant: true,
    promptFrame: `
You are analyzing the user's TIMING CIRCUIT — the natal points most sensitive to transits,
used to judge when to act vs. when to wait. Use the Ascendant, 10th house, Moon (monthly emotional
tides), Saturn (contraction/delay/testing), and Rahu/Ketu (karmic timing).

Structure your answer as:
1. What "green light" transits typically look like for this chart (aspects to Asc/10th/Moon)
2. What "red light" transits typically look like (Saturn or node contacts to these points)
3. Moon Pillar (short-term emotional weather to track)
4. Saturn Pillar (long-term structural timing — when discipline pays off)
5. Daily/Weekly Check-In practice
6. Bottom Line summary

Do not reference houses or planets outside this list. Do not predict specific events —
describe the *pattern* of good vs. challenging timing only.
    `.trim(),
  },

  {
    id: "family",
    label: "Roots & Family Circuit",
    description:
      "Inherited patterns, home life, and what you're building for the next generation.",
    houses: [4, 12],
    planets: ["Moon"],
    includeNodes: false,
    promptFrame: `
You are analyzing the user's ROOTS CIRCUIT using the 4th house (home, lineage, emotional foundation),
12th house (inherited/unconscious patterns, what's released across generations), and Moon (the
emotional inheritance being carried or transformed).

Structure your answer as:
1. 4th House Pillar (the foundation you come from / are building)
2. 12th House Pillar (the pattern being released or completed)
3. Moon Pillar (the emotional inheritance and how you're metabolizing it)
4. Daily Check-In practice
5. Bottom Line summary

Do not reference houses or planets outside this list.
    `.trim(),
  },
];

export function getLens(id: string): Lens {
  const lens = LENSES.find(l => l.id === id);
  if (!lens) throw new Error(`Unknown lens id: ${id}`);
  return lens;
}
