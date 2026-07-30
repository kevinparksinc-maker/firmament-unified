// ============================================================
// STRUCTURED WISDOM LAYER — Competition Engine
// ============================================================
// Mirrors the HOUSE_TOPICS / PLANET_CORE pattern from Firmament's
// buildSemanticBlock(). This module is pure data + one injector
// function. No scoring logic lives here — this is Level 1/2
// vocabulary only, consumed by scoreHouses() (Level 3) and by
// the AI synthesis prompt.
// ============================================================

// ---------- LEVEL 1: RAW FACT VOCABULARY ----------

export type DignityState =
  | "domicile"
  | "exaltation"
  | "triplicity"
  | "term"
  | "face"
  | "detriment"
  | "fall"
  | "peregrine";

export const DIGNITY_MEANING: Record<DignityState, string> = {
  domicile: "Planet is home. Full, unforced strength — acts on its own authority.",
  exaltation: "Planet is honored, elevated beyond its normal capacity. Best-case expression.",
  triplicity: "Secondary support by element. Steady but not commanding.",
  term: "Minor jurisdiction. Enough foothold to function, not to dominate.",
  face: "Weakest positive dignity. Barely-there support.",
  detriment: "Planet is in enemy territory. Strained, working against itself.",
  fall: "Planet is weakest here. Undermined, worst-case expression.",
  peregrine: "No dignity at all. Directionless — takes on the character of whatever it touches.",
};

export type AccidentalDignity =
  | "angular"
  | "succedent"
  | "cadent"
  | "fast"
  | "slow"
  | "stationing"
  | "retrograde"
  | "combust"
  | "under_beams"
  | "besieged"
  | "cazimi";

export const ACCIDENTAL_MEANING: Record<AccidentalDignity, string> = {
  angular: "Angular houses (1/4/7/10) give a planet the power to act immediately.",
  succedent: "Succedent houses (2/5/8/11) give resources to act but not initiative.",
  cadent: "Cadent houses (3/6/9/12) weaken a planet's capacity to act decisively.",
  fast: "Faster-than-average motion — eager, front-loaded energy.",
  slow: "Slower-than-average motion — energy is delayed or drags out.",
  stationing: "About to reverse direction. Energy is stuck, tense, about to turn — often marks a turning point in the event itself.",
  retrograde: "Motion turned inward. Effects are internal, delayed, or repeat something already tried.",
  combust: "Within ~8.5° of the Sun, moving toward it. Burned out, overpowered, judgment impaired.",
  under_beams: "Within ~15° of the Sun. Weakened but not destroyed — visibility/clarity reduced.",
  besieged: "Trapped between two malefics. Under sustained pressure with no easy exit.",
  cazimi: "Within 17' of the Sun, exact. Not burned — empowered by direct union with the source.",
};

// ---------- LEVEL 1: PLANETARY PHASE (Western synodic addition) ----------

export type SynodicPhase =
  | "emerging_from_combustion"
  | "approaching_combustion"
  | "morning_star"
  | "evening_star"
  | "oriental"
  | "occidental";

export const PHASE_MEANING: Record<SynodicPhase, string> = {
  emerging_from_combustion: "Influence is building — coming back into its own power after being overwhelmed.",
  approaching_combustion: "Influence is fading — about to be overwhelmed, effects thinning out.",
  morning_star: "Rises before the Sun. Initiating, proactive, sets terms early.",
  evening_star: "Sets after the Sun. Reactive, responding to what's already been established.",
  oriental: "Rising before the Sun in the broader cycle — front-footed, assertive phase.",
  occidental: "Setting after the Sun in the broader cycle — reflective, consolidating phase.",
};

// ---------- LEVEL 2: ASPECT RELATIONSHIP VOCABULARY ----------

export type AspectMotion = "applying" | "separating" | "exact";

export const ASPECT_MOTION_MEANING: Record<AspectMotion, string> = {
  applying: "Orb is closing. The relationship is still developing — momentum is building, not yet spent.",
  separating: "Orb is widening. The relationship has already peaked — momentum is fading or already happened.",
  exact: "Orb is at zero. The relationship is at its most concentrated point of expression.",
};

export type ReceptionType =
  | "mutual_reception"
  | "one_way_reception"
  | "no_reception";

export const RECEPTION_MEANING: Record<ReceptionType, string> = {
  mutual_reception: "Two planets each sit in the other's dignity. Full cooperation — each supports the other's agenda.",
  one_way_reception: "One planet sits in another's dignity but not vice versa. Dependence — one side needs the other more.",
  no_reception: "No dignity exchange. Contact without cooperation — a collision, not a partnership.",
};

export type HoraryCondition =
  | "translation_of_light"
  | "collection_of_light"
  | "prohibition"
  | "frustration"
  | "refranation";

export const HORARY_CONDITION_MEANING: Record<HoraryCondition, string> = {
  translation_of_light: "A faster planet carries the connection between two slower planets that can't reach each other directly. A third party closes the gap.",
  collection_of_light: "A slower planet gathers the light of two faster planets into itself. Outside force brings resolution neither side could reach alone.",
  prohibition: "A third planet interferes before the intended aspect perfects. The expected outcome gets blocked or diverted.",
  frustration: "An aspect is about to perfect but one planet changes sign or direction first, so it never completes. Anticipated outcome falls apart at the last moment.",
  refranation: "A planet turns retrograde before completing an aspect, withdrawing from the connection entirely. A pullback before commitment.",
};

// ---------- LEVEL 2: STRUCTURAL RELATIONSHIPS ----------

export type StructuralLink =
  | "drishti"
  | "bhavat_bhavam"
  | "dispositor_chain"
  | "parivartana"
  | "conjunction";

export const STRUCTURAL_LINK_MEANING: Record<StructuralLink, string> = {
  drishti: "Special directional aspect (Jyotish). Not symmetric like Western aspects — some planets see further forward than others.",
  bhavat_bhavam: "House-from-house counting. A house's significance shifts depending which house you're viewing it from.",
  dispositor_chain: "Planet A sits in Planet B's sign, so Planet A's affairs depend on Planet B's condition. Chains can nest several levels deep.",
  parivartana: "Sign exchange — two planets sit in each other's signs. Creates a strong structural bond, functions like a mutual favor.",
  conjunction: "Planets sharing the same sign/degree range. Blending of significations, strongest form of contact.",
};

// ---------- INJECTOR: BUILD AI SYNTHESIS BLOCK ----------
// Mirrors buildSemanticBlock() pattern from Firmament. Call this
// with the Level 1/2 facts computed for a given chart, and it
// returns a compact natural-language block for the synthesis prompt.
// Keep it factual/definitional here — narrative judgment happens
// in the AI layer, not in this dictionary.

export interface WisdomBlockInput {
  dignities?: DignityState[];
  accidentals?: AccidentalDignity[];
  phases?: SynodicPhase[];
  aspectMotions?: AspectMotion[];
  receptions?: ReceptionType[];
  horaryConditions?: HoraryCondition[];
  structuralLinks?: StructuralLink[];
}

export function buildWisdomBlock(input: WisdomBlockInput): string {
  const lines: string[] = [];

  const addSection = <T extends string>(
    label: string,
    items: T[] | undefined,
    dict: Record<T, string>
  ) => {
    if (!items || items.length === 0) return;
    lines.push(`\n${label}:`);
    for (const item of Array.from(new Set(items))) {
      lines.push(`- ${item}: ${dict[item]}`);
    }
  };

  addSection("Dignity", input.dignities, DIGNITY_MEANING);
  addSection("Accidental Dignity", input.accidentals, ACCIDENTAL_MEANING);
  addSection("Planetary Phase", input.phases, PHASE_MEANING);
  addSection("Aspect Motion", input.aspectMotions, ASPECT_MOTION_MEANING);
  addSection("Reception", input.receptions, RECEPTION_MEANING);
  addSection("Horary Condition", input.horaryConditions, HORARY_CONDITION_MEANING);
  addSection("Structural Link", input.structuralLinks, STRUCTURAL_LINK_MEANING);

  return lines.join("\n").trim();
}
