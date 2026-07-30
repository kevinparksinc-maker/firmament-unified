/**
 * ARCANA STATE — Fixed Stars Engine
 * FIRMAMENT MODEL: 15 Tiered Stars with Archetype, Gift, Shadow, Warning
 *
 * The fixed stars are the true backdrop of the sky — they do not move.
 * Planets are wanderers moving against this eternal backdrop.
 *
 * TIER 1: Core Stars (8) - Aldebaran, Regulus, Antares, Fomalhaut, Sirius, Spica, Arcturus, Algol
 * TIER 2: Orion Cluster (3) - Betelgeuse, Rigel, Bellatrix
 * TIER 3: Twin Stars (2) - Castor, Pollux
 * TIER 4: Visionary Stars (4) - Vega, Altair, Alphecca, Achernar
 *
 * Perfect 90° Royal Cross: 45°, 135°, 225°, 315°
 */

export interface FixedStar {
  name: string;
  shortName: string;
  sidDegree: number;
  sign: string;
  degree: number;
  nature: string;
  magnitude: string;
  archetype: string;
  gift: string;
  shadow: string;
  warning: string;
  meaning: string;
  isRoyal?: boolean;
  isPolar?: boolean;
}

export const FIXED_STARS: FixedStar[] = [
  // ============================================================================
  // TIER 1 — CORE STARS (The Foundation)
  // ============================================================================

  // ── ROYAL STARS (Watchers of the Sky) ──────────────────────────────────────
  {
    name: "Aldebaran",
    shortName: "Aldebaran",
    sidDegree: 45.0,
    sign: "Taurus",
    degree: 15,
    nature: "Mars",
    magnitude: "1st",
    archetype: "The Warrior",
    gift: "Courage, honor, integrity, bold action, military leadership",
    shadow: "Cowardice, deceit, corruption of principles",
    warning:
      "Integrity must be maintained or the star destroys what it once lifted",
    meaning:
      "Watcher of the East. The Eye of the Bull. Those with planets here are warriors by nature — not necessarily of battle, but of principle. They fight for what they believe and cannot stand cowardice or deceit. Success comes through bold action, but the star demands that you stand for something greater than yourself. When activated, you are being tested. Will you act with honor when no one is watching?",
    isRoyal: true,
  },
  {
    name: "Regulus",
    shortName: "Regulus",
    sidDegree: 135.0,
    sign: "Leo",
    degree: 15,
    nature: "Mars/Jupiter",
    magnitude: "1st",
    archetype: "The King",
    gift: "Leadership, kingship, success, fame, honor, command",
    shadow: "Betrayal, cowardice, abuse of power, revenge",
    warning:
      "Revenge destroys everything gained. The star watches and remembers.",
    meaning:
      "Watcher of the North. The Heart of the Lion. The most royal star. Those with planets here are marked for leadership — whether they want it or not. The burden of command is real. Success comes through courage and nobility, but the star punishes betrayal and the abuse of power. When activated, your integrity is on display. Rise or fall — there is no middle ground.",
    isRoyal: true,
  },
  {
    name: "Antares",
    shortName: "Antares",
    sidDegree: 225.0,
    sign: "Scorpio",
    degree: 15,
    nature: "Mars/Jupiter",
    magnitude: "1st",
    archetype: "The Transformer",
    gift: "Depth, power, obsession, occult ability, transformation",
    shadow: "Recklessness, destruction, being consumed by darkness",
    warning:
      "Recklessness brings downfall. Something must die for transformation to occur.",
    meaning:
      "Watcher of the West. The Heart of the Scorpion. Those with planets here walk the edge between transformation and destruction. They are drawn to the occult, to death and rebirth, to things others fear to touch. The star grants depth and power at a cost — you must be willing to descend into darkness to find your light. When activated, something must die.",
    isRoyal: true,
  },
  {
    name: "Fomalhaut",
    shortName: "Fomalhaut",
    sidDegree: 315.0,
    sign: "Aquarius",
    degree: 15,
    nature: "Venus/Mercury",
    magnitude: "1st",
    archetype: "The Visionary",
    gift: "Idealism, mysticism, dreams made real, art, vision",
    shadow: "Impure intentions, selfish magic, delusion",
    warning:
      "Only absolute purity of intention succeeds. The Mouth swallows the unworthy.",
    meaning:
      "Watcher of the South. The Mouth of the Southern Fish. Those with planets here are visionaries, artists, and mystics. They see what others cannot — patterns beneath reality, the dream behind the world. The star grants access to higher realms but tests your motives. Selfish magic fails. Only work done with pure intention succeeds. When activated, your dreams are being weighed.",
    isRoyal: true,
  },

  // ── POWER STARS ────────────────────────────────────────────────────────────
  {
    name: "Sirius",
    shortName: "Sirius",
    sidDegree: 103.68,
    sign: "Cancer",
    degree: 13.68,
    nature: "Jupiter/Mars",
    magnitude: "1st",
    archetype: "The Scorcher",
    gift: "Ambition, pride, fame, wealth, leadership, success",
    shadow: "Burning out, overextension, hubris, destruction",
    warning:
      "The brightest star burns hottest. Success comes fast but can end faster if overextended.",
    meaning:
      "The Dog Star. The brightest star in the sky. Sacred to the Egyptians — its heliacal rising marked the Nile flood. Those with planets here are driven to achieve greatness. They want to be seen, to matter, to leave a mark. But Sirius demands that you handle success wisely or be consumed by your own flame.",
  },
  {
    name: "Spica",
    shortName: "Spica",
    sidDegree: 203.27,
    sign: "Libra",
    degree: 23.27,
    nature: "Venus/Mars",
    magnitude: "1st",
    archetype: "The Blessed",
    gift: "Art, music, science, spiritual grace, success, wealth, refinement",
    shadow: "Complacency, laziness, resting on talent, loss of inspiration",
    warning:
      "Gifts must be used or they wither. The blessed star expects contribution.",
    meaning:
      "The brightest star in Virgo. The most benefic fixed star. Those with planets here are blessed by the goddess — with talent, with beauty, with grace. But blessing without action becomes stagnation. Spica rewards those who refine their gifts and share them with the world.",
  },
  {
    name: "Arcturus",
    shortName: "Arcturus",
    sidDegree: 203.83,
    sign: "Libra",
    degree: 23.83,
    nature: "Jupiter/Mars",
    magnitude: "1st",
    archetype: "The Guardian",
    gift: "Pioneering, exploration, wealth, honor, inspiration",
    shadow: "Isolation, loneliness, alienation from community",
    warning: "The path you walk is yours alone. Success comes with solitude.",
    meaning:
      "The Guardian of the Bear. Those with planets here are pioneers — they go where others have not gone. Success comes through exploration, travel, and carving new paths. But the pioneer walks alone. Arcturus grants honor but asks if you are willing to pay the price of solitude.",
  },
  {
    name: "Algol",
    shortName: "Algol",
    sidDegree: 55.1,
    sign: "Taurus",
    degree: 25.1,
    nature: "Saturn/Jupiter",
    magnitude: "2nd",
    archetype: "The Demon",
    gift: "Intense creative power, destruction of old structures, forging strength through crisis",
    shadow: "Ruin, violence, obsession, being consumed by darkness",
    warning:
      "The Demon Star does not compromise. You will be forged or destroyed.",
    meaning:
      "The Demon Star. The blinking eye of Medusa. The most feared star in ancient tradition. Those with planets here face profound challenges that forge extraordinary strength — or utter ruin. Algol does not offer easy paths. It offers transformation through fire. If you survive, you are unbreakable.",
  },

  // ============================================================================
  // TIER 2 — ORION CLUSTER (The Hero's Journey)
  // ============================================================================
  {
    name: "Betelgeuse",
    shortName: "Betelgeuse",
    sidDegree: 88.03,
    sign: "Gemini",
    degree: 28.03,
    nature: "Mars/Mercury",
    magnitude: "1st",
    archetype: "The Champion",
    gift: "Riches, honors, fame, success, victory, championship",
    shadow: "Pride, calamity, fall from grace, overreach",
    warning:
      "The champion who forgets humility will be humbled. Success is borrowed, not owned.",
    meaning:
      "The right shoulder of Orion. The Champion's star. Those with planets here are destined for victory — in competition, in career, in life. But Betelgeuse remembers that every champion eventually falls. The star rewards those who win with grace and prepares those who lose with dignity.",
  },
  {
    name: "Rigel",
    shortName: "Rigel",
    sidDegree: 76.51,
    sign: "Gemini",
    degree: 16.51,
    nature: "Jupiter/Saturn",
    magnitude: "1st",
    archetype: "The Builder",
    gift: "Education, technical mastery, engineering, lasting structures, wealth",
    shadow: "Rigidity, lack of vision, building without purpose",
    warning:
      "Building for its own sake is vanity. What are you constructing and why?",
    meaning:
      "The left foot of Orion. The Builder's star. Those with planets here are architects, engineers, and master craftsmen. They build things that last. But Rigel asks: what are you building and why? A tower without purpose is just a monument to ego.",
  },
  {
    name: "Bellatrix",
    shortName: "Bellatrix",
    sidDegree: 79.0, // Approximate - adjust as needed
    sign: "Gemini",
    degree: 19.0,
    nature: "Mars/Mercury",
    magnitude: "1st",
    archetype: "The Warrior",
    gift: "Decisiveness, daring, quick action, military success",
    shadow: "Rashness, disaster after victory, inability to consolidate gains",
    warning:
      "Winning the battle is not winning the war. Victory exposes weakness if unprepared.",
    meaning:
      "The Amazon Star. The Warrior's star. Those with planets here are decisive and daring. They act when others hesitate. But Bellatrix teaches that victory is not the end — it is the beginning of new challenges. Winning the battle without preparing for the aftermath leads to ruin.",
  },

  // ============================================================================
  // TIER 3 — TWIN STARS (Duality & Relationship)
  // ============================================================================
  {
    name: "Castor",
    shortName: "Castor",
    sidDegree: 99.17,
    sign: "Cancer",
    degree: 19.17,
    nature: "Mercury/Saturn",
    magnitude: "2nd",
    archetype: "The Mortal Twin",
    gift: "Intelligence, writing, communication, sudden fame, skill",
    shadow: "Violence, mischief, sudden ruin, ephemeral success",
    warning:
      "Fame that comes fast can leave fast. Brilliance without humility is dangerous.",
    meaning:
      "One of the Twins of Gemini. The mortal twin who chose mortality for love. Those with planets here have sharp minds and quick tongues. They rise fast in writing, communication, and intellectual fields. But Castor reminds you that what comes up must come down. Sudden fame can become sudden ruin.",
  },
  {
    name: "Pollux",
    shortName: "Pollux",
    sidDegree: 102.73,
    sign: "Cancer",
    degree: 22.73,
    nature: "Mars/Uranus",
    magnitude: "2nd",
    archetype: "The Immortal Twin",
    gift: "Athleticism, audacity, boldness, protection, endurance",
    shadow: "Disgrace, calamity, ruin, learning through hardship",
    warning:
      "Strength without wisdom becomes destruction. Lessons come through pain.",
    meaning:
      "The immortal twin who shared his immortality with his brother. Those with planets here are bold, audacious, and physically gifted. They fight, compete, and endure. But Pollux teaches that strength without wisdom becomes destruction. The hardest lessons come through the body.",
  },

  // ============================================================================
  // TIER 4 — VISIONARY STARS (Mystical Depth)
  // ============================================================================
  {
    name: "Vega",
    shortName: "Vega",
    sidDegree: 284.73,
    sign: "Capricorn",
    degree: 14.73,
    nature: "Venus/Mercury",
    magnitude: "1st",
    archetype: "The Enchanter",
    gift: "Magic, charisma, art, music, enchantment, politics",
    shadow: "Fleeting fame, practicality lacking, manipulation",
    warning:
      "Magic without substance is just illusion. Your enchantment must serve truth.",
    meaning:
      "The Falling Eagle. The Enchanter's star. Those with planets here have charisma that moves crowds, art that changes hearts, and magic that alters reality. But Vega asks: what is your enchantment for? Fleeting fame is empty. True magic serves something greater.",
  },
  {
    name: "Altair",
    shortName: "Altair",
    sidDegree: 301.0, // Approximate - 1° Aquarius
    sign: "Aquarius",
    degree: 1.0,
    nature: "Mars/Jupiter",
    magnitude: "1st",
    archetype: "The Risk-Taker",
    gift: "Boldness, sudden wealth, high command, adventurous spirit",
    shadow: "Danger, ephemeral success, recklessness, loss",
    warning:
      "Fortune favors the bold — but boldness without wisdom is gambling, not strategy.",
    meaning:
      "The Flying Eagle. The Risk-Taker's star. Those with planets here are bold, confident, and stubborn. They take risks that others won't. Sometimes they win everything. Sometimes they lose everything. Altair rewards the adventurous but reminds you that every risk has a cost.",
  },
  {
    name: "Alphecca",
    shortName: "Alphecca",
    sidDegree: 221.0, // Approximate - 11° Scorpio
    sign: "Scorpio",
    degree: 11.0,
    nature: "Venus/Mercury",
    magnitude: "2nd",
    archetype: "The Healer",
    gift: "Art, poetry, occult ability, healing, trade, commerce",
    shadow: "Loneliness, isolation, tendency to withdraw",
    warning: "Healing others does not heal yourself. Who heals the healer?",
    meaning:
      "The Healer's star. Those with planets here have gifts for art, healing, and occult matters. They succeed in trade and commerce but often walk alone. Alphecca asks: you heal everyone else — who heals you? The healer must also receive healing or burn out.",
  },
  {
    name: "Achernar",
    shortName: "Achernar",
    sidDegree: 344.93,
    sign: "Pisces",
    degree: 14.93,
    nature: "Jupiter",
    magnitude: "1st",
    archetype: "The Seeker",
    gift: "Philosophy, religion, spirituality, honors, public office",
    shadow: "Spiritual bypass, avoiding earthly responsibilities",
    warning:
      "The divine is not an escape from the world. Spirituality must serve life, not avoid it.",
    meaning:
      "The end of the River Eridanus. The Seeker's star. Those with planets here are drawn to philosophy, religion, and spiritual matters. They seek the divine, the ultimate, the meaning behind meaning. But Achernar warns: transcendence is not escape. The seeker must return to the world.",
  },
];

// ============================================================================
// STAR CONJUNCTION DETECTION
// ============================================================================

export interface StarConjunction {
  star: FixedStar;
  planet: string;
  orb: number;
  exact: boolean;
}

export function detectFixedStarConjunctions(
  placements: Record<
    string,
    { sign: string; degree: number; planet: string; absolute: number | null }
  >
): StarConjunction[] {
  const conjunctions: StarConjunction[] = [];

  for (const [planetName, placement] of Object.entries(placements)) {
    if (placement.eclipticLon == null) continue;

    for (const star of FIXED_STARS) {
      const maxOrb = star.isRoyal || star.isPolar ? 2.0 : 1.5;
      let diff = Math.abs(placement.eclipticLon - star.sidDegree);
      if (diff > 180) diff = 360 - diff;

      if (diff <= maxOrb) {
        conjunctions.push({
          star,
          planet: planetName,
          orb: Math.round(diff * 100) / 100,
          exact: diff <= 0.5,
        });
      }
    }
  }

  conjunctions.sort((a, b) => {
    const aSpecial = a.star.isRoyal || a.star.isPolar ? 0 : 1;
    const bSpecial = b.star.isRoyal || b.star.isPolar ? 0 : 1;
    if (aSpecial !== bSpecial) return aSpecial - bSpecial;
    return a.orb - b.orb;
  });

  return conjunctions;
}

export function formatStarConjunctions(
  conjunctions: StarConjunction[]
): string {
  if (conjunctions.length === 0)
    return "No exact fixed star conjunctions detected.";

  return conjunctions
    .map(c => {
      const tag = c.star.isRoyal ? " [ROYAL STAR]" : "";
      return `${c.planet} conjunct ${c.star.name}${tag} (orb ${c.orb}°)
  Archetype: ${c.star.archetype}
  Gift: ${c.star.gift}
  Shadow: ${c.star.shadow}
  Warning: ${c.star.warning}
  Meaning: ${c.star.meaning}`;
    })
    .join("\n\n");
}
