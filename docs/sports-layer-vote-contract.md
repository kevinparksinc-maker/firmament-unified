# Sports Layer-Vote Contract

## Purpose

The current experimental sports engine calculates a different point scale inside each layer. This contract preserves those **layer-native points**, but prevents a large total in one layer from silently overwhelming every other method inside one opaque final sum.

> Each eligible layer makes its own choice: Side A, Side B, tie, or abstain. The primary aggregate is the **number of eligible layer choices**, not a recalculated confidence percentage.

## Per-Layer Record

Every existing `LayerBreakdown` becomes an inspectable vote record.

| Field | Calculation | User-facing meaning |
|---|---|---|
| Layer | Existing layer identifier | The named technique making a choice |
| Side A points | Existing layer-native number | That layer’s evidence for Side A |
| Side B points | Existing layer-native number | That layer’s evidence for Side B |
| Difference | `Side A points − Side B points` | The layer’s directional separation |
| Choice | `A` if difference > 0; `B` if difference < 0 | The side selected by that layer |
| Status | `eligible`, `tie`, or `abstain` | Whether the layer enters the final count |
| Support magnitude | `abs(difference)` | Diagnostic strength within that layer’s own point scale; not cross-layer probability |
| Reason | Named comparison, for example `A 21.84 vs B −9.06` | Audit trail showing why the choice was made |

## Eligibility and Abstention

| Condition | Required result |
|---|---|
| Both side-point values are finite and their difference exceeds `0.001` | `eligible` vote for the leading side |
| The two values are equal within `0.001` | `tie`; does not vote for either side |
| A required input is absent, a layer signals incomplete data, or either value is non-finite | `abstain`; does not vote for either side |
| A chart-wide value is identical on both sides, such as a shared Moon-phase adjustment | `tie`; it remains visible but has no side choice |

The first implementation only derives votes from completed current layers. It does **not** assign an arbitrary “importance” multiplier to one layer merely because its internal point scale is larger.

## Aggregate Rule

| Aggregate field | Calculation |
|---|---|
| Side A votes | Count of eligible records choosing A |
| Side B votes | Count of eligible records choosing B |
| Ties | Count of tied records |
| Abstentions | Count of abstaining records |
| Aggregate outcome | A when A votes > B votes; B when B votes > A votes; `no call` when counts are equal or no eligible vote exists |
| Weighted-support diagnostic | Sum of per-layer support magnitudes by chosen side; shown only to explain a tied vote count, never used to break a tie in `layer-vote-v1` |

This implements the requested “who has the most at the end” as a **majority of named layer choices**. In the first version, a tied count stays `NO CALL`; a large territorial score cannot override five layers that chose the other side.

## Orientation Boundary

Standard and inverse-180 calculations each create an independent scorecard. The application must never pool their votes. Their agreement or disagreement is displayed as an audit fact:

| Standard result | Inverse result | Cross-orientation status |
|---|---|---|
| Same side | Same side | `agreement` |
| Different sides | Different sides | `orientation conflict — no combined call` |
| Either is no call | Any result | `incomplete comparison` |

## Output States

| State | Meaning |
|---|---|
| `SIDE A — experimental layer majority` | More eligible layers chose A |
| `SIDE B — experimental layer majority` | More eligible layers chose B |
| `NO CALL — layer tie` | Equal eligible layer choices |
| `NO CALL — insufficient layer evidence` | No eligible choices or required input missing |
| `ORIENTATION CONFLICT` | Standard and inverse scorecards choose different sides; no combined pick is produced |

The result remains an experimental chart signal. Vote share and support magnitude are not a win probability and must not be presented as a wagering recommendation.

## Verification Record

The Sports Horary route rendered its expected document structure in the temporary client preview after the scorecard integration. The browser console contained no application or calculation exception. It did report an existing development-only service-worker registration warning because the temporary Vite preview serves a missing `service-worker.js` request as HTML; this is unrelated to the layer-vote calculation or scorecard contract.
