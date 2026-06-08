// Special modules: safe-cracking minigame logic + section-code entry.
// DOM-free; the UI layer (ui.js/main.js) drives presentation around these.
import { makeState } from "./engine.js";

// ---------------------------------------------------------------------------
// TRESORKNACK — safe-cracking minigame logic core (source 547-639).
// 6 digits (1..9), each position cycles 0..9 with "left"; "right" moves position.
// rng() returns an integer 0..9 (caller injects; engine forbids Math.random()).
// ---------------------------------------------------------------------------
export function makeTresor(rng) {
  const target = Array.from({ length: 6 }, () => {
    let d = 0;
    while (d === 0) d = rng(); // original rerolls zeros (FEHLER loop)
    return d;
  });
  const cur = [0, 0, 0, 0, 0, 0];
  let pos = 0;
  return {
    target,
    cur,
    get pos() { return pos; },
    left() { cur[pos] = (cur[pos] + 1) % 10; },
    right() { pos = (pos + 1) % 6; },
    check() { return cur.every((d, i) => d === target[i]); },
  };
}

// ---------------------------------------------------------------------------
// Section codes (CODE procedure, source 355-367 + PASSWORT1/2/3 14-48).
// Returns { state, code } with the proper start inventory + room, or null.
// ---------------------------------------------------------------------------
export function applyCode(code) {
  const C = String(code).toUpperCase();
  const s = makeState();
  if (C === "STOERTEBECKER") { passwort1(s); s.raum = "BILD3"; return { state: s, code: 1 }; }
  if (C === "DT 64") { passwort2(s); s.raum = "BILD6"; return { state: s, code: 2 }; }
  if (C === "ANARCHY") { passwort3(s); s.flags.DURCH = 1; s.raum = "BILD2"; return { state: s, code: 3 }; }
  if (C === "AMIGA") { return { ending: true, code: "ending" }; } // cheat: straight to the credits
  if (C === "AMOS") { // cheat: straight to the safe minigame, in a coherent living-room state
    passwort1(s);
    s.inv[6] = "Stetoskop";
    Object.assign(s.flags, {
      BRIEFOFFEN: 1, BRIEFGELESEN: 1, GEGENSTAND4B: 1, KOFFERAUF: 1,
      GEDRE: 1, GEGENSTAND4E: 1, TRESORGESEHEN: 1, GEGENSTAND4F: 1,
    });
    s.raum = "BILD4";
    return { state: s, tresor: true, code: "tresor" };
  }
  return null;
}

function passwort1(s) {
  Object.assign(s.inv, { 1: "Schluessel", 2: "Brief", 3: "Frucht", 4: "Ast", 5: "Stein" });
}
function passwort2(s) {
  passwort1(s);
  Object.assign(s.inv, { 6: "Stetoskop", 7: "Goldschluessel", 8: "Blauer Trank", 9: "Gruener Trank", 10: "Roter Trank" });
}
function passwort3(s) {
  // FIXED: original PASSWORT3 had typo INVETRAR1$ so slot 1 (Schluessel) was lost.
  Object.assign(s.inv, {
    1: "Schluessel", 2: "Brief", 3: "Frucht", 4: "Ast", 5: "Stein",
    6: "Stetoskop", 7: "Goldschluessel", 8: "Blauer Trank", 9: "Gruener Trank", 10: "Roter Trank",
    11: "Hammer", 12: "Krug", 13: "Drahtschere", 14: "Uniform",
  });
}
