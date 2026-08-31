# Firmament Engine Layer Inventory

## Purpose

This inventory compares `kevinparksinc-maker/firmament-engine` with `firmament-unified` before porting any code. The goal is to recover useful, auditable Sports Horary evidence without replacing Firmament unified’s topocentric event source, Ancient-Horizon house path, God–Agent separation, or existing scorecards.

## Repository decision

The current sports implementation is `firmament-unified` on `feat/zetetic-atlas`. The comparison repository is `firmament-engine` on `main`. The engine repository contains a broader recovered research package, but its dual-frame challenger explicitly states that it is not a byte-for-byte replay of a separate historical master engine and that its recovered extensions are experimental/read-only. Those boundaries must travel with any port.

## Classification

| Layer or module | Present in unified? | Port recommendation | Reason and boundary |
|---|---:|---|---|
| Current seven-layer Territorial foundation | Yes, through the existing Cluster/Territorial stack | Keep unified implementation | Do not replace the corrected topocentric Equal-House path. |
| KP Star → Sub → Sub–Sub family | Partial/current work | Port only missing evidence fields | Preserve the existing KP contract and avoid adding a second scorer. |
| Fixed-star amplifications | Partial | Port as read-only evidence first | Fixed-star contacts can be shown with source/orb/proximity; scoring requires explicit opt-in. |
| Retrograde condition | Not verified in unified’s current server modules | Port read-only first | Requires an explicit retrograde flag and a declared score policy. |
| Lunar flow | Not verified | Port read-only first | The recovered rule uses house position and fixed weights; it must not silently enter live scoring. |
| Chart-wide aspects | Partial/aspects already exist in current work | Reconcile, do not duplicate | Reuse unified aspect registry and orb policy; archive coefficients are not automatically authoritative. |
| Moon phase / VOC | Not verified | Port phase evidence only; defer VOC | The recovered implementation hard-codes VOC false and documents that historical VOC cannot be reconstructed. |
| Nodes (Rahu/Ketu) | Partial | Port missing evidence fields | Keep node treatment separate from ordinary planets and preserve mathematical-point provenance. |
| Upachaya growth | Not verified | Port read-only first | Recovered rule applies malefic-house bonuses; requires explicit method switch. |
| Via Combusta | Not verified | Port as evidence first | Fixed 15° Libra–15° Scorpio boundary must be shown explicitly; no hidden score. |
| Besiegement | Not verified | Port as evidence first | Recovered rule uses an 8° proximity to Mars and Saturn and must retain that exact limitation. |
| Mutual reception | Not verified | Port as evidence first | Requires sign-ruler registry and cross-cluster definition; score must remain optional. |
| Translation of light | Not verified | Port only with limitation label | Recovered implementation is a geometric approximation because applying/separating speeds are unavailable. |
| Harmonious vs friction aspects | Not verified as a separate layer | Port as non-scoring evidence first | Do not double-count aspects already used elsewhere. |
| Fixed God View J2000 frame | Different frame contract | Do not merge into Agent chart | Can be exposed as its own God View source; never rewrite topocentric Agent longitudes. |
| Agent moving-Ascendant frame | Different frame contract | Adapt only through `FirmamentPosition` | Agent rows must preserve local observer provenance and Ancient-Horizon option. |
| Full-package dual-frame challenger | No | Port only as experimental adapter after evidence layers | Keep `experimental-read-only`; no live winner, weights, or validation writes. |
| Backtest/validation runners | No | Do not port as live logic | Port reports and tests only after the calculation contract is stable. |

## Recovered limitations that must remain visible

The comparison engine’s full-package module identifies several non-equivalences. Its foundation is the current seven-layer Territorial implementation rather than a byte-for-byte execution of an independent master engine. Its chart-wide aspects use fixed coefficients and a conservative half-strength treatment. Its Moon phase layer sets VOC to false because the required historical data are unavailable. Its translation-of-light layer is explicitly geometric rather than a full applying/separating-speed calculation.

These limitations mean that the safest first port is an **evidence bundle**: each layer returns raw inputs, derived state, rule identifier, score candidate, provenance, and an `enabledForScoring` flag. The default must be read-only. A scoring switch may be introduced only after a dedicated regression and a benchmark-invariance test demonstrate that disabled layers do not change the existing Tyson–Douglas result.

## Source-frame contract

All Agent/event rows entering the unified geometry path must retain:

- the source label, such as `topocentric-agent`, `fixed-j2000-god`, or `zetetic-sky`;
- the observer and event provenance when applicable;
- the raw longitude and any source-native coordinates;
- the house system and orientation used for derived house assignment;
- the exact rule and orb used for each derived evidence row.

No recovered engine layer may infer a radius from screen coordinates, altitude, or longitude. Radial aspect strength remains unavailable until the source provides a declared finite radius.

## Port order

1. Port a typed read-only evidence contract and layer registry.
2. Port retrograde, Moon phase, nodes, Upachaya, Via Combusta, besiegement, mutual reception, and chart-wide aspect evidence with their limitations.
3. Reconcile fixed-star and KP evidence with unified’s existing registries.
4. Add an opt-in score switch only for layers with independent regression coverage.
5. Compare standard and inverse-180 outputs without modifying the existing live score path.
