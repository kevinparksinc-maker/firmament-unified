/**
 * MLB INTEGRATED SCORER
 * Scores all 5 houses per side (Away: 1,3,6,10,11 | Home: 7,9,12,4,5)
 * Each house lord evaluated for dignity, retrograde, combustion, placement, aspects
 * Returns full component breakdown with nakshatra/fixed stars for audit trail
 */

import { getFixedNakshatra } from "./firmamentBaseline";
import { SIGN_RULERS, EXALTATIONS, DEBILITATIONS } from "./astroEngine";
import {
  SIDE_A_HOUSES,
  SIDE_B_HOUSES,
  DIGNITY_POINTS,
  CONDITION_PENALTIES,
  COMBUSTION_ORBS,
  PLACEMENT_POINTS,
  ANGULAR_HOUSES,
  SUCCEDENT_HOUSES,
  ASPECT_POINTS,
  BENEFIC_PLANETS,
  MALEFIC_PLANETS,
  ASPECT_ORBS,
} from "./houseScoringConstants";
import { calculateArabicLots } from "./arabicLotsCalculator";
import { calculateTerritorialControl } from "./territorialControlEngine";
import type { PlanetPlacement } from "./astroEngine";

type Chart = Record<string, PlanetPlacement>;

interface HouseLordBreakdown {
  house: number;
  lord: string;
  lordSign: string;
  lordHouse: number;
  nakshatra: {
    name: string;
    temperament: string;
  };
  dignity: {
    status: string;
    points: number;
  };
  retrograde: {
    active: boolean;
    points: number;
  };
  combustion: {
    active: boolean;
    points: number;
  };
  placement: {
    type: string;
    points: number;
  };
  fixedStars: {
    conjunctions: Array<{ name: string; orb: number }>;
    points: number;
  };
  totalPoints: number;
  reasoning: string;
}

interface ArabicLotsBreakdown {
  lotsInCluster: Array<{ name: string; sign: string; degree: number }>;
  lotsScore: number;
}

interface TerritorialBreakdown {
  consolidation: number; // lords in own cluster
  displacement: number; // lords in opponent cluster
  territorialTotal: number;
}

interface SideBreakdown {
  side: "A" | "B";
  teamName: string;
  houses: HouseLordBreakdown[];
  arabicLots: ArabicLotsBreakdown;
  territorial: TerritorialBreakdown;
  houseTotal: number;
  lotsTotal: number;
  territorialTotal: number;
  totalPoints: number;
  confidence: number;
}

interface MatchupIntegration {
  matchup: string;
  away: string;
  home: string;
  awayBreakdown: SideBreakdown;
  homeBreakdown: SideBreakdown;
  margin: number;
  prediction: string;
  confidence: number;
  reasoning: string;
}

const ROYAL_STARS = [
  { name: "Aldebaran", degree: 45, orb: 8 },
  { name: "Regulus", degree: 135, orb: 8 },
  { name: "Antares", degree: 225, orb: 8 },
  { name: "Fomalhaut", degree: 315, orb: 8 },
];

function getLongitude(p: PlanetPlacement): number {
  if (p.eclipticLon != null) return ((p.eclipticLon % 360) + 360) % 360;
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const idx = signs.indexOf(p.sign);
  return idx >= 0 ? idx * 30 + p.degree : 0;
}

function angularSep(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

function getFixedStarConjunctions(degree: number): Array<{ name: string; orb: number }> {
  const conjunctions = [];
  const normalizedDeg = ((degree % 360) + 360) % 360;

  for (const star of ROYAL_STARS) {
    let orb = Math.abs(normalizedDeg - star.degree);
    if (orb > 180) orb = 360 - orb;

    if (orb < star.orb) {
      conjunctions.push({ name: star.name, orb });
    }
  }

  return conjunctions;
}

function getNakshatraTemperament(nakName: string): string {
  const volatileNakshatras = ["Ardra", "Krittika", "Ashlesha", "Jyeshtha", "Bharani"];
  const stoicNakshatras = ["Ashwini", "Pushya", "Uttara Phalguni", "Uttara Ashadha", "Uttara Bhadrapada"];
  const methodicalNakshatras = ["Rohini", "Magha", "Chitra", "Anuradha", "Shravana"];

  if (volatileNakshatras.includes(nakName)) return "Volatile";
  if (stoicNakshatras.includes(nakName)) return "Stoic";
  if (methodicalNakshatras.includes(nakName)) return "Methodical";
  return "Neutral";
}

export function scoreHouseLord(
  houseNumber: number,
  lordName: string,
  lordPlacement: PlanetPlacement,
  chart: Chart
): HouseLordBreakdown {
  let totalPoints = 0;
  const reasons: string[] = [];

  // Dignity
  let dignityStatus = "Neutral";
  let dignityPts = 0;

  if (EXALTATIONS[lordName] === lordPlacement.sign) {
    dignityStatus = "Exalted";
    dignityPts = DIGNITY_POINTS.EXALTED;
  } else if (DEBILITATIONS[lordName] === lordPlacement.sign) {
    dignityStatus = "Fall";
    dignityPts = DIGNITY_POINTS.FALL;
  } else if (SIGN_RULERS[lordPlacement.sign] === lordName) {
    dignityStatus = "Own Sign";
    dignityPts = DIGNITY_POINTS.OWN_SIGN;
  }

  totalPoints += dignityPts;
  if (dignityPts !== 0) reasons.push(`${dignityStatus}: ${dignityPts > 0 ? "+" : ""}${dignityPts}`);

  // Retrograde
  let retroPts = 0;
  if (lordPlacement.rx) {
    retroPts = CONDITION_PENALTIES.RETROGRADE;
    totalPoints += retroPts;
    reasons.push(`retrograde: ${retroPts}`);
  }

  // Combustion
  let combustPts = 0;
  const sun = chart["Sun"];
  if (sun && lordName !== "Sun") {
    const dist = angularSep(getLongitude(sun), getLongitude(lordPlacement));
    const orb = COMBUSTION_ORBS[lordName as keyof typeof COMBUSTION_ORBS] || COMBUSTION_ORBS.DEFAULT;
    if (dist <= orb) {
      combustPts = CONDITION_PENALTIES.COMBUST;
      totalPoints += combustPts;
      reasons.push(`combust: ${combustPts}`);
    }
  }

  // Placement bonus
  let placementType = "Cadent";
  let placementPts = PLACEMENT_POINTS.CADENT;

  if (ANGULAR_HOUSES.includes(lordPlacement.house || 0)) {
    placementType = "Angular";
    placementPts = PLACEMENT_POINTS.ANGULAR;
  } else if (SUCCEDENT_HOUSES.includes(lordPlacement.house || 0)) {
    placementType = "Succedent";
    placementPts = PLACEMENT_POINTS.SUCCEDENT;
  }

  totalPoints += placementPts;
  if (placementPts !== 0) reasons.push(`${placementType} (H${lordPlacement.house}): ${placementPts > 0 ? "+" : ""}${placementPts}`);

  // Fixed stars
  const starConj = getFixedStarConjunctions(getLongitude(lordPlacement));
  let starPts = 0;
  if (starConj.length > 0) {
    starPts = starConj.length * 2; // 2 points per star
    totalPoints += starPts;
    reasons.push(`fixed stars: ${starConj.map((s) => s.name).join(", ")}`);
  }

  const nak = getFixedNakshatra(getLongitude(lordPlacement));

  return {
    house: houseNumber,
    lord: lordName,
    lordSign: lordPlacement.sign,
    lordHouse: lordPlacement.house || 0,
    nakshatra: {
      name: nak.name,
      temperament: getNakshatraTemperament(nak.name),
    },
    dignity: { status: dignityStatus, points: dignityPts },
    retrograde: { active: lordPlacement.rx || false, points: retroPts },
    combustion: { active: sun ? angularSep(getLongitude(sun), getLongitude(lordPlacement)) <= (COMBUSTION_ORBS[lordName as keyof typeof COMBUSTION_ORBS] || COMBUSTION_ORBS.DEFAULT) : false, points: combustPts },
    placement: { type: placementType, points: placementPts },
    fixedStars: { conjunctions: starConj, points: starPts },
    totalPoints,
    reasoning: reasons.join(" | ") || "Neutral",
  };
}

export function scoreSide(
  side: "A" | "B",
  teamName: string,
  chart: Chart,
  houseCusps: Record<number, string>,
  ascendant: number,
  isNight: boolean
): SideBreakdown {
  const houses = side === "A" ? SIDE_A_HOUSES : SIDE_B_HOUSES;
  const houseBreakdowns: HouseLordBreakdown[] = [];
  let houseTotal = 0;

  // Build house lords map for territorial control
  const houseLords = new Map<number, string>();

  for (const house of houses) {
    const cusp = houseCusps[house];
    if (!cusp) continue;

    const lordName = SIGN_RULERS[cusp];
    if (!lordName) continue;

    houseLords.set(house as number, lordName);

    if (!chart[lordName]) continue;

    const lordBreakdown = scoreHouseLord(house as number, lordName, chart[lordName], chart);
    houseBreakdowns.push(lordBreakdown);
    houseTotal += lordBreakdown.totalPoints;
  }

  // Score Arabic Lots
  const allLots = calculateArabicLots(chart, ascendant, isNight);
  const lotsInCluster = allLots.filter((lot) => {
    const lotSignIdx = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"].indexOf(lot.sign);
    const lotHouse = Math.floor(lotSignIdx * 30 / 30) + 1; // Simplified mapping
    return side === "A" ? SIDE_A_HOUSES.includes(lotHouse as any) : SIDE_B_HOUSES.includes(lotHouse as any);
  });

  // 1 point per lot in cluster
  const lotsTotal = lotsInCluster.length;

  // Score Territorial Control
  const territorialResult = calculateTerritorialControl(chart, houseLords);
  const territorialEvals = side === "A" ? territorialResult.sideAEvals : territorialResult.sideBEvals;
  const territorialTotal = side === "A" ? territorialResult.sideATotal : territorialResult.sideBTotal;

  // Count consolidation vs displacement
  const consolidation = territorialEvals.filter((e) => e.isOwnCluster).length;
  const displacement = territorialEvals.filter((e) => e.isOpponentCluster).length;

  const totalPoints = houseTotal + lotsTotal + territorialTotal;
  const confidence = Math.min(95, 50 + Math.abs(totalPoints) * 3);

  return {
    side,
    teamName,
    houses: houseBreakdowns,
    arabicLots: {
      lotsInCluster,
      lotsScore: lotsTotal,
    },
    territorial: {
      consolidation,
      displacement,
      territorialTotal,
    },
    houseTotal,
    lotsTotal,
    territorialTotal,
    totalPoints,
    confidence,
  };
}

export function scoreMatchup(
  matchup: string,
  away: string,
  home: string,
  chart: Chart,
  houseCusps: Record<number, string>,
  ascendant: number = 0,
  isNight: boolean = false
): MatchupIntegration {
  const awayBreakdown = scoreSide("A", away, chart, houseCusps, ascendant, isNight);
  const homeBreakdown = scoreSide("B", home, chart, houseCusps, ascendant, isNight);

  const margin = Math.abs(awayBreakdown.totalPoints - homeBreakdown.totalPoints);
  let prediction = home;
  let reasoning = "Home field advantage";

  if (awayBreakdown.totalPoints > homeBreakdown.totalPoints + 2) {
    prediction = away;
    reasoning = `Away lords stronger (${awayBreakdown.totalPoints} vs ${homeBreakdown.totalPoints})`;
  } else if (homeBreakdown.totalPoints > awayBreakdown.totalPoints + 2) {
    reasoning = `Home lords stronger (${homeBreakdown.totalPoints} vs ${awayBreakdown.totalPoints})`;
  }

  const confidence = Math.min(95, 50 + margin * 5);

  return {
    matchup,
    away,
    home,
    awayBreakdown,
    homeBreakdown,
    margin,
    prediction,
    confidence: Math.round(confidence),
    reasoning,
  };
}

export function printIntegratedBreakdown(result: MatchupIntegration) {
  console.log("\n" + "═".repeat(160));
  console.log(`MATCHUP: ${result.matchup}`);
  console.log("═".repeat(160));

  // Away breakdown
  console.log(`\n${result.away.toUpperCase()} CLUSTER (Side A: H1, H3, H6, H10, H11)`);
  console.log("─".repeat(160));
  result.awayBreakdown.houses.forEach((h) => {
    console.log(
      `  H${h.house}  ${h.lord.padEnd(8)} in ${h.lordSign.padEnd(10)} (${h.nakshatra.temperament.padEnd(12)}) [${h.lordHouse}] ${h.totalPoints > 0 ? "+" : ""}${h.totalPoints}  │  ${h.reasoning}`
    );
  });
  console.log(`  House Lords Total: ${result.awayBreakdown.houseTotal > 0 ? "+" : ""}${result.awayBreakdown.houseTotal}`);
  if (result.awayBreakdown.arabicLots.lotsInCluster.length > 0) {
    console.log(`  Arabic Lots: ${result.awayBreakdown.arabicLots.lotsInCluster.map((l) => `${l.name} (${l.sign})`).join(", ")} = +${result.awayBreakdown.arabicLots.lotsScore}`);
  } else {
    console.log(`  Arabic Lots: None in cluster = 0`);
  }
  console.log(`  Territorial Control: ${result.awayBreakdown.territorial.consolidation} consolidated, ${result.awayBreakdown.territorial.displacement} displaced = ${result.awayBreakdown.territorial.territorialTotal > 0 ? "+" : ""}${result.awayBreakdown.territorial.territorialTotal}`);
  console.log(`  CLUSTER TOTAL: ${result.awayBreakdown.totalPoints > 0 ? "+" : ""}${result.awayBreakdown.totalPoints} points`);

  // Home breakdown
  console.log(`\n${result.home.toUpperCase()} CLUSTER (Side B: H7, H9, H12, H4, H5)`);
  console.log("─".repeat(160));
  result.homeBreakdown.houses.forEach((h) => {
    console.log(
      `  H${h.house}  ${h.lord.padEnd(8)} in ${h.lordSign.padEnd(10)} (${h.nakshatra.temperament.padEnd(12)}) [${h.lordHouse}] ${h.totalPoints > 0 ? "+" : ""}${h.totalPoints}  │  ${h.reasoning}`
    );
  });
  console.log(`  House Lords Total: ${result.homeBreakdown.houseTotal > 0 ? "+" : ""}${result.homeBreakdown.houseTotal}`);
  if (result.homeBreakdown.arabicLots.lotsInCluster.length > 0) {
    console.log(`  Arabic Lots: ${result.homeBreakdown.arabicLots.lotsInCluster.map((l) => `${l.name} (${l.sign})`).join(", ")} = +${result.homeBreakdown.arabicLots.lotsScore}`);
  } else {
    console.log(`  Arabic Lots: None in cluster = 0`);
  }
  console.log(`  Territorial Control: ${result.homeBreakdown.territorial.consolidation} consolidated, ${result.homeBreakdown.territorial.displacement} displaced = ${result.homeBreakdown.territorial.territorialTotal > 0 ? "+" : ""}${result.homeBreakdown.territorial.territorialTotal}`);
  console.log(`  CLUSTER TOTAL: ${result.homeBreakdown.totalPoints > 0 ? "+" : ""}${result.homeBreakdown.totalPoints} points`);

  // Prediction
  console.log("\n" + "─".repeat(160));
  console.log(`MARGIN: ${result.margin} points | PREDICTION: ${result.prediction} (${result.confidence}% confidence)`);
  console.log(`REASONING: ${result.reasoning}`);
  console.log("═".repeat(160) + "\n");
}
