// Dark Castle engine — DOM-free game logic.
// Mirrors the original AMOS program: inventory slots + flags + per-room rule chains.
import { globalCheck } from "./globalchecks.js";
import { ROOMS } from "./data/rooms.js";
import { HINT_STEPS, NAV_HINTS, HINT_TEXTS } from "./data/hints.js";

export const VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
export function makeState() {
  const inv = {};
  for (let i = 1; i <= 20; i++) inv[i] = "";
  return {
    raum: "BILD1",
    inv,
    flags: {
      // section / progress
      DURCH: 0, FENSTER2WEG: 0, BRIEFOFFEN: 0, BRIEFGELESEN: 0,
      // safe / living room
      TRESORGEKNACKT: 0, TRESORGESEHEN: 0, T: 0, NOKKK: 0, VERSAGT: 0,
      KOFFERAUF: 0, BUCHGESEHEN: 0, GEDRE: 0, GOLD: 0,
      // 2nd floor
      KISTEGESEHEN: 0, KISTETOTE: 0, SCHISSGESEHEN: 0, SCHEREGESEHEN: 0,
      FASSGESEHEN: 0, SCHRANKOFFEN: 0, SCHRANKGESEHEN: 0, HAMMERGESEHEN: 0,
      WAECHTERTOT: 0,
      // attic / well / finale
      VERHAKT: 0, GEKNOTET: 0, FENSTER: 0, UNIFORM: 0, STARK: 0,
      LOCHGESEHEN: 0, MATTE: 0, BAUMGESEHEN: 0, HUNDGELESEN: 0, KAM: 0,
      DURCHGELESEN: 0, VERSUCH: 0,
      // per-room object visibility flags
      GEGENSTAND1D: 0, GEGENSTAND1E: 0,
      GEGENSTAND2F: 0, GEGENSTAND2G: 0,
      GEGENSTAND4A: 0, GEGENSTAND4B: 0, GEGENSTAND4C: 0, GEGENSTAND4E: 0, GEGENSTAND4F: 0,
      // BILD1 progress markers
      BILD1GENOMMEN: 0, BILD1GEZOGEN: 0, BILD1GESCHAUT: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Parser: verb + noun(s) -> uppercase command string (e.g. BENUTZESTEINFENSTER)
// ---------------------------------------------------------------------------
export function buildCmd(verb, nouns) {
  // Match keys are ASCII (e.g. NIMMSCHLUESSEL). Fold typed umlauts back to ASCII so
  // the player may type either "Schlüssel" or "Schluessel" (ß uppercases to SS already).
  return (verb + nouns.join(""))
    .toUpperCase()
    .replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE");
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------
function hasItem(s, name) {
  return Object.values(s.inv).includes(name);
}

export function condMet(s, cond) {
  if (!cond) return true;
  if (Array.isArray(cond)) return cond.every((c) => condMet(s, c));
  if ("hat" in cond && !hasItem(s, cond.hat)) return false;
  if ("nicht" in cond && hasItem(s, cond.nicht)) return false;
  if ("leer" in cond && s.inv[cond.leer] !== "") return false;
  if ("voll" in cond && s.inv[cond.voll] === "") return false;
  if ("slotIst" in cond && s.inv[cond.slotIst.slot] !== cond.slotIst.name) return false;
  if ("flag" in cond && s.flags[cond.flag] !== cond.eq) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Effects (used by both global checks and room rules)
// ---------------------------------------------------------------------------
export function applyEffects(s, eff, out) {
  if (eff.say != null) {
    const pen = eff.pen ?? 7;
    const arr = Array.isArray(eff.say) ? eff.say : [eff.say];
    for (const line of arr) out.push({ text: line, pen });
  }
  if (eff.set) for (const k in eff.set) s.flags[k] = eff.set[k];
  if (eff.give) s.inv[eff.give.slot] = eff.give.name;
  if (eff.take != null) {
    const slots = Array.isArray(eff.take) ? eff.take : [eff.take];
    for (const slot of slots) s.inv[slot] = "";
  }
}

// ---------------------------------------------------------------------------
// Generic verb fallbacks (the "Ich kann das nicht ..." chain at room bottom)
// ---------------------------------------------------------------------------
export function genericFallback(cmd) {
  const map = [
    ["ZIEHE", "Ich kann das nicht ziehen."],
    ["DRUECKE", "Ich kann das nicht drücken."],
    ["NIMM", "Ich kann das nicht nehmen."],
    ["OEFFNE", "Ich kann das nicht öffnen."],
    ["ISS", "Ich kann das nicht essen."],
    ["TRINK", "Ich kann das nicht trinken."],
    ["SCHAU AN", "Du siehst was,was ich nicht sehe."],
  ];
  for (const [prefix, msg] of map) if (cmd.startsWith(prefix)) return { text: msg, pen: 7 };
  return { text: "Ich kann diese Anweisung leider nicht ausführen.", pen: 7 };
}

// ---------------------------------------------------------------------------
// Room driver
// ---------------------------------------------------------------------------
export function lookText(s) {
  return ROOMS[s.raum].look(s);
}

// Currently-visible room objects (the clickable nouns). Filters the room's declared
// `objects` list by the same condMet logic the rules use; returns their display labels.
export function visibleObjects(s) {
  const room = ROOMS[s.raum];
  if (!room || !room.objects) return [];
  return room.objects.filter((o) => condMet(s, o.if)).map((o) => o.label);
}

// The current 3-level hint for the player's state: the first not-done step in the
// current room (canonical order, `when`-guards respected), else the room's navigation
// hint. Returns { hints: [s1, s2, s3], cmd }.
export function currentHint(s) {
  const empty = ["", "", ""];
  const pending = HINT_STEPS.find(
    (step) => step.room === s.raum
      && (step.when ? condMet(s, step.when) : true)
      && !condMet(s, step.done),
  );
  if (pending) {
    return { cmd: pending.cmd, hints: HINT_TEXTS[`${pending.room}|${pending.cmd}`] || empty };
  }
  const nav = NAV_HINTS[s.raum];
  if (!nav) return { cmd: null, hints: empty };
  const { cmd } = nav(s);
  return { cmd, hints: HINT_TEXTS[`${s.raum}|NAV|${cmd}`] || empty };
}

function enterRoom(s, id) {
  s.raum = id;
  const room = ROOMS[id];
  if (room.onEnter) room.onEnter(s);
  return lookText(s);
}

// Public entry used by main.js / tests when resolving a `call` (code/tresor/ending).
export function enterRoomPublic(s, id) {
  return enterRoom(s, id);
}

function emptyResult() {
  return { lines: [], moved: false, died: false, call: null };
}

// Apply a standard data rule's effects; returns a result object.
function runStandardRule(s, rule) {
  const res = emptyResult();
  applyEffects(s, rule, res.lines);
  if (rule.die) { res.died = true; return res; }
  if (rule.call) { res.call = rule.call; return res; }
  if (rule.go) { res.lines.push(...enterRoom(s, rule.go)); res.moved = true; return res; }
  return res;
}

// Normalize a result returned by a rule.fn(s) escape hatch.
function runFnRule(s, rule) {
  const r = rule.fn(s) || {};
  const res = emptyResult();
  if (r.lines) res.lines.push(...r.lines);
  if (r.died) res.died = true;
  if (r.call) res.call = r.call;
  if (r.go) { res.lines.push(...enterRoom(s, r.go)); res.moved = true; }
  return res;
}

export function applyCommand(s, cmd) {
  // "Siehe um" re-shows the current room (handled per-room in the original, identical behavior).
  if (cmd === "SIEHE UM") return { lines: lookText(s), moved: false, died: false, call: null };

  // 1) room rules, first match wins (original order: room rules BEFORE global checks)
  const room = ROOMS[s.raum];
  for (const rule of room.rules) {
    const matches = rule.any ? cmd !== "" : rule.cmd === cmd;
    if (matches && condMet(s, rule.if)) {
      return rule.fn ? runFnRule(s, rule) : runStandardRule(s, rule);
    }
  }

  // 2) global checks (ALLGEMEINEFRAGEN)
  const g = globalCheck(s, cmd);
  if (g) return { lines: g.lines, moved: false, died: g.died, call: null };

  // 3) generic fallback
  return { lines: [genericFallback(cmd)], moved: false, died: false, call: null };
}
