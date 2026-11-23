// Sheets of the regional house looks (docs/house-types-europe.md) drawn with the app's own code (profile.js, as
// tools/build_og.mjs), a Prague tenement beside them for comparison. Writes SVG and PNG (ImageMagick) here.
//   node evaluation/budovy-regiony/render.mjs [jih|sever|drevo|stity|stity-varianty|povalecny|mansarda|vse]
// (povalecny.png goes to evaluation/budovy-povalecny/)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..", "pilot", "public");
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
globalThis.fetch = async (p) => {
  const file = path.join(ROOT, String(p));
  return { ok: fs.existsSync(file), status: 200, text: async () => fs.readFileSync(file, "utf8") };
};
const { loadSprites, buildSvg, BUILDING_STYLES } = await import("../../pilot/public/profile.js");
const cityMod = await import("../../pilot/public/city.js");
const { setCity } = cityMod;
const { LOOKS, nordicDetails } = await import("../../pilot/public/house-looks.js");
await loadSprites();

// One cell: a house on each side of a narrow street. [title, city, left {look, levels, point}, right {…}]
const P = { praha: [14.42, 50.087], lisboa: [-9.14, 38.71], madrid: [-3.705, 40.415], coruna: [-8.40, 43.37], barcelona: [2.17, 41.39],
  roma: [12.49, 41.9], valletta: [14.513, 35.898], nicosia: [33.364, 35.174], paris: [2.33, 48.87], bruxelles: [4.35, 50.85],
  amsterdam: [4.89, 52.37], kobenhavn: [12.56, 55.67], stockholm: [18.07, 59.31], helsinki: [24.95, 60.17], tallinn: [24.73, 59.446],
  porvoo: [25.6625, 60.3935], falun: [15.63, 60.6], gent: [3.721, 51.055] };
const cell = (title, cityId, left, right) => ({ title, cityId, left, right });
const h = (look, levels, at, extra = {}) => ({ look, info: { levels, point: P[at], ...extra } });
const SHEETS = {
  jih: [
    cell("středomořský dům (Madrid) · pražský činžák", "spain", h("stredomori", 5, "madrid"), h("sikma", 5, "praha")),
    cell("středomořský dům, terasa · taška (Turín)", "italy", h("stredomori", 5, "roma", { roofShape: "flat" }), h("stredomori", 5, "roma", { tint: 2 })),
    cell("portugalský dům s azulejos (Lisabon) ×2", "portugal", h("azulejo", 4, "lisboa", { tint: 1 }), h("azulejo", 4, "lisboa", { tint: 2 })),
    cell("dům s galerií (A Coruña) · maltský dům (Valletta)", "spain", h("galeria", 5, "coruna"), h("malta", 3, "valletta")),
    cell("kyperský dům (Nikósie) ×2", "cyprus", h("kypr", 2, "nicosia", { tint: 0 }), h("kypr", 2, "nicosia", { tint: 2 })),
    cell("haussmannovský dům (Paříž) · pražský činžák", "france", h("haussmann", 7, "paris"), h("sikma", 5, "praha")),
    cell("haussmannovský dům 8 podlaží · Brusel 4 podlaží", "belgium", h("haussmann", 8, "paris"), h("haussmann", 4, "bruxelles")),
  ],
  sever: [
    cell("cihlový dům s římsou (Amsterdam) ×2", "netherlands", h("cihlovy", 4, "amsterdam", { tint: 0 }), h("cihlovy", 4, "amsterdam", { tint: 1, point: [4.8901, 52.3702] })),
    cell("dánský cihlový činžák (Kodaň) · pražský činžák", "cizina", h("dansky", 5, "kobenhavn"), h("sikma", 5, "praha")),
    cell("severský omítaný činžák (Stockholm, Helsinky)", "cizina", h("stenstad", 5, "stockholm", { tint: 0 }), h("stenstad", 6, "helsinki", { tint: 2 })),
  ],
  drevo: [
    cell("tallinnský dům (Kalamaja) ×2", "estonia", h("tallinnamaja", 3, "tallinn", { tint: 0 }), h("tallinnamaja", 2, "tallinn", { tint: 1 })),
    { ...cell("malovaný dřevěný dům, Švédsko (Falun) ×2", "cizina", h("drevak", 2, "falun", { tint: 0 }), h("drevak", 1, "falun", { tint: 3 })), details: nordicDetails("SE") },
    { ...cell("dřevěný městský dům, Finsko (Porvoo) ×2", "cizina", h("puukaupunki", 1, "porvoo", { tint: 1 }), h("puukaupunki", 2, "porvoo", { tint: 4 })), details: nordicDetails("FI") },
    cell("malovaný dřevěný dům (Estonsko) · pražský činžák", "estonia", h("drevak", 2, "tallinn", { tint: 3 }), h("sikma", 5, "praha")),
  ],
};
// The postwar block of flats (evaluation/budovy-povalecny), with a set-back floor; a Haussmann house and a Nordic
// tenement with their mansard floors (the windows in the columns below).
P.wien = [16.37, 48.2]; P.madrid2 = [-3.64, 40.405];
SHEETS.povalecny = [
  cell("poválečný bytový dům (Vídeň) 5 · 8 podlaží", "austria", h("povalecny", 5, "wien", { tint: 0 }), h("povalecny", 8, "wien", { tint: 2 })),
  cell("poválečný dům s ustoupeným podlažím (Madrid)", "spain", h("povalecny", 7, "madrid2", { tint: 1, cornice: 6, roof: 1 }), h("povalecny", 6, "madrid2", { tint: 4 })),
];
SHEETS.mansarda = [
  cell("Haussmann 5 + 2 v mansardě · stenstad 5 + 1", "france", h("haussmann", 7, "paris", { cornice: 5, roof: 2 }), h("stenstad", 6, "stockholm", { cornice: 5, roof: 1 })),
];
// The gables: each form with and without the outline (LOOKS.gables), a Prague tenement beside. The form follows the
// house's place (houseHash): a point near Amsterdam's or Tallinn's centre giving each form.
const { houseHash: hh } = await import("../../pilot/public/house-looks.js");
const pointFor = (base, ok) => { for (let i = 1; i < 500; i++) { const p = [base[0] + i * 0.00001, base[1]]; if (ok(hh({ point: p }))) return p; } };
const AMS = [4.8936, 52.3708], TLL = [24.745, 59.437];
const trap = pointFor(AMS, (x) => x % 3 === 0), hals = pointFor(AMS, (x) => x % 3 === 1), klok = pointFor(AMS, (x) => x % 3 === 2);
const plain = pointFor(TLL, (x) => x % 4 !== 0), step = pointFor(TLL, (x) => x % 4 === 0);
const gab = (title, on, left, right) => ({ ...cell(title, "netherlands", left, right), gables: on });
SHEETS.stity = [
  gab("štít stupňovitý · krkový (?stit=1)", true, h("stit", 4, "amsterdam", { point: trap }), h("stit", 4, "amsterdam", { point: hals })),
  gab("štít zvonový (?stit=1) · pražský činžák", true, h("stit", 4, "amsterdam", { point: klok }), h("sikma", 5, "praha")),
  { ...gab("hanzovní dům hladký · stupňovitý (?stit=1)", true, h("hanza", 3, "tallinn", { point: plain }), h("hanza", 3, "tallinn", { point: step, tint: 1 })), cityId: "estonia" },
  gab("bez obrysu (výchozí): štítová deska a trám", false, h("stit", 4, "amsterdam", { point: trap }), h("hanza", 3, "tallinn", { point: plain })),
];

// The variant for Bára (?stit=2/3): each form drawn whole and symmetric (left) and as the street-side two thirds of a
// wider house cut by the frame (right), a Prague tenement beside.
const FORMS = [["stupňovitý", "stit", trap, "netherlands"], ["krkový", "stit", hals, "netherlands"], ["zvonový", "stit", klok, "netherlands"],
  ["hanzovní hladký", "hanza", plain, "estonia"], ["hanzovní stupňovitý", "hanza", step, "estonia"]];
SHEETS["stity-varianty"] = FORMS.flatMap(([name, look, point, cityId]) => [false, true].map((cut) => ({
  ...gab(`${name} · ${cut ? "2/3 (?stit=2/3)" : "celý, souměrný"}`, true, h(look, look === "hanza" ? 3 : 4, cityId === "estonia" ? "tallinn" : "amsterdam", { point }), h("sikma", 5, "praha")),
  cityId, cut })));
const { houseHash } = await import("../../pilot/public/house-looks.js");
const which = process.argv[2] || "vse";
for (const [name, cells] of Object.entries(SHEETS)) {
  if (which !== "vse" && which !== name) continue;
  const parts = [];
  for (const c of cells) {
    setCity(c.cityId);
    LOOKS.gables = !!c.gables;
    LOOKS.gableCut = !!c.cut;
    // A state without a module yet (Sweden, Finland): its rule's details as its module will set them.
    const own = cityMod.country.houseDetails;
    if (c.details) cityMod.country.houseDetails = c.details;
    const profile = {
      segments: [{ type: "chodnik", width: 4 }, { type: "pruh", width: 3.5, dir: "backward" }, { type: "pruh", width: 3.5, dir: "forward" }, { type: "chodnik", width: 4 }],
      edges: { left: "budova", leftStyle: c.left.look, leftInfo: c.left.info, right: "budova", rightStyle: c.right.look, rightInfo: c.right.info },
    };
    const svg = buildSvg(profile, { signs: false, whole: true });
    cityMod.country.houseDetails = own;
    const [vx, vy, vw, vh] = svg.attrs.viewBox.split(" ").map(Number);
    parts.push({ c, inner: serialize(svg).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, ""), vb: [vx, vy, vw, vh] });
  }
  LOOKS.gables = false;
  LOOKS.gableCut = false;
  const CW = 760, CH = 900, cols = Math.min(parts.length, name.startsWith("stity") ? 2 : 3), rows = Math.ceil(parts.length / cols);
  const W = cols * CW, Hh = rows * CH;
  let body = "";
  parts.forEach(({ c, inner, vb }, i) => {
    const x = (i % cols) * CW, y = Math.floor(i / cols) * CH;
    body += `<g transform="translate(${x} ${y})"><rect x="6" y="6" width="${CW - 12}" height="${CH - 12}" fill="#fbfaf6" stroke="#ddd8cc"/>`
      + `<text x="${CW / 2}" y="40" font-size="24" text-anchor="middle" fill="#333" font-family="Helvetica, Arial">${esc(c.title)}</text>`
      + `<svg x="16" y="56" width="${CW - 32}" height="${CH - 72}" viewBox="${vb.join(" ")}" preserveAspectRatio="xMidYMax meet">${inner}</svg></g>`;
  });
  // Quick Look renders squares only (tools/build_og.mjs): a square sheet, then cropped to the cells.
  const S = Math.max(W, Hh);
  const out = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" fill="#f4f1ea"/>${body}</svg>`;
  const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "budovy-"));
  const svgFile = path.join(tmp, `${name}.svg`);
  fs.writeFileSync(svgFile, out);
  execFileSync("qlmanage", ["-t", "-s", String(S), "-o", tmp, svgFile], { stdio: "ignore" });
  const dest = name === "povalecny" ? path.join(HERE, "..", "budovy-povalecny", "povalecny.png") : path.join(HERE, `${name}.png`);
  execFileSync("magick", [path.join(tmp, `${name}.svg.png`), "-crop", `${W}x${Hh}+0+0`, "+repage", dest]);
  fs.rmSync(tmp, { recursive: true });
  console.log(name, W, Hh);
}
