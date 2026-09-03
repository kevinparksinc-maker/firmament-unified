# New Framework Review Specification

## Purpose

The attached blueprint is being treated as a **user-specified experimental framework**, not as an external scientific or historical authority. Its purpose is to define a transparent calculation path for the Firmament sports application while preserving a separate personal-chart path for Lumen Atlas.

## Confirmed Core Contracts

| Contract | Proposed rule | Scope | Status |
|---|---|---|---|
| Epoch | J2000: 2000-01-01 12:00 UTC | Both only if explicitly adopted | Review required |
| Canopy rotation | 360° / 86164.0905 seconds | Firmament display/frame | Review required |
| Solar daily rate | 360° / 86400 seconds | Firmament model | Review required |
| Degree normalization | Modulo 360 into [0°, 360°) | Both | Compatible |
| Celestial formatting | Decimal degree to degree/minute/second | Both | Compatible |
| Part of Fortune | Ascendant + Moon − Sun | Both as a Lot calculation | Compatible in principle |
| Lot of Victory | Ascendant + Jupiter − Mars | Firmament sports only | Sports-only |
| Lot of Strife | Ascendant + Mars − Saturn | Firmament sports only | Sports-only |
| Contender assignment | Home/favorite → H1; away/underdog → H7 | Firmament sports only | Must be reconciled with current God–Agent rules |
| Lunar stations | 28 divisions of 12.857142° | Firmament sports only unless separately requested | Incomplete registry |
| Due-east Ascendant | Exact zodiac point crossing local due-east horizon line | Both only if adopted | Requires a precise geometry contract |

## Conflicts Requiring Resolution

The attachment contains multiple competing Ascendant and house rules. It describes a due-east horizon crossing, but its sample Dallas value uses a mocked Ascendant of 298° while the current Lumen Atlas direct-angle model produces 234.703° and the current Firmament standard ephemeris produces 97.380°. Those are materially different coordinate frames. No application should silently replace its current Ascendant until the user selects the authoritative new rule and supplies a validation fixture.

The attachment also states that the Moon at 20° Cancer is in the eighth Arabic mansion while simultaneously defining 28 equal stations. Under the stated 360°/28 width, 20° Cancer is approximately 110°, which is station index 8 using zero-based indexing, not index 7. The supplied registry is incomplete and includes a fallback placeholder. A production implementation must not use that fallback or label an incomplete station list as validated.

The attached sports quadrant code is internally inconsistent: its comments mention home houses 1, 2, and 11 and away houses 7, 8, and 9, while the implementation checks home houses 1, 2, 11, 12 and away houses 6, 7, 8, 9. This must be resolved before activation. It also differs from Firmament’s existing ASC/DSC family logic and from the newer God–Agent synthesis layer.

## App Separation

**Firmament** may adopt the J2000/canopy display frame, 28-station lunar registry, Part of Fortune, Victory, Strife, contender assignment, and quadrant scoring only as explicitly versioned sports layers. These layers must expose raw longitude, formula, house assignment, candidate score, and provenance.

**Lumen Atlas** may use the Part of Fortune formula as a displayed natal Lot, but its personal-chart interpretation must not inherit sports contender assignments, Victory/Strife scoring, home/away quadrants, or prediction probabilities. Its current direct-angle Ascendant and Equal House model must remain separately labeled unless the user explicitly approves replacing it.

## Implementation Gate

Before changing live calculations, the user must choose one Ascendant contract for the new framework, confirm whether the J2000 canopy orientation is a display-only coordinate or the zodiac source of truth, approve a complete 28-station registry, and resolve the quadrant-house discrepancy. Until then, implementation should be limited to typed specifications, comparison output, and isolated tests.

## Dallas Equation Validation Result

The attached sequence was executed with 1986-11-20 16:06:00 UTC, latitude 32.7767°, and longitude −96.797°. The J2000 canopy clock is 20.416878°. Applying the stated `canopyClock + localLongitude` operation yields a local canopy position of 283.619878°. Passing that value into the supplied due-east `atan2` equation yields a raw geometric Ascendant of 191.593735°. Applying the stated 106.406° post-equation correction yields 297.999735°, which rounds to the locked 298.000° Dallas target.

The important distinction is that 191.593735° is the raw geometric Ascendant output, not the local canopy position input. The new modules preserve those separate stages and label 106.406° as an empirical calibration fixture rather than a universal physical constant. The 212.476° value has not been used because the returned framework does not provide a reproducible equation that validates it.

## Executable Vector Regression Results

The executable implementation produces these corrected vectors using the same post-equation correction of 106.406°:

| Location | UTC | Local canopy position | Raw geometric Ascendant | Corrected Ascendant |
|---|---|---:|---:|---:|
| London | 2024-01-01 00:00 UTC | 179.565321° | 116.255314° | 222.661314° |
| Tokyo | 2024-06-15 12:00 UTC | 303.453729° | 207.676137° | 314.082137° |
| Sydney | 2024-09-20 18:30 UTC | 148.387483° | 48.709896° | 155.115896° |

These are the values asserted by the regression suite. They differ from the three vector outputs printed in the returned framework document, so the executable test results are treated as canonical for this code branch.
