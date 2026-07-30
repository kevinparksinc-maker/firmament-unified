/**
 * CLUSTER KNOWLEDGE LAYERS
 * ============================================================================
 * Generalizes rules originally written for L1-vs-L7 (sportsHorary.ts) into
 * Side-A-cluster-vs-Side-B-cluster form, per your explicit instruction:
 * evaluations are always cluster houses + their lords vs. the other cluster
 * houses + their lords — never a single house pair.
 *
 * Every function here takes the same ChartData + ClusterConfig shape
 * masterPredictionEngine.ts already uses, and returns a LayerBreakdown you
 * push into the same `breakdown` array. Nothing here reads chart.aspects
 * (which is currently always empty — see note at bottom) — angular
 * separation is computed directly from eclipticLon so these layers work
 * today without waiting on that fix.
 * ============================================================================
 */

import { SIGN_RULERS } from "./astroEngine";
import {
  findFixedStarConjunctions,
} from "./nakshatraStarEngine";
import type {
  ChartData,
  ClusterConfig,
  LayerBreakdown,
  SportsHoraryPlacement,
} from "./masterPredictionEngine";

// ─────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────

function whichSide(house: number, config: ClusterConfig): "A" | "B" | "neutral" {
  if (config.sideAHouses.includes(house)) return "A";
  if (config.sideBHouses.includes(house)) return "B";
  return "neutral";
}

const MALEFICS = new Set(["Saturn", "Mars", "Rahu", "Ketu", "Sun"]);
// ^ ASSUMPTION: standard Vedic malefic list including Sun. Drop "Sun" here
//   if your app treats it as neutral elsewhere — flag if so.

type AspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition" | "none";

/** Angular separation between two ecliptic longitudes, 0-180. */
function angularSeparation(lonA: number, lonB: number): number {
  const diff = Math.abs(lonA - lonB) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Classify aspect type by angular separation with standard orbs.
 *  NOTE: these orbs are a reasonable default (8° major, 6° minor) — adjust
 *  if your app has established orb conventions elsewhere I haven't seen. */
function classifyAspect(lonA: number, lonB: number): AspectType {
  const sep = angularSeparation(lonA, lonB);
  if (sep <= 8) return "conjunction";
  if (Math.abs(sep - 60) <= 6) return "sextile";
  if (Math.abs(sep - 90) <= 8) return "square";
  if (Math.abs(sep - 120) <= 8) return "trine";
  if (Math.abs(sep - 180) <= 8) return "opposition";
  return "none";
}

function getClusterLordPlacements(
  chart: ChartData,
  config: ClusterConfig,
  side: "A" | "B"
): SportsHoraryPlacement[] {
  return chart.houseLords
    .filter((l) => whichSide(l.house, config) === side)
    .map((l) => l.placement);
}

function findPlanet(chart: ChartData, name: string): SportsHoraryPlacement | undefined {
  return chart.planetsInHouses.find((p) => p.planet === name);
}

// ─────────────────────────────────────────────────────────────────────────
// 1. UPACHAYA GROWTH
// Malefics sitting in Side A's growth houses (3,6,10,11) vs Side B's
// (9,12,4,5) — this counts ALL malefic planets in those houses, not just
// lords, matching the scope of the original rule.
// ─────────────────────────────────────────────────────────────────────────
export function upachayaGrowthLayer(chart: ChartData, config: ClusterConfig): LayerBreakdown {
  let sideA = 0;
  let sideB = 0;
  for (const p of chart.planetsInHouses) {
    if (!MALEFICS.has(p.planet)) continue;
    const side = whichSide(p.house, config);
    if (side === "A") sideA += 1;
    else if (side === "B") sideB += 1;
  }
  return { layer: "Upachaya Growth", sideAPoints: sideA, sideBPoints: sideB };
}

// ─────────────────────────────────────────────────────────────────────────
// 2. VIA COMBUSTA
// Any cluster lord whose longitude falls 15°Libra-15°Scorpio (195°-225°
// ecliptic) is in the "burning path" — penalize their side.
// Magnitude: -3/lord (scaled down from the original -5 single-lord value,
// since up to 5 lords per side could now trigger this — adjust if needed).
// ─────────────────────────────────────────────────────────────────────────
export function viaCombustaLayer(chart: ChartData, config: ClusterConfig): LayerBreakdown {
  let sideA = 0;
  let sideB = 0;
  const VIA_COMBUSTA_START = 195; // 15° Libra
  const VIA_COMBUSTA_END = 225;   // 15° Scorpio

  for (const lord of chart.houseLords) {
    const lon = lord.placement.eclipticLon;
    const inVC = lon >= VIA_COMBUSTA_START && lon < VIA_COMBUSTA_END;
    if (!inVC) continue;
    const side = whichSide(lord.house, config);
    if (side === "A") sideA -= 3;
    else if (side === "B") sideB -= 3;
  }
  return { layer: "Via Combusta", sideAPoints: sideA, sideBPoints: sideB };
}

// ─────────────────────────────────────────────────────────────────────────
// 3. BESIEGEMENT
// Any cluster lord hemmed between Saturn and Mars by degree (within orb on
// both sides, regardless of which is closer/further in zodiacal order).
// Magnitude: -2/lord.
// ─────────────────────────────────────────────────────────────────────────
export function besiegementLayer(chart: ChartData, config: ClusterConfig): LayerBreakdown {
  let sideA = 0;
  let sideB = 0;
  const ORB = 8;

  const saturn = findPlanet(chart, "Saturn");
  const mars = findPlanet(chart, "Mars");
  if (!saturn || !mars) return { layer: "Besiegement", sideAPoints: 0, sideBPoints: 0 };

  for (const lord of chart.houseLords) {
    if (lord.lordPlanet === "Saturn" || lord.lordPlanet === "Mars") continue;
    const lon = lord.placement.eclipticLon;
    const nearSaturn = angularSeparation(lon, saturn.eclipticLon) <= ORB;
    const nearMars = angularSeparation(lon, mars.eclipticLon) <= ORB;
    if (!(nearSaturn && nearMars)) continue;
    const side = whichSide(lord.house, config);
    if (side === "A") sideA -= 2;
    else if (side === "B") sideB -= 2;
  }
  return { layer: "Besiegement", sideAPoints: sideA, sideBPoints: sideB };
}

// ─────────────────────────────────────────────────────────────────────────
// 4. MUTUAL RECEPTION
// Every Side A lord x Side B lord pair where each sits in a sign ruled by
// the other. Counts every qualifying pair (per your call).
// Magnitude: +2 to the pair's own side each — NEW value, original rule had
// no point value (it triggered a circuit-breaker instead). Adjust freely.
// ─────────────────────────────────────────────────────────────────────────
export function mutualReceptionLayer(chart: ChartData, config: ClusterConfig): LayerBreakdown {
  let sideA = 0;
  let sideB = 0;
  const aLords = chart.houseLords.filter((l) => whichSide(l.house, config) === "A");
  const bLords = chart.houseLords.filter((l) => whichSide(l.house, config) === "B");

  for (const a of aLords) {
    for (const b of bLords) {
      const aRulesBsSign = SIGN_RULERS[b.placement.sign] === a.lordPlanet;
      const bRulesAsSign = SIGN_RULERS[a.placement.sign] === b.lordPlanet;
      if (aRulesBsSign && bRulesAsSign) {
        sideA += 2;
        sideB += 2;
        // Mutual reception favors BOTH participants' sides — this is
        // intentional (a supportive exchange), not a one-sided win. If you
        // want it net-neutral instead (favor neither), say so.
      }
    }
  }
  return { layer: "Mutual Reception", sideAPoints: sideA, sideBPoints: sideB };
}

// ─────────────────────────────────────────────────────────────────────────
// 5. TRANSLATION OF LIGHT
// A third planet separating from one cluster lord and applying to a lord
// on the OTHER side translates influence to the receiving side.
// "Separating" / "applying" here is inferred purely from angular distance
// classification (not true speed/direction — see note below). Magnitude:
// reuse original ±3.
// ─────────────────────────────────────────────────────────────────────────
export function translationOfLightLayer(chart: ChartData, config: ClusterConfig): LayerBreakdown {
  let sideA = 0;
  let sideB = 0;
  const aLords = getClusterLordPlacements(chart, config, "A");
  const bLords = getClusterLordPlacements(chart, config, "B");
  const lordNames = new Set([...chart.houseLords.map((l) => l.lordPlanet)]);

  for (const planet of chart.planetsInHouses) {
    if (lordNames.has(planet.planet)) continue; // must be a THIRD planet, not itself a cluster lord

    // Find the CLOSEST Side A lord this planet actually aspects (if any).
    // One planet = one candidate per side, regardless of how many lords
    // that side has — prevents a side with more lords from generating
    // more combinatorial matches (and thus more points) for reasons that
    // have nothing to do with the strength of the transmission itself.
    let closestALord: (typeof aLords)[number] | null = null;
    let closestASep = Infinity;
    for (const aLord of aLords) {
      if (classifyAspect(planet.eclipticLon, aLord.eclipticLon) === "none") continue;
      const sep = angularSeparation(planet.eclipticLon, aLord.eclipticLon);
      if (sep < closestASep) {
        closestASep = sep;
        closestALord = aLord;
      }
    }

    // Same for the closest Side B lord.
    let closestBLord: (typeof bLords)[number] | null = null;
    let closestBSep = Infinity;
    for (const bLord of bLords) {
      if (classifyAspect(planet.eclipticLon, bLord.eclipticLon) === "none") continue;
      const sep = angularSeparation(planet.eclipticLon, bLord.eclipticLon);
      if (sep < closestBSep) {
        closestBSep = sep;
        closestBLord = bLord;
      }
    }

    // Only a genuine translation if the planet actually touches BOTH sides.
    if (!closestALord || !closestBLord) continue;

    // Translating light: touches both sides at once via real aspects.
    // Without true speed data we can't say which it's "leaving" vs
    // "approaching" — this flags the exchange and gives a small edge
    // to whichever side's lord it's currently closer to (tighter orb).
    // ONE vote per planet, not one per lord-pair combination.
    if (closestASep < closestBSep) sideA += 3;
    else sideB += 3;
  }
  return { layer: "Translation of Light", sideAPoints: sideA, sideBPoints: sideB };
}
// KNOWN LIMITATION: true applying/separating requires planetary daily-motion
// speed, which SportsHoraryPlacement doesn't currently carry. This is an
// approximation until that data exists upstream.

// ─────────────────────────────────────────────────────────────────────────
// 6. HARMONIOUS vs FRICTION ASPECTS (replaces the old applying/separating
// doctrine per your simplified framing)
// Every Side A lord x Side B lord pair: trine/sextile = harmonious (+1 to
// whichever side "receives" — split evenly since it's a shared aspect),
// square/opposition = friction (-1 each side). Conjunction excluded
// (already covered by territorial/dignity scoring).
// ─────────────────────────────────────────────────────────────────────────
export function harmoniousFrictionLayer(chart: ChartData, config: ClusterConfig): LayerBreakdown {
  let sideA = 0;
  let sideB = 0;
  const aLords = getClusterLordPlacements(chart, config, "A");
  const bLords = getClusterLordPlacements(chart, config, "B");

  for (const a of aLords) {
    for (const b of bLords) {
      const aspect = classifyAspect(a.eclipticLon, b.eclipticLon);
      if (aspect === "trine" || aspect === "sextile") {
        sideA += 1;
        sideB += 1;
      } else if (aspect === "square" || aspect === "opposition") {
        sideA -= 1;
        sideB -= 1;
      }
    }
  }
  return { layer: "Harmonious vs Friction Aspects", sideAPoints: sideA, sideBPoints: sideB };
}

// ─────────────────────────────────────────────────────────────────────────
// 7. REGULUS / ALGOL OVERRIDE
// Any cluster lord conjunct Regulus -> that side gets an override flag.
// Any cluster lord conjunct Algol -> that side gets a "doomed" flag.
// Per your earlier decision: NO extra raw points here (your Fixed Star
// layer already scores these conjunctions at royal-tier amplification —
// this only sets flags/verdict-override signals, no double-counting).
// ─────────────────────────────────────────────────────────────────────────
export interface OverrideFlags {
  regulusSide: "A" | "B" | "both" | null;
  algolSide: "A" | "B" | "both" | null;
}

export function regulusAlgolOverrides(chart: ChartData, config: ClusterConfig): OverrideFlags {
  let regulusA = false, regulusB = false, algolA = false, algolB = false;

  for (const lord of chart.houseLords) {
    const conjunctions = findFixedStarConjunctions(lord.placement.eclipticLon, 1.0);
    const side = whichSide(lord.house, config);
    if (side === "neutral") continue;
    for (const star of conjunctions) {
      if (star.starName === "Regulus") {
        if (side === "A") regulusA = true; else regulusB = true;
      }
      if (star.starName === "Algol") {
        if (side === "A") algolA = true; else algolB = true;
      }
    }
  }

  const resolve = (a: boolean, b: boolean): "A" | "B" | "both" | null =>
    a && b ? "both" : a ? "A" : b ? "B" : null;

  return {
    regulusSide: resolve(regulusA, regulusB),
    algolSide: resolve(algolA, algolB),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 8. NODES (Rahu/Ketu) — cluster-vs-cluster placement scoring
// Generalizes NodeEngine off L1/L7 entirely: scores Rahu/Ketu by which
// cluster house they occupy, same base+placement scale as Arabic Lots.
// Requires "Rahu"/"Ketu" to exist as keys in the raw chart object handed to
// buildChartData() — confirm your chart-text parser / askWithChart payload
// actually includes them (ephemeris.ts already computes them, so this is a
// plumbing check, not new astronomy).
// ─────────────────────────────────────────────────────────────────────────
export function nodeLayer(chart: ChartData, config: ClusterConfig): LayerBreakdown {
  let sideA = 0;
  let sideB = 0;
  const rahu = findPlanet(chart, "Rahu");
  const ketu = findPlanet(chart, "Ketu");

  const scoreNode = (node: SportsHoraryPlacement | undefined): [number, number] => {
    if (!node) return [0, 0];
    const side = whichSide(node.house, config);
    if (side === "neutral") return [0, 0];
    const isAngular = [1, 4, 7, 10].includes(node.house);
    const points = isAngular ? 2 : 1; // simple scale — Rahu/Ketu aren't lords, so no base/placement split
    return side === "A" ? [points, 0] : [0, points];
  };

  const [rA, rB] = scoreNode(rahu);
  const [kA, kB] = scoreNode(ketu);
  sideA = rA + kA;
  sideB = rB + kB;

  return { layer: "Nodes (Rahu/Ketu)", sideAPoints: sideA, sideBPoints: sideB };
}
