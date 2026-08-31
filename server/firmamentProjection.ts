/**
 * Firmament fixed-frame geometry.
 *
 * This module is source-neutral: a position may come from the Zetetic sky
 * calculation, J2000 God View, or Agent View, while this layer preserves the
 * declared rendering and house conventions.
 *
 * Fixed frame: North=0°, East=90°, South=180°, West=270°.
 * House 1 begins at East (90°), with houses progressing toward decreasing
 * azimuth: East → North → West → South.
 *
 * Seasonal radius is a configurable ring-distance model and is not a hidden
 * modification of any source ephemeris.
 */

export type CalculationMode = "zetetic-sky" | "j2000-god-view" | "agent-view";

export interface FirmamentPosition {
  body: string;
  /** Degrees in the fixed convention: North=0, East=90, South=180, West=270. */
  azimuth: number;
  /** Distance from the pole/center in model units. */
  radius: number;
  altitude?: number;
  sourceCoordinate?: string;
  coordinateEpoch?: string;
  calculationMode: CalculationMode;
}

export interface DiskCenter { cx: number; cy: number; }
export interface DiskPoint { x: number; y: number; }

export const FIRMAMENT_RADIUS_SEMANTICS = {
  "zetetic-sky": "declared ring-distance from the fixed-pole center in the Zetetic sky model",
  "j2000-god-view": "declared fixed-background sector radius in the J2000 God View model",
  "agent-view": "declared event-position radius from the Agent View source model",
} as const;

export function validateFirmamentPosition(position: FirmamentPosition): FirmamentPosition {
  if (!position.body.trim()) throw new Error("Firmament position requires a body name.");
  if (!Number.isFinite(position.azimuth)) throw new Error("Firmament position azimuth must be finite.");
  if (!Number.isFinite(position.radius) || position.radius < 0) throw new Error("Firmament position radius must be a finite non-negative declared value.");
  if (!position.calculationMode || !(position.calculationMode in FIRMAMENT_RADIUS_SEMANTICS)) throw new Error("Firmament position requires a declared calculation mode.");
  if (!position.sourceCoordinate?.trim()) throw new Error("Firmament position requires source-coordinate provenance.");
  return position;
}

export function radiusSemanticsFor(mode: CalculationMode): string {
  return FIRMAMENT_RADIUS_SEMANTICS[mode];
}

export interface SeasonalRadiusParams {
  dayOfYear: number;
  baseRadius: number;
  seasonalAmplitude: number;
  phaseOffsetDay?: number;
  periodDays?: number;
  minRadius?: number;
  maxRadius?: number;
}

export interface AspectResult {
  angularSeparation: number;
  radialSeparation: number;
  isAngularAspect: boolean;
  isRadiallyStrong: boolean;
}

export function normalizeFirmamentDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** North→top, East→right, South→bottom, West→left. */
export function projectToDisk(azimuthDeg: number, radius: number, center: DiskCenter): DiskPoint {
  const theta = (normalizeFirmamentDegrees(azimuthDeg) * Math.PI) / 180;
  return {
    x: center.cx + radius * Math.sin(theta),
    y: center.cy - radius * Math.cos(theta),
  };
}

/** H1=East and houses progress in decreasing azimuth. */
export function fixedHouseOf(azimuthDeg: number): number {
  const delta = normalizeFirmamentDegrees(90 - azimuthDeg);
  return Math.floor(delta / 30) + 1;
}

export function computeSeasonalRadius(params: SeasonalRadiusParams): number {
  const {
    dayOfYear,
    baseRadius,
    seasonalAmplitude,
    phaseOffsetDay = 80,
    periodDays = 365.25,
    minRadius,
    maxRadius,
  } = params;

  if (!Number.isFinite(dayOfYear) || !Number.isFinite(baseRadius) || !Number.isFinite(seasonalAmplitude)) {
    throw new Error("Seasonal-radius inputs must be finite numbers.");
  }
  if (periodDays <= 0) throw new Error("Seasonal-radius period must be positive.");

  const seasonalPhase = (2 * Math.PI * (dayOfYear - phaseOffsetDay)) / periodDays;
  let radius = baseRadius + seasonalAmplitude * Math.cos(seasonalPhase);
  if (minRadius !== undefined) radius = Math.max(minRadius, radius);
  if (maxRadius !== undefined) radius = Math.min(maxRadius, radius);
  return radius;
}

export function evaluateAspect(
  a: FirmamentPosition,
  b: FirmamentPosition,
  angularOrbDeg: number,
  radialThreshold: number,
  aspectAngles: number[] = [0, 60, 90, 120, 180],
): AspectResult {
  validateFirmamentPosition(a);
  validateFirmamentPosition(b);
  if (angularOrbDeg < 0 || radialThreshold < 0) {
    throw new Error("Aspect orb and radial threshold must be non-negative.");
  }
  const rawDelta = Math.abs(normalizeFirmamentDegrees(a.azimuth) - normalizeFirmamentDegrees(b.azimuth));
  const angularSeparation = Math.min(rawDelta, 360 - rawDelta);
  const isAngularAspect = aspectAngles.some((target) => Math.abs(angularSeparation - target) <= angularOrbDeg);
  const radialSeparation = Math.abs(a.radius - b.radius);
  return { angularSeparation, radialSeparation, isAngularAspect, isRadiallyStrong: radialSeparation <= radialThreshold };
}

export const FIRMAMENT_ANCHORS = {
  north: { azimuth: 0, screen: "top" },
  east: { azimuth: 90, screen: "right" },
  south: { azimuth: 180, screen: "bottom" },
  west: { azimuth: 270, screen: "left" },
} as const;

export const FIRMAMENT_HOUSE_ANCHORS = {
  house1: 90,
  house4: 0,
  house7: 270,
  house10: 180,
} as const;

export const FIRMAMENT_SEASONAL_RADIUS = {
  R_CANCER: 1600,
  R_CAPRICORN: 2900,
} as const;

export function seasonalRadiusFromCancerCapricorn(dayOfYear: number, phaseOffsetDay = 172, periodDays = 365.25): number {
  const baseRadius = (FIRMAMENT_SEASONAL_RADIUS.R_CANCER + FIRMAMENT_SEASONAL_RADIUS.R_CAPRICORN) / 2;
  const seasonalAmplitude = (FIRMAMENT_SEASONAL_RADIUS.R_CAPRICORN - FIRMAMENT_SEASONAL_RADIUS.R_CANCER) / 2;
  return computeSeasonalRadius({ dayOfYear, baseRadius, seasonalAmplitude, phaseOffsetDay, periodDays });
}

export function seasonalRadiusAudit(dayOfYear: number, phaseOffsetDay = 172, periodDays = 365.25) {
  const radius = seasonalRadiusFromCancerCapricorn(dayOfYear, phaseOffsetDay, periodDays);
  return {
    dayOfYear,
    phaseOffsetDay,
    periodDays,
    radius,
    baseRadius: (FIRMAMENT_SEASONAL_RADIUS.R_CANCER + FIRMAMENT_SEASONAL_RADIUS.R_CAPRICORN) / 2,
    seasonalAmplitude: (FIRMAMENT_SEASONAL_RADIUS.R_CAPRICORN - FIRMAMENT_SEASONAL_RADIUS.R_CANCER) / 2,
    cancerRadius: FIRMAMENT_SEASONAL_RADIUS.R_CANCER,
    capricornRadius: FIRMAMENT_SEASONAL_RADIUS.R_CAPRICORN,
    model: "configurable seasonal ring-distance function",
  } as const;
}

export function inverseFirmamentPosition(position: FirmamentPosition): FirmamentPosition {
  return { ...position, azimuth: normalizeFirmamentDegrees(position.azimuth + 180) };
}

export function positionAudit(position: FirmamentPosition, center: DiskCenter) {
  validateFirmamentPosition(position);
  return {
    ...position,
    normalizedAzimuth: normalizeFirmamentDegrees(position.azimuth),
    house: fixedHouseOf(position.azimuth),
    projected: projectToDisk(position.azimuth, position.radius, center),
  };
}
