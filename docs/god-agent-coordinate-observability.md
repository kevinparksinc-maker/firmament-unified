# God–Agent Coordinate Observability Audit

## Purpose

This document makes the coordinate systems in `god-agent-family-flow-v1` inspectable across a historical event cohort. Its aim is to distinguish **changing numerical data** from a repeated final polarity category. It is not a ruleset amendment and does not add a stadium-local compass-coordinate score, alter the frozen God-axis sectors, or turn the output into a wagering recommendation.

## Current Calculation Boundaries

| View | Inputs accepted by its calculation | Coordinate frame / output | Included in current synthesis? |
|---|---|---|---|
| God View | UTC event instant only | Astronomy Engine `GeoVector` then `EquatorFromVector`; geocentric EQJ/J2000 right ascension and declination for Sun, Moon, Mercury, Venus, Mars, Jupiter, and Saturn; frozen ASC/DSC sector count | Yes |
| Agent View | Exact local civil time, verified UTC, stadium latitude/longitude | `circular-natal-horoscope-js@1.1.0` tropical Placidus cusps; live traditional-planet ecliptic longitudes assigned to local Placidus houses and ASC/DSC families | Yes |
| Stadium-local compass coordinates | Same UTC and stadium latitude/longitude, with altitude set to zero unless explicitly provided | Astronomy Engine local observer → topocentric equatorial RA/declination → azimuth and signed elevation via `Horizon` | **No — audit only** |

The God View deliberately has no observer input. Its result changes with the event instant but not with a stadium coordinate. The Agent View is local because its house cusps depend on event place, but its existing planet-longitude helper is geocentric ecliptic-of-date. The stadium-local compass values displayed in this audit are an additional observational coordinate set, not a replacement for either one.

## Presentation Boundary

Firmament presents the **Gleason/Zetetic Atlas** in its declared coordinate framework, with its own direct-angle, Equal-House, RA/declination projection, and local compass display. The Sports Horary screen does not restate or dilute that framework. It labels its separate stadium-local compass table by calculation provenance: an Astronomy Engine observer-coordinate reference calculated at the verified stadium and event instant.

> The two displays are named directly, are auditable, and are not treated as competing verdicts. Neither display is silently substituted for the other, and neither alters the frozen God–Agent decision rule.

## Frozen Outcome Rule

The active synthesis still permits `side-a-context` only when both God and Agent are ASC, permits `side-b-context` only when both are DSC, and returns `no-call` for a God tie, Agent tie, or cross-view conflict. Topocentric observations cannot change God counts, Agent family counts, strengths, the synthesis state, or the public outcome in this audit.

> A repeated DSC or ASC classification across nearby events does not prove the raw positions were the same. The audit must show the raw values, cusps, house assignments, and topocentric observations before any claim about a coarse or overly persistent category is considered.

## First Diagnostic Finding

The frozen August 22–26 NPB cohort initially appeared to return 20 DSC convergences, not 20 identical skies. A later audit found that the Agent classifier had incorrectly treated H2 and H8 as DSC despite their exclusion from both declared families. After correction, the cohort returns 18 DSC convergences and 2 neutral no-calls. It is still a five-day, time-clustered cohort; every God-side result is a sector-count classification at its own UTC instant, and every Agent-side result is a local Placidus-house-family classification at its own start time and venue.

## Measured NPB Variation

The enriched audit retained all 20 standard-orientation NPB calculations from August 22–26. The raw inputs varied materially. The corrected classifier produced 18 `dsc-convergence` records and 2 `neutral` no-calls:

| Coordinate evidence | Observed variation across the 20 games |
|---|---:|
| God Sun geocentric RA | 10.0611h–10.3164h, a 0.2553h span |
| God Moon geocentric RA | 17.3761h–20.9865h, a 3.6103h span |
| God Mercury geocentric RA | 9.7344h–10.2741h, a 0.5397h span |
| Agent Placidus H1 cusp | 239.9195°–328.8484° in the direct displayed range |
| Topocentric Sun altitude | 2.61°–66.16° |
| Topocentric Moon altitude | −32.69°–21.01° |
| Topocentric Saturn altitude | −50.18°–−24.68° |

The wide cusp ranges reflect different local event times and stadium longitudes/latitudes, with circular wraparound in some cusp columns. The stadium-local compass ranges also confirm that the planets were not in one identical local sky configuration. The corrected result is therefore a **persistent God-sector classification with local-Agent variation** finding: God remained DSC in this short window, while the correctly bounded Agent family count tied twice. It is not evidence that the ephemeris returned identical positions or that KP, Lots, or Nakshatra calculations failed.

The topocentric records remain observational only. Any future use of altitude, azimuth, or topocentric RA in directional synthesis must be introduced as a new, separately versioned method with its own predeclared sectors, tests, and historical holdout; it cannot be retrofitted into `god-axis-v1` or `god-agent-family-flow-v1` based on this cohort.

## Audit Artifact

The complete enriched machine-readable audit is saved as `/tmp/firmament-god-agent-npb-coordinate-audit.json` during validation. It retains the source-linked game record, raw God points, Agent cusps and receiving rows, topocentric observations, synthesis state, and post-calculation final outcome.

The source-linked cohort definition remains `data/historical/npb-2026-08-22-to-26-evaluation.json`; official NPB results and archived two-way prices remain distinct provenance fields.


## Live Interface Verification

A normal browser submission of the frozen Target Field record rendered the new **Stadium-local compass coordinates** section with the `unscored observation` label, alongside the existing God View, Agent View, Family Flow, and secondary-aspect audit. After the H2/H8 correction, the same submission retains God View `1 ASC / 1 DSC` (`tie`), Agent View `2 ASC-family / 2 DSC-family / 3 neutral` (`tie`), synthesis `neutral`, and public outcome `no-call`. The refreshed page showed no application exception in the rendered result path.
