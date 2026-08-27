# God View / Agent View Pole Contract

## Status and Scope

`god-axis-v1` is a **proposed, unvalidated** sports-analysis contract. It defines a fixed celestial polar frame only. It does not yet make an outcome prediction, and it must not be blended with the Cluster/Territorial, Frawley, Tajika/Prasna, Panchanga/Archetype, KP, or Atlas natal calculations.

The God View never receives a team name, favorite, challenger, venue, local horizon, local Ascendant, or final score. Its only question is:

> At a declared UTC instant, does the fixed celestial configuration support the God-ASC pole, the God-DSC pole, neither, or an even split?

The Agent View is a separate later translation. It may map the local event Ascendant and Descendant to a predeclared event-side assignment. It cannot alter the God View's geometry, data, or result.

## Frozen God Axis

| Contract field | `god-axis-v1` rule |
|---|---|
| Reference instant | Exact event UTC timestamp; the instant is necessary because planetary coordinates change. |
| Reference frame | Astronomy Engine live geocentric equatorial right ascension and declination in the fixed EQJ / J2000 reference frame. |
| Fixed origin | RA 0h, the declared God-ASC pole. This coordinate convention is frozen for the version. |
| Opposite pole | RA 12h, the declared God-DSC pole. |
| Pole separation | Exactly 12h / 180°. |
| Location dependency | None. No latitude, longitude, venue, local time zone, horizon, local cusps, or local house system belongs to God View. |
| Team dependency | None. God View never sees Team A, Team B, favorite, challenger, or outcome data. |

## Fixed RA / Declination Sectors

The God-ASC sector is the 6-hour RA arc centered on 0h. The God-DSC sector is its 180° counterpart, centered on 12h. The two remaining 6-hour quadrature corridors are neutral. Boundaries are neutral to avoid silently awarding a polarity at an exact edge.

| Fixed sector | Right ascension range | God View label | Directional eligibility |
|---|---|---|---|
| God-ASC pole | 21h ≤ RA < 24h, or 0h < RA < 3h | `god-asc` | One God-ASC evidence count |
| God-DSC pole | 9h < RA < 15h | `god-dsc` | One God-DSC evidence count |
| Eastern quadrature | 3h ≤ RA ≤ 9h | `quadrature` | Neutral; no directional count |
| Western quadrature | 15h ≤ RA ≤ 21h | `quadrature` | Neutral; no directional count |
| Exact axis boundary | RA = 0h, 3h, 9h, 12h, 15h, or 21h after numeric tolerance | `boundary` | Neutral / abstain; stored in audit |

Declination is recorded independently as a fixed spatial coordinate. It gives each qualifying body one of three descriptive bands: `north` (declination > +5°), `equatorial` (−5° to +5° inclusive), or `south` (declination < −5°). Declination does **not** change the ASC/DSC count in v1, because no prevalidated symmetric weighting rule has yet been chosen.

## Eligible Evidence and God-View Result

Only the seven traditional planets are directional evidence in `god-axis-v1`: Sun, Moon, Mercury, Venus, Mars, Jupiter, and Saturn. The lunar nodes and outer planets are retained as visible descriptive context but do not change the result. This restriction prevents slow outer-planet placements, derived node positions, or the axis markers themselves from silently dominating the result.

Each eligible body provides exactly one record: `god-asc`, `god-dsc`, `quadrature`, or `boundary`. No planet has a larger point weight. The result is a simple count, not a hidden blended total.

| Condition | God View result |
|---|---|
| God-ASC evidence count > God-DSC evidence count | `God-ASC polarity` |
| God-DSC evidence count > God-ASC evidence count | `God-DSC polarity` |
| Counts are equal and at least one body qualifies | `God View tie` |
| No eligible body qualifies | `God View abstain` |
| Missing or non-finite astronomical coordinate | `God View abstain` with input error |

The audit record must retain the UTC instant, engine/version, RA, declination, declination band, fixed sector, sector boundary distance, every included and excluded point, ASC count, DSC count, neutral count, and the final polarity/no-call reason.

## Separate Agent View Translation

Agent View operates only after God View has finalized. It receives real event location, local horizon/angles, local chart method, and the already-declared event-side mapping. It may translate God-pole language as follows:

| God View output | Agent View’s later translation when local ASC = Side A and local DSC = Side B |
|---|---|
| `God-ASC polarity` | Contextual support for the local ASC / Side A |
| `God-DSC polarity` | Contextual support for the local DSC / Side B |
| `God View tie` | No directional support; preserve tie |
| `God View abstain` | No directional support; preserve abstention |

If a different Agent View mapping is used, the mapping itself must be stored before calculation. It cannot modify the God View output. God View is therefore an ASC-versus-DSC signal, never a team-selection engine.

## God–Agent Family Flow Matrix

`god-agent-family-flow-v1` is an additional, separate overlay record. It treats God View and Agent View as different receiving fields for the same live event configuration; it does not treat one as a copy of the other or add their raw values into a winner score.

| Matrix direction | Source field | Receiving field | Recorded result |
|---|---|---|---|
| God → Agent | Fixed God RA/declination sector for every traditional planet | Local Agent Placidus house family | God-ASC, God-DSC, quadrature, or boundary sector; local ASC-family or DSC-family house; same-polarity and cross-polarity flow cells |
| Agent → God | Local Agent Placidus house family for every traditional planet | Fixed God RA sector | Local ASC-family or DSC-family house; God-ASC, God-DSC, quadrature, or boundary sector; same-polarity and cross-polarity flow cells |

The local Agent View uses the existing sports family partition, but labels it only as `agent-asc-family` and `agent-dsc-family` during this calculation:

| Local family | Placidus houses |
|---|---|
| Agent-ASC family | H1, H3, H6, H10, H11 |
| Agent-DSC family | H7, H9, H12, H4, H5 |

Every eligible traditional planet appears once in the matrix. A local family assignment is determined from the real local Placidus event chart. A God sector is determined from `god-axis-v1` and never from a local angle. The individual matrix cells remain visible; a cross-polarity entry does not become hidden support for either side.

The Agent polarity count is the number of eligible traditional planets falling into each local Agent family. God polarity remains its independently calculated RA-sector count. A synthesis result considers **direction first**, then labels magnitude only as a descriptive count margin.

| God polarity | Agent polarity | Synthesis state | Public outcome behavior |
|---|---|---|---|
| God-ASC | Agent-ASC | `asc-convergence` | ASC-pole convergence; later Agent mapping may supply contextual Side A meaning |
| God-DSC | Agent-DSC | `dsc-convergence` | DSC-pole convergence; later Agent mapping may supply contextual Side B meaning |
| God-ASC | Agent-DSC, or God-DSC | Agent-ASC | `cross-view-conflict` | No directional outcome; record the conflict for historical upset analysis |
| Tie or abstain in either view | Any | `neutral` | No directional outcome |

`strength` is never a pooled point total. It reports only each view's individual count margin: `weak` (1), `moderate` (2), `strong` (3), or `extreme` (4 or more). The synthesis preserves both margins and its agreement count; it does not sum them.

## Inverse Audit and Validation

The inverse audit rotates the complete God axis by exactly 12 RA hours: God-ASC becomes 12h and God-DSC becomes 0h. It is logged as `god-axis-v1-inverse` beside the standard result. Because the standard sector geometry is exactly symmetric, a non-neutral inverse God polarity is the mechanical polarity complement of the standard result. It is retained for traceability only, not treated as independent confirming evidence. It does not swap teams, choose a preferred orientation, change a historical result, or feed a public synthesis verdict.

Before this becomes a live counted method, a frozen historical ledger must record: event UTC, standard God View result, inverse result, local Agent View mapping, every other method’s result, and final outcome. The sector ranges, eligible-body list, RA origin, declination-band labels, team mapping, and no-call rule cannot change within a holdout set. Any later revision receives a new version identifier and a new evaluation set.

## Initial Frozen Historical Replay

The first replay uses Colorado Rockies at Minnesota Twins, MLB game 823689, scheduled for 2026-06-27 at 6:10 PM America/Chicago at Target Field. Minnesota was the recorded pregame favorite at −172 and Colorado the challenger at +144; Colorado later won 8–5. The final score is documentation for after-the-fact evaluation only and is not supplied to either calculation. [1] [2]

| Orientation | God View fixed-pole count | Agent View local-family count | Synthesis | Public method result |
|---|---|---|---|---|
| Standard | 1 God-ASC, 1 God-DSC, 5 neutral quadrature | 2 Agent-ASC family, 5 Agent-DSC family | `neutral` because God View ties | **No call** |
| Inverse God-axis audit | 1 God-ASC, 1 God-DSC, 5 neutral quadrature | 2 Agent-ASC family, 5 Agent-DSC family | `neutral` because God View ties | **No call** |

For standard orientation, Saturn is the only God-ASC-sector traditional planet (RA 0.9004h) and Venus the only God-DSC-sector traditional planet (RA 9.2943h). Saturn lands in local Agent H4 / DSC family, producing the `asc-to-dsc` matrix cell; Venus lands in local Agent H9 / DSC family, producing `dsc-to-dsc`. Sun, Moon, Mercury, Mars, and Jupiter are God quadrature records. The full reproducible request is `scripts/rerun-god-agent-rockies-twins.ts`.

This single replay shows the method's designed restraint: the Agent receiving field has a DSC-family concentration, but the fixed God-axis count ties, so synthesis abstains. One event is not an accuracy estimate and cannot establish whether ties, conflicts, or convergences are associated with upsets.

## Interface Verification

The Sports Horary interface exposes `God ↔ Agent Flow` as a fifth separately selectable method. Its tab renders the fixed God-ASC/God-DSC explanation, standard and inverse God-axis audit controls, exact venue input requirements for the separate local Agent receiver chart, and no manual Cluster placement field. The interface does not describe God View as receiving teams, venue coordinates, local houses, or a local horizon.

Using the frozen Target Field record through normal interface controls produced the standard `god-agent-family-flow-v1` audit panel. It displayed the 1–1 God-axis tie, 2–5 Agent family counts, all seven RA/declination-to-local-house rows, all six visible matrix cell totals, and `neutral` / **No call** synthesis. The God View table identifies Venus as `god-dsc` in local H9 and Saturn as `god-asc` in local H4; all other traditional planets are fixed-sector quadrature records for this event.

## References

[1] https://statsapi.mlb.com/api/v1.1/game/823689/feed/live "Official MLB game feed — event schedule, teams, venue, and result"

[2] https://www.fanduel.com/research/twins-vs-rockies-mlb-odds-prediction-point-spread-over-under-and-betting-trends-for-6-27-2026 "Contemporaneous matchup record — pregame moneyline"
