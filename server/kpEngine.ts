
/**
 * KP (Krishnamurti Padhdhati) ENGINE
 * ============================================================================
 * Implements Stellar Astrology logic based on Star-Lords and Sub-Lords.
 * KP is used as a primary decision-making layer, focusing on the "Promise"
 * of the houses through their Sub-Lords.
 * ============================================================================
 */

import { getKPStellarDetails, KPStellarDetails } from "./astrologyCore";
import { ChartData, ClusterConfig, LayerBreakdown } from "./masterPredictionEngine";

export interface KPSignificators {
  planet: string;
  houses: number[];
  starLord: string;
  subLord: string;
}

/**
 * Calculates significators for all planets based on 4 levels of KP logic.
 */
export function calculateKPSignificators(chart: ChartData): KPSignificators[] {
  const significators: KPSignificators[] = [];

  for (const p of chart.planetsInHouses) {
    const stellar = getKPStellarDetails(p.eclipticLon);
    
    // Level 2: Occupant of house
    const houses = [p.house];
    
    // Level 4: Lord of house (handled by mapping planets to ruled houses)
    // In this simplified engine, houseLords are already provided in chart.houseLords.
    
    significators.push({
      planet: p.planet,
      houses: houses,
      starLord: stellar.starLord,
      subLord: stellar.subLord
    });
  }

  return significators;
}

/**
 * Evaluates the KP layer by checking significators and cuspal sub-lords.
 * Focuses on Victory Houses (1, 6, 10, 11) for Side A and (7, 12, 4, 5) for Side B.
 */
export function kpDecisionLayer(chart: ChartData, config: ClusterConfig): LayerBreakdown {
  let sideA = 0;
  let sideB = 0;

  const victoryHousesA = config.sideAHouses;
  const victoryHousesB = config.sideBHouses;

  // 1. Cuspal Sub-Lord Logic
  // The Sub-Lord of the 6th house cusp (victory) is the most important in KP horary.
  const getCuspalSubLord = (houseNum: number) => {
    const cusp = chart.houses.find(h => h.house === houseNum);
    if (!cusp) return null;
    return getKPStellarDetails(cusp.degree).subLord;
  };

  // Evaluate 6th house (Victory)
  const subLord6 = getCuspalSubLord(6);
  if (subLord6) {
    const placement = chart.planetsInHouses.find(p => p.planet === subLord6);
    if (placement) {
      if (victoryHousesA.includes(placement.house)) sideA += 8;
      if (victoryHousesB.includes(placement.house)) sideB += 8;
    }
  }

  // Evaluate 11th house (Gains)
  const subLord11 = getCuspalSubLord(11);
  if (subLord11) {
    const placement = chart.planetsInHouses.find(p => p.planet === subLord11);
    if (placement) {
      if (victoryHousesA.includes(placement.house)) sideA += 4;
      if (victoryHousesB.includes(placement.house)) sideB += 4;
    }
  }

  // 2. Significator Scoring (Planet -> Star-Lord -> Sub-Lord)
  const sigs = calculateKPSignificators(chart);
  
  for (const sig of sigs) {
    // Level 1: Planet itself
    const planetPlacement = chart.planetsInHouses.find(p => p.planet === sig.planet);
    if (!planetPlacement) continue;

    // Level 2: Star-Lord's placement (Stronger than the planet itself)
    const starLordPlacement = chart.planetsInHouses.find(p => p.planet === sig.starLord);
    if (!starLordPlacement) continue;

    // Level 3: Sub-Lord (The final decision maker)
    const subLordPlacement = chart.planetsInHouses.find(p => p.planet === sig.subLord);
    const subLordHouse = subLordPlacement?.house ?? 0;

    // Side A Scoring
    if (victoryHousesA.includes(starLordPlacement.house)) {
      if (victoryHousesB.includes(subLordHouse)) {
        sideA += 0.5; // Sub-lord denies the promise of the star-lord
      } else {
        sideA += 2.0; // Promise confirmed
      }
    }

    // Side B Scoring
    if (victoryHousesB.includes(starLordPlacement.house)) {
      if (victoryHousesA.includes(subLordHouse)) {
        sideB += 0.5; // Sub-lord denies
      } else {
        sideB += 2.0; // Promise confirmed
      }
    }
  }

  return {
    layer: "KP Stellar (Sub-Lord & Significators)",
    sideAPoints: sideA,
    sideBPoints: sideB
  };
}
