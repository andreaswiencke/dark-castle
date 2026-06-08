// Loads the bundled <script> from dark-castle.html into a fake DOM and verifies it boots
// without throwing. Catches bundling hazards (duplicate declarations, undefined refs from
// stripped imports, boot-time reference errors) that the pure-logic tests can't.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

function makeEl() {
  const el = {
    _ch: [], style: {}, innerHTML: "", textContent: "", className: "", value: "",
    id: "", type: "", autocomplete: "", autocapitalize: "", spellcheck: false,
    scrollTop: 0, scrollHeight: 0, clientHeight: 320,
    appendChild(c) { this._ch.push(c); return c; },
    removeChild(c) { return c; },
    querySelector() { return makeEl(); },
    addEventListener() {}, removeEventListener() {}, focus() {},
  };
  return el;
}

test("bundled game boots in a fake DOM without errors", async () => {
  const html = await readFile(new URL("../dark-castle.html", import.meta.url), "utf8");
  const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(m, "found bundled module script");
  const code = m[1];

  const errors = [];
  const root = makeEl();
  const sandbox = {
    Math, JSON, Date, Promise, parseInt, parseFloat, Array, Object, String, Number,
    console: { log() {}, warn() {}, error(...a) { errors.push(a.join(" ")); } },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: () => 0,
    document: {
      readyState: "complete",
      getElementById: () => root,
      createElement: () => makeEl(),
      addEventListener: () => {},
    },
    window: { addEventListener: () => {}, removeEventListener: () => {}, AudioContext: undefined },
  };
  sandbox.globalThis = sandbox;

  // Should not throw while loading + booting up to the first await.
  assert.doesNotThrow(() => {
    vm.runInNewContext(code, sandbox, { filename: "dark-castle.bundle.js" });
  });
  // Give microtasks a tick so any boot-time rejection would surface.
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(errors, [], "no console.error during boot");
});
