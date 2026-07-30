// ============================================================================
//   THE FIRMAMENT VISUAL GRAPHICS LAYER RENDERER
//   Architecture: 2D Flat Plane Vector Drawing Engine centered at Polaris
//   Rule: Background signs are frozen. House spokes rotate from the Ascendant.
// ============================================================================

export interface RenderItem {
  name: string;
  absoluteDegree: number;
  orbitRadius: number; // How far out from Polaris to draw the icon
  iconSymbol: string;
}

export interface HouseSpoke {
  houseNumber: number;
  boundaryDegree: number;
}

export class FirmamentCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private centerX: number; // Screen center pixel for Polaris (e.g., 500)
  private centerY: number; // Screen center pixel for Polaris (e.g., 500)
  private outerRadius: number; // Full scale of the sky background wheel

  constructor(canvasContext: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = canvasContext;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.outerRadius = Math.min(width, height) * 0.45;
  }

  /**
   * MASTER RENDER PIPELINE
   * Clears the screen and draws your cosmic model layer by layer.
   */
  public renderChart(ascendantDegree: number, planets: RenderItem[]) {
    this.ctx.clearRect(0, 0, this.centerX * 2, this.centerY * 2);

    // Layer 1: Draw the unmoving physical stars, pillars, and 12 signs
    this.drawFixedBackgroundSigns();
    this.drawRoyalStarPillars();

    // Layer 2: Draw the dynamic house spokes cutting across the background
    this.drawDynamicHouseLines(ascendantDegree);

    // Layer 3: Plot the moving planets exactly where they sit on the map
    this.drawPlanets(planets);

    // Layer 4: Center pinpoint for Polaris
    this.drawPolarisCenter();
  }

  /**
   * LAYER 1: Draws the 12 permanent 30° zodiac segments carved into the sky.
   */
  private drawFixedBackgroundSigns() {
    const signs = [
      "Aries",
      "Taurus",
      "Gemini",
      "Cancer",
      "Leo",
      "Virgo",
      "Libra",
      "Scorpio",
      "Sagittarius",
      "Capricorn",
      "Aquarius",
      "Pisces",
    ];

    this.ctx.save();
    for (let i = 0; i < 12; i++) {
      const startAngle = (i * 30 * Math.PI) / 180;
      const endAngle = ((i + 1) * 30 * Math.PI) / 180;

      // Draw sector divider spoke from Polaris
      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX, this.centerY);
      this.ctx.lineTo(
        this.centerX + this.outerRadius * Math.cos(startAngle),
        this.centerY + this.outerRadius * Math.sin(startAngle)
      );
      this.ctx.strokeStyle = "#2A2D34"; // Dark iron grid color
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Label the permanent background sign names text
      const textAngle = startAngle + (15 * Math.PI) / 180; // Center text in the 30° slice
      const textX = this.centerX + (this.outerRadius * 0.88) * Math.cos(textAngle);
      const textY = this.centerY + (this.outerRadius * 0.88) * Math.sin(textAngle);

      this.ctx.fillStyle = "#A0A5B5"; // Clean text color
      this.ctx.font = "bold 12px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(signs[i].toUpperCase(), textX, textY);
    }
    this.ctx.restore();
  }

  /**
   * PILLARS: Locks the 4 massive Royal Stars directly into their background addresses.
   */
  private drawRoyalStarPillars() {
    const anchors = [
      { name: "Aldebaran (E)", deg: 45, color: "#FFB03B" },
      { name: "Regulus (N)", deg: 135, color: "#41B3A3" },
      { name: "Antares (W)", deg: 225, color: "#E27D60" },
      { name: "Fomalhaut (S)", deg: 315, color: "#85DCB0" },
    ];

    this.ctx.save();
    anchors.forEach((star) => {
      const rad = (star.deg * Math.PI) / 180;
      const starX = this.centerX + (this.outerRadius * 0.95) * Math.cos(rad);
      const starY = this.centerY + (this.outerRadius * 0.95) * Math.sin(rad);

      // Draw a physical pillar star beacon on the wheel outer rim
      this.ctx.beginPath();
      this.ctx.arc(starX, starY, 5, 0, 2 * Math.PI);
      this.ctx.fillStyle = star.color;
      this.ctx.fill();

      // Label text for the Royal Star Anchor
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.font = "9px monospace";
      this.ctx.fillText(star.name, starX + 8 * Math.cos(rad), starY + 8 * Math.sin(rad));
    });
    this.ctx.restore();
  }

  /**
   * LAYER 2: Spins the 12 equal house lines dynamically based on the Ascendant degree.
   */
  private drawDynamicHouseLines(ascendantDegree: number) {
    this.ctx.save();
    for (let i = 0; i < 12; i++) {
      // Turn the house dial exactly 30° out from your Ascendant line
      const houseAngleDeg = (ascendantDegree + i * 30) % 360;
      const rad = (houseAngleDeg * Math.PI) / 180;

      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX, this.centerY);
      this.ctx.lineTo(
        this.centerX + this.outerRadius * Math.cos(rad),
        this.centerY + this.outerRadius * Math.sin(rad)
      );

      // House 1 (Ascendant) and House 10 are highlighted thick
      if (i === 0) {
        this.ctx.strokeStyle = "#FFD700"; // Golden line for Ascendant
        this.ctx.lineWidth = 3;
      } else if (i === 9) {
        this.ctx.strokeStyle = "#00E5FF"; // Bright cyan line for House 10 (MC)
        this.ctx.lineWidth = 2;
      } else {
        this.ctx.strokeStyle = "rgba(100, 110, 140, 0.4)"; // Soft blue-grey for secondary lines
        this.ctx.lineWidth = 1;
      }
      this.ctx.stroke();

      // Place House Number Labels along the inner wheel track
      const labelRad = ((houseAngleDeg + 15) * Math.PI) / 180; // Offset into the middle of house slice
      const lx = this.centerX + (this.outerRadius * 0.65) * Math.cos(labelRad);
      const ly = this.centerY + (this.outerRadius * 0.65) * Math.sin(labelRad);

      this.ctx.fillStyle = i === 0 || i === 9 ? "#FFFFFF" : "#646E8C";
      this.ctx.font = "11px sans-serif";
      this.ctx.fillText(`H${i + 1}`, lx, ly);
    }
    this.ctx.restore();
  }

  /**
   * LAYER 3: Plots the moving planets using their raw, unadjusted coordinate pinpoints.
   */
  private drawPlanets(planets: RenderItem[]) {
    this.ctx.save();
    planets.forEach((p) => {
      const rad = (p.absoluteDegree * Math.PI) / 180;

      // Map the screen coordinates using the input orbit radius scale
      const px = this.centerX + p.orbitRadius * Math.cos(rad);
      const py = this.centerY + p.orbitRadius * Math.sin(rad);

      // Draw background glow circle for the planet icon box
      this.ctx.beginPath();
      this.ctx.arc(px, py, 14, 0, 2 * Math.PI);
      this.ctx.fillStyle = "#161920";
      this.ctx.strokeStyle = "#4E5569";
      this.ctx.lineWidth = 1;
      this.ctx.fill();
      this.ctx.stroke();

      // Render the text glyph or emoji asset character symbol
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.font = "14px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(p.iconSymbol, px, py);

      // Label the precise degree next to the planet text
      this.ctx.fillStyle = "#8E94A6";
      this.ctx.font = "9px monospace";
      this.ctx.fillText(`${p.absoluteDegree.toFixed(0)}°`, px, py + 22);
    });
    this.ctx.restore();
  }

  /**
   * LAYER 4: Draws the absolute center anchor point for Polaris.
   */
  private drawPolarisCenter() {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, 6, 0, 2 * Math.PI);
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = "#FFFFFF";
    this.ctx.fill();
    this.ctx.restore();
  }
}
