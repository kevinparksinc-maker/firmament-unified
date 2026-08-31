/**
 * Experimental dome-model seasonal-radius and ancient-horizon calculations.
 *
 * This is a declared zetetic model, not a conventional astronomical reference.
 * The constants are configurable because no single standardized radius table was
 * supplied by the cited traditions. Nothing in this module changes Sports
 * scoring until a separate integration explicitly opts in.
 */

export type DomeSeasonalRadiusConfig = {
  radiusCancerMiles: number;
  radiusCapricornMiles: number;
  cycleDays: number;
  summerSolsticeDay: number;
};

export const DEFAULT_DOME_SEASONAL_RADIUS_CONFIG: DomeSeasonalRadiusConfig = {
  radiusCancerMiles: 1600,
  radiusCapricornMiles: 2900,
  cycleDays: 365.25,
  summerSolsticeDay: 172,
};

export type DomeSeasonalRadiusAudit = {
  dayOfYear: number;
  radiusCancerMiles: number;
  radiusCapricornMiles: number;
  radiusEquinoxMiles: number;
  solarRadiusMiles: number;
  angularVelocityDegreesPerHour: number;
  localSiderealAngleDegrees: number;
  observerDistanceFromPoleMiles: number;
  seasonalBearingOffsetDegrees: number;
  ascendantDegrees: number;
  apparentSizeRelativeToEquinox: number;
  distanceIntensityRelativeToEquinox: number;
  daylightBoundaryProxyDegrees: number;
};

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite`);
  }
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

/**
 * Returns the model's Sun-path radius for a northern-hemisphere seasonal cycle.
 * The phase is explicitly anchored so day 172 is the tight Cancer radius and
 * approximately day 355 is the wide Capricorn radius.
 */
export function solarRadius(
  dayOfYear: number,
  config: DomeSeasonalRadiusConfig = DEFAULT_DOME_SEASONAL_RADIUS_CONFIG,
): number {
  assertFinite("dayOfYear", dayOfYear);
  if (dayOfYear < 1 || dayOfYear > config.cycleDays + 1) {
    throw new Error("dayOfYear must fall within the configured annual cycle");
  }
  if (config.radiusCancerMiles <= 0 || config.radiusCapricornMiles <= 0) {
    throw new Error("solar path radii must be positive");
  }

  const radiusEquinoxMiles =
    (config.radiusCancerMiles + config.radiusCapricornMiles) / 2;
  const amplitude =
    (config.radiusCapricornMiles - config.radiusCancerMiles) / 2;
  const phase =
    ((dayOfYear - config.summerSolsticeDay) / config.cycleDays) * 2 * Math.PI;

  return radiusEquinoxMiles - amplitude * Math.cos(phase);
}

/**
 * Model angular velocity, using a 24-hour lap and the supplied radius ratio.
 */
export function angularVelocityDegreesPerHour(
  solarRadiusMilesValue: number,
  config: DomeSeasonalRadiusConfig = DEFAULT_DOME_SEASONAL_RADIUS_CONFIG,
): number {
  assertFinite("solarRadiusMiles", solarRadiusMilesValue);
  if (solarRadiusMilesValue <= 0) {
    throw new Error("solarRadiusMiles must be positive");
  }
  const radiusEquinoxMiles =
    (config.radiusCancerMiles + config.radiusCapricornMiles) / 2;
  return 15 * (radiusEquinoxMiles / solarRadiusMilesValue);
}

/**
 * Maps the radius difference to the proposed declination-equivalent bearing
 * offset. The observer distance is deliberately required; no default is safe.
 */
export function seasonalBearingOffsetDegrees(
  dayOfYear: number,
  observerDistanceFromPoleMiles: number,
  config: DomeSeasonalRadiusConfig = DEFAULT_DOME_SEASONAL_RADIUS_CONFIG,
): number {
  assertFinite("observerDistanceFromPoleMiles", observerDistanceFromPoleMiles);
  if (observerDistanceFromPoleMiles <= config.radiusCancerMiles) {
    throw new Error(
      "observerDistanceFromPoleMiles must exceed the Cancer-path radius for the configured scaling",
    );
  }
  const radius = solarRadius(dayOfYear, config);
  const maxDelta = observerDistanceFromPoleMiles - config.radiusCancerMiles;
  return (
    ((observerDistanceFromPoleMiles - radius) / maxDelta) * 90
  );
}

/**
 * Ancient-horizon Ascendant proposal supplied by the user, with the seasonal
 * bearing offset substituted for obliquity. The angle named LST here is an
 * explicit input to this experimental path; the module does not derive it from
 * the conventional Earth-rotation reference.
 */
export function calculateAncientHorizonAscendant(
  localSiderealAngleDegrees: number,
  seasonalBearingOffsetDegreesValue: number,
): number {
  assertFinite("localSiderealAngleDegrees", localSiderealAngleDegrees);
  assertFinite(
    "seasonalBearingOffsetDegrees",
    seasonalBearingOffsetDegreesValue,
  );

  const offsetRad = (seasonalBearingOffsetDegreesValue * Math.PI) / 180;
  const localAngleRad = (localSiderealAngleDegrees * Math.PI) / 180;
  const ascendantRadians = Math.atan2(
    Math.cos(localAngleRad),
    -(
      Math.sin(offsetRad) +
      Math.cos(offsetRad) * Math.sin(localAngleRad)
    ),
  );
  return normalizeDegrees((ascendantRadians * 180) / Math.PI);
}

/** Relative apparent angular-size proxy: inverse distance normalized to equinox. */
export function apparentSizeRelativeToEquinox(
  solarRadiusMilesValue: number,
  config: DomeSeasonalRadiusConfig = DEFAULT_DOME_SEASONAL_RADIUS_CONFIG,
): number {
  const equinoxRadius =
    (config.radiusCancerMiles + config.radiusCapricornMiles) / 2;
  if (solarRadiusMilesValue <= 0) {
    throw new Error("solarRadiusMiles must be positive");
  }
  return equinoxRadius / solarRadiusMilesValue;
}

/** Relative inverse-square distance-intensity proxy normalized to equinox. */
export function distanceIntensityRelativeToEquinox(
  solarRadiusMilesValue: number,
  config: DomeSeasonalRadiusConfig = DEFAULT_DOME_SEASONAL_RADIUS_CONFIG,
): number {
  const sizeRatio = apparentSizeRelativeToEquinox(
    solarRadiusMilesValue,
    config,
  );
  return sizeRatio * sizeRatio;
}

/**
 * The current specification does not provide enough geometry to calculate a
 * sunrise or sunset clock time. This returns the seasonal bearing offset as an
 * explicitly labeled boundary proxy for display and later geometry work.
 */
export function daylightBoundaryProxyDegrees(
  dayOfYear: number,
  observerDistanceFromPoleMiles: number,
  config: DomeSeasonalRadiusConfig = DEFAULT_DOME_SEASONAL_RADIUS_CONFIG,
): number {
  return seasonalBearingOffsetDegrees(
    dayOfYear,
    observerDistanceFromPoleMiles,
    config,
  );
}

export function calculateDomeSeasonalRadiusAudit(input: {
  dayOfYear: number;
  localSiderealAngleDegrees: number;
  observerDistanceFromPoleMiles: number;
  config?: DomeSeasonalRadiusConfig;
}): DomeSeasonalRadiusAudit {
  const config = input.config ?? DEFAULT_DOME_SEASONAL_RADIUS_CONFIG;
  const radiusEquinoxMiles =
    (config.radiusCancerMiles + config.radiusCapricornMiles) / 2;
  const radius = solarRadius(input.dayOfYear, config);
  const bearingOffset = seasonalBearingOffsetDegrees(
    input.dayOfYear,
    input.observerDistanceFromPoleMiles,
    config,
  );

  return {
    dayOfYear: input.dayOfYear,
    radiusCancerMiles: config.radiusCancerMiles,
    radiusCapricornMiles: config.radiusCapricornMiles,
    radiusEquinoxMiles,
    solarRadiusMiles: radius,
    angularVelocityDegreesPerHour: angularVelocityDegreesPerHour(radius, config),
    localSiderealAngleDegrees: normalizeDegrees(input.localSiderealAngleDegrees),
    observerDistanceFromPoleMiles: input.observerDistanceFromPoleMiles,
    seasonalBearingOffsetDegrees: bearingOffset,
    ascendantDegrees: calculateAncientHorizonAscendant(
      input.localSiderealAngleDegrees,
      bearingOffset,
    ),
    apparentSizeRelativeToEquinox: apparentSizeRelativeToEquinox(
      radius,
      config,
    ),
    distanceIntensityRelativeToEquinox: distanceIntensityRelativeToEquinox(
      radius,
      config,
    ),
    daylightBoundaryProxyDegrees: daylightBoundaryProxyDegrees(
      input.dayOfYear,
      input.observerDistanceFromPoleMiles,
      config,
    ),
  };
}
