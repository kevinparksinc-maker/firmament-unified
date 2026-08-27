# NPB Historical Cohort Protocol

## Scope

This protocol defines a **separate Nippon Professional Baseball (NPB) cohort** for the Sports Horary historical evaluation. It must not be combined with MLB performance, because leagues, schedules, venues, odds availability, and sample composition differ. The cohort evaluates whether an already-frozen method produced a `No call` before a recorded NPB underdog won; it does not convert a no-call into a live wagering recommendation.

## Current-Live Board Boundary

The supplied board is treated only as a lead identifying current NPB fixtures and market formatting. It visibly identifies live or suspended markets, including Tohoku Rakuten Golden Eagles–Orix Buffaloes, Fukuoka SoftBank Hawks–Chiba Lotte Marines, Hanshin Tigers–Chunichi Dragons, and Yomiuri Giants–Tokyo Yakult Swallows. Because the markets were displayed after play had begun or were suspended, none may be used as pregame evidence for a historical backtest and none will receive a live sports conclusion.

## Verified Data Sources

| Required record | Candidate source | Evidence verified during protocol setup |
|---|---|---|
| Completed NPB game, final result, home venue | [NPB 2026 regular-season scores](https://npb.jp/bis/eng/2026/games/) | The official NPB index exposes a completed daily slate. Its August 26 record lists Central and Pacific League finals, including Yakult 3–Yomiuri 5, Chunichi 4–Hanshin 0, Hiroshima 3–DeNA 2, Seibu 1–Nippon-Ham 9, Lotte 6–SoftBank 5, and Orix 7–Rakuten 5. |
| Dated two-sided pregame odds | [CheckBestOdds Japan NPB historical odds](https://checkbestodds.com/baseball-odds/historical-odds-japan-npb) | The archive states that it records historical bookmaker odds and gives dated rows with both teams and two decimal prices, from which the lower decimal price identifies the archived favorite when the prices differ. |
| Stadium coordinates and event start | Official NPB club schedule/venue records or a separately cited stadium source | Must be stored alongside each game; a city-center guess is not accepted. |

## Cohort Eligibility

The evaluation starts with the most recent completed NPB dates for which all fields below can be matched. It takes the first **20 consecutive eligible games** in reverse chronological scheduled-start order. If a candidate lacks a documented scheduled start, stadium coordinates, a two-sided pregame price, or final score, it is skipped with its reason recorded; the next chronological eligible game replaces it. No game may be selected because of its winner or model output.

| Field | Required frozen record |
|---|---|
| Competition | NPB regular season; Central or Pacific League recorded |
| Teams and final score | Official NPB completed-game record |
| Local start and UTC conversion | Official schedule start with venue IANA timezone, normally `Asia/Tokyo` where applicable |
| Venue | Exact stadium name and verified latitude/longitude |
| Favorite | Lower archived pregame decimal price; equal price is excluded as no defined market underdog |
| Challenger / underdog | The other team at the archived two-sided price |
| Model method | Frozen `god-agent-family-flow-v1`, standard orientation only for the initial no-call study |

## Metrics and Reporting Boundary

Report NPB eligibility count, exclusions, no-call count, overall underdog wins, no-call underdog wins, and the corresponding raw proportions with uncertainty intervals. Do not pool the result with MLB, use live odds, use the God-axis inverse audit as an additional observation, or call the outcome an edge, a prediction, or wagering advice.

## References

[1] [Nippon Professional Baseball Organization — 2026 Regular Season Scores](https://npb.jp/bis/eng/2026/games/)

[2] [CheckBestOdds — Japan NPB Historical Odds](https://checkbestodds.com/baseball-odds/historical-odds-japan-npb)

## Intake Evidence Saved

The official NPB detail records establish an 18:00 JST start for all six August 26 games in the pilot: Jingu (Yakult–Yomiuri), Vantelin Dome (Chunichi–Hanshin), Mazda Stadium (Hiroshima–DeNA), Belluna Dome (Seibu–Nippon-Ham), ZOZO Marine (Lotte–SoftBank), and Kyocera Dome (ORIX–Rakuten). The individual official results record final scores of 3–5, 4–0, 3–2, 1–9, 6–5 in ten innings, and 7–5, respectively. The CheckBestOdds historical row records the archived two-sided prices used to label a favorite and underdog: 2.03/1.68, 1.93/1.78, 2.52/1.45, 2.21/1.67, 2.58/1.42, and 2.00/1.71 in the same listed matchup order.

Official daily NPB result pages identify the subsequent candidates and game records: August 25 (`s2026082501387` through `s2026082501750`) lists six completed games, each starting at 18:00 JST except ORIX–Rakuten at 18:01; August 23 (`s2026082301384` through `s2026082301747`) lists six completed games with recorded starts from 13:00 to 18:00 JST; and August 22 lists four archive-odds candidates, two of which have official reported start times. The archived odds rows retain dated two-sided values for every listed August 22–26 matchup, while exact input eligibility remains conditional on a matching official game record, a reported local start, and a stadium coordinate.

## First Frozen Evaluation Result

The first 20 eligible games, in the declared reverse-chronological August 22–26 sequence, were rerun after correcting the Agent family classifier to leave H2 and H8 neutral. The archived market underdog won **11 of 20** games (55.0%; Wilson 95% interval 34.2%–74.2%). The two-sided archived prices imply 8.70 aggregate underdog wins after normalizing their quoted overround (mean no-vig underdog probability 43.5%), so the observed count was 2.30 wins above that descriptive price baseline. The corrected method returned 18 `dsc-convergence` / Side B–challenger contexts and **2 neutral no-calls**. One underdog won in the two no-call records; this 1/2 descriptive result is far too small to evaluate the proposed “no-call implies underdog” hypothesis. The pre-correction 20-of-20 DSC result is superseded because it incorrectly placed H2/H8 into the DSC family. Official outcomes were joined only after each chart calculation, as the saved corrected evaluation audit records.

## Predeclared Expansion After an Empty No-Call Subgroup

Because the first fixed 20-game intake contains no no-call observations, the next and final initial expansion is **all eligible NPB regular-season games dated August 1–21, 2026**, joined to the already retained August 22–26 records. The date range is contiguous, the game order is chronological within each daily official slate, and no game may be included, excluded, or highlighted because of its chart output or final result. A candidate remains excluded only for a missing official completed-game record, missing reported start, unknown stadium coordinate, equal or absent archived two-sided pregame price, or unmatched team identity. Report the August 22–26 20-game evaluation and the August 1–26 combined cohort separately.
