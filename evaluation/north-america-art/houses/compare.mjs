// Every state's looks before and after (docs/house-types-north-america.md): buildingStyle and the drawn SVG of many
// houses in every city but North America's. OLD=<old pilot/public> node compare.mjs
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.ONE) {
  const run = (pub) => JSON.parse(execFileSync("node", [fileURLToPath(import.meta.url)], { env: { ...process.env, ONE: pub }, maxBuffer: 1e9 }).toString());
  const a = run(process.env.OLD), b = run(path.join(HERE, "../../../pilot/public"));
  let diff = 0, n = 0;
  for (const c of Object.keys(a)) { n += a[c].n; if (a[c].hash !== b[c]?.hash) { diff++; console.log("differs:", c); } }
  console.log(Object.keys(a).length, "cities", n, "houses,", diff, "cities differ");
} else {
  class N { constructor(n) { this.name = n; this.attrs = {}; this.children = []; this.text = ""; this.style = {}; this.dataset = {}; this.classList = { add() {}, toggle() {} }; } setAttribute(k, v) { this.attrs[k] = String(v); } getAttribute(k) { return this.attrs[k] ?? null; } appendChild(c) { this.children.push(c); return c; } append(...c) { this.children.push(...c); } addEventListener() {} set textContent(t) { this.text = String(t); } get textContent() { return this.text; } get firstChild() { return this.children[0]; } }
  globalThis.document = { createElementNS: (_, n) => new N(n) };
  const ser = (n) => n.name + JSON.stringify(n.attrs).replace(/cut\d+|pc\d+/g, "") + n.text + n.children.map(ser).join("");
  const P = await import(path.join(process.env.ONE, "profile.js")), C = await import(path.join(process.env.ONE, "city.js"));
  const out = {}, blocks = [undefined, { length: 60, width: 12, fill: 0.85, parts: 1 }, { length: 80, width: 50, fill: 0.5, parts: 12 }];
  for (const id of C.CITY_IDS) {
    if (id === "usa") continue;
    C.setCity(id);
    const h = createHash("sha1"); let n = 0;
    const c = C.city.centre || [(C.city.start?.[1] ?? 10), 50];
    for (const type of [undefined, "house", "apartments", "office", "retail", "church", "detached", "terrace"]) for (const levels of [undefined, 1, 2, 3, 5, 9]) for (const y of [undefined, 1880, 1930, 1965, 2005]) for (const block of blocks) {
      const info = { type, levels, start: y, block, km: 2, point: [c[0] + n * 1e-5, c[1]], tint: n % 4, roofShape: n % 5 ? undefined : "flat" };
      const s = P.buildingStyle(info); h.update(String(s)); n++;
      if (n % 12 === 0) h.update(ser(P.buildSvg({ segments: [{ type: "chodnik", width: 3 }, { type: "pruh", width: 3 }], edges: { left: "budova", leftInfo: info, right: "budova", rightInfo: { ...info, levels: 4 } } }, { signs: false, whole: true })));
    }
    out[id] = { n, hash: h.digest("hex") };
  }
  console.log(JSON.stringify(out));
}
