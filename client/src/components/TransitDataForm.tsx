/**
 * THE FIRMAMENT — Transit Data Form
 * Collects date, time, and location to calculate current sky positions.
 * Mirrors BirthDataForm pattern — uses the same ephemeris.calculate endpoint.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

interface TransitDataFormProps {
  onTransitCalculated: (
    readingText: string,
    planets: any[],
    lat: number,
    lng: number
  ) => void;
  disabled?: boolean;
}

const CITY_COORDS: Record<string, { lat: number; lng: number; label: string }> =
  {
    "new york": { lat: 40.7128, lng: -74.006, label: "New York, USA" },
    "los angeles": { lat: 34.0522, lng: -118.2437, label: "Los Angeles, USA" },
    chicago: { lat: 41.8781, lng: -87.6298, label: "Chicago, USA" },
    houston: { lat: 29.7604, lng: -95.3698, label: "Houston, USA" },
    atlanta: { lat: 33.749, lng: -84.388, label: "Atlanta, USA" },
    miami: { lat: 25.7617, lng: -80.1918, label: "Miami, USA" },
    dallas: { lat: 32.7767, lng: -96.797, label: "Dallas, USA" },
    phoenix: { lat: 33.4484, lng: -112.074, label: "Phoenix, USA" },
    philadelphia: { lat: 39.9526, lng: -75.1652, label: "Philadelphia, USA" },
    "san antonio": { lat: 29.4241, lng: -98.4936, label: "San Antonio, USA" },
    "san diego": { lat: 32.7157, lng: -117.1611, label: "San Diego, USA" },
    detroit: { lat: 42.3314, lng: -83.0458, label: "Detroit, USA" },
    baltimore: { lat: 39.2904, lng: -76.6122, label: "Baltimore, USA" },
    memphis: { lat: 35.1495, lng: -90.049, label: "Memphis, USA" },
    nashville: { lat: 36.1627, lng: -86.7816, label: "Nashville, USA" },
    london: { lat: 51.5074, lng: -0.1278, label: "London, UK" },
    paris: { lat: 48.8566, lng: 2.3522, label: "Paris, France" },
    tokyo: { lat: 35.6762, lng: 139.6503, label: "Tokyo, Japan" },
    lagos: { lat: 6.5244, lng: 3.3792, label: "Lagos, Nigeria" },
    cairo: { lat: 30.0444, lng: 31.2357, label: "Cairo, Egypt" },
    mumbai: { lat: 19.076, lng: 72.8777, label: "Mumbai, India" },
    gary: { lat: 41.5934, lng: -87.3464, label: "Gary, USA" },
  };

function lookupCity(
  input: string
): { lat: number; lng: number; label: string } | null {
  const key = input.toLowerCase().trim();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(city) || city.includes(key)) return coords;
  }
  return null;
}

function getNow() {
  const now = new Date();
  return {
    year: String(now.getUTCFullYear()),
    month: String(now.getUTCMonth() + 1),
    day: String(now.getUTCDate()),
    hour: String(now.getUTCHours()),
    minute: String(now.getUTCMinutes()),
  };
}

export function TransitDataForm({
  onTransitCalculated,
  disabled,
}: TransitDataFormProps) {
  const [expanded, setExpanded] = useState(false);
  const now = getNow();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [day, setDay] = useState(now.day);
  const [hour, setHour] = useState(now.hour);
  const [minute, setMinute] = useState(now.minute);
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [cityResolved, setCityResolved] = useState("");
  const [error, setError] = useState("");

  const calcMutation = trpc.ephemeris.calculate.useMutation();

  const handleUseNow = () => {
    const t = getNow();
    setYear(t.year);
    setMonth(t.month);
    setDay(t.day);
    setHour(t.hour);
    setMinute(t.minute);
  };

  const handleCityBlur = () => {
    const found = lookupCity(city);
    if (found) {
      setLat(found.lat.toFixed(4));
      setLng(found.lng.toFixed(4));
      setCityResolved(found.label);
      setError("");
    } else if (city.trim()) {
      setCityResolved("");
      setError("City not found — enter latitude/longitude manually below.");
    }
  };

  const handleCalculate = async () => {
    setError("");
    const y = parseInt(year),
      m = parseInt(month),
      d = parseInt(day);
    const h = parseInt(hour),
      min = parseInt(minute);
    const la = parseFloat(lat),
      lo = parseFloat(lng);

    // Client-side validation
    if (!y || !m || !d) {
      setError("Enter year, month, and day.");
      return;
    }
    if (isNaN(h) || isNaN(min)) {
      setError("Enter a valid time (hour 0–23, minute 0–59).");
      return;
    }
    if (h < 0 || h > 23) {
      setError("Hour must be between 0 and 23.");
      return;
    }
    if (min < 0 || min > 59) {
      setError("Minute must be between 0 and 59.");
      return;
    }
    if (isNaN(la) || isNaN(lo)) {
      setError("Enter a valid city or latitude/longitude.");
      return;
    }

    try {
      // Log the payload before sending for debugging
      const payload = {
        year: y,
        month: m,
        day: d,
        hour: h,
        minute: min,
        latitude: la,
        longitude: lo,
        altitude: 0,
      };
      console.log("[TransitDataForm] Sending calculate-chart payload:", payload);

      const result = await calcMutation.mutateAsync(payload);
      const transitText = result.readingText
        .split("\n")
        .map((line: string) => {
          const trimmed = line.trim();
          if (!trimmed) return "";
          if (/^transit/i.test(trimmed)) return trimmed;
          return `Transit ${trimmed}`;
        })
        .filter(Boolean)
        .join("\n");
      onTransitCalculated(transitText, result.planets, la, lo);
    } catch (err: any) {
      setError(err.message ?? "Calculation failed. Check your inputs.");
      console.error("[TransitDataForm] Calculation error:", err);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--rim)",
    borderRadius: "3px",
    color: "var(--silver)",
    fontFamily: "'Crimson Pro', serif",
    fontSize: "14px",
    padding: "8px 10px",
    outline: "none",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Cinzel', serif",
    fontSize: "9px",
    letterSpacing: "2px",
    color: "var(--ember)",
    textTransform: "uppercase" as const,
    marginBottom: "4px",
    display: "block",
  };

  return (
    <div
      style={{
        marginBottom: "10px",
        border: "1px solid var(--rim)",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: "var(--surface)",
          border: "none",
          cursor: "pointer",
          color: "var(--silver)",
          fontFamily: "'Cinzel', serif",
          fontSize: "10px",
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}
      >
        <span>⚡ CALCULATE FROM DATE & LOCATION</span>
        <span style={{ color: "var(--ember)", fontSize: "14px" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>
      {expanded && (
        <div
          style={{
            padding: "16px",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "var(--silver-dim)",
                fontStyle: "italic",
              }}
            >
              Enter any date, time, and location to calculate sky positions.
            </div>
            <button
              onClick={handleUseNow}
              style={{
                background: "transparent",
                border: "1px solid var(--rim)",
                borderRadius: "3px",
                color: "var(--ember)",
                fontFamily: "'Cinzel', serif",
                fontSize: "9px",
                letterSpacing: "2px",
                padding: "6px 10px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                marginLeft: "12px",
              }}
            >
              USE NOW
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
            }}
          >
            <div>
              <label style={labelStyle}>Year</label>
              <input
                type="number"
                placeholder="1958"
                value={year}
                onChange={e => setYear(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Month</label>
              <input
                type="number"
                placeholder="8"
                value={month}
                onChange={e => setMonth(e.target.value)}
                style={inputStyle}
                min="1"
                max="12"
              />
            </div>
            <div>
              <label style={labelStyle}>Day</label>
              <input
                type="number"
                placeholder="29"
                value={day}
                onChange={e => setDay(e.target.value)}
                style={inputStyle}
                min="1"
                max="31"
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <div>
              <label style={labelStyle}>Hour (0–23 UTC)</label>
              <input
                type="number"
                placeholder="12"
                value={hour}
                onChange={e => {
                  const val = e.target.value;
                  if (val === "" || val === "-") {
                    setHour("");
                  } else {
                    const num = parseInt(val);
                    if (!isNaN(num)) {
                      setHour(Math.max(0, Math.min(23, num)).toString());
                    }
                  }
                }}
                onBlur={() => {
                  if (hour === "") {
                    setHour("0");
                  }
                }}
                style={inputStyle}
                min="0"
                max="23"
              />
            </div>
            <div>
              <label style={labelStyle}>Minute</label>
              <input
                type="number"
                placeholder="0"
                value={minute}
                onChange={e => {
                  const val = e.target.value;
                  if (val === "" || val === "-") {
                    setMinute("");
                  } else {
                    const num = parseInt(val);
                    if (!isNaN(num)) {
                      setMinute(Math.max(0, Math.min(59, num)).toString());
                    }
                  }
                }}
                onBlur={() => {
                  if (minute === "") {
                    setMinute("0");
                  }
                }}
                style={inputStyle}
                min="0"
                max="59"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Location (City)</label>
            <input
              type="text"
              placeholder="e.g. Gary, Atlanta, London..."
              value={city}
              onChange={e => {
                setCity(e.target.value);
                setCityResolved("");
              }}
              onBlur={handleCityBlur}
              style={inputStyle}
            />
            {cityResolved && (
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--ember)",
                  marginTop: "4px",
                }}
              >
                ✓ {cityResolved}
              </div>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <div>
              <label style={labelStyle}>Latitude</label>
              <input
                type="number"
                placeholder="41.5934"
                value={lat}
                onChange={e => setLat(e.target.value)}
                style={inputStyle}
                step="0.0001"
              />
            </div>
            <div>
              <label style={labelStyle}>Longitude</label>
              <input
                type="number"
                placeholder="-87.3464"
                value={lng}
                onChange={e => setLng(e.target.value)}
                style={inputStyle}
                step="0.0001"
              />
            </div>
          </div>
          {error && (
            <div
              style={{
                fontSize: "12px",
                color: "#e87070",
                padding: "8px",
                border: "1px solid #8a3030",
                borderRadius: "3px",
              }}
            >
              {error}
            </div>
          )}
          <Button
            onClick={handleCalculate}
            disabled={disabled || calcMutation.isPending}
            style={{
              background: "transparent",
              border: "1px solid var(--ember-dim)",
              color: "var(--ember)",
              fontFamily: "'Cinzel', serif",
              fontSize: "10px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              padding: "12px",
            }}
          >
            {calcMutation.isPending
              ? "CALCULATING..."
              : "⚡ CAST TRANSIT SKY ⚡"}
          </Button>
        </div>
      )}
    </div>
  );
}
