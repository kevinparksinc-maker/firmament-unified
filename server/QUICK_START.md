# Quick Start — Sports Horary Nakshatra Engine

## Run Tests

### Validate the Complete System
```bash
npx tsx server/test-core-system-final.ts
```
Expected output: **4/4 CORRECT**

### See All Details (Houses + Planets)
```bash
npx tsx server/test-nakshatra-full-breakdown.ts
```
Shows all 12 houses, all 12 planets, nakshatra traits, execution bonuses.

### Check Regression (Before/After)
```bash
npx tsx server/test-nakshatra-validation.ts
```
Shows score changes and confirms predictions remain stable.

---

## Use in Code

### Get a Prediction

```typescript
import { calculateChart } from "./ephemeris";
import { getNakshatraFromLongitude, calculateNakshatraModifier } from "./nakshatraData";
import { evaluateCluster } from "./houseClusterEngine";
import { SIGN_RULERS } from "./astroEngine";

const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
const location = { lat: 39.9526, lon: -75.1652, altitude: 0 };

const ephResult = await calculateChart(date, location);

const planets: Record<string, any> = {};
ephResult.planets.forEach((p) => {
  planets[p.name] = p;
});

// Get territorial control baseline
const cluster = evaluateCluster(planets, ephResult.houses, "Favorite", "Underdog");
let scoreA = cluster.sideAGrandTotal;
let scoreB = cluster.sideBGrandTotal;

// Add nakshatra modifiers for all 10 house lords
const ZODIAC = ["Aries", "Taurus", ..., "Pisces"];
const SIDE_A = [1, 3, 6, 10, 11];
const SIDE_B = [4, 5, 7, 9, 12];

let bonusA = 0, bonusB = 0;

for (let h = 1; h <= 12; h++) {
  const lon = ephResult.houses.cusps[h - 1];
  const sign = ZODIAC[Math.floor(lon / 30)];
  const lord = SIGN_RULERS[sign];
  const placement = planets[lord];
  
  if (!placement) continue;
  
  const nakshatra = getNakshatraFromLongitude(placement.siderealLon);
  const modifier = calculateNakshatraModifier(nakshatra);
  
  if (SIDE_A.includes(h)) bonusA += modifier;
  else if (SIDE_B.includes(h)) bonusB += modifier;
}

scoreA += bonusA;
scoreB += bonusB;

const winner = scoreA > scoreB ? "Favorite" : "Underdog";
const margin = Math.abs(scoreA - scoreB);
const confidence = margin > 2 ? "High" : margin > 1 ? "Medium" : "Low";
```

### Interpret Results

```
Score Margin     | Verdict
─────────────────┼──────────────
> 2 points       | Clear winner (high confidence)
1–2 points       | Modest advantage (medium confidence)
≤ 1 point        | Too close to call (low confidence)
```

---

## File Structure

```
server/
├── ephemeris.ts                              // Topocentric positions
├── astroEngine.ts                            // Sign rulers, dignities
├── houseClusterEngine.ts                     // House evaluation + territory
├── nakshatraData.ts                          // 27 nakshatras + traits
├── territorialControlEngine.ts               // Territory scoring (layer)
├── arabicLotsCalculator.ts                   // 8 lots (prepared, not integrated)
├── fixedStarsCoreList.ts                     // 8 stars (prepared, not integrated)
├── comprehensiveScoringEngine.ts             // Multi-layer aggregation
│
├── test-core-system-final.ts                 // ✓ MAIN VALIDATION TEST
├── test-nakshatra-full-breakdown.ts          // Show all details
├── test-nakshatra-validation.ts              // Regression check
├── test-lots-and-stars.ts                    // Foundation for layers 3–4
│
├── SPORTS_HORARY_NAKSHATRA_ENGINE.md         // Full documentation
└── HORARY_SCORING_RULES.md                   // Original spec (reference)
```

---

## System Guarantees

- ✓ Deterministic: Same input always produces same output
- ✓ Transparent: Every point is visible and traceable
- ✓ Validated: 4/4 real games correct (100% on validation set)
- ✓ Fast: O(1) calculation time
- ✓ Pure: No side effects, no global state

---

## Next: Add More Games

To expand the validation set, add to the `games` array in `test-core-system-final.ts`:

```typescript
{
  name: "Your Game",
  date: new Date(Date.UTC(2026, month, day, hour, min, 0)),
  location: { lat: xx.xxxx, lon: -yy.yyyy },
  favorite: "Home Team",
  underdog: "Away Team",
  actualWinner: "Actual Winner",
}
```

Then run: `npx tsx server/test-core-system-final.ts`

---

## Troubleshooting

**Q: Got different score for Brazil vs Argentina?**  
A: Check that you're using all 10 house lords (not just Moon/Mars). The test-core-system-final.ts is the canonical implementation.

**Q: Prediction flipped for a game I tested?**  
A: This indicates a margin < 2 points (too close to call). Confidence is low. Adding layers (lots, stars, retrograde) may resolve it, but only if properly weighted.

**Q: Want to add Arabic Lots?**  
A: They're ready in `arabicLotsCalculator.ts`. Follow the rules in `HORARY_SCORING_RULES.md` section 2 for weighting. Test each game as you add them.

---

## Support

All code is self-documenting with examples. Refer to:
- `SPORTS_HORARY_NAKSHATRA_ENGINE.md` for deep architecture
- `HORARY_SCORING_RULES.md` for complete rule specification
- Test files for concrete usage examples
