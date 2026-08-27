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

// Frozen pregame inputs: MLB gamePk 823689, Rockies at Twins, June 27, 2026.
// The server interprets the supplied hour/minute as local civil time at the
// given venue coordinates and resolves America/Chicago / daylight saving time.
// The observed 8-5 Colorado result is never provided to the engine.
const eventChart = await callTrpc("ephemeris.calculate", {
  year: 2026,
  month: 6,
  day: 27,
  hour: 18,
  minute: 10,
  latitude: 44.982075,
  longitude: -93.278435,
  altitude: 0,
});

const baseInput = {
  question:
    "Frozen historical regression only for Colorado Rockies at Minnesota Twins. Report the independent layer choices and no-call behavior; do not provide betting advice.",
  planets: eventChart.planets.map((planet: any) => ({
    planet: planet.name,
    degree:
      typeof planet.degree === "number"
        ? planet.degree
        : planet.degreeInSign ?? 0,
    sign: planet.sign,
    house: planet.house ?? null,
    rx: planet.retrograde ?? false,
    absolute: planet.eclipticLon ?? null,
  })),
  houseCusps: eventChart.houses.cusps,
  favoriteName: "Minnesota Twins (home / pregame favorite / Side A)",
  challengerName: "Colorado Rockies (visitor / pregame underdog / Side B)",
  history: [],
};

const standard = await callTrpc("sportsHorary.askWithChart", {
  ...baseInput,
  mapOrientation: "standard",
});
const inverse = await callTrpc("sportsHorary.askWithChart", {
  ...baseInput,
  mapOrientation: "inverse-180",
});

console.log(
  JSON.stringify(
    {
      provenance: {
        game: "Colorado Rockies at Minnesota Twins",
        mlbGamePk: 823689,
        localStart: "2026-06-27 6:10 PM America/Chicago",
        utcStart: "2026-06-27T23:10:00Z",
        venue: "Target Field, Minneapolis, Minnesota",
        venueCoordinates: { latitude: 44.982075, longitude: -93.278435 },
        teamAssignment:
          "Minnesota home / pregame moneyline favorite = Side A; Colorado visitor / pregame underdog = Side B.",
        observedResultForPostCalculationEvaluationOnly: "Colorado Rockies 8, Minnesota Twins 5",
        chart: {
          planets: eventChart.planets.length,
          cusps: eventChart.houses.cusps.length,
        },
      },
      standard: {
        orientation: standard.mapOrientation,
        verdict: standard.verdict,
        margin: standard.score,
        layerVotes: standard.layerVotes,
        answer: standard.answer,
      },
      inverse: {
        orientation: inverse.mapOrientation,
        verdict: inverse.verdict,
        margin: inverse.score,
        layerVotes: inverse.layerVotes,
        answer: inverse.answer,
      },
    },
    null,
    2,
  ),
);
