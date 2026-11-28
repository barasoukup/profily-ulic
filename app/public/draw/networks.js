// The networks under the street, at their real depth and size.
import { num, t as tr } from "../i18n.js";
import { DROP, EDGE, el, GROUND } from "./svg.js";

// The networks right under the street, at their real depth and size (a trial, Bára; the look proposed and criticised
// with Fable): the depth counts from the bottom of the drawn roadway (schematically, NET_TOP), under a thin base
// course; one light earth runs under the whole picture, the edges' foundations over it; pipes are hollow, cables
// full, each with a light halo and a dark rim so it shows on the earth; a depth missing in the data is a dashed ring
// at the kind's usual depth. The rows of labels move down by DROP; the legend in one column under the right edge.
export const NET_V = 100;
export const NET_TOP = GROUND + 60;
export const BASE_COURSE = 12;
const LEGEND_ROW = 38; // drawing units per metre of depth, as across
const SOIL = "#e4d6bf", NET_ORDER = ["slaboproud", "silnoproud", "plynovod", "teplovod", "vodovod", "kanalizace", "jine"];
const lighten = (hex, k) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) + (251 - parseInt(hex.slice(i, i + 2), 16)) * k).toString(16).padStart(2, "0")).join("");
const netEntries = (items, kinds) => [
  ...NET_ORDER.filter((kind) => items.some((i) => i.kind === kind)).map((kind) => ({ k: kinds[kind] || kinds.jine })),
  ...(items.some((i) => !i.measured) ? [{ empty: true, k: { label: tr("profile.depthUnknown"), color: "#6b6a65" } }] : []),
];
export function undergroundDrop(items, kinds, objects = 0) {
  // The networks to 4 m at most (deeper ones sit at the bottom); a rainwater object to its bottom (editor: 10 m).
  const deepest = Math.max(Math.min(4, Math.max(items.length ? 2 : 1, ...items.map((i) => i.depth + 0.2))), objects + 0.2);
  const depth = BASE_COURSE + (deepest + 0.15) * NET_V + 40, legend = 30 + netEntries(items, kinds).length * LEGEND_ROW;
  return Math.max(0, NET_TOP + Math.max(depth, legend) - (GROUND + 104));
}
export function drawNetworks(svg, { items, span, kinds }, total) {
  // At their place in metres from A (a design keeps the street's places: holes, Bára), not stretched.
  const x = (t) => (span.left - t) * 100;
  const g = el("g", { class: "networks" }, svg), base = GROUND + 104 + DROP, zero = NET_TOP + BASE_COURSE; // the sources' strips sit on its bottom
  // The earth: under the whole picture below the edges' foundations, under the street from the roadway down.
  el("rect", { x: -EDGE, y: GROUND + 100, width: total + 2 * EDGE, height: base - GROUND - 100, fill: SOIL }, g);
  el("rect", { x: 0, y: NET_TOP, width: total, height: GROUND + 100 - NET_TOP, fill: SOIL }, g);
  el("rect", { x: 0, y: NET_TOP, width: total, height: BASE_COURSE, fill: "#b9a384" }, g);
  el("line", { x1: 0, x2: total, y1: zero, y2: zero, stroke: "#a8906e", "stroke-width": 1.5 }, g);
  // Every metre: a dashed line, labelled at both ends (and in the middle of a wide street).
  for (let m = 1; zero + m * NET_V < base - 10; m++) {
    const y = zero + m * NET_V, at = [[10, "start"], [total - 10, "end"]];
    for (let mx = 1500; mx < total - 500; mx += 1500) at.push([mx, "middle"]); // and every 15 m
    el("line", { x1: 0, x2: total, y1: y, y2: y, stroke: "#c9b696", "stroke-width": 1.5, "stroke-dasharray": "6 6" }, g);
    for (const [lx, anchor] of at) el("text", { x: lx, y: y - 6, "text-anchor": anchor, "font-size": 24, fill: "#6b5a44" }, g).textContent = `${m} m`;
  }
  for (const it of items) {
    const cx = x(it.t);
    if (cx < -EDGE || cx > total + EDGE) continue;
    const k = kinds[it.kind] || kinds.jine, dn = it.profil > 20 && it.profil < 3000 ? it.profil : k.dn, r = Math.max(8, dn / 20);
    const cy = Math.min(base - r - 4, zero + it.depth * NET_V + r), n = el("g", {}, g);
    n.dataset.tip = `${k.label}${it.profil > 20 ? ` DN ${it.profil}` : ""} · ${it.measured ? tr("profile.depthDM", { d: num(it.depth) }) : tr("profile.depthUnknownUsuallyD", { d: num(it.depth) })}${it.lines > 1 ? ` ${tr("profile.nSideData", { n: it.lines })}` : ""}\n${it.popis}`;
    el("circle", { cx, cy, r: Math.max(r, 24), fill: "transparent" }, n); // a target big enough for the tooltip
    if (it.measured) {
      el("circle", { cx, cy, r: r + 6, fill: "#fbfaf6", opacity: 0.55 }, n);
      el("circle", { class: "net", cx, cy, r, fill: k.color, stroke: "#2a2622", "stroke-opacity": 0.35, "stroke-width": 2 }, n);
      if (r >= 12) el("circle", { cx, cy, r: r - 4, fill: lighten(k.color, 0.55) }, n); // a pipe is hollow, a cable full
    } else {
      el("circle", { class: "net", cx, cy, r, fill: k.color, "fill-opacity": 0.35, stroke: k.color, "stroke-width": 3, "stroke-dasharray": "4 3" }, n);
    }
  }
  // The legend: one column under the right edge, a panel as wide as the edge and flush with the depth-0 line (Bára:
  // not floating), the kinds in their usual order from the top.
  const entries = netEntries(items, kinds);
  if (!entries.length) return; // the earth for a rainwater object alone
  el("rect", { x: total, y: zero, width: EDGE, height: entries.length * LEGEND_ROW + 20, fill: "#fbfaf6", stroke: "#e2ded4", "stroke-width": 1.5 }, g);
  entries.forEach((e, i) => {
    const lx = total + 16, ly = zero + 10 + (i + 0.5) * LEGEND_ROW;
    if (e.empty) el("circle", { cx: lx + 22, cy: ly, r: 11, fill: "#6b6a65", "fill-opacity": 0.35, stroke: e.k.color, "stroke-width": 3, "stroke-dasharray": "4 3" }, g);
    else el("circle", { cx: lx + 22, cy: ly, r: 11, fill: e.k.color, stroke: "#2a2622", "stroke-opacity": 0.35, "stroke-width": 2 }, g);
    el("text", { x: lx + 44, y: ly + 9, "font-size": 26, fill: "#4f4e49" }, g).textContent = e.k.label;
  });
}
