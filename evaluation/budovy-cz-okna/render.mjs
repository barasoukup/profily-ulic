// Before/after sheet of the Czech house looks whose upper windows (mansard, gable, set-back floor) now keep the window
// columns of the floors below. Draws each look with two copies of the app (pilot/public of HEAD before the change and
// of the changed tree), side by side, with the app's own code (as evaluation/budovy-regiony/render.mjs).
//   node evaluation/budovy-cz-okna/render.mjs <before-root> <after-root> [out.png]
// (a root is a folder holding pilot/public, e.g. a `git archive` of HEAD). PNG via Quick Look + ImageMagick.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const P = [14.42, 50.087]; // Prague
const h = (look, levels, extra = {}) => ({ look, info: { levels, point: P, ...extra } });
// [title, left house, right house]
// SHEET=stit-rimsa: the tenements' gables and the looks with a cornice (Bára 23. 11. 2026, stit-rimsa-pred-po.png).
const PL = { paris: [2.33, 48.87], madrid: [-3.705, 40.415], amsterdam: [4.89, 52.37], kobenhavn: [12.56, 55.67], stockholm: [18.07, 59.31] };
const STIT_RIMSA = [
  ["činžák 5 · 4", h("sikma", 5), h("sikma", 4, { tint: 2 })],
  ["činžák 6 (5 + mansarda) · 3", h("sikma", 6, { cornice: 5, roof: 1 }), h("sikma", 3, { tint: 1 })],
  ["měšťanský dům 3 · sorela 5", h("mestan", 3), h("sorela", 5)],
  ["zděný dům 50.–60. let 4 · haussmannovský 7", h("typovy", 4), h("haussmann", 7, { point: PL.paris })],
  ["severský činžák 5 · dánský 5", h("stenstad", 5, { point: PL.stockholm }), h("dansky", 5, { point: PL.kobenhavn })],
  ["středomořský 5 · amsterdamský 4", h("stredomori", 5, { point: PL.madrid }), h("cihlovy", 4, { point: PL.amsterdam })],
];
export const CELLS = process.env.SHEET === "stit-rimsa" ? STIT_RIMSA : ([
  ["činžák 5 · 6 (5 + mansarda)", h("sikma", 5), h("sikma", 6, { cornice: 5, roof: 1 })],
  ["činžák 7 (5 + 2 v mansardě)", h("sikma", 7, { cornice: 5, roof: 2 }), h("sikma", 4, { tint: 2 })],
  ["měšťanský dům 3 · 4 (3 + mansarda)", h("mestan", 3), h("mestan", 4, { cornice: 3, roof: 1 })],
  ["sorela 5 · 6 (5 + mansarda)", h("sorela", 5), h("sorela", 6, { cornice: 5, roof: 1 })],
  ["zděný dům 50.–60. let 4 · 5 (4 + podkroví)", h("typovy", 4), h("typovy", 5, { cornice: 4, roof: 1 })],
  ["městský dům 1 · 2 (1 + podkroví)", h("nizky", 1, { house: true }), h("nizky", 2, { cornice: 1, roof: 1, house: true })],
  ["městský dům 2 · plochá střecha", h("nizky", 2, { house: true }), h("nizky", 2)],
  ["vila 2 · 3 (2 + podkroví)", h("vila", 2), h("vila", 3, { cornice: 2, roof: 1 })],
  ["rodinný dům 60.–80. let · nový rodinný dům", h("kostka", 2), h("novyrd", 2)],
  ["venkovský dům · škola (stará)", h("statek", 1), h("skola", 3, { built: 1910 })],
  ["škola (nová) 3 · 4 (3 + ustoupené)", h("skola", 3, { built: 1975 }), h("skola", 4, { built: 1975, cornice: 3, roof: 1 })],
  ["městský dům plochý 3 (2 + ustoupené) · funkcionalismus 6", h("nizky", 3, { cornice: 2, roof: 1 }), h("funkce", 6)],
  ["funkcionalismus 7 (6 + ustoupené) · moderní 7 (6 + ustoupené)", h("funkce", 7, { cornice: 6, roof: 1 }), h("moderni", 7, { cornice: 6, roof: 1 })],
  ["panelák 8 · 9 (8 + ustoupené)", h("plocha", 8), h("plocha", 9, { cornice: 8, roof: 1 })],
  ["kancelář 5 · 6 (5 + ustoupené)", h("kancelar", 5), h("kancelar", 6, { cornice: 5, roof: 1 })],
  ["moderní 6 · kostel", h("moderni", 6), h("kostel", 1)],
]);

// One copy of the app: the inner SVG of each cell (run in a child process, so the two copies never share modules).
if (process.argv[2] === "--cells") {
  const ROOT = path.join(process.argv[3], "pilot", "public");
  class Node {
    constructor(name) { this.name = name; this.attrs = {}; this.children = []; this.text = ""; this.style = {}; this.dataset = {}; this.classList = { add() {}, toggle() {}, contains: () => false }; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k] ?? null; }
    appendChild(c) { this.children.push(c); return c; }
    append(...c) { this.children.push(...c); }
    addEventListener() {}
    set textContent(t) { this.text = String(t); }
    get textContent() { return this.text; }
    get firstChild() { return this.children[0]; }
  }
  const serialize = (n) => `<${n.name}${Object.entries(n.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join("")}>${esc(n.text)}${n.children.map(serialize).join("")}</${n.name}>`;
  globalThis.document = { createElementNS: (_, name) => new Node(name) };
  globalThis.fetch = async (p) => {
    const file = path.join(ROOT, String(p));
    return { ok: fs.existsSync(file), status: 200, text: async () => fs.readFileSync(file, "utf8") };
  };
  const { loadSprites, buildSvg } = await import(pathToFileURL(path.join(ROOT, "profile.js")));
  const { setCity } = await import(pathToFileURL(path.join(ROOT, "city.js")));
  await loadSprites();
  setCity("praha");
  const out = CELLS.map(([, left, right]) => {
    const profile = {
      segments: [{ type: "chodnik", width: 2 }],
      edges: { left: "budova", leftStyle: left.look, leftInfo: left.info, right: "budova", rightStyle: right.look, rightInfo: right.info },
    };
    let svg;
    try { svg = buildSvg(profile, { signs: false, whole: true }); } catch (e) { // HEAD fails on a school's set-back floor
      return { vb: "-1100 -1500 2400 2500", inner: `<text x="100" y="-200" font-size="44" text-anchor="middle" fill="#b03030">chyba: ${esc(e.message)}</text>` };
    }
    return { vb: svg.attrs.viewBox, inner: serialize(svg).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "") };
  });
  fs.writeFileSync(process.argv[4], JSON.stringify(out));
  process.exit(0);
}

const [before, after] = [process.argv[2], process.argv[3]];
const dest = process.argv[4] || path.join(HERE, "pred-po.png");
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "budovy-cz-"));
const run = (root, name) => {
  const file = path.join(tmp, `${name}.json`);
  execFileSync(process.execPath, [fileURLToPath(import.meta.url), "--cells", path.resolve(root), file], { stdio: "inherit" });
  return JSON.parse(fs.readFileSync(file, "utf8"));
};
const A = run(before, "before"), B = run(after, "after");
// One row per look (before | after), each drawn by Quick Look on its own (it renders squares only), then stacked.
const CW = 560, CH = 860, W = 2 * CW;
const rowPng = (svgBody, h, name) => {
  const svgFile = path.join(tmp, `${name}.svg`);
  fs.writeFileSync(svgFile, `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}"><rect width="${W}" height="${W}" fill="#f4f1ea"/>${svgBody}</svg>`);
  execFileSync("qlmanage", ["-t", "-s", String(W), "-o", tmp, svgFile], { stdio: "ignore" });
  const png = path.join(tmp, `${name}.png`);
  execFileSync("magick", [`${svgFile}.png`, "-crop", `${W}x${h}+0+0`, "+repage", png]);
  return png;
};
const font = `font-family="Helvetica, Arial"`;
const rows = [rowPng(`<text x="${CW / 2}" y="46" font-size="32" font-weight="bold" text-anchor="middle" fill="#333" ${font}>PŘED (HEAD)</text>`
  + `<text x="${CW * 1.5}" y="46" font-size="32" font-weight="bold" text-anchor="middle" fill="#333" ${font}>PO</text>`, 64, "head")];
// Only the looks the change touched (a row whose drawing is the same before and after is left out).
const same = [];
CELLS.forEach(([title], i) => {
  if (A[i].inner === B[i].inner) { same.push(title); return; }
  let body = "";
  for (const [j, part] of [A[i], B[i]].entries()) {
    // Only the two houses and the pavement between them (x −440…640 of the profile).
    const [, vy, , vh] = part.vb.split(" ").map(Number);
    body += `<g transform="translate(${j * CW} 0)"><rect x="5" y="5" width="${CW - 10}" height="${CH - 10}" fill="#fbfaf6" stroke="#ddd8cc"/>`
      + `<text x="${CW / 2}" y="34" font-size="20" text-anchor="middle" fill="#333" ${font}>${esc(title)}</text>`
      + `<svg x="10" y="44" width="${CW - 20}" height="${CH - 54}" viewBox="-440 ${vy + 100} 1080 ${vh - 160}" preserveAspectRatio="xMidYMax meet">${part.inner}</svg></g>`;
  }
  rows.push(rowPng(body, CH, `row${i}`));
});
execFileSync("magick", [...rows, "-append", dest]);
fs.rmSync(tmp, { recursive: true });
console.log(dest, same.length ? `beze změny: ${same.join("; ")}` : "");
