import { test } from "node:test";
import assert from "node:assert/strict";
import { makeState, applyCommand, enterRoomPublic } from "../src/engine.js";
import { makeTresor, applyCode } from "../src/specials.js";

// --- tresor minigame logic ------------------------------------------------
test("tresor: entering the correct combination wins", () => {
  const t = makeTresor(() => 5); // all target digits = 5
  for (let pos = 0; pos < 6; pos++) {
    for (let i = 0; i < 5; i++) t.left();
    t.right();
  }
  assert.equal(t.check(), true);
});

test("tresor: wrong combination loses", () => {
  const t = makeTresor(() => 5);
  assert.equal(t.check(), false);
});

// --- full walkthrough (acceptance test) -----------------------------------
test("full walkthrough reaches the ending", () => {
  const s = makeState();
  let last = null;
  // Resolve `call` results exactly like main.js will at runtime.
  const fire = (cmd) => {
    last = applyCommand(s, cmd);
    if (last.call === "code1") enterRoomPublic(s, "BILD3");
    else if (last.call === "code2") enterRoomPublic(s, "BILD6");
    else if (last.call === "code3") enterRoomPublic(s, "BILD2");
    else if (last.call === "tresor") s.flags.TRESORGEKNACKT = 1; // simulate minigame win
    return last;
  };

  // --- Abschnitt 1: BILD1 ---
  fire("ZIEHEFUSSMATTE"); fire("NIMMSCHLUESSEL");
  fire("SCHAU ANBRIEFKASTEN"); fire("NIMMBRIEF"); fire("OEFFNEBRIEF"); fire("SCHAU ANBRIEF");
  assert.equal(s.flags.BRIEFGELESEN, 1);
  fire("V");
  assert.equal(s.raum, "BILD2");
  // --- BILD2 ---
  fire("SCHAU ANBAUM"); fire("NIMMAST"); fire("NIMMFRUCHT");
  fire("BENUTZEASTSTEIN"); assert.equal(s.inv[5], "Stein");
  fire("BENUTZESTEINFENSTER"); assert.equal(s.flags.FENSTER2WEG, 1);
  fire("V"); assert.equal(last.call, "code1"); assert.equal(s.raum, "BILD3");

  // --- Abschnitt 2: BILD3 -> BILD4 -> BILD5 ---
  fire("V"); assert.equal(s.raum, "BILD4");
  fire("BENUTZESCHLUESSELSCHRANKWAND"); fire("OEFFNEARZTKOFFER"); fire("SCHAU ANARZTKOFFER"); fire("NIMMSTETOSKOP");
  assert.equal(s.inv[6], "Stetoskop");
  fire("SCHAU ANBUECHER"); fire("DRUECKEBUCH");
  fire("L"); assert.equal(s.raum, "BILD5");
  fire("NIMMBLAUER TRANK"); fire("NIMMGRUENER TRANK"); fire("NIMMROTER TRANK");
  fire("H"); assert.equal(s.raum, "BILD4");
  fire("ZIEHEBILD"); assert.equal(s.flags.TRESORGESEHEN, 1);
  fire("BENUTZESTETOSKOPTRESOR"); assert.equal(last.call, "tresor");
  assert.equal(s.flags.TRESORGEKNACKT, 1);
  fire("SCHAU ANGEHEIMFACH"); // triggers post-tresor success (T=1)
  assert.equal(s.flags.T, 1);
  fire("SCHAU ANGEHEIMFACH"); fire("NIMMGOLDSCHLUESSEL");
  assert.equal(s.inv[7], "Goldschluessel");
  fire("H"); assert.equal(s.raum, "BILD3");
  fire("R"); assert.equal(last.call, "code2"); assert.equal(s.raum, "BILD6");

  // --- Abschnitt 3: BILD6/7/8/9/10 ---
  fire("BENUTZEASTLAPPEN"); fire("NIMMHAMMER"); assert.equal(s.inv[11], "Hammer");
  fire("V"); assert.equal(s.raum, "BILD7");
  fire("OEFFNESCHRANK"); fire("SCHAU ANSCHRANK"); fire("NIMMKRUG"); assert.equal(s.inv[12], "Krug");
  fire("SCHAU ANBIERFASS"); fire("BENUTZEKRUGZAPFHAHN"); assert.equal(s.inv[12], "Bierkrug");
  fire("BENUTZEFRUCHTBIERKRUG"); assert.equal(s.inv[12], "Giftbierkrug");
  fire("H"); fire("R"); assert.equal(s.raum, "BILD8");
  fire("ZIEHEGERUEMPEL"); fire("BENUTZEHAMMERKISTE"); fire("SCHAU ANKISTE"); fire("NIMMDRAHTSCHERE");
  assert.equal(s.inv[13], "Drahtschere");
  fire("L"); fire("L"); assert.equal(s.raum, "BILD9");
  fire("GIBGIFTBIERKRUGWAECHTER"); assert.equal(s.flags.WAECHTERTOT, 1);
  fire("V"); assert.equal(s.raum, "BILD10");
  fire("OEFFNEFENSTER");
  fire("BENUTZEDRAHTSCHEREWAESCHELEINE"); // ABNEHMEN: uniform + cut line
  assert.equal(s.inv[14], "Uniform");
  assert.equal(s.inv[15], "Waescheleine");
  fire("BENUTZEWAESCHELEINEGIEBEL"); assert.equal(s.flags.GEKNOTET, 1);
  fire("L"); fire("L"); fire("L");
  assert.equal(last.call, "code3"); assert.equal(s.flags.DURCH, 1); assert.equal(s.raum, "BILD2");

  // --- Abschnitt 4: BILD2 -> BILD11 -> BILD12 -> BILD13 ---
  fire("BENUTZEDRAHTSCHEREWAESCHELEINE"); assert.equal(s.inv[15], "Waescheleine");
  fire("BENUTZEWAESCHELEINEAST"); assert.equal(s.inv[16], "Waescheleinenast");
  fire("BENUTZEWAESCHELEINENASTBRUNNEN"); assert.equal(s.flags.VERHAKT, 1);
  fire("R"); assert.equal(s.raum, "BILD11");
  fire("SCHAU ANGANG"); assert.equal(s.raum, "BILD12"); // any action -> fall
  fire("TRINKROTER TRANK"); assert.equal(s.flags.STARK, 1);
  fire("V"); assert.equal(s.flags.KAM, 1); // dog (survived)
  fire("V"); assert.equal(s.raum, "BILD13");
  fire("SCHAU ANZELLE");
  fire("BENUTZEGOLDSCHLUESSELSCHLOSS");
  assert.equal(last.call, "ending");
});

// --- death paths ----------------------------------------------------------
test("death: eat fruit / wrong potions / attack guard", () => {
  let s = makeState(); s.inv[3] = "Frucht";
  assert.equal(applyCommand(s, "ISSFRUCHT").died, true);
  s = makeState(); s.inv[8] = "Blauer Trank";
  assert.equal(applyCommand(s, "TRINKBLAUER TRANK").died, true);
  s = makeState(); s.inv[9] = "Gruener Trank";
  assert.equal(applyCommand(s, "TRINKGRUENER TRANK").died, true);
  s = makeState(); s.raum = "BILD9"; s.inv[4] = "Ast";
  assert.equal(applyCommand(s, "BENUTZEASTWAECHTER").died, true);
});

test("death: safe explodes after a failed crack (VERSAGT)", () => {
  const s = makeState(); s.raum = "BILD4"; s.flags.VERSAGT = 1;
  assert.equal(applyCommand(s, "SIEHE UM").moved, false); // SIEHE UM doesn't trigger
  // The VERSAGT check sits late in the chain (like the original): a fall-through command hits it.
  assert.equal(applyCommand(s, "ZIEHESESSEL").died, true); // explosion
});

// --- codes ----------------------------------------------------------------
test("codes set the right start state (incl. fixed PASSWORT3 key)", () => {
  assert.equal(applyCode("stoertebecker").state.raum, "BILD3");
  assert.equal(applyCode("DT 64").state.raum, "BILD6");
  const a = applyCode("anarchy");
  assert.equal(a.state.raum, "BILD2");
  assert.equal(a.state.flags.DURCH, 1);
  assert.equal(a.state.inv[1], "Schluessel");
  assert.equal(applyCode("amiga").ending, true); // jumps straight to the credits
  const amos = applyCode("amos");
  assert.equal(amos.tresor, true); // jumps straight to the safe minigame
  assert.equal(amos.state.raum, "BILD4");
  assert.equal(amos.state.inv[6], "Stetoskop");
  assert.equal(amos.state.flags.TRESORGESEHEN, 1);
  assert.equal(applyCode("falsch"), null);
});
