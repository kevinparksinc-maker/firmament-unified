import { calculateChart } from "./ephemeris";
import { scoreClusterMatchup } from "./mlb-cluster-scorer";

async function score() {
  const timeET = "6:40 PM";
  const [time, period] = timeET.split(" ");
  let [hourStr, minStr] = time.split(":");
  let hour = parseInt(hourStr);
  const minute = parseInt(minStr);

  if (period === "PM" && hour !== 12) hour += 12;
  const utcHour = (hour + 4) % 24;

  const date = new Date(Date.UTC(2026, 6, 21, utcHour, minute, 0));

  const ephemerisResult = await calculateChart(date, {
    latitude: 39.9061,
    longitude: -75.1675,
    altitude: 0,
  });

  const breakdown = scoreClusterMatchup("A", "B", ephemerisResult.planets, ephemerisResult.houses, utcHour > 18 || utcHour < 6);

  console.log(`\nPhillies vs Dodgers — 6:40 PM ET, Philadelphia — 7/21/26\n`);
  console.log(`Ascendant:   ${breakdown.ascendantCluster.totalScore.toFixed(2)}`);
  console.log(`Descendant:  ${breakdown.descendantCluster.totalScore.toFixed(2)}\n`);
}

score().catch(console.error);
