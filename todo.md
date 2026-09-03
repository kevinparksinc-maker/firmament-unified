# ARCANA STATE — TODO

- [x] Initial app build with full astrology engine (natal + transit parsing, Mind/Soul/Spirit pillars)
- [x] Dark cosmic design (Cinzel + Crimson Pro, starfield, amber accents)
- [x] Collapsible reading sections (Mercury/Moon/Sun/Activations/Synthesis)
- [x] Upgrade to full-stack (tRPC + server)
- [x] Add tRPC endpoint for screenshot OCR (POST /api/trpc/ocr.extractText) using LLM vision
- [x] Build multi-screenshot upload UI for Natal Chart panel (drag-drop + click, multiple files)
- [x] Build multi-screenshot upload UI for Current Transits panel (drag-drop + click, multiple files)
- [x] Show image thumbnails with remove button after upload
- [x] Show OCR extraction status (loading spinner per image)
- [x] Append extracted text from all screenshots into the textarea (merged, deduplicated)
- [x] Keep manual text editing still possible after OCR extraction
- [x] Pre-populate natal textarea with user's extracted chart data as default example
- [x] Fix mobile layout: stack input panels single column on mobile
- [x] Improve the parser to accept degree formats like "03° 27'" (with minutes) from astrology apps
- [x] Add "Clear" button per panel to reset textarea and thumbnails
- [x] Fix OCR natal prompt: map North Node → Rahu, South Node → Ketu, never output "Transit" prefix for natal
- [x] Fix parser: accept "North Node" and "South Node" as aliases for Rahu/Ketu
- [x] Fix parser: handle column-style format "Sun Scorpio 03° 27' 12" (no colon, sign before degree)
- [x] Allow reading with natal only, transit only, or both — remove the "need both" requirement
- [x] Show different reading modes: natal-only shows natal chart analysis, transit-only shows current sky reading, both shows full transit-to-natal reading
- [x] Add tRPC endpoint: ai.interpretNatal — uses LLM to generate rich natal chart reading (Mind/Soul/Spirit sections) from placements alone
- [x] Add tRPC endpoint: ai.interpretTransits — uses LLM to generate transit-only sky reading
- [x] Update frontend: when natal-only mode, call ai.interpretNatal and show rich AI sections instead of "no transit pressure" messages
- [x] Show AI interpretation inline in the collapsible sections (streaming or full response)
- [x] Add fixed star database (Royal Stars, Polaris, Pleiades, Spica, Regulus, Antares, Aldebaran, Fomalhaut, Vega, etc.) with their sidereal degrees
- [x] Add fixed star conjunction detection — flag when a natal planet is within 1-2° of a fixed star
- [x] Update parser to accept all planets including Pluto, Neptune, Uranus
- [x] Update normalizePlanet to map Pluto/Neptune/Uranus correctly
- [x] Update AI system prompt to read from ancient fixed-star cosmology framework (no precession, no heliocentric spin, fixed dome sky, Polaris as still center)
- [x] Include fixed star conjunctions in the AI reading prompt so it interprets them
- [x] Update app subtitle/description to reflect the ancient cosmology framework
- [x] Add database table for saved charts (user_id, chart_name, placements, created_at, updated_at)
- [x] Add tRPC endpoints: charts.save, charts.list, charts.load, charts.delete
- [x] Build UI: "Save this chart" button in natal panel
- [x] Build UI: "Load saved chart" dropdown/modal to select and load previous charts
- [x] Build UI: "Delete chart" option in the saved charts list
- [x] Show which chart is currently loaded in the header
- [x] Install astronomy-engine or astronomia JS library for topocentric ephemeris calculations
- [x] Build server-side ephemeris endpoint: birth date + time + lat/lng → topocentric planet positions with parallax
- [x] Build Polich-Page topocentric house cusp calculator
- [x] Build birth data input form (date, time, city/coordinates)
- [x] Add geocoding: city name → lat/lng via backend
- [x] Build Snow Globe 3D dome renderer using Three.js (parabolic dome, North Pole origin, Polaris fixed at center)
- [x] Map topocentric Alt/Az positions onto the parabolic dome surface
- [x] Animate diurnal rotation of all planets/stars around Polaris
- [x] Wire calculated positions into the reading engine (replace manual paste with auto-calculated)
- [x] Keep manual paste as fallback option
- [x] Add Royal Stars (Watchers) and major fixed stars to Snow Globe dome as permanent glowing points
- [x] Give the four Royal Stars (Antares, Aldebaran, Regulus, Fomalhaut) special gold/royal treatment — larger, brighter, with Watcher labels
- [x] Add fixed star conjunction highlights in the reading when a natal planet is near a Royal Star
- [x] Add Ascendant (AC) and Descendant (DC) to ephemeris output and formatChartForReading
- [x] Add MC (Midheaven) and IC to ephemeris output
- [x] Build 2D SVG house wheel component showing all 12 houses with sign cusps and planet placements
- [x] Show the wheel after birth data calculation

## Recovered engine layer port

- [x] Define a source-neutral read-only evidence contract for recovered Sports Horary layers
- [x] Port recovered extension evidence with explicit provenance and limitations
- [ ] Reconcile fixed-star and KP evidence with the existing topocentric geometry contract
- [ ] Preserve separate God View, Agent View, and inverse-180 frame rules
- [x] Add explicit opt-in scoring switches without changing the default live path
- [x] Add layer unit tests and disabled-score invariance coverage
- [ ] Rerun the full test suite and Tyson–Douglas benchmark after integration
- [x] Document experimental, unavailable, and intentionally separate layers

## New framework specification

- [x] Formalize the attached J2000 canopy and due-east Ascendant contract
- [x] Add a complete, validated 28-mansion registry without placeholder entries
- [x] Add auditable Part of Fortune, Victory, and Strife Lot outputs
- [x] Preserve topocentric source provenance while separating display frame from prediction layers
- [x] Add framework regression fixtures for the Dallas chart and sports event charts
- [ ] Reconcile the new framework with God View, Agent View, and inverse-180 rules

## Confirmed new framework implementation

- [x] Implement the validated Dallas 298° Capricorn Ascendant baseline and due-east/local-zenith geometry contract
- [x] Keep raw ephemeris longitudes separate from mechanical canopy speed calculations
- [x] Replace the placeholder lunar-station mapping with a complete 28-station registry
- [x] Implement Whole Sign Part of Fortune with day/night sect branching
- [x] Implement Lot of Victory and Lot of Strife as sports-only layers
- [x] Bind Home to H1 and Away to H7 while scoring Home 1/2/11 and Away 7/8/9 only
- [x] Add neutral handling for Victory Lot placements outside both quadrants
- [x] Expose the new framework’s formulas and provenance in the sports audit output
- [x] Keep Lumen Atlas limited to personal Part of Fortune display; do not import sports scoring
- [x] Add focused framework tests and rerun relevant regressions

## Canopy alignment offset

- [ ] Validate CANOPY_ALIGNMENT_OFFSET = 212.476° against the supplied due-east Ascendant equation
- [x] Record the derived canopy-LST transformation and its Dallas 298.000° fixture result
- [x] Reject silent fallback to standard sidereal time when the canopy frame is selected

## Validation blocker discovered

- [x] Resolve the attachment’s inconsistent Dallas canopy-clock arithmetic: shown inputs yield local canopy position 283.620°, not 191.594°
- [x] Resolve the supplied due-east equation mismatch: the corrected sequence uses local position 283.620° → raw Ascendant 191.594° → 298°
- [x] Do not activate the new Ascendant in live Firmament predictions until the transform passes an independent Dallas fixture

## Returned framework implementation review

- [x] Validate the returned canopy/LST/Ascendant code against the Dallas 298.000° audit chain
- [x] Reconcile the returned 28-mansion registry and its source/naming claims with the existing registry
- [x] Reconcile returned sect, Lot, and sports scoring functions with existing Firmament modules
- [x] Keep the 106.406° value labeled as an empirical calibration fixture, not a universal physical constant
- [x] Preserve Lumen Atlas isolation and keep God View, Agent View, and inverse-180 layers separate

## Confirmed canopy integration contract

- [x] Add ChartMode.STANDARD_TOPOCENTRIC and ChartMode.CANOPY_LOCAL without overwriting current houses
- [x] Store 106.406° in a versioned location/epoch calibration registry with warning fallback
- [x] Archive 212.476° outside active calculations
- [x] Use geocentric ecliptic longitudes for canopy Lots/Houses and retain topocentric comparison data
- [x] Use topocentric Sun altitude for sect determination
- [x] Keep 28 Arabic mansions and 27 Vedic Nakshatras as independent layers
- [ ] Route God View, Agent View, and inverse-180 through explicit ChartMode adapters
- [ ] Keep canopy mode EXPERIMENTAL_CANOPY until Tyson–Douglas plus 10-game validation gates pass
