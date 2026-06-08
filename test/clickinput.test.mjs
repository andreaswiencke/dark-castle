import { test } from "node:test";
import assert from "node:assert/strict";
import { makeState, buildCmd, applyCommand, enterRoomPublic, visibleObjects } from "../src/engine.js";
import { ROOMS } from "../src/data/rooms.js";

// ---------------------------------------------------------------------------
// visibleObjects: returns the clickable room nouns for the current state.
// ---------------------------------------------------------------------------
test("BILD1: visible objects on fresh entry (key/letter still hidden)", () => {
  const s = makeState();
  enterRoomPublic(s, "BILD1");
  assert.deepEqual(visibleObjects(s), ["Fußmatte", "Fenster", "Briefkasten", "Tür"]);
});

test("BILD1: pulling the doormat reveals the key as a clickable object", () => {
  const s = makeState();
  enterRoomPublic(s, "BILD1");
  applyCommand(s, "ZIEHEFUSSMATTE");
  assert.ok(visibleObjects(s).includes("Schlüssel"));
});

test("BILD4: Geheimfach only appears after the safe is cracked", () => {
  const s = makeState();
  enterRoomPublic(s, "BILD4");
  assert.ok(!visibleObjects(s).includes("Geheimfach"));
  s.flags.TRESORGEKNACKT = 1;
  assert.ok(visibleObjects(s).includes("Geheimfach"));
});

test("BILD13: Schloss only appears after looking at the cell", () => {
  const s = makeState();
  enterRoomPublic(s, "BILD13");
  assert.ok(!visibleObjects(s).includes("Schloss"));
  s.flags.LOCHGESEHEN = 1;
  assert.ok(visibleObjects(s).includes("Schloss"));
});

test("BILD5: potions disappear from the room once taken", () => {
  const s = makeState();
  enterRoomPublic(s, "BILD5");
  assert.deepEqual(visibleObjects(s), ["Blauer Trank", "Grüner Trank", "Roter Trank"]);
  s.inv[8] = "Blauer Trank"; s.inv[9] = "Gruener Trank"; s.inv[10] = "Roter Trank";
  assert.deepEqual(visibleObjects(s), []);
});

test("rooms without objects (BILD11/BILD12) return an empty list", () => {
  const s = makeState();
  enterRoomPublic(s, "BILD11");
  assert.deepEqual(visibleObjects(s), []);
  enterRoomPublic(s, "BILD12");
  assert.deepEqual(visibleObjects(s), []);
});

// ---------------------------------------------------------------------------
// Drift guard: the declarative `objects` list must match what look() displays
// in its "Ich sehe folgende Gegenstände :" section, for every room.
// ---------------------------------------------------------------------------
function lookObjectsText(s) {
  const lines = ROOMS[s.raum].look(s);
  const idx = lines.findIndex((l) => l.text && l.text.startsWith("Ich sehe folgende Gegenstände"));
  const after = idx === -1 ? [] : lines.slice(idx + 1);
  return after.map((l) => l.text).join(" ").replace(/\s+/g, " ").trim();
}

test("objects list matches look() output on fresh entry for every room", () => {
  for (const id of Object.keys(ROOMS)) {
    const s = makeState();
    enterRoomPublic(s, id);
    assert.equal(
      visibleObjects(s).join(" "),
      lookObjectsText(s),
      `mismatch in ${id}`,
    );
  }
});

test("objects list matches look() under conditional states", () => {
  // BILD4 with the safe cracked (Geheimfach visible).
  let s = makeState(); enterRoomPublic(s, "BILD4"); s.flags.TRESORGEKNACKT = 1;
  assert.equal(visibleObjects(s).join(" "), lookObjectsText(s));
  // BILD13 with the lock seen (Schloss visible).
  s = makeState(); enterRoomPublic(s, "BILD13"); s.flags.LOCHGESEHEN = 1;
  assert.equal(visibleObjects(s).join(" "), lookObjectsText(s));
});

// ---------------------------------------------------------------------------
// Token mapping: a clicked label folds to the same cmd token as typing it.
// ---------------------------------------------------------------------------
test("clicked labels fold to the rule command tokens", () => {
  assert.equal(buildCmd("Schau an", ["Bücher"]), "SCHAU ANBUECHER");
  assert.equal(buildCmd("Ziehe", ["Fußmatte"]), "ZIEHEFUSSMATTE");
  assert.equal(buildCmd("Benutze", ["Ast", "Stein"]), "BENUTZEASTSTEIN");
  assert.equal(buildCmd("Trink", ["Blauer Trank"]), "TRINKBLAUER TRANK");
  assert.equal(buildCmd("Benutze", ["Goldschlüssel", "Schloss"]), "BENUTZEGOLDSCHLUESSELSCHLOSS");
});

// ---------------------------------------------------------------------------
// BILD5: drinking a potion that's still in the room (not yet taken) should
// hint that it must be taken first — not the generic "kann das nicht trinken".
// ---------------------------------------------------------------------------
test("BILD5: drinking an un-taken potion tells you to take it first", () => {
  for (const potion of ["TRINKBLAUER TRANK", "TRINKGRUENER TRANK", "TRINKROTER TRANK"]) {
    const s = makeState();
    enterRoomPublic(s, "BILD5");
    const r = applyCommand(s, potion);
    assert.equal(r.died, false, `${potion} must not kill while still in the room`);
    assert.match(r.lines.map((l) => l.text).join(" "), /erst nehmen/, `${potion} should hint to take it first`);
  }
});

test("BILD5: once taken, drinking the green potion is still fatal (unchanged)", () => {
  const s = makeState();
  enterRoomPublic(s, "BILD5");
  applyCommand(s, "NIMMGRUENER TRANK");
  assert.equal(applyCommand(s, "TRINKGRUENER TRANK").died, true);
});

test("BILD2: eating the fruit while it's still on the tree tells you to take it first", () => {
  const s = makeState();
  enterRoomPublic(s, "BILD2");
  applyCommand(s, "SCHAU ANBAUM"); // reveal the fruit
  const r = applyCommand(s, "ISSFRUCHT");
  assert.equal(r.died, false);
  assert.match(r.lines.map((l) => l.text).join(" "), /erst nehmen/);
});

test("BILD2: once taken, eating the fruit is still fatal (unchanged)", () => {
  const s = makeState();
  enterRoomPublic(s, "BILD2");
  applyCommand(s, "SCHAU ANBAUM");
  applyCommand(s, "NIMMFRUCHT");
  assert.equal(applyCommand(s, "ISSFRUCHT").died, true);
});

test("a failed safe crack detonates immediately via the VERSAGT fall-through", () => {
  // main.js fires applyCommand(state, "__VERSAGT__") right after a lost tresor game;
  // any fall-through cmd must hit BILD4's VERSAGT rule -> explosion text + death.
  const s = makeState();
  s.raum = "BILD4";
  s.flags.VERSAGT = 1;
  const r = applyCommand(s, "__VERSAGT__");
  assert.equal(r.died, true);
  assert.match(r.lines.map((l) => l.text).join(" "), /explodiert/);
});

test("a won safe crack surfaces the success message immediately via fall-through", () => {
  // main.js fires applyCommand(state, "__GEKNACKT__") right after a won tresor game;
  // BILD4's post-crack any-rule must yield the success text and set T.
  const s = makeState();
  s.raum = "BILD4";
  s.flags.TRESORGEKNACKT = 1;
  const r = applyCommand(s, "__GEKNACKT__");
  assert.match(r.lines.map((l) => l.text).join(" "), /Tresor zu öffnen/);
  assert.equal(s.flags.T, 1);
});
