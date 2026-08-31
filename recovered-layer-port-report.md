# Recovered Sports Horary Layer Port

## Overview

This report documents the inventory and porting of missing Sports Horary layers from the `firmament-engine` repository into the active `firmament-unified` sports build. The goal was to recover useful, auditable evidence without replacing Firmament unified’s topocentric event source, Ancient-Horizon house path, God–Agent separation, or existing scorecards.

## Inventory and Classification

The comparison repository (`firmament-engine`) contained a broader research package, but its dual-frame challenger explicitly stated that it was not a byte-for-byte replay of a separate historical master engine and that its recovered extensions were experimental/read-only. Those boundaries were preserved during the port.

The following layers were classified and ported as a **read-only evidence bundle**:
- **Fixed-star amplifications**: Conjunctions within a 1° orb.
- **Retrograde condition**: Penalties for retrograde planets in scoring houses.
- **Lunar flow**: Flow values based on the Moon's house position.
- **Chart-wide aspects**: Major aspects with conservative half-strength treatment.
- **Moon phase**: Phase determination based on solar separation.
- **Nodes (Rahu/Ketu)**: Bonuses for nodes in angular houses.
- **Upachaya growth**: Bonuses for malefics in Upachaya houses.
- **Via Combusta**: Penalties for planets in the 15° Libra–15° Scorpio span.
- **Besiegement**: Penalties for planets within 8° of both Mars and Saturn.
- **Mutual reception**: Cross-family mutual reception bonuses.
- **Translation of light**: Geometric approximation of translation.
- **Harmonious vs friction aspects**: Cross-family aspect scoring.

## Implementation Details

1. **Source-Neutral Evidence Contract**: A typed, source-neutral adapter (`server/recoveredLayerEvidence.ts`) was created to expose raw evidence and candidate scores while defaulting every recovered extension to read-only.
2. **Live Ephemeris Bridge**: The adapter includes a bridge (`buildRecoveredEvidenceFromEphemeris`) that consumes the existing topocentric `EphemerisResult` directly, preserving raw longitude, house, motion, azimuth, altitude, and source provenance without recalculating or reinterpreting houses.
3. **Opt-In Scoring**: An explicit score-summary function (`summarizeRecoveredLayerScores`) was added so recovered layers can be opted in later without silently modifying the live prediction engine or blending evidence twice.
4. **Deterministic Testing**: Unit tests (`server/recoveredLayerEvidence.test.ts`) were added to verify layer ordering, provenance, disabled-score invariance, and the preservation of archive limitations (e.g., VOC, translation, aspect duplication).

## Validation Boundary

The new adapter and its tests pass independently. However, the full repository test suite revealed two inherited natal-axis failures (`server/natalChartValidation.test.ts`) that are unrelated to the recovered sports adapter. Additionally, no Tyson–Douglas fixture exists in the unified repository for benchmark invariance testing.

Therefore, the recovered layers are currently integrated as an **isolated, read-only evidence module**. Full live integration and benchmark replay remain pending until the inherited repository issues are resolved and the necessary fixtures are added.

## Next Steps

- Resolve the inherited natal-axis failures in `server/natalChartValidation.test.ts`.
- Add the Tyson–Douglas benchmark fixture to the unified repository.
- Reconcile fixed-star and KP evidence with the existing topocentric geometry contract.
- Wire the recovered evidence adapter into the live prediction response.
- Rerun the full test suite and benchmark invariance checks after integration.
