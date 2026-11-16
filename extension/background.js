// Service worker: solo geocodifica nombres cuando la URL de Maps no trae coordenadas.

async function geocode(q) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
    encodeURIComponent(q);
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("nominatim " + r.status);
  const data = await r.json();
  if (!data.length) throw new Error("sin resultados");
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "geocode") {
    geocode(msg.q)
      .then((g) => sendResponse({ ok: true, lat: g.lat, lon: g.lon }))
      .catch((e) => sendResponse({ ok: false, error: String(e.message || e) }));
    return true;
  }
  return false;
});
