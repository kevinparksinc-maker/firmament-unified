# Atlas Aspects and Configurations Registry

## Calculation Boundary

`atlas-aspects-v1` runs locally after the active Atlas chart is calculated. It uses only live geocentric tropical longitudes from the established Atlas baseline. It does not change planetary longitude, direct UTC-degree axes, Equal-House placement, RA/declination, or topocentric compass values.

| Rule family | Declared method |
|---|---|
| Major aspects | Conjunction `0° ± 8°`, sextile `60° ± 4°`, square `90° ± 6°`, trine `120° ± 6°`, opposition `180° ± 8°`, quincunx `150° ± 3°` |
| Applying/separating | Compares the current aspect orb with a one-day forward projection from each planet’s local, 12-hour central-difference longitude speed |
| Angle contacts | Planet within `5°` of the Atlas direct Ascendant, Descendant, Midheaven, or Imum Coeli |
| Stelliums | Three or more live planets in one tropical sign or one direct-Ascendant Equal House |
| Dispositors | Traditional sign-ruler chain only: Mars, Venus, Mercury, Moon, Sun, Jupiter, and Saturn are the rulers used |
| Mutual reception | Each of two planets occupies a tropical sign ruled by the other under the same traditional-ruler table |
| Named geometry | Grand Trine, T-Square, Grand Cross, Yod, and Kite only when every component aspect is detected under the declared limits |

## Dallas Live Output

The current Dallas live baseline reports a Sun–Mars square with a `1.7°` orb and a separating state. It identifies a Sun–Ascendant contact at `3.3°` and Mars–Imum Coeli contact at `1.6°`. The scanner reports a Scorpio sign stellium of Sun, Mercury, Venus, and Pluto; direct Equal-House clusters in House 1 and House 12; and two detected Grand Trines. It reports no mutual reception and does not label absent named configurations as present.

## Interface and Scholar Boundary

The Atlas Audit Mode shows each aspect’s pair, type, raw separation, orb, and state. It separately lists angle contacts, stelliums, mutual reception, named configurations, and traditional dispositor chains. The selected-point panel lists only the aspects and angle contacts involving that point. Atlas Scholar receives this same calculated payload and is instructed to cite it rather than invent a combination or mix a different house convention.

## Browser Verification

The updated Atlas route rendered the registry and showed applying/separating states from live motion rather than static-angle placeholders. Browser console output contained no calculation or rendering error; the only message was the development-preview service-worker MIME warning for `/service-worker.js`, unrelated to the Atlas scanner.
