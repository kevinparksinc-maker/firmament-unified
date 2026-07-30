/**
 * READING ENGINE v3.2
 *
 * Nakshatra-first synthesis. Sign modulates. Transit shapes the nakshatra expression.
 * Fixed stars fuse into pillar synthesis when a planet conjuncts one.
 * Decans add flavor refinement (10° subdivisions) — lightweight, not a pillar.
 *
 * Modes: DIRECT (shorter, imperative) | SOUL (reflective, embodied) | INTEGRATED (balanced)
 */

import type {
  PatternAnalysis,
  RawAspect,
  PatternScore,
  PlanetaryWar,
} from "./patternEngine";
import type { StarConjunction } from "./fixedStars";
import { getDecanFlavor } from "./decan";
import { getDegreeMeaning } from "./sabianSymbols";

// ============================================================================
// NAKSHATRA DATA
// ============================================================================

const NAKSHATRA_DATA: Record<
  string,
  {
    archetype: string;
    ruler: string;
    gana: string;
    shakti: string;
  }
> = {
  Ashwini: {
    archetype: "The Healer",
    ruler: "Ketu",
    gana: "Deva",
    shakti: "swift healing action",
  },
  Bharani: {
    archetype: "The Restrainer",
    ruler: "Venus",
    gana: "Manushya",
    shakti: "holding and transforming",
  },
  Krittika: {
    archetype: "The Cutter",
    ruler: "Sun",
    gana: "Rakshasa",
    shakti: "sharp discernment",
  },
  Rohini: {
    archetype: "The Grower",
    ruler: "Moon",
    gana: "Manushya",
    shakti: "creation and fertility",
  },
  Mrigashira: {
    archetype: "The Seeker",
    ruler: "Mars",
    gana: "Deva",
    shakti: "wandering and searching",
  },
  Ardra: {
    archetype: "The Storm",
    ruler: "Rahu",
    gana: "Manushya",
    shakti: "tearing to rebuild",
  },
  Punarvasu: {
    archetype: "The Returner",
    ruler: "Jupiter",
    gana: "Deva",
    shakti: "coming back renewed",
  },
  Pushya: {
    archetype: "The Nourisher",
    ruler: "Saturn",
    gana: "Deva",
    shakti: "sustaining and protecting",
  },
  Ashlesha: {
    archetype: "The Coiler",
    ruler: "Mercury",
    gana: "Rakshasa",
    shakti: "winding intensity",
  },
  Magha: {
    archetype: "The Ancestor",
    ruler: "Ketu",
    gana: "Rakshasa",
    shakti: "legacy and inheritance",
  },
  PurvaPhalguni: {
    archetype: "The Lover",
    ruler: "Venus",
    gana: "Manushya",
    shakti: "pleasure and play",
  },
  UttaraPhalguni: {
    archetype: "The Supporter",
    ruler: "Sun",
    gana: "Manushya",
    shakti: "steady partnership",
  },
  Hasta: {
    archetype: "The Hand",
    ruler: "Moon",
    gana: "Deva",
    shakti: "skill and manifestation",
  },
  Chitra: {
    archetype: "The Artist",
    ruler: "Mars",
    gana: "Rakshasa",
    shakti: "brilliant projection",
  },
  Swati: {
    archetype: "The Wind",
    ruler: "Rahu",
    gana: "Deva",
    shakti: "movement and independence",
  },
  Vishakha: {
    archetype: "The Forker",
    ruler: "Jupiter",
    gana: "Rakshasa",
    shakti: "splitting to choose",
  },
  Anuradha: {
    archetype: "The Friend",
    ruler: "Saturn",
    gana: "Deva",
    shakti: "loyalty and follow-through",
  },
  Jyeshtha: {
    archetype: "The Elder",
    ruler: "Mercury",
    gana: "Rakshasa",
    shakti: "senior wisdom",
  },
  Mula: {
    archetype: "The Root",
    ruler: "Ketu",
    gana: "Rakshasa",
    shakti: "uprooting to origin",
  },
  PurvaAshadha: {
    archetype: "The Purifier",
    ruler: "Venus",
    gana: "Manushya",
    shakti: "cleansing flow",
  },
  UttaraAshadha: {
    archetype: "The Victor",
    ruler: "Sun",
    gana: "Manushya",
    shakti: "unyielding win",
  },
  Shravana: {
    archetype: "The Listener",
    ruler: "Moon",
    gana: "Manushya",
    shakti: "hearing truth",
  },
  Dhanishtha: {
    archetype: "The Drummer",
    ruler: "Mars",
    gana: "Rakshasa",
    shakti: "rhythmic power",
  },
  Shatabhisha: {
    archetype: "The Veiler",
    ruler: "Rahu",
    gana: "Rakshasa",
    shakti: "hidden healing",
  },
  PurvaBhadrapada: {
    archetype: "The Burner",
    ruler: "Jupiter",
    gana: "Manushya",
    shakti: "sacrificial fire",
  },
  UttaraBhadrapada: {
    archetype: "The Depths",
    ruler: "Saturn",
    gana: "Manushya",
    shakti: "deep stability",
  },
  Revati: {
    archetype: "The Traveler",
    ruler: "Mercury",
    gana: "Deva",
    shakti: "journey's end",
  },
};

// ============================================================================
// SIGN MODULATION
// ============================================================================

const SIGN_MODULATION: Record<string, string> = {
  Aries: "ignites into action",
  Taurus: "grounds into form",
  Gemini: "splits into options",
  Cancer: "softens into feeling",
  Leo: "radiates outward",
  Virgo: "refines into detail",
  Libra: "balances into relation",
  Scorpio: "submerges into depth",
  Sagittarius: "expands toward meaning",
  Capricorn: "structures into time",
  Aquarius: "detaches into pattern",
  Pisces: "dissolves into flow",
};

// ============================================================================
// TRANSIT PLANET PRESSURE LANGUAGE
// ============================================================================

const TRANSIT_PRESSURE: Record<
  string,
  {
    hard: string;
    conj: string;
    soft: string;
  }
> = {
  Saturn: {
    hard: "Saturn is testing this. The shakti is under duty and contraction — what remains after pressure is what is real.",
    conj: "Saturn sits directly here. Weight, responsibility, and time are embedded in this expression right now.",
    soft: "Saturn supports from a distance — structure and discipline are available as resources, not burdens.",
  },
  Jupiter: {
    hard: "Jupiter overextends this. The shakti risks inflation — expansion without ground.",
    conj: "Jupiter amplifies directly. Wisdom and generosity pour through this nakshatra. Watch for excess.",
    soft: "Jupiter opens a door here. Blessing and meaning are accessible without effort.",
  },
  Mars: {
    hard: "Mars is pressuring this with urgency and heat. The shakti is forced, not chosen.",
    conj: "Mars fuses here. Direct, driven, potentially combative — the shakti is activated at high temperature.",
    soft: "Mars offers energy without aggression. The nakshatra has force available.",
  },
  Rahu: {
    hard: "Rahu is pulling this toward obsession. The shakti gets amplified beyond normal range.",
    conj: "Rahu sits here — foreign, restless, hungry. This nakshatra's expression is being intensified and distorted.",
    soft: "Rahu casts an ambient craving. The shakti is colored with desire and restlessness.",
  },
  Ketu: {
    hard: "Ketu fragments this. The shakti feels familiar but inaccessible — past-life territory.",
    conj: "Ketu sits directly here. Detachment, dissolution, and something releasing. The shakti is not available in the usual way.",
    soft: "Ketu creates subtle disinterest. The nakshatra's force is quieted, turned inward.",
  },
  Sun: {
    hard: "The Sun spotlights this with intensity — ego pressure on the shakti.",
    conj: "The Sun illuminates — or combusts. Either rare clarity or heat that obscures.",
    soft: "The Sun casts light here without burning. Dignified expression of the shakti.",
  },
  Moon: {
    hard: "The Moon's emotional tide strains this nakshatra — the shakti is pulled by feeling.",
    conj: "The Moon merges here. Emotional resonance and instinct color the entire expression.",
    soft: "The Moon flows through. Intuitive, receptive — the shakti is emotionally available.",
  },
  Mercury: {
    hard: "Mercury creates nervous pressure — the mind is overworking the shakti.",
    conj: "Mercury sharpens this. Language, analysis, and interpretation are embedded in the expression.",
    soft: "Mercury offers clarity here. Communication and discernment support the nakshatra.",
  },
  Venus: {
    hard: "Venus creates tension — desire and beauty strain the shakti's expression.",
    conj: "Venus softens and refines this. The shakti is expressed through attraction and grace.",
    soft: "Venus harmonizes here. Pleasure and ease are available through this nakshatra.",
  },
};

function getTransitPressureText(
  transitPlanet: string,
  aspectType: string
): string {
  const pressure = TRANSIT_PRESSURE[transitPlanet];
  if (!pressure)
    return `${transitPlanet} influences this nakshatra's expression.`;
  const hard = aspectType === "square" || aspectType === "opposition";
  const conj = aspectType === "conjunction";
  return hard ? pressure.hard : conj ? pressure.conj : pressure.soft;
}

// ============================================================================
// FIXED STAR SYNTHESIS LANGUAGE
// ============================================================================

function buildStarLine(conj: StarConjunction, mode: ReadingMode): string {
  const { star, orb, exact } = conj;
  const orbTag = exact ? "exact conjunction" : `${orb}° conjunction`;
  const royalTag = star.isRoyal
    ? " [ROYAL STAR — WATCHER]"
    : star.isPolar
      ? " [POLE STAR]"
      : "";

  if (mode === "soul") {
    if (star.isRoyal) {
      return `Conjunct ${star.name}${royalTag} (${orbTag}) — ${star.meaning} This is a Royal Star contact. The stakes here are real and the conditions matter.`;
    }
    if (star.isPolar) {
      return `Conjunct ${star.name}${royalTag} (${orbTag}) — ${star.meaning} The still center is present here.`;
    }
    return `Conjunct ${star.name} (${orbTag}) — ${star.meaning}`;
  }

  // direct / integrated
  if (star.isRoyal) {
    return `${star.name}${royalTag} (${orbTag}): ${star.meaning} Royal Star — conditions and integrity determine the outcome.`;
  }
  if (star.isPolar) {
    return `${star.name}${royalTag} (${orbTag}): ${star.meaning}`;
  }
  return `${star.name} (${orbTag}): ${star.meaning}`;
}

// ============================================================================
// TYPES
// ============================================================================

export type ReadingMode = "direct" | "soul" | "integrated";
export type QuestionArea =
  | "career"
  | "relationships"
  | "health"
  | "finance"
  | "spirituality"
  | "general"
  | "creativity"
  | "home";

export interface PlanetStrengthInput {
  planet: string;
  longitude: number;
  sign: string;
  rawStrength: number;
  isCazimi?: boolean;
  isCombust?: boolean;
  rxStatus?: boolean;
}

export interface UserContext {
  name?: string;
  question?: string;
  readingMode?: ReadingMode;
  focusArea?: QuestionArea;
  planetData?: Record<string, PlanetStrengthInput>;
  starConjunctions?: StarConjunction[];
}

export interface PillarRead {
  pillar: "Soul" | "Mind" | "Spirit";
  planet: string;
  nakshatra: string;
  archetype: string;
  shakti: string;
  sign: string;
  synthesis: string;
  transitNote: string | null;
  starConjunctions: StarConjunction[];
}

export interface ReadingOutput {
  mode: ReadingMode;
  pillars: PillarRead[];
  truth: string;
  why: string;
  action: string;
  warning: string | null;
  patterns: string[];
  starNotes: string[];
  timestamp: Date;
}

// ============================================================================
// NAKSHATRA UTILITIES
// ============================================================================

function getNakshatra(longitude: number): {
  name: string;
  pada: number;
  archetype: string;
  ruler: string;
  gana: string;
  shakti: string;
} {
  const normalized = ((longitude % 360) + 360) % 360;
  const nakshatraSize = 360 / 27;
  const index = Math.floor(normalized / nakshatraSize);
  const names = Object.keys(NAKSHATRA_DATA);
  const name = names[index] || names[0];
  const padaSize = nakshatraSize / 4;
  const pada = Math.floor((normalized % nakshatraSize) / padaSize) + 1;
  return { name, pada, ...NAKSHATRA_DATA[name] };
}

// ============================================================================
// DYNAMIC PILLAR PLANET SELECTION
// ============================================================================

function selectPillarPlanet(
  candidates: string[],
  planetData: Record<string, PlanetStrengthInput>
): PlanetStrengthInput | null {
  const available = candidates
    .map(p => planetData[p])
    .filter((p): p is PlanetStrengthInput => !!p);
  if (available.length === 0) return null;
  return available.reduce((best, cur) => {
    const bestScore =
      best.rawStrength +
      (best.isCazimi ? 0.2 : 0) -
      (best.isCombust ? 0.15 : 0);
    const curScore =
      cur.rawStrength + (cur.isCazimi ? 0.2 : 0) - (cur.isCombust ? 0.15 : 0);
    return curScore > bestScore ? cur : best;
  });
}

// ============================================================================
// TRANSIT-AWARE PILLAR READ — with fixed star fusion + DECANS
// ============================================================================

function buildPillarRead(
  pillarType: "Soul" | "Mind" | "Spirit",
  planetInput: PlanetStrengthInput,
  degree: number, // <-- ADDED for decan
  aspects: RawAspect[],
  mode: ReadingMode,
  starConjunctions: StarConjunction[]
): PillarRead {
  const nakshatra = getNakshatra(planetInput.longitude);
  const modulation = SIGN_MODULATION[planetInput.sign] || "moves through";
  const decanFlavor = getDecanFlavor(planetInput.sign, degree); // <-- ADDED for decans
  const decanText = decanFlavor ? ` with a ${decanFlavor} edge` : "";

  // Fixed stars conjunct this planet
  const planetStars = starConjunctions
    .filter(c => c.planet === planetInput.planet)
    .sort((a, b) => {
      const aRoyal = a.star.isRoyal || a.star.isPolar ? 0 : 1;
      const bRoyal = b.star.isRoyal || b.star.isPolar ? 0 : 1;
      if (aRoyal !== bRoyal) return aRoyal - bRoyal;
      return a.orb - b.orb;
    });

  // Strongest aspect touching this planet
  const relevantAspects = aspects
    .filter(
      a => a.planet1 === planetInput.planet || a.planet2 === planetInput.planet
    )
    .sort((a, b) => b.strength - a.strength);

  const topAspect = relevantAspects[0] || null;
  const transitingPlanet = topAspect
    ? topAspect.planet1 === planetInput.planet
      ? topAspect.planet2
      : topAspect.planet1
    : null;
  const transitNote =
    topAspect && transitingPlanet
      ? getTransitPressureText(transitingPlanet, topAspect.type)
      : null;

  // Cazimi / combust tags
  let intensityTag = "";
  if (planetInput.isCazimi) {
    intensityTag =
      mode === "direct"
        ? " Cazimi — burned pure at solar core. Concentrated precision."
        : " Cazimi — this is at the heart of the Sun. Purified and unavoidable.";
  } else if (planetInput.isCombust) {
    intensityTag =
      mode === "direct"
        ? " Combust — too close to solar heat. Objectivity is reduced."
        : " Combust — the Sun's brightness overwhelms this. Step back from the glare.";
  }

  // Retrograde tag
  const rxTag = planetInput.rxStatus
    ? mode === "direct"
      ? " Retrograde — interiorized, not easily externalized."
      : " Retrograde — this energy turns inward before it acts."
    : "";

  // Opening line — nakshatra first
  let opening = "";
  switch (pillarType) {
    case "Soul":
      opening =
        mode === "soul"
          ? `The Moon rests in ${nakshatra.name} — ${nakshatra.archetype}. Its shakti is ${nakshatra.shakti}.`
          : `Soul: Moon in ${nakshatra.name} (${nakshatra.archetype}). Shakti — ${nakshatra.shakti}.`;
      break;
    case "Mind":
      opening =
        mode === "soul"
          ? `Thought takes root in ${nakshatra.name} — ${nakshatra.archetype}. Its shakti is ${nakshatra.shakti}.`
          : `Mind: ${planetInput.planet} in ${nakshatra.name} (${nakshatra.archetype}). Shakti — ${nakshatra.shakti}.`;
      break;
    case "Spirit":
      opening =
        mode === "soul"
          ? `Purpose moves through ${nakshatra.name} — ${nakshatra.archetype}. Its shakti is ${nakshatra.shakti}.`
          : `Spirit: ${planetInput.planet} in ${nakshatra.name} (${nakshatra.archetype}). Shakti — ${nakshatra.shakti}.`;
      break;
  }

  // Sign line WITH DECAN FLAVOR
  const signLine =
    mode === "soul"
      ? `Through ${planetInput.sign}, this ${modulation}${decanText}.`
      : `In ${planetInput.sign} — ${modulation}${decanText}.`;

  // Transit line
  const transitLine = transitNote
    ? mode === "soul"
      ? `\n${transitNote}`
      : `\n${transitingPlanet} ${topAspect!.type}: ${transitNote}`
    : "";

  // Fixed star lines
  const starLines =
    planetStars.length > 0
      ? "\n" + planetStars.map(c => buildStarLine(c, mode)).join("\n")
      : "";

  const synthesis =
    `${opening} ${signLine}${intensityTag}${rxTag}${transitLine}${starLines}`.trim();

  return {
    pillar: pillarType,
    planet: planetInput.planet,
    nakshatra: nakshatra.name,
    archetype: nakshatra.archetype,
    shakti: nakshatra.shakti,
    sign: planetInput.sign,
    synthesis,
    transitNote,
    starConjunctions: planetStars,
  };
}

// ============================================================================
// TRUTH GENERATORS
// ============================================================================

function getHardAspectTruth(
  aspect: RawAspect,
  mode: ReadingMode
): { truth: string; why: string } {
  const meanings: Record<string, Record<ReadingMode, string>> = {
    square: {
      direct: `${aspect.planet1} and ${aspect.planet2} are blocked against each other. These two forces are not cooperating.`,
      soul: `A friction exists between your ${aspect.planet1} and ${aspect.planet2}. They want different things, and both are real.`,
      integrated: `Tension: ${aspect.planet1} ♢ ${aspect.planet2}. Not yet aligned.`,
    },
    opposition: {
      direct: `${aspect.planet1} pulls against ${aspect.planet2}. You're being stretched in two directions.`,
      soul: `A polarity is live in your chart. Both ${aspect.planet1} and ${aspect.planet2} are valid. Neither alone is complete.`,
      integrated: `Opposition: ${aspect.planet1} ↔ ${aspect.planet2}. Choose both or neither.`,
    },
    conjunction: {
      direct: `${aspect.planet1} and ${aspect.planet2} are fused. They cannot be separated right now.`,
      soul: `${aspect.planet1} and ${aspect.planet2} speak as one voice. Notice what they say together.`,
      integrated: `Fusion: ${aspect.planet1} + ${aspect.planet2}. They act as one force.`,
    },
    quincunx: {
      direct: `${aspect.planet1} and ${aspect.planet2} don't fit. Forcing the connection makes it worse.`,
      soul: `Something between ${aspect.planet1} and ${aspect.planet2} is misaligned — not broken, just off. Adjustment, not force.`,
      integrated: `Misalignment: ${aspect.planet1} ⚻ ${aspect.planet2}. Adjust, don't push.`,
    },
  };

  const fallback: Record<ReadingMode, string> = {
    direct: `${aspect.planet1} ${aspect.type} ${aspect.planet2} at ${Math.round(aspect.orb)}° orb.`,
    soul: `The ${aspect.type} between ${aspect.planet1} and ${aspect.planet2} creates a specific dynamic in your field.`,
    integrated: `${aspect.planet1} ${aspect.type} ${aspect.planet2} (${Math.round(aspect.strength * 100)}% strength).`,
  };

  return {
    truth: meanings[aspect.type]?.[mode] || fallback[mode],
    why: `${aspect.planet1} and ${aspect.planet2} are ${Math.round(aspect.orb)}° apart. Exact is 0°. Closer means stronger.`,
  };
}

function getPatternTruth(pattern: PatternScore, mode: ReadingMode): string {
  const meanings: Record<string, Record<ReadingMode, string>> = {
    stellium: {
      direct: `${pattern.planets.length} planets in ${pattern.signs[0]}. This life area is overloaded. It runs everything right now.`,
      soul: `Your ${pattern.signs[0]} energy is concentrated. What lives there wants — and deserves — your full attention.`,
      integrated: `Stellium in ${pattern.signs[0]}: ${pattern.planets.join(", ")}. The weight of the chart is here.`,
    },
    t_square: {
      direct: `Pressure triangle. ${pattern.planets[2]} is the release valve. Act through it or the pressure finds its own outlet.`,
      soul: `Three planets in tension. The missing peace is ${pattern.planets[2]} — that's where resolution lives.`,
      integrated: `T-Square: ${pattern.planets[0]}–${pattern.planets[1]} in opposition, squared by ${pattern.planets[2]}.`,
    },
    grand_trine: {
      direct: `Natural flow. Things come easy in this area. Watch for complacency — ease without effort stagnates.`,
      soul: `Talent flows freely through ${pattern.planets.join(", ")}. Use it before you forget it's there.`,
      integrated: `Grand Trine: ${pattern.planets.join(", ")}. Effortless — but effort is still required.`,
    },
    rahu_ketu_axis: {
      direct: `Karmic axis is live. What you chase (Rahu in ${pattern.signs[0]}) and what you release (Ketu in ${pattern.signs[1]}) are locked together.`,
      soul: `Your soul's craving (Rahu) and soul's memory (Ketu) are facing each other. Integration is the path.`,
      integrated: `Rahu in ${pattern.signs[0]} (chase) / Ketu in ${pattern.signs[1]} (release). Both must move.`,
    },
    parivartana: {
      direct: `Mutual reception: ${pattern.planets[0]} and ${pattern.planets[1]} are trading signs. They function as a unit.`,
      soul: `An exchange is happening between ${pattern.planets[0]} and ${pattern.planets[1]}. What one offers, the other receives.`,
      integrated: `Parivartana: ${pattern.planets[0]} ↔ ${pattern.planets[1]}. Use them together, not in isolation.`,
    },
  };
  return meanings[pattern.type]?.[mode] || pattern.description;
}

function getWarTruth(war: PlanetaryWar, mode: ReadingMode): string {
  if (mode === "direct")
    return `${war.winner} overpowers ${war.loser} within 1°. ${war.winner}'s expression dominates. Work with the winner.`;
  if (mode === "soul")
    return `${war.winner} and ${war.loser} are in close quarters. ${war.winner} is louder. Listen there first.`;
  return `Planetary war: ${war.winner} > ${war.loser} (${war.degreeDiff.toFixed(2)}° separation). ${war.winner} sets the tone.`;
}

function getStrengthNote(
  planet: string,
  strength: number,
  mode: ReadingMode
): string | null {
  if (strength > 0.8) {
    if (mode === "direct")
      return `${planet} is dominant. Its voice overrides others in the chart right now.`;
    if (mode === "soul")
      return `${planet} energy is amplified. What it represents cannot be sidestepped.`;
    return `${planet}: ${Math.round(strength * 100)}% strength. Dominant.`;
  }
  if (strength < 0.3) {
    if (mode === "direct")
      return `${planet} is weakened. Its expression is muted or distorted.`;
    if (mode === "soul")
      return `${planet} energy is quiet right now. You may not feel its influence clearly.`;
    return `${planet}: ${Math.round(strength * 100)}% strength. Weakened.`;
  }
  return null;
}

// ============================================================================
// ACTION + WARNING GENERATORS
// ============================================================================

function getActionForPattern(pattern: PatternScore, mode: ReadingMode): string {
  const actions: Record<string, Record<ReadingMode, string>> = {
    stellium: {
      direct: `Act in ${pattern.signs[0]} territory today. That's where the charge is. One concrete action there.`,
      soul: `What keeps pulling you toward ${pattern.signs[0]} themes? Follow that pull intentionally, not reactively.`,
      integrated: `Energy is concentrated in ${pattern.signs[0]}. Act there, not everywhere else.`,
    },
    t_square: {
      direct: `${pattern.planets[2]} is the release point. Take one action through that planet's domain — today.`,
      soul: `The tension doesn't resolve by choosing sides. ${pattern.planets[2]} holds the key. Move through it.`,
      integrated: `Act through ${pattern.planets[2]}. That's your pressure valve.`,
    },
    grand_trine: {
      direct: `Introduce intentional friction. Do one thing that's slightly too hard today. Ease without challenge stagnates.`,
      soul: `Flow is a gift and a trap. What comes easy may keep you comfortable and small. Stretch anyway.`,
      integrated: `Use the ease, but don't trust it entirely. Introduce one deliberate challenge.`,
    },
    rahu_ketu_axis: {
      direct: `Rahu's chase (${pattern.signs[0]}) and Ketu's release (${pattern.signs[1]}) are linked. Move one and the other follows.`,
      soul: `Your craving and your release point to the same wound. Work on one; the other shifts.`,
      integrated: `Rahu and Ketu are two sides of one coin. Address both or neither.`,
    },
    planetary_war: {
      direct: `Stop forcing the losing planet's expression. Work with ${pattern.planets[0]} — it's the dominant force right now.`,
      soul: `The louder energy is the teacher. Honor ${pattern.planets[0]} first and see what opens.`,
      integrated: `The war winner sets the tone. The loser's expression is temporarily subordinate.`,
    },
  };
  return (
    actions[pattern.type]?.[mode] ||
    `Attend to ${pattern.planets.join(", ")}. This pattern requires conscious engagement.`
  );
}

function getWarningForPattern(
  pattern: PatternScore,
  mode: ReadingMode
): string | null {
  const warnings: Record<string, Record<ReadingMode, string>> = {
    t_square: {
      direct: `Ignore this tension and it will express as crisis. It finds an outlet whether you direct it or not.`,
      soul: `Unresolved pressure finds release — usually through the part of life you're most avoiding.`,
      integrated: `This pattern escalates until it's acknowledged. Address it consciously or it addresses you.`,
    },
    rahu_ketu_axis: {
      direct: `Chase Rahu without releasing Ketu and you'll run in circles. Both must move.`,
      soul: `Craving without release creates obsession. Release without direction creates emptiness. Both sides need attention.`,
      integrated: `Neglect one end of the axis and the other spins out. The system requires balance.`,
    },
  };
  return warnings[pattern.type]?.[mode] || null;
}

// ============================================================================
// MAIN READING GENERATION
// ============================================================================

export function generateReading(
  analysis: PatternAnalysis,
  context: UserContext
): ReadingOutput {
  const mode = context.readingMode || "integrated";
  const starConjunctions = context.starConjunctions || [];

  // ── Pillar planet selection WITH DEGREE FOR DECANS ────────────────────────
  const pillars: PillarRead[] = [];
  const pillarPlanets = new Set<string>();

  if (context.planetData) {
    const pd = context.planetData;

    if (pd["Moon"]) {
      const moonLong = pd["Moon"].longitude;
      const moonDegree = Math.floor(moonLong % 30);
      pillars.push(
        buildPillarRead(
          "Soul",
          pd["Moon"],
          moonDegree,
          analysis.aspects,
          mode,
          starConjunctions
        )
      );
      pillarPlanets.add("Moon");
    }

    const mindPlanet = selectPillarPlanet(["Mercury", "Saturn"], pd);
    if (mindPlanet) {
      const mindLong = mindPlanet.longitude;
      const mindDegree = Math.floor(mindLong % 30);
      pillars.push(
        buildPillarRead(
          "Mind",
          mindPlanet,
          mindDegree,
          analysis.aspects,
          mode,
          starConjunctions
        )
      );
      pillarPlanets.add(mindPlanet.planet);
    }

    const spiritPlanet = selectPillarPlanet(["Sun", "Jupiter"], pd);
    if (spiritPlanet) {
      const spiritLong = spiritPlanet.longitude;
      const spiritDegree = Math.floor(spiritLong % 30);
      pillars.push(
        buildPillarRead(
          "Spirit",
          spiritPlanet,
          spiritDegree,
          analysis.aspects,
          mode,
          starConjunctions
        )
      );
      pillarPlanets.add(spiritPlanet.planet);
    }
  }

  // ── Non-pillar star conjunctions → surface in truth block ─────────────────
  const starNotes: string[] = starConjunctions
    .filter(c => !pillarPlanets.has(c.planet))
    .map(c => {
      const royalTag = c.star.isRoyal
        ? " [ROYAL STAR]"
        : c.star.isPolar
          ? " [POLE STAR]"
          : "";
      return `${c.planet} conjunct ${c.star.name}${royalTag} (${c.orb}°) — ${c.star.meaning}`;
    });

  // ── Aspect truths ─────────────────────────────────────────────────────────
  const truths: string[] = [];
  const whys: string[] = [];
  const actions: string[] = [];
  const warnings: string[] = [];
  const patternNames: string[] = [];

  const hardAspects = analysis.aspects
    .filter(a => a.isHard && a.strength > 0.6)
    .sort((a, b) => b.strength - a.strength);

  if (hardAspects.length > 0) {
    const { truth, why } = getHardAspectTruth(hardAspects[0], mode);
    truths.push(truth);
    whys.push(why);
  }

  for (const pattern of analysis.patterns.slice(0, 2)) {
    truths.push(getPatternTruth(pattern, mode));
    actions.push(getActionForPattern(pattern, mode));
    patternNames.push(pattern.type);
    const warning = getWarningForPattern(pattern, mode);
    if (warning) warnings.push(warning);
  }

  if (analysis.wars.length > 0) {
    truths.push(getWarTruth(analysis.wars[0], mode));
  }

  const sortedStrengths = Object.entries(analysis.strengths).sort(
    (a, b) => b[1].rawStrength - a[1].rawStrength
  );

  if (sortedStrengths.length > 0) {
    const [top, topData] = sortedStrengths[0];
    const note = getStrengthNote(top, topData.rawStrength, mode);
    if (note) truths.push(note);
  }

  if (mode !== "direct" && sortedStrengths.length > 0) {
    const [bottom, bottomData] = sortedStrengths[sortedStrengths.length - 1];
    const note = getStrengthNote(bottom, bottomData.rawStrength, mode);
    if (note) truths.push(note);
  }

  if (context.focusArea && mode === "direct") {
    actions.push(
      `Your question about ${context.focusArea} maps directly onto these patterns. Act accordingly.`
    );
  }

  if (truths.length === 0) {
    truths.push(
      mode === "direct"
        ? "No dominant patterns detected. The chart is balanced right now."
        : "No single pattern overwhelms the others. Balance is the message."
    );
  }

  return {
    mode,
    pillars,
    truth: truths.join(" "),
    why:
      whys.slice(0, 2).join(" ") ||
      "The mechanics are straightforward. Planets interact. Patterns emerge.",
    action:
      actions.slice(0, 2).join(" ") ||
      "No single action is indicated. Maintain awareness.",
    warning: warnings.length > 0 ? warnings[0] : null,
    patterns: [...new Set(patternNames)],
    starNotes,
    timestamp: new Date(),
  };
}

// ============================================================================
// DISPLAY FORMATTER
// ============================================================================

const PILLAR_ICON: Record<string, string> = {
  Soul: "🌙",
  Mind: "🧠",
  Spirit: "✨",
};

export function formatReading(
  reading: ReadingOutput,
  context: UserContext
): string {
  const modeLabel =
    reading.mode === "direct"
      ? "⚡ DIRECT TRUTH"
      : reading.mode === "soul"
        ? "🌙 SOUL READING"
        : "🔄 INTEGRATED";

  const divider = "─".repeat(64);

  let out = `
╔══════════════════════════════════════════════════════════════════╗
║  ${modeLabel}${context.name ? ` · ${context.name}` : ""}
║  ${reading.timestamp.toLocaleString()}
╚══════════════════════════════════════════════════════════════════╝
`;

  // Pillar reads — nakshatra + decan flavor + transit + fixed stars fused
  for (const pillar of reading.pillars) {
    const starHeader =
      pillar.starConjunctions.length > 0
        ? ` · ⭐ ${pillar.starConjunctions.map(c => c.star.name + (c.star.isRoyal ? " [ROYAL]" : "")).join(", ")}`
        : "";
    out += `
${divider}
${PILLAR_ICON[pillar.pillar]} ${pillar.pillar.toUpperCase()} PILLAR  ·  ${pillar.planet} in ${pillar.nakshatra} / ${pillar.sign}${starHeader}

${pillar.synthesis}
`;
  }

  // Non-pillar star conjunctions
  if (reading.starNotes.length > 0) {
    out += `
${divider}
⭐ FIXED STAR CONTACTS (other planets)

${reading.starNotes.join("\n")}
`;
  }

  // Sabian degree symbols (for all planets)
  if (context.planetData) {
    out += `
${divider}
📖 DEGREE SYMBOLS (Sabian)

`;
    for (const [planetName, p] of Object.entries(context.planetData)) {
      const degWithin = p.longitude % 30;
      const degIdx = Math.floor(degWithin) + 1;
      const symbol = getDegreeMeaning(p.sign, degIdx);
      if (symbol) {
        out += `${planetName} at ${Math.floor(degWithin)}° ${p.sign}: ${symbol}\n`;
      } else {
        out += `${planetName} at ${Math.floor(degWithin)}° ${p.sign}: (symbol not found)\n`;
      }
    }
    out += "\n";
  }

  out += `
${divider}
🔍 WHAT THE PATTERNS SHOW

${reading.truth}

${divider}
⚙️  WHY THIS IS HAPPENING

${reading.why}

${divider}
✅ WHAT TO DO

${reading.action}
`;

  if (reading.warning) {
    out += `
${divider}
⚠️  WHAT HAPPENS IF IGNORED

${reading.warning}
`;
  }

  out += `
${divider}
📊 PATTERNS DETECTED: ${reading.patterns.join(", ") || "None dominant"}

${divider}
"Truth doesn't need to feel good. It needs to be useful."
`;

  return out;
}

// ============================================================================
// QUICK READING
// ============================================================================

export function quickReading(
  analysis: PatternAnalysis,
  question?: string,
  planetData?: Record<string, PlanetStrengthInput>,
  starConjunctions?: StarConjunction[]
): ReadingOutput {
  let mode: ReadingMode = "integrated";
  let focusArea: QuestionArea = "general";

  if (question) {
    const q = question.toLowerCase();
    if (q.includes("fix") || q.includes("stop") || q.includes("how do i"))
      mode = "direct";
    if (q.includes("feel") || q.includes("soul") || q.includes("why am i"))
      mode = "soul";
    if (q.includes("career") || q.includes("work") || q.includes("job"))
      focusArea = "career";
    if (
      q.includes("love") ||
      q.includes("partner") ||
      q.includes("relationship")
    )
      focusArea = "relationships";
    if (q.includes("money") || q.includes("finance") || q.includes("income"))
      focusArea = "finance";
    if (q.includes("health") || q.includes("body") || q.includes("sick"))
      focusArea = "health";
    if (q.includes("spirit") || q.includes("purpose") || q.includes("dharma"))
      focusArea = "spirituality";
  }

  return generateReading(analysis, {
    question,
    readingMode: mode,
    focusArea,
    planetData,
    starConjunctions,
  });
}
