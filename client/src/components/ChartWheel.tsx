/**
 * ARCANA STATE — 2D Chart Wheel
 * Shows all 12 houses with their sign cusps and planet placements.
 * The Ascendant is always on the left (9 o'clock position), traditional style.
 */

import React from "react";

interface Planet {
  name: string;
  symbol: string;
  siderealLon: number;
  sign: string;
  degreeInSign: number;
  minutes: number;
  retrograde: boolean;
  house: number;
}

interface HouseCusp {
  house: number;
  sign: string;
  degree: number;
  minutes: number;
}

interface Angles {
  asc: number;
  desc: number;
  mc: number;
  ic: number;
}

interface ChartWheelProps {
  planets: Planet[];
  houseCusps: HouseCusp[];
  angles: Angles;
  size?: number;
}

const ZODIAC_SIGNS = [
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

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

const SIGN_COLORS: Record<string, string> = {
  Aries: "#ff6644",
  Taurus: "#88cc44",
  Gemini: "#ffcc44",
  Cancer: "#88ccff",
  Leo: "#ffaa22",
  Virgo: "#aaccaa",
  Libra: "#ffccaa",
  Scorpio: "#cc4444",
  Sagittarius: "#cc8844",
  Capricorn: "#888888",
  Aquarius: "#4488ff",
  Pisces: "#8888ff",
};

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "⛢",
  Neptune: "♆",
  Pluto: "♇",
  Rahu: "☊",
  Ketu: "☋",
  Asc: "AC",
  Dsc: "DC",
  MC: "MC",
  IC: "IC",
};

const PLANET_COLORS: Record<string, string> = {
  Sun: "#ffd700",
  Moon: "#e8e8ff",
  Mercury: "#aaaaaa",
  Venus: "#ffccaa",
  Mars: "#ff4444",
  Jupiter: "#ffaa44",
  Saturn: "#ddcc88",
  Uranus: "#88ffee",
  Neptune: "#4488ff",
  Pluto: "#aa88cc",
  Rahu: "#88aaff",
  Ketu: "#ff8888",
};

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// Convert sidereal longitude to angle on wheel
// ASC is at 180° (left/9 o'clock), wheel goes counterclockwise
function lonToAngle(lon: number, ascLon: number): number {
  // Offset so ASC is at 180° (left side)
  const offset = lon - ascLon + 180;
  return ((offset % 360) + 360) % 360;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = degToRad(angleDeg - 90); // -90 so 0° is at top
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export function ChartWheel({
  planets,
  houseCusps,
  angles,
  size = 420,
}: ChartWheelProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.47;
  const zodiacR = size * 0.42;
  const zodiacInnerR = size * 0.35;
  const houseR = size * 0.33;
  const planetR = size * 0.26;
  const innerR = size * 0.14;

  const ascLon = angles.asc;

  // Build house cusp lines
  const houseLines = houseCusps.map(cusp => {
    const angle = lonToAngle(
      ascLon + (cusp.house - 1) * 30, // equal houses from ASC
      ascLon
    );
    const inner = polarToXY(cx, cy, innerR, angle);
    const outer = polarToXY(cx, cy, houseR, angle);
    return { angle, inner, outer, cusp };
  });

  // Build planet positions
  const planetPositions = planets.map(p => {
    const angle = lonToAngle(p.siderealLon, ascLon);
    const pos = polarToXY(cx, cy, planetR, angle);
    return { ...p, angle, pos };
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {/* Background */}
        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          fill="#050810"
          stroke="#1a2a3a"
          strokeWidth="1"
        />

        {/* Zodiac band */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const startAngle = lonToAngle(i * 30, ascLon);
          const endAngle = lonToAngle((i + 1) * 30, ascLon);
          const color = SIGN_COLORS[sign] ?? "#888";

          // Draw zodiac sector
          const s1 = polarToXY(cx, cy, zodiacInnerR, startAngle);
          const s2 = polarToXY(cx, cy, zodiacR, startAngle);
          const e1 = polarToXY(cx, cy, zodiacInnerR, endAngle);
          const e2 = polarToXY(cx, cy, zodiacR, endAngle);

          // Arc path for zodiac segment
          const largeArc = 0; // always < 180°
          const sweepDir = 1;

          const path = [
            `M ${s2.x} ${s2.y}`,
            `A ${zodiacR} ${zodiacR} 0 ${largeArc} ${sweepDir} ${e2.x} ${e2.y}`,
            `L ${e1.x} ${e1.y}`,
            `A ${zodiacInnerR} ${zodiacInnerR} 0 ${largeArc} ${1 - sweepDir} ${s1.x} ${s1.y}`,
            "Z",
          ].join(" ");

          // Sign symbol position (midpoint of sector)
          const midAngle = lonToAngle(i * 30 + 15, ascLon);
          const symPos = polarToXY(
            cx,
            cy,
            (zodiacR + zodiacInnerR) / 2,
            midAngle
          );

          return (
            <g key={sign}>
              <path
                d={path}
                fill={color}
                fillOpacity="0.12"
                stroke={color}
                strokeOpacity="0.3"
                strokeWidth="0.5"
              />
              <text
                x={symPos.x}
                y={symPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size * 0.032}
                fill={color}
                fillOpacity="0.9"
                style={{ fontFamily: "serif" }}
              >
                {SIGN_SYMBOLS[sign]}
              </text>
            </g>
          );
        })}

        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={zodiacR}
          fill="none"
          stroke="#1a2a3a"
          strokeWidth="1"
        />
        <circle
          cx={cx}
          cy={cy}
          r={zodiacInnerR}
          fill="none"
          stroke="#1a2a3a"
          strokeWidth="0.5"
        />
        <circle
          cx={cx}
          cy={cy}
          r={houseR}
          fill="none"
          stroke="#1a2a3a"
          strokeWidth="0.5"
        />

        {/* House cusp lines */}
        {houseLines.map(({ angle, inner, outer, cusp }) => {
          const isAngle = [1, 4, 7, 10].includes(cusp.house);
          return (
            <g key={cusp.house}>
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={isAngle ? "#c8923a" : "#1a2a3a"}
                strokeWidth={isAngle ? 1.5 : 0.8}
                strokeOpacity={isAngle ? 1 : 0.6}
              />
              {/* House number */}
              {(() => {
                const numAngle = lonToAngle(
                  ascLon + (cusp.house - 1) * 30 + 15,
                  ascLon
                );
                const numPos = polarToXY(
                  cx,
                  cy,
                  (houseR + innerR) / 2,
                  numAngle
                );
                return (
                  <text
                    x={numPos.x}
                    y={numPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={size * 0.025}
                    fill="#445566"
                    fillOpacity="0.8"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {cusp.house}
                  </text>
                );
              })()}
              {/* Sign on cusp */}
              {(() => {
                const cuspPos = polarToXY(
                  cx,
                  cy,
                  zodiacInnerR - size * 0.025,
                  angle
                );
                const sign = houseCusps[cusp.house - 1]?.sign ?? "";
                const color = SIGN_COLORS[sign] ?? "#888";
                return (
                  <text
                    x={cuspPos.x}
                    y={cuspPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={size * 0.022}
                    fill={color}
                    fillOpacity="0.9"
                    style={{ fontFamily: "serif" }}
                  >
                    {cusp.degree}°
                  </text>
                );
              })()}
            </g>
          );
        })}

        {/* Inner circle */}
        <circle
          cx={cx}
          cy={cy}
          r={innerR}
          fill="#030608"
          stroke="#1a2a3a"
          strokeWidth="1"
        />

        {/* AC / DC / MC / IC labels */}
        {[
          { label: "AC", lon: ascLon, color: "#c8923a" },
          { label: "DC", lon: (ascLon + 180) % 360, color: "#c8923a" },
          { label: "MC", lon: angles.mc, color: "#88aacc" },
          { label: "IC", lon: (angles.mc + 180) % 360, color: "#88aacc" },
        ].map(({ label, lon, color }) => {
          const angle = lonToAngle(lon, ascLon);
          const pos = polarToXY(cx, cy, houseR + size * 0.04, angle);
          return (
            <text
              key={label}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.028}
              fill={color}
              fontWeight="bold"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {label}
            </text>
          );
        })}

        {/* Planets */}
        {planetPositions.map((p, i) => {
          const symbol = PLANET_SYMBOLS[p.name] ?? p.name[0];
          const color = PLANET_COLORS[p.name] ?? "#ffffff";
          const rx = p.retrograde ? "℞" : "";
          return (
            <g key={`${p.name}-${i}`}>
              <circle
                cx={p.pos.x}
                cy={p.pos.y}
                r={size * 0.022}
                fill="#050810"
                stroke={color}
                strokeWidth="1"
                strokeOpacity="0.6"
              />
              <text
                x={p.pos.x}
                y={p.pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size * 0.028}
                fill={color}
                style={{ fontFamily: "serif" }}
              >
                {symbol}
              </text>
              {rx && (
                <text
                  x={p.pos.x + size * 0.022}
                  y={p.pos.y - size * 0.018}
                  fontSize={size * 0.018}
                  fill={color}
                  fillOpacity="0.7"
                >
                  {rx}
                </text>
              )}
            </g>
          );
        })}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill="#c8923a" />
      </svg>

      {/* House cusp table */}
      <div style={{ width: "100%", maxWidth: `${size}px` }}>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "10px",
            letterSpacing: "3px",
            color: "var(--ember)",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          HOUSE CUSPS
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "4px",
          }}
        >
          {houseCusps.map(h => (
            <div
              key={h.house}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--rim)",
                borderRadius: "3px",
                padding: "6px 8px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "9px",
                  color: "var(--ember)",
                  letterSpacing: "1px",
                }}
              >
                H{h.house}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: SIGN_COLORS[h.sign] ?? "#fff",
                  marginTop: "2px",
                }}
              >
                {SIGN_SYMBOLS[h.sign]} {h.degree}°{h.minutes}'
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--silver-dim)",
                  marginTop: "1px",
                }}
              >
                {h.sign}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
