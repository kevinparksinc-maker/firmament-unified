# Atlas Dignity and Combustion Contract

## Scope

The isolated Zetetic Atlas exposes four traditional essential-dignity states for the seven traditional planets only: **domicile**, **detriment**, **exaltation**, and **fall**. A traditional planet with none of those statuses is labelled **Neutral essential dignity**. Uranus, Neptune, Pluto, nodes, and angles are visibly labelled **No classical essential dignity assignment**; the system does not invent a traditional dignity for them.

| Status | Rule |
|---|---|
| Domicile | Planet occupies one of its traditional ruling signs |
| Detriment | Planet occupies the sign opposite one of its traditional ruling signs |
| Exaltation | Planet occupies its declared traditional exaltation sign |
| Fall | Planet occupies the sign opposite its declared traditional exaltation sign |
| Neutral | Traditional planet has none of the four statuses above |

## Strict Combustion

The active rule is intentionally explicit:

> A non-Sun planet is **combust** when the shortest raw tropical-longitude distance to the live Sun is **15.0° or less**.

The Atlas records the raw distance, the fixed threshold, applicability, and outcome. Combustion does not change the live longitude, sign, house, dignity, RA/declination, or compass coordinates.

## Dallas Live Baseline Evidence

| Body | Live longitude | Dignity | Sun distance | Strict combustion |
|---|---:|---|---:|---|
| Saturn | Sagittarius 10.59° | Neutral essential dignity | about 12.55° | Combust |
| Mercury | Scorpio 13.37° | Neutral essential dignity | about 14.67° | Combust |
| Jupiter | Pisces 13.20° | Domicile | about 105.16° | Not combust |
| Venus | Scorpio 5.46° | Detriment | about 22.58° | Not combust |

## Validation

The Dallas browser route rendered the dignity and combustion audit columns, including Saturn as `Combust · 12.5° ≤ 15.0°`, and the selected-point panel showed the calculation rule. The browser console had no application calculation or rendering error. Its only message was a local-development service-worker registration warning caused by the temporary Vite preview returning HTML for `/service-worker.js`; that warning does not affect the Atlas calculation or production baseline.
