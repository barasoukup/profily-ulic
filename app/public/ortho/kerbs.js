import { strongLines } from "../lanes-ortho.js";
import { limits } from "./road-tags.js";
import { columns, usable } from "./columns.js";
import { median } from "./osm-along.js";
import { P } from "./settings.js";

export function roadRef(cols, axis) {
  const i0 = cols.ti(axis - 1.5), i1 = cols.ti(axis + 1.5), L = [], S = [];
  for (let i = Math.max(0, i0); i <= Math.min(cols.nt - 1, i1); i++) if (cols.green[i] < 0.3) { L.push(cols.medL[i]); S.push(cols.sat[i]); }
  return { L: median(L), S: median(S) };
}
export const roadLike = (cols, ref, i) => cols.green[i] < P.greenMax && Math.abs(cols.medL[i] - ref.L) <= Math.max(14, P.tolL * ref.L) && Math.abs(cols.sat[i] - ref.S) <= P.tolS;
// ---------- the kerbs (M2) ----------
// Candidates: local maxima of the edge strength (≥ minEdge) between 1 m from the axis and the limits, and a kerb lineOff
// beyond each strong line near where OSM expects the kerb (the edge line, V 4). Score: the edge (saturating) + alpha ×
// the share of road-like columns between the axis and it − gamma × that share in the metre beyond it − beta ×
// ((distance − expected) / sigma)²; expected = OSM's reach on that side. Returns { A, B, why: { A, B } } or null.
// edges: where the lines of a town's technical map (an edge of a kerb, of a sidewalk; towns/slovakia.js) cross the
// cut: each is a candidate too, mapBonus better than an edge of the image alone.
export function kerbs(cols, axis, lim, road, lines = [], edges = []) {
  const ref = roadRef(cols, axis), out = {}, why = {};
  if (!Number.isFinite(ref.L)) return null;
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const exp = road.reach[side], sigma = Math.max(P.sigmaMin, P.sigmaRel * exp);
    const lo = sg < 0 ? Math.max(lim.A, cols.t0 + 0.3) : axis + 1, hi = sg < 0 ? axis - 1 : Math.min(lim.B, cols.t0 + cols.nt * cols.res - 0.3);
    const cand = [], w = Math.round(0.3 / cols.res);
    for (let i = Math.max(1, cols.ti(lo)); i <= Math.min(cols.E.length - 2, cols.ti(hi)); i++) {
      if (cols.E[i] < P.minEdge) continue;
      let top = true;
      for (let q = i - w; q <= i + w; q++) if (q !== i && cols.E[q] > cols.E[i]) { top = false; break; }
      if (top) cand.push({ i, from: "hrana" });
    }
    for (const l of lines) {
      const t = l + sg * P.lineOff;
      if ((sg < 0 ? l < axis : l > axis) && t > lo && t < hi && Math.abs(Math.abs(t - axis) - exp) < 2.5 * sigma) cand.push({ i: cols.ti(t), from: "čára" });
    }
    for (const t of edges) if (t > lo && t < hi && Math.abs(Math.abs(t - axis) - exp) < 2.5 * sigma) cand.push({ i: cols.ti(t), from: "mapa" });
    // Not at the edge of what the image shows (within 0.6 m of a column not seen).
    const near = Math.round(0.6 / cols.res), atEdge = (i) => { for (let q = i - near; q <= i + near; q++) if (q < 0 || q >= cols.nt || cols.seen[q] < 0.5) return true; return false; };
    let best = null;
    for (const c of cand) {
      if (atEdge(c.i)) continue;
      const ia = cols.ti(axis), span = sg < 0 ? [c.i, ia] : [ia, c.i];
      let n = 0, ok = 0;
      for (let q = span[0]; q < span[1]; q++) { if (q < 0 || q >= cols.nt || cols.seen[q] < 0.5) continue; n++; if (roadLike(cols, ref, q)) ok++; }
      let nb = 0, okb = 0;
      for (let k = 1; k <= Math.round(1 / cols.res); k++) { const q = sg < 0 ? c.i - k : c.i + k - 1; if (q < 0 || q >= cols.nt || cols.seen[q] < 0.5) continue; nb++; if (roadLike(cols, ref, q)) okb++; }
      const dist = Math.abs(cols.tOf(c.i) - axis), e = Math.min(cols.E[c.i] ?? 0, 12);
      const score = e / (e + 3) + P.alpha * (n ? ok / n : 0) - P.gamma * (nb ? okb / nb : 0) - P.beta * ((dist - exp) / sigma) ** 2 + (c.from === "mapa" ? P.mapBonus : 0);
      if (!best || score > best.score) best = { score, t: cols.tOf(c.i), from: c.from };
    }
    // No candidate at all: OSM's expectation.
    out[side] = best ? best.t : sg < 0 ? Math.max(lim.A + 0.5, axis - exp) : Math.min(lim.B - 0.5, axis + exp);
    why[side] = best ? best.from : "osm";
  }
  out.why = why;
  return out;
}
// Kerbs on the image st (laneImage's), for the street o (osmAlong) and its road (osmRoad, withRails). Without a usable
// image, or when the roadway at the axis cannot be seen (treetops over it): where OSM expects them (why "osm", image
// false). mapRuns: the surface map's runs along the cut where it has some but none at the axis (derive.js runs): its
// sidewalks and buildings bound the kerbs, the estimate does not cover what the map measured.
const MAP_BOUND = (c) => c === 702 || c === 703 || c === 600 || c === 601 || c === 604;
export function kerbsOnImage(st, o, road, mapRuns = [], edges = []) {
  const axis = o.own.t, lim = limits(o, axis);
  for (const r of mapRuns) {
    if (!MAP_BOUND(r.code)) continue;
    if (r.e <= axis && r.e > lim.A) lim.A = r.e;
    if (r.s >= axis && r.s < lim.B) lim.B = r.s;
  }
  const byOsm = { A: Math.max(lim.A + 0.5, axis - road.reach.A), B: Math.min(lim.B - 0.5, axis + road.reach.B), why: { A: "osm", B: "osm" }, lim, cols: null, image: false };
  // Without the image a line of the map near where OSM expects the kerb (within 2 m) is the kerb.
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const exp = road.reach[side], near = edges.filter((t) => sg * (t - axis) > 1 && (sg < 0 ? t > lim.A : t < lim.B) && Math.abs(Math.abs(t - axis) - exp) < 2)
      .sort((x, y) => Math.abs(Math.abs(x - axis) - exp) - Math.abs(Math.abs(y - axis) - exp));
    if (near.length) { byOsm[side] = near[0]; byOsm.why[side] = "mapa"; }
  }
  if (!usable(st)) return byOsm;
  const end = st.t0 + st.nt * st.res;
  const lo = Math.max(lim.A, st.t0 + 0.5), hi = Math.min(lim.B, end - 0.5);
  const lines = hi - lo > 4 ? strongLines(st, lo + 1.5, hi - 1.5) : [];
  const cols = columns(st);
  const k = kerbs(cols, axis, lim, road, lines, edges);
  if (!k) return { ...byOsm, cols };
  return { ...k, lim, cols, image: k.why.A !== "osm" || k.why.B !== "osm" };
}
