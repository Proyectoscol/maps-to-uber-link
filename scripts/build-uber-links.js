#!/usr/bin/env node
// Generate Uber ride-request deep links (plan + here) from an origin/destination,
// reusing the same builder functions the browser extension uses (extension/parse.js).
//
// Usage:
//   node scripts/build-uber-links.js --from "48.12,16.55,Vienna Airport" --to "Hotel Sacher, Vienna"
//   node scripts/build-uber-links.js --batch trips.csv --out trips-with-links.csv
//
// Batch CSV must have an "origin" and "destination" column (any order/case).
// Free-text addresses are geocoded via the public Nominatim API (OpenStreetMap),
// one request per second per Nominatim's usage policy: https://operations.osmfoundation.org/policies/nominatim/

const fs = require("fs");
const path = require("path");
const { buildUberUrl, buildSheetsFormula, buildExcelFormula } = require(
  path.join(__dirname, "..", "extension", "parse.js")
);

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "maps-to-uber-link-cli/1.0 (https://github.com/Proyectoscol/maps-to-uber-link)";
const geocodeCache = new Map();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocode(address) {
  if (geocodeCache.has(address)) return geocodeCache.get(address);
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Geocoding failed for "${address}": HTTP ${res.status}`);
  const rows = await res.json();
  if (!rows.length) throw new Error(`No geocoding result for "${address}"`);
  const point = { lat: parseFloat(rows[0].lat), lon: parseFloat(rows[0].lon), name: address };
  geocodeCache.set(address, point);
  await sleep(1100); // stay under Nominatim's 1 req/sec limit
  return point;
}

function parsePoint(spec) {
  const m = spec.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:,\s*(.*))?$/);
  if (m) {
    return Promise.resolve({ lat: parseFloat(m[1]), lon: parseFloat(m[2]), name: m[3] || spec });
  }
  return geocode(spec);
}

function linksFor(origin, dest) {
  const plan = buildUberUrl(origin, dest);
  const here = buildUberUrl(null, dest);
  return {
    plan_link: plan,
    here_link: here,
    plan_sheets: buildSheetsFormula(plan, "Uber - plan", ","),
    plan_excel: buildExcelFormula(plan, "Uber - plan", ";"),
    here_sheets: buildSheetsFormula(here, "Uber - here", ","),
    here_excel: buildExcelFormula(here, "Uber - here", ";"),
  };
}

// Minimal RFC4180-ish CSV parser/writer: handles quoted fields with embedded commas/quotes.
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function csvField(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

async function runSingle(args) {
  const origin = await parsePoint(args.from);
  const dest = await parsePoint(args.to);
  const out = linksFor(origin, dest);
  console.log(JSON.stringify(out, null, 2));
}

async function runBatch(args) {
  const text = fs.readFileSync(args.batch, "utf8");
  const rows = parseCsv(text);
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const iOrigin = header.indexOf("origin");
  const iDest = header.indexOf("destination");
  if (iOrigin === -1 || iDest === -1) {
    throw new Error('CSV must have "origin" and "destination" columns');
  }
  const outHeader = [...rows[0], "plan_link", "here_link"];
  const outRows = [outHeader];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row.length || (row.length === 1 && row[0] === "")) continue;
    const origin = await parsePoint(row[iOrigin]);
    const dest = await parsePoint(row[iDest]);
    const links = linksFor(origin, dest);
    outRows.push([...row, links.plan_link, links.here_link]);
    console.error(`row ${r}: ${row[iOrigin]} -> ${row[iDest]} done`);
  }
  const outText = outRows.map((r) => r.map(csvField).join(",")).join("\n") + "\n";
  const outPath = args.out || args.batch.replace(/\.csv$/i, "") + ".with-links.csv";
  fs.writeFileSync(outPath, outText);
  console.error(`Wrote ${outPath}`);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "");
    out[key] = argv[i + 1];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.batch) return runBatch(args);
  if (args.from && args.to) return runSingle(args);
  console.error(
    "Usage:\n" +
    '  node scripts/build-uber-links.js --from "lat,lon,name|address" --to "lat,lon,name|address"\n' +
    "  node scripts/build-uber-links.js --batch trips.csv --out trips-with-links.csv"
  );
  process.exit(1);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
