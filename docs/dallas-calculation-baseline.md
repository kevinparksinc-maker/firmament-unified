# Dallas Calculation Baseline Audit

**Scope.** This record reconciles the Dallas test input only. It does not treat a symbolic chart model as evidence for event prediction, and it does not change Firmament’s separate legacy natal or sports calculation paths.

## Declared Active Baseline

| Component | Active Atlas convention |
|---|---|
| Input instant | `1986-11-20 10:06` in `America/Chicago` → `1986-11-20T16:06:00.000Z` |
| Planetary longitude | Live Astronomy Engine geocentric tropical ecliptic-of-date longitude |
| Direct axes | `MC = UTC° + geographic longitude`; `ASC = MC + 90°` |
| Houses | Equal Houses, twelve 30° intervals beginning at the direct Ascendant |
| Map separation | RA/declination is Gleason placement; topocentric azimuth/altitude is compass placement; neither changes the tropical longitude or house |

For the Dallas input, the direct calculation is `UTC° = 241.500°`, `MC = 144.703°`, and `ASC = 234.703°`. The active source is named in the Atlas data contract as **`atlas-live-engine-v1`**.

## Mars Reconciliation

| Source or convention | Mars raw longitude | Sign / degree | Axis and houses | Mars house |
|---|---:|---|---|---:|
| Live Atlas, Astronomy Engine | 326.3519766° | Aquarius 26.352° | Direct ASC 234.703°, Equal Houses | 4 |
| JPL Horizons independent check | 326.3519605° | Aquarius 26.352° | Ecliptic-of-date observer longitude; no house system requested | — |
| Legacy natal engine | 326.3517417° | Aquarius 26.352° | Sidereal-time axis; ASC 277.380°, Whole Sign | 2 |
| Supplied historical row | 235.0000000° | Scorpio 25.000° | Direct ASC 234.703°, Equal Houses | 1 |

The live Atlas and JPL values differ by approximately **0.0000161°** (about **0.058 arcseconds**), which is consistent with representation and rounding differences. JPL describes quantity 31 as observer-centered IAU76/80 **ecliptic-of-date** longitude and latitude, including stated apparent-position corrections.[1]

The historical row’s House 1 result is mathematically consistent **only with its own supplied longitude**: `(235.000° − 234.703°) mod 360 = 0.297°`, which is inside House 1. The live longitude instead gives `(326.3519766° − 234.703°) mod 360 = 91.6489766°`, which falls in House 4. Therefore, this is a **91.3519766° raw-longitude source conflict**, not a cusp-boundary or house-label error.

## Decision and Boundary

The active public Atlas remains on the previously approved dynamic live Astronomy Engine path. The supplied `235°` value is retained only as a historical/manual reference for auditing; it must never be injected as live ephemeris data or silently combined with a live calculation. The legacy natal engine remains a separately labelled convention stack, and it must not feed the isolated Atlas route.

## Focused Validation

| Check | Result |
|---|---|
| Atlas calculation regressions | Passed: 3 tests, including live Mars `326.35198°` / House 4 and historical-only `235°` / House 1 math |
| Atlas Scholar provenance contract | Passed: 2 tests |
| Legacy natal, sports, and Scholar focused regressions | Passed: 8 tests across 3 suites |
| Browser route check | Atlas rendered with the `atlas-live-engine-v1` badge, ecliptic-of-date source, direct-axis formula, Equal-House statement, and Mars as Aquarius 26.4° / H4; browser console showed no errors |

## References

[1]: https://ssd.jpl.nasa.gov/horizons/manual.html "JPL Horizons System Manual — Observer ecliptic longitude and latitude"
