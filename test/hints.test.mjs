import { test } from "node:test";
import assert from "node:assert/strict";
import { makeState, applyCommand, enterRoomPublic, currentHint } from "../src/engine.js";
import { ROOMS } from "../src/data/rooms.js";
import { HINT_STEPS, NAV_HINTS } from "../src/data/hints.js";

// The exact canonical command sequence (mirrors walkthrough.test.mjs).
const WALKTHROUGH = [
  "ZIEHEFUSSMATTE", "NIMMSCHLUESSEL", "SCHAU ANBRIEFKASTEN", "NIMMBRIEF", "OEFFNEBRIEF", "SCHAU ANBRIEF", "V",
  "SCHAU ANBAUM", "NIMMAST", "NIMMFRUCHT", "BENUTZEASTSTEIN", "BENUTZESTEINFENSTER", "V",
  "V", "BENUTZESCHLUESSELSCHRANKWAND", "OEFFNEARZTKOFFER", "SCHAU ANARZTKOFFER", "NIMMSTETOSKOP",
  "SCHAU ANBUECHER", "DRUECKEBUCH", "L", "NIMMBLAUER TRANK", "NIMMGRUENER TRANK", "NIMMROTER TRANK", "H",
  "ZIEHEBILD", "BENUTZESTETOSKOPTRESOR", "SCHAU ANGEHEIMFACH", "SCHAU ANGEHEIMFACH", "NIMMGOLDSCHLUESSEL", "H", "R",
  "BENUTZEASTLAPPEN", "NIMMHAMMER", "V", "OEFFNESCHRANK", "SCHAU ANSCHRANK", "NIMMKRUG", "SCHAU ANBIERFASS",
  "BENUTZEKRUGZAPFHAHN", "BENUTZEFRUCHTBIERKRUG", "H", "R", "ZIEHEGERUEMPEL", "BENUTZEHAMMERKISTE",
  "SCHAU ANKISTE", "NIMMDRAHTSCHERE", "L", "L", "GIBGIFTBIERKRUGWAECHTER", "V", "OEFFNEFENSTER",
  "BENUTZEDRAHTSCHEREWAESCHELEINE", "BENUTZEWAESCHELEINEGIEBEL", "L", "L", "L",
  "BENUTZEDRAHTSCHEREWAESCHELEINE", "BENUTZEWAESCHELEINEAST", "BENUTZEWAESCHELEINENASTBRUNNEN", "R",
  "SCHAU ANGANG", "TRINKROTER TRANK", "V", "V", "SCHAU ANZELLE", "BENUTZEGOLDSCHLUESSELSCHLOSS",
];

function makeFire(s) {
  return (cmd) => {
    const r = applyCommand(s, cmd);
    if (r.call === "code1") enterRoomPublic(s, "BILD3");
    else if (r.call === "code2") enterRoomPublic(s, "BILD6");
    else if (r.call === "code3") enterRoomPublic(s, "BILD2");
    else if (r.call === "tresor") { s.flags.TRESORGEKNACKT = 1; enterRoomPublic(s, "BILD4"); }
    return r;
  };
}

// --- correctness: the help points at the exact next step in every phase ----------
test("currentHint.cmd matches the next walkthrough command at every phase", () => {
  const s = makeState();
  enterRoomPublic(s, s.raum);
  const fire = makeFire(s);
  for (const cmd of WALKTHROUGH) {
    const h = currentHint(s);
    assert.ok(h, `no hint at raum=${s.raum}`);
    assert.equal(h.cmd, cmd, `wrong hint at raum=${s.raum}: expected ${cmd}, got ${h.cmd}`);
    fire(cmd);
  }
});

// --- coverage: every phase actually has three non-empty hint texts ---------------
test("every walkthrough phase yields 3 non-empty hint texts", () => {
  const s = makeState();
  enterRoomPublic(s, s.raum);
  const fire = makeFire(s);
  for (const cmd of WALKTHROUGH) {
    const h = currentHint(s);
    assert.equal(h.hints.length, 3, `wrong hint count at raum=${s.raum} before ${cmd}`);
    for (const line of h.hints) {
      assert.ok(line && line.trim() !== "", `empty hint at raum=${s.raum} before ${cmd}`);
    }
    fire(cmd);
  }
});

// --- missing-item gaps: guide to fetch the item, don't name an item you lack -------
test("BILD10 without the wire cutters guides the player to fetch them", () => {
  const s = makeState();
  s.raum = "BILD10"; s.flags.FENSTER = 1; // reached the attic but skipped the Abstellraum
  const h = currentHint(s);
  assert.equal(h.cmd, "H", "should navigate to fetch the cutters, not suggest cutting");
  assert.match(h.hints[2], /Drahtschere/);
});

test("BILD10 with the wire cutters suggests cutting the line", () => {
  const s = makeState();
  s.raum = "BILD10"; s.flags.FENSTER = 1; s.inv[13] = "Drahtschere";
  assert.equal(currentHint(s).cmd, "BENUTZEDRAHTSCHEREWAESCHELEINE");
});

test("BILD8 without the hammer guides the player to fetch it", () => {
  const s = makeState();
  s.raum = "BILD8"; s.flags.KISTEGESEHEN = 1; // junk pulled, but no hammer
  const h = currentHint(s);
  assert.equal(h.cmd, "L");
  assert.match(h.hints[2], /Hammer/);
});

// --- structure -------------------------------------------------------------------
test("every HINT_STEPS entry is well-formed", () => {
  for (const step of HINT_STEPS) {
    assert.ok(ROOMS[step.room], `unknown room ${step.room}`);
    assert.ok(step.cmd && typeof step.cmd === "string", `step in ${step.room} needs a cmd`);
  }
});

test("every room has a NAV_HINTS entry", () => {
  for (const room of Object.keys(ROOMS)) {
    assert.equal(typeof NAV_HINTS[room], "function", `missing NAV_HINTS for ${room}`);
  }
});
