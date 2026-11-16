(function () {
  const PANEL_ID = "mau-panel";
  let lastHref = "";
  let lastKey = "";
  let token = 0;
  let collapsed = false;
  let currentInfo = null;
  let settings = Object.assign({}, MAU_DEFAULTS);

  function send(msg) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (r) => resolve(r || { ok: false }));
      } catch (e) {
        resolve({ ok: false, error: "extension reloaded, refresh the page" });
      }
    });
  }

  async function loadSettings() {
    try {
      const stored = await chrome.storage.sync.get(Object.keys(MAU_DEFAULTS));
      settings = Object.assign({}, MAU_DEFAULTS, stored);
    } catch (e) {
      settings = Object.assign({}, MAU_DEFAULTS);
    }
  }

  function sepOf(key) {
    return settings[key] === ";" ? ";" : ",";
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }

  function flash(btn, text) {
    const old = btn.dataset.label || btn.textContent;
    btn.dataset.label = old;
    btn.textContent = text;
    setTimeout(() => {
      btn.textContent = old;
    }, 1500);
  }

  function removePanel() {
    const p = document.getElementById(PANEL_ID);
    if (p) p.remove();
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function qrSvg(text) {
    const qr = qrcode(0, "L");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }

  // Dos modos: "plan" usa el origen de Maps; "here" usa la ubicacion del dispositivo.
  function linkFor(info, mode, t) {
    if (mode === "here") {
      return { url: buildUberUrl(null, info.dest), label: t.labelHere };
    }
    return { url: buildUberUrl(info.origin, info.dest), label: t.labelPlan };
  }

  function renderPanel(info) {
    removePanel();
    const t = mauStrings(settings.lang);
    let mode = settings.defaultMode === "here" ? "here" : "plan";
    let current = linkFor(info, mode, t);

    const panel = el("div");
    panel.id = PANEL_ID;

    const head = el("div", "mau-head");
    head.appendChild(el("span", "", t.title));
    const toggle = el("button", "mau-toggle", collapsed ? "+" : "x");
    toggle.title = t.toggle;
    head.appendChild(toggle);
    panel.appendChild(head);

    const body = el("div", "mau-body" + (collapsed ? " mau-hidden" : ""));
    toggle.addEventListener("click", () => {
      collapsed = !collapsed;
      body.classList.toggle("mau-hidden", collapsed);
      toggle.textContent = collapsed ? "+" : "x";
    });

    const tabs = el("div", "mau-tabs");
    const tabPlan = el("button", "mau-tab", t.tabPlan);
    const tabHere = el("button", "mau-tab", t.tabHere);
    tabs.appendChild(tabPlan);
    tabs.appendChild(tabHere);
    body.appendChild(tabs);

    const route = el("div", "mau-route");
    body.appendChild(route);

    const bLink = el("button", "mau-primary", t.copyLink);
    bLink.addEventListener("click", async () => {
      await copyText(current.url);
      flash(bLink, t.copied);
    });
    body.appendChild(bLink);

    const btns = el("div", "mau-btns");
    const bSheet = el("button", "mau-btn", t.copySheets);
    bSheet.addEventListener("click", async () => {
      await copyText(buildSheetsFormula(current.url, current.label, sepOf("sheetSep")));
      flash(bSheet, t.copied);
    });
    const bExcel = el("button", "mau-btn", t.copyExcel);
    bExcel.addEventListener("click", async () => {
      await copyText(buildExcelFormula(current.url, current.label, sepOf("excelSep")));
      flash(bExcel, t.copied);
    });
    btns.appendChild(bSheet);
    btns.appendChild(bExcel);
    body.appendChild(btns);

    const qr = el("div", "mau-qr");
    body.appendChild(qr);
    body.appendChild(el("div", "mau-note", t.scanQr));

    function refresh() {
      current = linkFor(info, mode, t);
      tabPlan.classList.toggle("mau-active", mode === "plan");
      tabHere.classList.toggle("mau-active", mode === "here");

      route.textContent = "";
      route.appendChild(el("b", "", t.from));
      route.appendChild(
        document.createTextNode(mode === "plan" ? info.origin.name : t.fromHere)
      );
      route.appendChild(document.createElement("br"));
      route.appendChild(el("b", "", t.to));
      route.appendChild(document.createTextNode(info.dest.name));
      if (info.stops > 0) {
        route.appendChild(document.createElement("br"));
        route.appendChild(el("span", "mau-warn", t.stops(info.stops)));
      }

      try {
        qr.innerHTML = qrSvg(current.url);
      } catch (e) {
        qr.textContent = t.qrFail;
      }
    }

    tabPlan.addEventListener("click", () => {
      mode = "plan";
      refresh();
    });
    tabHere.addEventListener("click", () => {
      mode = "here";
      refresh();
    });

    refresh();
    panel.appendChild(body);
    document.body.appendChild(panel);
  }

  async function ensureCoords(point) {
    if (point.lat !== null && point.lon !== null) return true;
    const g = await send({ type: "geocode", q: point.name });
    if (g.ok) {
      point.lat = g.lat;
      point.lon = g.lon;
      return true;
    }
    return false;
  }

  async function update() {
    const href = location.href;
    if (href === lastHref) return;
    lastHref = href;

    const info = parseMapsDirUrl(href);
    if (!info) {
      lastKey = "";
      currentInfo = null;
      token++;
      removePanel();
      return;
    }

    // Al mover o hacer zoom en el mapa cambia la URL, pero la ruta es la misma:
    // no se vuelve a dibujar el panel para no perder la pestana elegida.
    const key = [
      info.origin.name, info.origin.lat, info.origin.lon,
      info.dest.name, info.dest.lat, info.dest.lon
    ].join("|");
    if (key === lastKey) return;
    lastKey = key;

    const my = ++token;
    const okO = await ensureCoords(info.origin);
    const okD = await ensureCoords(info.dest);
    if (my !== token) return;
    if (!okO || !okD) {
      currentInfo = null;
      removePanel();
      return;
    }
    currentInfo = info;
    renderPanel(info);
  }

  // Si cambias idioma o pestana por defecto en el popup, el panel se actualiza al instante.
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      let touched = false;
      Object.keys(MAU_DEFAULTS).forEach((k) => {
        if (changes[k]) {
          settings[k] = changes[k].newValue !== undefined ? changes[k].newValue : MAU_DEFAULTS[k];
          touched = true;
        }
      });
      if (touched && currentInfo && document.getElementById(PANEL_ID)) {
        renderPanel(currentInfo);
      }
    });
  } catch (e) {}

  // Maps es una SPA: la URL cambia sin recargar la pagina.
  loadSettings().then(() => {
    setInterval(update, 800);
    update();
  });
})();
