# Dark Castle — Web Port

A faithful, playable **web remake** of *Dark Castle*, a German parser text
adventure for the Commodore Amiga, originally written in AMOS Basic V1.3 in
1992 by *The New Style* (Freeware).

**▶ Play it online: https://andreaswiencke.github.io/dark-castle/**

Uncle Albert recounts how he rescued his kidnapped wife **Agathe** from a
two-storey house — guiding him through 13 locations, collecting items and
solving puzzles along the way. The interface is available in **English and
German** (it follows your browser language; switch any time, top-left).

The port stays true to the 1992 original; intentional deviations (bug fixes
that unblock progress, etc.) are documented in [`PORT-NOTES.md`](PORT-NOTES.md).

## Running

No dependencies — just Node.js (uses the built-in test runner).

```sh
npm test        # run the test suite
npm run build   # build the single-file dark-castle.html
```

Then serve the folder and open `dark-castle.html` (or `index.html`) in a
browser, e.g.:

```sh
python3 -m http.server 8000
# → http://localhost:8000/dark-castle.html
```

> **Serve it over HTTP** — opening the file directly via `file://` works for
> the game itself, but browsers block loading the Amiga font over `file://`,
> so the text would fall back to a generic monospace.

## Layout

| Path | Contents |
|------|----------|
| `src/` | The engine and the room / item / text data |
| `assets/` | Pictures, audio and the Amiga **Topaz** font (`assets/raw/` holds the high-res sources) |
| `test/` | The test suite (`node --test`) |
| `tools/` | Helper scripts used to prepare the audio assets |
| `build.mjs` | Inlines `src/` + `styles.css` into the single-file `dark-castle.html` |

## Credits (original, 1992)

- Story & puzzles: Ulf Zierke, Andreas Wiencke
- Manual, backstory, testing: Erik Zierke
- Programming: Andreas Wiencke
- Music: Stefan Laube, Marcus Scharff
- Graphics: Matthias Jahn

© 1992 by The New Style — Freeware

## Font

The interface uses **Topaz**, the Amiga system font. The TrueType remake is by
*dMG / Trueschool* — see [`assets/fonts/LICENSE.txt`](assets/fonts/LICENSE.txt)
for attribution and license (GPL-FE).
