/**
 * Confirmed fixed-canopy calculation layer for Firmament.
 *
 * This module is intentionally separate from scoring and from Lumen Atlas.
 * Raw ephemeris longitudes are not altered here. The canopy clock is a frame
 * orientation; the corrected Ascendant is the house anchor used by Firmament.
 */

export const J2000_EPOCH_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);
export const CANOPY_SPEED_DPS = 360 / 86164.0905;
export const SOLAR_SPEED_DPS = 360 / 86400;
export const ECLIPTIC_OBLIQUITY_DEG = 23.4392911;
export const ALIGNMENT_CORRECTION_DEG = 106.406;
export const DALLAS_ASCENDANT_FIXTURE_DEG = 298;

export function bound360(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function calculateElapsedSeconds(utcMs: number): number {
  return (utcMs - J2000_EPOCH_MS) / 1000;
}

export function calculateCanopyClock(utcMs: number): number {
  return bound360(calculateElapsedSeconds(utcMs) * CANOPY_SPEED_DPS);
}

export function calculateLocalCanopyPosition(canopyClock: number, longitudeDegrees: number): number {
  return bound360(canopyClock + longitudeDegrees);
}

/** The supplied due-east/ecliptic-horizon equation, before alignment correction. */
export function calculateDueEastAscendant(lstDegrees: number, latitudeDegrees: number): number {
  const lstRad = (lstDegrees * Math.PI) / 180;
  const latRad = (latitudeDegrees * Math.PI) / 180;
  const obliquityRad = (ECLIPTIC_OBLIQUITY_DEG * Math.PI) / 180;
  const numerator = -Math.cos(lstRad);
  const denominator = Math.sin(lstRad) * Math.cos(obliquityRad) - Math.tan(latRad) * Math.sin(obliquityRad);
  return bound360((Math.atan2(numerator, denominator) * 180) / Math.PI);
}

export interface CanopyAscendantAudit {
  utcMs: number;
  elapsedSeconds: number;
  canopyClock: number;
  localCanopyPosition: number;
  rawGeometricAscendant: number;
  alignmentCorrection: number;
  trueAscendant: number;
  latitudeDegrees: number;
  longitudeDegrees: number;
  equation: string;
}

export function calculateCanopyAscendant(utcMs: number, latitudeDegrees: number, longitudeDegrees: number): CanopyAscendantAudit {
  const canopyClock = calculateCanopyClock(utcMs);
  const localCanopyPosition = calculateLocalCanopyPosition(canopyClock, longitudeDegrees);
  const rawGeometricAscendant = calculateDueEastAscendant(localCanopyPosition, latitudeDegrees);
  const trueAscendant = bound360(rawGeometricAscendant + ALIGNMENT_CORRECTION_DEG);
  return {
    utcMs,
    elapsedSeconds: calculateElapsedSeconds(utcMs),
    canopyClock,
    localCanopyPosition,
    rawGeometricAscendant,
    alignmentCorrection: ALIGNMENT_CORRECTION_DEG,
    trueAscendant,
    latitudeDegrees,
    longitudeDegrees,
    equation: "trueAscendant = bound360(dueEastAscendant(localCanopyPosition, latitude) + 106.406°)",
  };
}

export function wholeSignHouseForLongitude(longitude: number, ascendant: number): number {
  const planetSign = Math.floor(bound360(longitude) / 30);
  const ascendantSign = Math.floor(bound360(ascendant) / 30);
  return ((planetSign - ascendantSign + 12) % 12) + 1;
}

export function wholeSignCusps(ascendant: number): number[] {
  const firstSign = Math.floor(bound360(ascendant) / 30);
  return Array.from({ length: 12 }, (_, index) => ((firstSign + index) % 12) * 30);
}
