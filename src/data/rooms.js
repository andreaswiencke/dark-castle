// All 13 rooms (BILD1..BILD13), transcribed from the original AMOS source.
// Rule order mirrors the original If-chains: first match wins.
// Display text uses real umlauts/ß; cmd keys and item-name state values stay ASCII.
// Rule shape: { cmd | any, if?, say?, pen?, set?, give?, take?, go?, call?, die?, fn? }
//   - cmd: exact uppercase command  | any:true: matches any non-empty command
//   - fn(s) -> { lines?, set via mutation, die?, call?, go? } : escape hatch for special cases

const ITEMS_SECTION1 = [
  { slotIst: { slot: 1, name: "Schluessel" } },
  { slotIst: { slot: 2, name: "Brief" } },
  { slotIst: { slot: 3, name: "Frucht" } },
  { slotIst: { slot: 4, name: "Ast" } },
  { slotIst: { slot: 5, name: "Stein" } },
];

const SCHISS_LINES = [
  { text: "Wieso liegt in so einer schönen Kiste eine so hässliche Drahtschere ?", pen: 13 },
  { text: "Sooooo hässlich ist sie nun auch wieder nicht.", pen: 14 },
  { text: "Aber wieso liegt die in der Kiste und nicht beim Gerümpel ?", pen: 13 },
  { text: "Frag das den Programmierer !", pen: 14 },
];

export const ROOMS = {
  // =========================================================================
  BILD1: {
    onEnter(s) { /* Fussmatte/Fenster/Briefkasten always visible */ },
    look(s) {
      const l = [
        { text: "Ich stehe vor einem alten Haus in schlechtem Zustand.", pen: 7 },
        { text: "Den Wald habe ich hinter mir gelassen.", pen: 7 },
        { text: "Mögliche Richtungen : nach Vorne", pen: 9 },
        { text: "Ich sehe folgende Gegenstände :", pen: 7 },
        { text: "Fußmatte  Fenster  Briefkasten", pen: 9 },
      ];
      if (s.flags.GEGENSTAND1D === 1) l.push({ text: "Schlüssel", pen: 9 });
      if (s.flags.GEGENSTAND1E === 1) l.push({ text: "Brief", pen: 9 });
      l.push({ text: "Tür", pen: 9 });
      return l;
    },
    objects: [
      { label: "Fußmatte" },
      { label: "Fenster" },
      { label: "Briefkasten" },
      { label: "Schlüssel", if: { flag: "GEGENSTAND1D", eq: 1 } },
      { label: "Brief", if: { flag: "GEGENSTAND1E", eq: 1 } },
      { label: "Tür" },
    ],
    rules: [
      { cmd: "ZIEHEFUSSMATTE", if: [{ flag: "MATTE", eq: 0 }, { flag: "DURCH", eq: 0 }, { flag: "BILD1GENOMMEN", eq: 0 }],
        say: "Unter der Matte liegt ein Schlüssel (was sonst?).", set: { BILD1GEZOGEN: 1, GEGENSTAND1D: 1, MATTE: 1 } },
      { cmd: "NIMMSCHLUESSEL", if: [{ flag: "DURCH", eq: 0 }, { flag: "BILD1GENOMMEN", eq: 0 }, { flag: "GEGENSTAND1D", eq: 1 }],
        say: "Ich habe den Schlüssel genommen.", give: { slot: 1, name: "Schluessel" }, set: { BILD1GENOMMEN: 1, GEGENSTAND1D: 0 } },
      { cmd: "SCHAU ANFENSTER", say: "Das Fenster ist vergittert. Es ist dunkel drinnen." },
      { cmd: "OEFFNETUER", say: "Die Tür ist abgeschlossen." },
      { cmd: "BENUTZESCHLUESSELTUER", if: { flag: "BILD1GENOMMEN", eq: 1 }, say: "Der Schlüssel passt nicht. (Wir sind nicht bei -Maniac Mansion- !)" },
      { cmd: "V", go: "BILD2" },
      { cmd: "H", say: "Ich will nicht kneifen." },
      { cmd: "SCHAU ANBRIEFKASTEN", if: { leer: 2 }, say: "Da steckt ein Brief drin.", set: { BILD1GESCHAUT: 1, GEGENSTAND1E: 1 } },
      { cmd: "SCHAU ANBRIEFKASTEN", say: "Er ist alt und rostig." },
      { cmd: "OEFFNEBRIEF", if: [{ flag: "BRIEFOFFEN", eq: 0 }, { slotIst: { slot: 2, name: "Brief" } }], say: "Ich habe den Brief geöffnet.", set: { BRIEFOFFEN: 1 } },
      { cmd: "OEFFNEBRIEF", if: { flag: "BRIEFOFFEN", eq: 0 }, say: "Vieleicht sollte ich den Brief vorher nehmen." },
      { cmd: "NIMMBRIEF", if: [{ flag: "DURCH", eq: 0 }, { flag: "GEGENSTAND1E", eq: 1 }], say: "Ich habe den Brief genommen.", give: { slot: 2, name: "Brief" }, set: { GEGENSTAND1E: 0 } },
      { cmd: "SCHAU ANFUSSMATTE", say: "Es ist eine hässliche Fußmatte mit einem Frosch drauf. Er sagt Hallo." },
      { cmd: "SCHAU ANSCHLUESSEL", if: { flag: "BILD1GEZOGEN", eq: 1 }, say: "Ein kleiner bronzener Schlüssel." },
      // 686: delegate to global behavior (read magazine) — inlined to keep precedence over 687
      { cmd: "SCHAU ANBRIEF", if: { flag: "BRIEFOFFEN", eq: 1 },
        say: ["Das ist die Zeitschrift - Diebe Heute -. Grundkurs Tresorknacken", "mit System. Das ist sehr interessant."], set: { BRIEFGELESEN: 1 } },
      { cmd: "SCHAU ANBRIEF", if: { flag: "BILD1GESCHAUT", eq: 1 }, say: "Das ist eine Warensendung." },
      { cmd: "SCHAU ANTUER", say: "Es ist eine schwere Eichentür mit einem Schloss." },
    ],
  },

  // =========================================================================
  BILD2: {
    onEnter(s) {
      s.flags.GEGENSTAND2A = 1; s.flags.GEGENSTAND2B = 1; s.flags.GEGENSTAND2C = 1; s.flags.GEGENSTAND2D = 1;
      s.flags.GEGENSTAND2E = 1; // (original line 727 typo GENSTAND2E fixed)
    },
    look(s) {
      const l = [];
      if (s.flags.DURCH === 1 && s.flags.DURCHGELESEN === 0) {
        l.push({ text: "Oh nein. Jetzt bin ich wieder hinter dem Haus.", pen: 7 });
        l.push({ text: "Verflixt nochmal. Ich will jetzt zu Agathe, hört ihr. SOFORT !!!", pen: 7 });
        s.flags.DURCHGELESEN = 1;
      } else {
        l.push({ text: "Ich befinde mich an der Rückseite des Hauses.", pen: 7 });
        l.push({ text: "Der Garten ist total verkommen. Hier wächst ein Baum.", pen: 7 });
        l.push({ text: "Von der Wand bröckelt der Putz und rechts unten sind Blutspuren.", pen: 7 });
      }
      let dirs = "Mögliche Richtungen : nach Hinten";
      if (s.flags.FENSTER2WEG === 1) dirs += ", nach Vorne";
      if (s.flags.VERHAKT === 1) dirs += ", nach Rechts";
      l.push({ text: dirs, pen: 9 });
      l.push({ text: "Ich sehe folgende Gegenstände :", pen: 7 });
      if (s.flags.GEGENSTAND2A === 1) l.push({ text: "Fenster", pen: 9 });
      if (s.flags.GEGENSTAND2B === 1) l.push({ text: "Baum", pen: 9 });
      if (s.flags.GEGENSTAND2C === 1) l.push({ text: "Brunnen", pen: 9 });
      if (s.flags.GEGENSTAND2D === 1) l.push({ text: "Blutspuren", pen: 9 });
      if (s.inv[5] === "" && s.flags.DURCH === 0 && s.flags.GEGENSTAND2E === 1) l.push({ text: "Stein", pen: 9 });
      if (s.flags.DURCH === 0 && s.flags.GEGENSTAND2F === 1) l.push({ text: "Ast", pen: 9 });
      if (s.flags.DURCH === 0 && s.flags.GEGENSTAND2G === 1) l.push({ text: "Frucht", pen: 9 });
      if (s.flags.DURCH === 1 && s.inv[15] === "") l.push({ text: "Wäscheleine", pen: 9 });
      return l;
    },
    objects: [
      { label: "Fenster", if: { flag: "GEGENSTAND2A", eq: 1 } },
      { label: "Baum", if: { flag: "GEGENSTAND2B", eq: 1 } },
      { label: "Brunnen", if: { flag: "GEGENSTAND2C", eq: 1 } },
      { label: "Blutspuren", if: { flag: "GEGENSTAND2D", eq: 1 } },
      { label: "Stein", if: [{ leer: 5 }, { flag: "DURCH", eq: 0 }, { flag: "GEGENSTAND2E", eq: 1 }] },
      { label: "Ast", if: [{ flag: "DURCH", eq: 0 }, { flag: "GEGENSTAND2F", eq: 1 }] },
      { label: "Frucht", if: [{ flag: "DURCH", eq: 0 }, { flag: "GEGENSTAND2G", eq: 1 }] },
      { label: "Wäscheleine", if: [{ flag: "DURCH", eq: 1 }, { leer: 15 }] },
    ],
    rules: [
      { cmd: "V", if: { flag: "DURCH", eq: 1 }, say: "Nicht schon wieder da rein." },
      { cmd: "R", if: { flag: "VERHAKT", eq: 1 }, go: "BILD11" },
      { cmd: "SCHAU ANBAUM", if: { flag: "BAUMGESEHEN", eq: 1 }, say: "Ein Baum. Nichts weiter." },
      { cmd: "NIMMSTEIN", if: [{ leer: 5 }, { flag: "DURCH", eq: 0 }], say: "Der Stein liegt hinter einem Zaun. Ich komme nicht ran !" },
      { cmd: "SCHAU ANBAUM", if: { flag: "DURCH", eq: 0 }, say: "Am Baum hängt ein dicker Ast und eine grüne Frucht.", set: { GEGENSTAND2F: 1, GEGENSTAND2G: 1, BAUMGESEHEN: 1 } },
      { cmd: "SCHAU ANBAUM", if: { flag: "DURCH", eq: 1 }, say: "Ein Baum. Nichts weiter." },
      { cmd: "NIMMFRUCHT", if: [{ flag: "DURCH", eq: 0 }, { flag: "GEGENSTAND2G", eq: 1 }], say: "Ich habe die Frucht genommen.", set: { GEGENSTAND2G: 0 }, give: { slot: 3, name: "Frucht" } },
      { cmd: "ISSFRUCHT", if: { leer: 3 }, say: "Ich kann sie nicht essen. Ich muss sie erst nehmen." },
      { cmd: "NIMMAST", if: [{ flag: "DURCH", eq: 0 }, { flag: "GEGENSTAND2F", eq: 1 }], say: "Nach hartem Kampf ist der Ast mein.", set: { GEGENSTAND2F: 0 }, give: { slot: 4, name: "Ast" } },
      { cmd: "SCHAU ANSTEIN", if: [{ leer: 5 }, { flag: "DURCH", eq: 0 }, { flag: "GEGENSTAND2E", eq: 1 }], say: "Ein toller Stein. Aber ich komme nicht ran !!!" },
      { cmd: "SCHAU ANWAESCHELEINENAST", if: { slotIst: { slot: 16, name: "Waescheleinenast" } }, say: "Den kann man gut irgendwo verhaken." },
      { cmd: "SCHAU ANBRUNNEN", say: "Es geht tief hinab." },
      { cmd: "SCHAU ANFENSTER", say: "Das Glas ist brüchig. Ich sehe einen kleinen dunklen Raum." },
      { cmd: "DRUECKEFENSTER", say: "Sooooo brüchig ist es nun auch wieder nicht !!!" },
      { cmd: "SCHAU ANBLUTSPUREN", say: "Oh mein Gott, AGATHE !!!!" },
      { cmd: "H", go: "BILD1" },
      // 754: CODE1TEST — all five items -> code, else "not yet"
      { cmd: "V", if: [{ flag: "FENSTER2WEG", eq: 1 }, ...ITEMS_SECTION1], say: "Der Code für das Haus lautet : STOERTEBECKER ", pen: 5, call: "code1" },
      { cmd: "V", if: { flag: "FENSTER2WEG", eq: 1 }, say: "DU HAST NOCH NICHT ALLE GEGENSTÄNDE UND DARFST DARUM NOCH NICHT HIER REIN !", pen: 4 },
      { cmd: "BENUTZEASTSTEIN", if: [{ leer: 5 }, { flag: "DURCH", eq: 0 }, { flag: "GEGENSTAND2E", eq: 1 }, { slotIst: { slot: 4, name: "Ast" } }],
        say: "Ich habe den Stein mit dem Ast rangezogen und ihn genommen.", set: { GEGENSTAND2E: 0 }, give: { slot: 5, name: "Stein" } },
      { cmd: "BENUTZESTEINFENSTER", if: { slotIst: { slot: 5, name: "Stein" } }, say: "Ich habe mit dem Stein das Fenster zertrümmert.", set: { FENSTER2WEG: 1 } },
      { cmd: "BENUTZEBRUNNEN", say: "Da runter und mich zu Tode stürzen, NIE !" },
      { cmd: "BENUTZEWAESCHELEINEBRUNNEN", if: { slotIst: { slot: 15, name: "Waescheleine" } }, say: "Die Leine hält nicht. Ich bräuchte etwas,wo ich sie anknoten kann ... !" },
      { cmd: "BENUTZEWAESCHELEINEAST", if: { slotIst: { slot: 15, name: "Waescheleine" } },
        say: ["So habe ich mir das vorgestellt.", "Ich habe die Leine an den Ast geknotet."], take: [4, 15], give: { slot: 16, name: "Waescheleinenast" } },
      { cmd: "BENUTZEWAESCHELEINENASTBRUNNEN", if: { slotIst: { slot: 16, name: "Waescheleinenast" } }, say: "Ich habe den Ast am Brunnen verhakt.", set: { VERHAKT: 1 }, take: 16 },
      { cmd: "BENUTZEDRAHTSCHEREWAESCHELEINE", if: { leer: 15 }, say: "Langsam wird sie ein bisschen kurz. Ich habe sie abgeschnitten.", give: { slot: 15, name: "Waescheleine" } },
      { cmd: "SCHAU ANWAESCHELEINE", if: { leer: 15 }, say: "Die Wäscheleine hängt aus dem Fenster. Sie sieht stabil aus." },
    ],
  },

  // =========================================================================
  BILD3: {
    look(s) {
      return [
        { text: "Ich befinde mich in einem kleinen Raum innerhalb des Hauses.", pen: 7 },
        { text: "An der Wand hängen ein paar Bilder,und eine Treppe führt nach rechts in den 2.Stock.", pen: 7 },
        { text: "Mögliche Richtungen : nach Vorne, nach Rechts", pen: 9 },
        { text: "Ich sehe folgende Gegenstände :", pen: 7 },
        { text: "Treppe", pen: 9 },
        { text: "Bilder", pen: 9 },
      ];
    },
    objects: [
      { label: "Treppe" },
      { label: "Bilder" },
    ],
    rules: [
      { cmd: "SCHAU ANTREPPE", say: "Die Treppe führtin den 2.Stock." },
      { cmd: "SCHAU ANBILDER", say: "Das sind schlechte Fälschungen." },
      { cmd: "ZIEHEBILDER", say: "Ich fasse keine Fälschungen an !" },
      { cmd: "H", say: "Vorwärts immer - Rückwärts nimmer ! Ich MUSS Agathe retten." },
      { cmd: "V", go: "BILD4" },
      // 820: CODE2TEST — needs Goldschluessel + Roter Trank
      { cmd: "R", if: [{ slotIst: { slot: 7, name: "Goldschluessel" } }, { slotIst: { slot: 10, name: "Roter Trank" } }], say: "Der Code für den 2.Stock lautet : DT 64", pen: 5, call: "code2" },
      { cmd: "R", say: "DU HAST NOCH NICHT ALLE GEGENSTÄNDE UND DARFST DARUM NOCH NICHT HIER HOCH !", pen: 4 },
    ],
  },

  // =========================================================================
  BILD4: {
    look(s) {
      const l = [
        { text: "Hier befinde ich mich im Wohnzimmer.", pen: 7 },
        { text: "Im Raum stehen Sessel,eine Schrankwand,ein Kamin und ein Tisch.", pen: 7 },
        { text: "In einem Wandregal stehen Unmengen an Büchern.", pen: 7 },
        { text: "An der Wand hängt ein großes Bild. Eine richtig gemütliche Stube.", pen: 7 },
      ];
      let dirs = "Mögliche Richtungen : nach Hinten";
      if (s.flags.GEGENSTAND4E === 1) dirs += ", nach Links";
      l.push({ text: dirs, pen: 9 });
      l.push({ text: "Ich sehe folgende Gegenstände :", pen: 7 });
      l.push({ text: "Sessel Schrankwand Kamin", pen: 9 });
      l.push({ text: "Tisch Bild Bücher", pen: 9 });
      if (s.flags.GEGENSTAND4A === 1) l.push({ text: "Buch", pen: 9 });
      if (s.flags.GEGENSTAND4B === 1) l.push({ text: "Arztkoffer", pen: 9 });
      if (s.flags.GEGENSTAND4C === 1) l.push({ text: "Stetoskop", pen: 9 });
      if (s.flags.GOLD === 1 && s.inv[7] === "") l.push({ text: "Goldschlüssel", pen: 9 });
      if (s.flags.GEGENSTAND4E === 1) l.push({ text: "Geheimgang", pen: 9 });
      if (s.flags.GEGENSTAND4F === 1) l.push({ text: "Tresor", pen: 9 });
      if (s.flags.TRESORGEKNACKT === 1) l.push({ text: "Geheimfach", pen: 9 });
      return l;
    },
    objects: [
      { label: "Sessel" },
      { label: "Schrankwand" },
      { label: "Kamin" },
      { label: "Tisch" },
      { label: "Bild" },
      { label: "Bücher" },
      { label: "Buch", if: { flag: "GEGENSTAND4A", eq: 1 } },
      { label: "Arztkoffer", if: { flag: "GEGENSTAND4B", eq: 1 } },
      { label: "Stetoskop", if: { flag: "GEGENSTAND4C", eq: 1 } },
      { label: "Goldschlüssel", if: [{ flag: "GOLD", eq: 1 }, { leer: 7 }] },
      { label: "Geheimgang", if: { flag: "GEGENSTAND4E", eq: 1 } },
      { label: "Tresor", if: { flag: "GEGENSTAND4F", eq: 1 } },
      { label: "Geheimfach", if: { flag: "TRESORGEKNACKT", eq: 1 } },
    ],
    rules: [
      { cmd: "L", if: { flag: "GEGENSTAND4E", eq: 1 }, go: "BILD5" },
      { cmd: "H", go: "BILD3" },
      { cmd: "SCHAU ANKAMIN", say: "Gemütlich." },
      { cmd: "SCHAU ANSESSEL", say: "Ein sehr bequemer Sessel." },
      { cmd: "SCHAU ANBILD", say: "Ein echter Picasso. Er gilt seit 5 Jahren als verschollen !" },
      { cmd: "SCHAU ANSCHRANKWAND", if: { flag: "GEGENSTAND4B", eq: 0 }, say: "Die Schrankwand ist abgeschlossen." },
      { cmd: "SCHAU ANSCHRANKWAND", if: { flag: "GEGENSTAND4B", eq: 1 }, say: "Die Schrankwand ist offen." },
      { cmd: "NIMMARZTKOFFER", if: { flag: "GEGENSTAND4B", eq: 1 }, say: "Der Koffer ist mir zu groß." },
      { cmd: "NIMMSTETOSKOP", say: "Ich habe das Stetoskop genommen.", give: { slot: 6, name: "Stetoskop" }, set: { GEGENSTAND4C: 0 } },
      { cmd: "OEFFNEARZTKOFFER", if: [{ flag: "KOFFERAUF", eq: 0 }, { flag: "GEGENSTAND4B", eq: 1 }], say: "Der Koffer ist offen.", set: { KOFFERAUF: 1 } },
      { cmd: "SCHAU ANARZTKOFFER", if: { flag: "KOFFERAUF", eq: 0 }, say: "Welch ein großer,schwerer Koffer." },
      { cmd: "SCHAU ANARZTKOFFER", if: { slotIst: { slot: 6, name: "Stetoskop" } }, say: "Welch ein großer,schwerer Koffer." },
      { cmd: "SCHAU ANARZTKOFFER", if: { flag: "KOFFERAUF", eq: 1 }, say: "Da ist ein Stetoskop drin.", set: { GEGENSTAND4C: 1 } },
      { cmd: "BENUTZESCHLUESSELSCHRANKWAND", say: "Die Schrankwand ist offen. Drin liegt ein Arztkoffer.", set: { GEGENSTAND4B: 1 } },
      { cmd: "SCHAU ANTRESOR", if: [{ flag: "T", eq: 1 }, { flag: "TRESORGESEHEN", eq: 1 }], say: "Der Tresor ist offen." },
      { cmd: "SCHAU ANTRESOR", if: { flag: "TRESORGESEHEN", eq: 1 }, say: "Der Tresor ist mit Hilfe einer Zahlenkombination zu öffnen." },
      { cmd: "SCHAU ANTISCH", say: "Ein schwerer Eichentisch." },
      { cmd: "SCHAU ANBUECHER", say: "Mann o Mann,sind das aber viele Bücher. Eines sieht merkwürdig aus.", set: { BUCHGESEHEN: 1, GEGENSTAND4A: 1 } },
      { cmd: "SCHAU ANBUCH", if: { flag: "BUCHGESEHEN", eq: 1 }, say: "Das ist eine Attrappe. Es lässt sich nicht rausziehen." },
      { cmd: "DRUECKEBUCH", if: { flag: "GEDRE", eq: 0 }, say: "Leise surrend dreht sich die Wand und gibt einen Geheimgang frei.", set: { GEGENSTAND4E: 1, GEDRE: 1 } },
      { cmd: "NIMMBILD", say: "Ich will nicht reich werden,ich will Agathe." },
      { cmd: "SCHAU ANGEHEIMGANG", if: { flag: "GEGENSTAND4E", eq: 1 }, say: "Was mag sich wohl da drinnen verbergen ?" },
      { cmd: "BENUTZESTETOSKOPTRESOR", if: [{ flag: "T", eq: 0 }, { slotIst: { slot: 6, name: "Stetoskop" } }, { flag: "BRIEFGELESEN", eq: 1 }, { flag: "TRESORGESEHEN", eq: 1 }], call: "tresor" },
      // 882/883: post-tresor outcome (fires on any command afterwards)
      { any: true, if: [{ flag: "NOKKK", eq: 0 }, { flag: "TRESORGEKNACKT", eq: 1 }], say: "Es gelang mir,den Tresor zu öffnen.", set: { T: 1, NOKKK: 1 } },
      { any: true, if: { flag: "VERSAGT", eq: 1 },
        say: ["Der böse Mensch sicherte seinen Tresor mit einer tödlichen Sprengladung.", "Ja,und die ist explodiert.", "Vielleicht bist du in deinem nächsten Leben schneller."], die: true },
      { cmd: "BENUTZESTETOSKOPTRESOR", if: [{ flag: "T", eq: 0 }, { slotIst: { slot: 6, name: "Stetoskop" } }, { flag: "TRESORGESEHEN", eq: 1 }], say: "Schade, dass ich nicht weiß, wie man einen Tresor knackt." },
      { cmd: "SCHAU ANSTETOSKOP", if: { slotIst: { slot: 6, name: "Stetoskop" } }, say: "Damit hört einem der Arzt ab." },
      { cmd: "SCHAU ANGEHEIMFACH", if: [{ leer: 7 }, { flag: "TRESORGEKNACKT", eq: 1 }], say: "Da liegt ein Goldschlüssel drin.", set: { GOLD: 1 } },
      { cmd: "SCHAU ANGEHEIMFACH", if: [{ slotIst: { slot: 7, name: "Goldschluessel" } }, { flag: "TRESORGEKNACKT", eq: 1 }], say: "Da ist nichts weiter drin." },
      { cmd: "ZIEHEBILD", if: { flag: "TRESORGESEHEN", eq: 0 }, say: "Hinter dem Bild befindet sich ein Tresor !", set: { TRESORGESEHEN: 1, GEGENSTAND4F: 1 } },
      { cmd: "NIMMGOLDSCHLUESSEL", if: { leer: 7 }, say: "Ich habe den goldenen Schlüssel genommen.", give: { slot: 7, name: "Goldschluessel" } },
    ],
  },

  // =========================================================================
  BILD5: {
    look(s) {
      const l = [
        { text: "Ich steh in einem Geheimlabor.", pen: 7 },
        { text: "Es riecht nach Chemikalien und überall stehen seltsame Apparaturen.", pen: 7 },
        { text: "In Glaskästen laufen Ratten ohne Fell rum und jagen ihren eigenen Schwanz.", pen: 7 },
        { text: "Mögliche Richtungen : nach Hinten", pen: 9 },
        { text: "Ich sehe folgende Gegenstände :", pen: 7 },
      ];
      if (s.inv[8] === "") l.push({ text: "Blauer Trank", pen: 9 });
      if (s.inv[9] === "") l.push({ text: "Grüner Trank", pen: 9 });
      if (s.inv[10] === "") l.push({ text: "Roter Trank", pen: 9 });
      return l;
    },
    objects: [
      { label: "Blauer Trank", if: { leer: 8 } },
      { label: "Grüner Trank", if: { leer: 9 } },
      { label: "Roter Trank", if: { leer: 10 } },
    ],
    rules: [
      { cmd: "H", go: "BILD4" },
      { cmd: "NIMMBLAUER TRANK", if: { leer: 8 }, say: "Ich habe den blauen Trank genommen.", give: { slot: 8, name: "Blauer Trank" } },
      { cmd: "NIMMGRUENER TRANK", if: { leer: 9 }, say: "Ich habe den grünen Trank genommen.", give: { slot: 9, name: "Gruener Trank" } },
      { cmd: "NIMMROTER TRANK", if: { leer: 10 }, say: "Ich habe den roten Trank genommen.", give: { slot: 10, name: "Roter Trank" } },
      // Potions are still standing in the lab here — you can't drink one before taking it.
      { cmd: "TRINKBLAUER TRANK", if: { leer: 8 }, say: "Ich kann ihn nicht trinken. Ich muss ihn erst nehmen." },
      { cmd: "TRINKGRUENER TRANK", if: { leer: 9 }, say: "Ich kann ihn nicht trinken. Ich muss ihn erst nehmen." },
      { cmd: "TRINKROTER TRANK", if: { leer: 10 }, say: "Ich kann ihn nicht trinken. Ich muss ihn erst nehmen." },
      { cmd: "SCHAU ANBLAUER TRANK", say: "Wenn du dies trinkst, bekommst du antwort auf alle Fragen." },
      { cmd: "SCHAU ANGRUENER TRANK", say: "Wenn du dies trinkst, wirst du sehr weise sein." },
      { cmd: "SCHAU ANROTER TRANK", say: "Wenn du dies trinkst, sollten dir Fitnesscenter weitesgehend egal sein." },
    ],
  },

  // =========================================================================
  BILD6: {
    look(s) {
      const l = [
        { text: "Ich befinde mich im Flur des 2.Stockwerkes.", pen: 7 },
        { text: "Hier führen 3 Türen in 3 verschiedene Zimmer.", pen: 7 },
        { text: "In der Ecke liegt ein Haufen ekliger,nasser,stinkender Lappen.", pen: 7 },
        { text: "Mögliche Richtungen : nach Vorne,nach Links,nach Rechts", pen: 9 },
        { text: "Ich sehe folgende Gegenstände :", pen: 7 },
        { text: "Lappen", pen: 9 },
      ];
      if (s.inv[11] === "" && s.flags.HAMMERGESEHEN === 1) l.push({ text: "Hammer", pen: 9 });
      return l;
    },
    objects: [
      { label: "Lappen" },
      { label: "Hammer", if: [{ leer: 11 }, { flag: "HAMMERGESEHEN", eq: 1 }] },
    ],
    rules: [
      { cmd: "V", go: "BILD7" },
      { cmd: "R", go: "BILD8" },
      { cmd: "L", go: "BILD9" },
      { cmd: "NIMMLAPPEN", say: "Die will ich nicht." },
      { cmd: "SCHAU ANLAPPEN", say: "Mann o Mann, das sind aber doll verfaulte Lappen." },
      { cmd: "SCHAU ANHAMMER", say: "Der Hammer ist verrostet." },
      { cmd: "ZIEHELAPPEN", say: "Nie würde ich halbverfaulte Lappen anfassen." },
      { cmd: "DRUECKELAPPEN", say: "Nie würde ich halbverfaulte Lappen anfassen." },
      { cmd: "BENUTZEASTLAPPEN", if: { flag: "HAMMERGESEHEN", eq: 0 }, say: ["Ich habe die Lappen mit dem Ast weggeschoben.", "Unter den Lappen liegt ein Hammer !"], set: { HAMMERGESEHEN: 1 } },
      { cmd: "NIMMHAMMER", if: [{ leer: 11 }, { flag: "HAMMERGESEHEN", eq: 1 }], say: "Ich habe den Hammer genommen.", give: { slot: 11, name: "Hammer" } },
    ],
  },

  // =========================================================================
  BILD7: {
    look(s) {
      const l = [
        { text: "Ich stehe mitten in der Küche des Hauses.", pen: 7 },
        { text: "Aus dem Schrank an der Wand riecht es wiederlich.", pen: 7 },
        { text: "Auf dem Tisch stegt ein randvoll gefülltes Bierfass (Lübzer Pils).", pen: 7 },
        { text: "Mögliche Richtungen : nach Hinten", pen: 9 },
        { text: "Ich sehe folgende Gegenstände :", pen: 7 },
        { text: "Bierfass  Schrank", pen: 9 },
      ];
      if (s.flags.FASSGESEHEN === 1) l.push({ text: "Zapfhahn", pen: 9 });
      if (s.inv[12] === "" && s.flags.SCHRANKGESEHEN === 1 && s.flags.SCHRANKOFFEN === 1) l.push({ text: "Krug", pen: 9 });
      return l;
    },
    objects: [
      { label: "Bierfass" },
      { label: "Schrank" },
      { label: "Zapfhahn", if: { flag: "FASSGESEHEN", eq: 1 } },
      { label: "Krug", if: [{ leer: 12 }, { flag: "SCHRANKGESEHEN", eq: 1 }, { flag: "SCHRANKOFFEN", eq: 1 }] },
    ],
    rules: [
      { cmd: "H", go: "BILD6" },
      { cmd: "OEFFNESCHRANK", if: { flag: "SCHRANKOFFEN", eq: 0 }, say: "Ich habe den Schrank geöffnet.", set: { SCHRANKOFFEN: 1 } },
      { cmd: "NIMMKRUG", if: [{ leer: 12 }, { flag: "SCHRANKGESEHEN", eq: 1 }, { flag: "SCHRANKOFFEN", eq: 1 }], say: "Ich habe den Krug genommen.", give: { slot: 12, name: "Krug" } },
      { cmd: "SCHAU ANBIERFASS", say: "Ich bin Antialkoholiker. Am Fass befindet sich ein Zapfhahn.", set: { FASSGESEHEN: 1 } },
      { cmd: "SCHAU ANSCHRANK", if: { flag: "SCHRANKOFFEN", eq: 0 }, say: "Der Schrank ist zu." },
      { cmd: "SCHAU ANKRUG", if: { slotIst: { slot: 12, name: "Krug" } }, say: "Das ist ein schöner Zinnkrug." },
      { cmd: "SCHAU ANZAPFHAHN", if: { flag: "FASSGESEHEN", eq: 1 }, say: "Ein sehr schöner Zapfhahn. Da tropft Bier raus." },
      { cmd: "SCHAU ANSCHRANK", if: [{ leer: 12 }, { flag: "SCHRANKOFFEN", eq: 1 }], say: "Da steht ein Krug drin,und es liegen Reste herum.", set: { SCHRANKGESEHEN: 1 } },
      { cmd: "SCHAU ANSCHRANK", if: { flag: "SCHRANKOFFEN", eq: 1 }, say: "Im Schrank liegen nur noch Abfallreste." },
      { cmd: "BENUTZEKRUGZAPFHAHN", if: [{ slotIst: { slot: 12, name: "Krug" } }, { flag: "FASSGESEHEN", eq: 1 }], say: "Ich habe den Krug mit Bier gefüllt.", give: { slot: 12, name: "Bierkrug" } },
      { cmd: "ZIEHEBIERFASS", say: "Warum sollte ich das Fass runterwerfen ?" },
      { cmd: "DRUECKEBIERFASS", say: "Warum sollte ich das Fass runterwerfen ?" },
    ],
  },

  // =========================================================================
  BILD8: {
    look(s) {
      const l = [
        { text: "Dies ist ein Abstellraum.", pen: 7 },
        { text: "Unmengen von Gerümpel stehen hier rum.", pen: 7 },
        { text: "Hier sind viele Farbtöpfe,und es riecht streng nach Teer.", pen: 7 },
        { text: "Mögliche Richtungen : nach Links", pen: 9 },
        { text: "Ich sehe folgende Gegenstände :", pen: 7 },
        { text: "Farbtopf", pen: 9 },
        { text: "Gerümpel", pen: 9 },
      ];
      if (s.flags.KISTEGESEHEN === 1) l.push({ text: "Kiste", pen: 9 });
      if (s.flags.SCHEREGESEHEN === 1 && s.inv[13] === "") l.push({ text: "Drahtschere", pen: 9 });
      return l;
    },
    objects: [
      { label: "Farbtopf" },
      { label: "Gerümpel" },
      { label: "Kiste", if: { flag: "KISTEGESEHEN", eq: 1 } },
      { label: "Drahtschere", if: [{ flag: "SCHEREGESEHEN", eq: 1 }, { leer: 13 }] },
    ],
    rules: [
      { cmd: "L", go: "BILD6" },
      { cmd: "SCHAU ANFARBTOPF", say: "Ein Topf mit brauner Farbe." },
      { cmd: "SCHAU ANGERUEMPEL", if: { flag: "KISTEGESEHEN", eq: 1 }, say: "Lauter alte,verrostete Gartenwerkzeuge sind auf den Boden gefallen." },
      { cmd: "SCHAU ANGERUEMPEL", say: "Lauter alte,verrostete Gartenwerkzeuge sind gegen die Wand gelehnt." },
      { cmd: "ZIEHEGERUEMPEL", if: { flag: "KISTEGESEHEN", eq: 0 }, say: ["Mit lautem Getöse fällt alles zu Boden.", "Hinter dem Gerümpel steht eine Kiste."], set: { KISTEGESEHEN: 1 } },
      { cmd: "OEFFNEKISTE", say: "Das Schloss klemmt. Ich kriege sie nicht auf." },
      { cmd: "NIMMKISTE", say: "Die ist mir zu schwer. Ich kann sie nicht heben." },
      { cmd: "DRUECKEKISTE", say: "Die ist mir zu schwer." },
      { cmd: "ZIEHEKISTE", say: "Die ist mir zu schwer." },
      { cmd: "BENUTZEHAMMERKISTE", if: [{ flag: "KISTETOTE", eq: 0 }, { slotIst: { slot: 11, name: "Hammer" } }], say: ["Wie ein Irrer schlägst du auf die Kiste ein.", "Schließlich ist ein großes Loch drin."], set: { KISTETOTE: 1 } },
      { cmd: "SCHAU ANKISTE", if: { flag: "KISTETOTE", eq: 1 }, fn(s) {
        const lines = [{ text: "Die schöne Kiste ist kaputt. ", pen: 7 }];
        if (s.flags.SCHISSGESEHEN === 0) lines.push(...SCHISS_LINES);
        s.flags.SCHEREGESEHEN = 1; s.flags.SCHISSGESEHEN = 1;
        return { lines };
      } },
      { cmd: "SCHAU ANKISTE", if: [{ flag: "KISTETOTE", eq: 0 }, { flag: "KISTEGESEHEN", eq: 1 }], say: "Eine kleine zierliche Kiste. Die sieht zerbrechlich aus." },
      { cmd: "NIMMDRAHTSCHERE", if: [{ flag: "SCHEREGESEHEN", eq: 1 }, { leer: 13 }], say: "Ich habe die Schere genommen.", give: { slot: 13, name: "Drahtschere" } },
    ],
  },

  // =========================================================================
  BILD9: {
    look(s) {
      const l = [];
      if (s.flags.WAECHTERTOT === 1) {
        l.push({ text: "In diesem Raum führt eine Treppe auf den Dachboden.", pen: 7 });
        l.push({ text: "Der tote Wächter liegt am Boden.", pen: 7 });
      } else {
        l.push({ text: "In diesem Raum führt eine Treppe auf den Dachboden,", pen: 7 });
        l.push({ text: "die von einem großen,starken,bösen Wächter besetzt ist. ", pen: 7 });
      }
      let dirs = "Mögliche Richtungen : nach Rechts";
      if (s.flags.WAECHTERTOT === 1) dirs += " , nach Vorne";
      l.push({ text: dirs, pen: 9 });
      l.push({ text: "Ich sehe folgende Gegenstände :", pen: 7 });
      l.push({ text: "Wächter", pen: 9 });
      return l;
    },
    objects: [
      { label: "Wächter" },
    ],
    rules: [
      { cmd: "V", if: { flag: "WAECHTERTOT", eq: 1 }, go: "BILD10" },
      { cmd: "R", go: "BILD6" },
      { cmd: "SCHAU ANWAECHTER", if: { flag: "WAECHTERTOT", eq: 0 }, say: "Der sieht verdammt stark aus ... !" },
      { cmd: "SCHAU ANWAECHTER", if: { flag: "WAECHTERTOT", eq: 1 }, say: "Der Wächter liegt regungslos am Boden." },
      { cmd: "GIBBIERKRUGWAECHTER", if: [{ flag: "WAECHTERTOT", eq: 0 }, { slotIst: { slot: 12, name: "Bierkrug" } }], say: "Er trinkt den Krug in einem Zug aus und sagt : - ICH HAB DURST ! -", give: { slot: 12, name: "Krug" } },
      { cmd: "GIBGIFTBIERKRUGWAECHTER", if: [{ flag: "WAECHTERTOT", eq: 0 }, { slotIst: { slot: 12, name: "Giftbierkrug" } }], say: "Der Wächter hat das Bier getrunken, hat starke Schmerzen und geht zu Boden.", give: { slot: 12, name: "Krug" }, set: { WAECHTERTOT: 1 } },
      { cmd: "DRUECKEWAECHTER", if: { flag: "WAECHTERTOT", eq: 0 }, say: "Das will ich nicht tun. Der ist zu dick." },
      { cmd: "ZIEHEWAECHTER", if: { flag: "WAECHTERTOT", eq: 0 }, say: "Das will ich nicht tun. Der ist zu dick." },
      { cmd: "BENUTZESTEINWAECHTER", if: { flag: "WAECHTERTOT", eq: 0 }, say: ["Unsinnigerweise greifst du den Wächter an. ", "Nach einem kurzem Kampf hat er dir den Hals umgedreht. "], die: true },
      { cmd: "BENUTZEASTWAECHTER", if: { flag: "WAECHTERTOT", eq: 0 }, say: ["Unsinnigerweise greifst du den Wächter an. ", "Nach einem kurzem Kampf hat er dir den Hals umgedreht."], die: true },
    ],
  },

  // =========================================================================
  BILD10: {
    look(s) {
      const l = [];
      if (s.inv[15] === "" && s.inv[14] === "Uniform") {
        l.push({ text: "Ich befinde mich nun auf dem Dachboden des Hauses. Es ist eine Wäscheleine gespannt. Links ist ein Fenster.", pen: 7 });
        l.push({ text: "Alles hier ist furchtbar verstaubt.", pen: 7 });
      } else if (s.inv[15] === "") {
        l.push({ text: "Ich befinde mich nun auf dem Dachboden des Hauses. Es ist eine Wäscheleine gespannt,auf der eine Uniform hängt. Links ist ein Fenster.", pen: 7 });
        l.push({ text: "Alles hier ist furchtbar verstaubt.", pen: 7 });
      } else {
        l.push({ text: "Ich befinde mich nun auf dem Dachboden des Hauses. Links ist ein Fenster.", pen: 7 });
        l.push({ text: "Alles hier ist furchtbar verstaubt.", pen: 7 });
      }
      let dirs = "Mögliche Richtungen : nach Hinten";
      if (s.flags.GEKNOTET === 1) dirs += " nach Links";
      l.push({ text: dirs, pen: 9 });
      l.push({ text: "Ich sehe folgende Gegenstände :", pen: 7 });
      l.push({ text: "Giebel  Fenster", pen: 9 });
      if (s.inv[15] === "") l.push({ text: "Wäscheleine", pen: 9 });
      if (s.inv[14] === "") l.push({ text: "Uniform", pen: 9 });
      return l;
    },
    objects: [
      { label: "Giebel" },
      { label: "Fenster" },
      { label: "Wäscheleine", if: { leer: 15 } },
      { label: "Uniform", if: { leer: 14 } },
    ],
    rules: [
      { cmd: "H", go: "BILD9" },
      { cmd: "SCHAU ANWAESCHELEINE", if: { flag: "GEKNOTET", eq: 1 }, say: "Die Wäscheleine ist an den Giebel geknotet." },
      { cmd: "SCHAU ANGIEBEL", if: { flag: "GEKNOTET", eq: 1 }, say: "Die Wäscheleine ist an den Giebel geknotet." },
      { cmd: "SCHAU ANFENSTER", if: { flag: "FENSTER", eq: 0 }, say: "Das Fenster ist geschlossen." },
      { cmd: "SCHAU ANFENSTER", if: { flag: "FENSTER", eq: 1 }, say: ["Das Fenster ist offen. Es geht weit,weit runter. ", "Erwähnte ich,dass ich Höhenangst habe ???"] },
      { cmd: "SCHAU ANWAESCHELEINE", if: { leer: 14 }, say: "Da hängt eine Uniform dran.", set: { UNIFORM: 1 } },
      { cmd: "SCHAU ANWAESCHELEINE", say: "Sieht stabil aus." },
      { cmd: "SCHAU ANUNIFORM", say: "Das ist eine Soldatenuniform." },
      { cmd: "SCHAU ANGIEBEL", say: "Ein Dachgiebel. Na und ?" },
      { cmd: "OEFFNEFENSTER", if: { flag: "FENSTER", eq: 0 }, say: "Ich habe das Fenster geöffnet.", set: { FENSTER: 1 } },
      { cmd: "NIMMUNIFORM", if: { leer: 14 }, say: ["Ich habe die Uniform genommen.", "Ich habe mir die Uniform angezogen. Die passt wie angegossen."], give: { slot: 14, name: "Uniform" } },
      { cmd: "NIMMWAESCHELEINE", if: { leer: 15 }, say: "Ich kann sie nicht nehmen. Sie ist festgeknotet." },
      // 1218: ABNEHMEN — take uniform (if needed) + cut washing line
      { cmd: "BENUTZEDRAHTSCHEREWAESCHELEINE", if: [{ hat: "Drahtschere" }, { leer: 15 }], fn(s) {
        const lines = [];
        if (s.inv[14] !== "Uniform") {
          lines.push({ text: "Ich nehm erst mal die Uniform ab.", pen: 7 });
          s.inv[14] = "Uniform";
          lines.push({ text: "Ich habe mir die Uniform angezogen. Die passt wie angegossen.", pen: 7 });
        }
        lines.push({ text: "Ich habe die Wäscheleine abgeschnitten und genommen.", pen: 7 });
        s.inv[15] = "Waescheleine";
        return { lines };
      } },
      { cmd: "BENUTZEWAESCHELEINEGIEBEL", if: { slotIst: { slot: 15, name: "Waescheleine" } }, say: "Ich hab die Wäscheleine an den Giebel geknotet.", take: 15, set: { GEKNOTET: 1 } },
      { cmd: "L", if: [{ flag: "FENSTER", eq: 0 }, { flag: "GEKNOTET", eq: 1 }], say: "Ich spring nicht durch ein geschlossenes Fenster. Bin doch kein Stuntman." },
      { cmd: "L", if: [{ flag: "FENSTER", eq: 1 }, { flag: "VERSUCH", eq: 0 }, { flag: "GEKNOTET", eq: 1 }], say: "Ich trau mich nicht.", set: { VERSUCH: 1 } },
      { cmd: "L", if: [{ flag: "FENSTER", eq: 1 }, { flag: "VERSUCH", eq: 1 }, { flag: "GEKNOTET", eq: 1 }], say: "Bitte nicht da runter. Bitte nicht.", set: { VERSUCH: 2 } },
      { cmd: "L", if: [{ flag: "FENSTER", eq: 1 }, { flag: "VERSUCH", eq: 2 }, { flag: "GEKNOTET", eq: 1 }], say: "Jetzt ist mir alles egal. VORWÄEEEEEEERTS !!!!!", set: { DURCH: 1 }, call: "code3" },
    ],
  },

  // =========================================================================
  BILD11: {
    look(s) {
      return [
        { text: "Ich hänge in einem dunklen Gang an der Wäscheleine.", pen: 7 },
        { text: "Vieleicht war sie doch ein bisschen zu kurz.", pen: 7 },
        { text: "Über mir sehe ich den Himmel, unter mir den Abgrund.", pen: 7 },
        { text: "Mögliche Richtungen :", pen: 7 },
        { text: "Ich sehe folgende Gegenstände :", pen: 7 },
      ];
    },
    objects: [],
    rules: [
      { any: true, say: "Bei dem Versuch,dies zu tun,stürzt du hinunter ....!", go: "BILD12" },
    ],
  },

  // =========================================================================
  BILD12: {
    look(s) {
      const l = [];
      if (s.flags.HUNDGELESEN !== 1) {
        l.push({ text: "Mein Bein tut schrecklich weh,und ich sehe mich einem großen Hund gegenüber,", pen: 7 });
        l.push({ text: "der so aussieht, als wenn er es gerne zum Mittag verspeisen möchte.", pen: 7 });
        l.push({ text: "Ich glaube nicht,dass er sich noch lange im hinhalten lässt.", pen: 7 });
      }
      l.push({ text: "Ich sehe vorne ein schwaches Licht schimmern. Da muss Agathe sein !", pen: 7 });
      l.push({ text: "Mögliche Richtungen : nach Vorne", pen: 9 });
      l.push({ text: "Ich sehe folgende Gegenstände :", pen: 7 });
      return l;
    },
    objects: [],
    rules: [
      { cmd: "TRINKROTER TRANK", if: { slotIst: { slot: 10, name: "Roter Trank" } }, say: "Ich habe den roten Trank ausgetrunken und fühle mich viel stärker.", take: 10, set: { STARK: 1 } },
      { cmd: "TRINKROTER TRANK", if: { leer: 10 }, say: [] },
      // 1313: HUNDKOMMT on first action while KAM=0
      { any: true, if: { flag: "KAM", eq: 0 }, fn(s) {
        const lines = [{ text: "In diesem Moment springt der Hund auf dich zu.", pen: 7 }];
        s.flags.KAM = 1; s.flags.HUNDGELESEN = 1;
        if (s.flags.STARK === 0) {
          lines.push({ text: "Er zerfleischt erst dein Bein und dann dich.", pen: 7 });
          lines.push({ text: "Guten Appetit. Du bist tot.", pen: 7 });
          return { lines, died: true };
        }
        lines.push({ text: "Du packst ihn mit der linken Hand am Hals, um ihm mit der Rechten den Schädel  zu zertrümmern.", pen: 7 });
        lines.push({ text: "Du hast noch mal Glück gehabt.", pen: 7 });
        return { lines };
      } },
      { cmd: "V", if: { flag: "KAM", eq: 1 }, go: "BILD13" },
    ],
  },

  // =========================================================================
  BILD13: {
    look(s) {
      const l = [
        { text: "Ich befinde mich nun neben Agathes Zelle.", pen: 7 },
        { text: "Sie tanzt vor Freude auf einem Bein.", pen: 7 },
        { text: "Der Brunnen muss wohl ein Geheimgang gewesen sein.", pen: 7 },
        { text: "Mögliche Richtungen : nach Hinten", pen: 9 },
        { text: "Ich sehe folgende Gegenstände :", pen: 7 },
        { text: "Zelle ", pen: 9 },
        { text: "Agathe", pen: 9 },
      ];
      if (s.flags.LOCHGESEHEN === 1) l.push({ text: "Schloss", pen: 9 });
      return l;
    },
    objects: [
      { label: "Zelle" },
      { label: "Agathe" },
      { label: "Schloss", if: { flag: "LOCHGESEHEN", eq: 1 } },
    ],
    rules: [
      { cmd: "H", say: "NEIN. Ich muss jetzt Agathe retten." },
      { cmd: "SCHAU ANAGATHE", say: "Hallo, Agathe !" },
      { cmd: "SCHAU ANZELLE", if: { flag: "LOCHGESEHEN", eq: 0 }, say: "Da ist ein Schloss dran.", set: { LOCHGESEHEN: 1 } },
      { cmd: "SCHAU ANZELLE", say: "Da sitzt Agathe drin." },
      { cmd: "BENUTZEGOLDSCHLUESSELSCHLOSS", if: { flag: "LOCHGESEHEN", eq: 1 }, say: "Ich habe das Schloss geöffnet. Agathe ist frei !!!!! ", call: "ending" },
      { cmd: "SCHAU ANSCHLOSS", if: { flag: "LOCHGESEHEN", eq: 1 }, say: "Ein Schlüsselloch eben." },
    ],
  },
};
