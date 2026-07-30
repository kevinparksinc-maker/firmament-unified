// ============================================================================
//   THE FIRMAMENT VISUAL GRAPHICS LAYER RENDERER (Client)
//   Architecture: 2D Flat Plane Vector Drawing Engine centered at Polaris
//   Rule: Background signs are frozen. House spokes rotate from the Ascendant.
// ============================================================================

export interface RenderItem {
  name: string;
  absoluteDegree: number;
  orbitRadius: number;
  iconSymbol: string;
}

export class FirmamentCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private centerX: number;
  private centerY: number;
  private outerRadius: number;

  constructor(canvasContext: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = canvasContext;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.outerRadius = Math.min(width, height) * 0.45;
  }

  public renderChart(ascendantDegree: number, planets: RenderItem[]) {
    this.ctx.clearRect(0, 0, this.centerX * 2, this.centerY * 2);

    this.drawFixedBackgroundSigns();
    this.drawRoyalStarPillars();
    this.drawDynamicHouseLines(ascendantDegree);
    this.drawPlanets(planets);
    this.drawPolarisCenter();
  }

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

      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX, this.centerY);
      this.ctx.lineTo(
        this.centerX + this.outerRadius * Math.cos(startAngle),
        this.centerY + this.outerRadius * Math.sin(startAngle)
      );
      this.ctx.strokeStyle = "#2A2D34";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      const textAngle = startAngle + (15 * Math.PI) / 180;
      const textX = this.centerX + (this.outerRadius * 0.88) * Math.cos(textAngle);
      const textY = this.centerY + (this.outerRadius * 0.88) * Math.sin(textAngle);

      this.ctx.fillStyle = "#A0A5B5";
      this.ctx.font = "bold 12px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(signs[i].toUpperCase(), textX, textY);
    }
    this.ctx.restore();
  }

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

      this.ctx.beginPath();
      this.ctx.arc(starX, starY, 5, 0, 2 * Math.PI);
      this.ctx.fillStyle = star.color;
      this.ctx.fill();

      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.font = "9px monospace";
      this.ctx.fillText(star.name, starX + 8 * Math.cos(rad), starY + 8 * Math.sin(rad));
    });
    this.ctx.restore();
  }

  private drawDynamicHouseLines(ascendantDegree: number) {
    this.ctx.save();
    for (let i = 0; i < 12; i++) {
      const houseAngleDeg = (ascendantDegree + i * 30) % 360;
      const rad = (houseAngleDeg * Math.PI) / 180;

      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX, this.centerY);
      this.ctx.lineTo(
        this.centerX + this.outerRadius * Math.cos(rad),
        this.centerY + this.outerRadius * Math.sin(rad)
      );

      if (i === 0) {
        this.ctx.strokeStyle = "#FFD700";
        this.ctx.lineWidth = 3;
      } else if (i === 9) {
        this.ctx.strokeStyle = "#00E5FF";
        this.ctx.lineWidth = 2;
      } else {
        this.ctx.strokeStyle = "rgba(100, 110, 140, 0.4)";
        this.ctx.lineWidth = 1;
      }
      this.ctx.stroke();

      const labelRad = ((houseAngleDeg + 15) * Math.PI) / 180;
      const lx = this.centerX + (this.outerRadius * 0.65) * Math.cos(labelRad);
      const ly = this.centerY + (this.outerRadius * 0.65) * Math.sin(labelRad);

      this.ctx.fillStyle = i === 0 || i === 9 ? "#FFFFFF" : "#646E8C";
      this.ctx.font = "11px sans-serif";
      this.ctx.fillText(`H${i + 1}`, lx, ly);
    }
    this.ctx.restore();
  }

  private drawPlanets(planets: RenderItem[]) {
    this.ctx.save();
    planets.forEach((p) => {
      const rad = (p.absoluteDegree * Math.PI) / 180;

      const px = this.centerX + p.orbitRadius * Math.cos(rad);
      const py = this.centerY + p.orbitRadius * Math.sin(rad);

      this.ctx.beginPath();
      this.ctx.arc(px, py, 14, 0, 2 * Math.PI);
      this.ctx.fillStyle = "#161920";
      this.ctx.strokeStyle = "#4E5569";
      this.ctx.lineWidth = 1;
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.font = "14px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(p.iconSymbol, px, py);

      this.ctx.fillStyle = "#8E94A6";
      this.ctx.font = "9px monospace";
      this.ctx.fillText(`${p.absoluteDegree.toFixed(0)}°`, px, py + 22);
    });
    this.ctx.restore();
  }

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
