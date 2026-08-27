# Sports Ruleset Separation: Cluster, Frawley, and Tajika/Prasna

## Decision

Firmament should **not combine these systems into one grand point total**. The current cluster model, a Frawley-style Western event-chart model, and a Tajika/Prasna model use different inputs, different house assumptions, and different ways of resolving a contest. Each must be a separately versioned ruleset with its own input requirements, calculation trace, historical evaluation, and scorecard.

> A system may compare ruleset outputs, but it must never hide a mixture of their rules behind one unnamed prediction score.

## Current Cluster Engine

The active engine is a **cluster-territory model**, not a complete implementation of either supplied school. It assigns Side A/Favorite to Houses 1, 3, 6, 10, and 11, and Side B/Challenger to Houses 7, 9, 12, 4, and 5. It uses Equal House cusps from the parsed event Ascendant and scores territorial occupation, Moon, fixed stars, Arabic Lots, aspects, several cluster layers, and KP.

| Current behavior | Compatibility result |
|---|---|
| Side A/Favorite and Side B/Challenger five-house families | Retain as `cluster-territory-v1`; it is a distinct model |
| Equal Houses from parsed event Ascendant | Not a Frawley Placidus implementation and not automatically a Tajika chart |
| All-house cluster scoring | Not the Frawley four-significator method |
| Nakshatra and KP layers | Not part of a pure Frawley method |
| Existing Graha Yuddha / planetary-war layer | Must not claim a classical Tajika decision method until it has the required declared inputs and winner rule |
| Standard and inverse-180 comparison | Keep separately labelled and historically evaluated; it must never select itself by hindsight |

## Frawley-style Event Chart Ruleset

The supplied Frawley blueprint belongs in a new `frawley-event-v1` ruleset. A published outline of the method describes an event chart for the contest start, traditional rulers, Favorite as House 1/L1, Opponent as House 7/L7, with L10 and L4 as the respective success significators.[1] The same outline identifies angular-cusp proximity and the Moon’s final applying aspect as central features, while treating many other techniques as irrelevant for that method.[1]

| Component | Required implementation boundary |
|---|---|
| Chart type | Scheduled kickoff/first-pitch/start-whistle event chart, not an arbitrary question chart |
| Team mapping | Favorite → H1 / L1 / L10; Opponent → H7 / L7 / L4. For a separate home/away mode, store the mapping rule used rather than silently treating them as equivalent. |
| Houses | Select and freeze a named quadrant system for this ruleset. The consulted Frawley outline calls for Placidus; the user-supplied note lists Regiomontanus/Placidus. This must be a versioned setting, not an implicit calculation. |
| Allowed significators | Traditional seven planets for L1, L10, L7, and L4; outer-planet and node rules are optional declared modules, not silent inputs. |
| Cusp evidence | Exact cusp longitude, signed distance, which side of cusp, and whether the planet is applying. Do not collapse a 5° claim and a 2–3° claim into one unnamed threshold. |
| Moon rule | Requires actual forward lunar motion, all candidate perfection times before the sign boundary, conjunction stopping rule if selected, and the exact final qualifying aspect. |
| Afflictions | Each must state its own combustion, cazimi, node, and cusp-contact threshold; the rule must show the raw distance and no automatic “team loses” narrative. |
| Output | Four-significator table, decisive and supporting testimonies, unresolved contradictions, and `no-call` state—not an inherited cluster score. |

## Tajika / Prasna Ruleset

The supplied Tajika/Prasna material belongs in an independent `tajika-prasna-v1` ruleset. A technical Tajika explainer treats speed order, per-planet orbs, and future application as required for Itthashala; it describes Eesapha/Musaripha as a separation condition rather than simply a generic aspect.[2] The same source explains that the framework uses its own relative-house aspects and rule vocabulary.[2]

| Component | Required implementation boundary |
|---|---|
| Chart type and zodiac | Store exact Prasna/event moment, named zodiac/ayanamsha choice where used, and named house system. Do not inherit tropical Atlas or cluster Equal Houses without selecting it. |
| Planet data | Seven traditional planets with geocentric longitude, **signed speed**, declination, and ecliptic latitude; nodes and outer planets must be scoped explicitly. |
| Itthashala / Eesapha | Use actual projected perfection from signed motions, specific declared aspect/orb policy, and explicit speed ordering—not a same-day position comparison alone. |
| Graha Yuddha | The supplied one-degree, five-planet trigger needs a clearly selected winner rule. Published commentary confirms the five-planet/one-degree convention but also documents competing winner criteria involving size, brightness, speed, declination, latitude, and special Mars treatment.[3] Therefore the system must display `war detected` separately from any `winner rule` and version the latter. |
| Ashtakavarga | Requires a fully specified natal-reference and bindu algorithm. It cannot be inferred from a one-time event chart or fitted thresholds. |
| Kot Chakra | Requires the selected reference Janma Nakshatra, a declared 27-or-28 Nakshatra layout including the precise role of Abhijit, team/captain/nation identity source, and a versioned placement pattern. This is a future standalone visual module, not a generic bonus. |
| Output | Event input record, selected school settings, each completed yoga/war calculation, missing prerequisite alerts, and abstention if the reference data is incomplete. |

## Prerequisite Build Sequence

1. Build the **Sports Event Ledger + No-Call Gate** first. It must save verified event identity, start time, venue, team mapping, input source, complete cusps, computed positions, and model version before play begins.
2. Preserve `cluster-territory-v1` as the existing experimental comparison model; add its missing source/completeness labels rather than retrofitting Frawley or Tajika rules into it.
3. Implement `frawley-event-v1` as a standalone trace with only its four significators, selected quadrant-house calculation, cusp proximity, Moon completion rule, and declared afflictions.
4. Add verified speed, declination, and ecliptic-latitude support; then implement `tajika-prasna-v1` with true application/separation and a separately chosen Graha Yuddha winner convention.
5. Evaluate each ruleset on the same frozen historical event cohort, with a time-based holdout period. Report coverage, abstentions, result accuracy, and calibration **per ruleset**. Do not merge scores unless a predefined ensemble rule is itself validated on later unseen events.

## Current Conclusion

The supplied blueprint is valuable because it identifies calculation modules Firmament does not yet implement. It does not establish that the current cluster score is a Frawley or Tajika result. The engineering priority remains **auditable event inputs and historical evaluation**, then separately implemented rulesets. Adding the rules without that foundation would create more combinations but not demonstrate that the sports system works.

## References

[1]: https://tonylouis.wordpress.com/2026/03/09/frawleys-method-for-judging-sporting-matches/ "Frawley’s Method for Judging Sporting Matches — Anthony Louis"

[2]: https://medium.com/prasna-jyotish/tajik-yogas-in-prasna-shastra-97e3afec652c "Tajik Yogas in Prasna Shastra — Prasna Jyotish"

[3]: https://saptarishisshop.com/graha-yuddha-testing-the-parameters-of-astrology-and-astronomy-by-edith-hathaway/ "Graha Yuddha: Testing the Parameters of Astrology and Astronomy — Edith Hathaway"
