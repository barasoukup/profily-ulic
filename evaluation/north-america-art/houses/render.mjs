// Sheets of North America's house looks (docs/house-types-north-america.md) drawn with the app's own code, every look at
// one scale, a few European ones beside. Writes PNG (Quick Look, ImageMagick).
//   node evaluation/north-america-art/houses/render.mjs [prehled|<look>…] [--out=dir]
// Also imported by rules/: renderCells(cells, file).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..", "..", "pilot", "public");
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
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const serialize = (n) => `<${n.name}${Object.entries(n.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join("")}>${esc(n.text)}${n.children.map(serialize).join("")}</${n.name}>`;
globalThis.document = { createElementNS: (_, name) => new Node(name) };
globalThis.fetch = async (p) => { const file = path.join(ROOT, String(p)); return { ok: fs.existsSync(file), status: 200, text: async () => fs.readFileSync(file, "utf8") }; };
const PUB = process.env.PUB ? path.resolve(process.env.PUB) : ROOT; // another checkout's code (before / after)
const { loadSprites, buildSvg } = await import(pathToFileURL(path.join(PUB, "profile.js")));
const { setCity } = await import(pathToFileURL(path.join(PUB, "city.js")));

// Quick Look renders squares only (tools/build_og.mjs): a square sheet, then cropped.
export function svgToPng(body, W, H, dest) {
  const S = Math.max(W, H), tmp = fs.mkdtempSync(path.join(os.tmpdir(), "houses-"));
  fs.writeFileSync(path.join(tmp, "a.svg"), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" fill="#f4f1ea"/>${body}</svg>`);
  execFileSync("qlmanage", ["-t", "-s", String(S), "-o", tmp, path.join(tmp, "a.svg")], { stdio: "ignore", timeout: 120000 });
  execFileSync("magick", [path.join(tmp, "a.svg.png"), "-crop", `${W}x${H}+0+0`, "+repage", dest]);
  fs.rmSync(tmp, { recursive: true, force: true });
}
// cells: { title, cityId, house: { look, info } }: the house on the left of a sidewalk; px per cm the same everywhere.
export async function renderCells(cells, dest, { k = 0.28, cols = 6, text = true, CW = 300, x0 = 330, cut = 190 } = {}) {
  const parts = [];
  for (const c of cells) {
    setCity(c.cityId);
    await loadSprites();
    const svg = buildSvg({ segments: [{ type: "chodnik", width: 5.2 }, { type: "pruh", width: 3 }], edges: { left: "budova", leftStyle: c.house.look, leftInfo: c.house.info, right: "zadna" } }, { signs: false, whole: true });
    const [vx, vy, vw, vh] = svg.attrs.viewBox.split(" ").map(Number);
    parts.push({ c, inner: svg.children.map(serialize).join(""), vb: [vx + x0, vy + 60, vw, vh - 60 - cut] });
  }
  let body = "", y = 0;
  const W = cols * CW;
  for (let i = 0; i < parts.length; i += cols) {
    const row = parts.slice(i, i + cols), rh = Math.ceil(Math.max(...row.map((p) => p.vb[3])) * k) + 34;
    row.forEach((p, j) => {
      const h = p.vb[3] * k;
      body += `<rect x="${j * CW + 3}" y="${y + 3}" width="${CW - 6}" height="${rh - 6}" fill="#fbfaf6" stroke="#ddd8cc"/>`
        + (text ? `<text x="${j * CW + CW / 2}" y="${y + 22}" font-size="14" text-anchor="middle" fill="#333" font-family="Helvetica">${esc(p.c.title)}</text>` : "")
        + `<svg x="${j * CW + 6}" y="${y + rh - 4 - h}" width="${CW - 12}" height="${h}" viewBox="${p.vb[0]} ${p.vb[1]} ${(CW - 12) / k} ${p.vb[3]}">${p.inner}</svg>`;
    });
    y += rh;
  }
  svgToPng(body, W, y, dest);
  return [W, y];
}
const P = { dc: [-76.9935, 38.8870], george: [-77.065, 38.908], petworth: [-77.02, 38.942], nyc: [-73.968, 40.78], bos: [-71.06, 42.31], bk: [-71.077, 42.346], tor: [-79.366, 43.666], sf: [-122.435, 37.774], sunset: [-122.49, 37.75], any: [-77.2, 38.85], any2: [-77.2, 38.8503], any3: [-77.2001, 38.85], praha: [14.42, 50.087], paris: [2.33, 48.87], ams: [4.89, 52.37], berlin: [13.35, 52.5] };
const blk = { length: 40, width: 12, fill: 0.9, parts: 8 };
const h = (look, levels, at, extra = {}) => ({ look, info: { ...(levels ? { levels } : {}), point: P[at], block: blk, type: "house", ...extra } });
const c = (title, house, cityId = "usa") => ({ title, house, cityId });
export const SHEET = [
  c("bayrow, Capitol Hill", h("bayrow", 2, "dc", { tint: 0 })), c("bayrow 3 floors", h("bayrow", 3, "dc", { tint: 4 })), c("bayrow, flat (Georgetown)", h("bayrow", 3, "george", { tint: 1 })),
  c("bayrow, Boston South End", h("bayrow", 4, "bk", { tint: 2 })), c("porchrow, Petworth", h("porchrow", 2, "petworth", { tint: 0 })), c("bayrow, unknown kind (plain)", h("bayrow", 2, "petworth", { tint: 2, type: undefined })), c("porchrow 2", h("porchrow", 3, "petworth", { tint: 2 })),
  c("framehouse, siding", h("framehouse", 2, "any2", { tint: 2 })), c("framehouse, stoop", h("framehouse", 2, "any", { tint: 3, start: 1955 })), c("framehouse, brick", h("framehouse", 1, "any", { material: "brick", tint: 1 })),
  c("brickblock, garden", h("brickblock", 3, "any", { tint: 0 })), c("brickblock 1928", h("brickblock", 8, "any", { start: 1928, tint: 1 })), c("brickblock, no year", h("brickblock", 5, "any", { tint: 3 })),
  c("mainstreet", h("mainstreet", 2, "any", { tint: 0 })), c("mainstreet 3", h("mainstreet", 3, "any", { tint: 2 })), c("stripmall", h("stripmall", 1, "any", { tint: 1 })),
  c("brownstone, New York", h("brownstone", 4, "nyc", { tint: 0 })), c("tenement, New York", h("tenement", 5, "nyc", { tint: 0 })), c("tripledecker, Boston", h("tripledecker", 3, "bos", { tint: 1 })),
  c("baygable, Toronto", h("baygable", 3, "tor", { tint: 0 })), c("baygable 2", h("baygable", 2, "tor", { tint: 4 })), c("victorian, San Francisco", h("victorian", 3, "sf", { tint: 0 })),
  c("victorian, plain (Sunset)", h("victorian", 2, "sunset", { tint: 5 })), c("podium", h("podium", 5, "any", { start: 2015, tint: 0 })),
  c("podium 6", h("podium", 6, "any", { start: 2018, tint: 2 })), c("slab 1965", h("slab", 9, "any", { start: 1965, tint: 1 })), c("slab, no year", h("slab", 9, "any", { tint: 3 })),
  c("glasstower", h("glasstower", 12, "any", { start: 2012, type: "apartments" })), c("glasstower, office", h("glasstower", 11, "any", { start: 2005, type: "office" })), c("reused: kancelar", h("kancelar", 8, "any", { type: "office" })),
  c("reused: skola", h("skola", 2, "any", { type: "school" })), c("reused: kostel", h("kostel", 1, "any", { type: "church" })), c("Praha: činžák", h("sikma", 5, "praha", {}), "praha"),
  c("Paris: haussmann", h("haussmann", 7, "paris", {}), "france"), c("Amsterdam: cihlovy", h("cihlovy", 4, "ams", {}), "netherlands"), c("Berlin: povalecny", h("povalecny", 5, "berlin", {}), "germany"),
];
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--")), out = process.argv.find((a) => a.startsWith("--out="))?.slice(6) || HERE;
  const k = Number(process.argv.find((a) => a.startsWith("--k="))?.slice(4) || 0.28);
  if (!args.length || args[0] === "prehled") console.log(await renderCells(SHEET, path.join(out, "prehled.png"), { k }));
  else console.log(await renderCells(SHEET.filter((x) => args.some((a) => x.house.look === a)), path.join(out, `${args.join("-")}.png`), { k, cols: 4, CW: 440 }));
}
