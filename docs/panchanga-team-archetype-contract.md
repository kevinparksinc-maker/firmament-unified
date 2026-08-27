# Panchanga / Team Archetype Contract

**Method version:** `panchanga-archetype-v1`
**Status:** Active experimental method, separately selectable in Sports Horary
**Decision type:** Side A, Side B, or no call; never a probability or betting recommendation

## Purpose and Separation

This method compares two **user-documented team style profiles** with a real-time Panchanga record. It is an isolated ruleset. It never reads Cluster/Territorial points, Frawley testimony, Tajika/Prasna yogas, KP, Atlas, a seed number, an odds-derived score, or an inverse-map result. Side A is the documented pregame Favorite; Side B is the Challenger. The inverse-180 comparison is not available in this method because Panchanga timing derives from the event instant rather than chart-house rotation.

## Event Data and Coordinate Convention

The method requires the exact scheduled local start, named stadium, stadium coordinates, venue timezone, and a saved pregame Favorite source. Sun and Moon longitudes are live geocentric tropical ecliptic-of-date positions from the app’s existing Astronomy Engine path. The first release labels its nakshatra calculation **tropical**, rather than silently presenting it as a conventional sidereal Panchanga. A sidereal option cannot be added until its ayanamsa source, exact formula, and fixtures are separately specified.

| Element | v1 calculation | Result shown |
|---|---|---|
| Vara | Weekday of the most recent real local sunrise at the stadium | Sunday through Saturday and planetary ruler |
| Tithi | `normalize(Moon longitude − Sun longitude) ÷ 12°` | 1–30, exact elongation, Shukla/Krishna half |
| Nakshatra | `floor(Moon longitude ÷ 13°20′)` | One of 27 equal lunar mansions and exact fractional progress |
| Karana | `floor(normalize(Moon − Sun) ÷ 6°)` | Exact half-tithi and traditional recurring/fixed name |
| Nitya Yoga | `floor(normalize(Sun longitude + Moon longitude) ÷ 13°20′)` | One of 27 named yogas and exact fractional progress |

The Vara boundary is sunrise rather than midnight. The five elements and the equal division formulas are documented in Panchanga calculation references. [1] [2]

## Team Archetype Profile Contract

The method does not infer a team’s archetype from the current matchup, reputation, result, or odds. The user must study the team’s overall pregame play and supply two profiles. Every profile is frozen in the event result.

| Required field | Rule |
|---|---|
| Team name | Must correspond to the event-side team. |
| Primary archetype | One of Warrior, Intellectual, Merchant, or Laborer. |
| Optional secondary archetype | A distinct secondary style; it contributes half-weighted compatibility evidence. |
| Study window | A plain-language pregame period, for example “2026 regular season through June 26.” |
| Evidence note | At least 40 characters describing observed overall play. It must not cite the event outcome. |
| Sources | At least one pregame source URL or source citation. |
| Profile effective date and valid-through date | The event’s local date must fall inside this range. Otherwise the profile is stale or not yet active. |

A missing, expired, future-dated, mismatched, or unsupported profile produces a **no call**. It does not receive a default archetype.

## Provisional Compatibility Rules

The following rules reproduce the user-provided Chokoisky outline as an explicitly versioned, experimental compatibility table. The exact Panchanga values are calculated; the relationship claims are not presented as established predictive facts. Yoga and karana are displayed in v1 but have no result weight because a source-locked team-compatibility table was not included in the submitted rules.

| Archetype | Positive evidence | Negative evidence |
|---|---|---|
| Warrior | Sun or Mars Vara: +5; Ugra nakshatra if a future mapping is source-locked: +3 | Saturn Vara: −5 |
| Intellectual | Mercury or Jupiter Vara: +5 | Krishna Paksha: −4 |
| Merchant | Venus Vara: +6; Kshipra nakshatra if a future mapping is source-locked: +3 | Sun or Mars Vara: −4 |
| Laborer | Saturn Vara: +5; Krishna Paksha: +3; Fixed nakshatra if a future mapping is source-locked: +3 | None in the submitted rule table |

In `v1`, no nakshatra nature classification is used in scoring because the submitted material did not provide a source-locked mapping from all 27 nakshatras to Ugra, Kshipra, Mild, or Fixed. The result exposes that condition as **unmapped, not scored**. A team’s optional secondary archetype receives one half of its calculated primary-rule score.

## Decision and No-Call Rules

The engine calculates each side’s primary and optional secondary compatibility score, then compares the totals. A side must lead by at least **2.0 points** to issue the experimental Side A or Side B result. A smaller difference produces a no call. Bright/dark-moon “public psychology” is displayed but does not alter the result in v1, because the submitted `+1/−1` adjustment assumes a Favorite effect without a tested calibration.

| Condition | Required result |
|---|---|
| Missing or invalid event, venue, timezone, or Favorite source | No calculation; input error |
| Missing, stale, future, mismatched, or unsupported team profile | **No call** |
| Difference below 2.0 points | **No call** |
| Tied score | **No call** |
| Valid profile and lead of at least 2.0 points | Experimental Side A or Side B result with raw evidence only |

## Validation Requirements

The initial automated suite must verify exact tithi, nakshatra, karana, yoga, local-sunrise Vara, documented-profile rejection, close-score no-call, and a reproducible valid profile result. Historical evaluation must freeze team profiles before results are inspected and report this method separately from every other sports method.

## Initial Interface Verification

The Sports Horary method selector exposes Panchanga / Archetype as a fourth independent option. Selecting it removes the inverse-180 controls, requires exact stadium fields, and renders two separate overall-play research forms. A normal user submission with no team profiles was refused before calculation and explained that the app will not infer a style or use a missing profile. This behavior is intentional: a user must provide both documented pregame studies before the method can issue its experimental result.

A separate successful-path interface check used explicitly fictional, non-production team profiles. It rendered a live event record for the specified venue: calculated local-sunrise Vara, Sun–Moon elongation and tithi, tropical nakshatra, karana, yoga, the frozen profile study periods and evidence, both compatibility totals, and a 0.0-difference no-call. No real team was assigned an archetype during verification.

## References

[1] [Astrobix, “Calculation of a Panchanga”](https://astrobix.com/learn/99-calculation-of-a-panchanga.html) — describes five Panchanga elements, 27 nakshatras, 12° tithi division, 13°20′ yoga division, and karana as half a tithi.
[2] [Astrogle, “27 Yogas & 11 Karanas of Panchangam”](https://www.astrogle.com/astrology/27-yogas-11-karanas-panchangam.html) — corroborates the five elements and documents 27 yogas plus recurring and fixed karanas.
