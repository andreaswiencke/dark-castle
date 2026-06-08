// Help system data: the ordered solution steps (HINT_STEPS) plus per-room navigation
// hints (NAV_HINTS). PURE data + plain state-reading functions — this module must NOT
// import from engine.js (engine.js imports this one; importing back would create a cycle).
//
// `done` / `when` use the same condition shape as engine.condMet (flag+eq, voll, leer,
// slotIst, hat, nicht, or an array of those = AND). `cmd` is the canonical command the
// step corresponds to: tests assert currentHint(state).cmd matches the walkthrough, and
// the level-3 hint text is written from it. `hints` = [Stufe1, Stufe2, Stufe3] (filled
// in a later task). Steps are listed in canonical (walkthrough) order; currentHint picks
// the first not-done step in the current room.

function hintHasItem(s, name) {
  for (const k in s.inv) if (s.inv[k] === name) return true;
  return false;
}

export const HINT_STEPS = [
  // ── BILD1 — Vor dem Haus ──
  { room: "BILD1", cmd: "ZIEHEFUSSMATTE", done: { flag: "MATTE", eq: 1 } },
  { room: "BILD1", cmd: "NIMMSCHLUESSEL", done: { flag: "BILD1GENOMMEN", eq: 1 } },
  { room: "BILD1", cmd: "SCHAU ANBRIEFKASTEN", done: { flag: "BILD1GESCHAUT", eq: 1 } },
  { room: "BILD1", cmd: "NIMMBRIEF", done: { voll: 2 } },
  { room: "BILD1", cmd: "OEFFNEBRIEF", done: { flag: "BRIEFOFFEN", eq: 1 } },
  { room: "BILD1", cmd: "SCHAU ANBRIEF", done: { flag: "BRIEFGELESEN", eq: 1 } },

  // ── BILD2 — Hinter dem Haus (erste Visite, DURCH=0) ──
  { room: "BILD2", when: { flag: "DURCH", eq: 0 }, cmd: "SCHAU ANBAUM", done: { flag: "BAUMGESEHEN", eq: 1 } },
  { room: "BILD2", when: { flag: "DURCH", eq: 0 }, cmd: "NIMMAST", done: { voll: 4 } },
  { room: "BILD2", when: { flag: "DURCH", eq: 0 }, cmd: "NIMMFRUCHT", done: { voll: 3 } },
  { room: "BILD2", when: { flag: "DURCH", eq: 0 }, cmd: "BENUTZEASTSTEIN", done: { voll: 5 } },
  { room: "BILD2", when: { flag: "DURCH", eq: 0 }, cmd: "BENUTZESTEINFENSTER", done: { flag: "FENSTER2WEG", eq: 1 } },

  // ── BILD4 — Wohnzimmer ──
  { room: "BILD4", cmd: "BENUTZESCHLUESSELSCHRANKWAND", done: { flag: "GEGENSTAND4B", eq: 1 } },
  { room: "BILD4", cmd: "OEFFNEARZTKOFFER", done: { flag: "KOFFERAUF", eq: 1 } },
  { room: "BILD4", when: { leer: 6 }, cmd: "SCHAU ANARZTKOFFER", done: { flag: "GEGENSTAND4C", eq: 1 } },
  { room: "BILD4", cmd: "NIMMSTETOSKOP", done: { voll: 6 } },
  { room: "BILD4", cmd: "SCHAU ANBUECHER", done: { flag: "BUCHGESEHEN", eq: 1 } },
  { room: "BILD4", cmd: "DRUECKEBUCH", done: { flag: "GEDRE", eq: 1 } },
  { room: "BILD4", when: { flag: "GEDRE", eq: 1 }, cmd: "L", done: [{ voll: 8 }, { voll: 9 }, { voll: 10 }] },
  { room: "BILD4", cmd: "ZIEHEBILD", done: { flag: "TRESORGESEHEN", eq: 1 } },
  { room: "BILD4", when: { flag: "BRIEFGELESEN", eq: 0 }, cmd: "SCHAU ANBRIEF", done: { flag: "BRIEFGELESEN", eq: 1 } },
  { room: "BILD4", cmd: "BENUTZESTETOSKOPTRESOR", done: { flag: "TRESORGEKNACKT", eq: 1 } },
  { room: "BILD4", cmd: "SCHAU ANGEHEIMFACH", done: { flag: "GOLD", eq: 1 } },
  { room: "BILD4", cmd: "NIMMGOLDSCHLUESSEL", done: { voll: 7 } },

  // ── BILD5 — Geheimlabor ──
  { room: "BILD5", cmd: "NIMMBLAUER TRANK", done: { voll: 8 } },
  { room: "BILD5", cmd: "NIMMGRUENER TRANK", done: { voll: 9 } },
  { room: "BILD5", cmd: "NIMMROTER TRANK", done: { voll: 10 } },

  // ── BILD6 — Flur 2. Stock (Hub) ──
  { room: "BILD6", cmd: "BENUTZEASTLAPPEN", done: { flag: "HAMMERGESEHEN", eq: 1 } },
  { room: "BILD6", cmd: "NIMMHAMMER", done: { voll: 11 } },

  // ── BILD7 — Küche ──
  { room: "BILD7", cmd: "OEFFNESCHRANK", done: { flag: "SCHRANKOFFEN", eq: 1 } },
  { room: "BILD7", cmd: "SCHAU ANSCHRANK", done: { flag: "SCHRANKGESEHEN", eq: 1 } },
  { room: "BILD7", cmd: "NIMMKRUG", done: { voll: 12 } },
  { room: "BILD7", cmd: "SCHAU ANBIERFASS", done: { flag: "FASSGESEHEN", eq: 1 } },
  { room: "BILD7", cmd: "BENUTZEKRUGZAPFHAHN", done: [{ nicht: "Krug" }, { voll: 12 }] },
  { room: "BILD7", cmd: "BENUTZEFRUCHTBIERKRUG", done: { slotIst: { slot: 12, name: "Giftbierkrug" } } },

  // ── BILD8 — Abstellraum ──
  { room: "BILD8", cmd: "ZIEHEGERUEMPEL", done: { flag: "KISTEGESEHEN", eq: 1 } },
  { room: "BILD8", when: { nicht: "Hammer" }, cmd: "L", done: { hat: "Hammer" } }, // prereq: fetch the hammer
  { room: "BILD8", when: { hat: "Hammer" }, cmd: "BENUTZEHAMMERKISTE", done: { flag: "KISTETOTE", eq: 1 } },
  { room: "BILD8", cmd: "SCHAU ANKISTE", done: { flag: "SCHEREGESEHEN", eq: 1 } },
  { room: "BILD8", cmd: "NIMMDRAHTSCHERE", done: { voll: 13 } },

  // ── BILD9 — Treppe / Wächter ──
  { room: "BILD9", when: [{ flag: "WAECHTERTOT", eq: 0 }, { nicht: "Giftbierkrug" }], cmd: "R", done: { hat: "Giftbierkrug" } },
  { room: "BILD9", cmd: "GIBGIFTBIERKRUGWAECHTER", done: { flag: "WAECHTERTOT", eq: 1 } },

  // ── BILD10 — Dachboden ──
  { room: "BILD10", cmd: "OEFFNEFENSTER", done: { flag: "FENSTER", eq: 1 } },
  { room: "BILD10", when: [{ flag: "GEKNOTET", eq: 0 }, { nicht: "Drahtschere" }], cmd: "H", done: { hat: "Drahtschere" } }, // prereq: fetch the wire cutters
  { room: "BILD10", when: [{ flag: "GEKNOTET", eq: 0 }, { hat: "Drahtschere" }], cmd: "BENUTZEDRAHTSCHEREWAESCHELEINE", done: { voll: 15 } },
  { room: "BILD10", when: { flag: "GEKNOTET", eq: 0 }, cmd: "BENUTZEWAESCHELEINEGIEBEL", done: { flag: "GEKNOTET", eq: 1 } },

  // ── BILD2 — Hinter dem Haus (zweite Visite, DURCH=1) ──
  { room: "BILD2", when: [{ flag: "DURCH", eq: 1 }, { leer: 16 }, { flag: "VERHAKT", eq: 0 }], cmd: "BENUTZEDRAHTSCHEREWAESCHELEINE", done: { voll: 15 } },
  { room: "BILD2", when: [{ flag: "DURCH", eq: 1 }, { flag: "VERHAKT", eq: 0 }], cmd: "BENUTZEWAESCHELEINEAST", done: { voll: 16 } },
  { room: "BILD2", when: { flag: "DURCH", eq: 1 }, cmd: "BENUTZEWAESCHELEINENASTBRUNNEN", done: { flag: "VERHAKT", eq: 1 } },

  // ── BILD12 — Dunkler Gang ──
  { room: "BILD12", cmd: "TRINKROTER TRANK", done: { flag: "STARK", eq: 1 } },

  // ── BILD13 — Agathes Zelle ──
  { room: "BILD13", cmd: "SCHAU ANZELLE", done: { flag: "LOCHGESEHEN", eq: 1 } },
  { room: "BILD13", cmd: "BENUTZEGOLDSCHLUESSELSCHLOSS", done: { flag: "ENDED", eq: 1 } },
];

// Per-room navigation hint, used when every action-step in the current room is done.
// Each returns { cmd, hints }. State-aware for hub/branching rooms (BILD2/BILD3/BILD6).
export const NAV_HINTS = {
  BILD1: () => ({ cmd: "V" }),
  BILD2: (s) => (s.flags.DURCH === 1
    ? { cmd: "R" }
    : { cmd: "V" }),
  BILD3: (s) => (s.inv[7] === "Goldschluessel" && s.inv[10] === "Roter Trank"
    ? { cmd: "R" }
    : { cmd: "V" }),
  BILD4: () => ({ cmd: "H" }),
  BILD5: () => ({ cmd: "H" }),
  BILD6: (s) => {
    if (!hintHasItem(s, "Giftbierkrug")) return { cmd: "V" };
    if (s.inv[13] === "") return { cmd: "R" };
    return { cmd: "L" };
  },
  BILD7: () => ({ cmd: "H" }),
  BILD8: () => ({ cmd: "L" }),
  BILD9: () => ({ cmd: "V" }),
  BILD10: () => ({ cmd: "L" }),
  BILD11: () => ({ cmd: "SCHAU ANGANG" }),
  BILD12: () => ({ cmd: "V" }),
  BILD13: () => ({ cmd: "BENUTZEGOLDSCHLUESSELSCHLOSS" }),
};

// The three hint texts per phase, keyed by `${room}|${cmd}` for action steps and
// `${room}|NAV|${cmd}` for navigation. [Stufe1 atmosphärisch, Stufe2 deutlicher,
// Stufe3 klare Lösung]. Populated by the generation workflow.
export const HINT_TEXTS = {
  "BILD1|ZIEHEFUSSMATTE": [
    "Eine leise Ahnung beschleicht mich, dass der Boden vor dem Haus mehr verbirgt, als die schäbige Fußmatte mir zeigen will.",
    "Der Wind raunt mir zu, ich solle nicht über die Matte steigen, sondern nachsehen, was sie so beflissen bedeckt.",
    "Agathe spricht im Traum zu mir: Zieh die Fußmatte weg.",
  ],
  "BILD1|NIMMSCHLUESSEL": [
    "Eine leise Ahnung beschleicht mich, dass die alte Fußmatte vor dem Haus nicht ohne Grund so schwer auf dem Boden liegt.",
    "Im Halbschlaf sehe ich vor mir, wie unter der Matte etwas Kleines, Bronzenes schimmert, das ich aufheben und einstecken sollte, bevor ich weitergehe.",
    "Agathe spricht im Traum zu mir: Nimm den Schlüssel.",
  ],
  "BILD1|SCHAU ANBRIEFKASTEN": [
    "Eine leise Ahnung beschleicht mich, dass dieser alte, rostige Briefkasten am Haus mehr verbirgt, als er auf den ersten Blick verrät.",
    "Eine innere Stimme flüstert mir zu, dass es sich lohnen könnte, das Innere des verrosteten Kästchens genauer in Augenschein zu nehmen, statt achtlos daran vorbeizugehen.",
    "Agathe spricht im Traum zu mir: Schau in den Briefkasten.",
  ],
  "BILD1|NIMMBRIEF": [
    "Eine leise Ahnung beschleicht mich, dass am Briefkasten vor dem Haus etwas auf mich wartet.",
    "Eine innere Stimme flüstert mir zu, dass ich das, was dort im Briefkasten steckt, an mich nehmen sollte.",
    "Agathe spricht im Traum zu mir: Nimm den Brief.",
  ],
  "BILD1|OEFFNEBRIEF": [
    "Agathe spricht im Traum zu mir: Das versiegelte Schreiben in meiner Hand birgt mehr, als sein Schweigen verrät.",
    "Eine leise Ahnung beschleicht mich, dass der Brief seine Worte erst preisgibt, wenn ich das Siegel breche, das sie gefangen hält.",
    "Eine innere Stimme flüstert mir unmissverständlich zu: Öffne den Brief.",
  ],
  "BILD1|SCHAU ANBRIEF": [
    "Eine leise Ahnung beschleicht mich, dass das aufgeschlagene Heft vor dem Haus mehr verbirgt als nur bunte Bilder.",
    "Im Halbschlaf sehe ich mich über die Seiten gebeugt — was dort gedruckt steht, könnte mir später noch von großem Nutzen sein.",
    "Agathe spricht im Traum zu mir: Lies den Brief (schau ihn an).",
  ],
  "BILD2|SCHAU ANBAUM": [
    "Eine leise Ahnung beschleicht mich, dass der knorrige Baum im verwahrlosten Garten mehr birgt, als sein verkommenes Äußeres verrät.",
    "Mein Blick bleibt am alten Baum hängen, und ich spüre, dass ich ihn genauer in Augenschein nehmen sollte, statt nur an ihm vorüberzugehen.",
    "Agathe spricht im Traum zu mir: Schau dir den Baum an.",
  ],
  "BILD2|NIMMAST": [
    "Im Halbschlaf sehe ich den Baum hinter dem Haus, an dem etwas Kräftiges und etwas Grünes hängt — als hielte er etwas für mich bereit.",
    "Je länger ich hinsehe, desto deutlicher spüre ich: Der dicke Ast da oben ist mehr als nur Holz und könnte mir gute Dienste als Werkzeug leisten.",
    "Eine innere Stimme flüstert ganz klar: Nimm den Ast.",
  ],
  "BILD2|NIMMFRUCHT": [
    "Eine leise Ahnung beschleicht mich, dass an dem Baum hinter dem Haus etwas Seltsames hängt und meine Aufmerksamkeit verdient.",
    "Der Wind raunt mir zu, dass mir die merkwürdige grüne Frucht noch von Nutzen sein könnte, so gefährlich sie auch wirken mag, und nicht am Ast verbleiben sollte.",
    "Agathe spricht im Traum zu mir: Nimm die Frucht.",
  ],
  "BILD2|BENUTZEASTSTEIN": [
    "Eine leise Ahnung beschleicht mich, dass hinter dem Zaun etwas Wertvolles liegt, das ich mit bloßer Hand nicht erreichen kann.",
    "Der Wind raunt mir zu, dass ich mich nach einem langen Hilfsmittel umsehen sollte, mit dem sich der ferne Stein näher heranholen ließe.",
    "Agathe spricht im Traum zu mir: Benutze den Ast, um den Stein heranzuziehen (Benutze Ast Stein).",
  ],
  "BILD2|BENUTZESTEINFENSTER": [
    "Eine leise Ahnung beschleicht mich, dass das alte, brüchige Fenster auf der Rückseite des Hauses einen Weg hinein verspricht.",
    "Eine innere Stimme flüstert mir zu, dass hier nur die rohe Gewalt eines harten Gegenstandes hilft, um das morsche Glas zu überwinden.",
    "Agathe spricht im Traum zu mir: Benutze den Stein am Fenster (wirf ihn ein).",
  ],
  "BILD4|BENUTZESCHLUESSELSCHRANKWAND": [
    "Eine leise Ahnung beschleicht mich, dass im Wohnzimmer hinter den verschlossenen Türen der Schrankwand etwas auf mich wartet.",
    "Im Halbschlaf sehe ich, wie meine Hand zum Schlüssel greift, der genau zu diesem dunklen Möbelstück zu passen scheint.",
    "Agathe spricht im Traum zu mir: Benutze den Schlüssel an der Schrankwand.",
  ],
  "BILD4|OEFFNEARZTKOFFER": [
    "Im Halbschlaf sehe ich die offene Schrankwand vor mir, und etwas Großes darin zieht meinen Blick an.",
    "Eine innere Stimme flüstert mir zu, dass der Arztkoffer dort nicht ohne Grund liegt – sein Inneres birgt etwas.",
    "Agathe spricht im Traum zu mir: Öffne den Arztkoffer.",
  ],
  "BILD4|SCHAU ANARZTKOFFER": [
    "Eine leise Ahnung beschleicht mich: Der aufgeklappte Arztkoffer im Wohnzimmer scheint mir etwas verschweigen zu wollen.",
    "Der Wind raunt mir zu, dass ich mich genauer mit dem offenen Arztkoffer befassen und sein Inneres mustern sollte.",
    "Agathe spricht im Traum zu mir: Schau in den Arztkoffer.",
  ],
  "BILD4|NIMMSTETOSKOP": [
    "Ein leises Unbehagen beschleicht mich, als mein Blick im Wohnzimmer auf den schweren Arztkoffer fällt - ob darin etwas Nützliches verborgen liegt?",
    "Eine innere Stimme flüstert mir zu, dass im Koffer ein feines Instrument liegt, mit dem sich kleinste Geräusche belauschen lassen - wie geschaffen dafür, einem Tresor seine Geheimnisse zu entlocken.",
    "Agathe spricht im Traum zu mir: Nimm das Stetoskop.",
  ],
  "BILD4|SCHAU ANBUECHER": [
    "Im Halbschlaf sehe ich das Wandregal vor mir, und eines der Bücher scheint mir merkwürdig fremd zwischen den anderen.",
    "Eine innere Stimme flüstert, ich solle den Büchern im Regal mehr Aufmerksamkeit schenken, statt achtlos vorüberzugehen.",
    "Agathe spricht im Traum zu mir: Schau dir die Bücher an.",
  ],
  "BILD4|DRUECKEBUCH": [
    "Eine leise Ahnung beschleicht mich, dass eines der Bücher im Regal nicht ganz das ist, was es zu sein vorgibt.",
    "Der Wind raunt mir zu, dass dieses merkwürdige Buch nicht zum Lesen, sondern zum Drücken gedacht ist.",
    "Agathe spricht im Traum zu mir: Drücke das merkwürdige Buch.",
  ],
  "BILD4|L": [
    "Im Halbschlaf spüre ich, wie hinter der gedrehten Wand im Wohnzimmer ein kühler Lufthauch aus einem verborgenen Gang weht und mich lockt, ihm nachzugehen.",
    "Eine innere Stimme raunt mir zu, dass der Geheimgang ins alte Labor führt, wo lebenswichtige Tränke in ihren Fläschchen auf mich warten.",
    "Agathe spricht im Traum zu mir: Geh nach Links (L) ins Labor und hol die Tränke.",
  ],
  "BILD4|ZIEHEBILD": [
    "Agathe spricht im Traum zu mir: Mein Blick bleibt immer wieder an dem großen Picasso an der Wohnzimmerwand hängen, als wolle das Gemälde mir etwas verraten.",
    "Eine leise Ahnung beschleicht mich, dass nicht das Bild selbst, sondern die Stelle dahinter mein eigentliches Ziel ist.",
    "Eine innere Stimme flüstert mir unmissverständlich zu: Zieh das große Bild von der Wand.",
  ],
  "BILD4|SCHAU ANBRIEF": [
    "Noch ganz benommen fällt mein Blick auf etwas Schriftliches auf dem Wohnzimmertisch, das ich bisher kaum beachtet habe.",
    "Allmählich dämmert mir, dass ausgerechnet jener Brief das Wissen birgt, das mir am Tresor noch fehlt.",
    "Eine innere Stimme flüstert mir klar zu: Lies erst den Brief (schau ihn an).",
  ],
  "BILD4|BENUTZESTETOSKOPTRESOR": [
    "Ein leises Unbehagen beschleicht mich, als mein Blick immer wieder an dem großen Bild an der Wohnzimmerwand hängenbleibt - als verberge es etwas dahinter.",
    "Im Halbschlaf sehe ich mich vor dem Tresor knien, ein Lauschinstrument in der Hand, und dem feinen Klicken der Mechanik folgen.",
    "Eine innere Stimme flüstert mir klar und deutlich zu: Benutze das Stetoskop am Tresor.",
  ],
  "BILD4|SCHAU ANGEHEIMFACH": [
    "Im Halbschlaf sehe ich, wie der aufgebrochene Tresor seine Schatten nicht ganz preisgibt — als verberge sein Inneres noch mehr, als das Auge auf den ersten Blick erfasst.",
    "Eine leise Ahnung beschleicht mich, dass ich im offenen Tresor noch genauer nachsehen sollte, vielleicht sogar ein zweites Mal, denn hinter dem Offensichtlichen scheint sich etwas Verstecktes zu regen.",
    "Eine innere Stimme sagt mir klar und deutlich: Schau ins Geheimfach.",
  ],
  "BILD4|NIMMGOLDSCHLUESSEL": [
    "Eine leise Ahnung beschleicht mich, dass die Wand des Wohnzimmers ein Geheimnis hütet, das golden in der Dunkelheit schimmert.",
    "Im Halbschlaf flüstert mir eine Stimme zu, dass ich danach greifen sollte, was im offenen Geheimfach auf mich wartet.",
    "Agathe spricht im Traum zu mir: Nimm den Goldschlüssel.",
  ],
  "BILD5|NIMMBLAUER TRANK": [
    "Eine leise Ahnung beschleicht mich, daß auf dem Tisch des Geheimlabors drei Tränke schimmern und einer von ihnen meine Blicke besonders anzieht.",
    "Eine innere Stimme flüstert mir zu, daß unter den drei Tränken jener mein Heil verspricht, der in tiefem Blau leuchtet.",
    "Agathe spricht im Traum zu mir: Nimm den blauen Trank.",
  ],
  "BILD5|NIMMGRUENER TRANK": [
    "Eine leise Ahnung beschleicht mich, dass in diesem Geheimlabor etwas Grünes auf einem der Tische schimmert und meine Aufmerksamkeit verdient.",
    "Agathe spricht im Traum zu mir: Was dort als grüner Trank bereitsteht, sollte ich besser an mich nehmen, statt ihn zurückzulassen.",
    "Eine innere Stimme flüstert ganz deutlich: Nimm den grünen Trank.",
  ],
  "BILD5|NIMMROTER TRANK": [
    "Im Halbschlaf sehe ich, wie im Geheimlabor ein Gefäß in tiefem Rot schimmert und mich seltsam anzieht.",
    "Eine innere Stimme flüstert mir zu, dass mir der rote Trank dort drüben ungeahnte Kräfte verleihen könnte.",
    "Agathe spricht im Traum klar zu mir: Nimm den roten Trank.",
  ],
  "BILD6|BENUTZEASTLAPPEN": [
    "Im Halbschlaf treibt mir der modrige Gestank aus der dunklen Ecke des Flurs in die Nase — dort liegt etwas, das ich um keinen Preis mit bloßen Händen anrühren möchte.",
    "Eine leise Ahnung beschleicht mich, dass ich diesen widerlichen Haufen nicht selbst zu berühren brauche, sondern ihn mit dem Ast aus dem Weg räumen sollte.",
    "Agathe spricht im Traum zu mir: Benutze den Ast, um die Lappen wegzuschieben (Benutze Ast Lappen).",
  ],
  "BILD6|NIMMHAMMER": [
    "Eine leise Ahnung beschleicht mich, dass sich unter den hier im Flur weggeschobenen Lappen etwas Verborgenes verbirgt.",
    "Eine innere Stimme flüstert mir zu, dass mir das verrostete Werkzeug, das dort am Boden liegt, noch gute Dienste leisten könnte.",
    "Agathe spricht im Traum zu mir: Nimm den Hammer.",
  ],
  "BILD7|OEFFNESCHRANK": [
    "Noch im Halbschlaf kräuselt sich mir die Nase: Irgendwo in dieser Küche lauert die Quelle des widerlichen Gestanks und will gefunden werden.",
    "Eine innere Stimme flüstert mir zu, daß der Ursprung des Gestanks hinter einer geschlossenen Tür verborgen liegt und nur darauf wartet, ans Licht geholt zu werden.",
    "Agathe spricht im Traum zu mir: Öffne den Schrank.",
  ],
  "BILD7|SCHAU ANSCHRANK": [
    "In der stillen Küche fällt mein Blick auf den hölzernen Schrank, dessen offen stehende Tür mir etwas zuzuflüstern scheint.",
    "Eine leise Ahnung beschleicht mich, dass ich mir das Innere des offenen Schranks genauer ansehen sollte.",
    "Eine innere Stimme flüstert mir ganz deutlich zu: Schau in den Schrank.",
  ],
  "BILD7|NIMMKRUG": [
    "Agathe spricht im Traum zu mir: In der Küche steht ein Schrank, und etwas darin fängt das Licht so schön ein.",
    "Eine leise Ahnung beschleicht mich, dass der hübsche Zinnkrug im Schrank zu wertvoll ist, um ihn einfach stehen zu lassen.",
    "Eine innere Stimme flüstert ganz deutlich: Nimm den Krug.",
  ],
  "BILD7|SCHAU ANBIERFASS": [
    "Im Halbschlaf nehme ich auf dem Tisch etwas Massiges wahr, von dem ein süßlicher Duft aufsteigt und meine Neugier weckt.",
    "Eine leise Ahnung beschleicht mich, daß jenes pralle Faß mit dem Zapfhahn ein Geheimnis hütet, das ich mir genauer ansehen sollte.",
    "Agathe spricht im Traum zu mir: Schau dir das Bierfass an.",
  ],
  "BILD7|BENUTZEKRUGZAPFHAHN": [
    "Ein durstiges Ziehen in der Kehle lenkt meinen Blick in die Ecke der Küche, wo ein alter Zapfhahn auf bessere Zeiten zu warten scheint.",
    "Eine leise Ahnung beschleicht mich, dass mein leerer Krug nicht leer bleiben müsste, hielte ich ihn nur dorthin, wo das Bier zu fließen vermag.",
    "Eine innere Stimme flüstert ganz klar: Benutze den Krug am Zapfhahn (zapf Bier).",
  ],
  "BILD7|BENUTZEFRUCHTBIERKRUG": [
    "Ein leiser Verdacht beschleicht mich, dass der Bierkrug auf dem Tisch und die seltsame Frucht in meiner Hand mehr miteinander zu tun haben, als mir lieb ist.",
    "Agathe spricht im Traum zu mir: Wer den Trunk eines anderen mit dem Saft der falschen Frucht würzt, dem öffnen sich verschlossene Wege.",
    "Benutze die Frucht am Bierkrug (vergifte das Bier).",
  ],
  "BILD8|ZIEHEGERUEMPEL": [
    "Eine leise Ahnung beschleicht mich, daß das verrostete Gartenwerkzeug an der Wand nicht zufällig gerade an dieser Stelle so dicht beieinander lehnt.",
    "Agathe spricht im Traum zu mir: Hinter dem verrosteten Plunder verbirgt sich etwas, doch erst muß der Weg dorthin frei werden.",
    "Eine innere Stimme flüstert mir die Lösung zu: Zieh das Gerümpel weg.",
  ],
  "BILD8|BENUTZEHAMMERKISTE": [
    "Agathe spricht im Traum zu mir: Hinter all dem Gerümpel im Abstellraum spüre ich etwas Kleines, das ein Geheimnis hinter Schloß und Riegel verbirgt.",
    "Eine leise Ahnung beschleicht mich, daß sich das klemmende Schloß der kleinen Kiste nicht mit bloßen Händen öffnen läßt, sondern nur mit roher Gewalt und einem passenden Werkzeug nachgibt.",
    "Eine innere Stimme flüstert mir klar zu: Benutze den Hammer an der Kiste (schlag sie auf).",
  ],
  "BILD8|SCHAU ANKISTE": [
    "Eine leise Ahnung beschleicht mich: In diesem Abstellraum zieht die zerschlagene Kiste meinen Blick immer wieder an, als verberge sie noch ein Geheimnis.",
    "Im Halbdunkel erkenne ich, dass die Kiste längst ein klaffendes Loch hat – nicht der morsche Deckel ist mein Weg, sondern das, was sich in ihrem Inneren verbirgt.",
    "Agathe spricht im Traum zu mir: Schau in die aufgebrochene Kiste.",
  ],
  "BILD8|NIMMDRAHTSCHERE": [
    "Eine leise Ahnung beschleicht mich, als mein Blick an der alten Kiste in der Ecke des Abstellraums hängenbleibt — irgendetwas darin könnte mir später dienlich sein.",
    "Agathe spricht im Traum zu mir: »Hebe den Deckel der Kiste und nimm das scharfe Schneidwerkzeug an dich, das darin auf dich wartet.«",
    "Eine innere Stimme flüstert mir unmissverständlich zu: Nimm die Drahtschere.",
  ],
  "BILD9|R": [
    "Agathe spricht im Traum zu mir: Dieser Hüne auf der Treppe wird mir nicht weichen, solange ich ihm nur mit leeren Händen begegne.",
    "Eine innere Stimme flüstert mir zu, daß ein durstiger Wächter einen dargebotenen Trunk eher annimmt, als sich roher Gewalt zu beugen — und daß die Küche so manches Gebräu bereithält.",
    "Der Wind raunt mir klar zu: Geh zurück (nach Rechts, R) und besorg erst das vergiftete Bier.",
  ],
  "BILD9|GIBGIFTBIERKRUGWAECHTER": [
    "Im Halbschlaf sehe ich den Wächter auf der Treppe: seine Kehle ist trocken, und meine Hand tastet nach etwas, das ich bei mir trage.",
    "Eine leise Ahnung beschleicht mich, dass ich dem durstigen Mann nur etwas zu trinken zu reichen brauche, damit er mir nicht länger im Wege steht.",
    "Eine innere Stimme flüstert mir klar zu: Gib dem Wächter den vergifteten Bierkrug.",
  ],
  "BILD10|OEFFNEFENSTER": [
    "Eine leise Ahnung beschleicht mich, dass die schwere Luft des Dachbodens nach der frischen Brise jenseits der linken Wand verlangt.",
    "Agathe spricht im Traum zu mir: Was verschlossen vor dir liegt, will geöffnet werden, damit Licht und Wind hereinströmen.",
    "Eine innere Stimme flüstert klar und deutlich: Öffne das Fenster.",
  ],
  "BILD10|BENUTZEDRAHTSCHEREWAESCHELEINE": [
    "Eine leise Ahnung beschleicht mich, dass die straff gespannte Wäscheleine hier oben mir noch von Nutzen sein könnte — bekäme ich nur ein Stück davon los.",
    "Der Wind raunt mir zu, dass bloße Hände an dieser zähen Leine nichts ausrichten — ich brauche etwas Scharfes, um sie zu durchtrennen.",
    "Agathe spricht im Traum zu mir: Benutze die Drahtschere an der Wäscheleine und schneide sie ab.",
  ],
  "BILD10|BENUTZEWAESCHELEINEGIEBEL": [
    "Im Halbschlaf spüre ich, wie der Wind durch das Dachbodenfenster zieht und an etwas Langem zerrt, das dort oben am Giebel hängt.",
    "Mein Blick wandert vom Fenster hinab in die Tiefe – ohne einen festen Halt für die Leine komme ich hier nicht heil hinunter.",
    "Agathe spricht im Traum zu mir: Benutze die Wäscheleine am Giebel (knote sie fest).",
  ],
  "BILD2|BENUTZEDRAHTSCHEREWAESCHELEINE": [
    "Eine leise Ahnung beschleicht mich: Mein Blick wandert hinauf zum Fenster, wo etwas im Wind hin und her schwingt.",
    "Der Wind raunt mir zu, dass mir jenes baumelnde Stück Wäscheleine nützen könnte, wenn ich nur ein Ende davon durchtrennen würde.",
    "Eine innere Stimme flüstert klar: Benutze die Drahtschere an der Wäscheleine (schneide ein Stück ab).",
  ],
  "BILD2|BENUTZEWAESCHELEINEAST": [
    "Eine leise Ahnung beschleicht mich, daß der knorrige Ast in meiner Hand zu mehr taugt, als nur herumgetragen zu werden.",
    "Im Halbschlaf sehe ich, wie ich die Wäscheleine fest um den Ast schlinge, damit ich später einen Halt für den Brunnen habe.",
    "Eine innere Stimme flüstert: Benutze die Wäscheleine am Ast und knote sie fest an den Ast.",
  ],
  "BILD2|BENUTZEWAESCHELEINENASTBRUNNEN": [
    "Eine leise Ahnung beschleicht mich: Hinter dem Haus, am alten Brunnen, scheint mehr verborgen zu liegen, als das Dunkel preisgeben mag.",
    "Im Halbschlaf sehe ich den rauen Brunnenrand vor mir und spüre, dass der Ast an meiner Leine mir dort wohl den entscheidenden Halt geben könnte.",
    "Eine innere Stimme flüstert mir klar: Benutze die Leine-mit-Ast am Brunnen (verhake sie dort).",
  ],
  "BILD12|TRINKROTER TRANK": [
    "Eine leise Ahnung beschleicht mich, dass im Dunkel des Ganges etwas Großes und Hungriges lauert, dem ich nicht ohne Schutz begegnen sollte.",
    "Der Wind raunt mir zu, dass nur rohe, übermenschliche Stärke diese Bestie bezwingt — und dass ich mir diese Kraft besorgen muss, bevor ich auch nur einen Schritt weiter wage.",
    "Agathe spricht im Traum zu mir: Trink den roten Trank — BEVOR du weitergehst!",
  ],
  "BILD13|SCHAU ANZELLE": [
    "Ein kalter Schauer läuft mir den Rücken hinab — hier, an diesem Ort, verbirgt sich mehr, als der erste Blick mir verrät.",
    "Eine innere Stimme flüstert mir zu, dass ich die Zelle selbst gründlich in Augenschein nehmen muss — besonders das, was sie verschlossen hält.",
    "Agathe spricht im Traum zu mir und ihre Worte sind unmissverständlich: Schau dir Agathes Zelle an.",
  ],
  "BILD13|BENUTZEGOLDSCHLUESSELSCHLOSS": [
    "Eine leise Ahnung beschleicht mich, dass hinter dieser verriegelten Zellentür endlich Agathe auf mich wartet.",
    "Eine innere Stimme flüstert mir zu, dass der goldene Schlüssel, den ich so lange bei mir trage, genau in dieses eine Schloss gehört.",
    "Der Wind raunt mir zu: Benutze den Goldschlüssel am Schloss — und befreie Agathe!",
  ],
  "BILD1|NAV|V": [
    "Eine leise Ahnung beschleicht mich, dass hier vor dem Haus nichts mehr auf mich wartet — und der Weg um die Mauer herum mich lockt.",
    "Im Halbschlaf sehe ich mich, wie ich dieses Haus hinter mir lasse und mich seiner Rückseite zuwende.",
    "Agathe spricht im Traum zu mir: Geh nach Vorne (V).",
  ],
  "BILD2|NAV|V": [
    "Eine leise Ahnung beschleicht mich, dass das Haus selbst mich nun ruft und mich nicht länger draußen im Dunkeln stehen lassen will.",
    "Durch das zersplitterte Fenster weiß ich: Der Weg ins Innere steht mir endlich offen, und ich sollte ihn jetzt beschreiten.",
    "Agathe spricht im Traum zu mir: Geh nach Vorne (V) ins Haus.",
  ],
  "BILD2|NAV|R": [
    "Ein Ziehen an der Leine lässt mich innehalten — irgendwo hier hat sie sich verfangen, und ich ahne, dass mein Weg noch nicht zu Ende ist.",
    "Mein Blick fällt auf den alten Brunnen: Dort scheint sich die Leine verhakt zu haben, und von ihm aus führt ein Pfad weiter hinab.",
    "Agathe spricht im Traum zu mir: Geh nach Rechts (R) zum verhakten Brunnen.",
  ],
  "BILD3|NAV|V": [
    "Eine leise Ahnung beschleicht mich, dass dieser enge Raum mir nichts mehr zu bieten hat und ich besser nicht länger verweile.",
    "Der Wind raunt mir zu, dass hinter der Schwelle ein Wohnzimmer auf mich wartet und ich diese kahlen Wände endlich verlassen sollte.",
    "Agathe spricht im Traum zu mir: Geh nach Vorne (V) ins Wohnzimmer.",
  ],
  "BILD3|NAV|R": [
    "Eine leise Ahnung beschleicht mich, dass mein Weg noch nicht zu Ende ist und nach oben weist.",
    "Eine innere Stimme flüstert mir zu, ich solle dem Treppenaufgang folgen und ein Stockwerk höher steigen.",
    "Geh nach Rechts (R) die Treppe hoch in den 2. Stock.",
  ],
  "BILD4|NAV|H": [
    "Eine leise Ahnung beschleicht mich, dass ich hier im Wohnzimmer alles getan habe und es nun anderswo weitergeht.",
    "Eine innere Stimme flüstert mir zu, dass ich diesen Raum verlassen, den Rückweg antreten und danach höher hinaufsteigen sollte.",
    "Agathe spricht im Traum zu mir: Geh nach Hinten (H) zurück.",
  ],
  "BILD5|NAV|H": [
    "Eine leise Ahnung beschleicht mich, dass mich hier unten in diesem Labor nichts mehr hält und der Rückweg dorthin führt, woher ich gekommen bin.",
    "Im Halbschlaf sehe ich, wie ich dem Gang hinter mir folge und das Labor verlasse, um wieder ins gemütliche Wohnzimmer zu gelangen.",
    "Agathe spricht im Traum zu mir: Geh nach Hinten (H) zurück ins Wohnzimmer.",
  ],
  "BILD6|NAV|V": [
    "Mir schwant, daß meinem Plan noch der entscheidende Trunk fehlt — irgendwo in diesem Haus läßt sich gewiß etwas auftreiben, das sich vergiften ließe.",
    "Der Wind raunt mir zu, daß ich in der Küche etwas Trinkbares finden kann, um den vergifteten Trunk vorzubereiten.",
    "Agathe spricht im Traum zu mir: Geh nach Vorne (V) in die Küche, dort wartet das Bier.",
  ],
  "BILD6|NAV|R": [
    "Im Halbschlaf glaube ich, wie sich am Ende des Flurs eine schmale Tür im Halbdunkel abzeichnet — irgendetwas dort hinten scheint mich zu rufen.",
    "Eine innere Stimme flüstert mir zu, dass mir noch ein Werkzeug zum Schneiden fehlt — und dass ich es im Abstellraum nebenan finden würde, wenn ich nur die richtige Richtung einschlüge.",
    "Agathe spricht im Traum zu mir: Geh nach Rechts (R) in den Abstellraum.",
  ],
  "BILD6|NAV|L": [
    "Eine leise Ahnung beschleicht mich: Mein Werk hier oben ist getan, und die Treppe lockt mich fort aus diesem Flur.",
    "Im Halbschlaf sehe ich den Wächter an der Treppe lauern — mit Giftbier und Drahtschere gerüstet sollte ich mich nun zu ihm aufmachen.",
    "Agathe spricht im Traum zu mir: Geh nach Links (L) zur Treppe (zum Wächter).",
  ],
  "BILD7|NAV|H": [
    "Eine leise Ahnung beschleicht mich, dass mich in dieser Küche nichts mehr hält und mein Blick immer wieder zur Tür zurückwandert.",
    "Eine innere Stimme flüstert mir zu, dass hier alles erledigt ist und der Weg zurück in den Flur, woher ich gekommen bin, hinter mir liegt.",
    "Agathe spricht im Traum zu mir: Geh nach Hinten (H) zurück in den Flur.",
  ],
  "BILD8|NAV|L": [
    "Eine leise Ahnung beschleicht mich, dass ich hier alles gefunden habe und es nun anderswo weitergeht.",
    "Der Wind raunt mir zu, dass mich nichts mehr in diesem Abstellraum hält und ich denselben Weg zurücknehmen sollte, der mich hergeführt hat.",
    "Agathe spricht im Traum zu mir: Geh nach Links (L) zurück in den Flur.",
  ],
  "BILD9|NAV|V": [
    "Eine leise Ahnung beschleicht mich, dass hinter dem reglosen Wächter mehr auf mich wartet, als das Auge zunächst erfasst.",
    "Eine innere Stimme flüstert mir zu, dass der Weg über die Treppe nun frei vor mir liegt.",
    "Agathe spricht im Traum zu mir: Geh nach Vorne (V) die Treppe hinauf.",
  ],
  "BILD10|NAV|L": [
    "Im Halbschlaf spüre ich, wie der kühle Nachtwind durch das offene Dachfenster streicht und mich verheißungsvoll nach draußen lockt.",
    "Eine innere Stimme flüstert mir zu, dass ich allen Mut zusammennehmen und mich durch das offene Fenster ins Freie wagen muss — vielleicht braucht es mehr als einen Anlauf.",
    "Agathe spricht im Traum zu mir: Spring nach Links (L) aus dem Fenster.",
  ],
  "BILD11|NAV|SCHAU ANGANG": [
    "Eine leise Ahnung beschleicht mich, dass diese Leine viel zu kurz ist und der Gang unter mir nur Dunkelheit verbirgt.",
    "Im Dunkel wird mir klar, dass mich keine geschickte Aktion hier herausführt — der einzige Weg von dieser Leine fort führt nach unten.",
    "Eine innere Stimme flüstert: Tu einfach irgendetwas, schau zum Beispiel den Gang an — du stürzt ohnehin hinab.",
  ],
  "BILD12|NAV|V": [
    "Eine warme Kraft pulsiert seit dem Trank in meinen Adern, und ich spüre, dass dieser finstere Gang nicht das Ende meines Weges sein soll, sondern erst der Anfang von etwas Mutigem.",
    "Eine innere Stimme flüstert mir zu, dass der Hund, der den Weg versperrt, mir nun nichts mehr anhaben kann und ich getrost an ihm vorbei in Richtung Agathe schreiten soll.",
    "Agathe spricht im Traum zu mir: Geh nach Vorne (V) zu Agathe.",
  ],
  "BILD13|NAV|BENUTZEGOLDSCHLUESSELSCHLOSS": [
    "Eine leise Ahnung beschleicht mich, daß vor Agathes Zelle dieses verschlossene Gitter nicht ohne Grund auf mich wartet.",
    "Der Wind raunt mir zu, daß der schwere goldene Schlüssel in meiner Tasche genau hierher gehört, ins Schloss dieser Zelle.",
    "Agathe spricht im Traum zu mir: Benutze den Goldschlüssel am Schloss.",
  ],
  "BILD8|L": [
    "Eine leise Ahnung beschleicht mich, dass ich diese verschlossene Kiste mit bloßen Händen niemals aufbekomme.",
    "Eine innere Stimme flüstert mir zu, dass mir das rechte Werkzeug fehlt — etwas Schweres, das ich noch nicht bei mir trage und drüben im Flur liegen sah.",
    "Der Wind raunt mir klar zu: Mir fehlt der Hammer. Geh zurück in den Flur (nach Links, L) und hol ihn dir erst.",
  ],
  "BILD10|H": [
    "Eine leise Ahnung beschleicht mich, dass ich an dieser zähen Leine scheitern werde, solange meine Hände ohne Werkzeug bleiben.",
    "Eine innere Stimme flüstert mir zu, dass mir etwas Scharfes zum Schneiden fehlt — eine Drahtschere, wie sie unten im Abstellraum in einer Kiste liegt.",
    "Agathe spricht im Traum zu mir: Mir fehlt die Drahtschere. Geh erst zurück (nach Hinten, H) und hol sie aus dem Abstellraum.",
  ],
};
