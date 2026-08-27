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
| Reference frame | Astronomy Engine live geocentric equatorial right ascension and declination. |
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

## Inverse Audit and Validation

The inverse audit rotates the complete God axis by exactly 12 RA hours: God-ASC becomes 12h and God-DSC becomes 0h. It is logged as `god-axis-v1-inverse` beside the standard result. It does not swap teams, choose a preferred orientation, change a historical result, or feed a public synthesis verdict.

Before this becomes a live counted method, a frozen historical ledger must record: event UTC, standard God View result, inverse result, local Agent View mapping, every other method’s result, and final outcome. The sector ranges, eligible-body list, RA origin, declination-band labels, team mapping, and no-call rule cannot change within a holdout set. Any later revision receives a new version identifier and a new evaluation set.
