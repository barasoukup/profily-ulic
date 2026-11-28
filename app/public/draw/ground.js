// The surface of the ground under a part: permeable paving, a tram bed, a railway.
import { TRAM_BEDS } from "../types.js";
import { CURB, el, GROUND } from "./svg.js";

// Permeable paving (segment.permeable, 5.1.2) and unpaved surfaces: no concrete slab under them (Bára), but a gravel
// bed down to the earth; grass pavers as concrete blocks with grass between them (at first sight something between
// parking and a lawn), an unpaved surface gravel all through.
const GRAVEL_BED = "#cdbf9f";
const GRAVEL_DOT = "#8e8170";
export const TOPSOIL = "#7a5f43";
export const SOIL_PARTS = new Set(["zelen", "stromorad", "predzahradka", "pruleh"]);
export function drawPermeable(g, x, w, top, unpaved) {
  el("rect", { x, y: top, width: w, height: GROUND + 60 - top, fill: GRAVEL_BED }, g);
  for (let v = top + (unpaved ? 5 : 32); v < GROUND + 56; v += 8) {
    for (let u = x + 4 + ((v / 8) % 2) * 4; u < x + w - 3; u += 9) el("circle", { cx: u, cy: v, r: unpaved ? 1.8 : 2.2, fill: GRAVEL_DOT }, g);
  }
  if (unpaved) return;
  el("rect", { x, y: top, width: w, height: 26, fill: "#7fae55" }, g);
  for (let u = x + 4; u < x + w - 12; u += 24) {
    el("rect", { x: u, y: top + 2, width: 14, height: 24, fill: "#b9b5ab", stroke: "#9a968b", "stroke-width": 1.5 }, g);
    el("path", { d: `M${u + 17} ${top + 1} l2 -7 l2 7 M${u + 20} ${top + 1} l2 -5 l1 5`, fill: "#5f9e3a", stroke: "#5f9e3a", "stroke-width": 1.5 }, g);
  }
}

// Street furniture and barriers standing at x on a surface at height top.
// The surface of a separate tram bed, raised behind curbs (Bára): concrete panels with their joints, gravel
// with the sleepers showing, grass, or asphalt like the roadway (beds used by buses). A curb stone at each end where the bed meets another part.
export function drawTramBed(g, s, x, w, top, bedBefore, bedAfter) {
  const kind = TRAM_BEDS[s.bed] ? s.bed : "panely";
  el("rect", { x, y: top, width: w, height: 14, fill: TRAM_BEDS[kind].color }, g);
  if (kind === "panely") {
    for (let u = x + 60; u < x + w - 20; u += 120) el("rect", { x: u, y: top, width: 2, height: 14, fill: "#8d887c" }, g);
  } else if (kind === "strk") {
    // A gravel bed all the way down (Bára: no concrete under it).
    el("rect", { x, y: top + 14, width: w, height: GROUND + 60 - top - 14, fill: GRAVEL_BED }, g);
    for (let v = top + 20; v < GROUND + 56; v += 8) {
      for (let u = x + 4 + ((v / 8) % 2) * 4; u < x + w - 3; u += 9) el("circle", { cx: u, cy: v, r: 2, fill: GRAVEL_DOT }, g);
    }
    for (let u = x + 8; u < x + w - 4; u += 14) el("circle", { cx: u, cy: top + 4 + ((u / 14) % 2) * 5, r: 2.5, fill: "#6f6a61" }, g);
    for (let u = x + 30; u < x + w - 30; u += 60) el("rect", { x: u, y: top - 2, width: 26, height: 5, fill: "#5d5247" }, g);
  } else if (kind === "trava") {
    // A green track: no concrete under the grass (Bára, as under permeable paving): topsoil, then a gravel bed with
    // the sleepers in it, down to the earth.
    el("rect", { x, y: top + 14, width: w, height: 22, fill: TOPSOIL }, g);
    el("rect", { x, y: top + 36, width: w, height: GROUND + 60 - top - 36, fill: GRAVEL_BED }, g);
    for (let v = top + 42; v < GROUND + 56; v += 8) {
      for (let u = x + 4 + ((v / 8) % 2) * 4; u < x + w - 3; u += 9) el("circle", { cx: u, cy: v, r: 2, fill: GRAVEL_DOT }, g);
    }
    for (let u = x + 30; u < x + w - 30; u += 60) el("rect", { x: u, y: top + 30, width: 26, height: 10, fill: "#8d887c" }, g);
    for (let u = x + 5; u < x + w - 3; u += 9) el("path", { d: `M${u} ${top + 2} l3 -9 l3 9`, fill: "#5f9e3a" }, g);
  }
  const curb = (cx) => el("rect", { x: cx, y: top, width: 12, height: CURB + 8, fill: "#c9c5ba", stroke: "#8d887c", "stroke-width": 1 }, g);
  if (!bedBefore) curb(x);
  if (!bedAfter) curb(x + w - 12);
}

// A railway beside the street (types.js railway; Bára 27. 11. 2026): a gravel bed all the way down with a track in each
// stretch of 4 m of it (3 m for a narrow gauge), a pair of rails on sleepers at 1435 mm (1000 mm). No vehicle, no wires.
export const railTracks = (s) => { const [bed, step] = s.narrow ? [3.5, 3] : [4.5, 4]; return Math.max(1, Math.round((s.width - (bed - step)) / step)); };
export function drawRailway(g, s, x, w, top) {
  el("rect", { x, y: top, width: w, height: GROUND + 60 - top, fill: GRAVEL_BED }, g);
  for (let v = top + 6; v < GROUND + 56; v += 8) {
    for (let u = x + 4 + ((v / 8) % 2) * 4; u < x + w - 3; u += 9) el("circle", { cx: u, cy: v, r: 2, fill: GRAVEL_DOT }, g);
  }
  const n = railTracks(s), step = w / n, half = s.narrow ? 50 : 72;
  for (let k = 0; k < n; k++) {
    const c = x + step * (k + 0.5), sleeper = Math.min(s.narrow ? 200 : 260, step - 10);
    for (let u = c - step / 2 + 20; u < c + step / 2 - 20; u += 60) el("rect", { x: u, y: top - 3, width: 24, height: 5, fill: "#6d5d4c" }, g);
    el("rect", { x: c - sleeper / 2, y: top - 1, width: sleeper, height: 3, fill: "#6d5d4c" }, g);
    for (const dx of [-half, half]) el("rect", { x: c + dx - 4, y: top - 14, width: 8, height: 14, fill: "#3d3b36" }, g);
  }
}
