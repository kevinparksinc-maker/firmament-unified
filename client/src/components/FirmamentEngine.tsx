import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";

// ─── PALETTE ────────────────────────────────────────────────────────────────
const C = {
  void: "#03020A",
  deep: "#07091A",
  dusk: "#130E24",
  gold: "#C4A24A",
  goldDim: "#6B5828",
  goldFog: "rgba(196,162,74,0.12)",
  ember: "#D4713A",
  silver: "#A8B8CC",
  ash: "#6A7A8C",
  white: "#EDE9E2",
  dim: "rgba(237,233,226,0.62)",
  red: "#C94040",
  line: "rgba(196,162,74,0.1)",
};

// ─── TABS ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "core", label: "Core" },
  { id: "nakshatra", label: "Nakshatra" },
  { id: "fixed_star", label: "Fixed Stars" },
  { id: "career", label: "Career" },
  { id: "relationships", label: "Relationships" },
  { id: "home", label: "Home & Family" },
  { id: "mind", label: "Mind" },
  { id: "health", label: "Health" },
  { id: "daily", label: "Daily Life" },
  { id: "destiny", label: "Destiny Arc" },
  { id: "synthesis", label: "Synthesis" },
  { id: "mirror", label: "Mirror" },
];

// ─── STATIC DATA ─────────────────────────────────────────────────────────────
const PLANETS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Rahu",
  "Ketu",
  "Uranus",
  "Neptune",
  "Pluto",
];
const SIGNS = [
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
const HOUSES = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
];

// ─── DIGNITY TABLE ───────────────────────────────────────────────────────────
// Classical planets: traditional authority. Outer planets: modern attribution only — labeled accordingly.
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

// ─── SECTION PROMPTS ─────────────────────────────────────────────────────────
const SECTION_PROMPTS = {
  core: `CORE — WHO YOU ARE AT THE ROOT

Read house position first. Then degree. Then sign as the environment those forces operate within.

- The fundamental psychological signature of this placement
- The internal experience — what it feels like from inside this life
- The pattern that has repeated since childhood
- What this person knows about themselves they have never been able to explain to anyone else
- How this placement colors everything — the lens they see the world through without knowing it
- The specific degree [DEGREE]° and what it sharpens or intensifies:
  Early (0–9°) raw and instinctive / middle (10–19°) developed and purposeful / late (20–29°) distilled and fated
  Any critical or anaretic influence at 0° or 29° — name it directly
- The ruling planet chain and how it plays out in real life — concrete, not theoretical

If a dignity note was provided: weave it as undertone only — do not open with it, do not announce it, do not let it frame the reading. It is seasoning that informs the texture of how this energy flows, not a quality verdict. Every gift has a cost. Every difficulty has a byproduct worth naming. State both plainly.`,

  nakshatra: `NAKSHATRA LAYER

- The nakshatra [PLANET] occupies at [DEGREE]° [SIGN]
- Ruling deity, planetary lord, symbol of that nakshatra
- The pada and what it adds to the expression — specifically
- What ancient Vedic wisdom says about souls born with this planet in this nakshatra — not generic nakshatra description, but what it means for this planet here
- How the nakshatra energy modifies and deepens the placement beyond what sign and house reveal alone
- The layer of meaning that would be completely invisible without this lens

New insight only — do not restate what Core already covered.`,

  fixed_star: `FIXED STAR LAYER

The fixed star data has been pre-calculated and verified. Use it as hard fact — do not speculate, do not introduce stars not listed in the data block above.

If no conjunction was found: state this in one sentence. Then go deeper into degree, nakshatra, and layers not yet covered elsewhere. Do not pad.

If a conjunction is present:
- Fuse the star's archetype, gift, shadow, warning, and meaning with [PLANET] — not the star in isolation, but what happens when that stellar quality merges with this planet's specific nature in this sign and house
- Name what this conjunction produces in actual lived experience — the specific way this stellar energy expresses through this placement
- Name what the shadow and warning look like as concrete behavioral patterns in a real life — not as caution, but as description of what actually happens
- If this is a Royal Star: give it the full weight it deserves. This is exceptional. Do not understate it. Speak to the destiny dimension directly.

New insight only — do not restate anything from Core or Nakshatra.`,

  career: `CAREER — AT WORK IN THE WORLD

- How this placement drives ambition, shapes work style, and defines public role
- The environments this person thrives in — and the ones that slowly hollow them out
- The career path this placement is pulling toward even if they have been actively avoiding it
- How colleagues and authority figures actually experience this person — what they project, what gets misread
- What success actually looks like for this placement — it may not look conventional, name what it specifically looks like
- The professional struggle this placement creates — name it precisely, not symbolically
- What this person is actually building toward whether they have named it or not

No restatement of Core. Career manifestations only — new observations throughout.`,

  relationships: `RELATIONSHIPS — IN LOVE AND CONNECTION

- How this placement shapes the way this person loves, connects, and attaches
- What they need from a partner that they have likely never stated directly — name it
- The relationship pattern that keeps repeating — describe the dynamic, not just the emotion
- How this person comes across to others in intimacy versus how they experience themselves
- The thing partners consistently misunderstand about them and why
- What a truly compatible connection structurally requires for this placement to function
- The wound this placement carries into relationships — how it shows up in behavior, not symbol

New relational insight only — nothing restated from previous sections.`,

  home: `HOME AND FAMILY — AT THE ROOT

- The family-of-origin dynamic this placement creates or inherits
- What home means — and doesn't mean — to this person at the core level
- The ancestral or generational pattern being carried forward or consciously broken
- How this person creates, avoids, or recreates domestic stability
- What their living environments typically look and feel like — and why they end up that way
- The relationship to mother, father, lineage — what was transmitted, what was withheld, what is still being processed

New insight only — root and origin patterns not previously discussed.`,

  mind: `MIND AND COMMUNICATION — HOW THIS PLACEMENT THINKS

- How this placement colors the way this person processes reality — the filter before the thought
- The cognitive obsessions or loops this placement produces — what the mind keeps returning to
- How they communicate — what lands naturally, what consistently fails to translate to other people
- The mental blind spot this placement creates — the thing they reliably cannot see about their own thinking
- How other people experience their communication style — what gets projected, what gets missed
- What this person's mind is always working on underneath everything else

New cognitive and communicative insight only.`,

  health: `HEALTH — THE BODY KEEPING SCORE

- The body systems and areas this placement governs
- How unresolved tension from this placement manifests physically — name the symptoms, not the symbol
- The specific stress patterns this placement creates and where they settle in the body
- What this person's body has been attempting to communicate about this placement
- The physical vulnerabilities and patterns this energy produces over time

Concrete and physiological. Not abstract. Not symbolic. The body.`,

  daily: `DAILY LIFE EXPRESSION — WHAT THIS LOOKS LIKE ON A RANDOM TUESDAY

- The habits this placement naturally produces — including ones this person didn't consciously choose
- The behaviors that people close to this person would name immediately if asked
- What this person does when stressed — the specific behavioral pattern, not the archetype
- What they do when confident — how the energy shifts in observable ways
- What they do when nobody is watching — the unperformed version of this placement
- The small daily signatures of this energy that add up, over years, to an entire life

Concrete. Specific. Grounded in the ordinary. Not archetypal — behavioral.`,

  destiny: `DESTINY AND LIFE ARC — ACROSS A LIFETIME

- How this placement manifests in youth — raw, unintegrated, often before the person has language for it
- How it shifts during maturity as the pattern becomes visible and choice enters the picture
- How it evolves after major Saturn cycles — 29 and 58 years — what solidifies, what releases
- The lesson this placement delivers repeatedly until it is absorbed — describe what that loop actually looks like
- The moment this person will look back and understand what this placement was always preparing them for
- The highest expression possible — what this looks like fully lived, stated as observable reality not aspiration`,

  synthesis: `SYNTHESIS — THE UNIFIED TRUTH

Fuse [PLANET], [SIGN], [HOUSE], [DEGREE]°, nakshatra, and fixed star into one unified interpretation.

- How these layers interact and amplify each other — what they produce together that none produces alone
- The dominant theme that emerges from all layers combined
- The karmic pattern encoded in this specific convergence of factors
- The spiritual gift — and what it costs to carry it
- The worldly gift — and what it costs in daily life
- The repeating challenge — named plainly, without consolation or reframe
- The thread that runs through every section above — the single truth underneath all of it

Do not summarize. Synthesize. This is not a recap — it is what it means that all of it is simultaneously true.`,

  mirror: `MIRROR — WHAT YOU ALREADY KNOW

Speak directly. Second person only. This section should feel uncomfortably accurate.

No generic astrology language. No archetypes named. No spiritual framing.

- Describe moments this person has actually lived — specific situations, not categories
- Describe the thoughts they have never spoken aloud
- Describe the contradiction they carry inside them — the one that cannot be resolved, only managed
- Describe the thing they secretly know about themselves they have never been able to fully explain to anyone
- Describe the feeling they have spent years trying to put into words
- Describe what people in their life have never quite understood about them — and why that gap exists
- Describe what they are like when they are completely alone and unperformed

This is the section people screenshot. This is the section that makes the reading worth every penny.
The standard: if they read this and feel nothing, it failed. Leave nothing on the table.`,
};

// ─── PROMPT BUILDER ───────────────────────────────────────────────────────────
function buildPrompt(planet, degree, sign, house, section, aspects = []) {
  const dignityFlavor = getDignityFlavor(planet, sign);

  const dignityBlock = dignityFlavor
    ? `DIGNITY NOTE (seasoning only — do not open with this, do not announce it, do not let it dominate):
${dignityFlavor}
Weave this as undertone. It informs texture — not quality judgment, not the frame of the reading.`
    : `DIGNITY NOTE: ${planet} in ${sign} carries no notable dignity or debility. Read purely through house, degree, and nakshatra.`;

  const starBlock = buildStarBlock(planet, sign, degree);
  const kabbalahBlock = buildKabbalahBlock(planet, sign, aspects);

  return `You are a master astrologer drawing from Vedic, Hellenistic, Babylonian, and Hermetic traditions simultaneously — not as separate silos but as one unified interpretive lens. The Kabbalistic layer provided below is the operating system underneath all of it — the coordinate grid that everything else is mapped onto.

You are speaking directly to the person living this placement. Not describing it from outside — speaking to what they already know but have never had words for.

STANDARD:
Write like a creator editing their own best work. Every line must earn its place.

If a line restates what the previous line already established — cut it.
If it could appear in any reading for any placement — cut it.
If it sounds profound but describes nothing specific — cut it.

The test is not "is this accurate" but "is this the most precise, irreplaceable version of this true thing."

Clarity over atmosphere. Detail over depth-signaling.
A specific observable behavior is worth more than three sentences about the nature of the energy.
Build. Don't decorate.

No softening. No inflation. No silver linings forced onto things that do not have them.
If a placement creates difficulty, describe exactly what that difficulty looks like in a life — the behavior, the situation, the moment.
If it creates a gift, state precisely what that gift costs in daily life.
Every placement has both. Name both without weighting either.

Do not use spiritual jargon as a substitute for precision. Every symbolic statement must land as a concrete, observable life experience.

Not: "you possess Scorpionic transformative power"
But: "people have handed you information within the first hour of meeting you that they have never told anyone — and you have spent years not knowing what to do with how much you know about people"

Do not repeat information already stated in previous sections. Each section must introduce new observations, deeper layers, real-world manifestations not previously discussed.

Be exhaustive. Be precise. Be felt. Point after point after point until nothing is left unsaid.

DEPTH STANDARD — this is non-negotiable:
Go deeper than anyone has gone before in this analysis. Not deeper in volume — deeper in precision.
Every point you make: go one level below it. Then one level below that.
The reading most astrologers stop at is your starting point. What they call the interpretation is your introduction.
This person has read every astrology description of this placement that exists. They know the surface. They know the middle layer.
What they have never read is what you are here to write.
After every observation — ask yourself: what is actually underneath this? Then write that.

LOYALTY PRINCIPLE — the soul underneath this entire reading:
This reading is an act of loyalty to the person receiving it.
You are always for them. Always for their highest good. That never changes.
Every word written here is in service of the best possible life for this person.
Every observation, every gift named, every difficulty named — all of it comes from being completely in their corner.
Not cheering. Not consoling. In their corner.
That loyalty is present in every line of every section. It does not waver.

DIFFICULTY PROTOCOL — every single time, no exceptions:
Whenever a difficulty, challenge, wound, shadow, cost, or tension is named — immediately follow it with specific, actionable guidance on how to work with it. Not around it. Not to fix it. Not to reframe it. To work WITH it as it actually is.

This is not consolation. This is navigation. A counter to every difficulty life throws from this placement.
The difficulty is still real — name it fully and completely first. Then: what does this person actually do with this in their life?

The advice must match the precision of the diagnosis. Exactly.
If the pattern is specific, the counter must be specific.
If the diagnosis is "you process emotions weeks after the fact and cry in the car about things that happened a month ago" — the counter is not "journal your feelings." It is the specific move that works for that exact pattern and no other.

Generic advice after a precise observation is a failure. Every counter must be:
- Specific to this placement, this sign, this house, this degree
- Actionable — something that can be done, practiced, or shifted in actual daily life
- Honest — not a promise that it fixes everything, but a real tool for working with this energy
- As deep as the diagnosis — if you went three levels deep on the difficulty, go three levels deep on the counter

PLACEMENT:
${planet} at ${degree}° ${sign} in the ${house} house.

${dignityBlock}

${starBlock}

${kabbalahBlock}

NOW WRITE ONLY THE FOLLOWING SECTION — NOTHING ELSE:

${SECTION_PROMPTS[section]
  .replace(/\[PLANET\]/g, planet)
  .replace(/\[DEGREE\]/g, degree)
  .replace(/\[SIGN\]/g, sign)
  .replace(/\[HOUSE\]/g, house)}`;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function FirmamentEngine({
  natalInput = "",
  transitInput = "",
  context = "",
}: {
  natalInput?: string;
  transitInput?: string;
  context?: string;
}) {
  const [planet, setPlanet] = useState("Sun");
  const [degree, setDegree] = useState("27");
  const [sign, setSign] = useState("Scorpio");
  const [house, setHouse] = useState("1st");
  const [activeTab, setActiveTab] = useState("core");
  const [readings, setReadings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Aspects — array of { type, planet2 } e.g. { type:"trine", planet2:"Moon" }
  const [aspects, setAspects] = useState([]);
  const [aspectType, setAspectType] = useState("conjunction");
  const [aspectPlanet, setAspectPlanet] = useState("Moon");
  // Two-screen state
  const [activeScreen, setActiveScreen] = useState<"inputs" | "results">("inputs");
  const [showAspectsPanel, setShowAspectsPanel] = useState(false);

  const placementKey = `${planet}-${degree}-${sign}-${house}`;
  const cacheKey = `${placementKey}-${activeTab}`;
  const currentRead = readings[cacheKey] || "";
  const dignityNote = getDignityFlavor(planet, sign);
  const starConjunction = detectConjunction(sign, degree);

  // Auto-parse natalInput and transitInput when they arrive
  useEffect(() => {
    const combined = [natalInput, transitInput].filter(Boolean).join("\n");
    if (!combined || combined.trim().length < 10) return;
    const lines = combined.trim().split("\n");
    for (const line of lines) {
      const m = line.match(
        /^(?:Transit\s+)?(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rahu|Ketu|Asc)[^:]*:\s*(\d+)[^°]*°[^']*'?\s*(\w+),?\s*(\d+)?/i
      );
      if (m) {
        setPlanet(m[1]);
        setDegree(m[2] || "0");
        setSign(m[3]);
        setHouse(m[4] ? m[4] + "th" : "1st");
        setReadings({});
        break;
      }
    }
  }, [natalInput, transitInput]);

  function addAspect() {
    if (aspects.some(a => a.type === aspectType && a.planet2 === aspectPlanet))
      return;
    setAspects(prev => [...prev, { type: aspectType, planet2: aspectPlanet }]);
    setReadings({});
  }

  function removeAspect(i: any) {
    setAspects(prev => prev.filter((_, idx) => idx !== i));
    setReadings({});
  }

  const getReading = trpc.natalPlacement.getReading.useMutation();

  const getLensReading = trpc.natalPlacement.getLensReading.useMutation();
  const lensesQuery = trpc.natalPlacement.listLenses.useQuery();
  const [lensResult, setLensResult] = useState("");
  const [activeLens, setActiveLens] = useState("");

  async function fetchLensReading(lensId: string) {
    setActiveLens(lensId);
    setLensResult("");
    try {
      const result = await getLensReading.mutateAsync({
        chartText: natalInput,
        lensId,
      });
      setLensResult(result.reading);
    } catch {
      setLensResult(
        "The engine did not respond. Check your connection and try again."
      );
    }
  }

  async function fetchReading() {
    if (readings[cacheKey]) return;
    setLoading(true);
    setError("");
    try {
      let prompt;
      if (activeTab === "soul") {
        prompt =
          buildPrompt("Sun", degree, sign, house, "soul", aspects) +
          "\n\nSOUL TRINITY SYNTHESIS:\n" +
          "1. SUN (Atman — permanent self): interpret the Sun's sign, house, degree, and nakshatra as the fixed soul indicator. This is who this person IS at the core — unchanging, essential.\n" +
          "2. NORTH NODE / RAHU (evolutionary target): interpret the North Node sign and house as the soul's karmic direction this lifetime — the unfamiliar territory the soul must move toward.\n" +
          "3. ATMAKARAKA (personal soul indicator): the planet holding the highest degree in the chart is the soul's primary spiritual curriculum and heaviest karmic teacher. Identify it and interpret its placement.\n" +
          "Synthesize all three into one unified soul reading. Show how the permanent self (Sun), the evolutionary direction (North Node), and the karmic curriculum (Atmakaraka) work together as one soul story.";
      } else if (activeTab === "mind") {
        prompt =
          buildPrompt("Moon", degree, sign, house, "mind", aspects) +
          "\n\nMIND TRINITY SYNTHESIS:\n" +
          "1. MOON (Manas — emotional mind): interpret the Moon's sign, house, degree, and nakshatra as the emotional baseline, instincts, and psychological wiring.\n" +
          "2. MERCURY (Buddhi — rational processor): interpret Mercury's sign, house, and condition as the logic engine, communication style, and cognitive processing.\n" +
          "3. ASCENDANT (the lens): interpret the Ascendant sign as the filter through which all mental and emotional energy is expressed and perceived by the world.\n" +
          "Synthesize all three: Moon as the emotional mind, Mercury as the rational mind, Ascendant as the lens. Show how they interact to produce this person's total mental reality.";
      } else if (activeTab === "spirit") {
        prompt =
          buildPrompt(planet, degree, sign, house, "spirit", aspects) +
          "\n\nSPIRIT AXIS SYNTHESIS:\n" +
          "1. RAHU / NORTH NODE (spiritual hunger): the unfamiliar territory the spirit must conquer — what this soul is evolving toward, the direction of spiritual growth.\n" +
          "2. KETU / SOUTH NODE (spiritual reservoir): past life mastery and detachment — what comes naturally but must be released to evolve.\n" +
          "3. 9TH HOUSE (Dharma): higher wisdom, righteous duty, and cosmic grace — the house of spiritual law.\n" +
          "4. 12TH HOUSE (Moksha): liberation, transcendence, the ultimate exit point — where the spirit dissolves back into the whole.\n" +
          "Synthesize the Rahu/Ketu axis with the 9th and 12th house themes into one unified spirit reading. Show the overarching divine path and spiritual evolution encoded in this chart.";
      } else {
        prompt = buildPrompt(planet, degree, sign, house, activeTab, aspects);
      }
      const result = await getReading.mutateAsync({ prompt });
      if (!result.reading) throw new Error("empty");
      setReadings(prev => ({ ...prev, [cacheKey]: result.reading }));
    } catch {
      setError(
        "The engine did not respond. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Auto-fire reading when natal or transit input arrives
  useEffect(() => {
    if (!planet || !sign) return;
    if (readings[cacheKey]) return;
    fetchReading();
  }, [planet, sign, degree, house, activeTab, natalInput, transitInput]);

  // When tab or placement changes, clear any lingering error
  useEffect(() => {
    setError("");
  }, [activeTab, placementKey]);

  // ── STYLES ────────────────────────────────────────────────────────────────
  const app = {
    minHeight: "100vh",
    background: `radial-gradient(ellipse at 50% 0%, ${C.dusk} 0%, ${C.deep} 45%, ${C.void} 100%)`,
    color: C.white,
    fontFamily: "'Georgia', 'Times New Roman', serif",
    paddingBottom: 80,
  };

  const header = {
    borderBottom: `1px solid ${C.line}`,
    padding: "36px 36px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  };

  const title = {
    margin: 0,
    fontSize: "clamp(18px, 2.8vw, 26px)",
    letterSpacing: "0.38em",
    fontWeight: 400,
    color: C.white,
    textShadow: `0 0 48px rgba(196,162,74,0.5)`,
  };

  const sub = {
    margin: 0,
    fontSize: 9,
    letterSpacing: "0.32em",
    color: C.goldDim,
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  };

  const controls = {
    padding: "28px 36px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 16,
    borderBottom: `1px solid ${C.line}`,
  };

  const group = { display: "flex", flexDirection: "column", gap: 6 };

  const lbl = {
    fontSize: 8,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    color: C.ash,
    fontFamily: "sans-serif",
  };

  const inputBase = {
    background: "rgba(7,9,26,0.85)",
    border: `1px solid rgba(196,162,74,0.2)`,
    color: C.white,
    padding: "10px 14px",
    fontSize: 14,
    fontFamily: "'Georgia', serif",
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const badge = {
    padding: "16px 36px",
    borderBottom: `1px solid ${C.line}`,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  };

  const badgePlacement = {
    fontFamily: "'Georgia', serif",
    fontSize: "clamp(16px, 2vw, 20px)",
    color: C.gold,
    letterSpacing: "0.04em",
    textShadow: `0 0 24px rgba(196,162,74,0.35)`,
  };

  const badgeDignity = {
    fontFamily: "sans-serif",
    fontSize: 10,
    letterSpacing: "0.12em",
    color: C.ash,
    fontStyle: "italic",
    lineHeight: 1.6,
  };

  const tabBar = {
    display: "flex",
    overflowX: "auto",
    borderBottom: `1px solid ${C.line}`,
    padding: "0 36px",
    scrollbarWidth: "none",
    gap: 0,
  };

  function tabStyle(active: any) {
    return {
      fontFamily: "sans-serif",
      fontSize: 9,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      padding: "16px 16px",
      cursor: "pointer",
      background: "transparent",
      border: "none",
      borderBottom: active ? `2px solid ${C.gold}` : "2px solid transparent",
      color: active ? C.gold : C.ash,
      whiteSpace: "nowrap",
      transition: "color 0.18s",
      marginBottom: -1,
    };
  }

  const readingArea = {
    padding: "44px 36px",
    maxWidth: 760,
  };

  const readingText = {
    fontFamily: "'Georgia', serif",
    fontSize: 16,
    lineHeight: 1.95,
    color: C.dim,
    whiteSpace: "pre-wrap",
    letterSpacing: "0.01em",
  };

  const interpretBtn = {
    display: "block",
    margin: "44px 36px",
    background: "transparent",
    border: `1px solid rgba(196,162,74,0.35)`,
    color: C.gold,
    padding: "14px 40px",
    fontSize: 10,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: "sans-serif",
    transition: "border-color 0.2s, color 0.2s",
  };

  const resetBtn = {
    alignSelf: "flex-end",
    background: "transparent",
    border: `1px solid rgba(168,184,204,0.18)`,
    color: C.ash,
    padding: "10px 18px",
    fontSize: 9,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: "sans-serif",
  };

  const loadRow = {
    padding: "44px 36px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontFamily: "sans-serif",
    fontSize: 9,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: C.goldDim,
  };

  const dot = {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: C.gold,
    animation: "pulse 1.3s ease-in-out infinite",
  };

  const errMsg = {
    padding: "28px 36px",
    color: C.red,
    fontFamily: "sans-serif",
    fontSize: 12,
    letterSpacing: "0.06em",
  };

  // ── SCREEN STATE HELPERS ──────────────────────────────────────────────────
  function goToResults() {
    if (!currentRead) {
      fetchReading();
    }
    setActiveScreen("results");
  }

  function backToInputs() {
    setActiveScreen("inputs");
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={app}>
      <style>{`
        @keyframes pulse {
          0%,100% { opacity:0.25; transform:scale(1); }
          50%      { opacity:1;    transform:scale(1.5); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        select option { background: #07091A; }
        ::-webkit-scrollbar { display: none; }
        button:hover { opacity: 0.78; }
        .screen-enter { animation: fadeIn 0.3s ease-in-out; }
      `}</style>

      {/* ── SCREEN 1: INPUT CONSOLE ── */}
      {activeScreen === "inputs" && (
        <div className="screen-enter">
          {/* Header */}
          <div style={header}>
            <h1 style={title}>THE FIRMAMENT</h1>
            <p style={sub}>Natal Interpretation Engine</p>
          </div>

          {/* Controls */}
          <div style={controls}>
        <div style={group}>
          <span style={lbl}>Planet</span>
          <select
            style={inputBase}
            value={planet}
            onChange={e => setPlanet(e.target.value)}
          >
            {PLANETS.map(p => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div style={group}>
          <span style={lbl}>Degree 0 – 29</span>
          <input
            type="number"
            min="0"
            max="29"
            style={inputBase}
            value={degree}
            onChange={e => setDegree(e.target.value)}
          />
        </div>
        <div style={group}>
          <span style={lbl}>Sign</span>
          <select
            style={inputBase}
            value={sign}
            onChange={e => setSign(e.target.value)}
          >
            {SIGNS.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div style={group}>
          <span style={lbl}>House</span>
          <select
            style={inputBase}
            value={house}
            onChange={e => setHouse(e.target.value)}
          >
            {HOUSES.map(h => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </div>
        <div style={group}>
          <span style={lbl}>&nbsp;</span>
          <button
            style={resetBtn}
            onClick={() => {
              setReadings({});
              setError("");
              setAspects([]);
            }}
          >
            Clear readings
          </button>
        </div>
      </div>

          {/* Aspects Accordion */}
          <div
            style={{
              padding: "16px 36px",
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            <button
              onClick={() => setShowAspectsPanel(!showAspectsPanel)}
              style={{
                ...lbl,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: C.gold,
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
            >
              {showAspectsPanel ? "▼" : "▶"} Advanced Mechanics (Aspects)
            </button>

            {showAspectsPanel && (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <span style={{ ...lbl, marginBottom: 2 }}>
                  Aspects (optional — activates Kabbalistic path mechanics)
                </span>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <select
                    style={{ ...inputBase, width: "auto", minWidth: 130 }}
                    value={aspectType}
                    onChange={e => setAspectType(e.target.value)}
                  >
                    {["conjunction", "opposition", "trine", "square", "sextile"].map(
                      a => (
                        <option key={a} value={a}>
                          {a.charAt(0).toUpperCase() + a.slice(1)}
                        </option>
                      )
                    )}
                  </select>
                  <span
                    style={{ color: C.ash, fontSize: 11, fontFamily: "sans-serif" }}
                  >
                    with
                  </span>
                  <select
                    style={{ ...inputBase, width: "auto", minWidth: 120 }}
                    value={aspectPlanet}
                    onChange={e => setAspectPlanet(e.target.value)}
                  >
                    {PLANETS.filter(p => p !== planet).map(p => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                  <button
                    style={{
                      ...resetBtn,
                      padding: "10px 20px",
                      borderColor: `rgba(196,162,74,0.3)`,
                      color: C.gold,
                    }}
                    onClick={addAspect}
                  >
                    + Add
                  </button>
                </div>
                {aspects.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {aspects.map((a, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: "sans-serif",
                          fontSize: 9,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          padding: "5px 12px",
                          border: `1px solid rgba(196,162,74,0.25)`,
                          color: C.gold,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {ASPECT_PATHS[a.type]?.symbol} {a.type} {a.planet2}
                        <span
                          style={{ cursor: "pointer", color: C.ash, fontSize: 11 }}
                          onClick={() => removeAspect(i)}
                        >
                          ✕
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Placement badge + Cast button */}
          <div style={badge}>
            <span style={badgePlacement}>
              {planet} {degree}° {sign} · {house} House
            </span>
            {dignityNote && <span style={badgeDignity}>{dignityNote}</span>}
            {starConjunction && (
              <span
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: starConjunction.star.isRoyal ? C.gold : C.silver,
                  fontStyle: "italic",
                  marginTop: 2,
                  opacity: starConjunction.star.isRoyal ? 1 : 0.75,
                }}
              >
                {starConjunction.star.isRoyal ? "✦ " : "· "}
                {planet} conjunct {starConjunction.star.name}
                {starConjunction.star.isRoyal ? " — Royal Star" : ""} (orb{" "}
                {starConjunction.orb}°{starConjunction.exact ? " — exact" : ""})
                {" · "}
                {starConjunction.star.archetype}
              </span>
            )}
          </div>

          {/* Cast the Reading button */}
          <button
            style={{
              display: "block",
              margin: "28px 36px",
              background: "transparent",
              border: `1px solid rgba(196,162,74,0.5)`,
              color: C.gold,
              padding: "16px 40px",
              fontSize: 10,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "sans-serif",
              transition: "all 0.2s",
              width: "auto",
              textShadow: `0 0 16px rgba(196,162,74,0.35)`,
            }}
            onClick={goToResults}
          >
            ✦ &nbsp; Cast the Reading
          </button>
        </div>
      )}

      {/* ── SCREEN 2: RESULTS DASHBOARD ── */}
      {activeScreen === "results" && (
        <div className="screen-enter">
          {/* Header with back button */}
          <div
            style={{
              ...header,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1 style={title}>THE FIRMAMENT</h1>
              <p style={sub}>Natal Interpretation Engine</p>
            </div>
            <button
              onClick={backToInputs}
              style={{
                background: "transparent",
                border: `1px solid rgba(196,162,74,0.35)`,
                color: C.ash,
                padding: "10px 18px",
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "sans-serif",
                transition: "all 0.2s",
              }}
            >
              ← Back to Inputs
            </button>
          </div>

          {/* Summary card */}
          <div
            style={{
              ...badge,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span style={badgePlacement}>
                {planet} {degree}° {sign} · {house} House
              </span>
              {dignityNote && <span style={badgeDignity}>{dignityNote}</span>}
            </div>
            {starConjunction && (
              <span
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: starConjunction.star.isRoyal ? C.gold : C.silver,
                  fontStyle: "italic",
                  opacity: starConjunction.star.isRoyal ? 1 : 0.75,
                  textAlign: "right",
                }}
              >
                {starConjunction.star.isRoyal ? "✦ " : "· "}
                {planet} conjunct {starConjunction.star.name}
                {starConjunction.star.isRoyal ? " — Royal Star" : ""}
              </span>
            )}
          </div>

          {/* Horizontal-scrolling pill bar */}
          <div
            style={{
              ...tabBar,
              position: "relative",
              overflowX: "auto",
            }}
          >
            {TABS.map(t => (
              <button
                key={t.id}
                style={{
                  ...tabStyle(activeTab === t.id),
                  padding: "12px 20px",
                  fontSize: 10,
                  borderRadius: 4,
                  backgroundColor: activeTab === t.id ? `rgba(196,162,74,0.15)` : "transparent",
                  border: activeTab === t.id ? `1px solid ${C.gold}` : `1px solid transparent`,
                  margin: "12px 8px 12px 0",
                  whiteSpace: "nowrap",
                  borderBottom: "none",
                  minWidth: "fit-content",
                }}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
            {/* Right gradient fade to signal swipeability */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 40,
                background: `linear-gradient(to right, transparent, ${C.void})`,
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Content area */}
          {loading ? (
            <div style={loadRow}>
              <div style={dot} />
              <div style={{ ...dot, animationDelay: "0.22s" }} />
              <div style={{ ...dot, animationDelay: "0.44s" }} />
              <span style={{ marginLeft: 10 }}>Engaging the Firmament...</span>
            </div>
          ) : error ? (
            <div
              style={{
                ...errMsg,
                background: `rgba(201,64,64,0.15)`,
                border: `1px solid rgba(201,64,64,0.3)`,
                borderRadius: 4,
                margin: "28px 36px",
              }}
            >
              {error}
            </div>
          ) : currentRead ? (
            <div style={readingArea}>
              <div style={readingText}>{currentRead}</div>
            </div>
          ) : null}

          {/* Lenses section */}
          <div style={{ padding: "28px 36px" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {lensesQuery.data &&
                lensesQuery.data.map(lens => (
                  <button
                    key={lens.id}
                    onClick={() => fetchLensReading(lens.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 4,
                      border: `1px solid ${C.line}`,
                      background:
                        activeLens === lens.id
                          ? `rgba(196,162,74,0.2)`
                          : "transparent",
                      color: activeLens === lens.id ? C.gold : C.ash,
                      cursor: "pointer",
                      fontSize: 11,
                      fontFamily: "sans-serif",
                      transition: "all 0.2s",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {lens.label}
                  </button>
                ))}
            </div>

            {getLensReading.isPending && (
              <p
                style={{
                  marginTop: 12,
                  color: C.goldDim,
                  fontSize: 11,
                  fontFamily: "sans-serif",
                  letterSpacing: "0.06em",
                }}
              >
                Reading the circuit...
              </p>
            )}

            {lensResult && (
              <div
                style={{
                  marginTop: 16,
                  whiteSpace: "pre-wrap",
                  fontFamily: "'Georgia', serif",
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: C.dim,
                }}
              >
                {lensResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
