// Every set's lamps before and after (the drawn SVGs of heights 3–10 m and the usual one, on either side and in a median,
// with trams): OLD=<old pilot/public> node compare-lamps.mjs. The sets of the USA differ as meant, no other may.
import path from "node:path";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const ME = fileURLToPath(import.meta.url), NEW = path.join(path.dirname(ME), "../../../pilot/public");
if (!process.env.ONE) {
  const run = (pub) => JSON.parse(execFileSync("node", [ME], { env: { ...process.env, ONE: pub }, maxBuffer: 1e9 }).toString());
  const a = run(process.env.OLD), b = run(NEW);
  console.log(Object.keys(b).length, "cities,", Object.values(b)[0].n, "drawings each; differ:", Object.keys(b).filter((c) => a[c]?.hash !== b[c].hash).join(", ") || "none");
} else {
  class N { constructor(n) { this.name = n; this.attrs = {}; this.children = []; this.text = ""; this.style = {}; this.dataset = {}; this.classList = { add() {}, toggle() {}, contains: () => false }; } setAttribute(k, v) { this.attrs[k] = String(v); } getAttribute(k) { return this.attrs[k] ?? null; } appendChild(c) { this.children.push(c); return c; } append(...c) { this.children.push(...c); } addEventListener() {} set textContent(t) { this.text = String(t); } get textContent() { return this.text; } get firstChild() { return this.children[0]; } }
  globalThis.document = { createElementNS: (_, n) => new N(n) };
  globalThis.fetch = async (p) => { const f = path.join(process.env.ONE, String(p)); return { ok: fs.existsSync(f), status: 200, text: async () => fs.readFileSync(f, "utf8") }; };
  const warn = console.warn; console.warn = () => {};
  const ser = (n) => n.name + JSON.stringify(n.attrs).replace(/(cut|pc|lamp)\d+/g, "$1") + n.text + n.children.map(ser).join("");
  const P = await import(path.join(process.env.ONE, "profile.js")), C = await import(path.join(process.env.ONE, "city.js"));
  const out = {};
  for (const id of C.CITY_IDS) {
    C.setCity(id);
    await P.loadSprites();
    const h = createHash("sha1"); let n = 0;
    for (const height of [undefined, 3, 4, 5, 6, 7, 8, 9, 10]) for (const tram of [false, true]) for (const f of [0.2, 0.8]) {
      const lamp = () => [{ kind: "lampa", f, ...(height && { h: height }) }];
      const segments = [{ type: "chodnik", width: 3, items: lamp() }, { type: "pruh", width: 3, dir: "backward" }, tram ? { type: "tramvaj", width: 7, bed: "panely" } : { type: "delici", width: 3, items: lamp() },
        { type: "pruh", width: 3, dir: "forward" }, { type: "chodnik", width: 3, items: lamp() }];
      h.update(ser(P.buildSvg({ segments, edges: { left: "zadna", right: "zadna" } }, { signs: false, whole: true }))); n++;
    }
    out[id] = { n, hash: h.digest("hex") };
  }
  console.warn = warn;
  console.log(JSON.stringify(out));
}
