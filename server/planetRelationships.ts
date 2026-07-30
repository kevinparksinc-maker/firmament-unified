/**
 * VEDIC PLANET FRIENDSHIP & ENMITY MATRIX
 *
 * Implements Nisargika Graha Mitrata (Natural Planetary Friendships)
 * When Sign Lord and Nakshatra Lord interact, their relationship determines mechanical friction.
 *
 * FRICTION MULTIPLIERS:
 * - Harmonious (Same Planet or Friends): 1.10x
 * - Neutral: 1.00x
 * - Conflicting (Enemies): 0.90x
 *
 * This models the physical interference between the macro (30° sign) and micro (13°20' nakshatra) environments.
 */

export type PlanetName = "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn" | "Rahu" | "Ketu";

// ─────────────────────────────────────────────────────────────────────────
// VEDIC FRIENDSHIP & ENMITY MAPS
// ─────────────────────────────────────────────────────────────────────────

const VEDIC_FRIENDS: Record<PlanetName, Set<PlanetName>> = {
  Sun: new Set(["Moon", "Mars", "Jupiter"]),
  Moon: new Set(["Sun", "Mercury"]),
  Mars: new Set(["Sun", "Moon", "Jupiter"]),
  Mercury: new Set(["Sun", "Venus"]),
  Jupiter: new Set(["Sun", "Moon", "Mars"]),
  Venus: new Set(["Mercury", "Saturn"]),
  Saturn: new Set(["Mercury", "Venus"]),
  Rahu: new Set([]),
  Ketu: new Set([]),
};

const VEDIC_ENEMIES: Record<PlanetName, Set<PlanetName>> = {
  Sun: new Set(["Venus", "Saturn"]),
  Moon: new Set([]), // Moon holds no natural enmities
  Mars: new Set(["Mercury"]),
  Mercury: new Set(["Moon"]),
  Jupiter: new Set(["Mercury", "Venus"]),
  Venus: new Set(["Sun", "Moon"]),
  Saturn: new Set(["Sun", "Moon", "Mars"]),
  Rahu: new Set([]),
  Ketu: new Set([]),
};

// ─────────────────────────────────────────────────────────────────────────
// FRICTION MULTIPLIER CALCULATION
// ─────────────────────────────────────────────────────────────────────────

export interface FrictionResult {
  multiplier: number;
  status: string;
}

/**
 * Calculate the geometric friction multiplier between Sign Lord and Nakshatra Lord.
 *
 * When a planet acts through a nakshatra ruled by a different planet than the sign it's in,
 * the two lordships create either harmonious alignment or mechanical friction.
 *
 * @param signLord The planet ruling the broader 30-degree zodiac sign (macro environment)
 * @param nakshatraLord The planet ruling the underlying 13°20' lunar mansion (micro environment)
 * @returns Object with multiplier and human-readable status
 */
export function getSignNakshatraFriction(
  signLord: PlanetName | string,
  nakshatraLord: PlanetName | string
): FrictionResult {
  const sign = (signLord as PlanetName) || "Sun";
  const nak = (nakshatraLord as PlanetName) || "Sun";

  // 1. Perfect alignment: same planet rules both macro and micro
  if (sign === nak) {
    return {
      multiplier: 1.1,
      status: "Perfect Alignment (Self-Rule)",
    };
  }

  // 2. Harmonious: Sign Lord considers Nakshatra Lord a friend
  if (VEDIC_FRIENDS[sign]?.has(nak)) {
    return {
      multiplier: 1.1,
      status: "Harmonious (Friends)",
    };
  }

  // 3. Conflicting: Sign Lord considers Nakshatra Lord an enemy
  if (VEDIC_ENEMIES[sign]?.has(nak)) {
    return {
      multiplier: 0.9,
      status: "Conflicting (Enemies)",
    };
  }

  // 4. Default: No inherent relationship
  return {
    multiplier: 1.0,
    status: "Neutral",
  };
}

/**
 * Get a simple string description of the relationship
 */
export function describeFrictionStatus(signLord: PlanetName | string, nakshatraLord: PlanetName | string): string {
  const result = getSignNakshatraFriction(signLord, nakshatraLord);
  return `${signLord} ↔ ${nakshatraLord}: ${result.status} (${result.multiplier.toFixed(2)}x)`;
}

// Exports for reference
export const VEDIC_FRIENDS_MAP = VEDIC_FRIENDS;
export const VEDIC_ENEMIES_MAP = VEDIC_ENEMIES;
