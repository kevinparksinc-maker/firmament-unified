// ─── DIGNITY TABLE ───────────────────────────────────────────────────────────
const DIGNITIES: Record<
  string,
  {
    rulership: string[];
    exaltation: string[];
    detriment: string[];
    fall: string[];
    classical: boolean;
  }
> = {
  Sun: {
    rulership: ["Leo"],
    exaltation: ["Aries"],
    detriment: ["Aquarius"],
    fall: ["Libra"],
    classical: true,
  },
  Moon: {
    rulership: ["Cancer"],
    exaltation: ["Taurus"],
    detriment: ["Capricorn"],
    fall: ["Scorpio"],
    classical: true,
  },
  Mercury: {
    rulership: ["Gemini", "Virgo"],
    exaltation: ["Virgo"],
    detriment: ["Sagittarius", "Pisces"],
    fall: ["Pisces"],
    classical: true,
  },
  Venus: {
    rulership: ["Taurus", "Libra"],
    exaltation: ["Pisces"],
    detriment: ["Aries", "Scorpio"],
    fall: ["Virgo"],
    classical: true,
  },
  Mars: {
    rulership: ["Aries", "Scorpio"],
    exaltation: ["Capricorn"],
    detriment: ["Taurus", "Libra"],
    fall: ["Cancer"],
    classical: true,
  },
  Jupiter: {
    rulership: ["Sagittarius", "Pisces"],
    exaltation: ["Cancer"],
    detriment: ["Gemini", "Virgo"],
    fall: ["Capricorn"],
    classical: true,
  },
  Saturn: {
    rulership: ["Capricorn", "Aquarius"],
    exaltation: ["Libra"],
    detriment: ["Cancer", "Leo"],
    fall: ["Aries"],
    classical: true,
  },
  Rahu: {
    rulership: ["Gemini", "Virgo"],
    exaltation: ["Taurus", "Gemini"],
    detriment: ["Sagittarius", "Pisces"],
    fall: ["Scorpio", "Sagittarius"],
    classical: false,
  },
  Ketu: {
    rulership: ["Sagittarius", "Pisces"],
    exaltation: ["Scorpio", "Sagittarius"],
    detriment: ["Gemini", "Virgo"],
    fall: ["Taurus", "Gemini"],
    classical: false,
  },
  Uranus: {
    rulership: ["Aquarius"],
    exaltation: ["Scorpio"],
    detriment: ["Leo"],
    fall: ["Taurus"],
    classical: false,
  },
  Neptune: {
    rulership: ["Pisces"],
    exaltation: ["Cancer"],
    detriment: ["Virgo"],
    fall: ["Capricorn"],
    classical: false,
  },
  Pluto: {
    rulership: ["Scorpio"],
    exaltation: ["Aries"],
    detriment: ["Taurus"],
    fall: ["Libra"],
    classical: false,
  },
};

function getDignityFlavor(planet: string, sign: string): string | null {
  const d = DIGNITIES[planet];
  if (!d) return null;
  const authority = d.classical
    ? ""
    : " (modern attribution — no classical basis)";
  if (d.rulership.includes(sign))
    return (
      planet +
      " rules " +
      sign +
      authority +
      " — the energy moves without friction here, fully at home in its own container."
    );
  if (d.exaltation.includes(sign))
    return (
      planet +
      " is exalted in " +
      sign +
      authority +
      " — operating at a pitch above its normal register. Can mean brilliance; can mean overreach."
    );
  if (d.detriment.includes(sign))
    return (
      planet +
      " is in detriment in " +
      sign +
      authority +
      " — displaced from its natural environment. Not weakness. Friction that often produces unusual depth and self-awareness."
    );
  if (d.fall.includes(sign))
    return (
      planet +
      " is in fall in " +
      sign +
      authority +
      " — working against its own grain. Produces the kind of awareness that only comes from something never being easy."
    );
  return null;
}

const FIXED_STARS = [
  {
    name: "Aldebaran",
    sidDegree: 45.0,
    nature: "Mars",
    isRoyal: true,
    archetype: "The Warrior",
    gift: "Courage, honor, integrity, bold action",
    shadow: "Cowardice, deceit, corruption of principles",
    warning:
      "Integrity must be maintained or the star destroys what it once lifted",
    meaning:
      "Watcher of the East. The Eye of the Bull. Those with planets here are warriors by nature — not of battle, but of principle. They fight for what they believe and cannot stand cowardice or deceit. Success comes through bold action, but the star demands standing for something greater than yourself.",
  },
  {
    name: "Regulus",
    sidDegree: 135.0,
    nature: "Mars/Jupiter",
    isRoyal: true,
    archetype: "The King",
    gift: "Leadership, kingship, success, fame, honor, command",
    shadow: "Betrayal, cowardice, abuse of power, revenge",
    warning:
      "Revenge destroys everything gained. The star watches and remembers.",
    meaning:
      "Watcher of the North. The Heart of the Lion. The most royal star. Those with planets here are marked for leadership whether they want it or not. Success comes through courage and nobility, but the star punishes betrayal and abuse of power. Rise or fall — there is no middle ground.",
  },
  {
    name: "Antares",
    sidDegree: 225.0,
    nature: "Mars/Jupiter",
    isRoyal: true,
    archetype: "The Transformer",
    gift: "Depth, power, obsession, occult ability, transformation",
    shadow: "Recklessness, destruction, being consumed by darkness",
    warning:
      "Recklessness brings downfall. Something must die for transformation to occur.",
    meaning:
      "Watcher of the West. The Heart of the Scorpion. Those with planets here walk the edge between transformation and destruction. They are drawn to the occult, to death and rebirth, to things others fear to touch. The star grants depth and power at a cost — you must be willing to descend into darkness to find your light.",
  },
  {
    name: "Fomalhaut",
    sidDegree: 315.0,
    nature: "Venus/Mercury",
    isRoyal: true,
    archetype: "The Visionary",
    gift: "Idealism, mysticism, dreams made real, art, vision",
    shadow: "Impure intentions, selfish magic, delusion",
    warning:
      "Only absolute purity of intention succeeds. The Mouth swallows the unworthy.",
    meaning:
      "Watcher of the South. The Mouth of the Southern Fish. Those with planets here are visionaries, artists, and mystics. They see what others cannot. The star grants access to higher realms but tests your motives. Selfish magic fails. Only work done with pure intention succeeds.",
  },
  {
    name: "Sirius",
    sidDegree: 103.68,
    nature: "Jupiter/Mars",
    isRoyal: false,
    archetype: "The Scorcher",
    gift: "Ambition, pride, fame, wealth, leadership, success",
    shadow: "Burning out, overextension, hubris, destruction",
    warning:
      "The brightest star burns hottest. Success comes fast but can end faster if overextended.",
    meaning:
      "The Dog Star. The brightest star in the sky. Sacred to the Egyptians. Those with planets here are driven to achieve greatness. But Sirius demands that you handle success wisely or be consumed by your own flame.",
  },
  {
    name: "Spica",
    sidDegree: 203.27,
    nature: "Venus/Mars",
    isRoyal: false,
    archetype: "The Blessed",
    gift: "Art, music, science, spiritual grace, success, wealth, refinement",
    shadow: "Complacency, laziness, resting on talent",
    warning:
      "Gifts must be used or they wither. The blessed star expects contribution.",
    meaning:
      "The brightest star in Virgo. The most benefic fixed star. Those with planets here are blessed with talent, beauty, and grace. But blessing without action becomes stagnation.",
  },
  {
    name: "Arcturus",
    sidDegree: 203.83,
    nature: "Jupiter/Mars",
    isRoyal: false,
    archetype: "The Guardian",
    gift: "Pioneering, exploration, wealth, honor, inspiration",
    shadow: "Isolation, loneliness, alienation from community",
    warning: "The path you walk is yours alone. Success comes with solitude.",
    meaning:
      "The Guardian of the Bear. Those with planets here are pioneers — they go where others have not gone. Success comes through exploration and carving new paths. But the pioneer walks alone.",
  },
  {
    name: "Algol",
    sidDegree: 55.1,
    nature: "Saturn/Jupiter",
    isRoyal: false,
    archetype: "The Demon",
    gift: "Intense creative power, destruction of old structures, forging strength through crisis",
    shadow: "Ruin, violence, obsession, being consumed by darkness",
    warning:
      "The Demon Star does not compromise. You will be forged or destroyed.",
    meaning:
      "The Demon Star. The blinking eye of Medusa. The most feared star in ancient tradition. Those with planets here face profound challenges that forge extraordinary strength — or utter ruin. Algol does not offer easy paths. It offers transformation through fire.",
  },
  {
    name: "Betelgeuse",
    sidDegree: 88.03,
    nature: "Mars/Mercury",
    isRoyal: false,
    archetype: "The Champion",
    gift: "Riches, honors, fame, success, victory, championship",
    shadow: "Pride, calamity, fall from grace, overreach",
    warning: "Victory without humility invites destruction.",
    meaning:
      "The right shoulder of Orion. Those with planets here are marked for success — riches, honors, fame. But Betelgeuse is a dying star, and it reminds you: all glory is temporary.",
  },
  {
    name: "Rigel",
    sidDegree: 76.76,
    nature: "Jupiter/Mars",
    isRoyal: false,
    archetype: "The Builder",
    gift: "Education, technical mastery, engineering, lasting structures, wealth",
    shadow: "Rigidity, lack of vision, building without purpose",
    warning:
      "Building for its own sake is vanity. What are you constructing and why?",
    meaning:
      "The left foot of Orion. Those with planets here are architects, engineers, and master craftsmen. They build things that last. But Rigel asks: what are you building and why?",
  },
  {
    name: "Vega",
    sidDegree: 284.73,
    nature: "Venus/Mercury",
    isRoyal: false,
    archetype: "The Enchanter",
    gift: "Magic, charisma, art, music, enchantment, politics",
    shadow: "Fleeting fame, practicality lacking, manipulation",
    warning:
      "Magic without substance is just illusion. Your enchantment must serve truth.",
    meaning:
      "The Falling Eagle. Those with planets here have charisma that moves crowds, art that changes hearts, and magic that alters reality. But Vega asks: what is your enchantment for?",
  },
  {
    name: "Altair",
    sidDegree: 301.0,
    nature: "Mars/Jupiter",
    isRoyal: false,
    archetype: "The Risk-Taker",
    gift: "Boldness, sudden wealth, high command, adventurous spirit",
    shadow: "Danger, ephemeral success, recklessness, loss",
    warning:
      "Fortune favors the bold — but boldness without wisdom is gambling, not strategy.",
    meaning:
      "The Flying Eagle. Those with planets here are bold, confident, and stubborn. They take risks others will not. Sometimes they win everything. Sometimes they lose everything.",
  },
  {
    name: "Achernar",
    sidDegree: 344.93,
    nature: "Jupiter",
    isRoyal: false,
    archetype: "The Seeker",
    gift: "Philosophy, religion, spirituality, honors, public office",
    shadow: "Spiritual bypass, avoiding earthly responsibilities",
    warning:
      "The divine is not an escape from the world. Spirituality must serve life, not avoid it.",
    meaning:
      "The end of the River Eridanus. Those with planets here are drawn to philosophy, religion, and spiritual matters. But Achernar warns: transcendence is not escape. The seeker must return to the world.",
  },
];

const SIGN_BASE: Record<string, number> = {
  Aries: 0,
  Taurus: 30,
  Gemini: 60,
  Cancer: 90,
  Leo: 120,
  Virgo: 150,
  Libra: 180,
  Scorpio: 210,
  Sagittarius: 240,
  Capricorn: 270,
  Aquarius: 300,
  Pisces: 330,
};

function toAbsolute(sign: string, degree: string): number {
  return (SIGN_BASE[sign] ?? 0) + parseFloat(degree || "0");
}

function detectConjunction(sign: string, degree: string) {
  const abs = toAbsolute(sign, degree);
  let closest: any = null;
  let closestOrb = Infinity;
  for (const star of FIXED_STARS) {
    let diff = Math.abs(abs - star.sidDegree);
    if (diff > 180) diff = 360 - diff;
    if (diff <= 3.0 && diff < closestOrb) {
      closest = { star, orb: Math.round(diff * 100) / 100, exact: diff <= 0.5 };
      closestOrb = diff;
    }
  }
  return closest;
}

function buildStarBlock(planet: string, sign: string, degree: string): string {
  const hit = detectConjunction(sign, degree);
  if (!hit)
    return (
      "FIXED STAR: No fixed star falls within conjunction orb of " +
      planet +
      " at " +
      degree +
      "° " +
      sign +
      ". Do not speculate about fixed stars. State this plainly in one sentence and move to other depth in this section."
    );
  const { star, orb, exact } = hit;
  const royalFlag = star.isRoyal ? " [ROYAL STAR — DESTINY MARKER]" : "";
  const exactFlag = exact ? " — EXACT conjunction" : " — orb " + orb + "°";
  return (
    "FIXED STAR CONJUNCTION (verified — hard fact, do not contradict):\n" +
    planet +
    " conjunct " +
    star.name +
    royalFlag +
    exactFlag +
    "\n" +
    "Archetype: " +
    star.archetype +
    "\n" +
    "Nature: " +
    star.nature +
    "\n" +
    "Gift: " +
    star.gift +
    "\n" +
    "Shadow: " +
    star.shadow +
    "\n" +
    "Warning: " +
    star.warning +
    "\n" +
    "Meaning: " +
    star.meaning +
    "\n" +
    (star.isRoyal
      ? "\nThis is one of the four Royal Watcher Stars. Treat this conjunction as a destiny marker of the highest order. Speak to it with full depth and consequence."
      : "")
  );
}

const SEPHIROTH: Record<string, any> = {
  Kether: {
    planet: "Pluto",
    pillar: "middle",
    number: 1,
    title: "The Crown",
    earthly:
      "The part of a person that existed before this life and will exist after it. The drive that cannot be explained by biography, environment, or choice.",
  },
  Chokmah: {
    planet: "Uranus",
    pillar: "right",
    number: 2,
    title: "Wisdom",
    earthly:
      "Raw undirected force before it has shape. The flash of knowing before the mind has processed it.",
  },
  Binah: {
    planet: "Saturn",
    pillar: "left",
    number: 3,
    title: "Understanding",
    earthly:
      "The force that gives form to raw potential. Limitation as a creative act. Structure not as prison but as the condition that makes anything real.",
  },
  Chesed: {
    planet: "Jupiter",
    pillar: "right",
    number: 4,
    title: "Mercy",
    earthly:
      "Expansion, generosity, abundance. Where a person is naturally open, where they extend trust, where they build. Also where they overextend.",
  },
  Geburah: {
    planet: "Mars",
    pillar: "left",
    number: 5,
    title: "Severity",
    earthly:
      "The force that cuts, judges, and removes what does not belong. Where a person fights, refuses, draws lines.",
  },
  Tiphareth: {
    planet: "Sun",
    pillar: "middle",
    number: 6,
    title: "Beauty",
    earthly:
      "The heart of the Tree. The true self beneath the persona. What they are when nobody is watching and they are not trying to be anything.",
  },
  Netzach: {
    planet: "Venus",
    pillar: "right",
    number: 7,
    title: "Victory",
    earthly:
      "Desire, feeling, nature, beauty. What a person loves, craves, is pulled toward before reason intervenes.",
  },
  Hod: {
    planet: "Mercury",
    pillar: "left",
    number: 8,
    title: "Splendor",
    earthly:
      "Intellect, language, pattern, communication. How a person thinks, talks, and makes sense of things.",
  },
  Yesod: {
    planet: "Moon",
    pillar: "middle",
    number: 9,
    title: "Foundation",
    earthly:
      "The unconscious architecture beneath conscious life. The emotional body, the dream life, the instinctive reactions that fire before thought.",
  },
  Malkuth: {
    planet: "Earth",
    pillar: "middle",
    number: 10,
    title: "The Kingdom",
    earthly:
      "Physical reality — the body, the material world, the place where everything above finally lands and becomes tangible.",
  },
  Daath: {
    planet: "Nodes",
    pillar: "middle",
    number: 0,
    title: "The Abyss",
    earthly:
      "The hidden sephirah. The gap between the upper and lower Tree. People with prominent nodes carry knowledge from before this life that cannot be fully translated into it.",
  },
};

const FOUR_WORLDS: Record<string, any> = {
  Atziluth: {
    element: "Fire",
    signs: ["Aries", "Leo", "Sagittarius"],
    level:
      "Divine archetype — the idea before it has form. The person experiences this energy as something that arrived with them — not learned, not developed, just there.",
  },
  Briah: {
    element: "Water",
    signs: ["Cancer", "Scorpio", "Pisces"],
    level:
      "Soul blueprint — where archetypes become patterns. The person experiences this energy as if watching their own life with a slight distance they cannot explain.",
  },
  Yetzirah: {
    element: "Air",
    signs: ["Gemini", "Libra", "Aquarius"],
    level:
      "Psychological formation — where patterns become thoughts, language, and relationship. The energy is most alive in exchange, in ideas, in the space between people.",
  },
  Assiah: {
    element: "Earth",
    signs: ["Taurus", "Virgo", "Capricorn"],
    level:
      "Physical manifestation — where everything above finally becomes matter, event, and body. The energy is not fully alive until it is tangible.",
  },
};

const ASPECT_PATHS: Record<string, any> = {
  conjunction: {
    symbol: "☌",
    geometry:
      "Same sephirah — two drives in the same psychic territory without inherent distance",
    manifestations: [
      "Fusion: the two energies blend seamlessly",
      "Compression: the energies amplify each other into density",
      "Entanglement: triggering one automatically triggers the other",
    ],
    developmental:
      "At 20: experienced as a single overwhelming drive. At 40: the person begins to distinguish the two energies. At 60: either full integration or chronic overload.",
    guardrail:
      "Do not assume unity. Diagnose which of the three patterns is present.",
    guidance:
      "The work is developing internal space between the two energies. Not separation — discernment.",
  },
  opposition: {
    symbol: "☍",
    geometry:
      "Maximum polarity — two sephiroth at maximum distance across the Tree structure",
    manifestations: [
      "Projection: one pole assigned unconsciously to other people",
      "Context splitting: one pole dominates at work, the other at home",
      "Delayed integration: life repeatedly demands both poles simultaneously",
    ],
    developmental:
      "At 20: one pole is lived, the other projected. At 35-40: the projected pole becomes undeniable. At 50+: integration becomes possible.",
    guardrail:
      "Raw oppositions are not comfortable — they are lived as external conflict before internal tension.",
    guidance:
      "The work is reclaiming the projected pole without abandoning the primary one.",
  },
  trine: {
    symbol: "△",
    geometry:
      "Flow within the same world — no structural resistance between the sephiroth",
    manifestations: [
      "Non-conscious competence: the person does it without knowing",
      "Under-ownership: the talent is invisible because it costs nothing",
      "Identity gap: the skill is real to everyone except the person who has it",
    ],
    developmental:
      "At 20: completely unmarked. At 35: others begin pointing it out. At 50: either mastery or still invisible.",
    guardrail:
      "Trine does not mean good. It means unmarked by friction — sometimes a worse fate than difficulty.",
    guidance:
      "The work is making the unconscious competence conscious. Name it. Develop it deliberately.",
  },
  square: {
    symbol: "□",
    geometry:
      "Two sephiroth that cannot be simultaneously satisfied — structural tension",
    manifestations: [
      "Escalating feedback loop: the same situation recurs with increasing intensity",
      "Behavioral demand: resolution comes through doing something differently",
      "Evolutionary pressure: the square at 25 and 45 have the same shape but different demands",
    ],
    developmental:
      "At 20: experienced as external problem. At 35: pattern recognized as internal. At 50: either adaptation made or calcified wound.",
    guardrail:
      "If a square never changes form across decades, something else is holding it in place.",
    guidance:
      "The work is behavioral, not conceptual. Change the action — not the thinking around it.",
  },
  sextile: {
    symbol: "⚹",
    geometry:
      "Adjacent but different worlds — opportunity exists but requires activation",
    manifestations: [
      "Threshold without momentum: the door is open but nothing pushes you through",
      "Synchronistic activation: opens through external invitation",
      "Conditional access: available without being automatic",
    ],
    developmental:
      "At 20: looks like luck or coincidence. At 35: the person begins to recognize the pattern. At 50: consciously worked sextiles become reliable resources.",
    guardrail:
      "Sextile is not a weak trine. It is conditional access versus latent flow.",
    guidance:
      "The work is positioning and timing. Be ready when the door appears.",
  },
};

function getSephirah(planet: string) {
  if (planet === "Rahu" || planet === "Ketu")
    return { name: "Daath", ...SEPHIROTH.Daath };
  for (const [name, data] of Object.entries(SEPHIROTH)) {
    if (data.planet === planet) return { name, ...data };
  }
  return null;
}

function getWorld(sign: string) {
  for (const [worldName, data] of Object.entries(FOUR_WORLDS)) {
    if (data.signs.includes(sign)) return { name: worldName, ...data };
  }
  return null;
}

function buildKabbalahBlock(
  planet: string,
  sign: string,
  aspects: { type: string; planet2: string }[] = []
): string {
  const sephirah = getSephirah(planet);
  const world = getWorld(sign);
  const isNode = planet === "Rahu" || planet === "Ketu";

  const sephirahBlock = sephirah
    ? "SEPHIRAH: " +
      sephirah.name +
      " — " +
      sephirah.title +
      "\nPillar: " +
      (sephirah.pillar || "hidden") +
      " | Number: " +
      (sephirah.number ?? "∞") +
      " | Planet: " +
      sephirah.planet +
      "\nEarthly expression: " +
      sephirah.earthly
    : "";

  const daathBlock = isNode
    ? "\nDA\'ATH — THE ABYSS (" +
      planet +
      "):\n" +
      planet +
      " is not a planet — it is an axis. A wound in the geometry of the chart where ordinary sephirothic logic does not apply.\nPeople with " +
      planet +
      " prominent carry knowledge from before this life that cannot be fully translated into it. They have access to frequencies that others do not — and they pay for that access in a specific way: they often feel they do not fully belong here.\nThe gift: access to pre-personal wisdom. The cost: a quality of exile that never fully resolves. The guidance: stop trying to translate the untranslatable. Use what you know."
    : "";

  const worldBlock = world
    ? "FOUR WORLDS — OPERATING LEVEL:\n" +
      planet +
      " in " +
      sign +
      " places this energy in " +
      world.name +
      " (" +
      world.element +
      ").\n" +
      world.level
    : "";

  let aspectBlock = "";
  if (aspects && aspects.length > 0) {
    const lines = aspects
      .map((a: any) => {
        const path = ASPECT_PATHS[a.type?.toLowerCase()];
        if (!path) return null;
        return (
          path.symbol +
          " " +
          planet +
          " " +
          a.type +
          " " +
          a.planet2 +
          ":\nPath geometry: " +
          path.geometry +
          "\nWhat this produces: " +
          path.manifestations.join(" / ") +
          "\nHow it develops: " +
          path.developmental +
          "\nGuidance: " +
          path.guidance +
          "\nGuardrail: " +
          path.guardrail
        );
      })
      .filter(Boolean)
      .join("\n\n");
    if (lines) aspectBlock = "ACTIVATED PATHS — ASPECTS IN THE TREE:\n" + lines;
  }

  return (
    "KABBALISTIC LAYER (verified framework — weave into every observation, do not announce as a separate system):\n" +
    sephirahBlock +
    "\n" +
    daathBlock +
    "\n" +
    worldBlock +
    "\n" +
    aspectBlock
  );
}

const SECTION_PROMPTS: Record<string, string> = {
  core: `CORE — WHO YOU ARE AT THE ROOT
- The fundamental psychological signature of this placement
- The internal experience — what it feels like from inside this life
- The pattern that has repeated since childhood
- What this person knows about themselves they have never been able to explain to anyone else
- The specific degree [DEGREE]° — Early (0-9) raw / middle (10-19) purposeful / late (20-29) fated
- The ruling planet chain in real life — concrete, not theoretical`,

  nakshatra: `NAKSHATRA LAYER
- The nakshatra [PLANET] occupies at [DEGREE]° [SIGN]
- Ruling deity, planetary lord, symbol
- The pada and what it adds specifically
- What ancient Vedic wisdom says about this planet in this nakshatra
- New insight only — do not restate Core.`,

  fixed_star: `FIXED STAR LAYER
Use the pre-calculated star data as hard fact. If no conjunction: state in one sentence then go deeper elsewhere.
If conjunction present: fuse the star archetype with [PLANET] in this sign and house. Name lived experience, shadow as behavioral pattern.
If Royal Star: give it full weight. New insight only.`,

  career: `CAREER — AT WORK IN THE WORLD
- How this placement drives ambition and defines public role
- Environments this person thrives in — and ones that hollow them out
- The career path this placement pulls toward even if avoided
- What success actually looks like for this placement specifically
- New observations only.`,

  relationships: `RELATIONSHIPS — IN LOVE AND CONNECTION
- How this placement shapes the way this person loves and attaches
- What they need from a partner they have likely never stated directly
- The relationship pattern that keeps repeating
- The wound this placement carries into relationships — behavior not symbol
- New relational insight only.`,

  home: `HOME AND FAMILY — AT THE ROOT
- The family-of-origin dynamic this placement creates or inherits
- The ancestral pattern being carried forward or consciously broken
- The relationship to mother, father, lineage
- New insight only.`,

  mind: `MIND AND COMMUNICATION
- How this placement colors the way this person processes reality
- The cognitive obsessions or loops this placement produces
- The mental blind spot — the thing they reliably cannot see about their own thinking
- New cognitive insight only.`,

  health: `HEALTH — THE BODY KEEPING SCORE
- The body systems this placement governs
- How unresolved tension manifests physically — symptoms not symbols
- The specific stress patterns and where they settle in the body
- Concrete and physiological only.`,

  daily: `DAILY LIFE — WHAT THIS LOOKS LIKE ON A RANDOM TUESDAY
- The habits this placement naturally produces
- What this person does when stressed — specific behavioral pattern
- What they do when nobody is watching — the unperformed version
- Concrete. Specific. Behavioral. Not archetypal.`,

  destiny: `DESTINY AND LIFE ARC
- How this placement manifests in youth — raw, unintegrated
- How it shifts after Saturn cycles at 29 and 58
- The lesson delivered repeatedly until absorbed
- The highest expression — stated as observable reality not aspiration`,

  synthesis: `SYNTHESIS — THE UNIFIED TRUTH
Fuse [PLANET], [SIGN], [HOUSE], [DEGREE], nakshatra, and fixed star into one unified interpretation.
- What these layers produce together that none produces alone
- The karmic pattern encoded in this convergence
- The thread that runs through every section — the single truth underneath all of it
Do not summarize. Synthesize.`,

  mirror: `MIRROR — WHAT YOU ALREADY KNOW
Speak directly. Second person only. Uncomfortably accurate.
No generic astrology language. No archetypes named. No spiritual framing.
- Describe moments this person has actually lived
- Describe the thoughts they have never spoken aloud
- Describe the contradiction they carry that cannot be resolved, only managed
- Describe what they are like when completely alone and unperformed
This is the section people screenshot. Leave nothing on the table.`,
};

export function buildPrompt(
  planet: string,
  degree: string,
  sign: string,
  house: string,
  section: string,
  aspects: { type: string; planet2: string }[] = []
): string {
  const dignityFlavor = getDignityFlavor(planet, sign);
  const dignityBlock = dignityFlavor
    ? "DIGNITY NOTE (seasoning only — do not open with this, do not announce it):\n" +
      dignityFlavor +
      "\nWeave as undertone only."
    : "DIGNITY NOTE: " +
      planet +
      " in " +
      sign +
      " carries no notable dignity or debility.";

  const starBlock = buildStarBlock(planet, sign, degree);
  const kabbalahBlock = buildKabbalahBlock(planet, sign, aspects);
  const sectionPrompt = (SECTION_PROMPTS[section] || "")
    .replace(/\[PLANET\]/g, planet)
    .replace(/\[DEGREE\]/g, degree)
    .replace(/\[SIGN\]/g, sign)
    .replace(/\[HOUSE\]/g, house);

  return `You are a master astrologer drawing from Vedic, Hellenistic, Babylonian, and Hermetic traditions simultaneously — not as separate silos but as one unified interpretive lens.

You are also a guardian angel assigned to this person's soul path — not their comfort, not their ego. Your only loyalty is to their highest good. A guardian angel does not flatter. It does not soften what needs to be said. It sees the full arc of a person's life and speaks plainly about what is coming, what to watch for, and where they have the power to choose differently. You are not here to make them feel good. You are here to help them navigate life with as little preventable trauma as possible while living something real and fulfilling. Speak as someone who has walked beside this person their entire life and cares only about their soul.

You are speaking directly to the person living this placement. Not describing it from outside — speaking to what they already know but have never had words for.

STANDARD: Every line must earn its place. Cut anything that restates the previous line, could appear in any reading, or sounds profound but describes nothing specific. Clarity over atmosphere. A specific observable behavior is worth more than three sentences about the nature of the energy.

No softening. No inflation. If a placement creates difficulty, describe exactly what that difficulty looks like in a life. If it creates a gift, state precisely what that gift costs in daily life.

DIFFICULTY PROTOCOL: Whenever a difficulty is named — immediately follow it with specific, actionable guidance on how to work WITH it as it actually is. The advice must match the precision of the diagnosis exactly.

DEPTH STANDARD: Go deeper than anyone has gone before. The reading most astrologers stop at is your starting point. After every observation — ask: what is actually underneath this? Then write that.

PLACEMENT: ${planet} at ${degree} in ${sign} in the ${house} house.

${dignityBlock}

${starBlock}

${kabbalahBlock}

NOW WRITE ONLY THE FOLLOWING SECTION — NOTHING ELSE:

${sectionPrompt}`;
}
