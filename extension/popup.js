const IDS = ["lang", "defaultMode", "sheetSep", "excelSep"];
const savedEl = document.getElementById("saved");

function applyStrings(langSetting) {
  const t = mauStrings(langSetting);
  document.documentElement.lang = mauResolveLang(langSetting);
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const v = t[node.getAttribute("data-i18n")];
    if (typeof v === "string") node.textContent = v;
  });
  document.title = t.popupTitle;
}

function flashSaved(langSetting) {
  savedEl.textContent = mauStrings(langSetting).saved;
  setTimeout(() => {
    savedEl.textContent = "";
  }, 1500);
}

chrome.storage.sync.get(IDS, (stored) => {
  const s = Object.assign({}, MAU_DEFAULTS, stored);
  IDS.forEach((id) => {
    document.getElementById(id).value = s[id];
  });
  applyStrings(s.lang);
});

IDS.forEach((id) => {
  document.getElementById(id).addEventListener("change", () => {
    const patch = {};
    patch[id] = document.getElementById(id).value;
    chrome.storage.sync.set(patch, () => {
      const lang = document.getElementById("lang").value;
      applyStrings(lang);
      flashSaved(lang);
    });
  });
});
