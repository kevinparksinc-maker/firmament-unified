# KP Sports Ruleset Audit

## Decision

Firmament’s current KP layer is **not yet a complete KP horary sports ruleset**. It is a simplified KP-inspired contribution inside the experimental cluster-territory score. It should remain labelled `cluster-territory-v1 / KP-support-layer` until the requirements below are implemented and historically evaluated as a distinct `kp-horary-sports-v1` ruleset.

> Do not use the current KP support points as if they were the supplied seed-based, Placidus-cusp KP decision method.

## Current Implementation Compared with the Supplied Blueprint

| Supplied KP requirement | Current Firmament behavior | Required change |
|---|---|---|
| Horary seed from 1–249 with provenance | No seed input, seed capture time, or seed-to-Ascendant record | Add a user-entered seed with selection timestamp, analyst/query location, mapping-table identifier, and immutable resulting Ascendant. Never auto-generate a supposedly meaningful “random” seed. |
| Seed mapping / 249 table | `getKPStellarDetails(longitude)` determines a Nakshatra lord and proportional Vimshottari sub-lord from a longitude; it does not map a seed to an Ascendant | Add a separately sourced, versioned 1–249 mapping dataset with exact boundaries and tests. The current helper’s 27 Nakshatras × 9 sub-lords yields 243 conceptual subdivisions, so its inline “249” wording must not be treated as proof of a seed table. |
| Placidus unequal cusps | Sports chart builder reconstructs 12 Equal Houses from a parsed Ascendant | Add a tested Placidus cusp generator for the chosen location/time, keeping the 12 numerical cusps and their Star/Sub details in the record. |
| A / B foundation | Current engine uses five-house Side A / Side B cluster families | KP tab must explicitly map Team A to H1 and Team B to H7, then show L1, L10, L7, and L4 as separate rows. It must not inherit a cluster point total. |
| Four-step significator hierarchy | Current `calculateKPSignificators` records only each planet’s physical house, Star Lord, and Sub Lord | Implement and display Grade A: star of an occupant of target house; Grade B: occupant; Grade C: star of cusp-sign lord; Grade D: cusp-sign lord. Preserve source evidence for each membership. |
| 6th and 11th cuspal sub-lords | Current layer takes the sub-lord of the 6th/11th Equal-House cusp then awards fixed points based only on that sub-lord’s house | Trace cusp longitude → cusp Star Lord → cusp Sub Lord → the Sub Lord’s Star Lord → every house signified. Apply a versioned rule matrix only after that trace is complete. |
| Retrograde filters | The sports placement type contains `isRetrograde`, but the active KP decision layer does not apply the supplied CSL or CSL-Star-Lord retrograde filters | Add live signed-motion provenance, separately calculate each proposed filter, and show an explicit block/allow/no-data result. Do not invert a winner merely because a Boolean field is present. |
| Tie / stalemate | Current final verdict is based on cluster-score margin | Define a KP-specific conflict result based on the two cusp traces, their filters, and explicit rule conflict—not on the inherited cluster margin. |
| 180° inverse tab | Current inverse map rotates chart and Ascendant together for a comparison model | Do not apply inverse orientation to seeded KP without defining and separately evaluating that operation. It is not part of the current KP blueprint. |

## Source and Convention Boundary

Published KP descriptions identify Placidus cusps and a relation between Nakshatra Star Lords, Vimshottari-proportional Sub Lords, and a 1–249 horary-number approach; they also show that practitioners dispute how seed selection should be interpreted.[1] This is exactly why Firmament must save the source of the seed rather than manufacture one invisibly.

The existing code’s current `getKPStellarDetails` supports a **longitude-to-Star/Sub** calculation, but it is not a seed-horary generator. The engine has no selected ayanamsha field, no seed-to-Ascendant table, no Placidus provider, no cusp-accuracy validation, no house-significator hierarchy, and no applied retrograde veto. That is an implementation boundary, not a minor tuning issue.

## Required KP Input Contract

| Input group | Required values |
|---|---|
| Query provenance | User-provided seed in `1…249`, selection timestamp, analyst/query location, IANA timezone, input source, and seed-table version |
| Astronomical convention | Explicit zodiac/ayanamsha, ephemeris source/version, geocentric or other declared frame, and signed longitude speed for every relevant planet |
| Cusp convention | Placidus house system, exact Ascendant from the seed table, 12 cusp longitudes, cusp sign lord, Star Lord, and Sub Lord |
| Contest mapping | Team A/Team B identity, home/away and favorite status as separate fields, H1/H7 rule declaration, and first-pitch/kickoff time if used as a separate event reference |
| Significator trace | For each of H1/H4/H6/H7/H10/H11: cusp, sign lord, Star Lord, Sub Lord, occupants, and Grade A–D source evidence |
| Output controls | Declared rule-matrix version, retrograde filter result, conflict/tie/no-call state, and frozen calculation hash |

## Mandatory Test Cases

1. **Seed boundary test:** 1, 249, and a representative interior seed each resolve to the published table’s exact Ascendant, Star Lord, and Sub Lord.
2. **Placidus fixture:** a known time/location reproduces all twelve stored Placidus cusps to an agreed precision.
3. **Hierarchy test:** fixtures prove Grade A–D are distinct and prove every 6th/11th significator can be traced to an occupant, cusp, or ruler.
4. **CSL matrix test:** fixture cases cover Side A win evidence, Side B win evidence, conflict/stalemate, and missing-data no-call.
5. **Retrograde test:** separate cases for a direct CSL, retrograde CSL, direct CSL with retrograde Star Lord, and unavailable motion data.
6. **No-mixing test:** a cluster-territory score, an Atlas chart, and an inverse-180 sports comparison cannot be passed into the KP verdict function.
7. **Historical test:** `kp-horary-sports-v1` is frozen and scored on a time-based holdout set independently of the cluster, Frawley, and Tajika rulesets.

## Recommended Build Sequence

1. Complete the Sports Event Ledger and No-Call Gate already listed in the reliability roadmap.
2. Obtain or approve one authoritative seed-to-Ascendant table and one named zodiac/ayanamsha convention; encode these as versioned local data with a source reference.
3. Add a Placidus cusp calculation path and fixture validation. Do **not** replace the existing Equal-House cluster engine.
4. Build an inspectable KP cusp worksheet before adding any final scoring: H1/H4/H6/H7/H10/H11 rows, all Star/Sub lords, hierarchy grades, and real-motion retrograde filters.
5. Only then add a separate KP decision matrix and outcome categories, followed by historical time-split validation.

## References

[1]: https://tonylouis.wordpress.com/2024/11/14/east-meets-west-experimenting-with-kp-horary-techniques/ "East meets West: Experimenting with some ideas suggested by KP Horary — Anthony Louis"
