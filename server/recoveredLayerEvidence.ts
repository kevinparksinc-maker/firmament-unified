import { SIGN_ORDER, SIGN_RULERS } from "./astroEngine";
import type { EphemerisResult } from "./ephemeris";

export const RECOVERED_LAYER_VERSION = "recovered-layer-evidence-v1" as const;

export type RecoveredLayerName =
  | "Fixed-star amplifications"
  | "Retrograde condition"
  | "Lunar flow"
  | "Chart-wide aspects"
  | "Moon phase / VOC"
  | "Nodes (Rahu/Ketu)"
  | "Upachaya growth"
  | "Via Combusta"
  | "Besiegement"
  | "Mutual reception"
  | "Translation of light"
  | "Harmonious vs friction aspects";

export type RecoveredSide = "A" | "B" | "neutral";

export interface RecoveredPlanetInput {
  planet: string;
  longitude: number;
  sign: string;
  house: number | null;
  rx?: boolean;
  nakshatra?: string;
  sourceCoordinate: string;
  calculationMode: "zetetic-sky" | "j2000-god-view" | "agent-view";
}

export interface RecoveredLayerChartInput {
  planets: RecoveredPlanetInput[];
  orientation: "standard" | "inverse-180";
  enableScoring?: boolean;
}

export interface RecoveredScoreSummary {
  enabled: boolean;
  scoreA: number;
  scoreB: number;
  contributingLayers: RecoveredLayerName[];
}

export interface RecoveredLayerEvidence {
  version: typeof RECOVERED_LAYER_VERSION;
  name: RecoveredLayerName;
  scoreA: number;
  scoreB: number;
  candidateScoreA: number;
  candidateScoreB: number;
  enabledForScoring: boolean;
  detail: string;
  source: "recovered-archive-master" | "recovered-archive-horary";
  limitation?: string;
  inputs: string[];
}

const ARCHIVE_STARS = [
  { name: "Regulus", longitude: 135, nature: "benefic", group: "royal" },
  { name: "Aldebaran", longitude: 45, nature: "benefic", group: "royal" },
  { name: "Antares", longitude: 225, nature: "malefic", group: "royal" },
  { name: "Fomalhaut", longitude: 315, nature: "malefic", group: "royal" },
  { name: "Sirius", longitude: 104, nature: "benefic", group: "major" },
  { name: "Polaris", longitude: 0, nature: "benefic", group: "major" },
  { name: "Spica", longitude: 173.833, nature: "benefic", group: "major" },
  { name: "Arcturus", longitude: 164.183, nature: "benefic", group: "major" },
  { name: "Denebola", longitude: 182, nature: "malefic", group: "major" },
  { name: "Algol", longitude: 56.683, nature: "malefic", group: "minor" },
  { name: "Bellatrix", longitude: 162, nature: "malefic", group: "minor" },
] as const;

const MALEFICS = new Set(["Sun", "Mars", "Saturn", "Rahu", "Ketu"]);
const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);
const UPACHAYA_HOUSES = new Set([3, 6, 10, 11]);
const ASCENDANT_HOUSES = new Set([1, 3, 6, 10, 11]);
const DESCENDANT_HOUSES = new Set([4, 5, 7, 9, 12]);
const SIGN_INDEX = new Map(SIGN_ORDER.map((sign, index) => [sign, index]));

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

function angularDistance(first: number, second: number): number {
  const delta = Math.abs(normalize(first) - normalize(second));
  return delta > 180 ? 360 - delta : delta;
}

function sideForHouse(house: number | null): RecoveredSide {
  if (house !== null && ASCENDANT_HOUSES.has(house)) return "A";
  if (house !== null && DESCENDANT_HOUSES.has(house)) return "B";
  return "neutral";
}

function scoreForSide(side: RecoveredSide, value: number): [number, number] {
  return side === "A" ? [value, 0] : side === "B" ? [0, value] : [0, 0];
}

function aspectType(first: number, second: number): "conjunction" | "sextile" | "square" | "trine" | "opposition" | null {
  const separation = angularDistance(first, second);
  if (separation <= 8) return "conjunction";
  if (Math.abs(separation - 60) <= 6) return "sextile";
  if (Math.abs(separation - 90) <= 8) return "square";
  if (Math.abs(separation - 120) <= 8) return "trine";
  if (Math.abs(separation - 180) <= 8) return "opposition";
  return null;
}

function candidate(
  name: RecoveredLayerName,
  scoreA: number,
  scoreB: number,
  detail: string,
  source: RecoveredLayerEvidence["source"],
  inputs: string[],
  limitation?: string,
  enabledForScoring = false,
): RecoveredLayerEvidence {
  return {
    version: RECOVERED_LAYER_VERSION,
    name,
    scoreA: enabledForScoring ? round(scoreA) : 0,
    scoreB: enabledForScoring ? round(scoreB) : 0,
    candidateScoreA: round(scoreA),
    candidateScoreB: round(scoreB),
    enabledForScoring,
    detail,
    source,
    limitation,
    inputs,
  };
}

function fixedStars(planets: RecoveredPlanetInput[], enabled: boolean): RecoveredLayerEvidence {
  const hits: string[] = [];
  let scoreA = 0;
  let scoreB = 0;
  for (const planet of planets) {
    for (const star of ARCHIVE_STARS) {
      if (angularDistance(planet.longitude, star.longitude) > 1) continue;
      const value = star.group === "royal" ? (star.nature === "benefic" ? 2 : -2.5) : star.group === "major" ? (star.nature === "benefic" ? 1 : -1.5) : -0.75;
      const [a, b] = scoreForSide(sideForHouse(planet.house), value);
      scoreA += a;
      scoreB += b;
      hits.push(`${planet.planet} H${planet.house ?? "?"} / ${star.name} ${value > 0 ? "+" : ""}${value}`);
    }
  }
  return candidate("Fixed-star amplifications", scoreA, scoreB, hits.length ? hits.join("; ") : "No recovered fixed-star conjunctions within the declared 1° orb.", "recovered-archive-master", planets.map((p) => `${p.planet}:${round(p.longitude)}°`), undefined, enabled);
}

function retrograde(planets: RecoveredPlanetInput[], enabled: boolean): RecoveredLayerEvidence {
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  for (const planet of planets.filter((p) => p.rx)) {
    const side = sideForHouse(planet.house);
    const value = side === "A" ? -1 : side === "B" ? -0.5 : 0;
    const [a, b] = scoreForSide(side, value);
    scoreA += a;
    scoreB += b;
    if (side !== "neutral") details.push(`${planet.planet} H${planet.house}: ${value}`);
  }
  return candidate("Retrograde condition", scoreA, scoreB, details.length ? details.join("; ") : "No retrograde planet occupied a scoring family house.", "recovered-archive-horary", planets.filter((p) => p.rx).map((p) => `${p.planet}:rx`), undefined, enabled);
}

function lunarFlow(planets: RecoveredPlanetInput[], enabled: boolean): RecoveredLayerEvidence {
  const moon = planets.find((p) => p.planet === "Moon");
  if (!moon) return candidate("Lunar flow", 0, 0, "Moon unavailable.", "recovered-archive-master", []);
  const value = moon.house !== null && ANGULAR_HOUSES.has(moon.house) ? 8 : 5;
  const [scoreA, scoreB] = scoreForSide(sideForHouse(moon.house), value);
  return candidate("Lunar flow", scoreA, scoreB, `Moon in H${moon.house ?? "?"}; recovered flow value ${value}.`, "recovered-archive-master", [`Moon:${round(moon.longitude)}°`, `house:${moon.house ?? "?"}`], undefined, enabled);
}

function chartWideAspects(planets: RecoveredPlanetInput[], enabled: boolean): RecoveredLayerEvidence {
  const weights = { conjunction: 0, sextile: 1, square: -2, trine: 2, opposition: -2 } as const;
  let net = 0;
  const details: string[] = [];
  for (let left = 0; left < planets.length; left += 1) {
    for (let right = left + 1; right < planets.length; right += 1) {
      const type = aspectType(planets[left]!.longitude, planets[right]!.longitude);
      if (!type || weights[type] === 0) continue;
      const value = weights[type] * 0.5;
      net += value;
      details.push(`${planets[left]!.planet}-${planets[right]!.planet} ${type}: ${value > 0 ? "+" : ""}${value}`);
    }
  }
  return candidate("Chart-wide aspects", net / 2, -net / 2, details.length ? details.join("; ") : "No recovered scored major aspects.", "recovered-archive-master", planets.map((p) => `${p.planet}:${round(p.longitude)}°`), "Recovered archive uses conservative half-strength treatment; applying/separating state is not available in this event contract.", enabled);
}

function moonPhase(planets: RecoveredPlanetInput[], enabled: boolean): RecoveredLayerEvidence {
  const sun = planets.find((p) => p.planet === "Sun");
  const moon = planets.find((p) => p.planet === "Moon");
  if (!sun || !moon) return candidate("Moon phase / VOC", 0, 0, "Sun or Moon unavailable.", "recovered-archive-master", []);
  const separation = normalize(moon.longitude - sun.longitude);
  const phase = separation < 30 || separation >= 330 ? "new" : Math.abs(separation - 180) <= 15 ? "full" : separation < 180 ? "waxing" : "waning";
  const value = phase === "full" ? 1.5 : phase === "waxing" ? 1 : phase === "waning" ? -0.5 : 0;
  return candidate("Moon phase / VOC", value / 2, value / 2, `${phase} Moon at ${round(separation)}° solar separation; VOC is not calculated and contributes 0.`, "recovered-archive-master", [`Sun:${round(sun.longitude)}°`, `Moon:${round(moon.longitude)}°`], "The recovered implementation hard-coded VOC false; no historical VOC rule is reconstructed.", enabled);
}

function nodes(planets: RecoveredPlanetInput[], enabled: boolean): RecoveredLayerEvidence {
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  for (const node of planets.filter((p) => p.planet === "Rahu" || p.planet === "Ketu")) {
    const value = node.house !== null && ANGULAR_HOUSES.has(node.house) ? 2 : 1;
    const [a, b] = scoreForSide(sideForHouse(node.house), value);
    scoreA += a;
    scoreB += b;
    if (sideForHouse(node.house) !== "neutral") details.push(`${node.planet} H${node.house}: +${value}`);
  }
  return candidate("Nodes (Rahu/Ketu)", scoreA, scoreB, details.length ? details.join("; ") : "Nodes are outside scoring family houses or unavailable.", "recovered-archive-master", planets.filter((p) => p.planet === "Rahu" || p.planet === "Ketu").map((p) => `${p.planet}:${round(p.longitude)}°`), undefined, enabled);
}

function upachaya(planets: RecoveredPlanetInput[], enabled: boolean): RecoveredLayerEvidence {
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  for (const planet of planets.filter((p) => MALEFICS.has(p.planet) && p.house !== null && UPACHAYA_HOUSES.has(p.house))) {
    const [a, b] = scoreForSide(sideForHouse(planet.house), 1);
    scoreA += a;
    scoreB += b;
    details.push(`${planet.planet} H${planet.house}: +1`);
  }
  return candidate("Upachaya growth", scoreA, scoreB, details.length ? details.join("; ") : "No recovered malefic Upachaya placement.", "recovered-archive-master", planets.filter((p) => MALEFICS.has(p.planet)).map((p) => `${p.planet}:H${p.house ?? "?"}`), undefined, enabled);
}

function viaCombusta(planets: RecoveredPlanetInput[], enabled: boolean): RecoveredLayerEvidence {
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  for (const planet of planets.filter((p) => p.longitude >= 195 && p.longitude < 225)) {
    const [a, b] = scoreForSide(sideForHouse(planet.house), -3);
    scoreA += a;
    scoreB += b;
    if (sideForHouse(planet.house) !== "neutral") details.push(`${planet.planet} H${planet.house}: -3`);
  }
  return candidate("Via Combusta", scoreA, scoreB, details.length ? details.join("; ") : "No scoring-family planet in the declared 15° Libra–15° Scorpio span.", "recovered-archive-master", planets.map((p) => `${p.planet}:${round(p.longitude)}°`), undefined, enabled);
}

function besiegement(planets: RecoveredPlanetInput[], enabled: boolean): RecoveredLayerEvidence {
  const mars = planets.find((p) => p.planet === "Mars");
  const saturn = planets.find((p) => p.planet === "Saturn");
  if (!mars || !saturn) return candidate("Besiegement", 0, 0, "Mars or Saturn unavailable.", "recovered-archive-master", []);
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  for (const planet of planets.filter((p) => p.planet !== "Mars" && p.planet !== "Saturn")) {
    if (angularDistance(planet.longitude, mars.longitude) > 8 || angularDistance(planet.longitude, saturn.longitude) > 8) continue;
    const [a, b] = scoreForSide(sideForHouse(planet.house), -2);
    scoreA += a;
    scoreB += b;
    if (sideForHouse(planet.house) !== "neutral") details.push(`${planet.planet} H${planet.house}: -2`);
  }
  return candidate("Besiegement", scoreA, scoreB, details.length ? details.join("; ") : "No planet lies within 8° of both Mars and Saturn.", "recovered-archive-master", [`Mars:${round(mars.longitude)}°`, `Saturn:${round(saturn.longitude)}°`], undefined, enabled);
}

function mutualReception(planets: RecoveredPlanetInput[], enabled: boolean): RecoveredLayerEvidence {
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  const sideA = planets.filter((p) => sideForHouse(p.house) === "A");
  const sideB = planets.filter((p) => sideForHouse(p.house) === "B");
  for (const left of sideA) for (const right of sideB) {
    const leftLord = SIGN_RULERS[left.sign];
    const rightLord = SIGN_RULERS[right.sign];
    if (leftLord === right.planet && rightLord === left.planet) {
      scoreA += 2;
      scoreB += 2;
      details.push(`${left.planet} ↔ ${right.planet}: +2 each`);
    }
  }
  return candidate("Mutual reception", scoreA, scoreB, details.length ? details.join("; ") : "No cross-family mutual reception.", "recovered-archive-master", planets.map((p) => `${p.planet}:${p.sign}`), undefined, enabled);
}

function translation(planets: RecoveredPlanetInput[], enabled: boolean): RecoveredLayerEvidence {
  const lords = new Set(planets.map((p) => SIGN_RULERS[p.sign]).filter(Boolean));
  const sideA = planets.filter((p) => sideForHouse(p.house) === "A");
  const sideB = planets.filter((p) => sideForHouse(p.house) === "B");
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  for (const translator of planets.filter((p) => !lords.has(p.planet))) {
    const closest = (candidates: RecoveredPlanetInput[]) => candidates.map((entry) => ({ entry, distance: angularDistance(translator.longitude, entry.longitude) })).filter((x) => aspectType(translator.longitude, x.entry.longitude)).sort((a, b) => a.distance - b.distance)[0];
    const left = closest(sideA);
    const right = closest(sideB);
    if (!left || !right) continue;
    if (left.distance < right.distance) { scoreA += 3; details.push(`${translator.planet} → A: +3`); }
    else { scoreB += 3; details.push(`${translator.planet} → B: +3`); }
  }
  return candidate("Translation of light", scoreA, scoreB, details.length ? details.join("; ") : "No third planet geometrically connected to both families.", "recovered-archive-master", planets.map((p) => `${p.planet}:${round(p.longitude)}°`), "This is a geometric approximation; applying/separating speed data are unavailable.", enabled);
}

function harmony(planets: RecoveredPlanetInput[], enabled: boolean): RecoveredLayerEvidence {
  const sideA = planets.filter((p) => sideForHouse(p.house) === "A");
  const sideB = planets.filter((p) => sideForHouse(p.house) === "B");
  let scoreA = 0;
  let scoreB = 0;
  const details: string[] = [];
  for (const left of sideA) for (const right of sideB) {
    const type = aspectType(left.longitude, right.longitude);
    if (type === "trine" || type === "sextile") { scoreA += 1; scoreB += 1; details.push(`${left.planet}-${right.planet} ${type}: +1 each`); }
    if (type === "square" || type === "opposition") { scoreA -= 1; scoreB -= 1; details.push(`${left.planet}-${right.planet} ${type}: -1 each`); }
  }
  return candidate("Harmonious vs friction aspects", scoreA, scoreB, details.length ? details.join("; ") : "No cross-family harmony or friction aspect.", "recovered-archive-master", planets.map((p) => `${p.planet}:${round(p.longitude)}°`), "Do not add this to a score that already counts the same cross-family aspects.", enabled);
}

export function buildRecoveredLayerEvidence(input: RecoveredLayerChartInput): RecoveredLayerEvidence[] {
  const enabled = input.enableScoring === true;
  if (input.planets.length === 0) throw new Error("Recovered layer evidence requires at least one planet.");
  for (const planet of input.planets) {
    if (!Number.isFinite(planet.longitude)) throw new Error(`Invalid longitude for ${planet.planet}.`);
    if (!planet.sourceCoordinate.trim()) throw new Error(`Missing source-coordinate provenance for ${planet.planet}.`);
  }
  return [
    fixedStars(input.planets, enabled),
    retrograde(input.planets, enabled),
    lunarFlow(input.planets, enabled),
    chartWideAspects(input.planets, enabled),
    moonPhase(input.planets, enabled),
    nodes(input.planets, enabled),
    upachaya(input.planets, enabled),
    viaCombusta(input.planets, enabled),
    besiegement(input.planets, enabled),
    mutualReception(input.planets, enabled),
    translation(input.planets, enabled),
    harmony(input.planets, enabled),
  ];
}

export function signFromLongitude(longitude: number): string {
  return SIGN_ORDER[Math.floor(normalize(longitude) / 30)] ?? "Aries";
}

export function signLordForLongitude(longitude: number): string | undefined {
  return SIGN_RULERS[signFromLongitude(longitude)];
}

export function signIndexForName(sign: string): number {
  return SIGN_INDEX.get(sign) ?? -1;
}

/**
 * Adapter for the live unified event chart. The ephemeris module is already
 * topocentric; this bridge only carries its values into the recovered evidence
 * contract and does not recalculate or reinterpret the houses.
 */
export function summarizeRecoveredLayerScores(layers: RecoveredLayerEvidence[]): RecoveredScoreSummary {
  const enabledLayers = layers.filter((layer) => layer.enabledForScoring);
  return {
    enabled: enabledLayers.length > 0,
    scoreA: round(enabledLayers.reduce((sum, layer) => sum + layer.scoreA, 0)),
    scoreB: round(enabledLayers.reduce((sum, layer) => sum + layer.scoreB, 0)),
    contributingLayers: enabledLayers.map((layer) => layer.name),
  };
}

export function buildRecoveredEvidenceFromEphemeris(
  result: EphemerisResult,
  orientation: "standard" | "inverse-180",
  enableScoring = false,
): RecoveredLayerEvidence[] {
  return buildRecoveredLayerEvidence({
    orientation,
    enableScoring,
    planets: result.planets.map((planet) => ({
      planet: planet.name,
      longitude: planet.eclipticLon,
      sign: planet.sign,
      house: planet.house,
      rx: planet.retrograde,
      sourceCoordinate: "topocentric apparent ecliptic longitude; local azimuth/altitude retained by source",
      calculationMode: "agent-view",
    })),
  });
}
