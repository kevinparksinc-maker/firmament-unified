export interface Aspect {
  planet1: string;
  planet2: string;
  aspect: "conjunction" | "opposition" | "square" | "trine" | "sextile";
  angle: number;
  orb: number;
  exact: boolean;
}

const ASPECTS = [
  { name: "conjunction", angle: 0, orb: 8, weight: 1.0 },
  { name: "opposition", angle: 180, orb: 8, weight: 0.85 },
  { name: "square", angle: 90, orb: 7, weight: 0.72 },
  { name: "trine", angle: 120, orb: 7, weight: 0.6 },
  { name: "sextile", angle: 60, orb: 5, weight: 0.45 },
];

export function detectAspects(
  placements: Record<string, { absolute: number; planet: string }>
): Aspect[] {
  const aspects: Aspect[] = [];
  const planets = Object.entries(placements);

  for (let i = 0; i < planets.length; i++) {
    const [name1, p1] = planets[i];
    for (let j = i + 1; j < planets.length; j++) {
      const [name2, p2] = planets[j];
      let diff = Math.abs(p1.eclipticLon - p2.eclipticLon) % 360;
      if (diff > 180) diff = 360 - diff;

      for (const asp of ASPECTS) {
        if (Math.abs(diff - asp.angle) <= asp.orb) {
          aspects.push({
            planet1: name1,
            planet2: name2,
            aspect: asp.name as any,
            angle: asp.angle,
            orb: Math.abs(diff - asp.angle),
            exact: Math.abs(diff - asp.angle) <= 1,
          });
          break;
        }
      }
    }
  }
  return aspects.sort((a, b) => a.orb - b.orb);
}
