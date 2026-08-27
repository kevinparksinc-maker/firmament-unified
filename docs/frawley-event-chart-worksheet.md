# Frawley Event-Chart Worksheet: App Specification

## Purpose and Scope

This worksheet specifies a **no-seed, real-event** sports module for Firmament. It is an implementation plan for a named `frawley-event-v1` ruleset, separate from the current five-house cluster model, Atlas, KP, Tajika, and the 180° inverse comparison.

> The chart is cast for the actual contest start at the actual venue. It does not use a chosen horary number.

An accessible Frawley-method outline describes an event chart at the contest start, Placidus houses, Favorite as the First House side, Opponent as the Seventh House side, and the First/Tenth and Seventh/Fourth lords as the four principal significators.[1] Frawley’s own book page says *Sports Astrology* presents analysis of more than sixty charts, across several sports and methods.[2]

The available public outline is detailed but not a complete primary-text implementation manual. Therefore, this specification deliberately makes every unresolved orb or doctrinal choice a **visible, versioned setting**. The app must never disguise a convenience default as a quotation from Frawley.

## 0. Freeze the Pre-Game Record

The worksheet cannot run until the user verifies and saves this event record before play begins.

| Field | Required value | Validation / display |
|---|---|---|
| Contest | Sport, competition, season, provider event ID | Immutable identifier |
| Teams | Home team and Away team | Names and provider IDs |
| Start moment | Official scheduled local start, IANA timezone, converted UTC | Both times shown; source and capture timestamp retained |
| Venue | Venue name, latitude, longitude, country | Source retained; no geocoding guess without confirmation |
| Side assignment | Favorite → Side A / House 1; Opponent → Side B / House 7 | Favorite source and timestamp required; home/away is recorded separately |
| Rule version | `frawley-event-v1` plus ephemeris, house-engine, and threshold versions | Frozen calculation hash |

If Favorite status, start moment, timezone, venue, or any cusp cannot be verified, stop with **`NO CALL — incomplete event record`**.

## 1. Cast the Event Chart

The engine converts the saved local event time to UTC, calculates the declared planetary positions at that UTC instant, and calculates a **Placidus** chart at the venue coordinates. This is a separate calculator from Atlas, which uses a direct-angle Equal-House model.

| Output | Required calculation evidence |
|---|---|
| Zodiac and ephemeris | Named zodiac convention, ephemeris source/version, coordinate frame, and UTC instant |
| Houses | `Placidus`; numerical longitudes for H1 through H12; Ascendant, Descendant, MC, and IC |
| Planets | Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn: longitude, sign/degree, signed longitudinal speed, and retrograde flag |
| Supplementary points | Lunar nodes and Part of Fortune only in their named optional modules; outer-planet signals only in their named optional modules |

The calculation record must retain **raw longitudes**, not just sign labels. Any difference between a raw longitude, cusp, and derived house is therefore reproducible.

## 2. Establish the Sides and Four Principal Significators

Use traditional rulerships only:

| Cusp sign | Traditional ruler |
|---|---|
| Aries / Scorpio | Mars |
| Taurus / Libra | Venus |
| Gemini / Virgo | Mercury |
| Cancer | Moon |
| Leo | Sun |
| Sagittarius / Pisces | Jupiter |
| Capricorn / Aquarius | Saturn |

The worksheet resolves these rows from the exact Placidus cusp signs:

| Role | Derivation | Side |
|---|---|---|
| L1 | Traditional ruler of the H1 cusp sign | Side A / Favorite |
| L10 | Traditional ruler of the H10 cusp sign | Side A / Favorite success |
| L7 | Traditional ruler of the H7 cusp sign | Side B / Opponent |
| L4 | Traditional ruler of the H4 cusp sign | Side B / Opponent success |

If a single planet rules two rows, retain both rows. Do not count it twice as two independent pieces of testimony; show that it is a shared significator.

## 3. Calculate Angular-Cusp Evidence

For every principal significator, calculate its relationship to all four key cusps: H1, H4, H7, and H10.

```text
separation(planet, cusp) = absolute shortest arc between 0° and 180°
antiscion(longitude)     = normalize(180° − longitude)
```

| Field in each worksheet row | Required result |
|---|---|
| Planet position | Raw longitude and sign/degree |
| Cusp position | Raw longitude, cusp number, sign/degree |
| Exact separation | Decimal degrees and degrees/minutes |
| Relation | `on cusp`, `inside house`, `outside/previous house`, `not angular` |
| Motion state | `applying`, `separating`, or `indeterminate`; provide the projected perfection time or reason it cannot be calculated |
| Threshold class | `core angular` at ≤ 3.0°; `extended angular evidence` > 3.0° and ≤ 5.0°; otherwise `outside configured range` |
| Testimony description | Plain-language statement of which side’s significator touches which side’s success cusp |

The public outline calls 2–3° a normal angular-cusp range and discusses a 4°37′ example as only mild; it also uses a wider range in some contexts.[1] Firmament should therefore use **3.0° as the core displayed default** and retain 3–5° as a separately labelled extended range. Both values must be editable only through a new versioned ruleset release—not silently changed per game.

For an `applying` label, use the calculated signed planetary longitudinal motion against the **frozen radical cusp degree**. The app must display the projected perfecting time and must mark the result `indeterminate` if a reliable solution cannot be obtained within the selected event horizon. It must not infer applying/separating from a static degree comparison alone.

## 4. Check the Moon’s Qualifying Applications

This is a time-order calculation, not a simple aspect snapshot.

1. Save the Moon’s initial longitude, signed speed, and sign at the official event start.
2. Project real ecliptic longitudes forward with the same ephemeris, testing conjunction, sextile, square, trine, and opposition to each traditional planet.
3. Find each **future perfection time**, not merely the current orb, using a root search over the selected event horizon.
4. Exclude candidates after the Moon leaves the sign it occupied at the event start.
5. Apply the ruleset’s conjunction-stop setting: the public outline reports that a bodily conjunction is treated as the stopping/final event for the sequence.[1]
6. Identify the final remaining qualifying aspect and then ask whether it perfects to **L1, L10, L7, or L4**.

| Moon result | Worksheet output |
|---|---|
| Final qualifying aspect reaches L1 or L10 | `Moon testimony → Side A` |
| Final qualifying aspect reaches L7 or L4 | `Moon testimony → Side B` |
| Final qualifying aspect reaches another classical planet | `Moon sequence found; no four-significator winner evidence` |
| No qualifying perfection before sign exit | `Moon void / no qualifying completion` |
| Incomplete speeds or failed projection | `NO CALL — Moon timing unavailable` |

The public outline says the Moon’s final applying aspect to a principal lord decides the winner and describes a roughly five-degree sports range, while limiting calculation by the Moon’s sign boundary.[1] Firmament must display the chosen maximum moon orb and event/overtime horizon as `frawley-event-v1` settings. The default can be `5.0°`, but a larger overtime allowance must be an explicit, logged user choice.

## 5. Record Afflictions and Supporting Testimony

This stage records evidence. It does **not** use an arbitrary universal point sum.

| Check | Calculation | Status in first implementation |
|---|---|---|
| Combustion / cazimi | Raw Sun–significator separation, same-sign flag, direction, and a versioned threshold | `review required` until a source-locked threshold is chosen; do not inherit Atlas’s 15° rule. The public outline calls the condition especially important at roughly 2° or less, subject to cazimi.[1] |
| Lunar nodes | Distance from each node to L1/L10/L7/L4 | `supporting testimony`; orb must be versioned because the public outline does not state one |
| Part of Fortune | Compute from one separately declared Part-of-Fortune formula; show formula, longitude, antiscia, dispositor, and contacts | `supporting testimony`; do not add until the formula convention is source-locked |
| Antiscia | Use the shown antiscion formula for each principal significator and Fortune point; test against H1/H4/H7/H10 | `supporting testimony`; cusp-contact threshold is versioned |
| Pluto on key cusps or opposite Fortune | Exact separation | Optional `outer-planet extension`, never silently mixed into the classical core |
| Uranus on MC | Exact separation | Optional `outer-planet extension`, never silently mixed into the classical core |
| Essential dignity / reception / most fixed stars | No Frawley-core calculation | Explicitly **excluded** from `frawley-event-v1` because the consulted outline says to ignore them in sports event charts.[1] |

## 6. Resolve the Worksheet Without an Opaque Score

The first version must emit evidence categories, not a manufactured 92% confidence value.

| Outcome state | Required condition |
|---|---|
| `SIDE A FAVORED — experimental` | Moon’s final qualifying aspect resolves to L1/L10 and no contradictory decisive block is present; supporting testimony is shown separately |
| `SIDE B FAVORED — experimental` | Moon’s final qualifying aspect resolves to L7/L4 and no contradictory decisive block is present; supporting testimony is shown separately |
| `CONFLICT — NO CALL` | Competing decisive evidence, undecided Moon result, or a shared/conflicted main significator prevents a clean result |
| `INSUFFICIENT INPUT — NO CALL` | Missing event/venue/cusp/planetary-speed/Favorite-source data, or unverified chart convention |
| `RESEARCH ONLY` | All calculations are shown but a required rule threshold remains not source-locked |

For every output, retain a **frozen event record**, full four-significator table, Moon candidate timeline, all angular-cusp rows, every supporting check, ruleset version, and later verified game result. The UI must not represent the experimental output as a wagering recommendation or guaranteed outcome.

## 7. Required Regression and Historical Tests

| Test | Pass condition |
|---|---|
| Event-time conversion | Known local/IANA time converts to expected UTC including DST boundary cases |
| Placidus fixture | Known time/location reproduces 12 stored cusps to the stated precision |
| Four-lord mapping | Cusp signs resolve only through traditional rulers; double-ruler case retains two roles |
| Cusp relation | On-cusp, inside, outside, core 3°, extended 3–5°, and out-of-range cases are distinct |
| Moon root search | Detects future perfection, ignores past separations, stops at configured conjunction, and rejects post-sign-exit events |
| Affliction audit | Every raw distance, threshold version, and no-data state is visible; no Atlas threshold leaks into this tab |
| No-mixing guard | Cluster, Atlas, KP, Tajika, and inverse-180 outputs cannot supply the Frawley verdict function |
| Historical holdout | Standard Frawley event results are time-split, pre-registered, and reported separately from current cluster results |

## Active v1 Boundary

The first activated implementation uses the stated real event time and venue, a separate named Placidus cusp service, traditional four-significator mapping, the 3°/5° angular evidence bands, a live Moon future-perfection search up to sign exit, and a no-call decision when the final qualified Moon target is absent, shared, or conflicted. It retains the raw cusp and planet evidence in its result record.

The first release shows combustion at the source outline’s ≤2° review threshold as **supporting evidence only**. Nodes and Part of Fortune are explicitly displayed as not configured and cannot alter the verdict until their source-locked thresholds and formula are separately added. No cluster, KP, Tajika/Prasna, Atlas, seed, or inverse-map output is allowed into the standard Frawley verdict.

## Implementation Order

1. **Input record and no-call gate.** Build the immutable pre-game record and event audit before any verdict.
2. **Placidus chart service.** Add and independently fixture-test a named Placidus calculation path; do not modify Atlas or current cluster Equal Houses.
3. **Four-significator and cusp worksheet.** Display the full H1/H4/H7/H10 and L1/L4/L7/L10 trace.
4. **Moon timeline.** Add real ephemeris projections, sign-boundary cut-off, conjunction-stop option, and no-data result.
5. **Supporting evidence.** Add only source-locked Fortune, antiscia, combustion, node, and optional outer-planet modules.
6. **Experimental result and holdout.** Freeze the Frawley tab and test it on a chronological holdout before changing its decision policy.

## References

[1]: https://tonylouis.wordpress.com/2026/03/09/frawleys-method-for-judging-sporting-matches/ "Frawley’s Method for Judging Sporting Matches — Anthony Louis"

[2]: https://www.johnfrawley.com/sports-astrology "Sports Astrology — John Frawley"
