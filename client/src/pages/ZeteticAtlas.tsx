import { FormEvent, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Compass, Crosshair, Eye, MapPinned, RotateCcw } from "lucide-react";
import { calculateZeteticChart, compassPoint, gleasonPoint, type ZeteticInput, type ZeteticPoint } from "@/lib/zeteticAtlas";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";

const SAMPLE: ZeteticInput = {
  birthDate: "1986-11-20",
  birthTime: "10:06",
  timezone: "America/Chicago",
  location: "Dallas, Texas",
  latitude: 32.7767,
  longitude: -96.797,
};

const TIMEZONES = ["America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York", "Europe/London", "Europe/Paris", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"];
type MapMode = "gleason" | "compass";

function degree(value: number) { return `${value.toFixed(1)}°`; }

function dialogueChartPayload(chart: ReturnType<typeof calculateZeteticChart>) {
  return {
    baseline: chart.baseline,
    input: chart.input,
    utcIso: chart.utcDate.toISOString(),
    utcDegrees: chart.utcDegrees,
    ascendant: chart.ascendant,
    descendant: chart.descendant,
    midheaven: chart.midheaven,
    imumCoeli: chart.imumCoeli,
    houses: chart.houses.map(({ number, startLabel, endLabel }) => ({ number, startLabel, endLabel })),
    points: chart.points.map(({ name, kind, longitude, sign, degree, house, rightAscension, declination, azimuth, altitude, nakshatra, fixedStars, dignity, combustion }) => ({ name, kind, longitude, sign, degree, house, rightAscension, declination, azimuth, altitude, nakshatra, fixedStars, dignity, combustion })),
  };
}

function combustionLabel(point: ZeteticPoint) {
  if (!point.combustion.applicable) return "—";
  const distance = degree(point.combustion.angularDistance ?? 0);
  return point.combustion.isCombust ? `Combust · ${distance} ≤ ${degree(point.combustion.threshold)}` : `Clear · ${distance} > ${degree(point.combustion.threshold)}`;
}

function DignityEvidence({ point }: { point: ZeteticPoint }) {
  return <div style={{ borderTop:"1px solid rgba(26,44,49,.16)", marginTop:10, paddingTop:10, fontSize:12, color:"#334c50", lineHeight:1.45 }}>
    <strong style={{ color:"#1c3c41" }}>Essential dignity:</strong> {point.dignity.label} · {point.dignity.scope}<br />
    <strong style={{ color:"#1c3c41" }}>Strict combustion:</strong> {point.combustion.applicable ? <>{point.combustion.isCombust ? "Combust" : "Not combust"} · Sun distance {degree(point.combustion.angularDistance ?? 0)} · threshold {degree(point.combustion.threshold)}</> : "Not applicable"}<br />
    <span style={{ color:"#58716f" }}>{point.combustion.rule}</span>
  </div>;
}

function AtlasMap({ points, selected, mode, onSelect }: { points: ZeteticPoint[]; selected: ZeteticPoint; mode: MapMode; onSelect: (point: ZeteticPoint) => void }) {
  const selectedPoint = mode === "gleason" ? gleasonPoint(selected.rightAscension, selected.declination) : compassPoint(selected.azimuth, selected.altitude);
  return <svg className="zetetic-map" viewBox="0 0 1000 1000" role="img" aria-label="Interactive Zetetic Atlas map">
    <defs>
      <radialGradient id="atlas-vignette"><stop offset="0" stopColor="#16263b" /><stop offset="0.68" stopColor="#0b1726" /><stop offset="1" stopColor="#07111d" /></radialGradient>
    </defs>
    <circle cx="500" cy="500" r="440" fill="url(#atlas-vignette)" stroke="rgba(222, 203, 151, .45)" strokeWidth="1" />
    {[92, 176, 260, 344, 405].map((radius, index) => <circle key={radius} cx="500" cy="500" r={radius} fill="none" stroke={index === 4 ? "rgba(222,203,151,.38)" : "rgba(166,201,205,.13)"} strokeWidth="1" strokeDasharray={index === 4 ? "0" : "3 8"} />)}
    <line x1="500" x2="500" y1="60" y2="90" stroke="#d9b767" strokeWidth="3" />
    <text x="500" y="46" className="atlas-small-label">{mode === "gleason" ? "POLAR DATUM" : "LOCAL NORTH"}</text>
    {mode === "compass" && <><circle cx="500" cy="500" r="405" fill="none" stroke="rgba(114,197,180,.38)" strokeDasharray="5 7" /><text x="500" y="946" className="atlas-small-label">HORIZON · VISIBLE SKY ONLY</text></>}
    {(mode === "gleason" || selectedPoint.visible) && <><line x1="500" y1="500" x2={selectedPoint.x} y2={selectedPoint.y} stroke="#72c5b4" strokeWidth="1.4" strokeDasharray="5 5" /><circle cx="500" cy="500" r={selectedPoint.radius} fill="none" stroke="rgba(114,197,180,.28)" strokeDasharray="3 6" /></>}
    {points.map((point) => {
      const position = mode === "gleason" ? { ...gleasonPoint(point.rightAscension, point.declination), visible: true } : compassPoint(point.azimuth, point.altitude);
      if (!position.visible) return null;
      const active = point.key === selected.key;
      return <g key={point.key} tabIndex={0} role="button" aria-label={`Inspect ${point.name}`} className={`atlas-point ${active ? "is-active" : ""}`} onClick={() => onSelect(point)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(point); }}>
        <circle cx={position.x} cy={position.y} r={active ? 19 : 14} fill={point.color} opacity={active ? .27 : .15} />
        <circle cx={position.x} cy={position.y} r={active ? 11 : 8.5} fill={point.color} stroke="#07111d" strokeWidth="2" />
        <text x={position.x} y={position.y + 3.2} className="atlas-point-code">{point.short}</text>
        <text x={position.x + 14} y={position.y + 3} className="atlas-point-name">{point.name}</text>
      </g>;
    })}
    <circle cx="500" cy="500" r="76" fill="#091420" stroke="rgba(223,203,151,.28)" />
    <text x="500" y="484" className="atlas-small-label">{mode === "gleason" ? "FIELD INSTANCE" : "LOCAL SKY"}</text>
    <text x="500" y="518" className="atlas-center-name">Firmament</text>
    <text x="500" y="540" className="atlas-center-detail">{mode === "gleason" ? "RA / DECLINATION" : "AZIMUTH / ALTITUDE"}</text>
  </svg>;
}

export default function ZeteticAtlas() {
  const [input, setInput] = useState<ZeteticInput>(SAMPLE);
  const [chart, setChart] = useState(() => calculateZeteticChart(SAMPLE));
  const [selectedKey, setSelectedKey] = useState("sun");
  const [mode, setMode] = useState<MapMode>("gleason");
  const [showAudit, setShowAudit] = useState(true);
  const [error, setError] = useState("");
  const [atlasHistory, setAtlasHistory] = useState<Message[]>([]);
  const atlasScholar = trpc.zeteticAtlas.ask.useMutation();
  const selected = useMemo(() => chart.points.find((point) => point.key === selectedKey) ?? chart.points[0], [chart, selectedKey]);

  const updateInput = <Key extends keyof ZeteticInput>(key: Key, value: ZeteticInput[Key]) => setInput((current) => ({ ...current, [key]: value }));
  const calculate = (event: FormEvent) => {
    event.preventDefault();
    try {
      if (!input.birthDate || !input.birthTime || !Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) throw new Error("Enter a valid local date, local time, timezone, and coordinate pair.");
      const next = calculateZeteticChart(input);
      setChart(next);
      setSelectedKey("sun");
      setAtlasHistory([]);
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The field map could not be calculated."); }
  };
  const reset = () => { setInput(SAMPLE); setChart(calculateZeteticChart(SAMPLE)); setSelectedKey("sun"); setMode("gleason"); setAtlasHistory([]); setError(""); };
  const askAtlasScholar = async (question: string) => {
    if (atlasScholar.isPending) return;
    const priorHistory = atlasHistory.slice(-10);
    const userMessage: Message = { role: "user", content: question };
    setAtlasHistory([...atlasHistory, userMessage]);
    try {
      const result = await atlasScholar.mutateAsync({ question, chart: dialogueChartPayload(chart), history: priorHistory });
      setAtlasHistory((history) => [...history, { role: "assistant", content: result.answer }]);
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : "The Atlas Scholar could not respond.";
      setAtlasHistory((history) => [...history, { role: "assistant", content: `**Atlas Scholar unavailable.** ${detail}` }]);
    }
  };
  const selectedCompass = compassPoint(selected.azimuth, selected.altitude);

  return <main className="zetetic-atlas-page">
    <style>{`
      .zetetic-atlas-page { min-height:100vh; color:#edf0e8; background:radial-gradient(circle at 48% -10%, rgba(103,153,166,.18), transparent 34%), #07111d; font-family:'Crimson Pro', Georgia, serif; padding:24px; }
      .zetetic-shell { max-width:1480px; margin:0 auto; }
      .zetetic-topbar { display:flex; justify-content:space-between; gap:20px; align-items:center; border-bottom:1px solid rgba(205,194,152,.26); padding:0 0 20px; }
      .zetetic-brand { color:#f3f0e7; font-family:'Cinzel', serif; letter-spacing:.14em; font-size:14px; text-decoration:none; }
      .zetetic-nav { display:flex; gap:16px; flex-wrap:wrap; align-items:center; } .zetetic-nav a, .zetetic-nav button { border:0; background:none; color:#97aaa8; text-decoration:none; font:600 10px 'Cinzel',serif; letter-spacing:.12em; cursor:pointer; }
      .zetetic-nav a:hover, .zetetic-nav button:hover { color:#dcbf74; }
      .zetetic-layout { display:grid; grid-template-columns:260px minmax(460px,1fr) 280px; min-height:calc(100vh - 88px); }
      .zetetic-rail { padding:28px 20px; background:rgba(4,12,20,.45); border-right:1px solid rgba(205,194,152,.16); } .zetetic-detail { border-left:1px solid rgba(205,194,152,.16); border-right:0; background:linear-gradient(180deg,#eeeadb,#dfe0d6); color:#1a2c31; }
      .atlas-eyebrow { margin:0 0 7px; color:#82cabc; font:700 9px 'Cinzel',serif; letter-spacing:.18em; text-transform:uppercase; }.atlas-title { margin:0 0 8px; font:29px/1 'Cinzel',serif; color:#f1f0e8; }.atlas-copy { color:#9cadaa; font-size:13px; line-height:1.45; margin:0 0 22px; }
      .atlas-form { display:grid; gap:12px; }.atlas-field { display:grid; gap:5px; }.atlas-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }.atlas-field label { color:#9bb4b2; font:700 8px 'Cinzel',serif; letter-spacing:.13em; text-transform:uppercase; }.atlas-field input,.atlas-field select { width:100%; box-sizing:border-box; color:#ebeee9; background:rgba(255,255,255,.03); border:0; border-bottom:1px solid rgba(163,198,192,.35); padding:8px 2px; outline:0; font:15px 'Crimson Pro',serif; }.atlas-field option { background:#10202d; color:#f2f0e7; }
      .atlas-calculate { display:flex; justify-content:center; align-items:center; gap:8px; border:1px solid #8fd5c3; margin-top:5px; padding:12px 10px; color:#07131c; background:#72c5b4; font:700 10px 'Cinzel',serif; letter-spacing:.12em; cursor:pointer; }.atlas-calculate:hover { background:#91d9c8; }.atlas-error { color:#ed9a85; font-size:12px; margin:0; }
      .atlas-stage { min-width:0; padding:28px clamp(18px,3vw,42px) 36px; }.atlas-stage-heading { display:flex; justify-content:space-between; align-items:flex-end; gap:18px; border-bottom:1px solid rgba(205,194,152,.18); padding-bottom:16px; }.atlas-stage-heading h1 { margin:0; color:#f4f1e7; font:clamp(26px,3.2vw,40px)/.95 'Cinzel',serif; }.atlas-stage-heading p { margin:6px 0 0; color:#98aaa7; font-size:12px; }.atlas-controls { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; }.atlas-controls button { color:#9db3ae; background:rgba(255,255,255,.025); border:1px solid rgba(205,194,152,.2); padding:8px 9px; font:700 8px 'Cinzel',serif; letter-spacing:.08em; cursor:pointer; }.atlas-controls button.is-active { background:#72c5b4; border-color:#72c5b4; color:#07131c; }
      .atlas-map-wrap { margin:18px 0 12px; border:1px solid rgba(205,194,152,.18); background:rgba(5,16,27,.72); overflow:hidden; }.zetetic-map { display:block; width:100%; max-height:680px; }.atlas-small-label { fill:#87bdb3; font:700 10px 'Cinzel',serif; letter-spacing:2px; text-anchor:middle; }.atlas-center-name { fill:#f3f0e7; font:21px 'Cinzel',serif; text-anchor:middle; }.atlas-center-detail { fill:#93a4a1; font:700 8px 'Cinzel',serif; letter-spacing:1.6px; text-anchor:middle; }.atlas-point { cursor:pointer; outline:0; }.atlas-point:focus circle,.atlas-point.is-active circle { stroke:#f6edd0; stroke-width:2.5; }.atlas-point-code { fill:#07111d; font:700 7px Arial,sans-serif; text-anchor:middle; pointer-events:none; }.atlas-point-name { fill:#e5e9e4; font:600 10px 'Crimson Pro',serif; pointer-events:none; }
      .atlas-caption { display:flex; justify-content:space-between; gap:12px; color:#95a6a3; font-size:12px; line-height:1.4; }.atlas-caption strong { color:#e9efe9; }.atlas-audit { margin-top:22px; border:1px solid rgba(215,183,104,.34); background:linear-gradient(135deg,rgba(215,183,104,.08),rgba(7,17,29,.6)); padding:16px; }.atlas-audit h2 { color:#dcbf74; margin:0 0 14px; font:700 11px 'Cinzel',serif; letter-spacing:.15em; }.atlas-audit-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0; border-bottom:1px solid rgba(205,194,152,.16); }.atlas-audit-grid section { padding:10px; }.atlas-audit-grid section+section { border-left:1px solid rgba(205,194,152,.16); }.atlas-audit dt { color:#8b9f9b; font:700 8px 'Cinzel',serif; letter-spacing:.1em; }.atlas-audit dd { margin:3px 0 8px; color:#edf0e8; font:12px 'Crimson Pro',serif; }.atlas-scroll { overflow-x:auto; }.atlas-audit table { min-width:780px; width:100%; border-collapse:collapse; font-size:11px; margin-top:12px; }.atlas-audit th { color:#8cb8b0; text-align:left; font:700 8px 'Cinzel',serif; letter-spacing:.1em; }.atlas-audit td,.atlas-audit th { padding:7px 5px; border-bottom:1px solid rgba(205,194,152,.12); }.atlas-audit td { color:#dbe2dd; }.atlas-dialogue { margin-top:22px; border:1px solid rgba(114,197,180,.38); background:rgba(7,17,29,.72); padding:16px; }.atlas-dialogue h2 { color:#82cabc; margin:0 0 5px; font:700 11px 'Cinzel',serif; letter-spacing:.15em; }.atlas-dialogue > p { color:#98aaa7; margin:0 0 14px; font-size:13px; }.atlas-dialogue .bg-card,.atlas-dialogue .bg-background\/50 { background:rgba(4,14,23,.96) !important; }.atlas-dialogue .bg-muted { background:rgba(114,197,180,.1) !important; }.atlas-dialogue .border,.atlas-dialogue .border-t { border-color:rgba(114,197,180,.28) !important; }.atlas-dialogue .text-foreground,.atlas-dialogue .prose { color:#e6ece8 !important; }.atlas-dialogue .bg-primary { background:#72c5b4 !important; }.atlas-dialogue .text-primary-foreground { color:#07131c !important; }
      .detail-eyebrow { color:#3a756d; }.zetetic-detail .atlas-title { color:#1a2c31; }.zetetic-detail .atlas-copy { color:#58716f; }.atlas-stat-grid { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid rgba(26,44,49,.2); border-bottom:1px solid rgba(26,44,49,.2); margin:18px 0; }.atlas-stat { padding:10px 6px; }.atlas-stat+.atlas-stat { border-left:1px solid rgba(26,44,49,.18); }.atlas-stat b { display:block; color:#1b3338; font:18px 'Cinzel',serif; }.atlas-stat span { color:#5f7776; font:700 7px 'Cinzel',serif; letter-spacing:.08em; text-transform:uppercase; }.atlas-house { padding:10px 0; border-bottom:1px solid rgba(26,44,49,.14); font-size:12px; color:#334c50; }.atlas-house strong { color:#1c3c41; }.atlas-point-list { display:grid; gap:5px; }.atlas-point-row { width:100%; display:grid; grid-template-columns:8px 1fr auto; gap:8px; align-items:center; background:transparent; border:0; padding:7px 0; text-align:left; color:#334c50; cursor:pointer; font:12px 'Crimson Pro',serif; }.atlas-point-row.is-active { background:rgba(114,197,180,.13); }.atlas-dot { width:7px; height:7px; border-radius:50%; }
      @media(max-width:1040px){ .zetetic-layout{grid-template-columns:230px minmax(0,1fr)}.zetetic-detail{grid-column:1/-1;border-left:0;border-top:1px solid rgba(205,194,152,.16);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.zetetic-detail .atlas-title,.zetetic-detail .atlas-copy,.zetetic-detail .atlas-stat-grid{grid-column:span 1}.atlas-point-list{grid-column:span 2}.atlas-house{grid-column:span 1} }
      @media(max-width:700px){.zetetic-atlas-page{padding:14px}.zetetic-topbar{align-items:flex-start;flex-direction:column}.zetetic-layout{display:block}.zetetic-rail,.zetetic-detail{border:0;padding:22px 10px}.atlas-stage{padding:24px 10px}.atlas-stage-heading{align-items:flex-start;flex-direction:column}.atlas-controls{justify-content:flex-start}.atlas-audit-grid{grid-template-columns:1fr}.atlas-audit-grid section+section{border-left:0;border-top:1px solid rgba(205,194,152,.16)}.zetetic-detail{display:block}.atlas-caption{display:block}.atlas-caption span+span{display:block;margin-top:7px}}
    `}</style>
    <div className="zetetic-shell">
      <header className="zetetic-topbar"><Link href="/" className="zetetic-brand">THE FIRMAMENT · ZETETIC ATLAS</Link><nav className="zetetic-nav"><Link href="/"><ArrowLeft size={12} style={{ verticalAlign:"-2px", marginRight:5 }} />NATAL ENGINE</Link><Link href="/sports">SPORTS PREDICTION</Link><button type="button" onClick={reset}><RotateCcw size={12} style={{ verticalAlign:"-2px", marginRight:5 }} />RESET SAMPLE</button></nav></header>
      <div className="zetetic-layout">
        <aside className="zetetic-rail"><p className="atlas-eyebrow">Zetetic origin record</p><h2 className="atlas-title">Plot a fixed sky.</h2><p className="atlas-copy">Local time resolves through IANA timezones into UTC. The isolated chart frame then uses direct UTC degrees and longitude.</p><form className="atlas-form" onSubmit={calculate}>
          <div className="atlas-row"><div className="atlas-field"><label htmlFor="za-date">Birth date</label><input id="za-date" type="date" value={input.birthDate} onChange={(event) => updateInput("birthDate", event.target.value)} /></div><div className="atlas-field"><label htmlFor="za-time">Local time</label><input id="za-time" type="time" value={input.birthTime} onChange={(event) => updateInput("birthTime", event.target.value)} /></div></div>
          <div className="atlas-field"><label htmlFor="za-zone">Timezone</label><select id="za-zone" value={input.timezone} onChange={(event) => updateInput("timezone", event.target.value)}>{TIMEZONES.map((zone) => <option key={zone}>{zone}</option>)}</select></div>
          <div className="atlas-field"><label htmlFor="za-location">Location label</label><input id="za-location" value={input.location} onChange={(event) => updateInput("location", event.target.value)} /></div>
          <div className="atlas-row"><div className="atlas-field"><label htmlFor="za-lat">Latitude</label><input id="za-lat" type="number" step="0.0001" value={input.latitude} onChange={(event) => updateInput("latitude", Number(event.target.value))} /></div><div className="atlas-field"><label htmlFor="za-lng">Longitude</label><input id="za-lng" type="number" step="0.0001" value={input.longitude} onChange={(event) => updateInput("longitude", Number(event.target.value))} /></div></div>
          <button className="atlas-calculate" type="submit"><Compass size={15} />CALCULATE FIELD MAP</button>{error && <p className="atlas-error">{error}</p>}
        </form></aside>
          <section className="atlas-stage"><div className="atlas-stage-heading"><div><p className="atlas-eyebrow">{mode === "gleason" ? "Gleason celestial projection" : "Local topocentric compass sky"}</p><h1>{chart.input.location || "Untitled coordinate"}</h1><p>{chart.baseline.ephemeris} · {chart.baseline.houses}</p></div><div className="atlas-controls"><button type="button" className={mode === "gleason" ? "is-active" : ""} onClick={() => setMode("gleason")}>GLEASON MAP</button><button type="button" className={mode === "compass" ? "is-active" : ""} onClick={() => setMode("compass")}>COMPASS SKY</button><button type="button" className={showAudit ? "is-active" : ""} onClick={() => setShowAudit((value) => !value)}><Eye size={12} style={{ verticalAlign:"-2px", marginRight:5 }} />AUDIT</button></div></div>
          <div className="atlas-map-wrap"><AtlasMap points={chart.points} selected={selected} mode={mode} onSelect={(point) => setSelectedKey(point.key)} /></div><div className="atlas-caption"><span><strong>Active datum:</strong> {mode === "gleason" ? "RA and declination determine independent Gleason placement." : "Topocentric azimuth gives compass bearing; altitude gives local sky height."}</span><span><MapPinned size={12} style={{ verticalAlign:"-2px", marginRight:4 }} />{mode === "gleason" ? "North-pole center" : "Visible sky only"}</span></div>
          {showAudit && <section className="atlas-audit"><h2>Audit mode · live calculation trace</h2><div className="atlas-audit-grid"><section><dl><dt>BASELINE</dt><dd>{chart.baseline.id}</dd><dt>EPHEMERIS</dt><dd>{chart.baseline.ephemeris}</dd><dt>LOCAL INPUT</dt><dd>{chart.input.birthDate} {chart.input.birthTime} · {chart.input.timezone}</dd><dt>UTC INSTANT</dt><dd>{chart.utcDate.toISOString().replace("T", " ").slice(0, 19)}Z</dd><dt>LONGITUDE OFFSET</dt><dd>{degree(chart.input.longitude)}</dd></dl></section><section><dl><dt>UTC DEGREES</dt><dd>{degree(chart.utcDegrees)}</dd><dt>AXIS FORMULA</dt><dd>{chart.baseline.axes}</dd><dt>MC = UTC° + LONGITUDE</dt><dd>{degree(chart.midheaven)} · {chart.points.find((point) => point.key === "midheaven")?.sign}</dd><dt>ASC = MC + 90°</dt><dd>{degree(chart.ascendant)} · {chart.points.find((point) => point.key === "ascendant")?.sign}</dd><dt>HOUSE SYSTEM</dt><dd>{chart.baseline.houses}</dd></dl></section></div><div className="atlas-scroll"><table><thead><tr><th>Point</th><th>Tropical longitude</th><th>Dignity</th><th>Strict combustion</th><th>Nakshatra / fixed-grid star</th><th>House</th><th>RA</th><th>Dec</th><th>Azimuth</th><th>Altitude</th><th>Gleason X/Y</th><th>Compass X/Y</th></tr></thead><tbody>{chart.points.map((point) => { const gleason = gleasonPoint(point.rightAscension, point.declination); const compass = compassPoint(point.azimuth, point.altitude); const stars = point.fixedStars.length ? point.fixedStars.map((star) => `${star.name}${star.isRoyal ? " ★" : ""} ${degree(star.orb)}`).join(", ") : "—"; return <tr key={point.key}><td>{point.name}</td><td>{point.signSymbol} {point.sign} {degree(point.degree)}</td><td>{point.dignity.label}</td><td>{combustionLabel(point)}</td><td>{point.nakshatra.name} P{point.nakshatra.pada} · {stars}</td><td>H{point.house}</td><td>{point.rightAscension.toFixed(2)}h</td><td>{degree(point.declination)}</td><td>{degree(point.azimuth)}</td><td>{degree(point.altitude)}</td><td>{gleason.x.toFixed(1)} / {gleason.y.toFixed(1)}</td><td>{compass.x.toFixed(1)} / {compass.y.toFixed(1)}{compass.visible ? "" : " · below horizon"}</td></tr>; })}</tbody></table></div><p className="atlas-copy" style={{ margin:"12px 0 0" }}>Essential dignity uses declared traditional domicile, detriment, exaltation, and fall rules for the seven traditional planets. Strict combustion uses raw tropical Sun–planet distance of 15.0° or less. Neither changes tropical longitude, houses, or map coordinates. Fixed-star proximity compares that longitude with labeled permanent fixed-grid catalog anchors; it is not a live star ephemeris or an ayanamsa correction. RA/declination and topocentric azimuth/altitude remain independent map layers.</p></section>}
          <section className="atlas-dialogue"><h2>Atlas Scholar · reflective dialogue</h2><p>The Scholar receives this active live chart and its audit conventions. It does not alter the chart model or treat symbolic interpretation as certainty.</p><AIChatBox messages={atlasHistory} onSendMessage={askAtlasScholar} isLoading={atlasScholar.isPending} height="440px" placeholder="Ask about a planet, house, map coordinate, or pattern in this chart…" emptyStateMessage="Ask the Atlas Scholar about this calculated chart." suggestedPrompts={["What is the central pattern in this chart?", "How should I read the Ascendant and first-house range?", "What does the Compass Sky view add without changing the zodiac chart?"]} /></section>
        </section>
        <aside className="zetetic-rail zetetic-detail"><section><p className="atlas-eyebrow detail-eyebrow">Selected placement</p><h2 className="atlas-title">{selected.name}</h2><p className="atlas-copy"><strong>{selected.signSymbol} {selected.sign} {degree(selected.degree)}</strong> · House {selected.house}</p><div className="atlas-stat-grid"><div className="atlas-stat"><b>{degree(selected.longitude)}</b><span>Tropical long.</span></div>{mode === "gleason" ? <div className="atlas-stat"><b>{degree(selected.declination)}</b><span>Declination</span></div> : <><div className="atlas-stat"><b>{degree(selected.azimuth)}</b><span>Azimuth</span></div><div className="atlas-stat"><b>{degree(selected.altitude)}</b><span>Altitude</span></div></>}</div><p className="atlas-house"><strong>House {selected.house}:</strong> {chart.houses[selected.house - 1]?.startLabel} → {chart.houses[selected.house - 1]?.endLabel}</p><div style={{ borderTop:"1px solid rgba(26,44,49,.16)", paddingTop:10, fontSize:12, color:"#334c50", lineHeight:1.45 }}><strong style={{ color:"#1c3c41" }}>Tropical nakshatra:</strong> {selected.nakshatra.name} · Pada {selected.nakshatra.pada} · {selected.nakshatra.lord} ruler<br />{selected.kind === "planet" && <><strong style={{ color:"#1c3c41" }}>Fixed-grid star proximity:</strong> {selected.fixedStars.length ? selected.fixedStars.map((star) => `${star.name}${star.isRoyal ? " ★" : ""} (${degree(star.orb)})`).join(", ") : "No catalog anchor within the configured orb."}</>}</div><DignityEvidence point={selected} /></section><section><p className="atlas-eyebrow detail-eyebrow" style={{ marginTop:22 }}>Reference points</p><div className="atlas-point-list">{chart.points.filter((point) => point.kind !== "planet").map((point) => <button className={`atlas-point-row ${point.key === selected.key ? "is-active" : ""}`} key={point.key} type="button" onClick={() => setSelectedKey(point.key)}><i className="atlas-dot" style={{ background:point.color }} /><span>{point.name}</span><span>{point.signSymbol} {degree(point.degree)}</span></button>)}</div></section><section><p className="atlas-eyebrow detail-eyebrow" style={{ marginTop:22 }}>Planet index</p><div className="atlas-point-list">{chart.points.filter((point) => point.kind === "planet").map((point) => <button className={`atlas-point-row ${point.key === selected.key ? "is-active" : ""}`} key={point.key} type="button" onClick={() => setSelectedKey(point.key)}><i className="atlas-dot" style={{ background:point.color }} /><span>{point.name}</span><span>{point.signSymbol} {degree(point.degree)}</span></button>)}</div></section></aside>
      </div>
    </div>
  </main>;
}
