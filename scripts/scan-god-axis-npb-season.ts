import { calculateGodAxis } from "../server/godAgentFlowEngine";

const startUtc = Date.UTC(2026, 3, 1, 9, 0, 0); // April 1, 18:00 JST
const endUtc = Date.UTC(2026, 7, 26, 9, 0, 0); // August 26, 18:00 JST
const dayMs = 24 * 60 * 60 * 1000;
const days = [] as Array<{ eventUtcIso: string; polarity: string; counts: object }>;

for (let timestamp = startUtc; timestamp <= endUtc; timestamp += dayMs) {
  const result = calculateGodAxis(new Date(timestamp), "standard");
  days.push({ eventUtcIso: result.eventUtcIso, polarity: result.polarity, counts: result.counts });
}

const countBy = (values: readonly string[]) => values.reduce<Record<string, number>>((counts, value) => {
  counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  scope: "Exploratory calendar diagnostic only. It does not select a historical outcome cohort and must not be used to estimate predictive performance.",
  sampling: "One fixed 18:00 JST instant on every calendar day from April 1 through August 26, 2026.",
  summary: countBy(days.map(day => day.polarity)),
  noDirectionDays: days.filter(day => day.polarity === "tie" || day.polarity === "abstain"),
}, null, 2));
