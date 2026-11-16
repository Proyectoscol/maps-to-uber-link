// Lee una URL de ruta de Google Maps (/maps/dir/A/B/...) y devuelve origen y destino.
// Las coordenadas salen del bloque data=...!1d<lon>!2d<lat>... que Maps agrega a la URL.

function decodeSeg(s) {
  const t = s.replace(/\+/g, " ");
  try {
    return decodeURIComponent(t);
  } catch (e) {
    return t;
  }
}

const COORD_NAME_RE = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

function parseMapsDirUrl(href) {
  let u;
  try {
    u = new URL(href);
  } catch (e) {
    return null;
  }
  const parts = u.pathname.split("/");
  const i = parts.indexOf("dir");
  if (i === -1) return null;

  const names = [];
  for (let k = i + 1; k < parts.length; k++) {
    const p = parts[k];
    if (!p) continue;
    if (p.startsWith("@") || p.startsWith("data=")) break;
    names.push(decodeSeg(p));
  }
  if (names.length < 2) return null;

  const pairs = [];
  const re = /!1d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/g;
  let m;
  while ((m = re.exec(u.pathname)) !== null) {
    pairs.push({ lat: parseFloat(m[2]), lon: parseFloat(m[1]) });
  }

  const points = names.map((name, idx) => {
    const c = name.match(COORD_NAME_RE);
    if (c) return { name, lat: parseFloat(c[1]), lon: parseFloat(c[2]) };
    if (pairs.length === names.length) {
      return { name, lat: pairs[idx].lat, lon: pairs[idx].lon };
    }
    return { name, lat: null, lon: null };
  });

  return {
    origin: points[0],
    dest: points[points.length - 1],
    stops: points.length - 2
  };
}

// Si origin es null, Uber toma la ubicacion del dispositivo como punto de recogida.
function buildUberUrl(origin, dest) {
  const f = (n) => Number(n).toFixed(6);
  const enc = encodeURIComponent;
  let url = "https://m.uber.com/ul/?action=setPickup";
  if (origin) {
    url +=
      "&pickup[latitude]=" + f(origin.lat) +
      "&pickup[longitude]=" + f(origin.lon) +
      "&pickup[nickname]=" + enc(origin.name);
  } else {
    url += "&pickup=my_location";
  }
  url +=
    "&dropoff[latitude]=" + f(dest.lat) +
    "&dropoff[longitude]=" + f(dest.lon) +
    "&dropoff[nickname]=" + enc(dest.name);
  return url;
}

function buildSheetsFormula(url, label, sep) {
  return '=HYPERLINK("' + url + '"' + sep + '"' + label + '")';
}

// Excel no acepta textos de mas de 255 caracteres dentro de una formula,
// asi que el link se parte en trozos unidos con &.
function buildExcelFormula(url, label, sep) {
  const chunks = [];
  for (let i = 0; i < url.length; i += 200) {
    chunks.push('"' + url.slice(i, i + 200) + '"');
  }
  return "=HYPERLINK(" + chunks.join("&") + sep + '"' + label + '")';
}

if (typeof module !== "undefined") {
  module.exports = {
    parseMapsDirUrl,
    buildUberUrl,
    buildSheetsFormula,
    buildExcelFormula
  };
}
