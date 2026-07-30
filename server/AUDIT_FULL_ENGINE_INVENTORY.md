# Full Engine Audit — Inventory & Call Path Analysis

**Purpose:** Complete audit of what scoring layers exist, whether they're implemented, whether they're actually being called in the test suite, and what the real formula is.

---

## Part 1: Scoring Layers — Implementation Status

### Core Layers (Dignity, Placement, Aspects)

| Layer | File | Function | Implemented? | Status |
|-------|------|----------|--------------|--------|
| House Strength / Dignity & Placement | `houseClusterEngine.ts` | `evaluateHouse()` | ✓ Yes | Core logic for scoring planet in house |
| Aspects (applying/separating, major aspects) | `patternEngine.ts` + `aspectMotion.ts` | `findAspects()`, `classifyMotion()` | ✓ Yes | Detects aspects, applies/separating classification |
| Retrograde planets | `houseClusterEngine.ts` | Line 224: checks `lordPlacement.rx` | ✓ Yes | Adds `CONDITION_PENALTIES.RETROGRADE` to score |

### Territorial Control Layer

| Layer | File | Function | Implemented? | Status |
|-------|------|----------|--------------|--------|
| Territorial Control (cluster ownership) | `territorialControlEngine.ts` | `calculateTerritorialControl()` | ✓ Yes | Scores lords in own/opponent clusters |
| Nakshatra Territorial Modifier | `territorialControlEngine.ts` + `nakshatraData.ts` | `calculateNakshatraModifier()` | ✓ Yes | Applies multiplier from execution traits |

### Arabic Lots

| Lot | File | Function | Implemented? | Status |
|-----|------|----------|--------------|--------|
| Part of Fortune | `arabicLotsCalculator.ts` | `calculatePartOfFortune()` | ✓ Yes | Calculated from ASC/Sun/Moon |
| Part of Spirit | `arabicLotsCalculator.ts` | `calculatePartOfSpirit()` | ✓ Yes | Calculated from ASC/Moon/Sun |
| Other Lots (Victory, Success, Courage, Triumph, Glory, Nemesis) | `arabicLotsCalculator.ts` | Various functions | ✓ Yes | All implemented |

### Fixed Stars

| Layer | File | Function | Implemented? | Status |
|-------|------|----------|--------------|--------|
| Fixed Star conjunctions | `fixedStars.ts` | `getNearestFixedStar()` | ✓ Yes | Detects Regulus, Spica, Algol, Sirius, etc. |
| Fixed Star scoring (overrides) | `sportsHorary.ts` (old) | Referenced in comments | ? Partial | Documented but unclear if fully integrated |

### Moon & Void of Course

| Layer | File | Function | Implemented? | Status |
|-------|------|----------|--------------|--------|
| Moon phase | `ephemeris.ts` | Returns phase in planet data | ✓ Yes | Waxing/waning calculated |
| Void of Course Moon | `sportsHorary.ts` + `sportsHoraryV2.ts` | `detectVOCMoon()` | ✓ Yes | Detects VOC based on sign/house rules |

### Nakshatra Behavioral Layer (Descriptive)

| Layer | File | Function | Implemented? | Status |
|-------|------|----------|--------------|--------|
| Nakshatra profiles (27 nakshatras, 8 traits) | `nakshatraData.ts` | `NAKSHATRAS` constant | ✓ Yes | All 27 defined with Pace/Style/Temperament/4 traits |
| Nakshatra lookup | `nakshatra.ts` | `getNakshatraAt()` | ✓ Yes | Gets nakshatra from longitude |
| Behavioral narrative (House-pair matchups, pre-registration) | `NAKSHATRA_BEHAVIORAL_FRAMEWORK_V2.md` | Documentation only | ✗ No code | Documented but not implemented as code |

### "Seven Secrets" / Master Rulebook (sportsHorary.ts)

| Rule | File | Function | Implemented? | Status |
|------|------|----------|--------------|--------|
| Combustion (lord in Sun's orb) | `houseScoringConstants.ts` | `COMBUSTION_ORBS` defined | ✓ Partial | Defined but only used in `houseClusterEngine.ts` |
| Cazimi (lord exact conjunct Sun) | `sportsHorary.ts` | Referenced in comments | ? Unclear | Mentioned but integration unclear |
| Mutual Reception (lords exchange signs/exaltation) | `sportsHorary.ts` | `l1l7MutualReception` flag | ✓ Partial | Detected but scoring unclear |
| Translation of Light | `sportsHorary.ts` | Not found in current code | ✗ No | Documented in old notes, not implemented |
| Besiegement (lord between malefics) | `sportsHorary.ts` | `besieged` flag in planet data | ? Unclear | Present in data structure, unclear if scored |
| Via Combusta | `sportsHorary.ts` | Not found in current code | ✗ No | Documented but not implemented |

---

## Part 2: Integration & Call Path

### What the Last 4 Test Runs Actually Called

**Germany vs Paraguay (test-germany-paraguay.ts):**
```
calculateChart() → evaluateCluster() → 
  [evaluateHouse() for each 10 houses] +
  [calculateTerritorialControl() with nakshatra modifier] +
  [formatClusterReport()]
```
- Dignity/Placement: ✓ Called
- Territorial + Nakshatra Modifier: ✓ Called
- Lots: ✗ NOT called
- Fixed Stars: ✗ NOT called
- Aspects: ✗ NOT called (only in formatClusterReport as text, not in scoring)

**Roland-Garros (test-tennis-blind-batch.ts):**
```
calculateChart() → analyzeAthleteCluster() →
  [getNakshatraAt() for each house] +
  [calculateNakshatraModifier()] +
  Manual strength scoring (no cluster engine)
```
- Dignity/Placement: ✗ NOT called (manual scoring of Initiative/PR/Finishing only)
- Territorial: ✗ NOT called
- Nakshatra Modifier: ✓ Called (indirectly via profile lookup)
- Lots: ✗ NOT called
- Fixed Stars: ✗ NOT called
- Aspects: ✗ NOT called

**Wimbledon (test-tennis-blind-batch.ts):**
Same as Roland-Garros — custom cluster analysis, no `houseClusterEngine.ts`, no dignity/territorial scoring.

**Doha (test-doha-blind.ts):**
Same as Roland-Garros/Wimbledon — custom cluster analysis only.

---

### Critical Finding: Two Different Code Paths

**Path A (Team Sports — Germany/Paraguay):**
```
evaluateCluster() [in houseClusterEngine.ts]
  ├─ For each house: evaluateHouse()
  │   ├─ SIGN_RULERS + EXALTATIONS + DEBILITATIONS (dignity)
  │   ├─ Combustion check (retrograde penalty)
  │   ├─ Placement bonus (angular/succedent/cadent)
  │   └─ Aspects (benefic/malefic conjunctions, trines, squares)
  └─ calculateTerritorialControl()
      ├─ Base territorial points (own/opponent cluster)
      └─ getNakshatraAt() + calculateNakshatraModifier()

Final score = sideATotal + sideATerritorial (dignity + territorial)
```

**Path B (Individual Sports — Tennis):**
```
test-tennis-blind-batch.ts [custom implementation]
  ├─ calculateChart()
  ├─ getNakshatraAt() for each house
  ├─ Manual score: (Init + PR + Fin) × modifier
  └─ Sum across 5 houses

Final score = sum of house strengths (nakshatra profiles only, no dignity/territorial)
```

**Path C (Would-be Complete Path — Not Currently Used):**
- Intended: Dignity + Placement + Territorial + Lots + Fixed Stars + Aspects + VOC Moon + Nakshatra
- Actually used: Dignity only (team sports) or Nakshatra profiles only (tennis)

---

## Part 3: Actual Final Formula (Reverse-Engineered)

### Team Sports (Germany/Paraguay) — What Actually Contributes

```
Final Confidence = based on:
  1. Dignity/Placement score (25–40% of margin)
  2. Territorial Control (with nakshatra modifier) (25–40% of margin)
  3. Margin → Confidence mapping (50 + margin × 5, capped at 95)
  4. TOO_CLOSE_TO_CALL_MARGIN = 2 points
```

**Layers that DON'T contribute:**
- Arabic Lots (implemented but not called)
- Fixed Stars (implemented but not called in recent tests)
- Aspects beyond the basic benefic/malefic check in houseClusterEngine
- Moon phase / VOC (implemented but not scored in recent tests)
- Nakshatra behavioral narratives (documented but not coded)

### Tennis (Roland-Garros, Wimbledon, Doha) — What Actually Contributes

```
Final Prediction = based on:
  1. Per-house nakshatra profile strength
     = (Initiative score + PR score + Finishing score) × nakshatra_modifier
  2. Sum across 5 houses per athlete
  3. Margin → Winner + Confidence mapping (85% if margin > 7, 62% if margin 1-2, etc.)
```

**Layers that DON'T contribute:**
- Dignity (sign/exaltation/detriment)
- Placement (angular/succedent/cadent bonuses)
- Territorial (cluster ownership)
- Arabic Lots
- Fixed Stars
- Aspects
- Moon phase / VOC
- Combustion / Cazimi / Mutual Reception / Besiegement
- Behavioral narratives

---

## Part 4: Inconsistencies & Gaps

### Major Gap: Territorial Control Not Used in Tennis

The full cluster model (Part 1 rebuild) was never implemented for tennis. The tennis tests use a manual 5-house strength calculation but **completely skip the territorial control engine**, which is the layer that distinguishes "lords in own cluster" from "lords in opponent cluster."

**Impact:** In Roland-Garros and Doha, Sinner and Mensik's/Cerundolo's house lord *placements* (which house each lord actually occupies) aren't scored at all. Only their nakshatras' trait profiles are scored.

This is a major omission. The territorial layer might have caught Sinner's vulnerability in Roland-Garros (if H6 lord or other lords were sitting in weak houses). But we never ran that analysis.

### Major Gap: Lots & Fixed Stars Implemented But Never Called

- `arabicLotsCalculator.ts` is fully implemented (Part of Fortune, Spirit, Victory, Success, etc.)
- `fixedStars.ts` is fully implemented (Regulus conjunctions flagged as overrides in original rulebook)
- **Neither is called in any recent test.**

The Germany/Paraguay prediction used only Dignity + Territorial. It didn't include Lots or Fixed Stars, even though they're in the codebase and the original `sportsHorary.ts` rulebook mentions them.

### Major Gap: Aspects Score Benefic/Malefic But Not Aspects Themselves

The `houseClusterEngine.ts` checks for benefic/malefic aspects to the lord (line 247–290), but doesn't score the *nature* of the aspect (conjunction better than opposition, trine better than square, etc.). It's boolean: "is there a benefic aspect yes/no" rather than "score +2 for trine, +1 for sextile, -1 for square, -2 for opposition."

### Major Gap: Moon Phase & VOC Detected But Not Scored

Both are calculated (VOC detected in `sportsHoraryV2.ts`, moon phase in `ephemeris.ts`), but neither contributes to the final score in the recent tests.

---

## Part 5: What's Missing from the "Full Stack"

If all layers were implemented and called, the formula would be:

```
Final Score = 
  Dignity & Placement (house/sign/exaltation/detriment/placement bonuses)
  + Territorial Control (cluster ownership + nakshatra modifier)
  + Lots (Part of Fortune, Spirit, Victory, etc. — if near lords or angles)
  + Fixed Stars (Regulus conjunctions override lower scores)
  + Aspects (benefic/malefic weighted by aspect type and applying/separating)
  + Moon Phase (waxing = growth, waning = decline)
  + VOC Moon (void = stall, movement = momentum)
  + Retrograde penalties (already in dignity calculation)
```

**Current actual formula (team sports):**
```
Dignity & Placement + Territorial Control (+ nakshatra modifier)
```

**Current actual formula (tennis):**
```
Nakshatra profile strength (Initiative + PR + Finishing) × modifier, per house
```

The tennis formula is missing dignity entirely (whether the lord is in its own sign, exalted, debilitated, etc.), which is a major structural omission.

---

## Verdict

**Three separate scoring paths are in the codebase:**
1. **Old path:** `sportsHorary.ts` — comprehensive rulebook (Lots, Stars, VOC, mutual reception, etc.), but unclear if fully integrated
2. **Current team path:** `houseClusterEngine.ts` → dignity + territorial + nakshatra modifier only
3. **Current tennis path:** Manual cluster analysis → nakshatra profiles only, no dignity/territorial

**The tennis tests were not running the full 5-house cluster model.** They were running a partial model that scored nakshatras but ignored:
- Dignity (sign/exaltation)
- Placement bonuses (angular/succedent/cadent)
- Territorial control (cluster ownership)
- Lots, Stars, Aspects, Moon phase, VOC, Combustion, etc.

This explains why Doha called the right upset but with incomplete mechanism (predicted "straight sets," got 3 sets) — the system was scoring nakshatra profiles beautifully but missing the house-placement context that would have shown whether those profiles were in strong or weak houses.

---

## Recommendation Before Next Tests

**Before running more tests, decide:**

1. **Should tennis use the full cluster model** (like team sports), including dignity + placement + territorial? If yes, rebuild `test-tennis-blind-batch.ts` to call `houseClusterEngine.ts` adapted for individual athletes.

2. **Should team sports re-include Lots & Fixed Stars?** If yes, add them back to `evaluateCluster()` and re-score Germany/Paraguay/etc.

3. **Should all sports use the complete formula** (Dignity + Territorial + Lots + Stars + Aspects + VOC + Moon Phase)? If yes, that's a major rebuild.

Current state: The system works (Doha proves it), but it's working on partial information. That's worth documenting before scaling to more tests.
