import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VERSION, makeState, buildCmd, condMet, applyEffects, genericFallback,
} from "../src/engine.js";

test("engine module loads", () => {
  assert.equal(VERSION, "1.0.0");
});

test("fresh state has empty inventory slots 1..20 and raum BILD1", () => {
  const s = makeState();
  assert.equal(s.raum, "BILD1");
  assert.equal(s.inv[1], "");
  assert.equal(s.inv[20], "");
  assert.equal(s.flags.DURCH, 0);
});

test("buildCmd uppercases and concatenates verb+nouns", () => {
  assert.equal(buildCmd("Benutze", ["Stein", "Fenster"]), "BENUTZESTEINFENSTER");
  assert.equal(buildCmd("Nimm", ["Schluessel"]), "NIMMSCHLUESSEL");
  assert.equal(buildCmd("Siehe um", []), "SIEHE UM");
});

test("condMet: hat / leer / flag / arrays / none", () => {
  const s = makeState();
  s.inv[5] = "Stein";
  assert.equal(condMet(s, { hat: "Stein" }), true);
  assert.equal(condMet(s, { hat: "Ast" }), false);
  assert.equal(condMet(s, { leer: 6 }), true);
  s.flags.DURCH = 1;
  assert.equal(condMet(s, { flag: "DURCH", eq: 1 }), true);
  assert.equal(condMet(s, [{ hat: "Stein" }, { flag: "DURCH", eq: 1 }]), true);
  assert.equal(condMet(s, [{ hat: "Stein" }, { flag: "DURCH", eq: 0 }]), false);
  assert.equal(condMet(s, undefined), true);
});

test("condMet: slotIst / nicht / voll", () => {
  const s = makeState();
  s.inv[2] = "Brief";
  assert.equal(condMet(s, { slotIst: { slot: 2, name: "Brief" } }), true);
  assert.equal(condMet(s, { slotIst: { slot: 2, name: "Frucht" } }), false);
  assert.equal(condMet(s, { nicht: "Stein" }), true);
  assert.equal(condMet(s, { voll: 2 }), true);
  assert.equal(condMet(s, { voll: 3 }), false);
});

test("applyEffects: set / give / take / collects lines with pen", () => {
  const s = makeState();
  const out = [];
  applyEffects(s, { say: "Hallo", set: { FENSTER2WEG: 1 }, give: { slot: 5, name: "Stein" } }, out);
  assert.equal(s.flags.FENSTER2WEG, 1);
  assert.equal(s.inv[5], "Stein");
  assert.deepEqual(out, [{ text: "Hallo", pen: 7 }]);
  applyEffects(s, { take: 5 }, out);
  assert.equal(s.inv[5], "");
});

test("genericFallback maps verb prefixes to original messages", () => {
  assert.equal(genericFallback("ZIEHEXYZ").text, "Ich kann das nicht ziehen.");
  assert.equal(genericFallback("DRUECKEXYZ").text, "Ich kann das nicht drücken.");
  assert.equal(genericFallback("NIMMXYZ").text, "Ich kann das nicht nehmen.");
  assert.equal(genericFallback("OEFFNEXYZ").text, "Ich kann das nicht öffnen.");
  assert.equal(genericFallback("ISSXYZ").text, "Ich kann das nicht essen.");
  assert.equal(genericFallback("TRINKXYZ").text, "Ich kann das nicht trinken.");
  assert.equal(genericFallback("SCHAU ANXYZ").text, "Du siehst was,was ich nicht sehe.");
  assert.equal(genericFallback("GIBXYZ").text, "Ich kann diese Anweisung leider nicht ausführen.");
});

test("buildCmd folds typed umlauts to ASCII so either spelling matches", () => {
  assert.equal(buildCmd("Nimm", ["Schlüssel"]), "NIMMSCHLUESSEL");
  assert.equal(buildCmd("Nimm", ["Schluessel"]), "NIMMSCHLUESSEL");
  assert.equal(buildCmd("Öffne", ["Tür"]), "OEFFNETUER");
  assert.equal(buildCmd("Nimm", ["Grüner Trank"]), "NIMMGRUENER TRANK");
});
