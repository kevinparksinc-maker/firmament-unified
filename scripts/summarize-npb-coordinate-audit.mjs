import fs from "node:fs";

const inputPath = process.argv[2] ?? "/tmp/firmament-god-agent-npb-coordinate-audit.json";
const report = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const games = report.games;
const names = games[0].calculation.godPoints.map(point => point.planet);
const range = values => ({ min: Math.min(...values), max: Math.max(...values), span: Math.max(...values) - Math.min(...values) });
const godRa = Object.fromEntries(names.map((name, index) => [name, range(games.map(game => game.calculation.godPoints[index].geocentricRaHours))]));
const topocentricAltitude = Object.fromEntries(names.map((name, index) => [name, range(games.map(game => game.calculation.topocentricObservation.points[index].altitude))]));
const topocentricAzimuth = Object.fromEntries(names.map((name, index) => [name, range(games.map(game => game.calculation.topocentricObservation.points[index].azimuth))]));
const agentCuspSpan = Array.from({ length: 12 }, (_, index) => range(games.map(game => game.calculation.agentCusps[index].longitude)));
const godPolarityCounts = Object.fromEntries([...new Set(games.map(game => game.calculation.godPolarity))].map(value => [value, games.filter(game => game.calculation.godPolarity === value).length]));
const agentPolarityCounts = Object.fromEntries([...new Set(games.map(game => game.calculation.agentPolarity))].map(value => [value, games.filter(game => game.calculation.agentPolarity === value).length]));
const synthesisCounts = Object.fromEntries([...new Set(games.map(game => game.calculation.synthesisState))].map(value => [value, games.filter(game => game.calculation.synthesisState === value).length]));
console.log(JSON.stringify({ games: games.length, godPolarityCounts, agentPolarityCounts, synthesisCounts, godRa, agentCuspSpan, topocentricAltitude, topocentricAzimuth }, null, 2));
fs.writeFileSync("/tmp/firmament-god-agent-npb-coordinate-summary.json", JSON.stringify({ games: games.length, godPolarityCounts, agentPolarityCounts, synthesisCounts, godRa, agentCuspSpan, topocentricAltitude, topocentricAzimuth }, null, 2) + "\n");
