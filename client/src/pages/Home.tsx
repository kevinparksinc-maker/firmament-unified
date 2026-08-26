/**
 * THE FIRMAMENT — Home Page
 * Design: Hermetic Void — Dark Occultism meets Manuscript Illumination
 */

import { useState, useRef, useCallback } from "react";
import { Streamdown } from "streamdown";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  runAstroReading,
  buildReadingText,
  detectSadeSati,
  detectMoonPhase,
  PLANET_GLYPHS,
  planetTone,
  ordinal,
  type ReadingResult,
  type ReadingMode,
} from "@/lib/astroEngine";
import { detectNatalPatterns, checkPatternAlerts } from "@/lib/summarizePillarRich";
import { ScreenshotUploader } from "@/components/ScreenshotUploader";
import { SavedChartManager } from "@/components/SavedChartManager";
import { TransitDataForm } from "@/components/TransitDataForm";
import { BirthDataForm } from "@/components/BirthDataForm";
import { SnowGlobe } from "@/components/SnowGlobe";
import { NatalPlacements } from "@/components/NatalPlacements";
import FirmamentEngine from "@/components/FirmamentEngine";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { ChartWheel } from "@/components/ChartWheel";
import { AppsHub } from "@/components/AppsHub";
import { mergeOcrText } from "@/lib/mergeOcrText";
import {
  detectFixedStarConjunctions,
  formatStarConjunctions,
} from "@/lib/fixedStars";

const NATAL_PLACEHOLDER = `Paste natal placements here, or upload screenshots above.

Accepts formats like:
Sun: 3° 27' Scorpio, 12th house
Moon: 18° 55' Gemini, 7th house
Mercury Rx: 18° 47' Libra, 11th house
Venus Rx: 10° 56' Libra, 11th house
Mars: 1° 46' Aquarius, 3rd house
Jupiter: 18° 39' Aquarius, 3rd house
Saturn: 15° 58' Scorpio, 12th house
Rahu: 25° 37' Pisces, 4th house
Ketu: 25° 37' Virgo, 10th house
Asc: 12° 47' Sagittarius, 1st house`;

const TRANSIT_PLACEHOLDER = `Paste current transiting planets here, or upload screenshots above.

Example:
Transit Sun: 12° Taurus
Transit Moon: 15° Gemini
Transit Mercury: 20° Aries
Transit Venus: 28° Pisces
Transit Mars: 4° Leo
Transit Jupiter: 27° Taurus
Transit Saturn: 25° Pisces
Transit Rahu: 18° Pisces
Transit Ketu: 18° Virgo`;

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Pillar Card ──────────────────────────────────────────────────────────────

function PillarCard({
  label,
  state,
  body,
  color,
  delay,
}: {
  label: string;
  state: string;
  body: string;
  color: string;
  delay: number;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--rim)",
        borderRadius: "4px",
        padding: "20px 16px",
        background: "var(--deep)",
        position: "relative",
        overflow: "hidden",
        animation: "fadeUp 0.6s ease both",
        animationDelay: `${delay}s`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "9px",
          letterSpacing: "5px",
          textTransform: "uppercase",
          marginBottom: "6px",
          color,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "15px",
          color: "#fff",
          marginBottom: "10px",
          lineHeight: 1.3,
        }}
      >
        {state}
      </div>
      <div
        style={{ fontSize: "14px", color: "var(--silver)", lineHeight: 1.6 }}
      >
        {body}
      </div>
    </div>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function ReadingSection({
  title,
  glyph,
  children,
  defaultOpen = false,
  delay = 0,
}: {
  title: string;
  glyph: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  delay?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        border: "1px solid var(--rim)",
        borderRadius: "4px",
        background: "var(--deep)",
        marginBottom: "16px",
        overflow: "hidden",
        animation: "fadeUp 0.6s ease both",
        animationDelay: `${delay}s`,
      }}
    >
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: open ? "1px solid var(--rim)" : "none",
          cursor: "pointer",
          userSelect: "none",
          transition: "background 0.2s",
        }}
        onMouseEnter={e =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
        }
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <div
          style={{
            fontSize: "18px",
            width: "28px",
            textAlign: "center",
            opacity: 0.8,
          }}
        >
          {glyph}
        </div>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "11px",
            letterSpacing: "3px",
            color: "var(--ember)",
            flex: 1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: "var(--silver-dim)",
            fontSize: "12px",
            transition: "transform 0.3s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▾
        </div>
      </div>
      {open && <div style={{ padding: "20px" }}>{children}</div>}
    </div>
  );
}

// ─── Planet Row ───────────────────────────────────────────────────────────────

function PlanetRow({ planet, text }: { planet: string; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          fontSize: "18px",
          width: "24px",
          flexShrink: 0,
          textAlign: "center",
        }}
      >
        {PLANET_GLYPHS[planet] || "✦"}
      </div>
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "11px",
          color: "var(--ember)",
          letterSpacing: "1px",
          width: "90px",
          flexShrink: 0,
          paddingTop: "2px",
        }}
      >
        {planet}
      </div>
      <div
        style={{ fontSize: "14px", color: "var(--silver)", lineHeight: 1.55 }}
      >
        {text}
      </div>
    </div>
  );
}

// ─── AI Reading Display ───────────────────────────────────────────────────────

function AIReadingDisplay({
  reading,
  mode,
}: {
  reading: string;
  mode: ReadingMode;
}) {
  // Parse the AI reading into sections by ## headers
  const sections = reading.split(/^##\s+/m).filter(Boolean);

  const sectionGlyphs: Record<string, string> = {
    MIND: "☿",
    SOUL: "☽",
    SPIRIT: "☉",
    "KEY PLACEMENTS": "✦",
    SYNTHESIS: "⟁",
    "CURRENT ACTIVATIONS": "⚡",
    "MIND RIGHT NOW": "☿",
    "SOUL RIGHT NOW": "☽",
    "SPIRIT RIGHT NOW": "☉",
    "THE BIGGER PICTURE": "⟁",
  };

  const modeLabel =
    mode === "natal-only"
      ? "Natal Chart Reading"
      : mode === "transit-only"
        ? "Current Sky Reading"
        : "Full Transit + Natal Reading";

  return (
    <div style={{ animation: "fadeUp 0.5s ease both" }}>
      {/* Output header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "32px",
          padding: "24px",
          border: "1px solid var(--rim)",
          background: "var(--deep)",
          borderRadius: "4px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "16px",
            color: "var(--ember)",
            fontSize: "12px",
            opacity: 0.5,
          }}
        >
          ✦
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "16px",
            color: "var(--ember)",
            fontSize: "12px",
            opacity: 0.5,
          }}
        >
          ✦
        </div>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "10px",
            letterSpacing: "4px",
            color: "var(--silver-dim)",
            marginBottom: "8px",
          }}
        >
          {todayLabel()}
        </div>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "20px",
            color: "#fff",
            letterSpacing: "1px",
            marginBottom: "8px",
          }}
        >
          Your Reading
        </div>
        <div
          style={{
            display: "inline-block",
            border: "1px solid var(--ember-dim)",
            borderRadius: "999px",
            padding: "3px 14px",
            fontFamily: "'Cinzel', serif",
            fontSize: "9px",
            letterSpacing: "2px",
            color: "var(--ember)",
            opacity: 0.9,
          }}
        >
          {modeLabel}
        </div>
      </div>

      {/* Sections */}
      {sections.length > 0 ? (
        sections.map((section, i) => {
          const lines = section.split("\n");
          const title = lines[0].trim().toUpperCase();
          const body = lines.slice(1).join("\n").trim();
          const glyph = sectionGlyphs[title] || "✦";
          return (
            <ReadingSection
              key={i}
              title={title}
              glyph={glyph}
              defaultOpen={i === 0}
              delay={i * 0.1}
            >
              <div
                style={{
                  fontSize: "15px",
                  color: "var(--silver)",
                  lineHeight: 1.75,
                }}
              >
                <Streamdown>{body}</Streamdown>
              </div>
            </ReadingSection>
          );
        })
      ) : (
        <div
          style={{
            padding: "20px",
            color: "var(--silver)",
            fontSize: "15px",
            lineHeight: 1.75,
          }}
        >
          <Streamdown>{reading}</Streamdown>
        </div>
      )}
    </div>
  );
}

// ─── Legacy Engine Output (for full transit+natal with activations) ────────────

// Pulls a named "## HEADER" section's body out of the raw aiReading markdown.
// Tries each candidate header (e.g. "MIND" and "MIND RIGHT NOW") in order
// and returns the first match's trimmed text, or null if none are found.
function extractAiSection(
  aiReading: string | null | undefined,
  headerCandidates: string[]
): string | null {
  if (!aiReading) return null;
  for (const header of headerCandidates) {
    const re = new RegExp(`^##\\s+${header}\\s*$`, "m");
    const match = re.exec(aiReading);
    if (!match) continue;
    const startIdx = match.index + match[0].length;
    const rest = aiReading.slice(startIdx);
    // Cut off at the next "## " header (or end of string)
    const nextHeaderIdx = rest.search(/^##\s+/m);
    const body = nextHeaderIdx === -1 ? rest : rest.slice(0, nextHeaderIdx);
    const trimmed = body.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function EngineReadingDisplay({
  result,
  readingDate,
  mode,
  aiReading,
}: {
  result: ReadingResult;
  readingDate: string;
  mode: ReadingMode;
  aiReading?: string | null;
}) {
  const { mind, soul, spirit, activations, natal, transits, context } = result;
  const mercury = natal.Mercury;
  const moon = natal.Moon;
  const sun = natal.Sun;
  const venus = natal.Venus;
  const jupiter = natal.Jupiter;

  const mercuryText = [
    ...planetTone("Mercury", mercury, "mind"),
    ...(moon
      ? [
          `Moon as secondary mind-lord adds ${moon.sign}-style emotional weather to cognition.`,
        ]
      : []),
    ...activations
      .filter(a => a.natalPlanet === "Mercury")
      .slice(0, 3)
      .map(a => `${a.summary} Orb ${a.orb}°.`),
  ].join(" ");

  const moonText = [
    ...planetTone("Moon", moon, "soul"),
    ...(venus
      ? [
          `Venus as secondary soul-lord in ${venus.sign} shows where the heart seeks sweetness, reflection, and relief.`,
        ]
      : []),
    ...activations
      .filter(a => a.natalPlanet === "Moon")
      .slice(0, 3)
      .map(a => `${a.summary} Orb ${a.orb}°.`),
  ].join(" ");

  const spiritText = [
    ...planetTone("Sun", sun, "spirit"),
    ...(jupiter
      ? [
          `Jupiter as secondary spirit-lord in ${jupiter.sign} shows where faith, meaning, and dharma want to expand.`,
        ]
      : []),
    ...activations
      .filter(a => a.natalPlanet === "Sun" || a.natalPlanet === "Jupiter")
      .slice(0, 4)
      .map(a => `${a.summary} Orb ${a.orb}°.`),
  ].join(" ");

  const sadeSati = detectSadeSati(natal, transits);
  const moonPhase = detectMoonPhase(transits);
  const patterns = detectNatalPatterns(natal);
  const patternAlerts = checkPatternAlerts(patterns, natal, activations);

  // Prefer the AI's actual MIND/SOUL/SPIRIT prose if it exists in aiReading.
  // Falls back to the template text built above when the AI text is missing
  // (e.g. natal-only mode without the "RIGHT NOW" variants, or no aiReading at all).
  const aiMindText = extractAiSection(aiReading, ["MIND RIGHT NOW", "MIND"]);
  const aiSoulText = extractAiSection(aiReading, ["SOUL RIGHT NOW", "SOUL"]);
  const aiSpiritText = extractAiSection(aiReading, [
    "SPIRIT RIGHT NOW",
    "SPIRIT",
  ]);
  const aiSynthesisText = extractAiSection(aiReading, [
    "THE BIGGER PICTURE",
    "SYNTHESIS",
  ]);
  const aiActivationsText = extractAiSection(aiReading, [
    "CURRENT ACTIVATIONS",
  ]);

  return (
    <div style={{ animation: "fadeUp 0.5s ease both" }}>
      <div
        style={{
          textAlign: "center",
          marginBottom: "32px",
          padding: "24px",
          border: "1px solid var(--rim)",
          background: "var(--deep)",
          borderRadius: "4px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "16px",
            color: "var(--ember)",
            fontSize: "12px",
            opacity: 0.5,
          }}
        >
          ✦
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "16px",
            color: "var(--ember)",
            fontSize: "12px",
            opacity: 0.5,
          }}
        >
          ✦
        </div>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "10px",
            letterSpacing: "4px",
            color: "var(--silver-dim)",
            marginBottom: "8px",
          }}
        >
          {readingDate || todayLabel()}
        </div>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "20px",
            color: "#fff",
            letterSpacing: "1px",
            marginBottom: "8px",
          }}
        >
          Current State of Being
        </div>
        <div
          style={{
            display: "inline-block",
            border: "1px solid var(--ember-dim)",
            borderRadius: "999px",
            padding: "3px 14px",
            fontFamily: "'Cinzel', serif",
            fontSize: "9px",
            letterSpacing: "2px",
            color: "var(--ember)",
            opacity: 0.9,
          }}
        >
          Full Transit + Natal Reading
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
        className="pillars-grid"
      >
        <PillarCard
          label="Mind"
          state={mind.state}
          body={mind.body}
          color="var(--mind-col)"
          delay={0}
        />
        <PillarCard
          label="Soul"
          state={soul.state}
          body={soul.body}
          color="var(--soul-col)"
          delay={0.1}
        />
        <PillarCard
          label="Spirit"
          state={spirit.state}
          body={spirit.body}
          color="var(--spirit-col)"
          delay={0.2}
        />
      </div>

      <ReadingSection
        title="Mercury / Mind Mechanics"
        glyph="☿"
        defaultOpen={true}
        delay={0.1}
      >
        <p
          style={{
            fontSize: "14px",
            color: "var(--silver)",
            lineHeight: 1.65,
            whiteSpace: "pre-wrap",
          }}
        >
          {aiMindText || mercuryText || "Mercury not found in natal input."}
        </p>
      </ReadingSection>
      <ReadingSection title="Moon / Soul Weather" glyph="☽" delay={0.2}>
        <p
          style={{
            fontSize: "14px",
            color: "var(--silver)",
            lineHeight: 1.65,
            whiteSpace: "pre-wrap",
          }}
        >
          {aiSoulText || moonText || "Moon not found in natal input."}
        </p>
      </ReadingSection>
      <ReadingSection title="Sun & Dharma / Spirit Arc" glyph="☉" delay={0.3}>
        <p
          style={{
            fontSize: "14px",
            color: "var(--silver)",
            lineHeight: 1.65,
            whiteSpace: "pre-wrap",
          }}
        >
          {aiSpiritText || spiritText || "Sun not found in natal input."}
        </p>
      </ReadingSection>
      {aiReading && aiReading.includes("## YOUR QUESTION") && (
        <ReadingSection
          title="Your Question"
          glyph="✦"
          defaultOpen={true}
          delay={0.05}
        >
          <p
            style={{
              fontSize: "14px",
              color: "var(--silver)",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
            }}
          >
            {aiReading.split("## YOUR QUESTION")[1]?.trim()}
          </p>
        </ReadingSection>
      )}
      <ReadingSection title="Key Transit Activations" glyph="✦" delay={0.4}>
        {aiActivationsText ? (
          <p
            style={{
              fontSize: "14px",
              color: "var(--silver)",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
            }}
          >
            {aiActivationsText}
          </p>
        ) : activations.length > 0 ? (
          activations
            .slice(0, 8)
            .map((a, i) => (
              <PlanetRow
                key={i}
                planet={a.transitPlanet}
                text={`${a.summary} Exactness: ${a.orb}°. Transit ${a.transitPlanet} in ${a.transit.sign}${a.transit.house ? ` (${ordinal(a.transit.house)} house)` : ""}. Natal ${a.natalPlanet} in ${a.natal.sign}${a.natal.house ? ` (${ordinal(a.natal.house)} house)` : ""}.`}
              />
            ))
        ) : (
          <p style={{ fontSize: "14px", color: "var(--silver)" }}>
            No clear transit activations found.
          </p>
        )}
      </ReadingSection>
      <ReadingSection title="Synthesis" glyph="⟁" delay={0.5} defaultOpen={true}>
        <div
          style={{ fontSize: "14px", color: "var(--silver)", lineHeight: 1.65 }}
        >
          {aiSynthesisText ? (
            <p style={{ whiteSpace: "pre-wrap", marginBottom: "20px" }}>
              {aiSynthesisText}
            </p>
          ) : (
            <>
              {sadeSati && <p style={{ marginBottom: "12px" }}>{sadeSati}</p>}
              {moonPhase && <p style={{ marginBottom: "12px" }}>{moonPhase}</p>}
              {patternAlerts.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <p
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "10px",
                      letterSpacing: "2px",
                      color: "var(--ember)",
                      marginBottom: "8px",
                    }}
                  >
                    PATTERN ACTIVATIONS
                  </p>
                  {patternAlerts.map((alert, idx) => (
                    <p
                      key={idx}
                      style={{
                        marginBottom: "10px",
                        paddingLeft: "12px",
                        borderLeft: "1px solid var(--ember-dim)",
                      }}
                    >
                      {alert.plainWarning}
                    </p>
                  ))}
                </div>
              )}
              {context && (
                <p style={{ marginBottom: "12px" }}>
                  Context entered: {context}
                </p>
              )}
            </>
          )}
          <p style={{ opacity: 0.6, fontSize: "12px", marginTop: "20px" }}>
            Hermetic collision law applied: no placement is read in isolation;
            every active point is judged by contact, condition, and house
            activation together.
          </p>
        </div>
      </ReadingSection>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [natalInput, setNatalInput] = useState("");
  const [transitInput, setTransitInput] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [readingDate, setReadingDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("READING THE HEAVENS");

  // Two output modes: AI reading (natal/transit only) or engine reading (full)
  const [aiReading, setAiReading] = useState<string | null>(null);
  const [engineResult, setEngineResult] = useState<ReadingResult | null>(null);
  const [readingMode, setReadingMode] = useState<ReadingMode>("full");

  const [structuredPlanets, setStructuredPlanets] = useState<Record<
    string,
    { sign: string; degree: number; house: number }
  > | null>(null);
  const [natalResetKey, setNatalResetKey] = useState(0);
  const [transitResetKey, setTransitResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chartLocked, setChartLocked] = useState(false);
  const [snowGlobePlanets, setSnowGlobePlanets] = useState<any[]>([]);
  const [observerLat, setObserverLat] = useState(36.17); // Las Vegas
  const [observerLng, setObserverLng] = useState(-115.14); // Las Vegas
  const [chartWheelData, setChartWheelData] = useState<{
    houseCusps: any[];
    angles: any;
  } | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const handleNatalExtracted = useCallback((text: string) => {
    setNatalInput(prev => mergeOcrText(prev, text));
  }, []);

  const handleTransitExtracted = useCallback((text: string) => {
    setTransitInput(prev => mergeOcrText(prev, text));
  }, []);

  const generateReading = trpc.ai.interpretChart.useMutation();
  const askHorary = trpc.horary.ask.useMutation();
  const followUp = trpc.horary.followUp.useMutation();

  async function sendChat(content: string) {
    if (!content.trim() || chatLoading) return;
    const userMsg = content.trim();
    setChatLoading(true);
    const newHistory = [
      ...chatHistory,
      { role: "user" as const, content: userMsg },
    ];
    setChatHistory(newHistory);
    try {
      const result = await askHorary.mutateAsync({
        question: userMsg,
        natalPlacements: natalInput || undefined,
        transitPlacements: transitInput || undefined,
        history: chatHistory.slice(-10),
      });
      setChatHistory([
        ...newHistory,
        { role: "assistant", content: result.answer },
      ]);
    } catch (e: any) {
      setChatHistory([
        ...newHistory,
        {
          role: "assistant",
          content: "Error: " + (e?.message || "Something went wrong"),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function runReading() {
    setError(null);
    const hasNatal = natalInput.trim().length > 10;
    const hasTransit = transitInput.trim().length > 10;
    if (!hasNatal && !hasTransit) {
      setError(
        "Please enter your natal chart or current transits to get a reading."
      );
      return;
    }

    setLoading(true);
    setAiReading(null);
    setEngineResult(null);

    const mode =
      hasNatal && hasTransit ? "full" : hasNatal ? "natal" : "transit";
    setReadingMode(
      mode === "natal"
        ? "natal-only"
        : mode === "transit"
          ? "transit-only"
          : "full"
    );

    const loadingMessages = [
      "READING THE HEAVENS",
      "CONSULTING THE FIXED STARS",
      "CALCULATING ASPECTS",
      "SYNTHESIZING THE CHART",
      "WEAVING THE READING",
    ];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIndex]);
    }, 3000);

    try {
      if (hasNatal) {
        const engineRes = runAstroReading(natalInput, transitInput);
        if (engineRes.result) setEngineResult(engineRes.result);
      }

      const starText = hasNatal
        ? formatStarConjunctions(detectFixedStarConjunctions(natalInput))
        : "";

      const result = await generateReading.mutateAsync({
        placements: hasNatal ? natalInput : transitInput,
        context: contextInput || undefined,
        mode,
        transitPlacements: hasTransit ? transitInput : undefined,
        fixedStarConjunctions: starText || undefined,
      });

      setAiReading(result.reading);
      setChartLocked(true);

      // If user asked a question, get a direct horary answer
      if (contextInput.trim().length > 3) {
        const horaryResult = await askHorary.mutateAsync({
          question: contextInput,
          natalPlacements: hasNatal ? natalInput : undefined,
          transitPlacements: hasTransit ? transitInput : undefined,
        });
        setAiReading(
          prev => prev + "\n\n---\n\n## YOUR QUESTION\n\n" + horaryResult.answer
        );
        setChatHistory([
          { role: "user", content: contextInput },
          { role: "assistant", content: horaryResult.answer },
        ]);
      }
      setTimeout(() => {
        outputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err: any) {
      setError(
        err?.message ||
          "Something went wrong generating the reading. Please try again."
      );
    } finally {
      clearInterval(msgInterval);
      setLoadingMsg("READING THE HEAVENS");
      setLoading(false);
    }
  }

  const hasOutput = aiReading || engineResult;

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "960px",
        margin: "0 auto",
        padding: "40px 20px 80px",
      }}
    >
      {/* Header */}
      <header
        style={{
          textAlign: "center",
          marginBottom: "52px",
          paddingBottom: "32px",
          borderBottom: "1px solid var(--rim)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: "-1px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "120px",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, var(--ember), transparent)",
          }}
        />
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "10px",
            letterSpacing: "5px",
            color: "var(--ember)",
            textTransform: "uppercase",
            marginBottom: "14px",
            opacity: 0.8,
          }}
        >
          Fixed Stars · Ancient Sky · Tropical Planets · Fixed Dome
        </div>
        <h1
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 900,
            letterSpacing: "2px",
            color: "#fff",
            textShadow: "0 0 40px rgba(100,160,220,0.3)",
            lineHeight: 1.1,
            marginBottom: "10px",
          }}
        >
          THE FIRMAMENT
        </h1>
        <div
          style={{
            fontStyle: "italic",
            color: "var(--silver-dim)",
            fontSize: "15px",
            letterSpacing: "0.5px",
          }}
        >
          Nakshatra · Fixed Stars · Decan · Sabian · Pattern Engine
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "32px",
            marginTop: "24px",
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "MIND", color: "var(--mind-col)", delay: "0s" },
            { label: "SOUL", color: "var(--soul-col)", delay: "1s" },
            { label: "SPIRIT", color: "var(--spirit-col)", delay: "2s" },
          ].map(({ label, color, delay }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "'Cinzel', serif",
                fontSize: "11px",
                letterSpacing: "3px",
                opacity: 0.7,
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: color,
                  animation: "pulse 3s ease-in-out infinite",
                  animationDelay: delay,
                }}
              />
              {label}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "24px", fontSize: "12px" }}>
          <Link href="/sports" style={{ color: "var(--ember)", textDecoration: "none", opacity: 0.7, transition: "opacity 0.3s" }} onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}>
            ✦ SPORTS PREDICTION ✦
          </Link>
          <span style={{ color: "var(--rim)", margin: "0 12px" }}>·</span>
          <Link href="/zetetic-atlas" style={{ color: "var(--ice)", textDecoration: "none", opacity: 0.8, transition: "opacity 0.3s" }} onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.8"}>
            ✦ ZETETIC ATLAS ✦
          </Link>
        </div>
      </header>

      {/* Apps Hub */}
      <div style={{ marginBottom: "32px", marginTop: "24px" }}>
        <AppsHub />
      </div>

      {/* Date row */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "10px",
            letterSpacing: "3px",
            color: "var(--ember)",
            whiteSpace: "nowrap",
          }}
        >
          DATE OF READING
        </label>
        <input
          type="text"
          value={readingDate}
          onChange={e => setReadingDate(e.target.value)}
          placeholder={`e.g. ${todayLabel()} — or leave blank for today`}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--rim)",
            borderRadius: "3px",
            color: "var(--silver)",
            fontFamily: "'Crimson Pro', serif",
            fontSize: "15px",
            padding: "10px 14px",
            outline: "none",
            flex: 1,
            minWidth: "240px",
            transition: "border-color 0.2s",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--ice)")}
          onBlur={e => (e.target.style.borderColor = "var(--rim)")}
        />
      </div>

      {/* Birth Data Calculator */}
      <BirthDataForm
        onChartCalculated={(
          readingText,
          planets,
          lat,
          lng,
          houseCusps,
          angles
        ) => {
          setNatalInput(readingText);
          setSnowGlobePlanets(planets);
          setObserverLat(lat);
          setObserverLng(lng);
          setChartWheelData({ houseCusps, angles });
          // Build structured planet map for synthesize endpoint
          const structured: Record<
            string,
            { sign: string; degree: number; house: number }
          > = {};
          for (const p of planets) {
            if (p.name) {
              structured[p.name.toLowerCase()] = {
                sign: p.sign,
                degree: p.degreeInSign ?? p.degree ?? 0,
                house: p.house ?? 1,
              };
            }
          }
          setStructuredPlanets(structured);
        }}
        disabled={loading}
      />

      {/* Natal Placements Panel — shows after birth data calculated */}
      {snowGlobePlanets.length > 0 && (
        <NatalPlacements planets={snowGlobePlanets} />
      )}

      {/* Input grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
          marginBottom: "20px",
        }}
        className="input-grid"
      >
        <Panel
          title="Natal Chart"
          onClear={
            natalInput
              ? () => {
                  setNatalInput("");
                  setNatalResetKey(k => k + 1);
                }
              : undefined
          }
        >
          <ScreenshotUploader
            type="natal"
            onTextExtracted={handleNatalExtracted}
            disabled={loading}
            resetKey={natalResetKey}
          />
          <textarea
            value={natalInput}
            onChange={e => setNatalInput(e.target.value)}
            placeholder={NATAL_PLACEHOLDER}
            style={{ ...textareaStyle, marginTop: "10px" }}
            onFocus={e => (e.target.style.borderColor = "var(--ice)")}
            onBlur={e => (e.target.style.borderColor = "var(--rim)")}
          />
          <SavedChartManager
            currentPlacements={natalInput}
            onLoadChart={setNatalInput}
          />
          <div style={hintStyle}>
            Upload screenshots or paste text. Supports 18° 55' format.
          </div>
        </Panel>

        <Panel
          title="Current Transits"
          onClear={
            transitInput
              ? () => {
                  setTransitInput("");
                  setTransitResetKey(k => k + 1);
                }
              : undefined
          }
        >
          <TransitDataForm
            onTransitCalculated={(readingText, _planets, lat, lng) => {
              setTransitInput(readingText);
              setObserverLat(lat);
              setObserverLng(lng);
            }}
            disabled={loading}
          />
          <ScreenshotUploader
            type="transit"
            onTextExtracted={handleTransitExtracted}
            disabled={loading}
            resetKey={transitResetKey}
          />
          <textarea
            value={transitInput}
            onChange={e => setTransitInput(e.target.value)}
            placeholder={TRANSIT_PLACEHOLDER}
            style={{ ...textareaStyle, marginTop: "10px" }}
            onFocus={e => (e.target.style.borderColor = "var(--ice)")}
            onBlur={e => (e.target.style.borderColor = "var(--rim)")}
          />
          <div style={hintStyle}>
            Optional — add transits for a full current-moment reading.
          </div>
        </Panel>
      </div>

      {/* Horary Question Panel */}
      <Panel title="Ask the Firmament" style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "12px",
              color: "var(--silver-dim)",
              fontStyle: "italic",
              marginBottom: "10px",
            }}
          >
            ✦ Pose a specific question and the stars will answer. Leave blank for a general reading.
          </div>
        </div>
        <textarea
          value={contextInput}
          onChange={e => setContextInput(e.target.value)}
          placeholder="What weighs on your mind? Relationships · Career · Purpose · Timing · Obstacles · Hidden patterns. Be specific — 'Why do I keep choosing the wrong partners?' is more powerful than 'Tell me about love.'"
          style={{
            ...textareaStyle,
            minHeight: "100px",
            background: "linear-gradient(135deg, rgba(100,160,220,0.05), rgba(200,146,58,0.05))",
            borderColor: "rgba(196,162,74,0.25)",
            color: "var(--silver)",
          }}
          onFocus={e => {
            e.target.style.borderColor = "var(--ice)";
            e.target.style.boxShadow = "0 0 12px rgba(100,160,220,0.2)";
            e.target.style.background = "linear-gradient(135deg, rgba(100,160,220,0.1), rgba(200,146,58,0.05))";
          }}
          onBlur={e => {
            e.target.style.borderColor = "rgba(196,162,74,0.25)";
            e.target.style.boxShadow = "none";
            e.target.style.background = "linear-gradient(135deg, rgba(100,160,220,0.05), rgba(200,146,58,0.05))";
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "8px",
            marginTop: "12px",
          }}
        >
          {[
            "Relationships & Love",
            "Career & Purpose",
            "Timing & Cycles",
            "Hidden Patterns",
            "Obstacles & Blocks",
            "Next Steps",
          ].map(topic => (
            <button
              key={topic}
              onClick={() =>
                setContextInput(prev =>
                  prev.trim()
                    ? prev + " — " + topic
                    : "Help me understand: " + topic.toLowerCase()
                )
              }
              style={{
                background: "rgba(196,162,74,0.08)",
                border: "1px solid rgba(196,162,74,0.2)",
                borderRadius: "3px",
                color: "var(--silver)",
                padding: "6px 10px",
                fontSize: "11px",
                fontFamily: "'Cinzel', serif",
                cursor: "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.5px",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(196,162,74,0.15)";
                e.currentTarget.style.borderColor = "rgba(196,162,74,0.4)";
                e.currentTarget.style.color = "var(--ember)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(196,162,74,0.08)";
                e.currentTarget.style.borderColor = "rgba(196,162,74,0.2)";
                e.currentTarget.style.color = "var(--silver)";
              }}
            >
              {topic}
            </button>
          ))}
        </div>
      </Panel>

      {/* Error */}
      {error && (
        <div
          style={{
            border: "1px solid #8a3030",
            background: "rgba(138,48,48,0.1)",
            borderRadius: "4px",
            padding: "16px 20px",
            color: "#e87070",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* Cast button */}
      <button
        onClick={runReading}
        disabled={loading}
        style={{
          display: "block",
          width: "100%",
          padding: "18px",
          background: "transparent",
          border: `1px solid ${loading ? "var(--rim)" : "var(--ember-dim)"}`,
          borderRadius: "3px",
          color: loading ? "var(--silver-dim)" : "var(--ember)",
          fontFamily: "'Cinzel', serif",
          fontSize: "13px",
          letterSpacing: "5px",
          textTransform: "uppercase",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.3s",
          marginBottom: "32px",
          opacity: loading ? 0.4 : 1,
        }}
        onMouseEnter={e => {
          if (!loading) {
            e.currentTarget.style.borderColor = "var(--ember)";
            e.currentTarget.style.boxShadow = "0 0 24px rgba(200,146,58,0.15)";
            e.currentTarget.style.color = "#e8b060";
          }
        }}
        onMouseLeave={e => {
          if (!loading) {
            e.currentTarget.style.borderColor = "var(--ember-dim)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.color = "var(--ember)";
          }
        }}
      >
        ✦ &nbsp; CAST THE READING &nbsp; ✦
      </button>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "1px solid var(--rim)",
              borderTopColor: "var(--ember)",
              borderRadius: "50%",
              animation: "spin 1.2s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "11px",
              letterSpacing: "4px",
              color: "var(--ember)",
              animation: "flicker 2s ease-in-out infinite",
            }}
          >
            {loadingMsg}
          </div>
        </div>
      )}

      {/* Output */}
      {hasOutput && !loading && (
        <div ref={outputRef}>
          {engineResult && aiReading && (
            <EngineReadingDisplay
              result={engineResult}
              readingDate={readingDate}
              mode={readingMode}
              aiReading={aiReading}
            />
          )}
          {aiReading && !engineResult && (
            <AIReadingDisplay reading={aiReading} mode={readingMode} />
          )}
        </div>
      )}

      {/* Horary Oracle Conversation */}
      {chartLocked && (
        <div style={{ marginTop: "32px" }}>
          <div
            style={{
              padding: "16px 20px",
              border: "1px solid var(--rim)",
              borderBottom: "none",
              borderRadius: "4px 4px 0 0",
              fontFamily: "'Cinzel', serif",
              fontSize: "10px",
              letterSpacing: "4px",
              color: "var(--ember)",
              background: "var(--deep)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>✦ THE HORARY ORACLE ✦</span>
            <span style={{ fontSize: "9px", color: "var(--silver-dim)", letterSpacing: "2px" }}>FOLLOW-UP QUESTIONS</span>
          </div>
          <AIChatBox
            messages={chatHistory}
            onSendMessage={sendChat}
            isLoading={chatLoading}
            height="500px"
            placeholder="Ask your follow-up questions. What else do you wish to know about this reading?"
            emptyStateMessage="The oracle awaits your inquiry. Deepen your understanding with a follow-up question."
            className="rounded-t-none border-t-0"
          />
        </div>
      )}

      {/* Firmament Engine — full layered placement readings */}
      <FirmamentEngine
        natalInput={natalInput}
        transitInput={transitInput}
        context={contextInput}
      />

      {/* Chart Wheel */}
      {chartWheelData && snowGlobePlanets.length > 0 && (
        <div style={{ marginTop: "32px", marginBottom: "32px" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "10px",
                letterSpacing: "4px",
                color: "var(--ember)",
                opacity: 0.8,
                marginBottom: "6px",
              }}
            >
              ✦ NATAL CHART WHEEL ✦
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--silver-dim)",
                fontStyle: "italic",
              }}
            >
              House cusps · Sign placements · Ascendant on the left
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ChartWheel
              planets={snowGlobePlanets}
              houseCusps={chartWheelData.houseCusps}
              angles={chartWheelData.angles}
              size={Math.min(460, window.innerWidth - 40)}
            />
          </div>
        </div>
      )}

      {/* Snow Globe Dome Visualization */}
      {snowGlobePlanets.length > 0 && (
        <div style={{ marginTop: "40px", marginBottom: "32px" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "10px",
                letterSpacing: "4px",
                color: "var(--ember)",
                opacity: 0.8,
                marginBottom: "6px",
              }}
            >
              ✦ THE SNOW GLOBE ✦
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--silver-dim)",
                fontStyle: "italic",
              }}
            >
              Parabolic firmament dome · Polaris at the still center · Planets
              rotating around it
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SnowGlobe
              planets={snowGlobePlanets}
              observerLatitude={observerLat}
              observerLongitude={observerLng}
              width={Math.min(700, window.innerWidth - 40)}
              height={480}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          marginTop: "30px",
          paddingTop: "24px",
          borderTop: "1px solid var(--rim)",
          fontSize: "12px",
          color: "var(--silver-dim)",
          fontStyle: "italic",
        }}
      >
        Ancient sky-observation framework · Fixed stars as the true backdrop ·
        Polaris as the still center
        <br />
        Sun ☉ Moon ☽ Mercury ☿ Venus ♀ Mars ♂ Jupiter ♃ Saturn ♄ Rahu ☊ Ketu ☋
        Pluto ♇ Neptune ♆ Uranus ⛢
      </footer>

      <style>{`
        @media (max-width: 620px) {
          .input-grid { grid-template-columns: 1fr !important; }
          .pillars-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function Panel({
  title,
  children,
  style,
  onClear,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClear?: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--deep)",
        border: "1px solid var(--rim)",
        borderRadius: "4px",
        padding: "22px 20px",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "20px",
          right: "20px",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(100,160,220,0.3), transparent)",
        }}
      />
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "11px",
          letterSpacing: "4px",
          color: "var(--ember)",
          textTransform: "uppercase",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {title}
        <div style={{ flex: 1, height: "1px", background: "var(--rim)" }} />
        {onClear && (
          <button
            onClick={onClear}
            style={{
              background: "none",
              border: "none",
              color: "var(--silver-dim)",
              fontSize: "10px",
              letterSpacing: "2px",
              fontFamily: "'Cinzel', serif",
              cursor: "pointer",
              padding: "0 4px",
              opacity: 0.7,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--ember)")}
            onMouseLeave={e =>
              (e.currentTarget.style.color = "var(--silver-dim)")
            }
          >
            CLEAR
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const textareaStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--rim)",
  borderRadius: "3px",
  color: "var(--silver)",
  fontFamily: "'Crimson Pro', serif",
  fontSize: "14px",
  lineHeight: 1.6,
  padding: "12px 14px",
  resize: "vertical",
  minHeight: "180px",
  outline: "none",
  transition: "border-color 0.2s",
};

const hintStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--silver-dim)",
  marginTop: "8px",
  fontStyle: "italic",
};
