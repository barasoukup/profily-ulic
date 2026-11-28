// The overhead lines of the trams and trolleybuses: the tram with its pantograph, span wires, trolley wires.
import { TYPES } from "../types.js";
import { artKey, CITY_ART, cityArt, sprites } from "./art.js";
import { CURB, el, GROUND, nextClip } from "./svg.js";

// The lanes the contact wires hang over: one each way (Bára, Olomoucká: not over every lane), the trolleybus's own
// (a bus lane under the wires) where there is one, else the outer lane of that direction, the farthest from the
// middle of the wired street; a lane both ways keeps its wires.
export function wiredLanes(segs, bounds) {
  const all = segs.map((s, i) => (s.wires ? i : -1)).filter((i) => i >= 0);
  if (!all.length) return all;
  const mid = (bounds[all[0]] + bounds[all.at(-1) + 1]) / 2, off = (i) => Math.abs((bounds[i] + bounds[i + 1]) / 2 - mid);
  const keep = new Set(all.filter((i) => !segs[i].dir));
  for (const dir of ["forward", "backward"]) {
    const way = all.filter((i) => segs[i].dir === dir);
    if (!way.length) continue;
    const own = way.filter((i) => segs[i].trolley);
    for (const i of own.length ? own : [way.reduce((b, i) => (off(i) > off(b) ? i : b))]) keep.add(i);
  }
  return all.filter((i) => keep.has(i));
}

export const POLE_SCALE = 0.93; // overhead-line poles: their contact wire (5.9 m in the picture) at WIRE_H
// A span wire (spanPlan) from a pole across the tracks to its other end, with an insulator by each end and a hanger
// down to the contact wire over each track (as the poles' brackets); on a building, a wall rosette.
export function spanWire(g, { x, y, end, xs }) {
  const yWire = GROUND - WIRE_H, sg = el("g", { class: "span-wire" }, g), dir = Math.sign(end.x - x);
  const yAt = (cx) => y + ((end.y - y) * (cx - x)) / (end.x - x || 1);
  el("line", { x1: x, y1: y, x2: end.x, y2: end.y, stroke: "#94989a", "stroke-width": 3 }, sg);
  for (const [ix, d] of [[x, dir], ...(end.kind === "free" ? [] : [[end.x, -dir]])]) {
    el("rect", { x: ix + d * 40 - 6, y: yAt(ix + d * 40) - 6, width: 13, height: 13, rx: 2, fill: "#6b4a36" }, sg);
  }
  if (end.kind === "wall") el("circle", { cx: end.x, cy: end.y, r: 9, fill: "#727678", stroke: "#55595b", "stroke-width": 2 }, sg);
  for (const cx of xs) {
    el("line", { x1: cx, x2: cx, y1: yAt(cx), y2: yWire, stroke: "#55595b", "stroke-width": 2.5 }, sg);
    el("circle", { cx, cy: yWire + 2, r: 3.4, fill: "#2f3234" }, sg);
  }
}

// A tram with its pantograph raised to the contact wire (WIRE_H, as the trolleybuses' wires; Bára): the picture is
// drawn up to its roof (PANTO_CUT of the 420 high picture), its own lowered pantograph left out, and the pantograph
// is drawn from the roof to the wire, seen from the front and so symmetric (Bára), 1 px = 1 cm, after photos of the
// trams themselves (scratchpad sberace-1): the head 1.95 m wide with its two contact strips and the horns bent down.
export const WIRE_H = 550;
const PANTO_CUT = 92;
// Trams with the older diamond pantograph (art folder/file, checked on photos): Prague's T3R.P. Brno's T3R.PV and
// T3R.EV carry a single-arm one today (photos of 1560, 1603, 1658), as the low-floor trams do.
const DIAMOND = new Set(["praha/t3-inbound", "praha/t3-outbound"]);
// The frame's paint by city: yellow on the trams of Prague, Brno, Plzeň, Ostrava, Olomouc and Liberec; the Most EVO2
// and Streetmix's streetcar have a dark one.
const PANTO_YELLOW = new Set(["praha", "brno", "plzen", "ostrava", "olomouc", "liberec"]);

export function tramSprite(g, name, cx, bottom) {
  const s = (cityArt() && sprites[`${artKey()}/${CITY_ART[artKey()]?.[name]}`]) || sprites[name];
  if (!s) return;
  const k = s.h / 420, x = cx - s.w / 2, y = bottom - s.h, roof = y + (s.roof ?? PANTO_CUT * k + 6);
  const head = bottom - WIRE_H, id = `pc${nextClip()}`;
  el("rect", { x, y: roof - 8, width: s.w, height: bottom - roof + 8 }, el("clipPath", { id }, el("defs", {}, g)));
  const ink = "#2a2c2e", rise = roof - head, base = roof - 8;
  const yellow = PANTO_YELLOW.has(artKey());
  const col = yellow ? "#e3b324" : "#44474a", edge = yellow ? "#a37f10" : "#1f2123";
  const p = el("g", { stroke: col, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
  const diamond = DIAMOND.has(`${artKey()}/${CITY_ART[artKey()]?.[name] || name}`);
  // The base frame on the roof, on its insulators (four under a diamond, two under a single arm).
  const bw = diamond ? 64 : 40;
  for (const dx of diamond ? [-52, -22, 22, 52] : [-28, 28]) el("rect", { x: cx + dx - 3, y: roof - 13, width: 6, height: 7, rx: 1.5, fill: "#8d8f8c", stroke: "none" }, p);
  el("rect", { x: cx - bw, y: roof - 8, width: 2 * bw, height: 6, rx: 2, fill: ink, stroke: "none" }, p);
  if (diamond) {
    // The diamond (Prague T3R.P) seen from the front is a rectangle (Bára's photos, T3 7232): two upright parallel
    // posts about 1.15 m apart from the base frame to the head, a thin cross between them.
    const w = 58, top = head + 12;
    el("path", { d: `M${cx - w} ${base} V${top} M${cx + w} ${base} V${top}`, "stroke-width": 3 }, p);
    // The cross only in the upper half (Bára).
    const mid = (base + top) / 2;
    el("path", { d: `M${cx - w} ${mid} L${cx + w} ${top} M${cx + w} ${mid} L${cx - w} ${top}`, "stroke-width": 1.5 }, p);
  } else {
    // A single-arm pantograph (Škoda, EVO, Stadler, the modernised T3s): from the front the lower arm is one thick
    // column up to the knee, the upper arm a narrow V opening to the head, with the thin rocker rods crossing it.
    const knee = roof - rise * 0.5;
    el("path", { d: `M${cx - 9} ${base} L${cx - 6} ${knee} H${cx + 6} L${cx + 9} ${base} Z`, fill: col, stroke: edge, "stroke-width": 1 }, p);
    el("rect", { x: cx - 19, y: knee - 4, width: 38, height: 8, rx: 3, fill: col, stroke: edge, "stroke-width": 1 }, p);
    el("path", { d: `M${cx - 15} ${knee} L${cx - 44} ${head + 14} M${cx + 15} ${knee} L${cx + 44} ${head + 14}`, "stroke-width": 4.5 }, p);
    el("path", { d: `M${cx - 36} ${head + 10} L${cx + 12} ${knee - 4} M${cx + 36} ${head + 10} L${cx - 12} ${knee - 4}`, stroke: ink, "stroke-width": 1.2 }, p);
    el("path", { d: `M${cx - 44} ${head + 14} L${cx - 56} ${head + 8} M${cx + 44} ${head + 14} L${cx + 56} ${head + 8}`, stroke: ink, "stroke-width": 2.5 }, p);
  }
  // The head: the bow with its horns bent down (1.95 m wide; the T3's about 1.6 m, its ends bent down a little),
  // the two contact strips on it touching the wire.
  if (diamond) el("path", { d: `M${cx - 82} ${head + 15} L${cx - 76} ${head + 8} H${cx + 76} L${cx + 82} ${head + 15}`, stroke: ink, "stroke-width": 4 }, p);
  else el("path", { d: `M${cx - 97} ${head + 32} Q${cx - 95} ${head + 12} ${cx - 80} ${head + 9} H${cx + 80} Q${cx + 95} ${head + 12} ${cx + 97} ${head + 32}`, stroke: ink, "stroke-width": 4.5 }, p);
  el("rect", { x: cx - 62, y: head, width: 124, height: 3.5, rx: 1, fill: ink, stroke: "none" }, p);
  el("rect", { x: cx - 62, y: head + 5, width: 124, height: 2.5, rx: 1, fill: "#6b6e6a", stroke: "none" }, p);
  el("image", { href: s.uri, width: s.w, height: s.h, x, y, "clip-path": `url(#${id})` }, g);
}

// Span wires across the street (Bára, 17. listopadu): a traction pole whose bracket would not reach a track
// (further than BRACKET_REACH from the nearest one) holds a span wire over the nearest run of tram parts to the
// other side: to the nearest pole beyond them (before the next run), else to the building at that edge when its
// facade reaches the wire (walls: the facades' heights, cm), else ending at the run's edge; not over tracks held by
// poles between them (Olšanská). One wire a side of a run: the pole nearest to it holds it, the further ones stand
// without a bracket (Fable). The wire hangs a contact wire over every track it crosses. It follows the profile's
// poles and edges, so adding a pole or changing an edge in Návrh changes it.
// free: the poles drawn without a bracket ("part:item" → on the right of the tracks); wires: what spanWire draws.
// The wire level at both ends (Bára: not slanting): where the poles' brackets are, above a sidewalk.
const BRACKET_REACH = 400, SPAN_Y = GROUND - CURB - 640 * POLE_SCALE;
export function spanPlan(segs, edges, total, walls = {}) {
  const at = [];
  let a = 0;
  for (const s of segs) { at.push(a); a += s.width * 100; }
  const poles = [], runs = [];
  segs.forEach((s, i) => (s.items || []).forEach((it, k) => {
    if (it.kind === "sloup_trakce" && !it.center && !TYPES[s.type]?.tracks) poles.push({ key: `${i}:${k}`, x: at[i] + it.f * s.width * 100 });
  }));
  segs.forEach((s, j) => {
    if (!TYPES[s.type]?.tracks) return;
    const mid = at[j] + s.width * 50, last = runs.at(-1);
    const held = (s.items || []).some((it) => it.kind === "sloup_trakce" && it.center);
    if (last && last.j === j - 1) { Object.assign(last, { j, x1: at[j] + s.width * 100 }).xs.push(mid); last.held ||= held; }
    else runs.push({ j, x0: at[j], x1: at[j] + s.width * 100, xs: [mid], held });
  });
  const dist = (r, x) => Math.min(...r.xs.map((m) => Math.abs(m - x)));
  const nearest = (x) => [...runs].sort((q, r) => dist(q, x) - dist(r, x))[0];
  const free = new Map(), wires = [], sides = new Set(), used = new Set();
  // The poles nearest to their tracks first, so they hold the wires.
  const plan = poles.map((p) => ({ p, run: nearest(p.x) })).filter((q) => q.run).sort((q, r) => dist(q.run, q.p.x) - dist(r.run, r.p.x));
  for (const { p, run } of plan) {
    if (used.has(p.key) || dist(run, p.x) <= BRACKET_REACH) continue;
    const right = p.x > run.x1, n = runs.indexOf(run);
    free.set(p.key, right);
    if (run.held || sides.has(`${n}:${right}`)) continue;
    sides.add(`${n}:${right}`);
    // Across: a pole beyond the run, before the next run of tracks on that side, the nearest to the run.
    const next = runs[right ? n - 1 : n + 1], edge = right ? run.x0 : run.x1;
    const across = poles.filter((q) => !used.has(q.key) && (right ? q.x < run.x0 && (!next || q.x > next.x1) : q.x > run.x1 && (!next || q.x < next.x0)))
      .sort((q, r) => Math.abs(q.x - edge) - Math.abs(r.x - edge))[0];
    const wallSide = right ? "left" : "right";
    let end;
    if (across) {
      end = { x: across.x, y: SPAN_Y, kind: "pole" };
      used.add(across.key);
      sides.add(`${n}:${!right}`);
      free.set(across.key, !right); // its bracket gives way to the wire (Fable: both over one track)
    } else if (edges?.[wallSide] === "budova" && (walls[wallSide] || 0) >= GROUND - SPAN_Y + 40) end = { x: right ? 0 : total, y: SPAN_Y, kind: "wall" };
    else end = { x: edge, y: SPAN_Y, kind: "free" };
    // A contact wire over every track the span crosses (two runs under one wire, Fable).
    const lo = Math.min(p.x, end.x), hi = Math.max(p.x, end.x);
    wires.push({ x: p.x, y: SPAN_Y, end, xs: runs.filter((r) => !r.held).flatMap((r) => r.xs).filter((m) => m > lo && m < hi) });
  }
  return { free, wires };
}
