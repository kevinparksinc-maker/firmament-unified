# Experimental Dome Seasonal-Radius Ascendant Specification

## Status

This document defines an isolated experimental calculation path for Firmament’s declared dome-model research. It does not replace the existing direct-axis chart and does not enter Sports scoring until a separate, explicitly reviewed integration is approved.

## Shared event inputs

The calculation requires a local civil date and time, an explicit timezone, the exact venue latitude and longitude, the day of year, a local angular input named `localSiderealAngleDegrees`, and an observer radial distance from Polaris or the disc center in the chosen model’s miles. The observer radial distance is mandatory because the proposed scaling equation cannot be evaluated safely without it.

The event input is converted to a single UTC instant for audit display. The seasonal-radius module does not derive the local angular input from the conventional Earth-rotation model; it accepts that value explicitly so its source can be declared separately.

## Configurable seasonal radius

The supplied design values are:

| Parameter | Default value | Meaning |
|---|---:|---|
| `radiusCancerMiles` | 1,600 | Tightest modeled solar path at the northern summer solstice |
| `radiusCapricornMiles` | 2,900 | Widest modeled solar path at the northern winter solstice |
| `cycleDays` | 365.25 | Configured annual cycle |
| `summerSolsticeDay` | 172 | Phase anchor for the tight Cancer radius |

The implementation uses:

```text
R_equinoctial = (R_Cancer + R_Capricorn) / 2
amplitude = (R_Capricorn - R_Cancer) / 2
phase = 2π × (dayOfYear - summerSolsticeDay) / cycleDays
solarRadius = R_equinoctial - amplitude × cos(phase)
```

The negative sign is intentional. It makes day 172 equal the 1,600-mile Cancer radius and places the wide Capricorn radius near day 355. This corrects the phase reversal in the supplied draft pseudocode.

## Angular velocity

The proposed variable angular rate is:

```text
angularVelocity = 15 × (R_equinoctial / solarRadius)
```

This is a model output and audit field. It does not automatically alter planetary motion or any sports score.

## Seasonal bearing offset

The supplied declination substitute is implemented as:

```text
maxDelta = observerDistanceFromPole - R_Cancer
bearingOffset = ((observerDistanceFromPole - solarRadius) / maxDelta) × 90
```

The observer distance must exceed the Cancer radius. The implementation rejects missing, non-finite, or invalid distances instead of inventing one.

## Proposed ancient-horizon Ascendant

The proposed horizon equation is:

```text
Asc = atan2(
  cos(localSiderealAngle),
  -(sin(bearingOffset) + cos(bearingOffset) × sin(localSiderealAngle))
)
```

The result is normalized to 0–360 degrees. The name `localSiderealAngleDegrees` is retained as an explicit input label for traceability, but this module does not claim that it has been derived from any conventional Earth-rotation theory.

## Non-scoring boundary

This module currently returns audit fields only: radius, annual phase, angular velocity, bearing offset, observer distance, local angular input, and proposed Ascendant. It does not overwrite the existing dome chart, conventional tropical reference, Placidus calculation, Territorial method, KP method, or any Sports Horary verdict.

The values 1,600 miles and 2,900 miles are configurable design assumptions supplied for this project. They are not presented here as independently established astronomical measurements. Any later integration must preserve the selected constants and source note in the visible calculation evidence.
