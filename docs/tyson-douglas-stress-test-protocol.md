# Tyson–Douglas Historical Stress Test Protocol

## Purpose

This record uses **Mike Tyson vs. James “Buster” Douglas** as a hard historical upset case. It is a transparent calibration exercise, not an accuracy claim. Its purpose is to make every applicable Sports Horary method show its real calculation trace against a known favorite-loss event.

## Frozen Event Record

| Field | Frozen value |
|---|---|
| Event | Mike Tyson vs. James “Buster” Douglas |
| Date / local instant | 11 February 1990, 09:00 Asia/Tokyo |
| Venue | Tokyo Dome, Tokyo, Japan |
| Coordinates | 35.7056, 139.7519 |
| Side A | Mike Tyson, documented pre-event favorite |
| Side B | James “Buster” Douglas, documented 42-to-1 underdog |
| Observed result | Douglas, Side B, tenth-round knockout |

The selected instant is the reported 9:00 AM local ring entry, not an independently confirmed bell-time timestamp. It is therefore fixed as a declared **calibration instant** and must never be adjusted after a method’s output is observed.

The Guardian’s historical reconstruction states that Tyson entered the ring at 9:00 AM on 11 February 1990 and identifies Douglas as a 42-to-1 underdog. The World Boxing Council confirms the date, Tokyo Dome location, Tyson’s dominant favorite status, and Douglas’s tenth-round knockout. [1] [2]

## Method Eligibility

| Method | Eligibility | Reason |
|---|---|---|
| Cluster / Layer Vote | Not comparable without a separately sourced legacy/manual chart record | It is a manual-chart compatibility protocol, not the strict live event-input path. |
| Frawley Event | Eligible | It accepts exact local date/time, venue, coordinates, and favorite mapping. |
| Tajika / Prasna | Eligible | It accepts the same strict event record and evaluates only its own declared yogas. |
| Panchanga / Team Archetype | Event calculation eligible; team compatibility must abstain | No source-backed historical team-style profiles are supplied. The profile gate must remain no-call. |
| God ↔ Agent | Eligible | God uses the frozen UTC instant; Agent uses the separately calculated Tokyo local Placidus field. |
| Cross-method ledger | Eligible only after two or more matched strict standard runs | It can describe convergence, conflict, or no-direction without a pooled score. |

## Non-Negotiable Boundaries

The result is held out of all calculation inputs. The market favorite label is used only for the post-geometry Side A/Side B contextual map. The inverse God-axis orientation remains a mechanical, audit-only complement; it cannot be selected after seeing Douglas’s win. No method may receive a custom rule because this bout was an upset.

## Frozen Standard-Orientation Results

The calculations below used the frozen 09:00 Asia/Tokyo calibration instant. The result provenance was attached only after every route returned. The standard orientation is the only result considered for a method comparison; inverse outputs are stored in the replay audit solely to show their mechanical orientation behavior.

| Method | Standard result | Visible calculation evidence | Relationship to observed Douglas win |
|---|---|---|---|
| Frawley Event | **Side A / Mike Tyson favored** | Aries H1 at 16.55°; Mars as L1; Capricorn H10 at 279.69°; Saturn as L10. The qualifying Moon candidate was a 120° aspect to Mars, 315.9 minutes from the event. | Did not match the observed Side B win. This is an adverse calibration case, not a reason to retroactively change the method. |
| Tajika / Prasna | **No decisive completion — no-call** | No qualifying direct L1–L10 or L7–L4 completion. Two Eesaphala separations; no Nakta/Yamaya bridges; no Kamboola; Venus/Saturn conjunction recorded as supporting Graha Yuddha context. | No directional claim; therefore it neither selected nor rejected the observed winner. |
| God ↔ Agent Flow | **Neutral / no-call** | God View tied at 1 ASC / 1 DSC / 5 quadrature. Agent View was ASC family 6, DSC family 1, neutral 0. Synthesis remained neutral because God had no direction. | No directional claim; therefore it neither selected nor rejected the observed winner. |
| Panchanga / Team Archetype | **Not run — profile gate** | Historical source-backed team archetype profiles were not supplied. The live Panchanga calendar portion is eligible, but compatibility must abstain rather than fabricate profiles. | Correct no-fabrication behavior. |
| Cluster / Layer Vote | **Tyson / Side A — separately reported legacy result** | The current legacy compatibility route was reproduced from a live ephemeris chart constructed at the frozen calibration instant. It uses declared Equal Houses from the exact Ascendant: Territorial chose A (42.56 vs −18.38); KP Stellar chose A (27.00 vs 3.50); the visible layer-vote result was A 5, B 2, with 7 ties. | Did not match the observed Side B win. This manual-chart compatibility result remains excluded from the strict-method ledger. |

## Visible Audit Verification

The standard Frawley, Tajika/Prasna, and God–Agent routes were each submitted through the Sports Horary UI with the same retained record. The result panels displayed their inputs, all seven traditional planets and local Placidus houses, method settings, applicable evidentiary records, and explicit no-call or directional rules. The cross-method ledger retained Frawley as Side A/Favorite and Tajika plus God–Agent as no-call, then correctly described the state as **one directional method**, not a cross-method consensus.

The God–Agent panel additionally displayed its raw God RA/declination sectors, Agent family matrix, secondary major-aspect rows, and stadium-local observer coordinates. All secondary aspects and topocentric coordinate values were labelled unscored; no row changed the synthesis.

## Legacy Cluster / Territorial / KP Reproduction

After the strict-method review, the legacy Cluster compatibility path was also rerun from the same declared calibration instant. The event chart was first produced by `ephemeris.calculate`, then its pre-event placements, Ascendant, and Equal House cusps were supplied to the existing `sportsHorary.askWithChart` route. Neither the observed winner nor any post-fight fact entered this request.

The first audit exposed a material house-system mismatch. The ephemeris rows carried Whole Sign labels, while the legacy Cluster builder simultaneously derived house lords and Lots from continuous 30° Equal Houses anchored at the exact Ascendant. For example, 8.98° Capricorn appeared as Whole Sign H10 but belongs to Equal House H9 from a 16.55° Aries Ascendant. The old `placement.house ?? equalHouseFromLongitude` fallback allowed the Whole Sign label to control some legacy layers. That output is superseded below and is not a valid Tyson–Douglas result.

The correction preserves each raw longitude, explicitly reassigns every planet from the exact Ascendant before Territorial Control, KP, Lots, or any Cluster vote runs, and displays both values in the UI. The Whole Sign column remains available as a labelled ephemeris reference only; it is not a scored Cluster input.

| Legacy audit field | Standard map, corrected Equal House basis | 180° inverse audit, corrected Equal House basis |
|---|---:|---:|
| Public Cluster result | Favorite / Side A (Tyson) | Favorite / Side A (Tyson) |
| Territorial Control layer vote | A 42.56; B −18.38 | A 35.24; B −32.40 |
| KP Stellar layer vote | A 27.00; B 3.50 | A 25.50; B 8.00 |
| Eligible layer choices | A 5; B 2; ties 7 | A 5; B 2; ties 7 |
| Side B layers in the standard result | Lunar Flow; Chart-wide Aspects | Chart-wide Aspects; Translation of Light |
| Detailed Territorial report (separate additive scale) | A +16.75; B −3.56 | A −8.88; B −15.69 |

This corrected reproduction still does **not select Douglas** for this fixed record. It is less lopsided than the superseded mixed-house run, changing from 6–1 to 5–2 eligible layer choices, but it remains a Tyson/Side A output. The repository history contains no saved Tyson–Douglas payload or committed result showing Territorial or KP selecting Douglas. A remembered Douglas-side output therefore cannot be treated as evidence until its exact timestamp, manual placements, Ascendant/cusps, orientation, code revision, and full layer record are supplied and rerun.

The legacy route now has an explicit **Equal House compatibility contract** that remains separate from the strict tropical-Placidus event charts used by Frawley, Tajika/Prasna, and the Agent receiver. The different house systems are visibly named and must not be pooled.

## References

[1] [The Guardian — *From the Vault: Mike Tyson is knocked out by 42–1 underdog Buster Douglas*](https://www.theguardian.com/sport/blog/2015/feb/11/mike-tyson-underdog-buster-douglas-boxing-from-the-vault)

[2] [World Boxing Council — *36 Years Ago Buster Douglas Stopped the “Baddest Man on the Planet”*](https://wbcboxing.com/en/36-years-ago-buster-douglas-stopped-the-baddest-man-on-the-planet/)
