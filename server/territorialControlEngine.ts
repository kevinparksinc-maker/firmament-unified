/**
 * TERRITORIAL CONTROL ENGINE
 *
 * Evaluates where each house lord sits relative to its own cluster territory.
 * A lord in its own cluster territory = favorable.
 * A lord in opponent's cluster = compromised/weakened.
 *
 * Two clusters:
 *   - Ascendant (Side A): houses 1, 3, 6, 10, 11 + their lords
 *   - Descendant (Side B): houses 7, 9, 12, 4, 5 + their lords
 *
 * Scoring is fully additive, no multipliers:
 *   score = base + nakshatra_modifier + dignity_modifier + arabic_lots_modifier + planetary_war_modifier
 */

import type { PlanetPlacement } from "./astroEngine";
import { SIGN_RULERS, EXALTATIONS, DEBILITATIONS, SIGN_ORDER } from "./astroEngine";
import { getNakshatraAt, type Nakshatra } from "./nakshatra";
import { NAKSHATRAS, type NakshatraProfile } from "./nakshatraData";
import { detectPlanetaryWar, type PlanetaryWar } from "./patternEngine";
import { SIDE_A_HOUSES, SIDE_B_HOUSES, ANGULAR_HOUSES } from "./houseScoringConstants";
import { isNight, calculateCanonicalArabicLots, getCanonicalDignityScore } from "./astrologyCore";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface HouseLordEvaluation {
  houseNumber: number;
  lord: string;
  lordSign: string;
  lordHouse: number | null;
  baseScore: number;
  nakshatraName: string;
  nakshatraModifier: number;
  dignityScore: number;
  arabicLotsScore: number;
  planetaryWarScore: number;
  totalScore: number;
}

export interface HouseAuditEntry {
  house: number;
  cuspSign: string;
  lordPlanet: string | null;
  lordSign: string | null;
  lordHouse: number | null;
}

export interface TerritorialControlResult {
  sideAEvals: HouseLordEvaluation[];
  sideBEvals: HouseLordEvaluation[];
  sideATotal: number;
  sideBTotal: number;
  planetaryWars: PlanetaryWar[];
  arabicLots?: Array<{ name: string; sign: string; sideInfluence: "A" | "B" | "neutral" }>;
  summary: string;
  ascendant?: number;
  houseAudit?: HouseAuditEntry[];
}

// ─── HELPER: Determine which side a house belongs to ────────────────────────

function getSide(house: number): "A" | "B" | null {
  if (SIDE_A_HOUSES.includes(house as any)) return "A";
  if (SIDE_B_HOUSES.includes(house as any)) return "B";
  return null;
}

// ─── HELPER: Convert nakshatra profile to additive modifier ─────────────────

function getNakshatraAdditiveModifier(profile: NakshatraProfile): number {
  // Map trait levels to point values (increased weight for greater impact)
  const traitToPoints = (trait: string): number => {
    switch (trait) {
      case "Excellent":
        return 1.5;
      case "High":
        return 0.75;
      case "Medium":
        return 0;
      case "Low":
        return -0.75;
      default:
        return 0;
    }
  };

  const traits = [
    profile.initiative,
    profile.pressureResponse,
    profile.consistency,
    profile.finishingAbility,
  ];

  const points = traits.map(traitToPoints);
  const average = points.reduce((a, b) => a + b, 0) / points.length;

  return average;
}

// ─── HELPER: Calculate dignity score for a planet in a sign ──────────────────

// Removed getDignityScore in favor of astrologyCore.getCanonicalDignityScore

// ─── MAIN: Calculate territorial control for all house lords ────────────────

export function calculateTerritorialControl(
  planets: Record<string, PlanetPlacement>,
  houseLords: Map<number, string>,
  ascendant?: number,
  houseAudit?: HouseAuditEntry[]
): TerritorialControlResult {
  const sideAEvals: HouseLordEvaluation[] = [];
  const sideBEvals: HouseLordEvaluation[] = [];

  // No silent fallback: an ascendant of 0 (Aries rising) is a real, specific
  // chart, not a safe default. If we don't have one, lots simply don't run —
  // same "fail visibly" behavior as the rest of the pipeline.
  const hasAscendant = ascendant !== undefined;
  const asc = ascendant ?? 0;

  // Calculate Arabic lots ONCE, here, up front.
  let arabicLots: Array<{ name: string; sign: string; sideInfluence: "A" | "B" | "neutral" }> = [];
  // Net lots-layer contribution per side — computed once and applied once,
  // instead of being recalculated and re-added inside every house-lord's score.
  const lotsSideTotal = { A: 0, B: 0 };

  if (hasAscendant && houseAudit) {
    try {
      // Use unified sect and lot calculation
      const sunHouse = planets.Sun?.house ?? 1;
      const night = isNight(sunHouse);
      
      // Get house cusps from houseAudit for canonical lot assignment
      const houseCusps = houseAudit.map(h => {
        const signIdx = SIGN_ORDER.indexOf(h.cuspSign);
        return (signIdx * 30) + (h.house === 1 ? (asc % 30) : 0); // Approximation if exact cusp degree is missing
      });

      const lots = calculateCanonicalArabicLots(planets as any, asc, night, houseCusps);

      arabicLots = lots.map(lot => {
        const lotSide = getSide(lot.house);

        // REDUCED WEIGHT: Supporting signals (1-2 points)
        const isAngular = [1, 4, 7, 10].includes(lot.house);
        const points = isAngular ? 2 : 1;

        if (lot.name === "Nemesis") {
          if (lotSide === "A") lotsSideTotal.A -= points;
          else if (lotSide === "B") lotsSideTotal.B -= points;
        } else {
          if (lotSide === "A") lotsSideTotal.A += points;
          else if (lotSide === "B") lotsSideTotal.B += points;
        }

        return {
          name: lot.name,
          sign: lot.sign,
          sideInfluence: lotSide ?? "neutral",
        };
      });
    } catch (e) {
      // Lots calculation failed, continue without them
    }
  }

  // Detect planetary wars for war modifiers
  const wars = detectPlanetaryWar(planets);
  const warMap = new Map<string, { isWinner: boolean; isLoser: boolean }>();

  for (const war of wars) {
    if (!warMap.has(war.winner)) {
      warMap.set(war.winner, { isWinner: false, isLoser: false });
    }
    if (!warMap.has(war.loser)) {
      warMap.set(war.loser, { isWinner: false, isLoser: false });
    }
    warMap.get(war.winner)!.isWinner = true;
    warMap.get(war.loser)!.isLoser = true;
  }

  // Evaluate each house lord
  for (let house = 1; house <= 12; house++) {
    const lord = houseLords.get(house);
    if (!lord) continue;

    const lordPlacement = planets[lord];
    if (!lordPlacement) continue;

    const houseSide = getSide(house);
    if (!houseSide) continue;

    // ─── BASE SCORE ────────────────────────────────────────────────

    let baseScore = 0;
    const lordHouseSide = lordPlacement.house ? getSide(lordPlacement.house) : null;

    if (lordHouseSide === houseSide) {
      // Lord is in own cluster territory
      baseScore += 1;

      // Bonus: lord in exact own house
      if (lordPlacement.house === house) {
        baseScore += 1;
      }
    } else if (lordHouseSide) {
      // Lord is in opponent's cluster territory
      baseScore -= 2; // INCREASED PENALTY: Displaced lord loses more to prioritize territory foundation

      // Extra penalty: lord is on opponent's angle
      if (lordPlacement.house && ANGULAR_HOUSES.includes(lordPlacement.house)) {
        baseScore -= 2; // Extra weight for angular displacement
      }
    }

    // ─── NAKSHATRA MODIFIER ────────────────────────────────────────

    const { nakshatra } = getNakshatraAt(
      lordPlacement.eclipticLon ?? 0
    );
    const nakshatraProfile = NAKSHATRAS[nakshatra.name] || Object.values(NAKSHATRAS)[0] || {
      name: "default",
      pace: "Moderate",
      style: "Balanced",
      temperament: "Stoic",
      initiative: "Medium",
      pressureResponse: "Medium",
      consistency: "Medium",
      adaptability: "Medium",
      finishingAbility: "Medium",
    };
    const nakshatraModifier = getNakshatraAdditiveModifier(nakshatraProfile);

    // ─── DIGNITY MODIFIER ──────────────────────────────────────────

    const dignityScore = getCanonicalDignityScore(lord, lordPlacement.sign).score;

    // ─── ARABIC LOTS MODIFIER ─────────────────────────────────────
    // NOTE: lots are intentionally NOT scored per-house-lord here anymore.
    // They used to be recomputed and re-applied inside this loop, which
    // meant the same lots signal got added once per house-lord (5 times
    // per side) instead of once overall — a ~5x amplification bug.
    // The real lots contribution is added once, after this loop, from
    // lotsSideTotal.
    const arabicLotsScore = 0;

    // ─── PLANETARY WAR MODIFIER ───────────────────────────────────

    let planetaryWarScore = 0;
    const warStatus = warMap.get(lord);

    if (warStatus?.isWinner) {
      planetaryWarScore += 1;
    } else if (warStatus?.isLoser) {
      planetaryWarScore -= 1;
    }

    // ─── TOTAL SCORE ──────────────────────────────────────────────

    const totalScore =
      baseScore + nakshatraModifier + dignityScore + arabicLotsScore + planetaryWarScore;

    const evaluation: HouseLordEvaluation = {
      houseNumber: house,
      lord,
      lordSign: lordPlacement.sign,
      lordHouse: lordPlacement.house,
      baseScore,
      nakshatraName: nakshatra.name,
      nakshatraModifier,
      dignityScore,
      arabicLotsScore,
      planetaryWarScore,
      totalScore,
    };

    if (houseSide === "A") {
      sideAEvals.push(evaluation);
    } else {
      sideBEvals.push(evaluation);
    }
  }

  // Lots contribute ONCE per side here — not per house-lord (see note above).
  // A benefic lot in a side's territory is +1 for that side only.
  const sideATotal =
    sideAEvals.reduce((sum, e) => sum + e.totalScore, 0) + lotsSideTotal.A;
  const sideBTotal =
    sideBEvals.reduce((sum, e) => sum + e.totalScore, 0) + lotsSideTotal.B;

  const summary = `Side A (Ascendant): ${sideATotal > 0 ? "+" : ""}${sideATotal} | Side B (Descendant): ${sideBTotal > 0 ? "+" : ""}${sideBTotal}`;

  return {
    sideAEvals,
    sideBEvals,
    sideATotal,
    sideBTotal,
    planetaryWars: wars,
    arabicLots: arabicLots.length > 0 ? arabicLots : undefined,
    summary,
    ascendant,
    houseAudit,
  };
}

// ─── FORMATTING: Human-readable report ────────────────────────────────────

export function formatTerritorialReport(
  result: TerritorialControlResult
): string {
  const lines: string[] = [];

  // ─── ASCENDANT & HOUSE LORD AUDIT ────────────────────────────────
  // Shows exactly what the engine used to derive everything below:
  // the Ascendant, each house's cusp sign, who rules it, and where
  // that ruler is actually sitting right now.
  if (result.ascendant !== undefined) {
    const ascSignIdx = Math.floor(((result.ascendant % 360) + 360) % 360 / 30);
    const ascDeg = ((result.ascendant % 360) + 360) % 360 % 30;
    lines.push(`▌ ASCENDANT: ${ascDeg.toFixed(2)}° ${["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"][ascSignIdx]}`);
  } else {
    lines.push("▌ ASCENDANT: not available — house lords and lots could not be computed");
  }
  lines.push("");

  if (result.houseAudit && result.houseAudit.length > 0) {
    lines.push("▌ HOUSE LORDS (cusp sign → ruling planet → where it's currently sitting)");
    for (const h of result.houseAudit) {
      const lordDesc = h.lordPlanet
        ? `${h.lordPlanet} → currently in ${h.lordSign ?? "?"} (House ${h.lordHouse ?? "?"})`
        : "no ruler found";
      lines.push(`  H${h.house.toString().padEnd(2)} cusp: ${h.cuspSign.padEnd(11)} lord: ${lordDesc}`);
    }
    lines.push("");
  }

  // ─── VERDICT ──────────────────────────────────────────────────────
  const swing = result.sideBTotal - result.sideATotal;
  const winner = swing > 0 ? "Side B" : swing < 0 ? "Side A" : "Tied";

  // VERDICT at top
  lines.push("╔════════════════════════════════════════════╗");
  lines.push(`║  VERDICT: ${winner.padEnd(32)}║`);
  lines.push(`║  A: ${result.sideATotal.toFixed(1).padStart(6)} | B: ${result.sideBTotal.toFixed(1).padStart(6)} | Swing: ${swing.toFixed(1).padStart(6)}  ║`);
  lines.push("╚════════════════════════════════════════════╝");
  lines.push("");

  // SIDE A
  lines.push("▌ ASCENDANT CLUSTER (Side A)");
  if (result.sideAEvals.length === 0) {
    lines.push("  (no lords)");
  } else {
    for (const e of result.sideAEvals) {
      const lordHouseStr = e.lordHouse ? `H${e.lordHouse}` : "—";
      const breakdown = `[base:${e.baseScore > 0 ? "+" : ""}${e.baseScore.toFixed(0)} nak:${e.nakshatraModifier > 0 ? "+" : ""}${e.nakshatraModifier.toFixed(2)} dign:${e.dignityScore > 0 ? "+" : ""}${e.dignityScore} lots:${e.arabicLotsScore > 0 ? "+" : ""}${e.arabicLotsScore} war:${e.planetaryWarScore > 0 ? "+" : ""}${e.planetaryWarScore}]`;
      lines.push(
        `  H${e.houseNumber} ${e.lord.padEnd(9)} ${e.lordSign.padEnd(9)} (${lordHouseStr}) ${breakdown}`
      );
      lines.push(`       TOTAL = ${e.totalScore > 0 ? "+" : ""}${e.totalScore.toFixed(2)}`);
    }
  }
  lines.push("");

  // SIDE B
  lines.push("▌ DESCENDANT CLUSTER (Side B)");
  if (result.sideBEvals.length === 0) {
    lines.push("  (no lords)");
  } else {
    for (const e of result.sideBEvals) {
      const lordHouseStr = e.lordHouse ? `H${e.lordHouse}` : "—";
      const breakdown = `[base:${e.baseScore > 0 ? "+" : ""}${e.baseScore.toFixed(0)} nak:${e.nakshatraModifier > 0 ? "+" : ""}${e.nakshatraModifier.toFixed(2)} dign:${e.dignityScore > 0 ? "+" : ""}${e.dignityScore} lots:${e.arabicLotsScore > 0 ? "+" : ""}${e.arabicLotsScore} war:${e.planetaryWarScore > 0 ? "+" : ""}${e.planetaryWarScore}]`;
      lines.push(
        `  H${e.houseNumber} ${e.lord.padEnd(9)} ${e.lordSign.padEnd(9)} (${lordHouseStr}) ${breakdown}`
      );
      lines.push(`       TOTAL = ${e.totalScore > 0 ? "+" : ""}${e.totalScore.toFixed(2)}`);
    }
  }
  lines.push("");

  // WARS
  lines.push("▌ PLANETARY WARS");
  if (result.planetaryWars.length === 0) {
    lines.push("  (none detected)");
  } else {
    for (const war of result.planetaryWars) {
      lines.push(`  ${war.winner} defeats ${war.loser} (${war.degreeDiff.toFixed(2)}°)`);
    }
  }
  lines.push("");

  // LOTS
  lines.push("▌ ARABIC LOTS");
  if (result.arabicLots && result.arabicLots.length > 0) {
    for (const lot of result.arabicLots) {
      const influence = lot.sideInfluence === "A" ? "→ A ✓" : lot.sideInfluence === "B" ? "→ B ✓" : "→ neutral";
      lines.push(`  ${lot.name.padEnd(18)} in ${lot.sign.padEnd(11)} ${influence}`);
    }
  } else {
    lines.push("  (none calculated)");
  }
  lines.push("");

  // FINAL TALLY
  lines.push("═══════════════════════════════════════════════");
  lines.push(`  SIDE A TOTAL: ${result.sideATotal > 0 ? "+" : ""}${result.sideATotal.toFixed(2)}`);
  lines.push(`  SIDE B TOTAL: ${result.sideBTotal > 0 ? "+" : ""}${result.sideBTotal.toFixed(2)}`);
  lines.push(`  SWING: ${(swing > 0 ? "+" : "")}${swing.toFixed(2)} (${winner} favored)`);
  lines.push("═══════════════════════════════════════════════");

  return lines.join("\n");
}
