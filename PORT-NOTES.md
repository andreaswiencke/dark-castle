# Dark Castle Web-Port — Abweichungen vom Original

Dieser Port ist **originalgetreu, aber spielbar**. Alle Texte, Räume, Rätsel und Reaktionen
entsprechen dem AMOS-Original von 1992 (`preservation/03_Dark-Castle.detokenisiert.bas`).
Geändert wurde nur das Nötigste, damit das Spiel durchspielbar ist.

## Behobene, fortschritts­brechende Tippfehler im Code

- **`INVETRAR1$` → `INVENTAR1$`** in `PASSWORT3` (Code „ANARCHY"). Im Original ging dadurch
  der Schlüssel (Slot 1) verloren, wenn man per Code in Abschnitt 4 einstieg. Korrigiert.
- **`GENSTAND2E` → `GEGENSTAND2E`** in BILD2 (`onEnter`). Tippfehler ohne Wirkung, sauber gesetzt.
- **BILD10 `BENUTZEDRAHTSCHEREWAESCHELEINE`**: Das Original hatte hier zwei Tippfehler
  (`INVENATR14$`, `INVEMTAR13$`), die die Bedingungen unbeabsichtigt immer wahr/falsch
  machten. Umgesetzt ist der **beabsichtigte, spielbare Ablauf** (Uniform anziehen +
  Wäscheleine abschneiden, entspricht der Prozedur `ABNEHMEN`).

## Behobenes Verhalten

- **Tod ohne Neustart-Zwang:** Im Original musste man nach dem Tod das Spiel mit Ctrl-C
  abbrechen und neu laden (ein nie behobener Bug, im Handbuch selbst erwähnt). Der Port
  kehrt nach dem Tod sauber ins Hauptmenü zurück.

## Bewusst beibehalten (Werktreue)

- Alle Spieltexte **wörtlich**, inkl. Original-Schreibweise und -Tippfehler in den Texten
  (z. B. „nich", „fuehrtin", „stegt", „weitesgehend", „antwort").
- Die drei Abschnitts­codes **STOERTEBECKER / DT 64 / ANARCHY** als Skip-/Save-Mechanik samt
  der zugehörigen Start-Inventare.
- Alle Tod-Fallen (Frucht essen, falsche Tränke, Wächter angreifen, Hund ohne Roten Trank,
  Tresor-Explosion bei Fehlschlag).
- Eigenheiten der Original-Logik, z. B. dass die Tresor-Explosions­abfrage (`VERSAGT`) erst
  spät in der Regelkette greift.

## Tote Original-Regeln (weggelassen, da wirkungslos)

Diese Original-Zeilen konnten nie auslösen (Bedingung unmöglich) und wurden weggelassen; das
beobachtbare Verhalten ist über die generischen Fallbacks identisch:

- BILD9 `Left$(ANWEISUNG$,3)="Gib"` — `ANWEISUNG$` ist immer Großbuchstaben, „Gib" matcht nie.
- BILD9 `BENUTZEHAMMERWAECHTER` mit Bedingung `INVENTAR13$="Hammer"` — Slot 13 ist die
  Drahtschere, nie der Hammer.

## Normalisierung

- Generischer „Ich kann das nicht …"-Fallback einheitlich mit „nicht" (das Original schrieb
  je nach Raum mal „nicht", mal „nich"). Raum­spezifische Texte behalten ihre Original­schreibung.
