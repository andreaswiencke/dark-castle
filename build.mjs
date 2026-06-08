// Builds dark-castle.html by inlining all src modules and styles.css into index.html.
import { readFile, writeFile } from "node:fs/promises";

const order = [
  "src/data/items.js",
  "src/data/texts.js",
  "src/data/rooms.js",
  "src/data/hints.js",
  "src/data/i18n.js",
  "src/i18n.js",
  "src/globalchecks.js",
  "src/engine.js",
  "src/specials.js",
  "src/ui.js",
  "src/audio.js",
  "src/main.js",
];

// Concatenate modules, stripping `import ... from "./...";` lines (all share one scope in the
// bundle) and converting `export ` to nothing.
async function readMod(path) {
  let src = await readFile(path, "utf8");
  src = src.replace(/^\s*import[^\n]*\n/gm, "");
  src = src.replace(/^export\s+/gm, "");
  return `// ===== ${path} =====\n${src}\n`;
}

const css = await readFile("styles.css", "utf8");
const mods = [];
for (const path of order) {
  try {
    mods.push(await readMod(path));
  } catch {
    // module not created yet (early build); skip
  }
}
let html = await readFile("index.html", "utf8");
html = html.replace("/*__CSS__*/", () => css).replace("/*__JS__*/", () => mods.join("\n"));
await writeFile("dark-castle.html", html);
console.log("Wrote dark-castle.html (" + html.length + " bytes)");
