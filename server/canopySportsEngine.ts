import { wholeSignHouseForLongitude } from "./canopyFirmamentEngine";

export const HOME_TERRITORY_HOUSES = [1, 2, 11] as const;
export const AWAY_TERRITORY_HOUSES = [7, 8, 9] as const;
export const VICTORY_LOT_BONUS = 35;

export interface VictoryLotEvaluation {
  house: number;
  homeBonus: number;
  awayBonus: number;
  territory: "home" | "away" | "neutral";
  formula: "Ascendant + Jupiter - Mars";
}

export interface StrifeEvaluation {
  house: number;
  awayQuadrant: boolean;
  underdogVolatility: boolean;
  modifier: "underdog-aggression" | "none";
  formula: "Ascendant + Mars - Saturn";
}

export function evaluateVictoryLot(victoryLotLongitude: number, ascendant: number): VictoryLotEvaluation {
  const house = wholeSignHouseForLongitude(victoryLotLongitude, ascendant);
  if ((HOME_TERRITORY_HOUSES as readonly number[]).includes(house)) {
    return { house, homeBonus: VICTORY_LOT_BONUS, awayBonus: 0, territory: "home", formula: "Ascendant + Jupiter - Mars" };
  }
  if ((AWAY_TERRITORY_HOUSES as readonly number[]).includes(house)) {
    return { house, homeBonus: 0, awayBonus: VICTORY_LOT_BONUS, territory: "away", formula: "Ascendant + Jupiter - Mars" };
  }
  return { house, homeBonus: 0, awayBonus: 0, territory: "neutral", formula: "Ascendant + Jupiter - Mars" };
}

export function evaluateStrifeLot(strifeLotLongitude: number, ascendant: number): StrifeEvaluation {
  const house = wholeSignHouseForLongitude(strifeLotLongitude, ascendant);
  const awayQuadrant = (AWAY_TERRITORY_HOUSES as readonly number[]).includes(house);
  return {
    house,
    awayQuadrant,
    underdogVolatility: awayQuadrant,
    modifier: awayQuadrant ? "underdog-aggression" : "none",
    formula: "Ascendant + Mars - Saturn",
  };
}

export interface CanopySportsAudit {
  homeAssignment: { house: 1; label: "Home" };
  awayAssignment: { house: 7; label: "Away" };
  homeTerritoryHouses: readonly number[];
  awayTerritoryHouses: readonly number[];
  victory: VictoryLotEvaluation;
  strife: StrifeEvaluation;
}

export function buildCanopySportsAudit(victoryLotLongitude: number, strifeLotLongitude: number, ascendant: number): CanopySportsAudit {
  return {
    homeAssignment: { house: 1, label: "Home" },
    awayAssignment: { house: 7, label: "Away" },
    homeTerritoryHouses: HOME_TERRITORY_HOUSES,
    awayTerritoryHouses: AWAY_TERRITORY_HOUSES,
    victory: evaluateVictoryLot(victoryLotLongitude, ascendant),
    strife: evaluateStrifeLot(strifeLotLongitude, ascendant),
  };
}
