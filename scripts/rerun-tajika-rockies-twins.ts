async function callTrpc(path: string, input: unknown) {
  const response = await fetch(`http://localhost:3001/api/trpc/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ json: input }),
  });
  const body = await response.json();
  if (!response.ok || body.error) throw new Error(body.error?.json?.message ?? `HTTP ${response.status}`);
  return body.result.data.json;
}

const pregameRecord = {
  question: "Frozen historical Tajika/Prasna regression only. Return independent event-chart evidence; do not provide betting advice.",
  year: 2026,
  month: 6,
  day: 27,
  hour: 18,
  minute: 10,
  venueName: "Target Field",
  latitude: 44.982075,
  longitude: -93.278435,
  favoriteName: "Minnesota Twins",
  challengerName: "Colorado Rockies",
  favoriteSource: "FanDuel contemporaneous June 27, 2026 matchup preview: Minnesota -172; Colorado +144.",
};

const standard = await callTrpc("sportsHorary.tajikaPrasnaEvent", { ...pregameRecord, mapOrientation: "standard" });
const inverse = await callTrpc("sportsHorary.tajikaPrasnaEvent", { ...pregameRecord, mapOrientation: "inverse-180" });

console.log(JSON.stringify({
  provenance: {
    game: "Colorado Rockies at Minnesota Twins",
    mlbGamePk: 823689,
    localStart: "2026-06-27 6:10 PM America/Chicago",
    utcStart: "2026-06-27T23:10:00Z",
    observedResultForPostCalculationEvaluationOnly: "Colorado Rockies 8, Minnesota Twins 5",
  },
  standard: standard.result,
  inverse: inverse.result,
}, null, 2));
