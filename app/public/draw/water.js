// Rainwater management (types.js water, HDV_UNDER; Bára after Magdalena, 12. 11. 2026): swales, ponds, trenches, objects under a part.
import { HDV_UNDER, underSize } from "../types.js";
import { num, t as tr } from "../i18n.js";
import { BASE_COURSE, NET_TOP, NET_V } from "./networks.js";
import { DROP, el, GROUND } from "./svg.js";
import { ownSprite, sprite } from "./art.js";

const PAPER = "#fbfaf6", WATER = "#5b93c7", GRAVEL = "#b8b1a2", PEBBLE = "#8e8778";
const RUNOFF = new Set(["chodnik", "chodnik_kola", "stezka_sdilena", "plocha", "parkovani", "pruh", "pruh_piktokoridor", "obsluzna", "krajnice", "bus", "bus_cyklo", "cyklopruh", "ochranny_pruh", "cyklostezka", "nastupiste"]);
function pebbles(g, x, y, w, h, r = 2.5) {
  for (let v = y + 5; v < y + h - 2; v += 9) for (let u = x + 5 + ((v / 9) % 2) * 5; u < x + w - 3; u += 11) el("circle", { cx: u, cy: v, r, fill: PEBBLE }, g);
}
export function drawWaterPart(g, s, x, w, top, before, after) {
  const edge = Math.min(40, w * 0.2);
  if (s.type === "pruleh" || s.type === "nadrz") {
    const depth = s.type === "pruleh" ? 26 : 62;
    // A pond's banks and bottom are earth with grass (its blue is the palette's, for the water).
    if (s.type === "nadrz") el("rect", { x, y: top, width: w, height: GROUND + 60 - top, fill: "#86b46a" }, g);
    // The dip: the air over it in the paper's colour, its bottom a darker band.
    el("path", { d: `M${x} ${top - 1} L${x + w} ${top - 1} L${x + w - edge} ${top + depth} L${x + edge} ${top + depth} Z`, fill: PAPER }, g);
    el("path", { d: `M${x} ${top} L${x + edge} ${top + depth} L${x + w - edge} ${top + depth} L${x + w} ${top}`, fill: "none", stroke: "#5f8f3a", "stroke-width": 5, "stroke-linejoin": "round" }, g);
    if (s.type === "nadrz") {
      const lvl = top + depth * 0.45, k = (lvl - top) / depth; // the water's level, the banks at that height
      el("path", { d: `M${x + edge * k} ${lvl} L${x + w - edge * k} ${lvl} L${x + w - edge} ${top + depth - 2} L${x + edge} ${top + depth - 2} Z`, fill: "#9cc3e4", opacity: 0.9 }, g);
      el("line", { x1: x + edge * k, x2: x + w - edge * k, y1: lvl, y2: lvl, stroke: WATER, "stroke-width": 3 }, g);
    }
    // Perennials and grasses on the bottom (a swale), reeds at the banks (a pond): the city's pictures where it has
    // them (swale-plants about 1 m wide, reeds-left/right), else a few strokes.
    const swale = s.type === "pruleh", pic = swale ? "swale-plants" : null;
    const plants = swale ? Math.max(1, Math.floor((w - 2 * edge) / (ownSprite("swale-plants") ? 110 : 70))) : 2;
    for (let k = 0; k < plants; k++) {
      const px = swale ? x + edge + ((k + 0.5) * (w - 2 * edge)) / plants : k ? x + w - edge * 0.8 : x + edge * 0.8;
      const py = swale ? top + depth : top + depth * 0.5;
      const own = pic || (k ? "reeds-right" : "reeds-left");
      if (ownSprite(own)) { sprite(g, own, px, py); continue; }
      for (const [dx, h, c] of [[-12, 34, "#4f8a35"], [-4, 46, "#3f7a2d"], [5, 40, "#5f9e3a"], [13, 30, "#4f8a35"]]) {
        el("path", { d: `M${px + dx} ${py} q${dx / 3} ${-h / 2} ${dx / 2} ${-h}`, fill: "none", stroke: c, "stroke-width": 3.5, "stroke-linecap": "round" }, g);
      }
      if (s.type === "pruleh" && k % 2 === 0) el("circle", { cx: px + 2, cy: py - 44, r: 5, fill: "#c98bc4" }, g); // a flower
    }
  } else if (s.type === "ryha") {
    // A surface trench: gravel to the top, a little below the edges.
    el("rect", { x, y: top + 4, width: w, height: 56, fill: GRAVEL }, g);
    pebbles(g, x, top + 4, w, 56);
  }
  // The rain running in from the paved parts beside it.
  const arrow = (ax, dir) => el("path", { d: `M${ax - dir * 26} ${top - 26} q${dir * 14} 0 ${dir * 22} 16 m${-dir * 8} -2 l${dir * 8} 2 l2 -8`, fill: "none", stroke: WATER, "stroke-width": 3.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
  // Not from permeable paving: no other water is led onto it, and its own soaks away (5.1.2).
  if (RUNOFF.has(before?.type) && !before.permeable) arrow(x + 6, 1);
  if (RUNOFF.has(after?.type) && !after.permeable) arrow(x + w - 6, -1);
}
// A rainwater object under a part (segment.under): in the earth below the street at its size and depth (types.js
// underSize; Bára: to see it with the networks), on the same scale and from the same depth 0 as the networks
// (drawNetworks), centred under the part.
export function drawUnder(g, s, x, w) {
  const z = underSize(s), zero = NET_TOP + BASE_COURSE, base = GROUND + 104 + DROP;
  const bw = Math.min(w - 8, z.w * 100), bx = x + (w - bw) / 2;
  const y0 = zero + z.top * NET_V, y1 = Math.min(base - 4, y0 + z.h * NET_V);
  const box = el("g", {}, g);
  el("title", {}, box).textContent = tr("profile.nameWHM", { name: HDV_UNDER[s.under].label, w: num(z.w), h: num(z.h), from: num(z.top), to: num(+(z.top + z.h).toFixed(2)) });
  if (s.under === "sachta") {
    el("rect", { x: bx, y: y0, width: bw, height: y1 - y0, fill: "#d9d4c8", stroke: "#7d776b", "stroke-width": 2 }, box);
    for (let v = y0 + 20; v < y1 - 10; v += 22) el("line", { x1: bx, x2: bx + bw, y1: v, y2: v, stroke: "#7d776b", "stroke-width": 1.5 }, box);
    el("rect", { x: bx + 3, y: y1 - 24, width: bw - 6, height: 21, fill: "#9cc3e4" }, box);
  } else if (s.under === "ryha") {
    el("rect", { x: bx, y: y0, width: bw, height: y1 - y0, fill: GRAVEL, stroke: "#7d776b", "stroke-width": 2, "stroke-dasharray": "8 5" }, box);
    pebbles(box, bx, y0, bw, y1 - y0, 2);
  } else if (s.under === "nadrz") {
    el("rect", { x: bx, y: y0, width: bw, height: y1 - y0, rx: 10, fill: "#cfe2f1", stroke: "#4a7fae", "stroke-width": 3 }, box);
    const lvl = y0 + (y1 - y0) * 0.45;
    el("path", { d: `M${bx + 6} ${lvl} q${bw / 8} -6 ${bw / 4} 0 t${bw / 4} 0 t${bw / 4} 0 t${bw / 4 - 12} 0`, fill: "none", stroke: WATER, "stroke-width": 2.5 }, box);
    el("rect", { x: bx + 3, y: lvl + 3, width: bw - 6, height: y1 - lvl - 6, rx: 7, fill: "#9cc3e4", opacity: 0.7 }, box);
  }
}

// How deep the rainwater objects under a profile's parts reach (m), 0 without any.
export const underDepth = (p) => Math.max(0, ...p.segments.filter((s) => s.under).map((s) => { const z = underSize(s); return z ? z.top + z.h : 0; }));
