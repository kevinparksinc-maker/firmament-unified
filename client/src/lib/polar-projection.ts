/**
 * Polar Azimuthal Equidistant Projection
 * 
 * Converts Right Ascension (RA) and Declination (Dec) coordinates
 * to canvas pixel positions for a flat Earth / snow-globe model.
 * 
 * Map Layout:
 * - Center (0,0): Polaris (+90° Dec)
 * - Middle Ring: Celestial Equator (0° Dec)
 * - Outer Edge: South Celestial Pole (-90° Dec)
 * 
 * Angle Orientation:
 * - 0° RA: North (top)
 * - 90° RA: East (right)
 * - 180° RA: South (bottom)
 * - 270° RA: West (left)
 */

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface PolarProjectionConfig {
  canvasWidth: number;
  canvasHeight: number;
  centerX: number;
  centerY: number;
  maxRadius: number; // pixels from center to outer wall
}

/**
 * Create a default configuration for a square canvas
 */
export function createDefaultConfig(canvasSize: number = 1000): PolarProjectionConfig {
  const center = canvasSize / 2;
  const maxRadius = (canvasSize / 2) * 0.95; // Leave 5% margin

  return {
    canvasWidth: canvasSize,
    canvasHeight: canvasSize,
    centerX: center,
    centerY: center,
    maxRadius,
  };
}

/**
 * Convert RA/Dec to canvas pixel position
 * 
 * @param ra Right Ascension in decimal degrees (0-360)
 * @param dec Declination in decimal degrees (-90 to +90)
 * @param config Canvas configuration
 * @returns Canvas pixel position {x, y}
 */
export function raDecToCanvasPixels(
  ra: number,
  dec: number,
  config: PolarProjectionConfig
): CanvasPosition {
  // Calculate radial distance from center
  // R = R_max × (90 - δ) / 180
  // This maps +90° Dec (Polaris) to R=0, 0° Dec (Equator) to R=R_max/2, -90° Dec (South Pole) to R=R_max
  const radius = config.maxRadius * ((90 - dec) / 180);

  // Convert RA to radians, adjusting for canvas orientation
  // Canvas: 0° at top (North), increasing clockwise
  // Standard math: 0° at right, increasing counter-clockwise
  // Adjustment: θ_canvas = (90° - RA) × (π/180)
  const raRadians = ra * (Math.PI / 180);
  const angleRadians = (Math.PI / 2) - raRadians; // Convert to canvas angle (0° at top, clockwise)

  // Calculate pixel position
  // X = X_center + R × cos(θ)
  // Y = Y_center - R × sin(θ)  (subtract because canvas Y increases downward)
  const x = config.centerX + radius * Math.cos(angleRadians);
  const y = config.centerY - radius * Math.sin(angleRadians);

  return { x, y };
}

/**
 * Calculate the distance between two points on the canvas
 */
export function canvasDistance(p1: CanvasPosition, p2: CanvasPosition): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a planet is visually close to a Royal Star on the canvas
 * (within a certain pixel distance)
 */
export function isConjunctionOnCanvas(
  planetPos: CanvasPosition,
  starPos: CanvasPosition,
  pixelTolerance: number = 30 // pixels
): boolean {
  return canvasDistance(planetPos, starPos) <= pixelTolerance;
}

/**
 * Draw a conjunction beam between planet and star
 */
export function drawConjunctionBeam(
  ctx: CanvasRenderingContext2D,
  planetPos: CanvasPosition,
  starPos: CanvasPosition,
  options: {
    color?: string;
    lineWidth?: number;
    alpha?: number;
    glow?: boolean;
  } = {}
): void {
  const {
    color = "#00ff88",
    lineWidth = 2,
    alpha = 0.6,
    glow = true,
  } = options;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Draw glow effect if enabled
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Draw the beam line
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(planetPos.x, planetPos.y);
  ctx.lineTo(starPos.x, starPos.y);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a planet marker at the given canvas position
 */
export function drawPlanetMarker(
  ctx: CanvasRenderingContext2D,
  pos: CanvasPosition,
  options: {
    radius?: number;
    color?: string;
    symbol?: string;
    fontSize?: number;
  } = {}
): void {
  const {
    radius = 8,
    color = "#ffff00",
    symbol = "●",
    fontSize = 16,
  } = options;

  ctx.save();

  // Draw circle background
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw symbol if provided
  if (symbol) {
    ctx.fillStyle = "#000000";
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbol, pos.x, pos.y);
  }

  ctx.restore();
}

/**
 * Draw a Royal Star marker at the given canvas position
 */
export function drawStarMarker(
  ctx: CanvasRenderingContext2D,
  pos: CanvasPosition,
  starName: string,
  options: {
    radius?: number;
    color?: string;
    fontSize?: number;
  } = {}
): void {
  const {
    radius = 6,
    color = "#ffffff",
    fontSize = 12,
  } = options;

  ctx.save();

  // Draw star symbol (5-pointed star)
  drawFivePointedStar(ctx, pos.x, pos.y, radius, color);

  // Draw star name label
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(starName, pos.x, pos.y + radius + 5);

  ctx.restore();
}

/**
 * Draw a 5-pointed star
 */
function drawFivePointedStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string
): void {
  const points = 5;
  const innerRadius = radius * 0.4;

  ctx.fillStyle = color;
  ctx.beginPath();

  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? radius : innerRadius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
  ctx.fill();
}

/**
 * Draw the polar projection grid
 */
export function drawPolarGrid(
  ctx: CanvasRenderingContext2D,
  config: PolarProjectionConfig,
  options: {
    gridColor?: string;
    gridAlpha?: number;
    drawDeclination?: boolean;
    drawRA?: boolean;
  } = {}
): void {
  const {
    gridColor = "#444444",
    gridAlpha = 0.3,
    drawDeclination = true,
    drawRA = true,
  } = options;

  ctx.save();
  ctx.strokeStyle = gridColor;
  ctx.globalAlpha = gridAlpha;
  ctx.lineWidth = 1;

  // Draw declination rings (latitude circles)
  if (drawDeclination) {
    for (let dec = 90; dec >= -90; dec -= 15) {
      const radius = config.maxRadius * ((90 - dec) / 180);
      ctx.beginPath();
      ctx.arc(config.centerX, config.centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Draw RA meridians (longitude lines)
  if (drawRA) {
    for (let ra = 0; ra < 360; ra += 30) {
      const raRadians = ra * (Math.PI / 180);
      const angleRadians = (Math.PI / 2) - raRadians;

      ctx.beginPath();
      ctx.moveTo(config.centerX, config.centerY);

      // Draw line from center to outer edge
      const x = config.centerX + config.maxRadius * Math.cos(angleRadians);
      const y = config.centerY - config.maxRadius * Math.sin(angleRadians);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Draw the outer boundary (ice wall)
 */
export function drawOuterBoundary(
  ctx: CanvasRenderingContext2D,
  config: PolarProjectionConfig,
  options: {
    color?: string;
    lineWidth?: number;
    alpha?: number;
  } = {}
): void {
  const {
    color = "#888888",
    lineWidth = 3,
    alpha = 0.8,
  } = options;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = alpha;

  ctx.beginPath();
  ctx.arc(config.centerX, config.centerY, config.maxRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw the celestial equator ring
 */
export function drawCelestialEquator(
  ctx: CanvasRenderingContext2D,
  config: PolarProjectionConfig,
  options: {
    color?: string;
    lineWidth?: number;
    alpha?: number;
  } = {}
): void {
  const {
    color = "#666666",
    lineWidth = 2,
    alpha = 0.5,
  } = options;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = alpha;
  ctx.setLineDash([5, 5]); // Dashed line

  const equatorRadius = config.maxRadius * 0.5; // 0° Dec is halfway
  ctx.beginPath();
  ctx.arc(config.centerX, config.centerY, equatorRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
