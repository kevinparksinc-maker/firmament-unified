import { readFile } from "node:fs/promises";

type HistoricalRecord = {
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
};

type EphemerisPlanet = {
  name: string;
  degree?: number;
  degreeInSign?: number;
  sign: string;
  house?: number | null;
  retrograde?: boolean;
  eclipticLon?: number | null;
};

type EphemerisChart = {
  planets: EphemerisPlanet[];
  houses: { cusps: number[] };
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
) as HistoricalRecord;

const [year, month, day] = record.event.localDate.split("-").map(Number);
const [hour, minute] = record.event.localTime.split(":").map(Number);

// This is the one-time chart construction pass for a legacy/manual method.
// The two calls below receive only the constructed pre-event chart and the
// Side A/Side B labels. Outcome provenance is deliberately absent.
const eventChart = (await callTrpc("ephemeris.calculate", {
  year,
  month,
  day,
  hour,
  minute,
  latitude: record.event.latitude,
  longitude: record.event.longitude,
  altitude: 0,
})) as EphemerisChart;

if (!Array.isArray(eventChart.planets) || !Array.isArray(eventChart.houses?.cusps)) {
  throw new Error("Legacy chart construction did not return planets and house cusps.");
}

const legacyChartInput = {
  protocol: "tyson-douglas-legacy-cluster-input-v1",
  chartConstruction: {
    localDate: record.event.localDate,
    localTime: record.event.localTime,
    venue: record.event.venue,
    latitude: record.event.latitude,
    longitude: record.event.longitude,
    eventInstantBasis: record.event.eventInstantBasis,
    sourceProcedure: "ephemeris.calculate",
  },
  favoriteName: record.pregame.favorite,
  challengerName: record.pregame.underdog,
  favoriteSource: record.pregame.marketContext,
  planets: eventChart.planets.map((planet) => ({
    planet: planet.name,
    degree: typeof planet.degree === "number" ? planet.degree : planet.degreeInSign ?? 0,
    sign: planet.sign,
    house: planet.house ?? null,
    rx: planet.retrograde ?? false,
    absolute: planet.eclipticLon ?? null,
  })),
  houseCusps: eventChart.houses.cusps,
};

const request = {
  question:
    "Frozen historical Tyson–Douglas legacy Cluster audit. Return only the independently computed layer evidence and no-call behavior; do not provide betting advice.",
  planets: legacyChartInput.planets,
  houseCusps: legacyChartInput.houseCusps,
  favoriteName: legacyChartInput.favoriteName,
  challengerName: legacyChartInput.challengerName,
  history: [],
};

const [standard, inverseAudit] = await Promise.all([
  callTrpc("sportsHorary.askWithChart", { ...request, mapOrientation: "standard" }),
  callTrpc("sportsHorary.askWithChart", { ...request, mapOrientation: "inverse-180" }),
]);

console.log(
  JSON.stringify(
    {
      protocol: "tyson-douglas-legacy-cluster-probe-v1",
      input: legacyChartInput,
      standard: {
        orientation: standard.mapOrientation,
        verdict: standard.verdict,
        rawMarginDiagnostic: standard.score,
        layerVotes: standard.layerVotes,
        territorialControl: standard.territorialControl,
      },
      inverseAudit: {
        orientation: inverseAudit.mapOrientation,
        verdict: inverseAudit.verdict,
        rawMarginDiagnostic: inverseAudit.score,
        layerVotes: inverseAudit.layerVotes,
        territorialControl: inverseAudit.territorialControl,
      },
      boundary:
        "This legacy/manual Cluster result must remain separate from strict event-method ledger conclusions. The observed winner is not present in this request or output.",
    },
    null,
    2,
  ),
);
