# Experimental Sports Rerun: Phillies at Mariners

## Event Provenance

| Field | Value |
|---|---|
| Event | Philadelphia Phillies at Seattle Mariners |
| MLB game ID | `823096` |
| Venue | T-Mobile Park, Seattle, Washington |
| Local start | 2026-08-26 1:10 PM `America/Los_Angeles` |
| UTC start | 2026-08-26T20:10:00Z |
| Chart coordinates used by current regression | 47.6062° N, 122.3321° W |
| Team assignment | Historical regression convention: Seattle home club = Favorite / Side A / H1; Philadelphia visitor = Challenger / Side B / H7 |
| Chart input | Current legacy `ephemeris.calculate` event chart: 12 placements and 12 cusps |
| Sports model | Current `cluster-territory-v1` experimental score; Frawley, KP-horary, and Tajika methods were not run |

The official MLB schedule record identifies the game as final, with Philadelphia 6 and Seattle 0.[1] That outcome was not an input to either calculation.

## Standard Orientation

| Item | Seattle / Side A | Philadelphia / Side B |
|---|---:|---:|
| Final model total | 37.84 | 16.94 |
| Computed margin | 20.90 points | — |
| Model verdict | Favorite / Seattle | — |
| Model display label | Strong dominion; 93.1% | — |
| Canonical Territorial Control | 21.8375 | -9.0625 |
| KP Stellar | 17.5 | 11.5 |
| Upachaya Growth | 3 | 2 |
| Lunar Flow | 0 | 8 |
| Arabic Lots | 3 | 7 |
| Aspects | -4 | 4 |
| Translation of Light | 0 | 3 |
| Via Combusta | 0 | -6 |
| Harmonious vs. Friction | -6 | -6 |
| Moon Phase / VOC | 0.5 | 0.5 |
| Nodes | 2 | 2 |
| Fixed Stars / Besiegement / Mutual Reception | 0 / 0 / 0 | 0 / 0 / 0 |

## Inverse-180 Orientation

| Item | Seattle / Side A | Philadelphia / Side B |
|---|---:|---:|
| Final model total | 36.84 | 10.34 |
| Computed margin | 26.50 points | — |
| Model verdict | Favorite / Seattle | — |
| Model display label | Strong dominion; 84.55% | — |
| Canonical Territorial Control | 18.8375 | -15.1625 |
| KP Stellar | 16.5 | 8 |
| Upachaya Growth | 3 | 2 |
| Lunar Flow | 0 | 8 |
| Arabic Lots | 3 | 7 |
| Aspects | -4 | 4 |
| Translation of Light | 3 | 0 |
| Via Combusta | 0 | 0 |
| Harmonious vs. Friction | -6 | -6 |
| Moon Phase / VOC | 0.5 | 0.5 |
| Nodes | 2 | 2 |
| Fixed Stars / Besiegement / Mutual Reception | 0 / 0 / 0 | 0 / 0 / 0 |

## Audit Interpretation

Both current orientations chose Seattle because the **Canonical Territorial Control** and **KP Stellar** layers were large enough to outweigh Philadelphia’s Lunar Flow, Arabic Lots, and aspect/translation support. The actual verified result was Philadelphia 6–0 Seattle. Therefore this event is a **miss** for both current experimental orientations, and it is direct evidence against treating the displayed 93.1% or 84.55% labels as calibrated outcome probabilities.

The rerun preserved the historical test mapping of `Seattle home = H1 / Side A`; it did not assign Side A by the actual betting favorite. That is an additional provenance limitation: the current rerun checks the program’s existing chart calculation path, not a complete Frawley-style Favorite-versus-Opponent event method.

No sports method from this rerun is a betting recommendation or an outcome guarantee. This record should enter a time-stamped historical scorecard alongside other frozen pre-game event records before any score calibration or layer-weight change is made.

## Reference

[1]: https://statsapi.mlb.com/api/v1/schedule?sportId=1&gamePk=823096&hydrate=linescore "MLB Stats API schedule record for game 823096"
