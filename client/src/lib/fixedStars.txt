/**
 * ARCANA STATE — Fixed Stars Engine
 *
 * The fixed stars are the true backdrop of the sky — they do not move
 * (or move so slowly across a human lifetime as to be fixed). The planets
 * are wanderers moving against this eternal backdrop. Polaris sits at the
 * celestial north pole — the still center that everything else rotates around.
 *
 * Positions given in sidereal degrees (0 = 0° Aries).
 * Sources: traditional Vedic/Hellenistic star lists, Bernadette Brady, Vivian Robson.
 */

export interface FixedStar {
  name: string;
  shortName: string;
  sidDegree: number;      // Sidereal zodiac degree (0–360)
  sign: string;           // Sign position
  degree: number;         // Degree within sign
  nature: string;         // Planetary nature (e.g. "Mars/Jupiter")
  magnitude: string;      // Brightness class
  meaning: string;        // Core interpretation
  isRoyal?: boolean;      // One of the four Royal Stars (Watchers)
  isPolar?: boolean;      // Pole star
}

export const FIXED_STARS: FixedStar[] = [
  // ── POLARIS — The Still Center ──────────────────────────────────────────────
  {
    name: 'Polaris',
    shortName: 'Polaris',
    sidDegree: 63.78,  // ~3° 47' Gemini
    sign: 'Gemini',
    degree: 3.78,
    nature: 'Saturn/Venus',
    magnitude: '2nd',
    meaning: 'The unmoving center. The nail of the sky. Everything rotates around this point. Brings orientation, true north, the ability to hold still while the world spins. A guiding light that never sets.',
    isPolar: true,
  },

  // ── THE FOUR ROYAL STARS (Watchers of the Sky) ───────────────────────────
  {
    name: 'Aldebaran',
    shortName: 'Aldebaran',
    sidDegree: 69.47,  // ~9° 47' Gemini
    sign: 'Gemini',
    degree: 9.47,
    nature: 'Mars',
    magnitude: '1st',
    meaning: 'Watcher of the East. The Eye of the Bull. Success, honor, courage, and integrity — but only if integrity is maintained. One of the four Royal Stars. Military leadership, bold action, the warrior path.',
    isRoyal: true,
  },
  {
    name: 'Regulus',
    shortName: 'Regulus',
    sidDegree: 149.83, // ~29° 50' Leo
    sign: 'Leo',
    degree: 29.83,
    nature: 'Mars/Jupiter',
    magnitude: '1st',
    meaning: 'Watcher of the North. The Heart of the Lion. The most royal star. Kingship, success, fame, and honor — but revenge will destroy everything gained. The star of leaders, rulers, and those born to rise.',
    isRoyal: true,
  },
  {
    name: 'Antares',
    shortName: 'Antares',
    sidDegree: 249.73, // ~9° 44' Sagittarius (sidereal) — shown as 15° Scorpio in tropical
    sign: 'Scorpio',
    degree: 15.0,
    nature: 'Mars/Jupiter',
    magnitude: '1st',
    meaning: 'Watcher of the West. The Heart of the Scorpion. Rival of Mars. Fierce success through obsession and intensity — but recklessness brings downfall. Depth, transformation, the occult, and the willingness to go where others fear.',
    isRoyal: true,
  },
  {
    name: 'Fomalhaut',
    shortName: 'Fomalhaut',
    sidDegree: 333.87, // ~3° 52' Pisces
    sign: 'Pisces',
    degree: 3.87,
    nature: 'Venus/Mercury',
    magnitude: '1st',
    meaning: 'Watcher of the South. The Mouth of the Southern Fish. Idealism, mysticism, and the dream made real — but only through absolute purity of intention. The star of visionaries, artists, and spiritual seekers.',
    isRoyal: true,
  },

  // ── OTHER MAJOR FIXED STARS ──────────────────────────────────────────────
  {
    name: 'Algol',
    shortName: 'Algol',
    sidDegree: 55.1,   // ~25° 10' Taurus
    sign: 'Taurus',
    degree: 25.1,
    nature: 'Saturn/Jupiter',
    magnitude: '2nd',
    meaning: 'The Demon Star. The blinking eye of Medusa. The most feared star in ancient tradition — represents the severed head, intense creative/destructive power. Those with planets here face profound challenges that forge extraordinary strength.',
  },
  {
    name: 'Pleiades',
    shortName: 'Pleiades',
    sidDegree: 59.73,  // ~29° 44' Taurus
    sign: 'Taurus',
    degree: 29.73,
    nature: 'Moon/Mars',
    magnitude: 'Cluster',
    meaning: 'The Seven Sisters. Grief and sorrow but also deep beauty and artistic sensitivity. The Pleiades mark the passage of seasons. Connection to the ancestors, the feminine mysteries, and the cycles of time.',
  },
  {
    name: 'Alcyone',
    shortName: 'Alcyone',
    sidDegree: 59.73,
    sign: 'Taurus',
    degree: 29.73,
    nature: 'Moon/Mars',
    magnitude: '3rd',
    meaning: 'Central star of the Pleiades. The central sun of our local star cluster according to some ancient traditions. Mystical vision, the ability to see what others cannot, but also isolation and sorrow.',
  },
  {
    name: 'Rigel',
    shortName: 'Rigel',
    sidDegree: 76.51,  // ~16° 30' Gemini
    sign: 'Gemini',
    degree: 16.51,
    nature: 'Jupiter/Saturn',
    magnitude: '1st',
    meaning: 'The left foot of Orion. Education, technical mastery, and the ability to build lasting structures. Brings wealth and success through skill and knowledge. The star of engineers, architects, and master craftsmen.',
  },
  {
    name: 'Betelgeuse',
    shortName: 'Betelgeuse',
    sidDegree: 88.03,  // ~28° Gemini
    sign: 'Gemini',
    degree: 28.03,
    nature: 'Mars/Mercury',
    magnitude: '1st',
    meaning: 'The right shoulder of Orion. Success, fame, and honors — particularly in martial or competitive fields. Tremendous energy and drive. The star of champions and those who rise through force of will.',
  },
  {
    name: 'Sirius',
    shortName: 'Sirius',
    sidDegree: 103.68, // ~13° 40' Cancer
    sign: 'Cancer',
    degree: 13.68,
    nature: 'Jupiter/Mars',
    magnitude: '1st (brightest star)',
    meaning: 'The Dog Star. The brightest star in the sky. Ambition, pride, and the drive to achieve greatness. Sirius was sacred to the Egyptians — its heliacal rising marked the Nile flood. Brings fame, success, and burning ambition. The star of those who aim for the highest.',
  },
  {
    name: 'Procyon',
    shortName: 'Procyon',
    sidDegree: 115.77, // ~25° 47' Cancer
    sign: 'Cancer',
    degree: 25.77,
    nature: 'Mercury/Mars',
    magnitude: '1st',
    meaning: 'The Little Dog Star. Quick success that may not last. Rashness, impulsiveness, and the tendency to act before thinking. But also great energy and the ability to get things done fast.',
  },
  {
    name: 'Castor',
    shortName: 'Castor',
    sidDegree: 99.17,  // ~19° 10' Cancer
    sign: 'Cancer',
    degree: 19.17,
    nature: 'Mercury',
    magnitude: '2nd',
    meaning: 'One of the Twins of Gemini. Intelligence, writing, and communication gifts. Sudden fame and violence — the mortal twin. Brilliance that can turn to darkness.',
  },
  {
    name: 'Pollux',
    shortName: 'Pollux',
    sidDegree: 102.73, // ~22° 44' Cancer
    sign: 'Cancer',
    degree: 22.73,
    nature: 'Mars',
    magnitude: '2nd',
    meaning: 'The immortal twin of Gemini. Boldness, cruelty, and the fighter spirit — but also protection and the ability to endure. The immortal twin who chose to share his immortality.',
  },
  {
    name: 'Spica',
    shortName: 'Spica',
    sidDegree: 203.27, // ~23° 16' Libra
    sign: 'Libra',
    degree: 23.27,
    nature: 'Venus/Mars',
    magnitude: '1st',
    meaning: 'The brightest star in Virgo. The most benefic fixed star. Gifts of art, music, science, and spiritual grace. Success, wealth, and fame through talent and refinement. The star of those blessed by the goddess.',
  },
  {
    name: 'Arcturus',
    shortName: 'Arcturus',
    sidDegree: 203.83, // ~23° 50' Libra
    sign: 'Libra',
    degree: 23.83,
    nature: 'Jupiter/Mars',
    magnitude: '1st',
    meaning: 'The Guardian of the Bear. Success through a different path — the pioneer who charts new territory. Wealth and honor through travel, exploration, and going where others have not gone.',
  },
  {
    name: 'Vega',
    shortName: 'Vega',
    sidDegree: 284.73, // ~14° 44' Capricorn
    sign: 'Capricorn',
    degree: 14.73,
    nature: 'Venus/Mercury',
    magnitude: '1st',
    meaning: 'The Falling Eagle. Magic, charisma, and the ability to enchant others. Artistic and musical gifts of the highest order. The star of those who can move people through beauty and sound.',
  },
  {
    name: 'Deneb Algedi',
    shortName: 'Deneb Algedi',
    sidDegree: 302.68, // ~2° 41' Aquarius
    sign: 'Aquarius',
    degree: 2.68,
    nature: 'Saturn/Jupiter',
    magnitude: '3rd',
    meaning: 'The tail of the Sea-Goat. Law, justice, and the administration of power. Success in legal and governmental matters. The star of judges, lawmakers, and those who uphold order.',
  },
  {
    name: 'Achernar',
    shortName: 'Achernar',
    sidDegree: 344.93, // ~14° 56' Pisces
    sign: 'Pisces',
    degree: 14.93,
    nature: 'Jupiter',
    magnitude: '1st',
    meaning: 'The end of the River Eridanus. Religious and spiritual honors. Success in philosophy, religion, and matters of the spirit. The star of those who seek the divine.',
  },
];

export interface StarConjunction {
  star: FixedStar;
  planet: string;
  orb: number;
  exact: boolean;
}

/**
 * Find all fixed star conjunctions for a set of planetary placements.
 * Uses sidereal degree positions. Orb of 1.5° for most stars, 2° for Royal Stars.
 */
export function detectFixedStarConjunctions(
  placements: Record<string, { sign: string; degree: number; planet: string; absolute: number | null }>
): StarConjunction[] {
  const conjunctions: StarConjunction[] = [];

  for (const [planetName, placement] of Object.entries(placements)) {
    if (placement.absolute == null) continue;

    for (const star of FIXED_STARS) {
      const maxOrb = (star.isRoyal || star.isPolar) ? 2.0 : 1.5;
      let diff = Math.abs(placement.absolute - star.sidDegree);
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

  // Sort by orb (tightest first), then Royal/Polar stars first
  conjunctions.sort((a, b) => {
    const aSpecial = a.star.isRoyal || a.star.isPolar ? 0 : 1;
    const bSpecial = b.star.isRoyal || b.star.isPolar ? 0 : 1;
    if (aSpecial !== bSpecial) return aSpecial - bSpecial;
    return a.orb - b.orb;
  });

  return conjunctions;
}

/**
 * Format fixed star conjunctions as a readable summary for the AI prompt.
 */
export function formatStarConjunctions(conjunctions: StarConjunction[]): string {
  if (conjunctions.length === 0) return 'No exact fixed star conjunctions detected.';

  return conjunctions.map(c => {
    const tag = c.star.isRoyal ? ' [ROYAL STAR]' : c.star.isPolar ? ' [POLE STAR]' : '';
    return `${c.planet} conjunct ${c.star.name}${tag} (orb ${c.orb}°) — ${c.star.sign} ${c.star.degree.toFixed(1)}° — Nature: ${c.star.nature}`;
  }).join('\n');
}
