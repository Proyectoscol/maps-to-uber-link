# Privacy Policy — Ride Link: Maps to Uber

Last updated: 2026-11-16

This extension is independent and unofficial. It is not affiliated with Google or Uber.

## What the extension does

- Reads the currently open Google Maps *directions* URL (`google.com/maps/dir/...`) in the active tab to find the origin, destination, and stops of the route you already have open.
- If an address in that route doesn't already have coordinates in the URL, the extension sends that address text to the free [OpenStreetMap Nominatim](https://nominatim.org/) geocoding API to resolve it to a latitude/longitude.
- Builds an Uber ride-request deep link (`https://m.uber.com/ul/...`), a QR code for that link, and spreadsheet formulas — all generated locally in your browser.
- Stores your display preferences (language, default tab, Sheets/Excel separator) using `chrome.storage.sync`, which is Chrome's own per-user settings sync — this data stays within your Google Chrome profile and is never sent to us.

## What the extension does NOT do

- It does not collect, log, or transmit your browsing history, routes, or personal data to any server operated by us — we do not operate a server at all.
- It does not require an account, sign-in, or payment.
- It does not inject ads or trackers.
- It does not read or modify any page other than Google Maps directions pages (per the `host_permissions` / `content_scripts` match rules in `extension/manifest.json`).

## Third parties involved

- **OpenStreetMap Nominatim** (`nominatim.openstreetmap.org`): receives only the plain-text address you're already looking at on Google Maps, in order to return coordinates. Governed by [Nominatim's usage policy](https://operations.osmfoundation.org/policies/nominatim/) and [OSMF's privacy policy](https://wiki.osmfoundation.org/wiki/Privacy_Policy).
- **Uber** (`m.uber.com`): only receives data when *you* click a generated link, exactly as if you had typed that URL yourself. Opening it is governed by Uber's own privacy policy.
- **Google Maps**: the extension reads the URL of the tab you already have open; it does not call any Google API.

## Contact

Questions or concerns: open an issue at https://github.com/Proyectoscol/maps-to-uber-link/issues
