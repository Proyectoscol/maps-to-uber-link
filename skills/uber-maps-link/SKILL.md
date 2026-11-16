---
name: uber-maps-link
description: Build an Uber ride-request deep link (and matching QR code / Sheets / Excel formula) from an origin and destination, the same way the "Ride Link: Maps to Uber" Chrome extension does. Use this whenever a user asks you to plan a trip, an itinerary, or a route and wants a ride link for Uber at the end of a Google Maps leg.
---

# Uber Maps Link

Generates Uber ride-request deep links from an origin/destination pair — useful when planning a trip itinerary and the user wants a one-tap ride link for each leg, without needing any extension or API key.

Source project: https://github.com/Proyectoscol/maps-to-uber-link (MIT license, independent/unofficial, not affiliated with Uber or Google).

## When to use this skill

The user is planning a trip (flights, hotels, an itinerary) and wants Uber links for getting between points — e.g. "give me Uber links for each hop of this trip" or "turn this Google Maps route into an Uber link I can put in Sheets/Excel".

## Inputs

For each leg, you need:
- **Origin**: either `name` (free-text address) or `{lat, lon, name}` if already known/geocoded.
- **Destination**: same shape, required.

If you only have addresses (no coordinates), geocode them first — e.g. via the free Nominatim API (`https://nominatim.openstreetmap.org/search?format=json&q=<address>`, one request per second, set a `User-Agent` header per Nominatim's usage policy) — or via any geocoder already available in your environment.

## Always produce two links per leg

| Link    | Pickup                                  | When to use                                   |
|---------|------------------------------------------|------------------------------------------------|
| `plan`  | fixed origin coordinates                  | save in an itinerary/sheet ahead of time        |
| `here`  | rider's current device location at open time | hand to the rider to use right when they leave |

## URL format

```
https://m.uber.com/ul/?action=setPickup
  &pickup[latitude]=<lat6>&pickup[longitude]=<lon6>&pickup[nickname]=<urlencoded name>
  &dropoff[latitude]=<lat6>&dropoff[longitude]=<lon6>&dropoff[nickname]=<urlencoded name>
```

For the `here` variant, replace the three `pickup[...]` params with a single `pickup=my_location`.

`lat6`/`lon6` = decimal latitude/longitude rounded to 6 decimal places. This is Uber's own public ride-request deep link format (https://developer.uber.com/docs/riders/ride-requests/tutorials/deep-links/introduction) — no API key or auth required to build or open it.

## Reference implementation

This repo's `extension/parse.js` exports the exact builder functions (Node-compatible via `module.exports`):

```js
const { buildUberUrl, buildSheetsFormula, buildExcelFormula } = require("./extension/parse.js");

const plan = buildUberUrl(origin, dest);     // origin = {lat, lon, name}
const here = buildUberUrl(null, dest);       // null origin => pickup=my_location

buildSheetsFormula(plan, "Plan ride", ",");  // => =HYPERLINK("...","Plan ride")
buildExcelFormula(plan, "Plan ride", ";");   // same, chunked for Excel's 255-char string limit
```

Or shell out to the CLI for batch/spreadsheet output:

```bash
node scripts/build-uber-links.js --from "<name or lat,lon,name>" --to "<name or lat,lon,name>"
node scripts/build-uber-links.js --batch trips.csv --out trips-with-links.csv
```

## Output format to give the user

For each leg, present (at minimum) the two raw links, and offer the Sheets/Excel formula variants if the user says they'll paste this into a spreadsheet — one column for `plan`, one for `here`, per the table above.
