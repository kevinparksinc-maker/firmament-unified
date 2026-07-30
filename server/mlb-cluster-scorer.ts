/**
 * MLB CLUSTER-VS-CLUSTER SCORER — FULL 7-LAYER IMPLEMENTATION
 * Ascendant (H1,3,6,10,11) vs Descendant (H4,5,7,9,12)
 *
 * All 7 layers wired into cluster totals:
 * 1. Nakshatra + temperament ✅
 * 2. Dignity (exalt/debil/own/friend) ✅
 * 3. House lordship weight ✅
 * 4. Fixed stars ✅
 * 5. Arabic lots ✅
 * 6. Planet-to-planet aspects ✅
 * 7. Territorial control ✅
 */

import { getFixedNakshatra } from "./firmamentBaseline";
import { SIGN_RULERS } from "./astroEngine";
import { calculateArabicLots, type ArabicLot } from "./arabicLotsCalculator";
import { calculateTerritorialControl } from "./territorialControlEngine";
import type { HouseCusps } from "./ephemeris";

export interface PlanetScore {
  name: string;
  house: number;
  degree: number;
  nakshatra: string;
  temperament: string;
  nakshatraScore: number;
  dignity: { status: string; multiplier: number };
  placement: { clusterType: "Angular" | "Succedent" | "Cadent"; bonus: number };
  houseLordshipBonus: number;
  retrograde: boolean;
  fixedStarBonus: number;
  aspectScore: number;
  rawScore: number;
}

export interface AspectDetail {
  planet1: string;
  planet2: string;
  aspect: string;
  orb: number;
  score: number;
}

export interface ClusterBreakdown {
  team: string;
  clusterType: "Ascendant" | "Descendant";
  houses: number[];
  planets: PlanetScore[];
  aspects: AspectDetail[];
  arabicLots: ArabicLot[];
  territorialBonus: number;
  totalScore: number;
  breakdown: {
    planetSum: number;
    aspectSum: number;
    lotSum: number;
    territorialSum: number;
  };
  avgScore: number;
  planetCount: number;
}

export interface MatchupClusterBreakdown {
  matchup: string;
  away: string;
  home: string;
  ascendantCluster: ClusterBreakdown;
  descendantCluster: ClusterBreakdown;
  margin: number;
  prediction: string;
  confidence: number;
  reasoning: string;
}

const ASCENDANT_HOUSES = [1, 3, 6, 10, 11];
const DESCENDANT_HOUSES = [4, 5, 7, 9, 12];

const EXALTATIONS: Record<string, string> = {
  Sun: "Aries", Moon: "Taurus", Mercury: "Virgo", Venus: "Pisces", Mars: "Capricorn",
  Jupiter: "Cancer", Saturn: "Libra", Rahu: "Gemini", Ketu: "Sagittarius",
};

const DEBILITATIONS: Record<string, string> = {
  Sun: "Libra", Moon: "Scorpio", Mercury: "Pisces", Venus: "Virgo", Mars: "Cancer",
  Jupiter: "Capricorn", Saturn: "Aries", Rahu: "Sagittarius", Ketu: "Gemini",
};

const OWN_SIGNS: Record<string, string[]> = {
  Sun: ["Leo"], Moon: ["Cancer"], Mercury: ["Gemini", "Virgo"], Venus: ["Taurus", "Libra"],
  Mars: ["Aries", "Scorpio"], Jupiter: ["Sagittarius", "Pisces"],
  Saturn: ["Capricorn", "Aquarius"], Rahu: ["Gemini"], Ketu: ["Sagittarius"],
};

const ASPECT_ORBS: Record<string, number> = {
  conjunction: 8, opposition: 8, trine: 8, square: 8, sextile: 6, quincunx: 3, semisquare: 3,
};

const ASPECT_SCORES: Record<string, number> = {
  conjunction: 5, opposition: 3, trine: 5, square: -2, sextile: 3, quincunx: -1, semisquare: -1,
};

function getSignFromDegree(degree: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[Math.floor(degree / 30) % 12];
}

function calculateDignity(planet: string, degree: number): { status: string; multiplier: number } {
  const sign = getSignFromDegree(degree);
  if (EXALTATIONS[planet] === sign) return { status: "Exalted", multiplier: 1.5 };
  if (DEBILITATIONS[planet] === sign) return { status: "Debilitated", multiplier: 0.6 };
  if (OWN_SIGNS[planet]?.includes(sign)) return { status: "Own Sign", multiplier: 1.25 };
  const friendSigns: Record<string, string[]> = {
    Sun: ["Leo", "Aries", "Sagittarius"], Moon: ["Cancer", "Taurus"], Mercury: ["Gemini", "Virgo"],
  };
  if (friendSigns[planet]?.includes(sign)) return { status: "Friend Sign", multiplier: 1.1 };
  return { status: "Neutral", multiplier: 1.0 };
}

function getNakshatraScore(nakshatra: string): { temperament: string; score: number } {
  const volatileNakshatras = ["Ardra", "Krittika", "Ashlesha", "Jyeshtha", "Bharani"];
  const stoicNakshatras = ["Ashwini", "Pushya", "Uttara Phalguni", "Uttara Ashadha", "Uttara Bhadrapada"];
  const methodicalNakshatras = ["Rohini", "Magha", "Chitra", "Anuradha", "Shravana"];

  if (volatileNakshatras.includes(nakshatra)) return { temperament: "Volatile", score: 1.5 };
  if (stoicNakshatras.includes(nakshatra)) return { temperament: "Stoic", score: 4.0 };
  if (methodicalNakshatras.includes(nakshatra)) return { temperament: "Methodical", score: 3.0 };
  return { temperament: "Neutral", score: 2.5 };
}

function getPlacementBonus(house: number, retrograde: boolean): { clusterType: "Angular" | "Succedent" | "Cadent"; bonus: number } {
  const angularHouses = [1, 4, 7, 10];
  const succedentHouses = [2, 5, 8, 11];
  let clusterType: "Angular" | "Succedent" | "Cadent" = "Cadent";
  let bonus = 0;

  if (angularHouses.includes(house)) { clusterType = "Angular"; bonus = 2.5; }
  else if (succedentHouses.includes(house)) { clusterType = "Succedent"; bonus = 1.5; }

  if (retrograde) bonus -= 0.5;
  return { clusterType, bonus };
}

function getFixedStarBonus(degree: number): number {
  const ROYAL_STARS = [
    { degree: 45, orb: 8 }, { degree: 135, orb: 8 }, { degree: 225, orb: 8 }, { degree: 315, orb: 8 },
  ];
  const normalizedDeg = ((degree % 360) + 360) % 360;
  let totalBonus = 0;
  for (const star of ROYAL_STARS) {
    let orb = Math.abs(normalizedDeg - star.degree);
    if (orb > 180) orb = 360 - orb;
    if (orb < star.orb) totalBonus += 2.0 * (1 - orb / star.orb);
  }
  return totalBonus;
}

function getHouseLordshipBonus(planetName: string, houseNumber: number, houseLords: Map<number, string>): number {
  // If this planet rules the house it's in, bonus
  const ruler = houseLords.get(houseNumber);
  if (ruler === planetName) return 1.5; // Planet rules its own house = stronger
  // If planet rules an adjacent house (amplification)
  if (houseLords.get(houseNumber - 1) === planetName || houseLords.get(houseNumber + 1) === planetName) return 0.5;
  return 0;
}

function calculateAspects(
  allPlanetsInCluster: Array<{ name: string; degree: number; house: number }>
): { aspects: AspectDetail[]; score: number } {
  const aspects: AspectDetail[] = [];
  let score = 0;

  for (let i = 0; i < allPlanetsInCluster.length; i++) {
    for (let j = i + 1; j < allPlanetsInCluster.length; j++) {
      const p1 = allPlanetsInCluster[i];
      const p2 = allPlanetsInCluster[j];

      let diff = Math.abs(p1.degree - p2.degree);
      if (diff > 180) diff = 360 - diff;

      const ASPECTS = [
        { name: "conjunction", angle: 0, orb: 8, score: 5 },
        { name: "sextile", angle: 60, orb: 6, score: 3 },
        { name: "square", angle: 90, orb: 8, score: -2 },
        { name: "trine", angle: 120, orb: 8, score: 5 },
        { name: "opposition", angle: 180, orb: 8, score: 3 },
      ];

      for (const asp of ASPECTS) {
        const orb = Math.abs(diff - asp.angle);
        if (orb <= asp.orb) {
          const strength = 1 - (orb / asp.orb);
          const aspectScore = asp.score * strength;
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            aspect: asp.name,
            orb: Number(orb.toFixed(1)),
            score: Number(aspectScore.toFixed(2)),
          });
          score += aspectScore;
        }
      }
    }
  }

  return { aspects, score };
}

function scorePlanet(
  planetName: string,
  degree: number,
  house: number,
  retrograde: boolean,
  houseLords: Map<number, string>
): Omit<PlanetScore, "aspectScore"> {
  const nakshatraData = getFixedNakshatra(degree);
  const nakshatraScore = getNakshatraScore(nakshatraData.name);
  const dignity = calculateDignity(planetName, degree);
  const placement = getPlacementBonus(house, retrograde);
  const fixedStarBonus = getFixedStarBonus(degree);
  const houseLordshipBonus = getHouseLordshipBonus(planetName, house, houseLords);

  const baseScore = nakshatraScore.score * dignity.multiplier + placement.bonus + houseLordshipBonus;
  const rawScore = baseScore + fixedStarBonus;

  return {
    name: planetName,
    house,
    degree,
    nakshatra: nakshatraData.name,
    temperament: nakshatraScore.temperament,
    nakshatraScore: nakshatraScore.score,
    dignity,
    placement,
    houseLordshipBonus,
    retrograde,
    fixedStarBonus,
    rawScore,
  };
}

function getHouseLords(houses: HouseCusps): Map<number, string> {
  const houseLords = new Map<number, string>();
  const ZODIAC_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  for (let i = 0; i < 12; i++) {
    const cusp = houses.cusps[i];
    if (cusp !== undefined) {
      const signIndex = Math.floor(cusp / 30) % 12;
      const sign = ZODIAC_SIGNS[signIndex];
      const ruler = SIGN_RULERS[sign];
      if (ruler) houseLords.set(i + 1, ruler);
    }
  }
  return houseLords;
}

function getLotScore(lot: ArabicLot, cluster: number[]): number {
  // Determine which house the lot falls into
  const lotHouse = Math.floor(lot.longitude / 30) % 12 + 1;
  if (cluster.includes(lotHouse)) {
    // Lot of Fortune gets +3, others +1.5
    return lot.name === "Lot of Fortune" ? 3.0 : 1.5;
  }
  return 0;
}

export function scoreClusterMatchup(
  away: string,
  home: string,
  planets: Array<{ name: string; tropicalLon: number; house: number; retrograde?: boolean }>,
  houses: HouseCusps,
  isNight: boolean = false
): MatchupClusterBreakdown {
  const houseLords = getHouseLords(houses);

  // Build chart for lot calculation
  const chart: Record<string, any> = {};
  planets.forEach((p) => {
    chart[p.name] = { tropicalLon: p.eclipticLon, house: p.house };
  });

  // Calculate Arabic lots
  const ascendant = houses.cusps[0] || 0;
  const arabicLots = calculateArabicLots(chart, ascendant, isNight);

  // Calculate territorial control (Side A = Ascendant, Side B = Descendant)
  const territorialResult = calculateTerritorialControl(chart, houseLords);
  const ascendantTerritoryBonus = territorialResult.sideATotal || 0;
  const descendantTerritoryBonus = territorialResult.sideBTotal || 0;

  // Separate planets into clusters
  const ascendantPlanets: Array<ReturnType<typeof scorePlanet> & { aspectScore: number }> = [];
  const descendantPlanets: Array<ReturnType<typeof scorePlanet> & { aspectScore: number }> = [];

  planets.forEach((p) => {
    const scored = scorePlanet(p.name, p.eclipticLon, p.house, p.retrograde || false, houseLords);

    if (ASCENDANT_HOUSES.includes(p.house)) {
      ascendantPlanets.push({ ...scored, aspectScore: 0 });
    } else if (DESCENDANT_HOUSES.includes(p.house)) {
      descendantPlanets.push({ ...scored, aspectScore: 0 });
    }
  });

  // Calculate aspects within each cluster
  const ascendantAspectsData = calculateAspects(ascendantPlanets);
  const descendantAspectsData = calculateAspects(descendantPlanets);

  // Add aspect scores back to planets
  ascendantAspectsData.aspects.forEach((asp) => {
    const p = ascendantPlanets.find((pl) => pl.name === asp.planet1 || pl.name === asp.planet2);
    if (p) p.aspectScore = (p.aspectScore || 0) + asp.score / 2;
  });

  descendantAspectsData.aspects.forEach((asp) => {
    const p = descendantPlanets.find((pl) => pl.name === asp.planet1 || pl.name === asp.planet2);
    if (p) p.aspectScore = (p.aspectScore || 0) + asp.score / 2;
  });

  // Calculate lot scores
  const ascendantLotScore = arabicLots.reduce((sum, lot) => sum + getLotScore(lot, ASCENDANT_HOUSES), 0);
  const descendantLotScore = arabicLots.reduce((sum, lot) => sum + getLotScore(lot, DESCENDANT_HOUSES), 0);

  // Sum all components
  const ascendantPlanetSum = ascendantPlanets.reduce((sum, p) => sum + p.rawScore, 0);
  const descendantPlanetSum = descendantPlanets.reduce((sum, p) => sum + p.rawScore, 0);

  const ascendantAspectSum = ascendantAspectsData.score;
  const descendantAspectSum = descendantAspectsData.score;

  const ascendantTerritorialSum = ascendantTerritoryBonus;
  const descendantTerritorialSum = descendantTerritoryBonus;

  const ascendantTotal = ascendantPlanetSum + ascendantAspectSum + ascendantLotScore + ascendantTerritorialSum;
  const descendantTotal = descendantPlanetSum + descendantAspectSum + descendantLotScore + descendantTerritorialSum;

  const ascendantCluster: ClusterBreakdown = {
    team: away,
    clusterType: "Ascendant",
    houses: ASCENDANT_HOUSES,
    planets: ascendantPlanets,
    aspects: ascendantAspectsData.aspects,
    arabicLots: arabicLots.filter((l) => ASCENDANT_HOUSES.includes(Math.floor(l.longitude / 30) % 12 + 1)),
    territorialBonus: ascendantTerritorialSum,
    totalScore: ascendantTotal,
    breakdown: {
      planetSum: ascendantPlanetSum,
      aspectSum: ascendantAspectSum,
      lotSum: ascendantLotScore,
      territorialSum: ascendantTerritorialSum,
    },
    avgScore: ascendantPlanets.length > 0 ? ascendantTotal / ascendantPlanets.length : 0,
    planetCount: ascendantPlanets.length,
  };

  const descendantCluster: ClusterBreakdown = {
    team: home,
    clusterType: "Descendant",
    houses: DESCENDANT_HOUSES,
    planets: descendantPlanets,
    aspects: descendantAspectsData.aspects,
    arabicLots: arabicLots.filter((l) => DESCENDANT_HOUSES.includes(Math.floor(l.longitude / 30) % 12 + 1)),
    territorialBonus: descendantTerritorialSum,
    totalScore: descendantTotal,
    breakdown: {
      planetSum: descendantPlanetSum,
      aspectSum: descendantAspectSum,
      lotSum: descendantLotScore,
      territorialSum: descendantTerritorialSum,
    },
    avgScore: descendantPlanets.length > 0 ? descendantTotal / descendantPlanets.length : 0,
    planetCount: descendantPlanets.length,
  };

  const margin = descendantTotal - ascendantTotal;
  let prediction = away;
  let confidence = 65;
  let reasoning = "";

  if (descendantTotal > ascendantTotal + 1) {
    prediction = home;
    confidence = Math.min(95, 55 + Math.abs(margin) * 2);
    reasoning = `Home Descendant dominates: ${descendantTotal.toFixed(2)} vs ${ascendantTotal.toFixed(2)}`;
  } else if (ascendantTotal > descendantTotal + 1) {
    prediction = away;
    confidence = Math.min(95, 55 + Math.abs(margin) * 2);
    reasoning = `Away Ascendant dominates: ${ascendantTotal.toFixed(2)} vs ${descendantTotal.toFixed(2)}`;
  } else {
    confidence = 52;
    reasoning = `Tight: Asc ${ascendantTotal.toFixed(2)} vs Dsc ${descendantTotal.toFixed(2)}`;
  }

  return {
    matchup: `${away} @ ${home}`,
    away,
    home,
    ascendantCluster,
    descendantCluster,
    margin: Math.abs(margin),
    prediction,
    confidence: Math.round(confidence),
    reasoning,
  };
}

export function printClusterBreakdown(breakdown: MatchupClusterBreakdown) {
  const asc = breakdown.ascendantCluster;
  const dsc = breakdown.descendantCluster;

  console.log("\n" + "═".repeat(150));
  console.log(`MATCHUP: ${breakdown.matchup}`);
  console.log("═".repeat(150));

  console.log(`\n🏃 ASCENDANT CLUSTER — ${asc.team} (Away)`);
  console.log(`Houses: ${asc.houses.join(", ")}`);
  console.log("─".repeat(150));
  asc.planets.forEach((p) => {
    console.log(
      `  ${p.name.padEnd(12)} H${p.house} ${p.nakshatra.padEnd(18)} (${p.temperament.padEnd(10)}) Nak:${p.nakshatraScore.toFixed(1)} × Dig:${p.dignity.multiplier.toFixed(2)} + Place:${p.placement.bonus.toFixed(1)} + HouseL:${p.houseLordshipBonus.toFixed(1)} + Stars:${p.fixedStarBonus.toFixed(1)} + Aspects:${p.aspectScore?.toFixed(1) || "0"} = ${p.rawScore.toFixed(2)}`
    );
  });
  console.log(`  Aspects within cluster: ${asc.aspects.map((a) => `${a.planet1}-${a.planet2}(${a.aspect}:${a.score.toFixed(1)})`).join(", ") || "none"}`);
  console.log(`  Arabic Lots: ${asc.arabicLots.map((l) => `${l.name}(H${Math.floor(l.longitude / 30) % 12 + 1})`).join(", ") || "none"}`);
  console.log(
    `🔢 BREAKDOWN: Planets=${asc.breakdown.planetSum.toFixed(2)} + Aspects=${asc.breakdown.aspectSum.toFixed(2)} + Lots=${asc.breakdown.lotSum.toFixed(2)} + Territory=${asc.breakdown.territorialSum.toFixed(2)} = TOTAL ${asc.totalScore.toFixed(2)}`
  );

  console.log(`\n🏠 DESCENDANT CLUSTER — ${dsc.team} (Home)`);
  console.log(`Houses: ${dsc.houses.join(", ")}`);
  console.log("─".repeat(150));
  dsc.planets.forEach((p) => {
    console.log(
      `  ${p.name.padEnd(12)} H${p.house} ${p.nakshatra.padEnd(18)} (${p.temperament.padEnd(10)}) Nak:${p.nakshatraScore.toFixed(1)} × Dig:${p.dignity.multiplier.toFixed(2)} + Place:${p.placement.bonus.toFixed(1)} + HouseL:${p.houseLordshipBonus.toFixed(1)} + Stars:${p.fixedStarBonus.toFixed(1)} + Aspects:${p.aspectScore?.toFixed(1) || "0"} = ${p.rawScore.toFixed(2)}`
    );
  });
  console.log(`  Aspects within cluster: ${dsc.aspects.map((a) => `${a.planet1}-${a.planet2}(${a.aspect}:${a.score.toFixed(1)})`).join(", ") || "none"}`);
  console.log(`  Arabic Lots: ${dsc.arabicLots.map((l) => `${l.name}(H${Math.floor(l.longitude / 30) % 12 + 1})`).join(", ") || "none"}`);
  console.log(
    `🔢 BREAKDOWN: Planets=${dsc.breakdown.planetSum.toFixed(2)} + Aspects=${dsc.breakdown.aspectSum.toFixed(2)} + Lots=${dsc.breakdown.lotSum.toFixed(2)} + Territory=${dsc.breakdown.territorialSum.toFixed(2)} = TOTAL ${dsc.totalScore.toFixed(2)}`
  );

  console.log("\n" + "─".repeat(150));
  console.log(
    `PREDICTION: ${breakdown.prediction} (${breakdown.confidence}%) | Margin: ${breakdown.margin.toFixed(2)}`
  );
  console.log(`REASONING: ${breakdown.reasoning}`);
  console.log("═".repeat(150) + "\n");
}
