import { test } from "node:test";
import assert from "node:assert/strict";
import { makeState } from "../src/engine.js";
import { globalCheck } from "../src/globalchecks.js";

test("look at Schluessel when carried", () => {
  const s = makeState();
  s.inv[1] = "Schluessel";
  const r = globalCheck(s, "SCHAU ANSCHLUESSEL");
  assert.ok(r && r.lines[0].text.startsWith("Ein kleiner bronzener Schlüssel"));
});

test("opening then reading the brief sets BRIEFOFFEN and BRIEFGELESEN", () => {
  const s = makeState();
  s.inv[2] = "Brief";
  globalCheck(s, "OEFFNEBRIEF");
  assert.equal(s.flags.BRIEFOFFEN, 1);
  const r = globalCheck(s, "SCHAU ANBRIEF");
  assert.equal(s.flags.BRIEFGELESEN, 1);
  assert.ok(r.lines.some((l) => l.text.includes("Tresorknacken")));
});

test("eating the Frucht kills you", () => {
  const s = makeState();
  s.inv[3] = "Frucht";
  const r = globalCheck(s, "ISSFRUCHT");
  assert.equal(r.died, true);
});

test("mixing fruit into the beer makes Giftbierkrug", () => {
  const s = makeState();
  s.inv[12] = "Bierkrug";
  globalCheck(s, "BENUTZEFRUCHTBIERKRUG");
  assert.equal(s.inv[12], "Giftbierkrug");
});

test("no match returns null", () => {
  const s = makeState();
  assert.equal(globalCheck(s, "NIMMHURZ"), null);
});
