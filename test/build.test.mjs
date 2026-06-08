import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("bundle is self-contained (no leftover import/export, has mount + verbs)", async () => {
  const html = await readFile(new URL("../dark-castle.html", import.meta.url), "utf8");
  assert.ok(!/^\s*import\s/m.test(html), "no leftover import statements");
  assert.ok(!/^export\s/m.test(html), "no leftover export statements");
  assert.ok(html.includes('id="screen2"'), "has lower screen mount");
  assert.ok(html.includes("Dark Castle"), "has title text");
  assert.ok(html.includes("createUI"), "bundled the UI code");
  assert.ok(html.includes("applyCommand"), "bundled the engine code");
  assert.ok(html.includes("createAudio"), "bundled the audio code");
  assert.ok(html.includes("titel.mp3"), "references the title music track");
  assert.ok(html.includes("imageScreen"), "bundled the image-screen helper");
  assert.ok(html.includes("newstyle.png"), "references the newstyle logo");
  assert.ok(html.includes("death.png"), "references the death screen");
  assert.ok(html.includes("ending.png"), "references the ending sunset picture");
  assert.ok(html.includes("Topaz_a500"), "embeds the Amiga Topaz font face");
});

test("bundle has no duplicate top-level declarations (would crash the module)", async () => {
  // All modules share one scope in the bundle; a duplicate top-level function/const/let
  // (e.g. the same helper name in two files) is a SyntaxError in the <script type=module>.
  // The fake-DOM smoke test runs the code as a sloppy script and would NOT catch it.
  const html = await readFile(new URL("../dark-castle.html", import.meta.url), "utf8");
  const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(m, "found bundled module script");
  const counts = {};
  const re = /^(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm;
  let mm;
  while ((mm = re.exec(m[1]))) counts[mm[1]] = (counts[mm[1]] || 0) + 1;
  const dupes = Object.keys(counts).filter((k) => counts[k] > 1);
  assert.deepEqual(dupes, [], `duplicate top-level identifiers: ${dupes.join(", ")}`);
});
