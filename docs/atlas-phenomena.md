# Atlas Local Phenomena Registry

## Runtime Design

`atlas-phenomena-v1` is a versioned local registry. The Atlas calculation uses the same live Astronomy Engine geocentric tropical ecliptic-of-date longitude already selected for zodiac and houses. It performs all phenomena scans locally after calculating the chart; there is no website lookup at chart-render time.

| Phenomenon | Declared local trigger | Reported evidence |
|---|---|---|
| Retrograde | Signed central-difference longitude rate is negative; two samples are 0.25 days either side of the chart instant | Degrees per day, direct/retrograde state, and method |
| Kazimi | Shortest raw tropical Sun–planet distance is ≤ 0.5° | Sun distance and kazimi state; takes precedence over combustion display |
| Combustion | When not kazimi, shortest raw tropical Sun–planet distance is ≤ 15.0° | Sun distance, threshold, and state |
| Planetary-war proximity | Mars, Mercury, Venus, Jupiter, or Saturn pair distance is ≤ 1.0° | Named pair, distance, threshold, and declared rule |
| Essential dignity | Traditional seven-planet domicile, detriment, exaltation, fall, or neutral table | Status and scope |

## Dallas Live Baseline Check

The verified Dallas live calculation displays Mercury retrograde at approximately `-0.324°/day` and Venus retrograde at approximately `-0.226°/day`. Saturn remains combust at about `12.5°` from the Sun. No qualifying declared planetary-war pair falls within the `1.0°` threshold in this chart.

## Interface and Scholar Boundary

The full raw evidence is shown in the Atlas Audit Mode registry table, the selected-point panel, and the Atlas Scholar context. The Scholar receives conditions as computed data but is explicitly instructed not to invent missing phenomena or treat symbolic interpretation as factual certainty.

## Browser Verification

The updated Atlas route rendered the registry, motion states, solar conditions, and no-war result from the Dallas live chart. The browser console showed no application calculation or rendering error. Its only notice was the local Vite preview’s service-worker MIME warning for `/service-worker.js`; it is unrelated to the Atlas calculation or registry.
