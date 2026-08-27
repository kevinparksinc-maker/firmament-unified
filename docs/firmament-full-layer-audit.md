# Firmament Full Calculation Layer Audit

## Audit Purpose and Classification Rules

This register records how each implemented Firmament calculation layer is actually used. A layer can be **canonical calculation**, **derived interpretation**, **local observation**, **explicitly unscored context**, **separate sports method**, **legacy/manual compatibility path**, or **not active in the current Sports Horary conclusion**. A visible layer is not automatically a scored layer, and no layer may be treated as part of a composite result unless the relevant protocol says so.

The Atlas/Gleason module and Sports Horary methods are intentionally separate. The first applies the app’s declared natal/map framework; the second exposes independently selectable event-analysis protocols. Their numbers must not be silently combined.

## Frozen Inventory

| Audit group | Implemented layer | Primary code surface | Expected classification | Audit status |
|---|---|---|---|---|
| Atlas coordinates | Live tropical planetary longitude and motion | `client/src/lib/zeteticAtlas.ts` | Canonical Atlas calculation | In review |
| Atlas coordinates | Direct UTC-degree ASC/MC/DSC/IC | `client/src/lib/zeteticAtlas.ts` | Canonical Atlas calculation | In review |
| Atlas houses | Equal 30° houses from direct ASC | `client/src/lib/zeteticAtlas.ts` | Canonical Atlas calculation | In review |
| Atlas sky/map | RA/declination Gleason projection and local compass coordinates | `client/src/lib/zeteticAtlas.ts`, `polar-projection.ts` | Separate map/observation layers | In review |
| Atlas lunar system | Tropical 27 lunar mansions / nakshatras and padas | `client/src/lib/nakshatra.ts` | Derived Atlas context | In review |
| Atlas division | Chaldean decans | `client/src/lib/decan.ts` | Derived Atlas context | In review |
| Atlas stellar context | Fixed-star proximity catalog | `client/src/lib/fixedStars.ts` | Derived Atlas context | In review |
| Atlas interpretation | Dignities, strict combustion, retrograde/stations, planetary wars, aspects | `atlasDignities.ts`, `atlasPhenomena.ts`, `atlasAspects.ts` | Derived Atlas context | In review |
| Legacy sports method | Cluster/Territorial layer vote, including KP/Lots helpers | `server/masterPredictionEngine.ts`, `server/kpEngine.ts`, `server/layerVoteEngine.ts` | Separately selectable legacy/manual method | In review |
| Sports method | Frawley Event | `server/frawleyEventEngine.ts` | Separately selectable strict event method | In review |
| Sports method | Tajika/Prasna | `server/tajikaPrasnaEngine.ts` | Separately selectable strict event method | In review |
| Sports method | Panchanga / Team Archetype | `server/panchangaArchetypeEngine.ts` | Separately selectable strict event plus required profile method | In review |
| Sports method | God Axis / God–Agent Family Flow | `server/godAgentFlowEngine.ts` | Separately selectable strict event method | In review |
| Sports synthesis | Cross-method protocol ledger | `client/src/lib/sportsProtocolLedger.ts` | Non-scoring agreement/conflict ledger | In review |

## Audit Decision Standard

Each row will receive one of the following findings: **verified as declared**, **verified but context-only**, **implementation defect corrected**, **needs dedicated test**, **not active in the relevant public conclusion**, or **requires a separately versioned protocol before scoring**. The final report will state the exact conclusion boundary for every layer.
