# Sports Horary Method Protocol Registry

## Purpose

Firmament’s Sports Horary methods are not interchangeable point layers. Each method has its own calculation frame, permitted evidence, and abstention rule. The application may display a **cross-method protocol ledger**, but it must not add raw scores across methods, substitute a manual chart for a verified event record, or turn any abstention into support for the underdog or favorite.

> A conclusion is strongest only when separately calculated, event-matched protocols point in the same direction. It is not made stronger by counting incompatible scores twice.

## Active Methods

| Method | Version | Required input gate | Decision logic | Protocol conclusion eligibility |
|---|---|---|---|---|
| Cluster / Layer Vote | `layer-vote-v1` | Parsed or live-generated event-chart placements and an Ascendant; current UI may also accept a manually entered chart | Each Cluster-native layer chooses A, B, tie, or abstain; eligible layer choices determine only the Cluster result | **Manual-chart result: excluded.** It has no strict event identity, venue, UTC, or pregame-favorite provenance. A future strict event-ledger adapter may be evaluated separately. |
| Frawley Event | `frawley-event-v1` | Exact local start, stadium coordinates, team names, and recorded pregame favorite source | Placidus four-significator and Moon-timing evidence; conflicts and missing evidence produce no call | Eligible only in standard orientation and only with the same frozen event key as other strict methods. |
| Tajika / Prasna | `tajika-prasna-v1` | Exact local start, stadium coordinates, team names, and recorded pregame favorite source | Direct qualifying completion link between each side’s identity/success lords; conflicts and missing prerequisites produce no call | Eligible only in standard orientation and only with the same frozen event key as other strict methods. |
| Panchanga / Team Archetype | `panchanga-archetype-v1` | Exact event record plus two user-documented, date-valid team profiles | Live Panchanga compatibility applied only to valid documented profiles; a profile error or close result produces no call | Eligible only with the same frozen event key and retained profile provenance. |
| God ↔ Agent Flow | `god-agent-family-flow-v1` / `god-axis-v1` | Exact event record; God axis receives UTC only, then Agent view receives local venue data | Fixed God ASC/DSC polarity and separate Agent family receiver field; tie, abstention, or conflict produces no call | Standard orientation only. Its inverse remains audit-only and never becomes a second vote. |

## Legacy Compatibility Boundary

The existing generic `sportsHorary.ask` and `sportsHorary.askV2` server paths remain compatibility interfaces for unstructured or manually supplied chart text. They are not independent rulesets and cannot enter the cross-method protocol conclusion. The visible Cluster tab uses the `askWithChart` pathway for its `layer-vote-v1` scorecard; without a strict event ledger, that result stays an inspectable, non-comparable manual-chart evaluation.

## Event-Match Key

Every strict method result must expose the following unchanged values before it can be compared with another strict method:

```text
event UTC timestamp | venue name | Favorite / Side A name | Challenger / Side B name
```

If two otherwise valid results have different keys, the ledger reports **event-record mismatch**. It does not infer that similarly named teams, a nearby start time, an inverse orientation, or a different venue refers to the same event.

## Cross-Method Conclusion States

The ledger compares **directional outcomes** (`side-a` or `side-b`) only after applying the eligibility rules above. `No call` is retained in the ledger but does not become a directional vote.

| Ledger state | Condition | Required public statement |
|---|---|---|
| `awaiting-comparable-runs` | No strict standard-orientation protocol has produced a comparable event-matched result | “No cross-method conclusion: run at least one strict event protocol.” |
| `event-record-mismatch` | Comparable results have different event keys | “No cross-method conclusion: submitted methods refer to different event records.” |
| `single-directional-method` | Only one strict matched method has a directional output | “One method is directional; this is not cross-method convergence.” |
| `side-a-convergence` | At least two strict matched methods are directional and all select Side A | “Method convergence toward Side A / the recorded Favorite; experimental and not a pooled prediction.” |
| `side-b-convergence` | At least two strict matched methods are directional and all select Side B | “Method convergence toward Side B / the recorded Challenger; experimental and not a pooled prediction.” |
| `cross-method-conflict` | At least one strict matched method selects each side | “Methods conflict: no cross-method conclusion.” |
| `no-directional-convergence` | Two or more strict matched methods exist, but none is directional | “Methods abstain or tie: no cross-method conclusion.” |

No state produces a probability, a calibrated confidence claim, a moneyline choice, or a wagering recommendation. No-call records must remain no-call unless a separately versioned and independently tested rule is established on a later holdout.

## Protocol Safeguards

| Safeguard | Required behavior |
|---|---|
| No pooled score | The ledger cannot add Cluster points, Panchanga compatibility points, God/Agent counts, or any other raw value. |
| Method retention | One completed result per method remains visible in the ledger until replaced by a subsequent run of that same method. |
| Source visibility | Strict results retain their pregame favorite source, UTC event time, and venue in the individual audit. |
| Orientation boundary | Inverse results remain individual audits, are visibly labelled, and are excluded from cross-method conclusion states. |
| Manual-chart boundary | A Cluster/manual output stays visible but cannot create or break a strict cross-method convergence. |
| No-call preservation | A tie, abstention, incomplete input, profile failure, or cross-view conflict cannot be converted into an inferred underdog result. |

## Validation Requirements

The ledger needs deterministic coverage for same-event Side A convergence, same-event Side B convergence, one-direction-only result, conflict, all-no-call, event mismatch, manual Cluster exclusion, and inverse exclusion. Interface validation must show the protocol matrix and current ledger state after method submissions without hiding an individual method’s raw audit.

## Initial Interface Verification

On the live Sports Horary route, the registry renders directly below the separately selectable method tabs. Before any run is submitted, it shows `awaiting-comparable-runs` and states that no strict standard-orientation result is available. It explicitly identifies manual Cluster input and inverse audits as visible but ineligible for a cross-method conclusion. This confirms that the new interface does not infer an underdog or favorite before a matching strict method record exists.

Using the frozen Target Field record, a standard Frawley run returned its existing shared-significator no-call and was retained in the ledger as exactly one strict matched event method. On moving to God ↔ Agent Flow, the ledger retained that Frawley record and continued to show `awaiting-comparable-runs`; it did not interpret the single Frawley no-call as an underdog or favorite selection.

Submitting the same frozen record through standard God ↔ Agent Flow retained both strict results and produced `no-directional-convergence`. The ledger displayed each `No call` independently and issued no cross-method favorite, challenger, or underdog conclusion. The browser console showed only the pre-existing development service-worker MIME warning and no application exception.
