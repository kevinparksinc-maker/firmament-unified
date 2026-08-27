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

// Official MLB schedule record: gamePk 823096; 2026-08-26T20:10:00Z.
// This replay preserves the historical home/H1 assignment used in the prior
// Firmament regression. It does not use odds-based favorite assignment.
const eventChart = await callTrpc("ephemeris.calculate", {
  year: 2026,
  month: 8,
  day: 26,
  hour: 13,
  minute: 10,
  latitude: 47.6062,
  longitude: -122.3321,
  altitude: 0,
});

const baseInput = {
  question:
    "Software regression only for Philadelphia Phillies at Seattle Mariners. Report chart layers; do not present as betting advice.",
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
  favoriteName: "Seattle Mariners (home / H1 regression side)",
  challengerName: "Philadelphia Phillies (visitor / H7 regression side)",
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
        game: "Philadelphia Phillies at Seattle Mariners",
        mlbGamePk: 823096,
        localStart: "2026-08-26 1:10 PM America/Los_Angeles",
        utcStart: "2026-08-26T20:10:00Z",
        venue: "T-Mobile Park, Seattle, Washington",
        teamAssignment:
          "Historical regression convention: home Seattle = Favorite/Side A/H1; visiting Philadelphia = Challenger/Side B/H7",
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
