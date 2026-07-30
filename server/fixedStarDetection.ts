/**
 * Fixed Star Detection for Sports Horary
 *
 * Fixed stars that affect horary predictions:
 * - Regulus (Leo 29°43', ±6°): Royal star of power, success, victory
 * - Spica (Virgo 23°50', ±5°): Blessing, good fortune, protection
 * - Algol (Taurus 26°41', ±5°): Destruction, violence, catastrophe
 * - Aldebaran (Gemini 9°47', ±4°): Strength, stubbornness, confrontation
 * - Sirius (Cancer 14°00', ±3°): Vigor, success, heat (hottest star)
 */

import type { PlanetPosition } from "./ephemeris";

interface FixedStar {
  name: string;
  tropicalLon: number; // tropical longitude
  orb: number; // orb of influence
  meaning: string;
}

const FIXED_STARS: FixedStar[] = [
  {
    name: "Regulus",
    tropicalLon: 29 + 43 / 60, // Leo 29°43'
    orb: 6,
    meaning: "Power, victory, royal favor",
  },
  {
    name: "Spica",
    tropicalLon: 60 + 30 / 60 + 23 + 50 / 60, // Virgo 23°50'
    orb: 5,
    meaning: "Blessing, fortune, grace",
  },
  {
    name: "Algol",
    tropicalLon: 30 + 30 / 60 + 26 + 41 / 60, // Taurus 26°41' (but check: Taurus is 30-60, so it's 56°41')
    orb: 5,
    meaning: "Destruction, violence, loss",
  },
  {
    name: "Aldebaran",
    tropicalLon: 30 + 9 + 47 / 60, // Gemini 9°47'
    orb: 4,
    meaning: "Strength, stubbornness, conflict",
  },
  {
    name: "Sirius",
    tropicalLon: 60 + 14, // Cancer 14°00'
    orb: 3,
    meaning: "Vigor, success, intensity",
  },
];

export interface FixedStarActive {
  name: string;
  meaning: string;
  planet: string;
  orb: number;
  nature: "benefic" | "malefic"; // Regulus/Spica/Sirius = benefic, Algol/Aldebaran = malefic
}

export function detectFixedStars(planets: PlanetPosition[]): FixedStarActive[] {
  const active: FixedStarActive[] = [];

  for (const planet of planets) {
    const planetLon = planet.eclipticLon;

    for (const star of FIXED_STARS) {
      const sep = Math.abs(planetLon - star.eclipticLon);
      const minSep = Math.min(sep, 360 - sep); // handle wrap-around

      if (minSep <= star.orb) {
        const nature =
          star.name === "Regulus" || star.name === "Spica" || star.name === "Sirius"
            ? "benefic"
            : "malefic";

        active.push({
          name: star.name,
          meaning: star.meaning,
          planet: planet.name,
          orb: minSep,
          nature,
        });
      }
    }
  }

  return active;
}

export function formatFixedStarsList(stars: FixedStarActive[]): string {
  if (stars.length === 0) return "No fixed stars active";

  return stars
    .map(
      (s) =>
        `• ${s.planet} conjunct ${s.name} (orb ±${s.orb.toFixed(1)}°, ${s.nature}): ${s.meaning}`
    )
    .join("\n");
}
