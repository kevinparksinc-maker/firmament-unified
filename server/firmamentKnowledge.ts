/**
 * FIRMAMENT KNOWLEDGE LAYER — shared, isomorphic
 *
 * This is the pure-logic knowledge ported out of client/src/components/FirmamentEngine.tsx
 * (dignities, fixed stars, Kabbalah/Sephiroth/Four Worlds/aspect-path data and their
 * block-builder functions). None of it touches React, the DOM, or trpc, so it's safe
 * to import from both the client and the server.
 *
 * FirmamentEngine.tsx still owns the UI and the full single-planet long-form
 * buildPrompt() used for natal deep-dive readings — that part is NOT duplicated here.
 * This file only contains the reusable knowledge blocks (dignity / fixed star /
 * Kabbalah) so other server-side flows (like horary) can pull in the same layers
 * without importing a client-only React component.
 *
 * IMPORTANT: if you edit dignities, fixed stars, or Kabbalah data/logic in
 * FirmamentEngine.tsx, mirror the change here too (or vice versa) until/unless
 * FirmamentEngine.tsx is refactored to import from this file directly.
 */

const DIGNITIES = {
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
  // Nodes — no universally agreed classical dignities; using one common Jyotish attribution, flagged as such
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
  // Outer planets — modern attributions, no classical authority
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

// Returns a terse flavoring note — not a verdict
function getDignityFlavor(planet, sign: any) {
  const d = DIGNITIES[planet];
  if (!d) return null;

  const authority = d.classical
    ? ""
    : " (modern attribution — no classical basis)";

  if (d.rulership.includes(sign))
    return `${planet} rules ${sign}${authority} — the energy moves without friction here, fully at home in its own container.`;
  if (d.exaltation.includes(sign))
    return `${planet} is exalted in ${sign}${authority} — operating at a pitch above its normal register. Can mean brilliance; can mean overreach.`;
  if (d.detriment.includes(sign))
    return `${planet} is in detriment in ${sign}${authority} — displaced from its natural environment. Not weakness. Friction that often produces unusual depth and self-awareness.`;
  if (d.fall.includes(sign))
    return `${planet} is in fall in ${sign}${authority} — working against its own grain. Produces the kind of awareness that only comes from something never being easy.`;
  return null; // no dignity — don't mention it at all
}

// ─── FIXED STARS ─────────────────────────────────────────────────────────────
// Ported directly from fixedStars.ts — sidereal degrees, tiered, Royal flagged
const FIXED_STARS = [
  // TIER 1 — ROYAL STARS
  {
    name: "Aldebaran",
    sidDegree: 45.0,
    nature: "Mars",
    magnitude: "1st",
    archetype: "The Warrior",
    isRoyal: true,
    gift: "Courage, honor, integrity, bold action, military leadership",
    shadow: "Cowardice, deceit, corruption of principles",
    warning:
      "Integrity must be maintained or the star destroys what it once lifted",
    meaning:
      "Watcher of the East. The Eye of the Bull. Those with planets here are warriors by nature — not necessarily of battle, but of principle. They fight for what they believe and cannot stand cowardice or deceit. Success comes through bold action, but the star demands standing for something greater than yourself. When activated, you are being tested: will you act with honor when no one is watching?",
  },
  {
    name: "Regulus",
    sidDegree: 135.0,
    nature: "Mars/Jupiter",
    magnitude: "1st",
    archetype: "The King",
    isRoyal: true,
    gift: "Leadership, kingship, success, fame, honor, command",
    shadow: "Betrayal, cowardice, abuse of power, revenge",
    warning:
      "Revenge destroys everything gained. The star watches and remembers.",
    meaning:
      "Watcher of the North. The Heart of the Lion. The most royal star. Those with planets here are marked for leadership whether they want it or not. The burden of command is real. Success comes through courage and nobility, but the star punishes betrayal and abuse of power. Rise or fall — there is no middle ground.",
  },
  {
    name: "Antares",
    sidDegree: 225.0,
    nature: "Mars/Jupiter",
    magnitude: "1st",
    archetype: "The Transformer",
    isRoyal: true,
    gift: "Depth, power, obsession, occult ability, transformation",
    shadow: "Recklessness, destruction, being consumed by darkness",
    warning:
      "Recklessness brings downfall. Something must die for transformation to occur.",
    meaning:
      "Watcher of the West. The Heart of the Scorpion. Those with planets here walk the edge between transformation and destruction. They are drawn to the occult, to death and rebirth, to things others fear to touch. The star grants depth and power at a cost — you must be willing to descend into darkness to find your light. When activated, something must die.",
  },
  {
    name: "Fomalhaut",
    sidDegree: 315.0,
    nature: "Venus/Mercury",
    magnitude: "1st",
    archetype: "The Visionary",
    isRoyal: true,
    gift: "Idealism, mysticism, dreams made real, art, vision",
    shadow: "Impure intentions, selfish magic, delusion",
    warning:
      "Only absolute purity of intention succeeds. The Mouth swallows the unworthy.",
    meaning:
      "Watcher of the South. The Mouth of the Southern Fish. Those with planets here are visionaries, artists, and mystics. They see what others cannot — patterns beneath reality, the dream behind the world. The star grants access to higher realms but tests your motives. Selfish magic fails. Only work done with pure intention succeeds.",
  },
  // TIER 1 — POWER STARS
  {
    name: "Sirius",
    sidDegree: 103.68,
    nature: "Jupiter/Mars",
    magnitude: "1st",
    archetype: "The Scorcher",
    isRoyal: false,
    gift: "Ambition, pride, fame, wealth, leadership, success",
    shadow: "Burning out, overextension, hubris, destruction",
    warning:
      "The brightest star burns hottest. Success comes fast but can end faster if overextended.",
    meaning:
      "The Dog Star. The brightest star in the sky. Sacred to the Egyptians — its heliacal rising marked the Nile flood. Those with planets here are driven to achieve greatness. They want to be seen, to matter, to leave a mark. But Sirius demands that you handle success wisely or be consumed by your own flame.",
  },
  {
    name: "Spica",
    sidDegree: 203.27,
    nature: "Venus/Mars",
    magnitude: "1st",
    archetype: "The Blessed",
    isRoyal: false,
    gift: "Art, music, science, spiritual grace, success, wealth, refinement",
    shadow: "Complacency, laziness, resting on talent, loss of inspiration",
    warning:
      "Gifts must be used or they wither. The blessed star expects contribution.",
    meaning:
      "The brightest star in Virgo. The most benefic fixed star. Those with planets here are blessed with talent, beauty, and grace. But blessing without action becomes stagnation. Spica rewards those who refine their gifts and share them with the world.",
  },
  {
    name: "Arcturus",
    sidDegree: 203.83,
    nature: "Jupiter/Mars",
    magnitude: "1st",
    archetype: "The Guardian",
    isRoyal: false,
    gift: "Pioneering, exploration, wealth, honor, inspiration",
    shadow: "Isolation, loneliness, alienation from community",
    warning: "The path you walk is yours alone. Success comes with solitude.",
    meaning:
      "The Guardian of the Bear. Those with planets here are pioneers — they go where others have not gone. Success comes through exploration, travel, and carving new paths. But the pioneer walks alone. Arcturus grants honor but asks if you are willing to pay the price of solitude.",
  },
  {
    name: "Algol",
    sidDegree: 55.1,
    nature: "Saturn/Jupiter",
    magnitude: "2nd",
    archetype: "The Demon",
    isRoyal: false,
    gift: "Intense creative power, destruction of old structures, forging strength through crisis",
    shadow: "Ruin, violence, obsession, being consumed by darkness",
    warning:
      "The Demon Star does not compromise. You will be forged or destroyed.",
    meaning:
      "The Demon Star. The blinking eye of Medusa. The most feared star in ancient tradition. Those with planets here face profound challenges that forge extraordinary strength — or utter ruin. Algol does not offer easy paths. It offers transformation through fire. If you survive, you are unbreakable.",
  },
  // TIER 2 — ORION CLUSTER
  {
    name: "Betelgeuse",
    sidDegree: 88.03,
    nature: "Mars/Mercury",
    magnitude: "1st",
    archetype: "The Champion",
    isRoyal: false,
    gift: "Riches, honors, fame, success, victory, championship",
    shadow: "Pride, calamity, fall from grace, overreach",
    warning:
      "Victory without humility invites destruction. The Champion must serve something beyond themselves.",
    meaning:
      "The right shoulder of Orion. The Champion's star. Those with planets here are marked for success — riches, honors, fame. But Betelgeuse is also a dying star, and it reminds you: all glory is temporary. The champion who forgets this becomes its own tragedy.",
  },
  {
    name: "Rigel",
    sidDegree: 76.76,
    nature: "Jupiter/Mars",
    magnitude: "1st",
    archetype: "The Builder",
    isRoyal: false,
    gift: "Education, technical mastery, engineering, lasting structures, wealth",
    shadow: "Rigidity, lack of vision, building without purpose",
    warning:
      "Building for its own sake is vanity. What are you constructing and why?",
    meaning:
      "The left foot of Orion. The Builder's star. Those with planets here are architects, engineers, and master craftsmen. They build things that last. But Rigel asks: what are you building and why? A tower without purpose is just a monument to ego.",
  },
  {
    name: "Bellatrix",
    sidDegree: 79.0,
    nature: "Mars/Mercury",
    magnitude: "1st",
    archetype: "The Warrior",
    isRoyal: false,
    gift: "Decisiveness, daring, quick action, military success",
    shadow: "Rashness, disaster after victory, inability to consolidate gains",
    warning:
      "Winning the battle is not winning the war. Victory exposes weakness if unprepared.",
    meaning:
      "The Amazon Star. Those with planets here are decisive and daring. They act when others hesitate. But Bellatrix teaches that victory is not the end — it is the beginning of new challenges. Winning the battle without preparing for the aftermath leads to ruin.",
  },
  // TIER 3 — TWIN STARS
  {
    name: "Castor",
    sidDegree: 99.17,
    nature: "Mercury/Saturn",
    magnitude: "2nd",
    archetype: "The Mortal Twin",
    isRoyal: false,
    gift: "Intelligence, writing, communication, sudden fame, skill",
    shadow: "Violence, mischief, sudden ruin, ephemeral success",
    warning:
      "Fame that comes fast can leave fast. Brilliance without humility is dangerous.",
    meaning:
      "The mortal twin who chose mortality for love. Those with planets here have sharp minds and quick tongues. They rise fast in writing, communication, and intellectual fields. But Castor reminds you that what comes up must come down.",
  },
  {
    name: "Pollux",
    sidDegree: 102.73,
    nature: "Mars/Uranus",
    magnitude: "2nd",
    archetype: "The Immortal Twin",
    isRoyal: false,
    gift: "Athleticism, audacity, boldness, protection, endurance",
    shadow: "Disgrace, calamity, ruin, learning through hardship",
    warning:
      "Strength without wisdom becomes destruction. Lessons come through pain.",
    meaning:
      "The immortal twin who shared his immortality with his brother. Those with planets here are bold, audacious, and physically gifted. They fight, compete, and endure. But Pollux teaches that strength without wisdom becomes destruction. The hardest lessons come through the body.",
  },
  // TIER 4 — VISIONARY STARS
  {
    name: "Vega",
    sidDegree: 284.73,
    nature: "Venus/Mercury",
    magnitude: "1st",
    archetype: "The Enchanter",
    isRoyal: false,
    gift: "Magic, charisma, art, music, enchantment, politics",
    shadow: "Fleeting fame, practicality lacking, manipulation",
    warning:
      "Magic without substance is just illusion. Your enchantment must serve truth.",
    meaning:
      "The Falling Eagle. Those with planets here have charisma that moves crowds, art that changes hearts, and magic that alters reality. But Vega asks: what is your enchantment for? Fleeting fame is empty. True magic serves something greater.",
  },
  {
    name: "Altair",
    sidDegree: 301.0,
    nature: "Mars/Jupiter",
    magnitude: "1st",
    archetype: "The Risk-Taker",
    isRoyal: false,
    gift: "Boldness, sudden wealth, high command, adventurous spirit",
    shadow: "Danger, ephemeral success, recklessness, loss",
    warning:
      "Fortune favors the bold — but boldness without wisdom is gambling, not strategy.",
    meaning:
      "The Flying Eagle. Those with planets here are bold, confident, and stubborn. They take risks that others won't. Sometimes they win everything. Sometimes they lose everything. Altair rewards the adventurous but reminds you that every risk has a cost.",
  },
  {
    name: "Alphecca",
    sidDegree: 221.0,
    nature: "Venus/Mercury",
    magnitude: "2nd",
    archetype: "The Healer",
    isRoyal: false,
    gift: "Art, poetry, occult ability, healing, trade, commerce",
    shadow: "Loneliness, isolation, tendency to withdraw",
    warning: "Healing others does not heal yourself. Who heals the healer?",
    meaning:
      "The Healer's star. Those with planets here have gifts for art, healing, and occult matters. They succeed in trade and commerce but often walk alone. Alphecca asks: you heal everyone else — who heals you? The healer must also receive healing or burn out.",
  },
  {
    name: "Achernar",
    sidDegree: 344.93,
    nature: "Jupiter",
    magnitude: "1st",
    archetype: "The Seeker",
    isRoyal: false,
    gift: "Philosophy, religion, spirituality, honors, public office",
    shadow: "Spiritual bypass, avoiding earthly responsibilities",
    warning:
      "The divine is not an escape from the world. Spirituality must serve life, not avoid it.",
    meaning:
      "The end of the River Eridanus. Those with planets here are drawn to philosophy, religion, and spiritual matters. They seek the divine, the ultimate, the meaning behind meaning. But Achernar warns: transcendence is not escape. The seeker must return to the world.",
  },
];

// Sign order → base absolute degree (sidereal)
const SIGN_BASE = {
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

// Convert sign + degree to absolute sidereal degree
function toAbsolute(sign, degree: any) {
  return (SIGN_BASE[sign] ?? 0) + parseFloat(degree || 0);
}

// Detect conjunction — Royal orb 2°, all others 1.5°
function detectConjunction(sign, degree: any) {
  const abs = toAbsolute(sign, degree);
  let closest = null;
  let closestOrb = Infinity;

  for (const star of FIXED_STARS) {
    const maxOrb = 3.0;
    let diff = Math.abs(abs - star.sidDegree);
    if (diff > 180) diff = 360 - diff;
    if (diff <= maxOrb && diff < closestOrb) {
      closest = { star, orb: Math.round(diff * 100) / 100, exact: diff <= 0.5 };
      closestOrb = diff;
    }
  }
  return closest;
}

// Build the fixed star fact block for the prompt
function buildStarBlock(planet, sign, degree: any) {
  const hit = detectConjunction(sign, degree);
  if (!hit) {
    return `FIXED STAR: No fixed star falls within conjunction orb of ${planet} at ${degree}° ${sign}. Do not speculate about fixed stars. State this plainly in one sentence and move to other depth in this section.`;
  }
  const { star, orb, exact } = hit;
  const royalFlag = star.isRoyal ? " [ROYAL STAR — DESTINY MARKER]" : "";
  const exactFlag = exact ? " — EXACT conjunction" : ` — orb ${orb}°`;
  return `FIXED STAR CONJUNCTION (verified — hard fact, do not contradict):
${planet} conjunct ${star.name}${royalFlag}${exactFlag}
Archetype: ${star.archetype}
Nature: ${star.nature}
Gift: ${star.gift}
Shadow: ${star.shadow}
Warning: ${star.warning}
Meaning: ${star.meaning}
${star.isRoyal ? `\nThis is one of the four Royal Watcher Stars. Treat this conjunction as a destiny marker of the highest order. The weight of this placement is exceptional — speak to it with full depth and consequence.` : ""}`;
}

// ─── KABBALAH LAYER ──────────────────────────────────────────────────────────

// Sephiroth — the ten emanations of the Tree of Life
// Each mapped to a planet, a pillar, a world level, and its earthly expression
const SEPHIROTH = {
  Kether: {
    planet: "Pluto",
    pillar: "middle",
    number: 1,
    title: "The Crown",
    world: "Atziluth",
    earthly:
      "The part of a person that existed before this life and will exist after it. The drive that cannot be explained by biography, environment, or choice. The thing they were before they became who they are.",
  },
  Chokmah: {
    planet: "Uranus",
    pillar: "right",
    number: 2,
    title: "Wisdom",
    world: "Atziluth",
    earthly:
      "Raw undirected force before it has shape. The flash of knowing before the mind has processed it. The moment of genius before the ego claims it. In a person: the energy that arrives before the intention.",
  },
  Binah: {
    planet: "Saturn",
    pillar: "left",
    number: 3,
    title: "Understanding",
    world: "Atziluth",
    earthly:
      "The force that gives form to raw potential. Limitation as a creative act. Structure not as prison but as the condition that makes anything real. In a person: the ability to commit, to close doors, to make the abstract concrete.",
  },
  Chesed: {
    planet: "Jupiter",
    pillar: "right",
    number: 4,
    title: "Mercy",
    world: "Briah",
    earthly:
      "Expansion, generosity, abundance — the force that wants to give and grow and include. In a person: where they are naturally open, where they extend trust, where they build. Also where they overextend, overcommit, and lose boundaries.",
  },
  Geburah: {
    planet: "Mars",
    pillar: "left",
    number: 5,
    title: "Severity",
    world: "Briah",
    earthly:
      "The force that cuts, judges, and removes what doesn't belong. Will in its most concentrated form. In a person: where they fight, where they refuse, where they draw lines. Also where they destroy what they should have kept.",
  },
  Tiphareth: {
    planet: "Sun",
    pillar: "middle",
    number: 6,
    title: "Beauty",
    world: "Briah",
    earthly:
      "The heart of the Tree — the place where all forces balance. The true self beneath the persona. In a person: the core identity when all performance is stripped away. What they are when nobody is watching and they are not trying to be anything.",
  },
  Netzach: {
    planet: "Venus",
    pillar: "right",
    number: 7,
    title: "Victory",
    world: "Yetzirah",
    earthly:
      "Desire, feeling, nature, beauty — the force that wants, that connects, that moves toward pleasure and away from pain. In a person: what they love, what they crave, what they are pulled toward before reason intervenes. Also where they are most irrational.",
  },
  Hod: {
    planet: "Mercury",
    pillar: "left",
    number: 8,
    title: "Splendor",
    world: "Yetzirah",
    earthly:
      "Intellect, language, pattern, communication — the force that names and organizes experience. In a person: how they think, how they talk, how they make sense of things. Also where they over-analyze, over-explain, and substitute words for experience.",
  },
  Yesod: {
    planet: "Moon",
    pillar: "middle",
    number: 9,
    title: "Foundation",
    world: "Yetzirah",
    earthly:
      "The unconscious architecture beneath conscious life. The emotional body, the dream life, the instinctive reactions that fire before thought. In a person: what they feel before they know what they feel. The foundation everything else is built on — and what cracks when the foundation does.",
  },
  Malkuth: {
    planet: "Earth",
    pillar: "middle",
    number: 10,
    title: "The Kingdom",
    world: "Assiah",
    earthly:
      "Physical reality — the body, the material world, the place where everything above finally lands and becomes tangible. In a person: how their inner life actually shows up in the physical world. What their life looks like on the outside. The gap between that and the inner life is the measure of integration.",
  },
  Daath: {
    planet: "Nodes",
    pillar: "middle",
    number: 0,
    title: "The Abyss",
    world: "Briah",
    earthly:
      "The hidden sephirah — the place of knowledge that cannot be possessed, only crossed. The gap between the upper and lower Tree. In a person with prominent nodes: they live at this threshold. They carry knowledge from before this life that cannot be fully translated into it. They have access to depths that feel both like a gift and a kind of exile.",
  },
};

// Four Worlds — the vertical axis the entire Tree runs through
const FOUR_WORLDS = {
  Atziluth: {
    element: "Fire",
    signs: ["Aries", "Leo", "Sagittarius"],
    level:
      "Divine archetype — the idea before it has form. Operating here means the placement functions at the level of pure will, pure archetype, pure originating force. The person experiences this energy as something that arrived with them — not learned, not developed, just there.",
  },
  Briah: {
    element: "Water",
    signs: ["Cancer", "Scorpio", "Pisces"],
    level:
      "Soul blueprint — where archetypes become patterns. Operating here means the placement functions at the level of deep feeling, soul memory, and pre-conscious knowing. The person experiences this energy from one level up — as if watching their own life with a slight distance they cannot explain.",
  },
  Yetzirah: {
    element: "Air",
    signs: ["Gemini", "Libra", "Aquarius"],
    level:
      "Psychological formation — where patterns become thoughts, language, and relationship. Operating here means the placement functions primarily through the mind, communication, and how the person relates. The energy is most alive in exchange, in ideas, in the space between people.",
  },
  Assiah: {
    element: "Earth",
    signs: ["Taurus", "Virgo", "Capricorn"],
    level:
      "Physical manifestation — where everything above finally becomes matter, event, and body. Operating here means the placement expresses most powerfully through what is built, accumulated, or made real in the physical world. The energy is not fully alive until it is tangible.",
  },
};

// Aspect path mechanics — behavioral physics not symbolic adjectives
const ASPECT_PATHS = {
  conjunction: {
    symbol: "☌",
    geometry:
      "Same sephirah — two drives in the same psychic territory without inherent distance",
    manifestations: [
      "Fusion: the two energies blend seamlessly — indistinguishable from each other in daily behavior",
      "Compression: the energies amplify each other into density — powerful but prone to overload",
      "Entanglement: triggering one automatically triggers the other — cannot activate one without the other firing",
    ],
    developmental:
      "At 20: experienced as a single overwhelming drive with no internal separation. At 40: the person begins to distinguish the two energies and gains some choice about how they relate. At 60: either full integration or chronic overload — rarely in between.",
    guardrail:
      "Do not assume unity. Diagnose which of the three patterns is present — fusion, compression, or entanglement. Each produces a completely different life.",
    guidance:
      "The work is developing internal space between the two energies. Not separation — discernment. Learning to feel where one ends and the other begins. When they fuse productively, amplify consciously. When they jam, create physical or temporal distance between the two drives before acting.",
  },
  opposition: {
    symbol: "☍",
    geometry:
      "Maximum polarity — two sephiroth at maximum distance across the Tree structure",
    manifestations: [
      "Projection: one pole is lived directly, the other is unconsciously assigned to other people — partners, enemies, institutions carry what the person cannot own",
      "Context splitting: one pole dominates at work, the other at home — the person rarely experiences both in the same moment",
      "Delayed integration: life repeatedly creates situations where both poles are demanded simultaneously until the person learns to hold both",
    ],
    developmental:
      "At 20: one pole is lived, the other is either projected or suppressed entirely. At 35–40 (often triggered by relationship crisis or loss): the projected pole becomes undeniable. At 50+: integration becomes possible — holding both without collapsing into one.",
    guardrail:
      "If someone feels both poles equally and easily, it has already been worked. Raw oppositions are not comfortable — they are lived as external conflict before they become internal tension.",
    guidance:
      "The work is reclaiming the projected pole without abandoning the primary one. Not balance — ownership. When you notice the same quality appearing in people who frustrate or fascinate you, that is the projection showing you what belongs to you. Take it back. It will not feel natural at first.",
  },
  trine: {
    symbol: "△",
    geometry:
      "Flow within the same world — no structural resistance between the sephiroth",
    manifestations: [
      "Non-conscious competence: the person does it without knowing they are doing it — or doing it well",
      "Under-ownership: 'that's nothing, everyone can do that' — the talent is invisible because it costs nothing",
      "Identity gap: the skill is real and observable to everyone except the person who has it",
    ],
    developmental:
      "At 20: completely unmarked — the person has no relationship to this talent because it has never required effort. At 35: others begin pointing it out, often to the person's genuine surprise. At 50: either consciously developed into mastery or still invisible and therefore wasted.",
    guardrail:
      "Trine does not mean good. It means unmarked by friction — which is sometimes a worse fate than difficulty. The thing you never had to fight for is the thing you never fully claimed.",
    guidance:
      "The work is making the unconscious competence conscious. Name it. Develop it deliberately even though it doesn't require effort. The gift that costs you nothing still requires your attention — or it remains a potential that never becomes a power.",
  },
  square: {
    symbol: "□",
    geometry:
      "Two sephiroth that cannot be simultaneously satisfied — structural tension, not accidental conflict",
    manifestations: [
      "Escalating feedback loop: the same situation recurs with increasing intensity until behavior actually changes",
      "Behavioral demand: resolution comes through doing something differently, not understanding something differently — you cannot think your way out",
      "Evolutionary pressure: the square at 25 and the square at 45 have the same shape but completely different demands — it evolves as the person evolves",
    ],
    developmental:
      "At 20: experienced as an external problem — 'why does this keep happening to me.' At 35: the pattern is recognized as internal — 'why do I keep doing this.' At 50: either the behavioral adaptation has been made and the square becomes an engine, or it has calcified into a fixed wound.",
    guardrail:
      "If a square never changes form across decades, that is not the square anymore — that is trauma or deliberate avoidance. Squares move. If it isn't moving, something else is holding it in place.",
    guidance:
      "The work is behavioral, not conceptual. Identify the specific action that keeps producing the same result. Change that action — not the thinking around it, the action itself. The square will immediately present a new version of the same demand. That is not failure — that is the square working correctly. Keep adapting.",
  },
  sextile: {
    symbol: "⚹",
    geometry:
      "Adjacent but different worlds — opportunity exists in the geometry but requires activation",
    manifestations: [
      "Threshold without momentum: the door is open but nothing pushes you through it",
      "Synchronistic activation: often opens through external invitation — someone offers the opportunity, a timing aligns, a door appears",
      "Conditional access: available without being automatic — the person can ignore it indefinitely and it will not force itself",
    ],
    developmental:
      "At 20: the sextile is barely visible — it looks like luck or coincidence when it activates. At 35: the person begins to recognize the pattern and can start positioning for it. At 50: consciously worked sextiles become reliable resources — doors the person knows how to open.",
    guardrail:
      "Sextile is not a weak trine. It is a different class — conditional access versus latent flow. The trine flows whether you engage or not. The sextile waits. They require completely different relationships.",
    guidance:
      "The work is positioning and timing. You cannot force a sextile but you can be ready when it opens. Build the skills and relationships in the relevant area so that when the door appears you can walk through it immediately. Hesitation closes it.",
  },
};

// Get sephirah for a planet
function getSephirah(planet: any) {
  if (planet === "Rahu" || planet === "Ketu") return SEPHIROTH.Daath;
  for (const [name, data] of Object.entries(SEPHIROTH)) {
    if (data.planet === planet) return { name, ...data };
  }
  return null;
}

// Get world for a sign
function getWorld(sign: any) {
  for (const [worldName, data] of Object.entries(FOUR_WORLDS)) {
    if (data.signs.includes(sign)) return { name: worldName, ...data };
  }
  return null;
}

// Build the full Kabbalah context block
function buildKabbalahBlock(planet, sign, aspects = []) {
  const sephirah = getSephirah(planet);
  const world = getWorld(sign);
  const isNode = planet === "Rahu" || planet === "Ketu";

  // Sephirah block
  const sephirahBlock = sephirah
    ? `SEPHIRAH: ${sephirah.name || "Da'ath"} — ${sephirah.title}
Pillar: ${sephirah.pillar || "hidden"} | Number: ${sephirah.number || "∞"} | Planet: ${sephirah.planet}
Earthly expression: ${sephirah.earthly}`
    : "";

  // Da'ath special treatment for nodes
  const daathBlock = isNode
    ? `
DA'ATH — THE ABYSS (${planet}):
${planet} is not a planet — it is an axis. A wound in the geometry of the chart where ordinary sephirothic logic does not apply.
Da'ath is the hidden sephirah — the knowledge that cannot be possessed, only crossed. It sits between the upper divine triangle and the lower personal tree. It is the gap.
People with ${planet} prominent carry knowledge from before this life that cannot be fully translated into it. They have access to frequencies that others do not — and they pay for that access in a specific way: they often feel they do not fully belong here, do not fully understand why they know what they know, and cannot always explain their own depth to people who haven't crossed the same threshold.
The gift: access to pre-personal wisdom. The cost: a quality of exile that never fully resolves. The guidance: stop trying to translate the untranslatable. Use what you know. You do not need to explain the source.`
    : "";

  // Four Worlds block
  const worldBlock = world
    ? `FOUR WORLDS — OPERATING LEVEL:
${planet} in ${sign} places this energy in ${world.name} (${world.element}).
${world.level}`
    : "";

  // Aspect paths block
  let aspectBlock = "";
  if (aspects && aspects.length > 0) {
    const aspectLines = aspects
      .map(a => {
        const path = ASPECT_PATHS[a.type?.toLowerCase()];
        if (!path) return null;
        return `${path.symbol} ${planet} ${a.type} ${a.planet2}:
Path geometry: ${path.geometry}
What this produces: ${path.manifestations.join(" / ")}
How it develops across a lifetime: ${path.developmental}
Guidance: ${path.guidance}
Guardrail: ${path.guardrail}`;
      })
      .filter(Boolean)
      .join("\n\n");
    if (aspectLines) {
      aspectBlock = `ACTIVATED PATHS — ASPECTS IN THE TREE:\n${aspectLines}`;
    }
  }

  return `KABBALISTIC LAYER (verified framework — weave into every observation, do not announce as a separate system):
This is the operating system underneath the chart. Use it to go deeper than the placement alone can reach.
Do not explain Kabbalah to the reader. Do not use it as a label. Let it inform the depth of what you say about real life.

${sephirahBlock}
${daathBlock}
${worldBlock}
${aspectBlock}

OPERATING INSTRUCTIONS FOR THIS LAYER:
- The sephirah tells you WHAT this planet fundamentally is in the cosmic architecture — use it to describe the deepest nature of this energy in a person's life
- The world tells you AT WHAT LEVEL this energy operates — Atziluth means it functions as pure archetype, Assiah means it must be physically built to be real, Yetzirah means it lives in the mind and relationship, Briah means it operates from soul depth
- The path mechanics tell you HOW the aspects actually function in behavioral terms — use the manifestation types, developmental phases, and guidance to speak to what this person actually experiences and what they can actually do
- Every difficulty named through this layer must be followed by its specific guidance — the precise behavioral or awareness shift that works with this energy rather than against it
- Go deeper than the surface Kabbalistic meaning. What does Tiphareth in Briah actually feel like from inside a human life? Describe that. Not the symbol — the experience.`;
}

export {
  DIGNITIES,
  getDignityFlavor,
  FIXED_STARS,
  buildStarBlock,
  SEPHIROTH,
  FOUR_WORLDS,
  ASPECT_PATHS,
  getSephirah,
  getWorld,
  buildKabbalahBlock,
};
