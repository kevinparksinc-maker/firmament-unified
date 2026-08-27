# Sports Horary Active-Method Calculation Audit

## Scope

This audit reconciles the active Sports Horary method registry, public router procedures, and server engines. The purpose is to prevent a repeated result from one method from being misdiagnosed as a calculation error in another. It also records which techniques are intentionally excluded from each method.

## Independent Method Inventory

| Method | Live procedure / engine | Primary inputs | Planet and chart basis | KP / Lots / Nakshatras / fixed stars | Direction and abstention boundary |
|---|---|---|---|---|---|
| Cluster / Layer Vote | `sportsHorary.askWithChart` → legacy `masterPredictionEngine` → `layerVoteEngine` | Parsed or supplied chart placements, houses, lots, and other manual-chart fields | Legacy Cluster chart path; each named layer produces its own Side A, Side B, tie, or abstain vote; raw point values remain diagnostics | **Included in this legacy stack:** KP layer, Arabic Lots, Nakshatra/fixed-star helpers, dignity and cluster-knowledge layers, subject to the supplied chart’s completeness. | Majority of eligible named layer choices; manual result is visible but non-comparable to strict event protocols until a strict event adapter exists. Equal votes or no eligible votes produce no call. |
| Frawley Event | `sportsHorary.frawleyEvent` → `frawley-event-v1` | Verified local start, IANA-derived UTC, exact venue coordinates, teams, and pregame Favorite source | Live tropical Placidus event chart; traditional four significators L1/L10 versus L7/L4; Moon future-perfection timeline | **Excluded from the Frawley core:** KP, Lots, Nakshatras, fixed-star/dignity extensions not source-locked for this v1. | Final qualifying Moon completion to one side’s principal significator may produce an experimental side context; missing, shared, competing, or unresolved evidence produces no call. |
| Tajika / Prasna | `sportsHorary.tajikaPrasnaEvent` → `tajika-prasna-v1` | Same strict event record as Frawley | Live tropical Placidus chart; traditional seven planets; speed order, declared per-planet orbs, future Itthashala completion and separation evidence | **Excluded:** KP, Lots, Nakshatras as a core selector, Ashtakavarga, Kot Chakra, divisional charts, natal reference, and Atlas output. Nakta/Yamaya labels are Tajika bridge terminology, not Nakshatra mansion scoring. | Exactly one direct L1–L10 or L7–L4 completion link may produce experimental side context; both, neither, shared, competing, or incomplete evidence produces no call. |
| Panchanga / Archetype | `sportsHorary.panchangaArchetype` → `panchanga-archetype-v1` | Strict event record plus two user-documented, date-valid team style profiles | Live local-sunrise Vara, tropical Sun/Moon tithi, tropical Moon nakshatra coordinate, karana, and Nitya Yoga; profile compatibility table | **Included only here:** the declared tropical Moon nakshatra coordinate is displayed, while unmapped nakshatra nature classifications are explicitly not scored. KP, Lots, fixed stars, Cluster, and other method outputs are excluded. | Missing/stale/mismatched profiles or a score difference below 2.0 produce no call; a valid lead is experimental side context only. |
| God ↔ Agent Flow | `sportsHorary.godAgentFlow` → `god-axis-v1` + `god-agent-family-flow-v1` | God: UTC instant only. Agent: strict event record and venue coordinates | God: geocentric EQJ/J2000 RA/declination sector count for seven traditional planets. Agent: tropical Placidus local receiver houses and fixed ASC/DSC families. Topocentric altitude/azimuth is now exposed as audit observation only. | **Excluded from the directional calculation:** KP, Lots, Nakshatras, fixed stars, Cluster, Frawley, Tajika, Panchanga, and topocentric values. | God and Agent must agree on ASC or DSC for convergence; a God tie/abstention, Agent tie, or conflict produces no call. Inverse is a separate mechanical audit and cannot vote in the cross-method ledger. |

## God–Agent Coordinate Finding

The August 22–26 NPB audit contained 20 changing event records. The God Sun RA ranged from 10.0611h to 10.3164h, the God Moon RA ranged from 17.3761h to 20.9865h, and topocentric Sun altitude ranged from 2.61° to 66.16°. Agent Placidus cusps also changed substantially by venue and event time. Nevertheless, the coarse frozen classifications were DSC for God, DSC for Agent, and DSC convergence for all 20 records.

This is a **persistent classification** finding, not an identical-sky finding. It does not demonstrate an error in the separate KP, Lots, or Nakshatra paths, because none of those paths is an input to God–Agent Flow.

## Cross-Method Synthesis Boundary

The visible protocol ledger retains one latest result per method, exact-matches event UTC, venue, Favorite, and Challenger, excludes manual Cluster and inverse audits from strict comparison, and compares directional outcomes only. It never adds Cluster points, KP values, Lot values, Nakshatra values, Panchanga compatibility points, God counts, Agent counts, or topocentric angles.

| Condition | Ledger interpretation |
|---|---|
| Two or more matched strict methods select Side A | Side A convergence, experimental and non-probabilistic |
| Two or more matched strict methods select Side B | Side B convergence, experimental and non-probabilistic |
| Matched methods select different sides | Cross-method conflict; no conclusion |
| Matched methods are all ties/no-calls | No directional convergence; no conclusion |
| A single method is directional | Single-method result, not convergence |
| Any event key differs | Event-record mismatch; no conclusion |

> A no-call is an abstention or unresolved state. It is not silently converted into an underdog vote.

## Validation Status

The focused active-method suite passed 25 tests across God–Agent, Frawley, Tajika/Prasna, Panchanga, Layer Vote, sports regression, backtest metrics, and the cross-method ledger. The refreshed browser route rendered the protocol registry and the God–Agent result with God tie, Agent DSC, neutral synthesis, secondary unscored aspects, and topocentric unscored observations. No application exception appeared in the submitted result path.

The topocentric data is therefore an observability addition, not a retroactive change to `god-axis-v1` or `god-agent-family-flow-v1`. A future directional topocentric method would require a new version, predeclared sectors, a new synthesis rule, dedicated fixtures, and a time-diverse holdout.
