/**
 * MASTER PREDICTION ENGINE — Canonical Territorial Rules
 *
 * Single source of truth for all scoring. Implements the symmetric,
 * planet-agnostic territorial model per CANONICAL_TERRITORIAL_RULES.md.
 *
 * Core principle: A house lord's credit is determined by WHERE IT PHYSICALLY SITS,
 * never by which house it rules on paper. Dignity scales strength, never decides
 * which side receives credit.
 */

import { SIGN_RULERS, EXALTATIONS, DEBILITATIONS, SIGN_ORDER } from "./astroEngine";
import { NAKSHATRAS, calculateNakshatraModifier } from "./nakshatraData";
import { SIDE_A_HOUSES, SIDE_B_HOUSES } from "./houseScoringConstants";
import {
  getNakshatraLord,
  getNakshatraDignity,
  getFixedStarAmplification,
  getNakshatraLordStrength,
  findFixedStarConjunctions,
} from "./nakshatraStarEngine";
import { getSignNakshatraFriction, PlanetName } from "./planetRelationships";
import { buildPlanarHouseSystem } from "./planarHouseSystem";
import { 
  isNight, 
  calculateCanonicalArabicLots, 
  getCanonicalDignityScore,
  calculateTopocentricHouse 
} from "./astrologyCore";
import {
  upachayaGrowthLayer,
  viaCombustaLayer,
  besiegementLayer,
  mutualReceptionLayer,
  translationOfLightLayer,
  harmoniousFrictionLayer,
  regulusAlgolOverrides,
  nodeLayer,
} from "./clusterKnowledgeLayers";
import { kpDecisionLayer } from "./kpEngine";

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────

type HouseType = "angular" | "succedent" | "cadent";
type Rating = "Low" | "Medium" | "High" | "Excellent";
type DignityStatus = "exalted" | "own" | "neutral" | "debilitated";

export interface SportsHoraryPlacement {
  planet: string;
  house: number;
  sign: string;
  degree: number;
  eclipticLon: number;
  isRetrograde: boolean;
  nakshatra?: string; // 27 lunar mansions
}

export interface HouseLord {
  house: number;
  lordPlanet: string;
  placement: SportsHoraryPlacement;
}

export interface ArabicLot {
  name: string;
  house: number;
  sign: string;
  degree: number;
  longitude?: number;
  meaning?: string;
  formula?: string;
}

export interface FixedStarConjunction {
  starName: string;
  conjunctPlanet: string;
  orb: number;
  nature: "benefic" | "malefic";
}

export interface AspectData {
  planetA: string;
  planetB: string;
  aspectType: "conjunction" | "sextile" | "square" | "trine" | "opposition";
  applying: boolean;
}

export interface MoonData {
  phase: "new" | "waxing" | "full" | "waning";
  isVoidOfCourse: boolean;
  nakshatra: string;
}

export interface HouseAuditEntry {
  house: number;
  cuspSign: string;
  lordPlanet: string | null;
  lordSign: string | null;
  lordHouse: number | null;
}

export interface ChartData {
  houseLords: HouseLord[];
  houseAudit?: HouseAuditEntry[];
  planetsInHouses: SportsHoraryPlacement[];
  lots: ArabicLot[];
  fixedStars: FixedStarConjunction[];
  aspects: AspectData[];
  moon: MoonData;
}

export interface ClusterConfig {
  sideAHouses: number[];
  sideBHouses: number[];
  sideALabel: string;
  sideBLabel: string;
  fixedDomeMode?: boolean; // Enable stationary Earth / topocentric houses
}

export interface LayerBreakdown {
  layer: string;
  sideAPoints: number;
  sideBPoints: number;
}

export interface PredictionResult {
  breakdown: LayerBreakdown[];
  sideATotal: number;
  sideBTotal: number;
  margin: number;
  predictedWinner: "A" | "B" | "too close to call";
  confidence: number;
  volatilityWarning: string;
  regulusOverride: "A" | "B" | "both" | null;
  algolOverride: "A" | "B" | "both" | null;
}

// ─────────────────────────────────────────────────────────────────────────
// CORE SCORING FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────

function getHouseType(house: number): HouseType {
  if ([1, 4, 7, 10].includes(house)) return "angular";
  if ([2, 5, 8, 11].includes(house)) return "succedent";
  return "cadent";
}

function getBasePoints(house: number): number {
  // Balanced point scale prioritizing victory houses (1, 6, 11)
  switch (house) {
    case 1: return 8; // The Rising Side
    case 6: return 7; // The House of Victory
    case 11: return 6; // The House of Gains
    case 10: return 5; // The Peak
    case 7: return 5; // The Setting Side
    case 4: return 4; // The Bottom
    case 5: return 4; // Speculative gains
    case 9: return 3; // Fortune
    case 3: return 3; // Communication
    case 12: return 2; // Losses (cadent)
    case 2: return 2; // Assets
    case 8: return 2; // Adversity
    default: return 2;
  }
}

function getPlacementBonus(house: number): number {
  // Bonus to the side currently occupying the house (beyond base points)
  // Stronger occupation = more advantage
  const type = getHouseType(house);
  switch (type) {
    case "angular": return 1;
    case "succedent": return 0;
    case "cadent": return -1;
  }
}

function whichSide(house: number, config: ClusterConfig): "A" | "B" | "neutral" {
  if (config.sideAHouses.includes(house)) return "A";
  if (config.sideBHouses.includes(house)) return "B";
  return "neutral";
}

/**
 * Assign house numbers to Arabic Lots based on their longitude
 */
// Removed assignHousesToLots in favor of astrologyCore.assignLotToHouse

function getDignityStatus(placement: SportsHoraryPlacement): DignityStatus {
  const planet = placement.planet;
  const sign = placement.sign;

  if (EXALTATIONS[planet] === sign) return "exalted";
  if (DEBILITATIONS[planet] === sign) return "debilitated";
  if (SIGN_RULERS[sign] === planet) return "own";

  return "neutral";
}

function dignityScore(placement: SportsHoraryPlacement): number {
  return getCanonicalDignityScore(placement.planet, placement.sign).score;
}

function nakshatraScore(nakshatraName: string): number {
  const profile = NAKSHATRAS[nakshatraName];
  if (!profile) return 0;
  // Map nakshatra traits to additive points
  const traitToPoints = (trait: string): number => {
    switch (trait) {
      case "Excellent": return 1.5;
      case "High": return 0.75;
      case "Medium": return 0;
      case "Low": return -0.75;
      default: return 0;
    }
  };
  const traits = [profile.initiative, profile.pressureResponse, profile.consistency, profile.finishingAbility];
  const points = traits.map(traitToPoints);
  return points.reduce((a, b) => a + b, 0) / points.length;
}

function temperamentVolatility(nakshatraName: string): number {
  const profile = NAKSHATRAS[nakshatraName];
  if (!profile) return 0;
  switch (profile.temperament) {
    case "Stoic": return 0;
    case "Emotional": return 0.1;
    case "Volatile": return 0.2;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN ORCHESTRATION — CANONICAL RULES
// ─────────────────────────────────────────────────────────────────────────

export function calculateFullPrediction(chart: ChartData, config: ClusterConfig): PredictionResult {
  // ──── PRE-FLIGHT: FIXED DOME / STATIONARY EARTH OVERRIDE
  if (config.fixedDomeMode) {
    // Re-assign each planet's HOUSE based on its azimuth (observer-relative —
    // this is legitimate, houses rotate with the sky as seen from a given
    // place/time). Do NOT touch sign or degree here: those come only from
    // the planet's ecliptic longitude on the fixed firmament grid and must
    // never be recalculated from azimuth. A planet's sign never drifts with
    // time of day or observer location — only its house does.
    chart.planetsInHouses = chart.planetsInHouses.map(p => {
      if (p.azimuth !== undefined) {
        const topo = calculateTopocentricHouse(p.azimuth);
        return { ...p, house: topo.house };
      }
      return p;
    });

    // Re-assign house lords based on fixed 30-degree azimuth segments
    // In a fixed dome, House 1 is always 0-30 deg Azimuth, etc.
    chart.houseLords = chart.houseLords.map(l => {
      const placement = chart.planetsInHouses.find(p => p.planet === l.lordPlanet);
      if (placement) {
        return { ...l, house: placement.house, placement };
      }
      return l;
    });

    // Fix house cusps to 30-degree increments for Arabic Lot assignment
    chart.houses = Array.from({ length: 12 }, (_, i) => ({ house: i + 1, degree: i * 30 }));
  }

  const breakdown: LayerBreakdown[] = [];

  // ──── LAYER 1: TERRITORIAL SCORING (Canonical Rules)
  // Per the canonical rules: A lord occupying opponent territory means:
  // - Displaced side loses BASE POINTS (no multipliers on loss)
  // - Controlling side gains BASE+PLACEMENT, multiplied by dignity+nakshatra+stars
  let sideATotal = 0;
  let sideBTotal = 0;

  // Track which lords are displaced for the multiple-displacement penalty
  const displaceCount = { A: new Set<string>(), B: new Set<string>() };

  for (const lord of chart.houseLords) {
    const ruledSide = whichSide(lord.house, config); // Which side this lord RULES
    const occupiedHouse = lord.placement.house;
    const occupiedSide = whichSide(occupiedHouse, config); // Where the lord IS SITTING

    // H2 and H8 are neutral — never scored
    if (ruledSide === "neutral") continue;

    // If sitting in neutral territory, no points
    if (occupiedSide === "neutral") continue;

    const basePoints = getBasePoints(occupiedHouse);
    const placementBonus = getPlacementBonus(occupiedHouse);
    const dScore = dignityScore(lord.placement);
    const nScore = nakshatraScore(lord.placement.nakshatra);

    // Friction Modifier: Sign Lord ↔ Nakshatra Lord relationship
    const signLord = SIGN_RULERS[lord.placement.sign] as PlanetName || "Sun";
    const nakshatraLord = getNakshatraLord(lord.placement.nakshatra) as PlanetName || "Sun";
    const frictionResult = getSignNakshatraFriction(signLord, nakshatraLord);
    const frictionScore = (frictionResult.multiplier - 1) * 2; // Convert 0.9-1.1x to -0.2 to +0.2

    // Additive scoring: base + placement + all modifiers
    const controllingGain = basePoints + placementBonus + dScore + nScore + frictionScore;

    if (occupiedSide === "A") {
      sideATotal += controllingGain;

      if (ruledSide === "B") {
        // Side B lord is displaced into Side A territory
        sideBTotal -= (basePoints * 1.5); // INCREASED PENALTY: Displaced lords lose more to prioritize territory foundation
        displaceCount.B.add(lord.lordPlanet);
      }
    } else {
      sideBTotal += controllingGain;

      if (ruledSide === "A") {
        // Side A lord is displaced into Side B territory
        sideATotal -= (basePoints * 1.5); // INCREASED PENALTY: Displaced lords lose more to prioritize territory foundation
        displaceCount.A.add(lord.lordPlanet);
      }
    }
  }

  // ──── MULTIPLE-DISPLACEMENT PENALTY
  // Each additional displaced lord beyond the first: extra -1
  if (displaceCount.A.size > 1) {
    sideATotal -= (displaceCount.A.size - 1);
  }
  if (displaceCount.B.size > 1) {
    sideBTotal -= (displaceCount.B.size - 1);
  }

  breakdown.push({
    layer: "Territorial Control (Canonical Rules)",
    sideAPoints: sideATotal,
    sideBPoints: sideBTotal,
  });

  // ──── LAYER 2: LUNAR FLOW (Moon's Territorial Presence)
  let sideAMoon = 0;
  let sideBMoon = 0;
  const moonPlacement = chart.planetsInHouses.find(p => p.planet === "Moon");
  if (moonPlacement) {
    const moonSide = whichSide(moonPlacement.house, config);
    const isAngular = [1, 4, 7, 10].includes(moonPlacement.house);
    const moonPoints = isAngular ? 8 : 5; // The Moon is a heavy hitter for momentum
    
    if (moonSide === "A") sideAMoon = moonPoints;
    else if (moonSide === "B") sideBMoon = moonPoints;
  }
  breakdown.push({
    layer: "Lunar Flow (Territorial Presence)",
    sideAPoints: sideAMoon,
    sideBPoints: sideBMoon,
  });

  // ──── LAYER 3: FIXED STAR AMPLIFICATIONS (Separate layer)
  let sideAFixedStars = 0;
  let sideBFixedStars = 0;

  // Track which planets have fixed star conjunctions for explicit scoring
  for (const lord of chart.houseLords) {
    const conjunctions = findFixedStarConjunctions(lord.placement.eclipticLon, 1.0);
    if (conjunctions.length === 0) continue;

    const side = whichSide(lord.placement.house, config);
    if (side === "neutral") continue;

    let starBonus = 0;
    for (const star of conjunctions) {
      if (star.group === "royal") {
        starBonus += star.nature === "benefic" ? 2.0 : -2.5;
      } else if (star.group === "major") {
        starBonus += star.nature === "benefic" ? 1.0 : -1.5;
      } else {
        starBonus += star.nature === "benefic" ? 0.5 : -0.75;
      }
    }

    if (side === "A") sideAFixedStars += starBonus;
    else sideBFixedStars += starBonus;
  }
  breakdown.push({
    layer: "Fixed Stars (Royal & Major)",
    sideAPoints: sideAFixedStars,
    sideBPoints: sideBFixedStars,
  });

  // ──── LAYER 4: ARABIC LOTS
  let sideALots = 0;
  let sideBLots = 0;
  const ADVERSITY_LOTS = new Set(["Nemesis"]);

  for (const lot of chart.lots) {
    const side = whichSide(lot.house, config);
    if (side === "neutral") continue;

    // REDUCED WEIGHT: Lots are now supporting signals (flat 1-2 points)
    // instead of full house-weighted points, to keep Territory as the foundation.
    const houseType = getHouseType(lot.house);
    const points = houseType === "angular" ? 2 : 1;

    if (ADVERSITY_LOTS.has(lot.name)) {
      if (side === "A") sideALots -= points;
      else sideBLots -= points;
    } else {
      if (side === "A") sideALots += points;
      else sideBLots += points;
    }
  }
  breakdown.push({ layer: "Arabic Lots", sideAPoints: sideALots, sideBPoints: sideBLots });

  // ──── LAYER 5: ASPECTS
  let aspectTotal = 0;
  for (const aspect of chart.aspects) {
    const aspectWeight: Record<AspectData["aspectType"], number> = {
      trine: 2,
      sextile: 1,
      conjunction: 0,
      square: -2,
      opposition: -2,
    };
    const base = aspectWeight[aspect.aspectType];
    aspectTotal += aspect.applying ? base : base * 0.5;
  }
  breakdown.push({ layer: "Aspects (chart-wide)", sideAPoints: aspectTotal / 2, sideBPoints: -aspectTotal / 2 });

  // ──── LAYER 6: MOON PHASE
  const moonAdjustment = (() => {
    if (chart.moon.isVoidOfCourse) return -2;
    switch (chart.moon.phase) {
      case "full": return 1.5;
      case "waxing": return 1;
      case "new": return 0;
      case "waning": return -0.5;
    }
  })();
  breakdown.push({ layer: "Moon Phase/VOC (chart-wide)", sideAPoints: moonAdjustment / 2, sideBPoints: moonAdjustment / 2 });

  // ──── LAYER 7: CLUSTER KNOWLEDGE LAYERS
  // Generalized from sportsHorary.ts's L1/L7-specific rules — see
  // clusterKnowledgeLayers.ts for the full explanation of each. All of these
  // evaluate cluster-vs-cluster, never a single house pair.
  const upachaya = upachayaGrowthLayer(chart, config);
  const viaCombusta = viaCombustaLayer(chart, config);
  const besiegement = besiegementLayer(chart, config);
  const mutualReception = mutualReceptionLayer(chart, config);
  const translation = translationOfLightLayer(chart, config);
  const harmoniousFriction = harmoniousFrictionLayer(chart, config);
  const nodes = nodeLayer(chart, config);
  const kp = kpDecisionLayer(chart, config);
  const overrides = regulusAlgolOverrides(chart, config);
  // Regulus/Algol intentionally contribute NO extra points here — they're
  // already scored via Fixed Stars (Layer 3) at royal-tier amplification.
  // This layer only produces flags for the verdict/narration, per your call
  // not to double-count them.

  breakdown.push(
    { layer: upachaya.layer, sideAPoints: upachaya.sideAPoints, sideBPoints: upachaya.sideBPoints },
    { layer: viaCombusta.layer, sideAPoints: viaCombusta.sideAPoints, sideBPoints: viaCombusta.sideBPoints },
    { layer: besiegement.layer, sideAPoints: besiegement.sideAPoints, sideBPoints: besiegement.sideBPoints },
    { layer: mutualReception.layer, sideAPoints: mutualReception.sideAPoints, sideBPoints: mutualReception.sideBPoints },
    { layer: translation.layer, sideAPoints: translation.sideAPoints, sideBPoints: translation.sideBPoints },
    { layer: harmoniousFriction.layer, sideAPoints: harmoniousFriction.sideAPoints, sideBPoints: harmoniousFriction.sideBPoints },
    { layer: nodes.layer, sideAPoints: nodes.sideAPoints, sideBPoints: nodes.sideBPoints },
    { layer: kp.layer, sideAPoints: kp.sideAPoints, sideBPoints: kp.sideBPoints }
  );

  // ──── FINAL PEER-TO-PEER COMBINATION
  // Territory layer (sideATotal/sideBTotal) and KP layer (kp.sideAPoints/kp.sideBPoints) 
  // are now equal peers in the final verdict.
  
  const sideABreakdown = 
    sideATotal +              // Peer 1: Territorial
    kp.sideAPoints +          // Peer 2: KP Stellar
    sideAFixedStars + 
    sideALots + 
    (aspectTotal / 2) + 
    (moonAdjustment / 2) + 
    sideAMoon +
    upachaya.sideAPoints + 
    viaCombusta.sideAPoints + 
    besiegement.sideAPoints +
    mutualReception.sideAPoints + 
    translation.sideAPoints + 
    harmoniousFriction.sideAPoints +
    nodes.sideAPoints;

  const sideBBreakdown = 
    sideBTotal +              // Peer 1: Territorial
    kp.sideBPoints +          // Peer 2: KP Stellar
    sideBFixedStars + 
    sideBLots + 
    (-aspectTotal / 2) + 
    (moonAdjustment / 2) + 
    sideBMoon +
    upachaya.sideBPoints + 
    viaCombusta.sideBPoints + 
    besiegement.sideBPoints +
    mutualReception.sideBPoints + 
    translation.sideBPoints + 
    harmoniousFriction.sideBPoints +
    nodes.sideBPoints;

  const TOO_CLOSE_THRESHOLD = 2;
  const margin = sideABreakdown - sideBBreakdown;
  const predictedWinner: PredictionResult["predictedWinner"] =
    Math.abs(margin) < TOO_CLOSE_THRESHOLD ? "too close to call" : margin > 0 ? "A" : "B";

  // ──── CONFIDENCE
  // Additive scoring: confidence based on margin size (larger margins = higher confidence)
  // Volatility (Volatile temperaments) reduce confidence proportionally
  const maxPlausibleMargin = 15;
  let baseConfidence = 50 + Math.min(Math.abs(margin) / maxPlausibleMargin, 1) * 45;

  const relevantTemperaments = chart.houseLords
    .filter((l) => whichSide(l.house, config) !== "neutral")
    .map((l) => temperamentVolatility(l.placement.nakshatra));

  const avgVolatility = relevantTemperaments.length ? relevantTemperaments.reduce((a, b) => a + b, 0) / relevantTemperaments.length : 0;
  const confidence = Math.max(50, baseConfidence * (1 - avgVolatility));

  // ──── VOLATILITY WARNING
  const volatileCount = chart.houseLords.filter((l) => {
    const profile = NAKSHATRAS[l.placement.nakshatra];
    return profile?.temperament === "Volatile";
  }).length;
  const volatilityWarning = volatileCount > 2 ? `High volatility (${volatileCount} Volatile lords) — confidence range should widen ±${Math.round(avgVolatility * 30)}%` : "";

  return {
    breakdown,
    sideATotal: sideABreakdown,
    sideBTotal: sideBBreakdown,
    margin,
    predictedWinner,
    confidence: Math.round(confidence * 100) / 100,
    volatilityWarning,
    regulusOverride: overrides.regulusSide,
    algolOverride: overrides.algolSide,
  };
}

/**
 * Calculate prediction using planar equal-house system (date/location based).
 * When you have exact event time and location, use this for accurate house cusps.
 */
export function calculateFullPredictionWithPlanarHouses(
  chart: ChartData,
  config: ClusterConfig,
  date: Date,
  latitude: number,
  longitude: number
): PredictionResult {
  const planarSystem = buildPlanarHouseSystem(date, latitude, longitude);

  // Rebuild house lords using planar houses
  const updatedHouseLords = chart.houseLords.map((lord) => {
    const siderealLon = lord.placement.eclipticLon;
    const planarHouse = getPlanarHouseFromCusps(siderealLon, planarSystem.cusps);

    return {
      ...lord,
      placement: {
        ...lord.placement,
        house: planarHouse,
      },
    };
  });

  const updatedChart: ChartData = {
    ...chart,
    houseLords: updatedHouseLords,
  };

  return calculateFullPrediction(updatedChart, config);
}

/** Helper: get house number from planar cusps */
function getPlanarHouseFromCusps(eclipticLon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (start <= end) {
      if (eclipticLon >= start && eclipticLon < end) return i + 1;
    } else {
      if (eclipticLon >= start || eclipticLon < end) return i + 1;
    }
  }
  return 1;
}
