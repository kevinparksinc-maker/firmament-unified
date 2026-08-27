import { readFile } from "node:fs/promises";

type FrozenRecord = {
  event: {
    sideA: string;
    sideB: string;
    localDate: string;
    localTime: string;
    venue: string;
    latitude: number;
    longitude: number;
    eventInstantBasis: string;
  };
  pregame: {
    favorite: string;
    underdog: string;
    marketContext: string;
  };
  outcomeProvenance: {
    winner: string;
    method: string;
  };
  sources: Array<{ label: string; url: string }>;
};

async function callTrpc(path: string, input: unknown) {
  const response = await fetch(`http://localhost:3001/api/trpc/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ json: input }),
  });
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.json?.message ?? `HTTP ${response.status}`);
  }
  return body.result.data.json;
}

const record = JSON.parse(
  await readFile(new URL("../data/historical/tyson-douglas-1990-02-11.json", import.meta.url), "utf8"),
) as FrozenRecord;

const [year, month, day] = record.event.localDate.split("-").map(Number);
const [hour, minute] = record.event.localTime.split(":").map(Number);

// The observed winner, knockout, and all post-fight facts remain outside this
// payload. The route receives only the frozen pre-event chart and favorite map.
const pregameRecord = {
  question: "Frozen historical Tyson–Douglas stress test. Return auditable method evidence only; do not provide betting advice.",
  year,
  month,
  day,
  hour,
  minute,
  venueName: record.event.venue,
  latitude: record.event.latitude,
  longitude: record.event.longitude,
  favoriteName: record.pregame.favorite,
  challengerName: record.pregame.underdog,
  favoriteSource: record.pregame.marketContext,
};

const [frawleyStandard, frawleyInverse, tajikaStandard, tajikaInverse, godAgentStandard, godAgentInverse] = await Promise.all([
  callTrpc("sportsHorary.frawleyEvent", { ...pregameRecord, mapOrientation: "standard" }),
  callTrpc("sportsHorary.frawleyEvent", { ...pregameRecord, mapOrientation: "inverse-180" }),
  callTrpc("sportsHorary.tajikaPrasnaEvent", { ...pregameRecord, mapOrientation: "standard" }),
  callTrpc("sportsHorary.tajikaPrasnaEvent", { ...pregameRecord, mapOrientation: "inverse-180" }),
  callTrpc("sportsHorary.godAgentFlow", { ...pregameRecord, mapOrientation: "standard" }),
  callTrpc("sportsHorary.godAgentFlow", { ...pregameRecord, mapOrientation: "inverse-180" }),
]);

console.log(JSON.stringify({
  protocol: "tyson-douglas-stress-test-v1",
  inputProvenance: {
    frozenEvent: record.event,
    pregame: record.pregame,
    sources: record.sources,
  },
  strictMethodResults: {
    frawleyEvent: { standard: frawleyStandard.result, inverseAudit: frawleyInverse.result },
    tajikaPrasna: { standard: tajikaStandard.result, inverseAudit: tajikaInverse.result },
    godAgentFlow: { standard: godAgentStandard.result, inverseAudit: godAgentInverse.result },
    panchangaArchetype: {
      status: "not-run",
      reason: "Historical Side A/Side B archetype profiles with study-window evidence and sources are not supplied; the profile gate must abstain rather than fabricate them.",
    },
    clusterLayerVote: {
      status: "not-run",
      reason: "No independently source-frozen manual legacy chart record was supplied. Cluster is not comparable to strict event methods without that separate input record.",
    },
  },
  outcomeProvenanceForPostCalculationEvaluationOnly: record.outcomeProvenance,
}, null, 2));
