// Display-layer internationalization. The game logic, data and parser stay
// German-canonical (see rooms/engine); this module only translates what the
// player SEES. `t(germanString)` returns the German string unchanged when the
// language is German, and the English translation (from MESSAGES) otherwise,
// falling back to the German string if a translation is missing.
import { MESSAGES } from "./data/i18n.js";

const STORE_KEY = "darkcastle.lang";
const listeners = [];
let lang = detectLang();

// German browsers start in German; everyone else starts in English. An explicit
// choice (the in-game switch) is remembered and wins over the browser setting.
function detectLang() {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved === "de" || saved === "en") return saved;
    }
  } catch { /* storage may be blocked */ }
  try {
    const nav = (typeof navigator !== "undefined" && navigator.language) || "";
    return nav.toLowerCase().startsWith("de") ? "de" : "en";
  } catch { return "de"; }
}

export function getLang() { return lang; }

export function setLang(l) {
  if ((l !== "de" && l !== "en") || l === lang) return;
  lang = l;
  try { if (typeof localStorage !== "undefined") localStorage.setItem(STORE_KEY, l); } catch { /* ignore */ }
  for (const cb of listeners) { try { cb(lang); } catch { /* ignore */ } }
}

// Register a callback fired whenever the language changes (used to re-render).
export function onLangChange(cb) { listeners.push(cb); }

// Translate one German display string to the current language.
export function tr(s) {
  if (lang === "de" || s == null) return s;
  const v = MESSAGES[s];
  return v == null ? s : v;
}
