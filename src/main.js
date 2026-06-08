// Runtime: wires engine + ui + specials into the menu/intro/game/ending flow.
import { createUI } from "./ui.js";
import { makeState, applyCommand, enterRoomPublic, buildCmd, visibleObjects, currentHint } from "./engine.js";
import { makeTresor, applyCode } from "./specials.js";
import { createAudio } from "./audio.js";
import { TEXTS } from "./data/texts.js";
import { tr, setLang, getLang, onLangChange } from "./i18n.js";

const ROOM_LABELS = {
  BILD1: "Vor dem Haus", BILD2: "Hinter dem Haus", BILD3: "Kleiner Raum",
  BILD4: "Wohnzimmer", BILD5: "Geheimlabor", BILD6: "Flur (2. Stock)",
  BILD7: "Küche", BILD8: "Abstellraum", BILD9: "Treppe / Wächter",
  BILD10: "Dachboden", BILD11: "Im Gang", BILD12: "Dunkler Gang", BILD13: "Agathes Zelle",
};

const VERB_PROMPTS = {
  "Öffne": ["Was soll ich öffnen ? : "],
  "Ziehe": ["Was soll ich ziehen ? : "],
  "Nimm": ["Was soll ich nehmen ? : "],
  "Drücke": ["Was soll ich drücken ? : "],
  "Trink": ["Was soll ich trinken ? : "],
  "Iss": ["Was soll ich essen ? : "],
  "Benutze": ["Was soll ich benutzen ? : ", "Mit was soll ich das benutzen ? : "],
  "Schau an": ["Worauf soll ich schauen ? : "],
  "Gib": ["Was soll ich geben ? : ", "An wen soll ich das geben ? : "],
};

let ui;
let audio;
let help = null;          // corner help button (mounted in boot, shown only during play)
let activeState = null;   // the live game state, so the help button can read currentHint
let backstoryRead = false;

async function boot(root) {
  ui = createUI(root);
  audio = createAudio();
  addMuteButton(root);
  addLangSwitch(root);
  help = ui.helpButton(() => currentHint(activeState));
  help.hide(); // only visible during play()
  audio.play("intro"); // queue title music; the splash click below unlocks audio
  // The "THE NEW STYLE presents" splash waits for a click/Space — that first gesture
  // satisfies the browser autoplay policy, so the title music then plays through the
  // intro. (Sound cannot start on bare page load without a user interaction.)
  await ui.imageScreen("assets/newstyle.png", { fade: 600, smooth: true, label: "Klick zum Starten" });
  // Horizontal, infinitely-looping marquee (as in the original AMOS intro). Runs until
  // the player presses Space/skips, then we continue to the menu.
  await ui.marquee(TEXTS.intro.map((l) => tr(l)).join("        "), { image: "assets/castle.png" });
  audio.stop();
  while (true) {
    help.hide(); // hidden on intro/menu; play() shows it
    const choice = await ui.menu(TEXTS.menu.title, [
      "1 — Anleitung", "2 — Vorgeschichte", "3 — Code eingeben", "4 — Neu beginnen",
    ], { image: "assets/castle.png" });
    if (choice === 1) await anleitung();
    else if (choice === 2) await vorgeschichte();
    else if (choice === 3) await codeEntry();
    else if (choice === 4) await play(makeState());
  }
}

async function anleitung() {
  ui.clear();
  ui.print([{ text: "A n l e i t u n g", pen: 12 }, { text: "", pen: 7 }]);
  const read = await ui.confirm("Haben sie die Vorgeschichte schon gelesen ?");
  if (!(read || backstoryRead)) {
    ui.print([{ text: "Bitte lesen sie die Vorgeschichte zuerst !", pen: 4 }]);
    await ui.pressToContinue();
    return;
  }
  await ui.page(TEXTS.manualP1, { title: "A n l e i t u n g" });
  await ui.page(TEXTS.manualP2, { title: "A n l e i t u n g" });
}

async function vorgeschichte() {
  await ui.page(TEXTS.backstoryP1, { title: "V o r g e s c h i c h t e" });
  await ui.page(TEXTS.backstoryP2, { title: "V o r g e s c h i c h t e" });
  backstoryRead = true;
}

async function codeEntry() {
  ui.clear();
  const code = await ui.ask("Bitte geben sie das Codewort ein. : ");
  const res = applyCode(code);
  if (!res) {
    ui.print([{ text: "Passwort Fehler !", pen: 4 }]);
    await ui.pressToContinue();
    return;
  }
  if (res.ending) { await ending(); return; } // "AMIGA" jumps straight to the credits
  if (res.tresor) { await tresorGame(res.state); return; } // "AMOS" jumps straight to the safe minigame
  await play(res.state);
}

// Launch the safe-cracking minigame directly (used by the "AMOS" code), then drop into
// normal play in the living room — or into the death sequence if the crack failed.
async function tresorGame(state) {
  activeState = state;
  ui.clear();
  ui.setBild(ROOM_LABELS[state.raum]);
  const sub = await handleCall(state, "tresor");
  if (sub && sub.died) { await deathSequence(); return; }
  await play(state);
}

// Show a fresh screen: clear the text area, print the lines, then the "Was nun ?" prompt.
// Each action replaces the screen, so only the current text is ever shown (no scrolling).
function showScreen(lines) {
  ui.clear();
  ui.print(lines);
  ui.print([{ text: "", pen: 7 }, { text: "Was nun ?", pen: 2 }]);
}

async function play(state) {
  audio.stop(); // gameplay is silent; title music only plays on the title screen
  activeState = state; // expose to the help button
  help.show();
  ui.setBild(ROOM_LABELS[state.raum]);
  showScreen(enterRoomPublic(state, state.raum)); // initial look (runs onEnter)

  while (true) {
    ui.setBild(ROOM_LABELS[state.raum]);
    const action = await ui.pickAction();

    if (action.type === "special" && action.name === "Inventar") { showScreen(inventarLines(state)); continue; }
    if (action.type === "special" && action.name === "Information") { showScreen(infoLines()); continue; }

    let cmd;
    if (action.type === "dir") {
      cmd = action.dir;
    } else if (action.verb === "Siehe um") {
      cmd = "SIEHE UM";
    } else {
      const prompts = VERB_PROMPTS[action.verb] || [];
      const nouns = [];
      let abort = false;
      for (const p of prompts) {
        const chosen = await ui.pickNoun({
          title: p,
          objects: visibleObjects(state),
          inventory: inventoryNouns(state),
        });
        if (chosen == null) { abort = true; break; }
        nouns.push(chosen);
      }
      if (abort) continue; // keep the current screen; the player just picks again
      cmd = buildCmd(action.verb, nouns);
    }

    const r = applyCommand(state, cmd);

    if (r.died) { ui.clear(); ui.print(r.lines); await deathSequence(); return; }
    if (r.call === "ending") { ui.clear(); ui.print(r.lines); await ending(); return; }
    if (r.call) {
      ui.clear(); ui.print(r.lines);
      const sub = await handleCall(state, r.call);
      if (sub && sub.died) { await deathSequence(); return; }
      ui.print([{ text: "", pen: 7 }, { text: "Was nun ?", pen: 2 }]);
      continue;
    }

    showScreen(r.lines); // normal command: clear, show the result, re-prompt
  }
}

async function handleCall(state, call) {
  if (call === "code1") { await ui.pressToContinue("Bitte klicken."); ui.clear(); ui.print(enterRoomPublic(state, "BILD3")); }
  else if (call === "code2") { await ui.pressToContinue("Bitte klicken."); ui.clear(); ui.print(enterRoomPublic(state, "BILD6")); }
  else if (call === "code3") {
    ui.print([{ text: "", pen: 7 }, { text: "Der Code für den nächsten Teil lautet : ANARCHY", pen: 5 }]);
    await ui.pressToContinue("Bitte klicken.");
    ui.clear(); ui.print(enterRoomPublic(state, "BILD2"));
  } else if (call === "tresor") {
    const t = makeTresor(() => Math.floor(Math.random() * 10));
    help.hide(); // no help during the minigame
    const win = await ui.tresor(t);
    ui.clear();
    if (win) {
      help.show();
      // Show the success right away. (The original deferred "Es gelang mir, den Tresor
      // zu öffnen." to the player's next action, so it felt like nothing happened.)
      // Reuse the engine's post-crack rule so that text stays in one place.
      state.flags.TRESORGEKNACKT = 1;
      const opened = applyCommand(state, "__GEKNACKT__");
      ui.print(opened.lines);
      ui.print(enterRoomPublic(state, "BILD4"));
    } else {
      // Failed crack: the explosive trap detonates right away. (The original deferred
      // the blast to the player's next action.) Setting VERSAGT makes BILD4's any-rule
      // yield the explosion text + death, so we reuse it as the single source here.
      state.flags.VERSAGT = 1;
      const boom = applyCommand(state, "__VERSAGT__");
      ui.print(boom.lines);
      return { died: boom.died };
    }
  }
}

// Inventory state values stay ASCII (matching/logic), but display them with umlauts.
const ITEM_DISPLAY = {
  "Schluessel": "Schlüssel",
  "Goldschluessel": "Goldschlüssel",
  "Gruener Trank": "Grüner Trank",
  "Waescheleine": "Wäscheleine",
  "Waescheleinenast": "Wäscheleinenast",
};

// Inventory items as clickable nouns (display names). Used by the click-to-pick input.
function inventoryNouns(state) {
  const out = [];
  for (let i = 1; i <= 16; i++) {
    const v = state.inv[i];
    if (v) out.push(ITEM_DISPLAY[v] || v);
  }
  return out;
}

function inventarLines(state) {
  const items = [];
  for (let i = 1; i <= 16; i++) if (state.inv[i]) items.push(ITEM_DISPLAY[state.inv[i]] || state.inv[i]);
  const lines = [{ text: "", pen: 7 }, { text: "Du trägst folgende Gegenstände bei dir :", pen: 7 }];
  if (items.length === 0) lines.push({ text: "(nichts)", pen: 9 });
  else for (const n of items) lines.push({ text: n, pen: 9 });
  return lines;
}

function infoLines() {
  return [{ text: "", pen: 7 }, ...TEXTS.info.map((t) => ({ text: t, pen: 7 }))];
}

async function deathSequence() {
  help.hide(); // no help on the death screen
  // 1) The death text ("Du bist tot." etc.) is already on screen — printed by the
  //    play loop before we got here. Let the player read it and click to continue.
  await ui.pressToContinue("Bitte klicken.");
  // 2) Then the death picture together with the death music; wait for another click.
  audio.play("death");
  await ui.imageScreen("assets/death.png", { label: "Bitte klicken." });
  // 3) Back to the title screen with the title music. (The death track used to keep
  //    looping into the menu because nothing switched it back.)
  audio.play("intro");
}

async function ending() {
  help.hide(); // no help on the victory screen
  audio.play("ending");
  // The sunset picture stays fixed on top; the credits scroll in the band below it.
  await ui.scrollText(TEXTS.ending, { image: "assets/ending.png" });
  location.reload(); // after the credits (on skip), restart fresh as if the page was reloaded
}

// Small fixed music on/off toggle in the corner.
function addMuteButton(root) {
  const b = document.createElement("button");
  b.id = "mute";
  b.className = "mute";
  b.type = "button";
  const sync = () => {
    b.textContent = tr(audio.isMuted() ? "🔇 Musik aus" : "🔊 Musik an");
    b.title = tr("Musik an/aus");
  };
  b.addEventListener("click", () => { audio.setMuted(!audio.isMuted()); sync(); });
  onLangChange(sync);
  sync();
  root.appendChild(b);
}

// DE/EN language switch, next to the help button. German browsers start in German,
// everyone else in English; the choice is remembered (see i18n.js).
function addLangSwitch(root) {
  const wrap = document.createElement("div");
  wrap.className = "lang-switch";
  const mk = (code) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = code.toUpperCase();
    btn.title = code === "de" ? "Auf Deutsch umschalten" : "Switch to English";
    btn.addEventListener("click", () => setLang(code));
    return btn;
  };
  const de = mk("de");
  const en = mk("en");
  const sync = () => {
    de.className = getLang() === "de" ? "active" : "";
    en.className = getLang() === "en" ? "active" : "";
  };
  onLangChange(sync);
  sync();
  wrap.appendChild(de);
  wrap.appendChild(en);
  root.appendChild(wrap);
}

// Boot once the DOM is ready.
const start = () => boot(document.getElementById("amiga"));
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
