# Colorado Rockies at Minnesota Twins — Replay Record

## Frozen Event Inputs

This is the user-requested historical upset replay. The result is documented below **only for evaluation after calculation**; neither the final score nor any postgame statistic is passed into the sports engine.

| Field | Frozen value | Evidence |
| --- | --- | --- |
| Game | Colorado Rockies at Minnesota Twins, MLB game `823689` | [Official MLB live feed](https://statsapi.mlb.com/api/v1.1/game/823689/feed/live) |
| Scheduled local start | Saturday, June 27, 2026, **6:10 PM CDT** (`America/Chicago`) | Official feed records `2026-06-27T23:10:00Z`; FanDuel’s same game information states 7:10 PM ET. |
| Scheduled UTC start | `2026-06-27T23:10:00Z` | [Official MLB live feed](https://statsapi.mlb.com/api/v1.1/game/823689/feed/live) |
| Venue | Target Field, 1 Twins Way, Minneapolis, Minnesota | [Minnesota Twins ballpark page](https://www.mlb.com/twins/ballpark) |
| Venue coordinate used | **44.982075, -93.278435** | [Target Field coordinate reference](https://www.latlong.net/place/target-field-mn-usa-31983.html) |
| Side A / Favorite | Minnesota Twins, home team, pregame moneyline **-172** | [Contemporaneous FanDuel matchup preview](https://www.fanduel.com/research/twins-vs-rockies-mlb-odds-prediction-point-spread-over-under-and-betting-trends-for-6-27-2026) |
| Side B / Challenger | Colorado Rockies, visiting team, pregame moneyline **+144** | [Contemporaneous FanDuel matchup preview](https://www.fanduel.com/research/twins-vs-rockies-mlb-odds-prediction-point-spread-over-under-and-betting-trends-for-6-27-2026) |
| Observed final result | Colorado 8, Minnesota 5 | [Official MLB line score](https://statsapi.mlb.com/api/v1/game/823689/linescore) |

## Replay Rule

Minnesota is entered as **Side A / Favorite** and Colorado as **Side B / Challenger**, matching the pregame moneyline relationship. The production chart procedure receives 6:10 PM as local civil time at Target Field; it derives the `America/Chicago` timezone from the frozen coordinates and converts that to the documented UTC instant.

The standard and inverse-180 models receive the same chart, team mapping, and point rules. They remain separate audit rows. The inverse run rotates chart points and the Ascendant by 180°; it does **not** swap the teams, pool votes, or select an orientation after seeing the 8–5 result.

## Completed Layer-Vote Replay

| Orientation | Eligible votes for Side A — Minnesota | Eligible votes for Side B — Colorado | Ties / abstentions | Aggregate result | Raw margin, diagnostic only | Comparison with observed 8–5 Colorado win |
| --- | ---: | ---: | ---: | --- | ---: | --- |
| Standard | 3 | 3 | 8 / 0 | **No call** | -3.975 for Side A minus Side B | The system does not choose the losing favorite; it also does not select the winning challenger. |
| Inverse-180 | 6 | 0 | 8 / 0 | **Side A / Favorite** | +38.475 for Side A minus Side B | The inverse comparison chooses Minnesota, which is inconsistent with the observed result. |

The standard scorecard’s eligible choices divide evenly. Minnesota receives Territorial Control, Lunar Flow, and chart-wide Aspects; Colorado receives Fixed Stars, Translation of Light, and KP Stellar. The eight remaining layers tie. Under `layer-vote-v1`, that is a genuine no-call, regardless of any raw point difference.

The inverse comparison concentrates all six eligible choices on Minnesota: Territorial Control, Lunar Flow, Fixed Stars, chart-wide Aspects, Translation of Light, and KP Stellar. This is not a case for selecting inverse orientation post hoc; it is contrary evidence that must remain visible in future historical evaluation.

## Home/Favorite Bias Observation

The fixed event confirms that the inverse-180 calculation can create a strong active-cluster preference for the home/pregame-favorite Side A even when the underdog won. The standard calculation does not make that same favorite call: it abstains at 3–3. One game cannot establish a general bias rate, so this is recorded as a **single-event warning signal**, not proof that any individual layer or the model as a whole is biased. The next valid step is a frozen multi-game holdout ledger with the same input and orientation rules.

## Evaluation Scope

This is a single illustrative regression, not an accuracy estimate or a wagering recommendation. The purpose is to expose whether active layers and the count-based aggregation lean toward the home/favorite Side A despite Colorado’s observed win. No layer weights are changed in response to this result.
