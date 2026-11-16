// Textos en ingles y espanol. Se usan en el panel de Maps y en el popup.
// El idioma se elige en el popup: "auto" sigue el idioma del navegador.

var MAU_STRINGS = {
  en: {
    title: "Uber link",
    toggle: "Show or hide",
    tabPlan: "Plan",
    tabHere: "My location",
    from: "From: ",
    to: "To: ",
    fromHere: "your location when you open the link",
    copyLink: "Copy link",
    copySheets: "Copy for Sheets",
    copyExcel: "Copy for Excel",
    copied: "Copied",
    scanQr: "Scan with your phone camera",
    qrFail: "Could not generate the QR",
    stops: (n) =>
      "There are " + n + " intermediate stop(s). Uber only takes origin and destination.",
    labelPlan: "Open in Uber",
    labelHere: "Open in Uber (my location)",

    popupTitle: "Settings",
    lang: "Language",
    langAuto: "Automatic (browser language)",
    defaultTab: "Default tab",
    defTabPlan: "Plan: origin from Maps",
    defTabHere: "My location: destination from Maps",
    advanced: "Spreadsheet formulas",
    sheetsSep: "Separator for Google Sheets",
    excelSep: "Separator for Excel",
    sepComma: "Comma (,) for English-language sheets",
    sepSemi: "Semicolon (;) for Spanish-language sheets",
    sepHelp: "If a pasted formula shows an error, switch the separator.",
    saved: "Saved",
    disclaimer: "Independent project, not affiliated with or endorsed by Google or Uber. Built to speed up trip planning."
  },
  es: {
    title: "Link de Uber",
    toggle: "Mostrar u ocultar",
    tabPlan: "Planear",
    tabHere: "Mi ubicación",
    from: "Origen: ",
    to: "Destino: ",
    fromHere: "tu ubicación al abrir el link",
    copyLink: "Copiar link",
    copySheets: "Copiar para Sheets",
    copyExcel: "Copiar para Excel",
    copied: "Copiado",
    scanQr: "Escanea con la cámara del celular",
    qrFail: "No se pudo generar el QR",
    stops: (n) =>
      "Hay " + n + " parada(s) intermedia(s). Uber solo recibe origen y destino.",
    labelPlan: "Abrir en Uber",
    labelHere: "Abrir en Uber (mi ubicación)",

    popupTitle: "Ajustes",
    lang: "Idioma",
    langAuto: "Automático (idioma del navegador)",
    defaultTab: "Pestaña por defecto",
    defTabPlan: "Planear: origen de Maps",
    defTabHere: "Mi ubicación: destino de Maps",
    advanced: "Fórmulas de hoja de cálculo",
    sheetsSep: "Separador para Google Sheets",
    excelSep: "Separador para Excel",
    sepComma: "Coma (,) para hojas en inglés",
    sepSemi: "Punto y coma (;) para hojas en español",
    sepHelp: "Si al pegar la fórmula aparece un error, cambia el separador.",
    saved: "Guardado",
    disclaimer: "Proyecto independiente, sin afiliación ni respaldo de Google o Uber. Hecho para agilizar la planeación de viajes."
  }
};

function mauResolveLang(setting) {
  if (setting === "en" || setting === "es") return setting;
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  return nav.toLowerCase().indexOf("es") === 0 ? "es" : "en";
}

function mauStrings(setting) {
  return MAU_STRINGS[mauResolveLang(setting)];
}

var MAU_DEFAULTS = {
  lang: "auto",
  defaultMode: "plan",
  sheetSep: ",",
  excelSep: ","
};
