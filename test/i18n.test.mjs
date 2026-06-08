// Guards the German->English display translation: every string the player can see
// must have an English entry, and tr() must behave (identity in DE, lookup in EN).
import { test } from "node:test";
import assert from "node:assert/strict";
import { MESSAGES } from "../src/data/i18n.js";
import { tr, getLang, setLang } from "../src/i18n.js";
import { ROOMS } from "../src/data/rooms.js";
import { TEXTS } from "../src/data/texts.js";
import { HINT_TEXTS } from "../src/data/hints.js";
import { RULES as GLOBAL_RULES } from "../src/globalchecks.js";

// Collect every German display string the game can produce.
function collectGerman() {
  const set = new Set();
  const add = (s) => { if (typeof s === "string" && s.trim() !== "") set.add(s); };
  const addSay = (say) => { if (say != null) (Array.isArray(say) ? say : [say]).forEach(add); };

  for (const [id, room] of Object.entries(ROOMS)) {
    for (const r of room.rules || []) addSay(r.say);
    for (const o of room.objects || []) add(o.label);
    // sweep look() over its flags + inv to capture every line variant (incl. the
    // dynamically-built "Mögliche Richtungen ..." combinations).
    if (!room.look) continue;
    const src = room.look.toString();
    const flags = [...new Set([...src.matchAll(/s\.flags\.([A-Z0-9_]+)/g)].map((m) => m[1]))].slice(0, 12);
    const invIdx = [...new Set([...src.matchAll(/s\.inv\[(\d+)\]/g)].map((m) => Number(m[1])))];
    for (let c = 0; c < (1 << flags.length); c++) {
      const s = { raum: id, flags: {}, inv: {} };
      for (let i = 1; i <= 20; i++) s.inv[i] = "";
      flags.forEach((f, i) => { s.flags[f] = (c & (1 << i)) ? 1 : 0; });
      for (const fill of [false, true]) {
        invIdx.forEach((i) => { s.inv[i] = fill ? "X" : ""; });
        try { for (const l of room.look(s)) add(l.text); } catch { /* impossible combo */ }
      }
    }
  }
  for (const r of GLOBAL_RULES) addSay(r.say);
  for (const v of Object.values(TEXTS)) {
    if (Array.isArray(v)) v.forEach(add);
    else if (typeof v === "string") add(v);
    else if (v && typeof v === "object") for (const vv of Object.values(v)) addSay(vv);
  }
  for (const arr of Object.values(HINT_TEXTS)) (arr || []).forEach(add);
  return set;
}

test("English dictionary covers every German display string", () => {
  const missing = [...collectGerman()].filter((s) => !(s in MESSAGES));
  assert.deepEqual(missing, [], `missing English translation for ${missing.length}: ${missing.slice(0, 8).map((s) => JSON.stringify(s)).join(" | ")}`);
});

test("tr(): identity in German, dictionary lookup in English", () => {
  setLang("de");
  assert.equal(tr("Was nun ?"), "Was nun ?");
  assert.equal(tr("Öffne"), "Öffne");

  setLang("en");
  assert.equal(getLang(), "en");
  assert.equal(tr("Was nun ?"), "What now?");
  assert.equal(tr("Öffne"), "Open");
  assert.equal(tr("Schlüssel"), "key");
  assert.equal(tr("Ja"), "Yes");
  // movement-cross labels translate display only (the dir value stays V/H/L/R in the UI)
  assert.equal(tr("V"), "F");
  assert.equal(tr("H"), "B");
  // unknown strings fall back to the German original (never throws, never blank)
  assert.equal(tr("völlig unbekannter text"), "völlig unbekannter text");

  setLang("de"); // restore for any later tests
});
