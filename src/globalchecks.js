// ALLGEMEINEFRAGEN — reactions valid in every room (source 516-546).
// Checked at the top of every room loop, before room-specific rules.
// Display text uses real umlauts; cmd keys and item-name state values stay ASCII.
import { condMet } from "./engine.js";

export const RULES = [
  { if: { slotIst: { slot: 1, name: "Schluessel" } }, cmd: "SCHAU ANSCHLUESSEL", say: "Ein kleiner bronzener Schlüssel." },
  { if: { slotIst: { slot: 2, name: "Brief" } }, cmd: "OEFFNEBRIEF", say: "Ich habe den Brief geöffnet.", set: { BRIEFOFFEN: 1 } },
  { if: [{ slotIst: { slot: 2, name: "Brief" } }, { flag: "BRIEFOFFEN", eq: 1 }], cmd: "SCHAU ANBRIEF",
    say: ["Das ist die Zeitschrift - Diebe Heute -. Grundkurs Tresorknacken", "mit System. Das ist sehr interessant."], set: { BRIEFGELESEN: 1 } },
  { if: [{ slotIst: { slot: 2, name: "Brief" } }, { flag: "BRIEFOFFEN", eq: 0 }], cmd: "SCHAU ANBRIEF", say: "Das ist eine Warensendung." },
  { if: { slotIst: { slot: 3, name: "Frucht" } }, cmd: "SCHAU ANFRUCHT", say: "Ich sah so eine merkwürdige Frucht nie zuvor." },
  { if: { slotIst: { slot: 3, name: "Frucht" } }, cmd: "ISSFRUCHT", say: "Unter haeftigen Krämpfen windest du dich am Boden. Du bist tot.", die: true },
  { if: { slotIst: { slot: 4, name: "Ast" } }, cmd: "SCHAU ANAST", say: "Es ist ein langer,dünner Ast." },
  { if: { slotIst: { slot: 5, name: "Stein" } }, cmd: "SCHAU ANSTEIN", say: "Was für ein toller Stein." },
  { if: { slotIst: { slot: 6, name: "Stetoskop" } }, cmd: "SCHAU ANSTETOSKOP", say: "Damit hört einen der Arzt ab." },
  { if: { slotIst: { slot: 7, name: "Goldschluessel" } }, cmd: "SCHAU ANGOLDSCHLUESSEL", say: "Das ist ein kleiner goldener Schlüssel mit einem Edelstein drauf." },
  { if: { slotIst: { slot: 8, name: "Blauer Trank" } }, cmd: "SCHAU ANBLAUER TRANK", say: "Wenn du dies trinkst, bekommst du Antwort auf alle Fragen." },
  { if: { slotIst: { slot: 9, name: "Gruener Trank" } }, cmd: "SCHAU ANGRUENER TRANK", say: "Wenn du dies trinkst, wirst du sehr weise sein." },
  { if: { slotIst: { slot: 10, name: "Roter Trank" } }, cmd: "SCHAU ANROTER TRANK", say: "Wenn du dies trinkst, sollten dir Fitnesscenter weitestgehend egal sein." },
  { if: { slotIst: { slot: 8, name: "Blauer Trank" } }, cmd: "TRINKBLAUER TRANK",
    say: ["Tausende von Formeln rasen durch dein Gehirn. Doch da dein IQ zu niedrig ist,", "wirst du verrückt und läufst gegen eine Wand. Du bist tot."], die: true },
  { if: { slotIst: { slot: 9, name: "Gruener Trank" } }, cmd: "TRINKGRUENER TRANK",
    say: ["Du merkst,wie deine Haut langsam faltig wird und deine Haare weiß werden.", "Du bist tot."], die: true },
  { if: { slotIst: { slot: 10, name: "Roter Trank" } }, cmd: "TRINKROTER TRANK", say: "Ich will den jetzt noch nicht trinken." },
  { if: { slotIst: { slot: 11, name: "Hammer" } }, cmd: "SCHAU ANHAMMER", say: "Der Hammer ist verrostet." },
  { if: { slotIst: { slot: 12, name: "Krug" } }, cmd: "SCHAU ANKRUG", say: "Das ist ein schöner Zinnkrug." },
  { if: { slotIst: { slot: 12, name: "Bierkrug" } }, cmd: "BENUTZEFRUCHTBIERKRUG", say: "Ich habe das Bier mit etwas Saft der Frucht vermischt.", give: { slot: 12, name: "Giftbierkrug" } },
  { if: { slotIst: { slot: 12, name: "Bierkrug" } }, cmd: "SCHAU ANBIERKRUG", say: "Der Krug ist mit Bier gefüllt." },
  { if: { slotIst: { slot: 12, name: "Giftbierkrug" } }, cmd: "SCHAU ANGIFTBIERKRUG", say: "Sieht ungesund aus ..." },
  { if: { slotIst: { slot: 13, name: "Drahtschere" } }, cmd: "SCHAU ANDRAHTSCHERE", say: "Eine scharfe Drahtschere." },
  { if: { slotIst: { slot: 14, name: "Uniform" } }, cmd: "SCHAU ANUNIFORM", say: "Das ist eine Soldatenuniform." },
  { if: { slotIst: { slot: 15, name: "Waescheleine" } }, cmd: "SCHAU ANWAESCHELEINE", say: "Sieht stabil aus." },
  { if: { slotIst: { slot: 16, name: "Waescheleinenast" } }, cmd: "SCHAU ANWAESCHELEINENAST", say: "Den kann man gut irgendwo verhaken." },
];

// Returns { lines, died } on first matching rule, else null.
export function globalCheck(s, cmd) {
  for (const r of RULES) {
    if (r.cmd === cmd && condMet(s, r.if)) {
      const out = [];
      if (r.set) for (const k in r.set) s.flags[k] = r.set[k];
      if (r.give) s.inv[r.give.slot] = r.give.name;
      const arr = Array.isArray(r.say) ? r.say : [r.say];
      for (const line of arr) out.push({ text: line, pen: 7 });
      return { lines: out, died: !!r.die };
    }
  }
  return null;
}
