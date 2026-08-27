# Frawley Event-Chart Implementation Notes

## Placidus Service Dependency Review

The active Cluster/Territorial and Atlas calculators must not be repurposed for the Frawley house path. Frawley uses a distinct Placidus chart at the real event time and venue.

| Candidate | Finding | Implementation decision |
| --- | --- | --- |
| `@swisseph/node` 1.3.1 | It documents a Placidus `calculateHouses` API, but its package metadata declares `AGPL-3.0`. | Not added to this project. |
| CircularNatalHoroscopeJS | Its repository documents Placidus house support and declares the Unlicense. The newest repository commit visible during review was approximately five years old. | Use only its Placidus cusp calculation through a narrow adapter and validate it with local fixtures before treating it as an active method. |

The selected adapter must return its source, house-system label, raw H1–H12 cusps, Ascendant, MC, and explicit error/no-call state. Planetary longitudes and signed speeds remain sourced from the existing live Astronomy Engine path, not from the cusp dependency.

## Local Preview Check

The local `/sports` preview was visually blank in the browser capture, but the page mounted correctly: DOM inspection found the Frawley and Tajika/Prasna selector text and controls, and computed styles confirmed the intended dark body background with visible light text. Its browser console contained no application exception; it only reported a development-only service-worker registration failure because `/service-worker.js` returned HTML rather than JavaScript. Deterministic engine, procedure, DOM, and computed-style checks remain the verification evidence; the blank capture is treated as a capture-environment artifact, not a product render failure.

All three method buttons are mounted with Cluster active and Frawley/Tajika inactive. A console-originated untrusted `.click()` did not alter the controlled tab selection, so browser interaction verification proceeds with a normal pointer click using measured DOM coordinates rather than treating that console behavior as an application defect.

A normal browser click selected the Frawley tab, exposed the strict venue-coordinate and favorite-source fields, and accepted the frozen Target Field June 27, 2026 record. The resulting interface displayed the standalone `frawley-event-v1` Placidus record, UTC instant, four-significator table, raw H1–H12 cusp disclosure, Moon completion candidate, and `NO CALL` explanation. No cluster score, KP result, or confidence percentage appeared in that method result.

## References

[1]: https://www.npmjs.com/package/@swisseph/node "@swisseph/node package documentation and metadata"
[2]: https://github.com/0xStarcat/CircularNatalHoroscopeJS "CircularNatalHoroscopeJS repository and license"
