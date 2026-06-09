// DOM/presentation layer for the Amiga-style two-screen UI. Browser-only.
// All gameplay logic lives in engine.js; this module only renders + collects input.
// Everything the player sees is run through tr() so the UI can switch DE/EN live.
import { tr, onLangChange } from "./i18n.js";

const PEN = (n) => `var(--pen${n})`;

// The 12 verbs of the lower menu, laid out as in the original UBERSCHREIBE proc.
const VERB_LAYOUT = [
  ["Siehe um", "Ziehe"],
  ["Drücke", "Benutze"],
  ["Öffne", "Gib"],
  ["Schau an", "Nimm"],
  ["Trink", "Iss"],
];
const VERB_EXTRA = ["Inventar", "Information"];

export function createUI(root) {
  const elText = root.querySelector("#text");
  const elBild = root.querySelector("#bild");
  const elMenu = root.querySelector("#screen2");

  // --- live language switching -------------------------------------------
  // The German lines of the current print-based screen, so they can be re-rendered
  // in the new language without the caller re-issuing them. Custom screens
  // (intro/credits/tresor/splash) own #text directly and opt out of this.
  let screenLines = [];
  let customText = false;     // true while a non-print screen owns #text
  let rebuildControls = null; // re-renders the active #screen2 control in the new language
  let bildLabel = "";         // German room label currently in the picture box
  let helpBtnEl = null;       // corner help button, relabelled on switch

  function renderLine(l) {
    const div = document.createElement("div");
    if (!l.text || l.text.trim() === "") {
      div.className = "blank";
    } else {
      div.className = "ln";
      div.textContent = tr(l.text);
      div.style.color = PEN(l.pen ?? 7);
    }
    elText.appendChild(div);
  }

  function print(lines) {
    customText = false;
    for (const l of lines) { screenLines.push(l); renderLine(l); }
    elText.scrollTop = elText.scrollHeight;
  }

  function clear() { elText.innerHTML = ""; screenLines = []; customText = false; }

  function setBild(label) {
    bildLabel = label || "";
    elBild.style.display = ""; // restore the picture box (intro/menu may have hidden it)
    elBild.innerHTML = "";
    elBild.textContent = tr(bildLabel);
  }

  function controls(node) {
    elMenu.innerHTML = "";
    elMenu.appendChild(node);
  }

  // Register (and immediately run) the builder for the current #screen2 control, so a
  // language switch can rebuild it with translated labels but the SAME resolve closure.
  function setControls(build) { rebuildControls = build; build(); }

  function button(label, onClick, cls = "btn") {
    const b = document.createElement("button");
    b.className = cls;
    b.textContent = tr(label);
    b.addEventListener("click", onClick);
    return b;
  }

  // Re-render the current screen when the language changes.
  onLangChange(() => {
    if (!customText) {
      const saved = screenLines;
      screenLines = [];
      elText.innerHTML = "";
      for (const l of saved) { screenLines.push(l); renderLine(l); }
    }
    if (rebuildControls) rebuildControls();
    if (bildLabel) elBild.textContent = tr(bildLabel);
    if (helpBtnEl) { helpBtnEl.textContent = tr("❓ Hilfe"); helpBtnEl.title = tr("Hilfe — Tipp zum nächsten Schritt"); }
  });

  // Render the verb menu + movement cross; resolve with the chosen action.
  // -> { type:"verb", verb } | { type:"dir", dir } | { type:"special", name }
  function pickAction() {
    return new Promise((resolve) => setControls(() => {
      const grid = document.createElement("div");
      grid.className = "verbgrid";

      const col1 = document.createElement("div"); col1.className = "verbcol";
      const col2 = document.createElement("div"); col2.className = "verbcol";
      for (const [a, b] of VERB_LAYOUT) {
        col1.appendChild(button(a, () => resolve({ type: "verb", verb: a })));
        col2.appendChild(button(b, () => resolve({ type: "verb", verb: b })));
      }
      // extra column items (Inventar/Information) appended to col2 area via a third stack
      const col3 = document.createElement("div"); col3.className = "verbcol";
      for (const name of VERB_EXTRA) {
        col3.appendChild(button(name, () => resolve({ type: "special", name })));
      }
      const cross = document.createElement("div"); cross.className = "cross";
      const mk = (label, cls, dir) => button(label, () => resolve({ type: "dir", dir }), "btn " + cls);
      const mid = document.createElement("div"); mid.className = "btn mid";
      cross.appendChild(mk("V", "v", "V"));
      cross.appendChild(mk("L", "l", "L"));
      cross.appendChild(mid);
      cross.appendChild(mk("R", "r", "R"));
      cross.appendChild(mk("H", "h", "H"));

      const right = document.createElement("div"); right.className = "verbcol";
      right.appendChild(col3);
      right.appendChild(cross);

      grid.appendChild(col1);
      grid.appendChild(col2);
      grid.appendChild(right);
      controls(grid);
    }));
  }

  // Ask for a single noun via a text field. Resolves with the trimmed string.
  function ask(promptText) {
    return new Promise((resolve) => {
      let val = "";
      setControls(() => {
        const wrap = document.createElement("form");
        wrap.className = "prompt";
        const label = document.createElement("label");
        label.textContent = tr(promptText);
        const input = document.createElement("input");
        input.autocomplete = "off"; input.autocapitalize = "off"; input.spellcheck = false;
        input.value = val;
        input.addEventListener("input", () => { val = input.value; });
        wrap.appendChild(label); wrap.appendChild(input);
        wrap.addEventListener("submit", (e) => { e.preventDefault(); resolve(input.value.trim()); });
        controls(wrap);
        input.focus();
      });
    });
  }

  // Yes/No question answered by clicking Ja/Nein (or pressing J/N). Resolves a boolean.
  function confirm(promptText, { yes = "Ja", no = "Nein" } = {}) {
    return new Promise((resolve) => {
      if (promptText) print([{ text: promptText, pen: 2 }]);
      const finish = (val) => { window.removeEventListener("keydown", onKey); resolve(val); };
      const onKey = (e) => {
        const k = e.key.toLowerCase();
        if (k === "j" || k === "y") { e.preventDefault(); finish(true); }
        else if (k === "n") { e.preventDefault(); finish(false); }
      };
      window.addEventListener("keydown", onKey);
      setControls(() => {
        const wrap = document.createElement("div"); wrap.className = "actions";
        wrap.appendChild(button(yes, () => finish(true)));
        wrap.appendChild(button(no, () => finish(false)));
        controls(wrap);
      });
    });
  }

  // Pick a noun by clicking instead of typing. Renders the visible room objects and the
  // inventory as two groups of buttons. Resolves with the chosen label, or null on cancel.
  function pickNoun({ title, objects = [], inventory = [] }) {
    return new Promise((resolve) => setControls(() => {
      const wrap = document.createElement("div"); wrap.className = "nounpick";
      if (title) {
        const titleEl = document.createElement("div"); titleEl.className = "nountitle"; titleEl.textContent = tr(title);
        wrap.appendChild(titleEl);
      }
      const group = (heading, items) => {
        if (!items.length) return;
        const h = document.createElement("div"); h.className = "noungroup"; h.textContent = tr(heading);
        const row = document.createElement("div"); row.className = "nounrow";
        // buttons display the translated label but resolve the original German token (parser stays German)
        for (const label of items) row.appendChild(button(label, () => resolve(label)));
        wrap.appendChild(h); wrap.appendChild(row);
      };
      group("Im Raum", objects);
      group("Inventar", inventory);
      if (!objects.length && !inventory.length) {
        const none = document.createElement("div"); none.className = "noungroup";
        none.textContent = tr("Hier gibt es nichts."); wrap.appendChild(none);
      }
      wrap.appendChild(button("Abbrechen", () => resolve(null), "btn cancel"));
      controls(wrap);
    }));
  }

  // Wait for a click / key / SPACE to continue.
  function pressToContinue(label = "Weiter") {
    return new Promise((resolve) => {
      const done = () => { window.removeEventListener("keydown", onKey); resolve(); };
      const onKey = (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); done(); } };
      window.addEventListener("keydown", onKey);
      setControls(() => {
        const wrap = document.createElement("div"); wrap.className = "actions";
        wrap.appendChild(button(label, done));
        controls(wrap);
      });
    });
  }

  // Main menu: title + numbered options. Resolves with 1..n.
  function menu(title, items, { image } = {}) {
    return new Promise((resolve) => {
      const onKey = (e) => {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= items.length) { window.removeEventListener("keydown", onKey); resolve(n); }
      };
      window.addEventListener("keydown", onKey);
      setControls(() => {
        clear();
        customText = true; // the menu owns #text (picture + title); opt out of generic re-render
        if (image) {
          // Show the castle picture big above the title (the picture box is hidden).
          elBild.style.display = "none";
          const host = document.createElement("div"); host.className = "intro";
          const pic = document.createElement("img"); pic.className = "intro-pic"; pic.src = image; pic.alt = "Dark Castle";
          const titleEl = document.createElement("div"); titleEl.className = "title"; titleEl.textContent = tr(title);
          host.appendChild(pic); host.appendChild(titleEl);
          elText.appendChild(host);
        } else {
          const titleEl = document.createElement("div"); titleEl.className = "title"; titleEl.textContent = tr(title);
          elText.appendChild(titleEl);
        }
        const list = document.createElement("div"); list.className = "menu-list actions"; list.style.flexDirection = "column";
        items.forEach((label, i) => {
          list.appendChild(button(label, () => { window.removeEventListener("keydown", onKey); resolve(i + 1); }));
        });
        controls(list);
      });
    });
  }

  // Full-screen text page (manual, backstory, info). Resolves on continue.
  async function page(lines, { title } = {}) {
    clear();
    if (title) print([{ text: title, pen: 12 }, { text: "", pen: 7 }]);
    print(lines.map((t) => (typeof t === "string" ? { text: t, pen: 7 } : t)));
    await pressToContinue("S P A C E");
  }

  // Vertical auto-scroll for the ending credits. With `image`, the original layout is
  // reproduced: the picture stays fixed on top and the text scrolls only in the band
  // below it (clipped, so it never rises over the picture). Loops from the start when
  // it finishes; Click/Space/Überspringen skips (resolves). Slow, readable pace.
  function scrollText(lines, { title, image } = {}) {
    return new Promise((resolve) => {
      clear();
      customText = true; rebuildControls = null; // animated credits own #text; no live rebuild
      let clip = elText; // the element that bounds + clips the scroll (full screen by default)
      if (image) {
        elBild.style.display = "none"; // the big sunset replaces the small picture box
        const host = document.createElement("div"); host.className = "endscreen";
        const pic = document.createElement("img"); pic.className = "end-pic"; pic.src = image; pic.alt = "";
        host.appendChild(pic);
        clip = document.createElement("div"); clip.className = "end-clip";
        host.appendChild(clip);
        elText.appendChild(host);
      }
      const inner = document.createElement("div");
      if (image) inner.className = "end-scroll";
      if (title) {
        const titleEl = document.createElement("div"); titleEl.className = "title"; titleEl.textContent = tr(title);
        inner.appendChild(titleEl);
      }
      for (const ln of lines) {
        const d = document.createElement("div");
        d.className = ln.trim() === "" ? "blank" : "ln center";
        d.textContent = tr(ln);
        inner.appendChild(d);
      }
      clip.appendChild(inner);
      // Start the credits part-way up the band instead of fully below it, so the text
      // shows up sooner rather than scrolling all the way in from the bottom first.
      const lead = Math.round(clip.clientHeight * 0.45);
      inner.style.transform = `translateY(${lead}px)`;
      let y = lead;
      let raf = 0;
      const end = inner.scrollHeight;
      const finish = () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", onKey); elBild.style.display = ""; resolve(); };
      const onKey = (e) => { if (e.key === " " || e.key === "Enter") finish(); };
      window.addEventListener("keydown", onKey);
      const tick = () => {
        y -= 0.35; // slow, readable pace
        inner.style.transform = `translateY(${y}px)`;
        if (y < -end) y = lead; // loop with the same short lead-in
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      const skip = button("Überspringen", finish);
      const wrap = document.createElement("div"); wrap.className = "actions";
      wrap.appendChild(skip);
      controls(wrap);
    });
  }

  // Horizontal infinite ticker for the intro (matches the original AMOS marquee:
  // Def Scroll ... -2,0 looping forever). Two copies of the text scroll right-to-left;
  // when the first has fully passed we shift by one copy width, so the text flows
  // seamlessly from its end straight back into its start. Space/Enter/skip resolves.
  function marquee(text, { image } = {}) {
    return new Promise((resolve) => {
      clear();
      customText = true; rebuildControls = null; // animated ticker owns #text (text is pre-translated by the caller)
      const host = document.createElement("div");
      host.className = "intro";
      if (image) {
        // Big picture on top, ticker band at the bottom (as in the original). The
        // small picture box above is hidden for the intro and restored afterwards.
        elBild.style.display = "none";
        const pic = document.createElement("img");
        pic.className = "intro-pic";
        pic.src = image;
        pic.alt = "Dark Castle";
        host.appendChild(pic);
      }
      const clip = document.createElement("div"); clip.className = "marquee-clip";
      const lane = document.createElement("div"); lane.className = "marquee-lane";
      const mk = () => { const d = document.createElement("div"); d.className = "marquee-item"; d.textContent = text; return d; };
      const a = mk();
      lane.appendChild(a);
      lane.appendChild(mk());
      clip.appendChild(lane);
      host.appendChild(clip);
      elText.innerHTML = "";
      elText.appendChild(host);

      let x = clip.clientWidth || elText.clientWidth || 320; // start just off the right edge
      const oneW = a.scrollWidth || 1; // width of one copy incl. trailing gap (padding)
      const speed = 1.0; // px per frame
      let raf = 0;
      const finish = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKey);
        elBild.style.display = "";
        resolve();
      };
      const onKey = (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); finish(); } };
      window.addEventListener("keydown", onKey);
      const tick = () => {
        x -= speed;
        if (x <= -oneW) x += oneW; // seamless wrap: the second copy takes over
        lane.style.transform = `translateX(${x}px)`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      const wrap = document.createElement("div"); wrap.className = "actions";
      wrap.appendChild(button("Klick zum Starten", finish));
      controls(wrap);
    });
  }

  // Full-screen picture with an optional caption + continue control. Used for the
  // pre-intro "THE NEW STYLE" splash (autoMs auto-advances) and the death screen.
  function imageScreen(src, { lines = [], pen = 4, label = "Weiter", autoMs = 0, fade = 0, smooth = false } = {}) {
    return new Promise((resolve) => {
      clear();
      customText = true; rebuildControls = null; // full-screen picture owns #text
      elBild.style.display = "none";
      const host = document.createElement("div"); host.className = "intro";
      const pic = document.createElement("img"); pic.className = "intro-pic"; pic.src = src; pic.alt = "";
      if (smooth) pic.style.imageRendering = "auto"; // high-res logo: scale smoothly, not nearest-neighbour
      host.appendChild(pic);
      if (lines.length) {
        const box = document.createElement("div"); box.className = "intro-text";
        for (const ln of lines) {
          const d = document.createElement("div");
          d.className = ln.trim() === "" ? "blank" : "ln center";
          d.textContent = tr(ln);
          d.style.color = PEN(pen);
          box.appendChild(d);
        }
        host.appendChild(box);
      }
      elText.appendChild(host);

      let timer = 0;
      let done = false;
      const delay = (ms) => new Promise((r) => setTimeout(r, ms));
      const finish = async () => {
        if (done) return; done = true;
        if (timer) clearTimeout(timer);
        window.removeEventListener("keydown", onKey);
        if (fade > 0) {
          // Crossfade through black (like the original "Fade 4"): cover the screen,
          // hand off so the next view renders underneath, then reveal it.
          const ov = document.createElement("div");
          ov.className = "fade-black";
          ov.style.transition = `opacity ${fade}ms linear`;
          ov.style.opacity = "0";
          document.body.appendChild(ov);
          void ov.offsetWidth; // force a reflow so opacity:0 is committed before the change below
          ov.style.opacity = "1"; // now this transitions (fades the logo to black)
          await delay(fade);
          elBild.style.display = "";
          resolve();
          await delay(30); // let the next screen paint behind the black cover
          ov.style.opacity = "0";
          await delay(fade);
          ov.remove();
        } else {
          elBild.style.display = "";
          resolve();
        }
      };
      const onKey = (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); finish(); } };
      window.addEventListener("keydown", onKey);
      const bar = document.createElement("div"); bar.className = "actions";
      bar.appendChild(button(label, finish));
      controls(bar);
      if (autoMs > 0) timer = setTimeout(finish, autoMs);
    });
  }

  // Safe-cracking minigame UI driven by a tresor object (from makeTresor).
  // Resolves true on success, false on failure/timeout.
  function tresor(t, { seconds = 45 } = {}) {
    return new Promise((resolve) => {
      const audio = makeBeep();

      // The actual minigame. The countdown only starts here — i.e. after the player has
      // read the notice and clicked to begin — so adjusting the volume costs no time.
      const startGame = () => {
        clear();
        print([
          { text: "Drücke -Links- und achte auf das Geräusch (Glocke = richtige Ziffer).", pen: 7 },
          { text: "Mit -Position- wählst du die Stelle. Mit -Öffnen- prüfst du den Code.", pen: 7 },
        ]);
        customText = true; rebuildControls = null; // minigame owns #text; no live rebuild mid-crack
        const dwrap = document.createElement("div");
        const digits = document.createElement("div"); digits.className = "tresor-digits";
        const marker = document.createElement("div"); marker.className = "tresor-pos";
        const timeEl = document.createElement("div"); timeEl.className = "tresor-time";
        dwrap.appendChild(digits); dwrap.appendChild(marker); dwrap.appendChild(timeEl);

        let timeLeft = seconds;
        const render = () => {
          digits.textContent = t.cur.join(" ");
          marker.textContent = t.cur.map((_, i) => (i === t.pos ? "^" : " ")).join(" ");
          timeEl.textContent = tr("Zeit: ") + timeLeft;
        };
        const finish = (win) => { clearInterval(iv); window.removeEventListener("keydown", onKey); resolve(win); };
        const left = () => { t.left(); if (t.cur[t.pos] === t.target[t.pos]) audio(880); else audio(220); render(); };
        const right = () => { t.right(); render(); };
        const open = () => finish(t.check());

        const onKey = (e) => {
          if (e.key === "ArrowUp" || e.key.toLowerCase() === "l") left();
          else if (e.key === "ArrowRight" || e.key.toLowerCase() === "p") right();
          else if (e.key === " ") { e.preventDefault(); open(); }
        };
        window.addEventListener("keydown", onKey);

        const bar = document.createElement("div"); bar.className = "actions";
        bar.appendChild(button("Links (zählen)", left));
        bar.appendChild(button("Position", right));
        bar.appendChild(button("Öffnen", open));
        controls(bar);

        const host = document.createElement("div");
        host.appendChild(dwrap);
        elText.appendChild(host);
        render();

        const iv = setInterval(() => {
          timeLeft -= 1; render();
          if (timeLeft <= 0) finish(false);
        }, 1000);
      };

      // Pre-game notice: the safe is cracked BY EAR, so the sound must be on.
      clear();
      print([
        { text: "Du machst dich an den Tresor.", pen: 2 },
        { text: "WICHTIG: Schalte den Ton ein! Du knackst ihn nach Gehör —", pen: 4 },
        { text: "eine Glocke verrät die richtige Ziffer.", pen: 4 },
        { text: tr("Die Zeit (%d Sek.) läuft erst los, wenn du startest.").replace("%d", seconds), pen: 7 },
      ]);
      customText = true; rebuildControls = null; // notice screen; language applies on re-entry
      const startBar = document.createElement("div"); startBar.className = "actions";
      startBar.appendChild(button("Tresor angehen", startGame));
      controls(startBar);
    });
  }

  // Corner help button (mounted once). getHints() -> { hints:[s1,s2,s3] }.
  function helpButton(getHints) {
    const b = document.createElement("button");
    b.className = "help-btn";
    b.textContent = tr("❓ Hilfe");
    b.title = tr("Hilfe — Tipp zum nächsten Schritt");
    helpBtnEl = b; // so the language switch can relabel it
    b.addEventListener("click", () => helpOverlay(getHints().hints));
    root.appendChild(b);
    return { show() { b.style.display = ""; }, hide() { b.style.display = "none"; } };
  }

  // Dream overlay with escalating levels (1 -> 2 -> 3) + Mehr Hilfe / Schließen.
  function helpOverlay(hints) {
    let level = 0;
    const ov = document.createElement("div"); ov.className = "help-overlay";
    const box = document.createElement("div"); box.className = "help-box";
    const text = document.createElement("div"); text.className = "help-text";
    const bar = document.createElement("div"); bar.className = "actions";
    const more = button("Mehr Hilfe", () => { if (level < 2) { level += 1; render(); } });
    const close = button("Schließen", () => ov.remove());
    const render = () => {
      text.textContent = tr((hints && hints[level]) || "Dazu fällt mir gerade kein Rat ein.");
      more.style.display = (hints && level < 2 && hints[level + 1]) ? "" : "none";
    };
    bar.appendChild(more); bar.appendChild(close);
    box.appendChild(text); box.appendChild(bar);
    ov.appendChild(box); root.appendChild(ov);
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
    render();
  }

  return { print, clear, setBild, pickAction, ask, confirm, pickNoun, pressToContinue, menu, page, scrollText, marquee, imageScreen, tresor, helpButton };
}

// Tiny WebAudio beep for the safe (high pitch = right digit, low = wrong).
function makeBeep() {
  let ctx = null;
  return (freq) => {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const play = () => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "square"; o.frequency.value = freq;
        const t0 = ctx.currentTime;
        // Audible level with a quick attack/decay envelope (the old 0.04/60ms blip was
        // far too quiet+short to notice). Times are read at play time, after any resume.
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + 0.22);
      };
      // Normally the context is already "running" when created in a click; resume() is a
      // safety net, and we only schedule the tone once it's running (no suspended-start race).
      if (ctx.state === "suspended" && ctx.resume) ctx.resume().then(play).catch(() => {});
      else play();
    } catch { /* audio optional */ }
  };
}
