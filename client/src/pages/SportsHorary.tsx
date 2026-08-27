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

export default function SportsHorary() {
  const [favorite, setFavorite] = useState("");
  const [challenger, setChallenger] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventHour, setEventHour] = useState("");
  const [eventMinute, setEventMinute] = useState("");
  const [selectedCity, setSelectedCity] = useState("New York");
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

  const handleSend = (content: string) => {
    if (transitInput.trim().length < 10) {
      setMessages(prev => [
        ...prev,
        { role: "user", content },
        {
          role: "assistant",
          content:
            "I need the event-chart placements first — paste the sky at game time in the box above, then ask.",
        },
      ]);
      return;
    }
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);

    // If we have a calculated chart, use the full territorial control analysis
    if (calculatedChart && calculatedChart.planets && calculatedChart.houses?.cusps) {
      askWithChart.mutate({
        question: content,
        planets: calculatedChart.planets.map((p: any) => {
          const degree = typeof p.degree === 'number' ? p.degree : (typeof p.degreeInSign === 'number' ? p.degreeInSign : 0);
          return {
            planet: p.name,
            degree: degree,
            sign: p.sign,
            house: p.house || null,
            rx: p.retrograde || false,
            absolute: p.eclipticLon || null,
          };
        }),
        houseCusps: calculatedChart.houses.cusps,
        favoriteName: favorite || undefined,
        challengerName: challenger || undefined,
        mapOrientation,
        history: messages
          .filter(m => m.role !== "system")
          .map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      });
    } else {
      // Fall back to text-based analysis
      ask.mutate({
        question: content,
        transitPlacements: transitInput,
        favoriteName: favorite || undefined,
        challengerName: challenger || undefined,
        history: messages
          .filter(m => m.role !== "system")
          .map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
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
          Ascendant (H1) = Favorite · Descendant (H7) = Challenger. The engine
          scores the chart; the oracle explains the call.
        </p>

        <Tabs value={mapOrientation} onValueChange={value => {
          const next = value as "standard" | "inverse-180";
          setMapOrientation(next);
          setResult(null);
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

        {result && (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
              {result.mapOrientation === "inverse-180" ? "180° inverse-map comparison result" : "Standard-map result"}
            </p>
            <VerdictBanner
              verdict={result.verdict}
              score={result.score}
              flags={result.flags}
              favorite={favorite}
              challenger={challenger}
              layerVotes={result.layerVotes}
            />
            {result.layerVotes && (
              <LayerVoteAudit
                scorecard={result.layerVotes}
                favorite={favorite}
                challenger={challenger}
              />
            )}
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
          isLoading={ask.isPending || askWithChart.isPending}
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
