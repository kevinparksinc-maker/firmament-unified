# Sports Horary Simulation Evidence Display Contract

## Purpose

Every Sports Horary simulation must display its calculation path before, or alongside, its conclusion. A verdict without the input record, chart basis, evidence rows, and abstention rule is not treated as auditable. This contract controls **presentation of already calculated evidence**; it does not add a new directional rule or combine methods.

## Common Evidence Required for Every Method

| Evidence item | Display requirement |
|---|---|
| Event record | Side A/favorite, Side B/challenger, venue name, exact venue coordinates where required, local scheduled start, derived UTC, and cited pregame favorite source. |
| Chart basis | Zodiac, house system, chart engine, orientation, and method version. |
| Rule boundary | Explicit statement of the evidence that can affect the method and data that is context-only or excluded. |
| Conclusion | Direction, tie, conflict, or abstention stated before any strength/margin label. |
| No-call | Exact conflicts, missing evidence, or threshold failures retained—not replaced with an implied side. |

## Method-Specific Evidence

| Method | Evidence shown in the simulation | Scoring and conclusion boundary |
|---|---|---|
| Cluster / Layer Vote | Raw planet longitudes, exact Ascendant, the **Cluster Equal House** assignment for every placement, separately labelled ephemeris Whole Sign reference labels when available, per-layer A/B points, each layer’s independent A/B/tie/abstain choice, raw totals, and majority-of-eligible-votes scorecard. | Cluster/Territorial/KP/Lots use continuous 30° Equal Houses anchored at the supplied exact Ascendant. Ephemeris Whole Sign labels are reference-only and cannot enter Cluster scoring. The public result counts eligible layer choices; raw points are diagnostic only. Manual placements are not comparable to strict event-chart methods. |
| Frawley Event | All seven traditional event planets, all twelve Placidus cusps, L1/L10/L7/L4 significators, angular evidence, declared orb/search settings, every qualifying Moon candidate, final permitted Moon candidate, combustion/node supporting checks, and conflicts. | Only the permitted final Moon perfection to an unshared four-significator target produces a directional event result. Angular and supporting evidence remain visible without silently overriding that rule. |
| Tajika / Prasna | All seven traditional event planets, all twelve Placidus cusps, four significators, source/relative-house/orb settings, direct side links, all Itthashala/Muthashila and Eesaphala records, Nakta/Yamaya bridges, Kamboola, Graha Yuddha, and conflicts. | The predeclared Tajika link/conflict policy determines the result. Graha Yuddha is supporting context, not an undisclosed override. |
| Panchanga / Team Archetype | Exact sunrise and Vara, tropical Sun/Moon longitudes, tithi, nakshatra, karana, nitya yoga, coordinate convention, both team profiles, profile evidence notes/sources/dates, each compatibility row, totals, and profile/no-call failures. | Only current, source-backed user-entered profiles are eligible. Panchanga’s `calculated-tropical-not-scored` elements stay visible but cannot manufacture a result. |
| God ↔ Agent Flow | UTC-only God RA/declination table, local Placidus Agent houses/families, every family-flow cell, neutral H2/H8 rows, synthesis status, secondary major-aspect geometry, and stadium-local compass observations. | God axis, Agent family polarity, and direction-first synthesis remain separate. Secondary aspects and stadium-local compass values are explicit non-scoring observations. |
| Cross-method ledger | Method/version/orientation, normalized event-match status, each retained method outcome, and convergence/conflict/no-directional-convergence state. | It compares only matching strict standard runs. It never pools planetary values, layer scores, inverse audits, or manual Cluster results. |

## Implementation Boundary

The interface may reveal previously hidden **returned** calculations. It must not recalculate a second chart in the browser, add a new implicit scoring weight, use an observed result as input, or translate a method’s no-call into an underdog selection. Any new technique—such as a distinct topocentric directional rule—requires a separate version, source basis, tests, and historical holdout before it can enter a conclusion.

For the legacy Cluster route, the client displays the server-returned raw longitudes and derives an Equal House audit label only for inspection. The server remains the calculation authority: it independently reassigns every placement from the same raw longitude and supplied Ascendant before it computes Territorial, KP, Lots, or a layer vote. A Whole Sign label returned by the ephemeris may never be used as a fallback scored house in this route.

## Interface Verification Record

The live Frawley method renders the strict event-record gate before a calculation. It requires the named sides, exact venue and stadium coordinates, local date/time, and pregame favorite provenance; no event result is fabricated before submission.

The frozen Target Field replay rendered the expanded Frawley trace: the seven live tropical planets and their Placidus houses, all twelve cusps, L1/L10/L7/L4 rows, declared settings, the qualifying Moon-to-Venus trine, every four-significator/key-cusp angular relation, and the shared-Jupiter/shared-Mercury conflict record. Its outcome remained no-call because Venus was not a four-significator target and the assigned significators were shared across sides.

The same frozen record also rendered the expanded Tajika / Prasna trace: declared source and planet-orb settings, seven live planet/house rows, twelve cusps, four significators, empty direct-side links, the recorded Venus/Saturn Eesaphala separation, explicit absence of Nakta/Yamaya, Kamboola, and Graha Yuddha records, and the shared-significator no-call conflict. The cross-method ledger retained the matched Frawley and Tajika standard no-calls without pooling either method’s evidence.

The Panchanga / Team Archetype interface rendered the exact event record and both profile forms, including archetype, study window, effective/valid-through dates, evidence note, and sources. With no profiles entered, the method refused to compute a team-archetype conclusion and returned its precise profile-required no-call gate. It does not infer a team style from the final score or substitute a fictional study record.
