import { shortestAngularDistance } from "./atlasDignities";

export const ATLAS_PHENOMENA_REGISTRY = {
  version: "atlas-phenomena-v1",
  retrograde: {
    sampleHalfWindowDays: 0.25,
    rule: "Geocentric tropical ecliptic-of-date longitude uses a 12-hour central difference; negative degrees/day is retrograde.",
  },
  kazimi: {
    thresholdDegrees: 0.5,
    rule: "Raw shortest tropical Sun–planet distance ≤ 0.5°; overrides the combustion display.",
  },
  planetaryWar: {
    participants: ["Mars", "Mercury", "Venus", "Jupiter", "Saturn"],
    thresholdDegrees: 1,
    rule: "Declared Graha Yuddha proximity: qualifying planet pair has raw shortest tropical distance ≤ 1.0°.",
  },
} as const;

export type AtlasMotion = {
  applicable: boolean;
  speedDegreesPerDay: number | null;
  isRetrograde: boolean;
  rule: string;
};

export type AtlasPlanetaryWar = {
  first: string;
  second: string;
  distance: number;
  threshold: number;
  rule: string;
};

const normalizeSigned = (value: number) => ((value + 540) % 360) - 180;

export function getAtlasMotion(longitudeBefore: number, longitudeAfter: number, elapsedDays: number): AtlasMotion {
  const speedDegreesPerDay = normalizeSigned(longitudeAfter - longitudeBefore) / elapsedDays;
  return {
    applicable: true,
    speedDegreesPerDay,
    isRetrograde: speedDegreesPerDay < 0,
    rule: ATLAS_PHENOMENA_REGISTRY.retrograde.rule,
  };
}

export function findAtlasPlanetaryWars(planets: Array<{ name: string; longitude: number }>): AtlasPlanetaryWar[] {
  const participants = new Set<string>(ATLAS_PHENOMENA_REGISTRY.planetaryWar.participants);
  const qualifying = planets.filter(planet => participants.has(planet.name));
  const wars: AtlasPlanetaryWar[] = [];
  for (let firstIndex = 0; firstIndex < qualifying.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < qualifying.length; secondIndex += 1) {
      const first = qualifying[firstIndex];
      const second = qualifying[secondIndex];
      if (!first || !second) continue;
      const distance = shortestAngularDistance(first.longitude, second.longitude);
      if (distance <= ATLAS_PHENOMENA_REGISTRY.planetaryWar.thresholdDegrees) {
        wars.push({
          first: first.name,
          second: second.name,
          distance,
          threshold: ATLAS_PHENOMENA_REGISTRY.planetaryWar.thresholdDegrees,
          rule: ATLAS_PHENOMENA_REGISTRY.planetaryWar.rule,
        });
      }
    }
  }
  return wars;
}
