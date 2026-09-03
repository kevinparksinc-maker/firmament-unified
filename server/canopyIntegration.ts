export enum ChartMode {
  STANDARD_TOPOCENTRIC = "STANDARD_TOPOCENTRIC",
  CANOPY_LOCAL = "CANOPY_LOCAL",
}

export const CANOPY_STATUS = "EXPERIMENTAL_CANOPY" as const;
export const ARCHIVED_FIXTURES = {
  alignment212476: {
    value: 212.476,
    status: "deprecated",
    replacement: 106.406,
    note: "Superseded by the validated Dallas/J2000 post-equation calibration fixture.",
  },
} as const;

export interface CalibrationEntry {
  id: string;
  alignmentCorrectionDegrees: number;
  referenceEpoch: string;
  referenceLocation: string;
  warningForUnbenchmarkedInputs: boolean;
}

export const CANOPY_CALIBRATIONS: readonly CalibrationEntry[] = [
  {
    id: "v1.0_dallas_j2000",
    alignmentCorrectionDegrees: 106.406,
    referenceEpoch: "J2000",
    referenceLocation: "Dallas, Texas (32.7767°, -96.797°)",
    warningForUnbenchmarkedInputs: true,
  },
];

export function getCanopyCalibration(referenceLocation = "Dallas, Texas", referenceEpoch = "J2000"): CalibrationEntry {
  const exact = CANOPY_CALIBRATIONS.find(
    calibration => calibration.referenceLocation.startsWith(referenceLocation) && calibration.referenceEpoch === referenceEpoch,
  );
  return exact ?? { ...CANOPY_CALIBRATIONS[0]!, warningForUnbenchmarkedInputs: true };
}

export interface TopocentricComparisonData {
  sunAltitude?: number;
  sunAzimuth?: number;
  planetaryCoordinates?: Record<string, { longitude?: number; azimuth?: number; altitude?: number }>;
}

export interface FrameContext {
  chartMode: ChartMode;
  status: typeof CANOPY_STATUS | "STANDARD";
  calibration: CalibrationEntry | null;
  fixedCalibrationWarning: boolean;
  topocentricComparison?: TopocentricComparisonData;
}

export function createFrameContext(chartMode: ChartMode, topocentricComparison?: TopocentricComparisonData, location?: { latitudeDegrees: number; longitudeDegrees: number }): FrameContext {
  if (chartMode === ChartMode.STANDARD_TOPOCENTRIC) {
    return {
      chartMode,
      status: "STANDARD",
      calibration: null,
      fixedCalibrationWarning: false,
      topocentricComparison,
    };
  }
  const isDallasReference = location === undefined
    ? false
    : Math.abs(location.latitudeDegrees - 32.7767) < 0.0001 && Math.abs(location.longitudeDegrees - (-96.797)) < 0.0001;
  const calibration = getCanopyCalibration();
  return {
    chartMode,
    status: CANOPY_STATUS,
    calibration,
    fixedCalibrationWarning: !isDallasReference,
    topocentricComparison,
  };
}
