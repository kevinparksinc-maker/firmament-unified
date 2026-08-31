# Tyson–Douglas Ancient-Horizon Seasonal-Radius Rerun

## Evaluation boundary

This is an **audit-only historical stress test** of the experimental dome path. The observed fight result is recorded after the calculation and is not supplied to the calculation procedure. This record is not a prediction, probability, wagering instruction, or empirical validation of the model.

## Frozen event input

| Field | Value |
|---|---|
| Event | Mike Tyson vs. James Buster Douglas |
| Local date | 1990-02-11 |
| Local time | 09:00 |
| Timezone | Asia/Tokyo |
| Venue | Tokyo Dome |
| Venue coordinates | 35.7056°, 139.7519° |
| Day of year | 42 |
| Post-calculation observed winner | James Buster Douglas, Side B |

The event instant follows the existing frozen Tyson–Douglas record, which states that the contemporary reconstruction reports Tyson entering the ring at 09:00 local Tokyo time and explicitly treats that as a calibration instant rather than an independently verified bell time.

## Declared model assumptions

The frozen historical record does not specify an observer radial distance from the dome center or Polaris. For this rerun, the value **4,000 miles** was used as a replaceable demonstration assumption and is displayed here so it cannot be mistaken for a sourced fact.

The new path also requires a local angular input. The rerun uses **139.7519°**, derived by the existing direct-axis bridge: UTC degrees at the frozen instant plus Tokyo Dome longitude, normalized to 0–360°. This is explicitly a bridge input; it is not represented as a conventional sidereal-time derivation.

| Parameter | Value |
|---|---:|
| Cancer radius | 1,600 miles |
| Capricorn radius | 2,900 miles |
| Equinoctial midpoint | 2,250 miles |
| Annual cycle | 365.25 days |
| Summer-solstice phase anchor | Day 172 |
| Observer radial distance | 4,000 miles, demonstration assumption |
| Local model angle | 139.7519°, direct-axis bridge |

## Full calculation chain

| Step | Output | Rule |
|---|---:|---|
| 1. Seasonal radius | 2,651.353732 miles | Midpoint − amplitude × cos(phase), phase anchored at day 172 |
| 2. Angular velocity | 12.729346°/hour | 15 × equinoctial radius ÷ seasonal radius |
| 3. Seasonal bearing offset | 50.574235° | ((observer distance − solar radius) ÷ (observer distance − Cancer radius)) × 90° |
| 4. Ancient-Horizon Ascendant | 212.834554° | atan2(cos(local angle), −(sin(offset) + cos(offset) × sin(local angle))) |
| 5. Relative apparent-size proxy | 0.848623× | Equinoctial radius ÷ seasonal radius |
| 6. Relative distance-intensity proxy | 0.720161× | Apparent-size proxy squared |
| 7. Daylight-boundary proxy | 50.574235° | Same seasonal bearing offset; not a sunrise/sunset clock time |

## Interpretation boundary

This rerun produces a **new Ascendant candidate at 212.834554°** for the declared assumptions. It does not by itself assign a winner because the existing Sports methods are intentionally separate and the new seasonal path currently returns no Side A/Side B score. Therefore, this rerun cannot honestly be described as resolving the prior Side A bias yet.

The next valid comparison is a sensitivity table over user-approved observer distances and local-angle derivations, followed by an explicitly separate house assignment and method rule. Until those inputs and rules are predeclared, changing them after seeing the Tyson result would be post-hoc calibration rather than a blind stress test.

## Provenance

The frozen event record and source links are in `data/historical/tyson-douglas-1990-02-11.json`. The implementation is in `server/domeSeasonalRadius.ts`, with regressions in `server/domeSeasonalRadius.test.ts`. The route and UI label this path `ancient-horizon-seasonal-radius-v1` and `audit-only`.
