import { test } from "node:test";
import assert from "node:assert/strict";
import { makeState, applyCommand, enterRoomPublic } from "../src/engine.js";

test("BILD1: pulling the mat reveals a key, then taking it fills slot 1", () => {
  const s = makeState();
  let r = applyCommand(s, "ZIEHEFUSSMATTE");
  assert.equal(s.flags.MATTE, 1);
  assert.ok(r.lines.some((l) => l.text.includes("Schlüssel")));
  r = applyCommand(s, "NIMMSCHLUESSEL");
  assert.equal(s.inv[1], "Schluessel");
});

test("BILD1: going forward moves to BILD2 and returns its look", () => {
  const s = makeState();
  const r = applyCommand(s, "V");
  assert.equal(s.raum, "BILD2");
  assert.equal(r.moved, true);
  assert.ok(r.lines.some((l) => l.text.includes("Rückseite")));
});

test("BILD1: nonsense uses generic fallback", () => {
  const s = makeState();
  const r = applyCommand(s, "NIMMHURZ");
  assert.equal(r.lines.at(-1).text, "Ich kann das nicht nehmen.");
});

test("BILD2: stone via branch, then smash window opens the way forward", () => {
  const s = makeState();
  enterRoomPublic(s, "BILD2");
  s.inv[4] = "Ast";
  applyCommand(s, "SCHAU ANBAUM");
  applyCommand(s, "BENUTZEASTSTEIN");
  assert.equal(s.inv[5], "Stein");
  applyCommand(s, "BENUTZESTEINFENSTER");
  assert.equal(s.flags.FENSTER2WEG, 1);
});

test("BILD2: with all 5 items, V triggers code1", () => {
  const s = makeState();
  s.raum = "BILD2";
  s.flags.FENSTER2WEG = 1;
  for (const [slot, name] of [[1, "Schluessel"], [2, "Brief"], [3, "Frucht"], [4, "Ast"], [5, "Stein"]]) s.inv[slot] = name;
  const r = applyCommand(s, "V");
  assert.equal(r.call, "code1");
});

test("BILD2: incomplete inventory, V is refused", () => {
  const s = makeState();
  s.raum = "BILD2";
  s.flags.FENSTER2WEG = 1;
  const r = applyCommand(s, "V");
  assert.equal(r.call, null);
  assert.ok(r.lines[0].text.includes("NOCH NICHT ALLE"));
});

test("BILD4: book press opens secret passage to BILD5", () => {
  const s = makeState();
  s.raum = "BILD4";
  applyCommand(s, "SCHAU ANBUECHER");
  applyCommand(s, "DRUECKEBUCH");
  assert.equal(s.flags.GEGENSTAND4E, 1);
  applyCommand(s, "L");
  assert.equal(s.raum, "BILD5");
});

test("BILD4: stethoscope on safe after reading brief calls tresor", () => {
  const s = makeState();
  s.raum = "BILD4";
  s.inv[6] = "Stetoskop";
  s.flags.BRIEFGELESEN = 1;
  s.flags.TRESORGESEHEN = 1;
  const r = applyCommand(s, "BENUTZESTETOSKOPTRESOR");
  assert.equal(r.call, "tresor");
});

test("BILD4: after cracking, next command yields success then gold key appears", () => {
  const s = makeState();
  s.raum = "BILD4";
  s.flags.TRESORGESEHEN = 1;
  s.flags.TRESORGEKNACKT = 1; // simulate minigame win
  let r = applyCommand(s, "SCHAU ANGEHEIMFACH"); // any-rule 882 fires first
  assert.ok(r.lines.some((l) => l.text.includes("Es gelang mir")));
  assert.equal(s.flags.T, 1);
  r = applyCommand(s, "SCHAU ANGEHEIMFACH"); // now real geheimfach rule
  assert.ok(r.lines.some((l) => l.text.includes("Goldschlüssel")));
  applyCommand(s, "NIMMGOLDSCHLUESSEL");
  assert.equal(s.inv[7], "Goldschluessel");
});

test("BILD9: poison beer kills the guard, opening the way up", () => {
  const s = makeState();
  s.raum = "BILD9";
  s.inv[12] = "Giftbierkrug";
  applyCommand(s, "GIBGIFTBIERKRUGWAECHTER");
  assert.equal(s.flags.WAECHTERTOT, 1);
  applyCommand(s, "V");
  assert.equal(s.raum, "BILD10");
});

test("BILD9: attacking the guard kills you", () => {
  const s = makeState();
  s.raum = "BILD9";
  s.inv[5] = "Stein";
  assert.equal(applyCommand(s, "BENUTZESTEINWAECHTER").died, true);
});

test("BILD10: third jump attempt triggers code3 (DURCH)", () => {
  const s = makeState();
  s.raum = "BILD10";
  s.flags.FENSTER = 1;
  s.flags.GEKNOTET = 1;
  s.flags.VERSUCH = 2;
  const r = applyCommand(s, "L");
  assert.equal(s.flags.DURCH, 1);
  assert.equal(r.call, "code3");
});

test("BILD11: any action makes you fall to BILD12", () => {
  const s = makeState();
  s.raum = "BILD11";
  const r = applyCommand(s, "SCHAU ANHIMMEL");
  assert.equal(s.raum, "BILD12");
  assert.ok(r.lines.some((l) => l.text.includes("stürzt du hinunter")));
});

test("BILD12: dog kills without STARK; survives after red potion", () => {
  let s = makeState();
  s.raum = "BILD12";
  let r = applyCommand(s, "V"); // first action triggers dog, no STARK
  assert.equal(r.died, true);

  s = makeState();
  s.raum = "BILD12";
  s.inv[10] = "Roter Trank";
  applyCommand(s, "TRINKROTER TRANK"); // STARK=1
  r = applyCommand(s, "V"); // dog, survive
  assert.equal(r.died, false);
  assert.equal(s.flags.KAM, 1);
  r = applyCommand(s, "V"); // now move forward
  assert.equal(s.raum, "BILD13");
});

test("BILD13: gold key on lock frees Agathe -> ending", () => {
  const s = makeState();
  s.raum = "BILD13";
  s.inv[7] = "Goldschluessel";
  applyCommand(s, "SCHAU ANZELLE"); // sets LOCHGESEHEN
  const r = applyCommand(s, "BENUTZEGOLDSCHLUESSELSCHLOSS");
  assert.equal(r.call, "ending");
});
