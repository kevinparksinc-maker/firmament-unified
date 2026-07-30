/**
 * COORDINATE TRANSFORMER — Flat-Plane North Pole Grid
 *
 * Converts raw astronomical data (spherical coordinates from ephemeris.ts)
 * into flat-plane coordinates for the parabolic dome renderer.
 *
 * Architecture: ephemeris.ts outputs celestial positions → this layer projects
 * them onto the flat North Pole (0,0) grid and calculates the planar Ascendant.
 */

export interface PlanarCoordinate {
  x: number;
  y: number;
}

export interface TransformedChart {
  planarAscendant: number; // 0-360, zodiac degree at due East horizon
  skyRotation: number; // current rotation of the celestial wheel
  userGridPosition: PlanarCoordinate; // where the observer sits on flat plane
  rZodiac: number; // radius of zodiac ring from North Pole
}

/**
 * Calculates the flat-plane Ascendant degree (0-360)
 * The Ascendant is the zodiac degree sitting due East from the observer,
 * on the horizon line of the flat North Pole grid.
 *
 * @param userX The observer's X coordinate relative to North Pole (0,0)
 * @param userY The observer's Y coordinate relative to North Pole (0,0)
 * @param rZodiac The radius of the zodiac ring from the North Pole
 * @param skyRotation The current rotation of the zodiac wheel in degrees
 * @returns The Ascendant in degrees (0-360)
 */
export function calculatePlanarAscendant(
  userX: number,
  userY: number,
  rZodiac: number,
  skyRotation: number
): number {
  // 1. Due East means extending straight right along the X-axis from the user.
  // The intersection point's Y coordinate must equal the user's Y.
  const yIntersection = userY;

  // 2. Prevent math errors if the user is placed outside the Zodiac ring radius
  if (Math.abs(yIntersection) >= rZodiac) {
    throw new Error(
      `User coordinate (${userX}, ${userY}) is outside the boundaries of the Zodiac radius (${rZodiac}).`
    );
  }

  // 3. Find the X coordinate where the Eastern horizon line intersects the Zodiac circle
  // Equation: X^2 + Y^2 = R^2  ->  X = sqrt(R^2 - Y^2)
  const xIntersection = Math.sqrt(
    Math.pow(rZodiac, 2) - Math.pow(yIntersection, 2)
  );

  // 4. Calculate the absolute angle of this intersection point from the North Pole (0,0)
  let absoluteAngle = Math.atan2(yIntersection, xIntersection) * (180 / Math.PI);

  // Normalize angle to a clean 0-360 range
  if (absoluteAngle < 0) {
    absoluteAngle += 360;
  }

  // 5. Find which zodiac degree is at this angle on the fixed background.
  // The sky rotates by skyRotation degrees based on local time.
  // Subtract to find which fixed zodiac degree sits at this intersection point.
  let ascendantDegree = (absoluteAngle - skyRotation) % 360;
  if (ascendantDegree < 0) {
    ascendantDegree += 360;
  }

  return ascendantDegree;
}

/**
 * Calculates skyRotation based on Local Sidereal Time
 *
 * The sky rotates 360° every 24 hours = 15° per hour.
 * This is independent of spherical trigonometry; it's pure rotation.
 *
 * @param localHoursPassed Decimal hours since midnight (0-24)
 * @param seasonalOffset Degrees offset for where 0° Aries sits on this date
 * @returns Sky rotation in degrees (0-360)
 */
export function calculateSkyRotation(
  localHoursPassed: number,
  seasonalOffset: number = 0
): number {
  // 15 degrees per hour
  const hourlyRotation = localHoursPassed * 15;

  // Add seasonal offset and normalize to 0-360
  let rotation = (hourlyRotation + seasonalOffset) % 360;
  if (rotation < 0) {
    rotation += 360;
  }

  return rotation;
}

/**
 * Converts geographic coordinates (latitude, longitude) to flat North Pole grid (X, Y)
 *
 * This uses a simplified azimuthal equidistant projection centered at the North Pole.
 * - North Pole = (0, 0)
 * - Positive X = towards the Prime Meridian at the equator (0° longitude)
 * - Positive Y = towards 90° East longitude at the equator
 *
 * @param latitude Geographic latitude in degrees (-90 to 90)
 * @param longitude Geographic longitude in degrees (-180 to 180)
 * @param gridScale Scale factor: how many units per degree of arc
 * @returns Flat grid coordinates (X, Y) relative to North Pole (0,0)
 */
export function geoToFlatGrid(
  latitude: number,
  longitude: number,
  gridScale: number = 1
): PlanarCoordinate {
  // Distance from North Pole in degrees of arc
  const distanceFromPole = 90 - latitude; // 0 at North Pole, 90 at Equator

  // Convert to radians for trigonometry
  const distRad = (distanceFromPole * Math.PI) / 180;
  const lonRad = (longitude * Math.PI) / 180;

  // Azimuthal equidistant projection: position on flat plane
  const x = distanceFromPole * Math.cos(lonRad) * gridScale;
  const y = distanceFromPole * Math.sin(lonRad) * gridScale;

  return { x, y };
}

/**
 * Complete transformation pipeline for a birth chart
 *
 * Takes raw ephemeris data and geographic coordinates,
 * outputs the planar Ascendant and house rotation for the visual layer.
 */
export function transformChartToFlatPlane(
  birthLatitude: number,
  birthLongitude: number,
  localHoursPassed: number, // decimal hours since midnight
  rZodiac: number, // radius of zodiac ring on canvas
  gridScale: number = 1, // scale factor for geographic->grid conversion
  seasonalOffset: number = 0
): TransformedChart {
  // Convert birth location to flat grid coordinates
  const userGridPosition = geoToFlatGrid(
    birthLatitude,
    birthLongitude,
    gridScale
  );

  // Calculate how much the sky has rotated by this time
  const skyRotation = calculateSkyRotation(localHoursPassed, seasonalOffset);

  // Calculate the planar Ascendant
  const planarAscendant = calculatePlanarAscendant(
    userGridPosition.x,
    userGridPosition.y,
    rZodiac,
    skyRotation
  );

  return {
    planarAscendant,
    skyRotation,
    userGridPosition,
    rZodiac,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// ROYAL STAR FIXED WHEEL MAPPING
// ─────────────────────────────────────────────────────────────────────────

/**
 * Offset to align sidereal ephemeris to the Royal Star Fixed Wheel
 * Aldebaran (15° Taurus = 45° sidereal) maps to 0° on the physical wheel
 */
const ROYAL_STAR_OFFSET = -45.0;

/**
 * Maps a sidereal ephemeris position onto the fixed 360° Royal Star wheel
 *
 * Royal Star Grid:
 * - Aldebaran (East):    0° / 360°
 * - Regulus (North):     90°
 * - Antares (West):      180°
 * - Fomalhaut (South):   270°
 *
 * @param siderealDegree Raw sidereal longitude (0-360) from ephemeris
 * @returns Position on the Royal Star Fixed Wheel (0-360)
 */
export function mapToRoyalStarWheel(siderealDegree: number): number {
  let wheelDegree = (siderealDegree + ROYAL_STAR_OFFSET) % 360;

  if (wheelDegree < 0) {
    wheelDegree += 360;
  }

  return wheelDegree;
}

/**
 * TRUE FIRMAMENT VALIDATION
 * Confirms that the physical relationship between planets and Nakshatras
 * remains unbroken after shifting to the Royal Star Wheel.
 *
 * Account for the -45° rotation: if we add 45° back to the wheel position,
 * it should restore the original sidereal nakshatra index.
 *
 * @param siderealDegree Raw sidereal position
 * @param wheelDegree Mapped position on Royal Star wheel
 * @returns Object with nakshatra index (0-26) and validation status
 */
export function validateNakshatraAlignment(
  siderealDegree: number,
  wheelDegree: number
): { nakshatraIndex: number; isAligned: boolean } {
  const NAKSHATRA_WIDTH = 360 / 27; // 13.3333° per nakshatra

  // Calculate the raw sidereal Nakshatra index (0-26)
  const siderealNakshatra = Math.floor(siderealDegree / NAKSHATRA_WIDTH);

  // To check the wheel Nakshatra, add back the 45° rotation offset
  const restoredDegree = (wheelDegree + 45.0) % 360;
  const wheelNakshatra = Math.floor(restoredDegree / NAKSHATRA_WIDTH);

  return {
    nakshatraIndex: siderealNakshatra,
    isAligned: siderealNakshatra === wheelNakshatra,
  };
}
