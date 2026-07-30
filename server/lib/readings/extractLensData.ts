// extractLensData.ts
// Adjust the `NatalChart` / `Placement` types below to match whatever
// astroEngine.ts already outputs in your codebase — this assumes a shape
// like { placements: [{ planet, sign, degree, house }], ascendant: {...} }

import { getLens, Lens } from "./lensRules";

export type Placement = {
  planet: string; // "Sun", "Moon", "Mars", "Rahu", "Ketu", etc.
  sign: string;
  degree: number;
  house: number;
};

export type NatalChart = {
  placements: Placement[];
  ascendant: { sign: string; degree: number };
  mc?: { sign: string; degree: number };
};

export type LensData = {
  lens: Lens;
  housePlacements: Placement[];
  forcedPlanets: Placement[];
  nodes: Placement[];
  ascendant?: { sign: string; degree: number };
};

export function extractLensData(chart: NatalChart, lensId: string): LensData {
  const lens = getLens(lensId);

  // Placements that fall in the lens's target houses
  const housePlacements = chart.placements.filter(
    p =>
      lens.houses.includes(p.house) &&
      p.planet !== "Rahu" &&
      p.planet !== "Ketu"
  );

  // Planets force-included regardless of house (e.g. Venus for relationships)
  const forcedPlanets = lens.planets
    ? chart.placements.filter(
        p =>
          lens.planets!.includes(p.planet) &&
          !housePlacements.some(hp => hp.planet === p.planet)
      )
    : [];

  // Rahu/Ketu axis, only if the lens calls for it
  const nodes = lens.includeNodes
    ? chart.placements.filter(p => p.planet === "Rahu" || p.planet === "Ketu")
    : [];

  return {
    lens,
    housePlacements,
    forcedPlanets,
    nodes,
    ascendant: lens.includeAscendant ? chart.ascendant : undefined,
  };
}
