/**
 * THE FIRMAMENT — Natal Placements Panel
 * Expandable planet cards with full layer breakdown + Vedic house meanings
 */

import { useState, useEffect } from "react";
import { getNakshatraAt } from "@/lib/nakshatra";
import { getDecanFlavor, getDecanRuler } from "@/lib/decan";
import { getDegreeMeaning } from "@/lib/sabianSymbols";
import { detectFixedStarConjunctions } from "@/lib/fixedStars";
import { getPlanetInHouse } from "@/lib/planetInHouse";
import { PLANET_GLYPHS } from "@/lib/astroEngine";
import { trpc } from "../lib/trpc";

const SIGNS = [
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
function toAbsolute(sign, degree: any) {
  const i = SIGNS.indexOf(sign);
  return i >= 0 ? i * 30 + degree : null;
}

const SIGN_RULERS = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};
const EXALTATIONS = {
  Sun: "Aries",
  Moon: "Taurus",
  Mercury: "Virgo",
  Venus: "Pisces",
  Mars: "Capricorn",
  Jupiter: "Cancer",
  Saturn: "Libra",
};
const DEBILITATIONS = {
  Sun: "Libra",
  Moon: "Scorpio",
  Mercury: "Pisces",
  Venus: "Virgo",
  Mars: "Cancer",
  Jupiter: "Capricorn",
  Saturn: "Aries",
};

function getDignity(planet, sign, rx: any) {
  if (EXALTATIONS[planet] === sign)
    return { label: "EXALTED", color: "#c8c850" };
  if (DEBILITATIONS[planet] === sign)
    return { label: "DEBILITATED", color: "#e87070" };
  if (SIGN_RULERS[sign] === planet)
    return { label: "OWN SIGN", color: "#70c8a0" };
  if (rx) return { label: "Rx", color: "#a0a0c8" };
  return { label: "Peregrine", color: "var(--silver-dim)" };
}

const TABS = ["LAYERS", "MEANING", "CAREER", "RELATIONSHIPS", "CHALLENGE"];

const HOUSE_KEYWORDS = {
  1: ["Self", "Identity", "Body"],
  2: ["Wealth", "Voice", "Family"],
  3: ["Communication", "Courage", "Siblings"],
  4: ["Home", "Mother", "Roots"],
  5: ["Creativity", "Children", "Joy"],
  6: ["Service", "Health", "Work"],
  7: ["Partnership", "Marriage", "Other"],
  8: ["Transformation", "Death", "Occult"],
  9: ["Dharma", "Philosophy", "Travel"],
  10: ["Career", "Status", "Legacy"],
  11: ["Community", "Gains", "Goals"],
  12: ["Liberation", "Retreat", "Hidden"],
};

function PlanetCard({ p, starMap }: any) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("LAYERS");
  const [aiReadings, setAiReadings] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const degree = p.degreeInSign ?? p.degree ?? 0;
  const minutes = p.minutes ?? 0;
  const abs = toAbsolute(p.sign, degree);
  const nak = abs != null ? getNakshatraAt(abs) : null;
  const decanFlavor = getDecanFlavor(p.sign, degree);
  const decanRuler = getDecanRuler(p.sign, degree);
  const sabian = getDegreeMeaning(p.sign, Math.floor(degree) + 1);
  const dignity = getDignity(p.name, p.sign, p.retrograde ?? false);
  const stars = starMap[p.name] ?? [];
  const glyph = PLANET_GLYPHS[p.name] || "\u2736";
  const houseNum = p.house ?? null;
  const houseMeaning = houseNum ? getPlanetInHouse(p.name, houseNum) : null;
  const houseKeywords = houseNum ? (HOUSE_KEYWORDS[houseNum] ?? []) : [];
  const hasRoyal = stars.some(s => s.star.isRoyal);

  const getReading = trpc.natalPlacement.getReading.useMutation();

  // Map this panel's tabs onto the Firmament Engine's section ids
  const TAB_TO_SECTION: Record<string, string> = {
    MEANING: "core",
    CAREER: "career",
    RELATIONSHIPS: "relationships",
    CHALLENGE: "destiny",
  };

  const aiCacheKey = `${p.name}-${p.sign}-${degree}-${houseNum}-${activeTab}`;

  useEffect(() => {
    const section = TAB_TO_SECTION[activeTab];
    if (!open || !section || !houseNum) return;
    if (aiReadings[aiCacheKey]) return;

    let cancelled = false;
    setAiLoading(true);
    setAiError("");

    const houseLabel = `${houseNum}${houseNum === 1 ? "st" : houseNum === 2 ? "nd" : houseNum === 3 ? "rd" : "th"}`;
    const prompt = [
      `Planet: ${p.name}`,
      `Sign: ${p.sign}`,
      `Degree: ${degree}`,
      `House: ${houseLabel}`,
      houseMeaning ? `Reference domain: ${houseMeaning.domain}` : "",
      houseMeaning?.core ? `Reference core meaning: ${houseMeaning.core}` : "",
      `Write the "${section}" section of a natal interpretation for this placement, in the voice and standard of the Firmament Engine.`,
    ]
      .filter(Boolean)
      .join("\n");

    getReading
      .mutateAsync({ prompt })
      .then(result => {
        if (cancelled) return;
        if (!result?.reading) throw new Error("empty");
        setAiReadings(prev => ({ ...prev, [aiCacheKey]: result.reading }));
      })
      .catch(() => {
        if (!cancelled)
          setAiError(
            "The engine did not respond. Showing reference meaning instead."
          );
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, activeTab, aiCacheKey]);

  const aiCurrent = aiReadings[aiCacheKey];

  return (
    <div
      style={{
        border: `1px solid ${hasRoyal ? "#c8a050" : "var(--rim)"}`,
        borderRadius: "4px",
        background: "var(--deep)",
        overflow: "hidden",
        transition: "border-color 0.3s",
      }}
    >
      {/* Planet header — always visible, click to expand */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: open ? "1px solid var(--rim)" : "none",
          background: "rgba(255,255,255,0.02)",
          cursor: "pointer",
          userSelect: "none",
        }}
        onMouseEnter={e =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
        }
        onMouseLeave={e =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
        }
      >
        <div style={{ fontSize: "20px", width: "28px", textAlign: "center" }}>
          {glyph}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "12px",
              color: "#fff",
              letterSpacing: "1px",
            }}
          >
            {p.name}
            {p.retrograde ? " \u211e" : ""}
            {hasRoyal && (
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "9px",
                  color: "#c8a050",
                  letterSpacing: "2px",
                }}
              >
                {"\u2605 ROYAL STAR"}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "var(--ember)",
              marginTop: "2px",
            }}
          >
            {degree}° {minutes > 0 ? `${minutes}' ` : ""}
            {p.sign} — House {houseNum ?? "?"}
          </div>
          {houseKeywords.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginTop: "4px",
                flexWrap: "wrap",
              }}
            >
              {houseKeywords.map((k, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "9px",
                    color: "var(--silver-dim)",
                    padding: "2px 6px",
                    border: "1px solid var(--rim)",
                    borderRadius: "999px",
                    letterSpacing: "1px",
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "6px",
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "9px",
              letterSpacing: "2px",
              color: dignity.color,
              padding: "3px 8px",
              border: `1px solid ${dignity.color}`,
              borderRadius: "999px",
            }}
          >
            {dignity.label}
          </div>
          <div
            style={{
              color: "var(--silver-dim)",
              fontSize: "11px",
              transition: "transform 0.3s",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▾
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div>
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--rim)",
              overflowX: "auto",
            }}
          >
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeTab === tab
                      ? "2px solid var(--ember)"
                      : "2px solid transparent",
                  color:
                    activeTab === tab ? "var(--ember)" : "var(--silver-dim)",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "9px",
                  letterSpacing: "2px",
                  padding: "10px 14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.2s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {activeTab === "LAYERS" && (
              <>
                {nak && (
                  <Row label="NAKSHATRA" color="var(--ember)">
                    {nak.nakshatra.name} pada {nak.pada} — lord{" "}
                    {nak.nakshatra.lord}
                  </Row>
                )}
                <Row label="DECAN" color="var(--ember)">
                  {decanRuler} — {decanFlavor}
                </Row>
                {sabian && (
                  <Row label="SABIAN" color="var(--ember)">
                    <em>"{sabian}"</em>
                  </Row>
                )}
                {stars.map((s, si) => (
                  <Row
                    key={si}
                    label={s.star.isRoyal ? "\u2605 ROYAL" : "FIXED STAR"}
                    color="#c8a050"
                  >
                    <span style={{ color: "#c8a050" }}>
                      {s.star.name} (orb {s.orb}°) — {s.star.archetype}
                    </span>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--silver-dim)",
                        marginTop: "4px",
                      }}
                    >
                      {s.star.gift}
                    </div>
                  </Row>
                ))}
              </>
            )}

            {activeTab === "MEANING" && houseMeaning && (
              <>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--ember)",
                    fontFamily: "'Cinzel', serif",
                    letterSpacing: "2px",
                    marginBottom: "4px",
                  }}
                >
                  {houseMeaning.domain.toUpperCase()}
                </div>
                {aiLoading ? (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--silver-dim)",
                      fontStyle: "italic",
                    }}
                  >
                    Consulting the Firmament Engine…
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "var(--silver)",
                      lineHeight: 1.7,
                    }}
                  >
                    {aiCurrent || houseMeaning.core}
                  </div>
                )}
                {aiError && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#e87070",
                      marginTop: "6px",
                    }}
                  >
                    {aiError}
                  </div>
                )}
                {houseMeaning.vedic && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--silver-dim)",
                      fontStyle: "italic",
                      marginTop: "8px",
                      padding: "8px 12px",
                      border: "1px solid var(--rim)",
                      borderRadius: "3px",
                    }}
                  >
                    {"\u015A\u0101stra"}: {houseMeaning.vedic}
                  </div>
                )}
              </>
            )}

            {activeTab === "CAREER" && houseMeaning && (
              <>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--ember)",
                    fontFamily: "'Cinzel', serif",
                    letterSpacing: "2px",
                    marginBottom: "4px",
                  }}
                >
                  VOCATION & LIFE WORK
                </div>
                {aiLoading ? (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--silver-dim)",
                      fontStyle: "italic",
                    }}
                  >
                    Consulting the Firmament Engine…
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "var(--silver)",
                      lineHeight: 1.7,
                    }}
                  >
                    {aiCurrent || houseMeaning.career}
                  </div>
                )}
                {aiError && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#e87070",
                      marginTop: "6px",
                    }}
                  >
                    {aiError}
                  </div>
                )}
              </>
            )}

            {activeTab === "RELATIONSHIPS" && houseMeaning && (
              <>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--ember)",
                    fontFamily: "'Cinzel', serif",
                    letterSpacing: "2px",
                    marginBottom: "4px",
                  }}
                >
                  LOVE & CONNECTION
                </div>
                {aiLoading ? (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--silver-dim)",
                      fontStyle: "italic",
                    }}
                  >
                    Consulting the Firmament Engine…
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "var(--silver)",
                      lineHeight: 1.7,
                    }}
                  >
                    {aiCurrent || houseMeaning.relationships}
                  </div>
                )}
                {aiError && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#e87070",
                      marginTop: "6px",
                    }}
                  >
                    {aiError}
                  </div>
                )}
              </>
            )}

            {activeTab === "CHALLENGE" && houseMeaning && (
              <>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#e87070",
                    fontFamily: "'Cinzel', serif",
                    letterSpacing: "2px",
                    marginBottom: "4px",
                  }}
                >
                  CHALLENGE TO NAVIGATE
                </div>
                {aiLoading ? (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--silver-dim)",
                      fontStyle: "italic",
                      marginBottom: "12px",
                    }}
                  >
                    Consulting the Firmament Engine…
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "var(--silver)",
                      lineHeight: 1.7,
                      marginBottom: "12px",
                    }}
                  >
                    {aiCurrent || houseMeaning.challenge}
                  </div>
                )}
                {aiError && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#e87070",
                      marginTop: "-6px",
                      marginBottom: "12px",
                    }}
                  >
                    {aiError}
                  </div>
                )}
                <div
                  style={{
                    fontSize: "11px",
                    color: "#70c8a0",
                    fontFamily: "'Cinzel', serif",
                    letterSpacing: "2px",
                    marginBottom: "4px",
                  }}
                >
                  GIFT YOU CARRY
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--silver)",
                    lineHeight: 1.7,
                  }}
                >
                  {houseMeaning.gift}
                </div>
              </>
            )}

            {!houseMeaning && activeTab !== "LAYERS" && (
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--silver-dim)",
                  fontStyle: "italic",
                }}
              >
                House meaning not available for this placement.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, color, children }: any) {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        fontSize: "13px",
        alignItems: "flex-start",
      }}
    >
      <span
        style={{
          color,
          fontFamily: "'Cinzel', serif",
          fontSize: "9px",
          letterSpacing: "2px",
          width: "80px",
          flexShrink: 0,
          paddingTop: "2px",
        }}
      >
        {label}
      </span>
      <span style={{ color: "var(--silver)", lineHeight: 1.6 }}>
        {children}
      </span>
    </div>
  );
}

export function NatalPlacements({ planets }: any) {
  if (!planets || planets.length === 0) return null;

  const placementsForStars = {};
  for (const p of planets) {
    const abs = toAbsolute(p.sign, p.degreeInSign ?? p.degree ?? 0);
    placementsForStars[p.name] = {
      sign: p.sign,
      degree: p.degreeInSign ?? p.degree ?? 0,
      planet: p.name,
      absolute: abs,
    };
  }
  const conjunctions = detectFixedStarConjunctions(placementsForStars);
  const starMap: Record<string, any[]> = {};
  for (const c of conjunctions) {
    if (!starMap[c.planet]) starMap[c.planet] = [];
    starMap[c.planet].push(c);
  }

  return (
    <div style={{ marginBottom: "32px", animation: "fadeUp 0.5s ease both" }}>
      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
          padding: "20px",
          border: "1px solid var(--rim)",
          background: "var(--deep)",
          borderRadius: "4px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, var(--ember), transparent)",
          }}
        />
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "10px",
            letterSpacing: "4px",
            color: "var(--ember)",
            marginBottom: "6px",
          }}
        >
          {"\u2736 NATAL PLACEMENTS \u2736"}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--silver-dim)",
            fontStyle: "italic",
          }}
        >
          Tap any planet to explore all layers
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {planets.map((p: any, i: number) => (
          <PlanetCard key={i} p={p} starMap={starMap} />
        ))}
      </div>
    </div>
  );
}
