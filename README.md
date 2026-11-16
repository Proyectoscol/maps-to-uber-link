# Ride Link — Maps to Uber

Turn a Google Maps route into an Uber deep link, a QR code, and a ready-to-paste Google Sheets / Excel formula. Built for people who plan trips (travel agents, concierges, assistants, families) and want a one-click ride link for every leg of the itinerary — one link to use **now** (pickup = current location) and one to save **for later** (pickup = the exact point on the map).

🔗 **Project site:** https://proyectoscol.github.io/maps-to-uber-link/
🧩 **Chrome Web Store:** pending review — once published the link will be added here and on the project site.

> Unofficial, independent project. Not affiliated with, endorsed by, or sponsored by Uber Technologies, Inc. or Google LLC. "Uber" and "Google Maps" are trademarks of their respective owners. See [DISCLAIMER](#disclaimer--privacy).

## What it does

1. You open a route on Google Maps (`google.com/maps/dir/...`).
2. The extension reads the origin, destination, and any stops straight from the page URL.
3. It shows a small panel with two ready-made Uber links:
   - **Plan** — pickup pinned to the Maps origin point (great for scheduling a ride in advance).
   - **My location** — pickup is the rider's current device location at the moment they open the Uber app/link (great for "send me this link and I'll use it when I actually leave").
4. Copy the raw link, a `=HYPERLINK(...)` formula for Google Sheets, the same formula split for Excel's 255-character string limit, or scan the QR code with a phone.

No server, no accounts, no tracking. Geocoding of addresses that aren't already pinned goes directly from your browser to the free [OpenStreetMap Nominatim](https://nominatim.org/) API — see [PRIVACY.md](PRIVACY.md).

## Install (unpacked, while awaiting Chrome Web Store review)

1. Download or clone this repo.
2. Go to `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder.
4. Open any Google Maps directions page.

## For AI agents and trip-planning tools

If you're an AI agent (or a developer building one) that plans trips and wants to hand the user a ride-hailing link, you don't need this browser extension at all — the Uber deep link format is public and documented below. See also [`llms.txt`](docs/llms.txt) and the agent skill at [`skills/uber-maps-link/SKILL.md`](skills/uber-maps-link/SKILL.md).

### Uber ride-request deep link format

```
https://m.uber.com/ul/?action=setPickup
  &pickup[latitude]=<lat>&pickup[longitude]=<lon>&pickup[nickname]=<name>   (omit all 3 and use pickup=my_location instead, to use the rider's current location)
  &dropoff[latitude]=<lat>&dropoff[longitude]=<lon>&dropoff[nickname]=<name>
```

- `lat`/`lon`: decimal degrees, 6 decimal places recommended.
- `nickname`: URL-encoded free text label shown in the Uber app.
- This is Uber's own publicly documented [ride request deep link](https://developer.uber.com/docs/riders/ride-requests/tutorials/deep-links/introduction) scheme — opening it on mobile launches the Uber app (or the App/Play Store if not installed); on desktop it opens `m.uber.com`.

Two links per leg of a trip is the recommended pattern:

| Column        | Pickup                          | Use case                              |
|---------------|----------------------------------|----------------------------------------|
| **Plan link** | fixed lat/lon of the origin      | put in an itinerary, calendar, or sheet in advance |
| **Here link** | `pickup=my_location`             | send to the rider to use the moment they're ready to leave |

### Generate links yourself (CLI, no browser needed)

```bash
node scripts/build-uber-links.js --from "48.120000,16.550000,Vienna Airport" --to "48.195000,16.369000,Hotel"
node scripts/build-uber-links.js --batch trips.csv --out trips-with-links.csv
```

See [`scripts/build-uber-links.js`](scripts/build-uber-links.js) — `--from`/`--to` accept either `lat,lon,name` or a free-text address (geocoded via Nominatim). Batch mode reads a CSV with `origin,destination` columns and writes back a CSV with `plan_link` and `here_link` columns added, matching the two-cells-per-trip pattern above.

## Repo layout

```
extension/   Chrome extension (Manifest V3): content script, popup, i18n (en/es)
scripts/     Node CLI to generate Uber links / Sheets / Excel formulas in bulk
skills/      Agent-usable skill describing this project's link format
docs/        GitHub Pages site (homepage + privacy policy, published from this folder)
```

## Contributing

Issues and PRs welcome. The extension has no build step — edit the files in `extension/` directly and reload the unpacked extension in `chrome://extensions`.

## Disclaimer & privacy

- Independent, unofficial project. Uses only publicly documented Uber deep links and the Google Maps URL you're already viewing; it does not scrape, automate, or call any private API.
- No data is collected, stored remotely, or sold. See [PRIVACY.md](PRIVACY.md).
- Use at your own risk; always confirm pickup/dropoff points before requesting a ride.

## Support this project

If this saved you time, you can leave a tip: https://www.paypal.com/ncp/payment/HWXHX4GDYU5F2

## License

[MIT](LICENSE)
