// Draws the link preview image (Open Graph, 1200 × 630) from the app's own drawing code: a sample
// street profile with the Prague illustrations beside the app's name. Writes an SVG; the PNG the
// page links (pilot/public/og.png) is made from it with any SVG renderer. On a Mac, Quick Look
// renders squares only, so: set the SVG to viewBox="0 -285 1200 1200", then
// qlmanage -t -s 1200 -o . og.svg && sips --cropToHeightWidth 630 1200 og.svg.png --out og.png
//   node tools/build_og.mjs [out.svg] [brno|jihlava|most|…]   (default og.svg in the current folder; the city's card)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "pilot", "public");
const out = process.argv[2] || "og.svg";
const { NAMES, SITES } = await import("./cities.mjs");
const cityId = SITES[process.argv[3]] ? process.argv[3] : "praha";
if (cityId !== "praha") globalThis.PROFILY_CITY = cityId;
// Words of the card per city: name suffix, "…ulic", data line, credit.
const T = cityId === "praha"
  ? { name: "", adj: "pražských", data: "z dat IPR a OSM.", credit: "IPR Praha, OSM" }
  : { name: ` · ${NAMES[cityId]}`, adj: SITES[cityId].adjPl, data: "z dat města a OSM.", credit: `Statutární město ${NAMES[cityId]}, OSM` };

// A tiny DOM, enough for profile.js to build an SVG (elements, attributes, text, children).
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

const { loadSprites, buildSvg } = await import("../pilot/public/profile.js");
await loadSprites();
// A town with trolleybuses and no trams (its illustrations): a bus lane under the trolley wires instead.
const { city } = await import("../pilot/public/city.js");
const trolleyOnly = city.artMap?.["trolleybus-inbound"] && !city.artMap["streetcar-inbound"];
const profile = trolleyOnly ? {
  segments: [
    { type: "chodnik", width: 3.5 }, { type: "stromorad", width: 2 }, { type: "pruh", width: 3.25, dir: "backward" },
    { type: "bus", width: 3.5, dir: "forward", trolley: true }, { type: "parkovani", width: 2, orient: "podelne" },
    { type: "chodnik", width: 3.5, items: [{ kind: "lampa", f: 0.15 }] },
  ],
  edges: { left: "budova", leftInfo: { levels: 4, cornice: 4, roofType: 1, km: 0.5 }, right: "budova", rightInfo: { levels: 3, cornice: 3, roofType: 1, km: 0.6 } },
} : {
  segments: [
    { type: "chodnik", width: 3.5 }, { type: "stromorad", width: 2 }, { type: "cyklopruh", width: 1.75, dir: "backward" },
    { type: "tramvaj_v_pruhu", width: 3.25, dir: "backward" }, { type: "tramvaj_v_pruhu", width: 3.25, dir: "forward" },
    { type: "parkovani", width: 2, orient: "podelne" }, { type: "chodnik", width: 3.5, items: [{ kind: "lampa", f: 0.15 }] },
  ],
  edges: { left: "budova", leftInfo: { levels: 5, cornice: 5, roofType: 1, km: 2 }, right: "budova", rightInfo: { levels: 6, cornice: 5, roof: 1, roofType: 3, km: 3, period: 1950, block: { length: 120, width: 80, fill: 0.45, parts: 12 } } },
};
const svg = buildSvg(profile, {});
const [vx, vy, vw, vh] = svg.attrs.viewBox.split(" ").map(Number);
// The profile fills the right part of the card; the name and a line of text on the left.
const W = 1200, H = 630, CX = 460, CY = 24, CW = 716, CH = 582, scale = Math.min((CW - 12) / vw, (CH - 12) / vh);
const inner = serialize(svg).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, Helvetica, Arial, sans-serif">
<rect width="${W}" height="${H}" fill="#f4f1ea"/>
<defs><clipPath id="card"><rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" rx="18"/></clipPath></defs>
<rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" rx="18" fill="#fbfaf6" stroke="#e2ded4"/>
<g clip-path="url(#card)"><g transform="translate(${CX + (CW - vw * scale) / 2} ${CY + (CH - vh * scale) / 2}) scale(${scale}) translate(${-vx} ${-vy})">${inner}</g></g>
<rect x="56" y="64" width="72" height="72" rx="16" fill="#d8413f"/>
<path d="M69.5 120V91l9-6.8v36M105.5 120V84.3l9 6.7V120M69.5 120h45" stroke="#fff" stroke-width="5.4" fill="none" stroke-linejoin="round"/>
<path d="M83 120v-9h18v9" fill="#fff"/>
<text x="56" y="210" font-size="${T.name ? 44 : 52}" font-weight="700" fill="#1d1d1b" letter-spacing="-1">Profily ulic${T.name}</text>
<text font-size="26" fill="#4f4e49"><tspan x="56" y="262">Příčné profily</tspan><tspan x="56" y="298">${T.adj} ulic</tspan><tspan x="56" y="334">od fasády k fasádě</tspan><tspan x="56" y="370">${T.data}</tspan></text>
<text font-size="22" fill="#6b6a65"><tspan x="56" y="440">Stav, návrh, porovnání</tspan><tspan x="56" y="471">a podíl prostoru ulice.</tspan></text>
<text font-size="15" fill="#8a877e"><tspan x="56" y="566">Ilustrace © Streetmix (CC BY-SA 4.0)</tspan><tspan x="56" y="586">a Bára Soukupová · data © ${T.credit}</tspan></text>
</svg>`;
fs.writeFileSync(out, card);
console.log(`${out}: ${(card.length / 1024).toFixed(0)} kB`);
