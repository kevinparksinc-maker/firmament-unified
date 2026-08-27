# Firmament Sports Reliability Roadmap

## Purpose and Present Boundary

> This is engineering and model-evaluation guidance, **not betting advice** and not a guarantee that a chart-derived score forecasts a contest outcome.

Firmament has a coherent declared sports **side-family** convention: Side A/Favorite uses Houses 1, 3, 6, 10, and 11, while Side B/Challenger uses Houses 7, 9, 12, 4, and 5. That grouping is unchanged from the pre-Atlas sports code. Atlas remains isolated and does not alter sports house families.

The central limitation is not the side-family grouping. It is that the current system has calculation layers and point weights, but it has **not yet demonstrated out-of-sample predictive reliability** from complete, frozen pre-game records.

## What Is Present and What Must Change

| Area | Present state | Needed before relying on a sports call |
|---|---|---|
| Team sides | Favorite is Side A; Challenger is Side B; family constants are stable | Add an explicit home/away/favorite mapping record and show it in every result |
| Chart ingestion | Some paths accept free-form placement text; only three parsed placements are sufficient to proceed | Require a structured immutable event/chart record: event ID, competition, scheduled UTC start, venue coordinates, timezone, source, capture time, full point list, cusps, and source version |
| House calculation | Sports rebuilds equal-house cusps from the parsed event Ascendant | Store the input Ascendant, all twelve cusps, longitude convention, and full house-assignment audit with each call |
| Rule layers | Territorial scoring, Moon, fixed stars, lots, aspects, knowledge layers, and KP are additive | Record every layer’s raw contribution and turn off/abstain on a layer whose inputs are incomplete |
| Applying/separating | The sports adapter marks all computed aspects as non-applying; translation-of-light explicitly acknowledges an approximation | Supply reproducible longitudinal speeds or disable motion-dependent translation-of-light scoring until those speeds exist |
| Standard and inverse maps | Both exist as comparison calculations | Freeze them as separately evaluated models; never choose a winner by whichever orientation happens to agree with hindsight |
| Confidence | Derived from score margin and volatility, not calibrated to completed-event outcomes | Do not frame it as probability until calibrated against a locked historical training and holdout set |

## Required Data Record

Each prediction needs one saved `SportsEventChartRecord`, created before the contest begins.

| Field group | Required fields |
|---|---|
| Event identity | League, season, event ID, sport, scheduled UTC start, venue, venue latitude/longitude, source URL or provider ID |
| Team assignment | Home team, away team, favorite/challenger labels, Side A/Side B mapping, mapping timestamp, and any declared source for favorite status |
| Calculation input | IANA timezone, Ascendant, 12 numerical cusps, point names, ecliptic longitudes, signs, degrees, houses, retrograde/motion data, and ephemeris/parser version |
| Model provenance | Commit/version ID, standard or inverse-180 orientation, rule-registry versions, full layer breakdown, score, confidence label, and abstention reasons |
| Outcome record | Verified final result, winner/draw/void status, score, recorded outcome source, and the time the outcome was ingested |

An incomplete record must yield **“insufficient verified input — no call”**, not a confident-looking side selection.

## Historical Evaluation Protocol

The first meaningful build is a replay harness, not another scoring layer. It should use a fixed, consecutive cohort of completed events from one sport and one clear prediction horizon. Chart inputs must be reconstructed exactly as they would have been available pre-game; post-game data cannot enter calculation or labeling.

| Stage | Method | Output |
|---|---|---|
| Freeze rules | Version every chart convention, side mapping, scoring weight, and orientation before evaluation | A reproducible model identifier |
| Build records | Collect complete pre-game event/chart records and verified final outcomes | An append-only historical dataset |
| Split by time | Use older events only for calibration; reserve a later untouched period as a holdout | No future-information leakage |
| Evaluate separately | Score standard and inverse-180 orientations as independent models | Accuracy, coverage, abstention rate, balanced accuracy, Brier score, and calibration table for each model |
| Compare baselines | Compare each model to explicit non-chart baselines agreed before review, such as always-home or always-favorite | Evidence that the model adds signal beyond a trivial rule |
| Review failure cases | Classify wrong calls by input quality, rule disagreement, and margin band without rewriting rules after the fact | A prioritized repair list |
| Prospective trial | Freeze the selected version and log calls before new contests occur | Evidence resistant to hindsight fitting |

The project’s existing summary already records a key warning: an earlier winner call was paired with a 93.75% confidence output for a contest settled on penalties. That is direct evidence that the current confidence display is **not calibrated** and must not be treated as a true win probability.

## Recommended Build Order

1. **Sports Event Ledger and abstention gate.** Replace permissive text-only entry with a structured, source-stamped pre-game record. Keep manual entry available only as an explicitly labelled, incomplete-input mode that cannot produce a confidence label.
2. **One calculation trace.** Persist the Ascendant, cusps, point positions, side mapping, orientation, rule versions, and all layer contributions together. The UI should make it easy to see why Side A or Side B received points.
3. **Historical replay and scorecard.** Run the fixed historical cohort before changing weights. Report coverage, accuracy, balanced accuracy, calibration, and standard/inverse results separately.
4. **Calibrate or remove confidence.** If the holdout result does not support the existing confidence conversion, replace it with margin bands such as `under evaluation`, `small chart-margin`, or `no call` until calibration is demonstrated.
5. **Only then consider weight changes.** Any new astrology layer or weight must be pre-registered, trained only on the historical development period, then checked on an untouched later period.

## First Acceptance Gate

Before the application presents a sports result as more than an experimental chart signal, it should pass a pre-agreed, time-split holdout review with complete records, meaningful coverage, a clear comparison against agreed baselines, and disclosed uncertainty. A single correct game, a selective memory of calls, or a result interpreted after the fact is not enough to establish reliability.

## Source Notes

The active code inventory for this roadmap is `server/routers.ts`, `server/sportsHoraryReading.ts`, `server/sportsHoraryV2Reading.ts`, `server/masterPredictionEngine.ts`, `server/territorialControlEngine.ts`, and `server/clusterKnowledgeLayers.ts`. The existing project assessment in `server/IMPLEMENTATION_SUMMARY.md` documents the previously observed confidence miscalibration and need for independent validation. A suitable structured MLB data provider exposes schedules, game summaries, box scores, and play-by-play feeds, which are the categories needed to record event identity and verified results.[1]

## References

[1]: https://developer.sportradar.com/baseball/docs/mlb-ig-api-basics "Sportradar MLB API Basics"
