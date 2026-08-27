import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { speak, stopSpeaking, isSpeaking } from "@/lib/textToSpeech";
import { Volume2, Square } from "lucide-react";

/**
 * SPORTS HORARY PAGE  (route: /sports)
 * ----------------------------------------------------------------------------
 * A self-contained layer with its OWN chat box. The deterministic engine
 * (server/sportsHorary.ts) scores the chart; the LLM narrates the verdict.
 * You enter the two sides + the event-chart placements, then ask the oracle.
 */

const TRANSIT_PLACEHOLDER = `Paste the event-chart placements (the sky at game time). One planet per line, e.g.:
Sun: 15° Leo, 5th house
Moon: 10° Cancer, 4th house
Mars: 5° Aries, 1st house
Mercury: 20° Leo, 5th house
Jupiter: 8° Sagittarius, 9th house
Venus: 12° Libra, 7th house
Saturn: 25° Capricorn, 10th house`;

const MAJOR_CITIES = {
  "New York": { lat: 40.7128, lon: -74.006 },
  "Los Angeles": { lat: 34.0522, lon: -118.2437 },
  "Chicago": { lat: 41.8781, lon: -87.6298 },
  "Houston": { lat: 29.7604, lon: -95.3698 },
  "Phoenix": { lat: 33.4484, lon: -112.074 },
  "Philadelphia": { lat: 39.9526, lon: -75.1652 },
  "San Antonio": { lat: 29.4241, lon: -98.4936 },
  "San Diego": { lat: 32.7157, lon: -117.1611 },
  "Dallas": { lat: 32.7767, lon: -96.797 },
  "San Jose": { lat: 37.3382, lon: -121.8863 },
  "Miami": { lat: 25.7617, lon: -80.1918 },
  "Denver": { lat: 39.7392, lon: -104.9903 },
  "Seattle": { lat: 47.6062, lon: -122.3321 },
  "Boston": { lat: 42.3601, lon: -71.0589 },
  "Las Vegas": { lat: 36.1699, lon: -115.1398 },
  "Atlanta": { lat: 33.749, lon: -84.388 },
  "London": { lat: 51.5074, lon: -0.1278 },
  "Paris": { lat: 48.8566, lon: 2.3522 },
  "Tokyo": { lat: 35.6762, lon: 139.6503 },
  "Sydney": { lat: -33.8688, lon: 151.2093 },
  "Mumbai": { lat: 19.0760, lon: 72.8777 },
  "Dubai": { lat: 25.2048, lon: 55.2708 },
  "Singapore": { lat: 1.3521, lon: 103.8198 },
  "Toronto": { lat: 43.6532, lon: -79.3832 },
  "Mexico City": { lat: 19.4326, lon: -99.1332 },
  "Pittsburgh": { lat: 40.4406, lon: -79.9959 },
  "Cincinnati": { lat: 39.1031, lon: -84.512 },
  "Cleveland": { lat: 41.4993, lon: -81.6944 },
  "Detroit": { lat: 42.3314, lon: -83.0458 },
  "Milwaukee": { lat: 43.0389, lon: -87.9065 },
  "Minneapolis": { lat: 44.9778, lon: -93.265 },
  "Kansas City": { lat: 39.0997, lon: -94.5786 },
  "St. Louis": { lat: 38.627, lon: -90.1994 },
  "Baltimore": { lat: 39.2904, lon: -76.6122 },
  "Washington DC": { lat: 38.9072, lon: -77.0369 },
  "Tampa": { lat: 27.9506, lon: -82.4572 },
  "Oakland": { lat: 37.8044, lon: -122.2712 },
  "Sacramento": { lat: 38.5816, lon: -121.4944 },
  "Anaheim": { lat: 33.8366, lon: -117.9143 },
  "San Francisco": { lat: 37.7749, lon: -122.4194 },
  "Buffalo": { lat: 42.8864, lon: -78.8784 },
  "Columbus": { lat: 39.9612, lon: -82.9988 },
  "Nashville": { lat: 36.1627, lon: -86.7816 },
  "Raleigh": { lat: 35.7796, lon: -78.6382 },
  "Newark": { lat: 40.7357, lon: -74.1724 },
  "Montreal": { lat: 45.5017, lon: -73.5673 },
  "Ottawa": { lat: 45.4215, lon: -75.6972 },
  "Winnipeg": { lat: 49.8951, lon: -97.1384 },
  "Calgary": { lat: 51.0447, lon: -114.0719 },
  "Edmonton": { lat: 53.5461, lon: -113.4938 },
  "Vancouver": { lat: 49.2827, lon: -123.1207 },
  "Salt Lake City": { lat: 40.7608, lon: -111.891 },
};

type Verdict = "Favorite" | "Challenger" | "Even";

type LayerVote = {
  layer: string;
  sideAPoints: number;
  sideBPoints: number;
  difference: number | null;
  supportMagnitude: number | null;
  choice: "A" | "B" | "tie" | "abstain";
  status: "eligible" | "tie" | "abstain";
  reason: string;
};

type LayerVoteScorecard = {
  version: "layer-vote-v1";
  votes: LayerVote[];
  sideAVotes: number;
  sideBVotes: number;
  ties: number;
  abstentions: number;
  sideAWeightedSupport: number;
  sideBWeightedSupport: number;
  aggregateChoice: "A" | "B" | "no call";
  aggregateReason: string;
};

type SportsMethod = "cluster" | "frawley" | "tajika-prasna";

type EventMethodResult = {
  version: "frawley-event-v1" | "tajika-prasna-v1";
  orientation: "standard" | "inverse-180";
  method: string;
  status: "ready" | "no-call";
  outcome: "side-a" | "side-b" | "no-call";
  verdict: string;
  reason: string;
  event: {
    venueName: string;
    favoriteName: string;
    challengerName: string;
    favoriteSource: string;
    eventUtcIso: string;
    houseSystem: string;
    houseEngine: string;
    zodiac: string;
  };
  cusps: Array<{ house: number; longitude: number; sign: string }>;
  significators: Array<{
    role: string;
    side: "A" | "B";
    cusp: number;
    cuspLongitude: number;
    cuspSign: string;
    ruler: string;
    planet: { longitude: number; sign: string; degreeInSign: number; speedDegreesPerDay: number; retrograde: boolean };
    sharedRoles: string[];
  }>;
  moon?: {
    startLongitude: number;
    startSign: string;
    signExitUtcIso: string | null;
    conjunctionStopUtcIso: string | null;
    candidates: Array<{ target: string; aspect: number; perfectionUtcIso: string; minutesFromStart: number; targetRoles: string[]; targetSides: string[] }>;
    finalCandidate: { target: string; aspect: number; perfectionUtcIso: string; minutesFromStart: number; targetRoles: string[]; targetSides: string[] } | null;
  };
  sideALink?: { kind: string; first: string; second: string; relation: string; aspect: number; initialOrb: number; perfectionUtcIso: string | null } | null;
  sideBLink?: { kind: string; first: string; second: string; relation: string; aspect: number; initialOrb: number; perfectionUtcIso: string | null } | null;
  separations?: Array<{ kind: string; first: string; second: string; reason: string }>;
  bridges?: Array<{ kind: string; bridge: string; side: "A" | "B"; reason: string }>;
  kamboola?: Array<{ side: "A" | "B"; moonLink: { kind: string; first: string; second: string } }>;
  grahaYuddha?: Array<{ first: string; second: string; separation: number; winner: string; loser: string; involvesPrincipalSignificator: boolean }>;
  conflicts: string[];
};

function VerdictBanner({
  verdict,
  score,
  flags,
  favorite,
  challenger,
  layerVotes,
}: {
  verdict: Verdict;
  score: number;
  flags: string[];
  favorite: string;
  challenger: string;
  layerVotes?: LayerVoteScorecard;
}) {
  const winner =
    verdict === "Favorite"
      ? favorite || "Favorite"
      : verdict === "Challenger"
        ? challenger || "Challenger"
        : "Too close to call";
  const color =
    verdict === "Favorite"
      ? "#16a34a"
      : verdict === "Challenger"
        ? "#dc2626"
        : "#d97706";
  return (
    <div
      className="rounded-lg border-2 p-4 mb-4"
      style={{ borderColor: color, background: `${color}1a` }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wide opacity-70">
            Experimental layer-vote result
          </div>
          <div className="text-2xl font-bold" style={{ color }}>
            {winner}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide opacity-70">
            {layerVotes ? "Eligible layer choices" : "Raw point audit"}
          </div>
          <div className="text-2xl font-mono font-bold" style={{ color }}>
            {layerVotes ? `${layerVotes.sideAVotes}–${layerVotes.sideBVotes}` : score > 0 ? `+${score}` : score}
          </div>
        </div>
      </div>
      {layerVotes && (
        <p className="mt-2 text-xs opacity-75">
          Side A: {layerVotes.sideAVotes} votes · Side B: {layerVotes.sideBVotes} votes · {layerVotes.ties} ties · {layerVotes.abstentions} abstentions. Raw point margin ({score > 0 ? "+" : ""}{score.toFixed(2)}) is audit evidence only, not the deciding rule.
        </p>
      )}
      {flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {flags.map(f => (
            <span
              key={f}
              className="text-xs px-2 py-0.5 rounded border"
              style={{ borderColor: color, color }}
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function LayerVoteAudit({
  scorecard,
  favorite,
  challenger,
}: {
  scorecard: LayerVoteScorecard;
  favorite: string;
  challenger: string;
}) {
  const choiceLabel = (choice: LayerVote["choice"]) =>
    choice === "A" ? favorite || "Side A" : choice === "B" ? challenger || "Side B" : choice === "tie" ? "Tie" : "Abstain";
  const choiceColor = (choice: LayerVote["choice"]) =>
    choice === "A" ? "text-emerald-700 dark:text-emerald-300" : choice === "B" ? "text-rose-700 dark:text-rose-300" : "text-muted-foreground";

  return (
    <section className="mb-5 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">Layer Vote Scorecard</h2>
          <p className="mt-1 text-xs text-muted-foreground">Each completed layer makes one choice. The aggregate counts eligible choices; it does not blend their point scales.</p>
        </div>
        <span className="rounded border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-xs text-primary">{scorecard.version}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div className="rounded bg-muted/50 p-2"><div className="text-xs text-muted-foreground">Side A votes</div><strong>{scorecard.sideAVotes}</strong></div>
        <div className="rounded bg-muted/50 p-2"><div className="text-xs text-muted-foreground">Side B votes</div><strong>{scorecard.sideBVotes}</strong></div>
        <div className="rounded bg-muted/50 p-2"><div className="text-xs text-muted-foreground">Ties</div><strong>{scorecard.ties}</strong></div>
        <div className="rounded bg-muted/50 p-2"><div className="text-xs text-muted-foreground">Abstentions</div><strong>{scorecard.abstentions}</strong></div>
      </div>
      <p className="mt-3 text-sm"><strong>Aggregate:</strong> {scorecard.aggregateReason}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="border-b border-border text-muted-foreground">
            <tr><th className="pb-2 pr-3">Layer</th><th className="pb-2 pr-3">A points</th><th className="pb-2 pr-3">B points</th><th className="pb-2 pr-3">Choice</th><th className="pb-2">Evidence</th></tr>
          </thead>
          <tbody>
            {scorecard.votes.map((vote) => (
              <tr key={vote.layer} className="border-b border-border/60 last:border-0">
                <td className="py-2 pr-3 font-medium">{vote.layer}</td>
                <td className="py-2 pr-3 font-mono">{vote.sideAPoints.toFixed(2)}</td>
                <td className="py-2 pr-3 font-mono">{vote.sideBPoints.toFixed(2)}</td>
                <td className={`py-2 pr-3 font-semibold ${choiceColor(vote.choice)}`}>{choiceLabel(vote.choice)}</td>
                <td className="py-2 text-muted-foreground">{vote.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EventMethodAudit({ result }: { result: EventMethodResult }) {
  const sideName = (side: "A" | "B") => side === "A" ? result.event.favoriteName : result.event.challengerName;
  const linkLabel = (link: EventMethodResult["sideALink"]) => link
    ? `${link.kind}: ${link.first} → ${link.second} · ${link.relation} ${link.aspect}° · ${link.initialOrb.toFixed(2)}° orb`
    : "No qualifying direct completion link";

  return (
    <section className="mb-5 rounded-lg border border-primary/40 bg-card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Separate experimental method</p>
          <h2 className="mt-1 text-lg font-semibold">{result.method}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{result.reason}</p>
        </div>
        <span className="rounded border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-xs text-primary">{result.version}</span>
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded bg-muted/50 p-2"><span className="block text-xs text-muted-foreground">Verdict</span><strong>{result.verdict}</strong></div>
        <div className="rounded bg-muted/50 p-2"><span className="block text-xs text-muted-foreground">Chart</span><strong>{result.event.houseSystem} · {result.event.zodiac}</strong></div>
        <div className="rounded bg-muted/50 p-2"><span className="block text-xs text-muted-foreground">Event UTC</span><strong className="font-mono text-xs">{result.event.eventUtcIso}</strong></div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Venue: {result.event.venueName} · Favorite source: {result.event.favoriteSource} · House engine: {result.event.houseEngine}</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="border-b border-border text-muted-foreground"><tr><th className="pb-2 pr-3">Role</th><th className="pb-2 pr-3">Team side</th><th className="pb-2 pr-3">Cusp</th><th className="pb-2 pr-3">Ruler</th><th className="pb-2 pr-3">Planet longitude</th><th className="pb-2">Motion</th></tr></thead>
          <tbody>{result.significators.map(row => <tr key={row.role} className="border-b border-border/60 last:border-0"><td className="py-2 pr-3 font-semibold">{row.role}</td><td className="py-2 pr-3">{sideName(row.side)}</td><td className="py-2 pr-3">H{row.cusp} · {row.cuspSign} {row.cuspLongitude.toFixed(2)}°</td><td className="py-2 pr-3">{row.ruler}{row.sharedRoles.length > 1 ? ` · shared ${row.sharedRoles.join("/")}` : ""}</td><td className="py-2 pr-3 font-mono">{row.planet.sign} {row.planet.degreeInSign.toFixed(2)}°</td><td className="py-2">{row.planet.speedDegreesPerDay.toFixed(3)}°/day {row.planet.retrograde ? "Rx" : "direct"}</td></tr>)}</tbody>
        </table>
      </div>

      {result.moon ? (
        <div className="mt-4 rounded border border-border bg-muted/20 p-3 text-sm">
          <strong>Frawley Moon completion</strong>
          <p className="mt-1 text-muted-foreground">Moon begins at {result.moon.startSign} {result.moon.startLongitude.toFixed(2)}°. {result.moon.finalCandidate ? `Final qualifying aspect: ${result.moon.finalCandidate.aspect}° to ${result.moon.finalCandidate.target} in ${result.moon.finalCandidate.minutesFromStart.toFixed(1)} minutes.` : "No qualifying final aspect before sign exit."}</p>
          <p className="mt-1 text-xs text-muted-foreground">Candidates: {result.moon.candidates.length} · Moon sign exit: {result.moon.signExitUtcIso ?? "not found"} · Conjunction stop: {result.moon.conjunctionStopUtcIso ?? "none"}</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
          <div className="rounded border border-border bg-muted/20 p-3"><strong>Side A completion link</strong><p className="mt-1 text-muted-foreground">{linkLabel(result.sideALink)}</p></div>
          <div className="rounded border border-border bg-muted/20 p-3"><strong>Side B completion link</strong><p className="mt-1 text-muted-foreground">{linkLabel(result.sideBLink)}</p></div>
          <div className="rounded border border-border bg-muted/20 p-3"><strong>Separations</strong><p className="mt-1 text-muted-foreground">{result.separations?.length ?? 0} Eesaphala/Musaripha records.</p></div>
          <div className="rounded border border-border bg-muted/20 p-3"><strong>Supporting yogas</strong><p className="mt-1 text-muted-foreground">{result.bridges?.length ?? 0} bridge(s), {result.kamboola?.length ?? 0} Kamboola catalyst(s), {result.grahaYuddha?.length ?? 0} Graha Yuddha record(s).</p></div>
        </div>
      )}

      {result.conflicts.length > 0 && <p className="mt-3 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-200"><strong>Conflict / no-call evidence:</strong> {result.conflicts.join(" ")}</p>}
      <details className="mt-4 text-xs"><summary className="cursor-pointer font-semibold text-primary">Show all 12 raw Placidus cusps</summary><div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">{result.cusps.map(cusp => <span key={cusp.house} className="rounded bg-muted/50 px-2 py-1">H{cusp.house}: {cusp.sign} {cusp.longitude.toFixed(2)}°</span>)}</div></details>
    </section>
  );
}

export default function SportsHorary() {
  const [favorite, setFavorite] = useState("");
  const [challenger, setChallenger] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventHour, setEventHour] = useState("");
  const [eventMinute, setEventMinute] = useState("");
  const [selectedCity, setSelectedCity] = useState("New York");
  const [sportsMethod, setSportsMethod] = useState<SportsMethod>("cluster");
  const [venueName, setVenueName] = useState("");
  const [venueLatitude, setVenueLatitude] = useState("");
  const [venueLongitude, setVenueLongitude] = useState("");
  const [favoriteSource, setFavoriteSource] = useState("");
  const [transitInput, setTransitInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [result, setResult] = useState<{
    verdict: Verdict;
    score: number;
    flags: string[];
    mapOrientation: "standard" | "inverse-180";
    layerVotes?: LayerVoteScorecard;
  } | null>(null);
  const [mapOrientation, setMapOrientation] = useState<"standard" | "inverse-180">("standard");
  const [eventMethodResult, setEventMethodResult] = useState<EventMethodResult | null>(null);
  const [isSpeakingAnswer, setIsSpeakingAnswer] = useState(false);
  const [calculatedChart, setCalculatedChart] = useState<any>(null);

  const calculateChart = trpc.ephemeris.calculate.useMutation({
    onSuccess: data => {
      // Store the full chart data for territorial control
      setCalculatedChart(data);

      // Use enriched text (with nakshatras, decans, fixed stars) if available, otherwise fall back to basic format
      const chartText = data.enrichedText || Object.entries(data.planets)
        .map(([planet, info]: [string, any]) => {
          const house = info.house ? `, ${info.house}th house` : "";
          const retrograde = info.retrograde ? " Rx" : "";
          return `${planet}: ${info.degree.toFixed(2)}° ${info.sign}${house}${retrograde}`;
        })
        .join("\n");
      setTransitInput(chartText);
    },
    onError: err => {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `Could not calculate chart: ${err.message}` },
      ]);
    },
  });

  const ask = trpc.sportsHorary.ask.useMutation({
    onSuccess: data => {
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
      setResult({
        verdict: data.verdict as Verdict,
        score: data.score,
        flags: data.flags,
        mapOrientation: "standard",
      });
    },
    onError: err => {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `The sky is clouded: ${err.message}` },
      ]);
    },
  });

  const askWithChart = trpc.sportsHorary.askWithChart.useMutation({
    onSuccess: data => {
      const tcReport = data.territorialControl?.fullReport ? `\n\n**TERRITORIAL CONTROL**\n${data.territorialControl.fullReport}` : "";
      setMessages(prev => [...prev, { role: "assistant", content: data.answer + tcReport }]);
      setResult({
        verdict: data.verdict as Verdict,
        score: data.score,
        flags: data.flags,
        mapOrientation: data.mapOrientation,
        layerVotes: data.layerVotes as LayerVoteScorecard | undefined,
      });
    },
    onError: err => {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `The sky is clouded: ${err.message}` },
      ]);
    },
  });

  const handleEventMethodSuccess = (data: { answer: string; result: EventMethodResult }) => {
    setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    setEventMethodResult(data.result);
    setResult(null);
  };

  const frawleyEvent = trpc.sportsHorary.frawleyEvent.useMutation({
    onSuccess: data => handleEventMethodSuccess(data as { answer: string; result: EventMethodResult }),
    onError: err => setMessages(prev => [...prev, { role: "assistant", content: `Frawley event chart could not run: ${err.message}` }]),
  });

  const tajikaPrasnaEvent = trpc.sportsHorary.tajikaPrasnaEvent.useMutation({
    onSuccess: data => handleEventMethodSuccess(data as { answer: string; result: EventMethodResult }),
    onError: err => setMessages(prev => [...prev, { role: "assistant", content: `Tajika/Prasna event chart could not run: ${err.message}` }]),
  });

  const handleCalculateChart = () => {
    if (!eventDate) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "I need the event date to calculate the chart." },
      ]);
      return;
    }

    try {
      const dateParts = eventDate.split("-");
      const year = parseInt(dateParts[0]) || new Date().getFullYear();
      const month = parseInt(dateParts[1]) || 1;
      const day = parseInt(dateParts[2]) || 1;

      // Parse time: default to noon if empty or invalid
      let hours = 12;
      let minutes = 0;
      let timeProvided = false;

      if (eventHour) {
        const h = parseInt(eventHour);
        if (!isNaN(h) && h >= 0 && h <= 23) {
          hours = h;
          timeProvided = true;
        }
      }

      if (eventMinute) {
        const m = parseInt(eventMinute);
        if (!isNaN(m) && m >= 0 && m <= 59) {
          minutes = m;
          timeProvided = true;
        }
      }

      if (!timeProvided) {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: `No event time provided — using noon as default. For better accuracy, enter the actual event time.`,
          },
        ]);
      }

      // Get coordinates
      const city = MAJOR_CITIES[selectedCity as keyof typeof MAJOR_CITIES];
      const coords = city || { lat: 40.7128, lon: -74.006 };

      const payload = {
        year,
        month,
        day,
        hour: hours,
        minute: minutes,
        latitude: coords.lat,
        longitude: coords.lon,
        altitude: 0,
      };
      calculateChart.mutate(payload);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Error with date/time. Try again." },
      ]);
    }
  };

  const buildStrictEventRecord = () => {
    const dateMatch = eventDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const year = dateMatch ? Number(dateMatch[1]) : Number.NaN;
    const month = dateMatch ? Number(dateMatch[2]) : Number.NaN;
    const day = dateMatch ? Number(dateMatch[3]) : Number.NaN;
    const hour = Number(eventHour);
    const minute = Number(eventMinute);
    const latitude = Number(venueLatitude);
    const longitude = Number(venueLongitude);
    const invalid = !eventHour.trim() || !eventMinute.trim() || !venueLatitude.trim() || !venueLongitude.trim()
      || !Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)
      || !Number.isInteger(hour) || hour < 0 || hour > 23
      || !Number.isInteger(minute) || minute < 0 || minute > 59
      || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
      || !favorite.trim() || !challenger.trim() || !venueName.trim() || favoriteSource.trim().length < 3;
    if (invalid) return null;
    return { year, month, day, hour, minute, latitude, longitude, venueName: venueName.trim(), favoriteName: favorite.trim(), challengerName: challenger.trim(), favoriteSource: favoriteSource.trim(), mapOrientation };
  };

  const handleSend = (content: string) => {
    const next: Message[] = [...messages, { role: "user", content }];
    if (sportsMethod !== "cluster") {
      const eventRecord = buildStrictEventRecord();
      if (!eventRecord) {
        setMessages([...next, {
          role: "assistant",
          content: "This method needs the exact local event date and time, both teams, exact venue name and coordinates, plus a saved pregame favorite source. It will not substitute noon or a city-center location.",
        }]);
        return;
      }
      setMessages(next);
      setResult(null);
      setEventMethodResult(null);
      const request = { question: content, ...eventRecord };
      if (sportsMethod === "frawley") frawleyEvent.mutate(request);
      else tajikaPrasnaEvent.mutate(request);
      return;
    }

    if (transitInput.trim().length < 10) {
      setMessages([...next, {
        role: "assistant",
        content: "I need the event-chart placements first — paste the sky at game time in the box above, then ask.",
      }]);
      return;
    }
    setMessages(next);
    setEventMethodResult(null);
    if (calculatedChart && calculatedChart.planets && calculatedChart.houses?.cusps) {
      askWithChart.mutate({
        question: content,
        planets: calculatedChart.planets.map((p: any) => {
          const degree = typeof p.degree === "number" ? p.degree : (typeof p.degreeInSign === "number" ? p.degreeInSign : 0);
          return { planet: p.name, degree, sign: p.sign, house: p.house || null, rx: p.retrograde || false, absolute: p.eclipticLon || null };
        }),
        houseCusps: calculatedChart.houses.cusps,
        favoriteName: favorite || undefined,
        challengerName: challenger || undefined,
        mapOrientation,
        history: messages.filter(m => m.role !== "system").map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      });
    } else {
      ask.mutate({
        question: content,
        transitPlacements: transitInput,
        favoriteName: favorite || undefined,
        challengerName: challenger || undefined,
        history: messages.filter(m => m.role !== "system").map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      });
    }
  };

  const handleListen = () => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find(m => m.role === "assistant");

    if (!lastAssistantMessage) return;

    if (isSpeakingAnswer) {
      stopSpeaking();
      setIsSpeakingAnswer(false);
    } else {
      speak(lastAssistantMessage.content, () => {
        setIsSpeakingAnswer(false);
      });
      setIsSpeakingAnswer(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-primary hover:opacity-70 transition">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "serif" }}>
            Sports Horary
          </h1>
          <div style={{ width: "120px" }} />
        </div>
        <p className="text-sm opacity-70 text-center mb-6">
          Choose a separately auditable event-chart method. No method is blended into another.
        </p>

        <Tabs value={sportsMethod} onValueChange={value => {
          setSportsMethod(value as SportsMethod);
          setResult(null);
          setEventMethodResult(null);
          setMessages([]);
        }} className="mb-5">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cluster">Cluster / Layer Vote</TabsTrigger>
            <TabsTrigger value="frawley">Frawley Event</TabsTrigger>
            <TabsTrigger value="tajika-prasna">Tajika / Prasna</TabsTrigger>
          </TabsList>
          <p className="mt-2 text-xs opacity-65">
            {sportsMethod === "cluster"
              ? "Current Cluster/Territorial model: each active layer makes its own choice and eligible choices are counted."
              : sportsMethod === "frawley"
                ? "Frawley event chart: real start and exact venue, Placidus houses, four significators, Moon completion, and no blended score."
                : "Tajika/Prasna event chart: real start and exact venue, Placidus houses, signed motion, direct completion yogas, and no blended score."}
          </p>
        </Tabs>

        <Tabs value={mapOrientation} onValueChange={value => {
          const next = value as "standard" | "inverse-180";
          setMapOrientation(next);
          setResult(null);
          setEventMethodResult(null);
          setMessages([]);
        }} className="mb-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="standard">Standard Map</TabsTrigger>
            <TabsTrigger value="inverse-180">180° Inverse Map</TabsTrigger>
          </TabsList>
          <p className="mt-2 text-xs opacity-65">
            {mapOrientation === "standard"
              ? "Primary event-chart calculation."
              : "Comparison layer: every event-chart longitude and cusp is rotated 180° together. It remains separate from the standard result."}
          </p>
        </Tabs>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            value={favorite}
            onChange={e => setFavorite(e.target.value)}
            placeholder="Favorite (H1)"
            className="rounded-lg border-2 border-border bg-card p-2 text-sm"
          />
          <input
            value={challenger}
            onChange={e => setChallenger(e.target.value)}
            placeholder="Challenger (H7)"
            className="rounded-lg border-2 border-border bg-card p-2 text-sm"
          />
        </div>

        {sportsMethod !== "cluster" && (
          <section className="mb-4 rounded-lg border border-primary/40 bg-primary/5 p-3">
            <h2 className="text-sm font-semibold">Verified event record required</h2>
            <p className="mt-1 text-xs text-muted-foreground">Frawley and Tajika/Prasna will not use a default time or city center. Enter the scheduled local venue time, the exact stadium coordinates, and the pregame source that identified the favorite.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <input value={venueName} onChange={event => setVenueName(event.target.value)} placeholder="Exact venue name" className="rounded-lg border-2 border-border bg-card p-2 text-sm sm:col-span-3" />
              <input type="number" step="any" value={venueLatitude} onChange={event => setVenueLatitude(event.target.value)} placeholder="Venue latitude" className="rounded-lg border-2 border-border bg-card p-2 text-sm" />
              <input type="number" step="any" value={venueLongitude} onChange={event => setVenueLongitude(event.target.value)} placeholder="Venue longitude" className="rounded-lg border-2 border-border bg-card p-2 text-sm" />
              <span className="rounded-lg border-2 border-dashed border-border p-2 text-xs text-muted-foreground">Both coordinates must be for the stadium, not the city center.</span>
            </div>
            <textarea value={favoriteSource} onChange={event => setFavoriteSource(event.target.value)} placeholder="Pregame favorite source, line, and capture note" className="mt-3 min-h-20 w-full rounded-lg border-2 border-border bg-card p-2 text-sm" />
          </section>
        )}

        <div className="grid grid-cols-4 gap-3 mb-3">
          <input
            type="date"
            value={eventDate}
            onChange={e => setEventDate(e.target.value)}
            placeholder="Event Date"
            className="rounded-lg border-2 border-border bg-card p-2 text-sm"
          />
          <input
            type="number"
            value={eventHour}
            onChange={e => setEventHour(e.target.value)}
            placeholder="Hour (0–23)"
            min="0"
            max="23"
            className="rounded-lg border-2 border-border bg-card p-2 text-sm"
          />
          <input
            type="number"
            value={eventMinute}
            onChange={e => setEventMinute(e.target.value)}
            placeholder="Minute"
            min="0"
            max="59"
            className="rounded-lg border-2 border-border bg-card p-2 text-sm"
          />
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="rounded-lg border-2 border-border bg-card p-2 text-sm"
          >
            {Object.keys(MAJOR_CITIES).map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {sportsMethod === "cluster" ? <>
          <button
            onClick={handleCalculateChart}
            disabled={calculateChart.isPending || !eventDate}
            className="w-full mb-4 rounded-lg bg-primary text-primary-foreground p-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {calculateChart.isPending ? "Calculating..." : "✦ Calculate Event Chart ✦"}
          </button>

          <textarea
          value={transitInput}
          onChange={e => setTransitInput(e.target.value)}
          placeholder={TRANSIT_PLACEHOLDER}
          style={{
            width: "100%",
            minHeight: "300px",
            padding: "16px",
            fontSize: "14px",
            fontFamily: "monospace",
            lineHeight: "1.8",
            background: "#1a1a1a",
            color: "#e0e0e0",
            border: "2px solid #d4af37",
            borderRadius: "8px",
            marginBottom: "16px",
            resize: "vertical",
          }}
          />
        </> : <p className="mb-4 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">The selected method calculates its own named Placidus event chart when you submit a question. The manual Cluster/Territorial placement box is intentionally excluded.</p>}

        {(result || eventMethodResult) && (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
              {(result?.mapOrientation ?? eventMethodResult?.orientation) === "inverse-180" ? "180° inverse-map comparison result" : "Standard-map result"}
            </p>
            {result && <VerdictBanner
              verdict={result.verdict}
              score={result.score}
              flags={result.flags}
              favorite={favorite}
              challenger={challenger}
              layerVotes={result.layerVotes}
            />}
            {result?.layerVotes && (
              <LayerVoteAudit
                scorecard={result.layerVotes}
                favorite={favorite}
                challenger={challenger}
              />
            )}
            {eventMethodResult && <EventMethodAudit result={eventMethodResult} />}
            {messages.some(m => m.role === "assistant") && (
              <button
                onClick={handleListen}
                className="w-full mb-4 rounded-lg border-2 border-primary bg-primary/10 text-primary p-2 text-sm font-medium hover:bg-primary/20 transition flex items-center justify-center gap-2"
              >
                {isSpeakingAnswer ? (
                  <>
                    <Square className="size-4" />
                    Stop listening
                  </>
                ) : (
                  <>
                    <Volume2 className="size-4" />
                    Listen to the reading
                  </>
                )}
              </button>
            )}
          </>
        )}

        <AIChatBox
          messages={messages}
          onSendMessage={handleSend}
          isLoading={ask.isPending || askWithChart.isPending || frawleyEvent.isPending || tajikaPrasnaEvent.isPending}
          height="520px"
          placeholder="Ask the oracle: who wins tonight?"
          emptyStateMessage="Enter the chart above, then ask who takes the contest."
          suggestedPrompts={[
            "Who wins this contest?",
            "Is this an upset or does the favorite hold?",
            "How close is it — blowout or nail-biter?",
          ]}
        />
      </div>
    </div>
  );
}
