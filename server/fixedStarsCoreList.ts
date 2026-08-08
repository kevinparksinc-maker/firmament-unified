/**
 * Fixed Stars - Core List for Sports Horary
 *
 * 8 essential fixed stars with sports interpretations.
 */

import type { PlanetPosition } from "./ephemeris";

export interface FixedStarActive {
  name: string;
  tropicalLon: number;
  orb: number;
  meaning: string;
  nature: "benefic" | "malefic";
  activePlanets: Array<{ planet: string; separation: number }>;
}

const FIXED_STARS_CORE = [
  {
    name: "Regulus",
    tropicalLon: 135, // Fixed anchor: 15° Leo, permanent
    orb: 1.0,
    meaning: "Kingship, honor, victory, championship potential",
    nature: "benefic",
  },
  {
    name: "Spica",
    tropicalLon: 60 + 30 / 60 + 23 + 50 / 60, // Virgo 23°50'
    orb: 1.0,
    meaning: "Fortune, gifts, protection, lucky breaks",
    nature: "benefic",
  },
  {
    name: "Aldebaran",
    tropicalLon: 45, // Fixed anchor: 15° Taurus, permanent
    orb: 0.8,
    meaning: "Courage, military honor, aggression, fighting spirit",
    nature: "benefic",
  },
  {
    name: "Antares",
    tropicalLon: 225, // Fixed anchor: 15° Scorpio, permanent
    orb: 1.0,
    meaning: "Intense battles, conquest, high-risk/high-reward, comeback energy",
    nature: "malefic",
  },
  {
    name: "Fomalhaut",
    tropicalLon: 315, // Fixed anchor: 15° Aquarius, permanent
    orb: 0.8,
    meaning: "Inspiration, vision, momentum, unexpected success",
    nature: "benefic",
  },
  {
    name: "Sirius",
    tropicalLon: 60 + 14, // Cancer 14°00'
    orb: 0.8,
    meaning: "Glory, fame, power, big performances, star-player energy",
    nature: "benefic",
  },
  {
    name: "Arcturus",
    tropicalLon: 150 + 30 / 60 + 14 + 11 / 60, // Virgo 14°11'
    orb: 0.8,
    meaning: "Leadership, achievement, strong execution, strategic advantage",
    nature: "benefic",
  },
  {
    name: "Algol",
    tropicalLon: 30 + 26 + 41 / 60, // Taurus 26°41'
    orb: 0.8,
    meaning: "Crisis, loss of control, meltdowns, penalties, collapses",
    nature: "malefic",
  },
];

export function detectFixedStarsCoreList(planets: PlanetPosition[]): FixedStarActive[] {
  const active: FixedStarActive[] = [];

  for (const star of FIXED_STARS_CORE) {
    const activePlanets: Array<{ planet: string; separation: number }> = [];

    for (const planet of planets) {
      const planetLon = planet.eclipticLon;
      const sep = Math.abs(planetLon - star.eclipticLon);
      const minSep = Math.min(sep, 360 - sep);

      if (minSep <= star.orb) {
        activePlanets.push({
          planet: planet.name,
          separation: minSep,
        });
      }
    }

    if (activePlanets.length > 0) {
      active.push({
        name: star.name,
        tropicalLon: star.eclipticLon,
        orb: star.orb,
        meaning: star.meaning,
        nature: star.nature,
        activePlanets,
      });
    }
  }

  return active;
}
