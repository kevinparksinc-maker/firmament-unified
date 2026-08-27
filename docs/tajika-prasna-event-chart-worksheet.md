# Tajika/Prasna Event-Chart Worksheet: Active v1 Contract

## Purpose and Boundary

`tajika-prasna-v1` is a separate, experimental event-chart method. It uses the contest’s real local start, venue, and Favorite source; it does **not** receive Cluster/Territorial points, Frawley testimony, Atlas output, seed numbers, or an inverse-map result. It evaluates its standard and inverse-180 charts as independent audit records.

The reviewed Tajika source describes yoga formation through relative house relations, per-planet orbs, speed order, future application, and separation—not a generic static-aspect score.[1] The sport-specific Side A/Side B conclusion below is therefore an explicit Firmament v1 mapping, not presented as a quotation from any classical text.

## Frozen Event Requirement

The module requires an official local start date/time, venue name, exact venue coordinates, a pregame Favorite source, and both team names. It resolves the venue timezone from coordinates, records the derived UTC instant, and stops with `INSUFFICIENT INPUT — NO CALL` if any required field is absent or the Placidus chart service cannot return twelve finite cusps.

| Setting | `tajika-prasna-v1` value | Reason for visibility |
| --- | --- | --- |
| Zodiac | Tropical | Declared v1 convention; not inherited from Atlas or a hidden ayanamsha. |
| House system | Placidus | Declared v1 setting, using the isolated event-chart service. |
| Sides | Favorite = H1/L1/Side A; Challenger = H7/L7/Side B | Frozen with the event’s published pregame favorite source. |
| Success lords | Side A: L10; Side B: L4 | Firmament’s explicit event-contest mapping, retained separately from Frawley. |
| Planets | Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn | Nodes and outer planets are excluded from core yoga resolution. |
| Inverse-180 | Optional separate comparison | Rotates every chart longitude and cusp together; it never swaps teams or joins the standard verdict. |

## Tajika Evidence Calculations

| Evidence | `tajika-prasna-v1` calculation | Effect |
| --- | --- | --- |
| Relative relation | The sign-house distance from the faster body to the slower body. Friendly relations are 5/9, 3/11; hostile relations are 4/10, 1/7. | Displayed for every completed yoga. It does not silently add points. |
| Per-planet orb | Sun 15°, Moon 12°, Mars 8°, Mercury 7°, Jupiter 9°, Venus 7°, Saturn 9°. A pair must be inside the smaller participating orb. | Required before a yoga can be emitted. |
| Itthashala | Faster planet is behind the slower planet in the relevant aspect geometry, the pair is within its declared orb, and a forward root search perfects the aspect. | `completion` evidence. Within 1° it receives the distinct label `Muthashila / complete`. |
| Eesaphala / Musaripha | The same eligible aspect geometry is separating; a faster body has already passed the perfection point by at least 1°. | `separation` evidence, never treated as a completion. |
| Nakta / Yamaya bridge | If a side’s identity–success pair has no direct completion yoga, a third traditional planet has a chained Itthashala connection to both. The bridge is labeled Nakta if intermediate in speed and Yamaya if slower than both endpoints. | Supporting evidence only in v1. |
| Kamboola | Moon is in Itthashala with an endpoint of an otherwise direct completion yoga. | Supporting catalyst only; it does not independently select a team. |
| Graha Yuddha | Mercury, Venus, Mars, Jupiter, or Saturn are within 1°. The record shows the detected pair and a transparent source-based authority ordering. | Supporting condition only. It cannot decide the team in v1. |

## Outcome Rule

The method does not manufacture a percentage. It calculates a **Side A completion link** between L1 and L10 and a **Side B completion link** between L7 and L4. It only makes a tentative experimental choice when exactly one side has a direct, qualifying Itthashala/Muthashila completion link and the other side does not have a direct completion link.

| State | Condition |
| --- | --- |
| `SIDE A FAVORED — experimental` | L1–L10 has a direct completion yoga; L7–L4 does not; no shared-ruler conflict prevents a clean attribution. |
| `SIDE B FAVORED — experimental` | L7–L4 has a direct completion yoga; L1–L10 does not; no shared-ruler conflict prevents a clean attribution. |
| `CONFLICT — NO CALL` | Both sides have direct completion evidence, a significator is shared across sides, a chain has competing endpoints, or standard requirements conflict. |
| `NO DECISIVE COMPLETION — NO CALL` | Neither side has the required direct completion yoga; bridges, Kamboola, Eesaphala, and Graha Yuddha remain visible but cannot force a side. |
| `INSUFFICIENT INPUT — NO CALL` | Event, cusp, planetary motion, or Favorite-source gate fails. |

## Explicit Exclusions

Ashtakavarga, Kot Chakra, a natal reference, divisional charts, and seed-based KP are **not** part of `tajika-prasna-v1`. They require separately declared source material and inputs. Existing cluster layers, Frawley testimony, and Atlas calculations cannot supply this module’s verdict.

## Initial Browser Verification

The Sports Horary method selector reached the Tajika/Prasna tab through a normal pointer interaction. With the frozen Target Field June 27, 2026 event record, the form enforced the exact venue coordinates and pregame Favorite-source fields, then rendered a standalone `tajika-prasna-v1` result: Placidus setting, UTC instant, H1/L10/L7/L4 table, direct completion links, Eesaphala/Musaripha count, supporting-yoga counts, raw cusp disclosure, and an explicit no-call caused by shared Jupiter and Mercury significators. The result panel displayed no Cluster points, Frawley testimony, KP result, or confidence percentage.

## References

[1]: https://medium.com/prasna-jyotish/tajik-yogas-in-prasna-shastra-97e3afec652c "Tajik Yogas in Prasna Shastra — Prasna Jyotish"

[2]: https://saptarishisshop.com/graha-yuddha-testing-the-parameters-of-astrology-and-astronomy-by-edith-hathaway/ "Graha Yuddha: Testing the Parameters of Astrology and Astronomy — Edith Hathaway"
