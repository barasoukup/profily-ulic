// The methods of the experiment (REPORT.md): where the carriageway's kerbs are, from OSM alone (M0), from the
// orthophoto alone (M1), and from both (M2, the app's own: app/public/ortho-osm.js kerbs); then the sidewalks between
// the kerbs and the OSM facades.
import { median, mean } from "./lib.mjs";
import { brightMap, laneLines, strongLines } from "../../app/public/lanes-ortho.js";
import { osmRoad, withRails, limits, columns, roadRef, roadLike, kerbs as m2, KERB_SCORE as P, laneWidth } from "../../app/public/ortho-osm.js";
export { osmRoad, withRails, limits, columns, m2, P, laneWidth, strongLines };
// M1's own: how long a stretch that does not look like the road ends it, and how far the end snaps to an edge.
Object.assign(P, { stopRun: 0.8, snap: 0.4 });

// ---------- M0: OSM and the rules ----------
export function m0(o, road) {
  const axis = o.own.t;
  const lim = limits(o, axis);
  return { A: Math.max(lim.A + 0.5, axis - road.reach.A), B: Math.min(lim.B - 0.5, axis + road.reach.B) };
}


// ---------- M1: the orthophoto alone (the road grown from the axis) ----------
// From the OSM axis outwards while the columns look like the road at the axis; where a stretch of STOP_RUN m does
// not, the road ends: at its first column, snapped to the strongest edge within SNAP. Up to the limits (facade…).
export function m1(cols, axis, lim) {
  const ref = roadRef(cols, axis), out = {};
  if (!Number.isFinite(ref.L)) return null;
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const stopAt = cols.ti(sg < 0 ? Math.max(lim.A, cols.t0) : Math.min(lim.B, cols.t0 + cols.nt * cols.res)), run = Math.round(P.stopRun / cols.res);
    let i = cols.ti(axis), bad = 0, first = null;
    for (; sg < 0 ? i > stopAt : i < stopAt; i += sg) {
      if (i < 0 || i >= cols.nt || cols.seen[i] < 0.5) break;
      if (roadLike(cols, ref, i)) { bad = 0; first = null; } else { if (!bad) first = i; if (++bad >= run) break; }
    }
    let k = first ?? i;
    // The boundary between columns: k on the side towards the axis is the last road column.
    let b = sg < 0 ? k + 1 : k;
    const sn = Math.round(P.snap / cols.res);
    let best = b;
    for (let q = b - sn; q <= b + sn; q++) if (q > 0 && q < cols.E.length && cols.E[q] > cols.E[best]) best = q;
    out[side] = cols.tOf(best);
  }
  return out;
}


// ---------- the lines (lanes-ortho.js) inside a carriageway ----------
// laneLines' chain: the lines whose gaps look like lanes, with the edge lines; the lanes = the lines that are not
// edge lines (≥ 0.7 m from the kerbs) + 1, or null where it found none.
export function lanesOf(st, s, e) {
  const H = brightMap(st);
  const ls = laneLines(st, H, s, e);
  if (!ls.length) return { lines: [], lanes: null };
  const inner = ls.filter((t) => t > s + 0.7 && t < e - 0.7);
  return { lines: [...ls], lanes: inner.length + 1 };
}
// Strong lines anywhere across the cut (candidates for the edge line at a kerb), from the same detector over a wide span.
export function allLines(st, s, e) {
  const H = brightMap(st);
  return laneLines(st, H, s, e);
}

// ---------- sidewalks: between the kerb and the OSM facade ----------
// The space less the green columns (stretches of ≥ 1 m with a green share ≥ 0.5: lawns, treetops); where OSM says
// there is no sidewalk on that side, none.
export function sidewalkOf(cols, kerb, facade, side, osmSays) {
  if (facade === null) return null;
  const space = Math.abs(facade - kerb);
  if (osmSays === "no") return { space, sidewalk: 0, green: null };
  if (!cols) return { space, sidewalk: space, green: null };
  const [a, b] = side === "A" ? [facade, kerb] : [kerb, facade];
  let green = 0, run = 0;
  for (let i = cols.ti(a); i < cols.ti(b); i++) {
    if (i < 0 || i >= cols.nt) continue;
    if (cols.green[i] >= 0.5) run++; else { if (run * cols.res >= 1) green += run * cols.res; run = 0; }
  }
  if (run * cols.res >= 1) green += run * cols.res;
  return { space, sidewalk: Math.max(0, space - green), green };
}
export { mean };

// ---------- M3: both kerbs chosen together ----------
// As M2, but the pair (A, B) is scored at once: the width against OSM's (sigma as M2) and the middle against the OSM
// axis (sigma CENTRE_SIGMA): an axis drawn a metre off the middle no longer pulls one kerb in and the other out.
export const CENTRE_SIGMA = 1.5;
export function m3(cols, axis, lim, road, lines = []) {
  const ref = roadRef(cols, axis);
  if (!Number.isFinite(ref.L)) return null;
  const sides = {};
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const lo = sg < 0 ? Math.max(lim.A, cols.t0 + 0.3) : axis + 0.5, hi = sg < 0 ? axis - 0.5 : Math.min(lim.B, cols.t0 + cols.nt * cols.res - 0.3);
    const cand = [], w = Math.round(0.3 / cols.res);
    for (let i = Math.max(1, cols.ti(lo)); i <= Math.min(cols.E.length - 2, cols.ti(hi)); i++) {
      if (cols.E[i] < P.minEdge) continue;
      let top = true;
      for (let q = i - w; q <= i + w; q++) if (q !== i && cols.E[q] > cols.E[i]) { top = false; break; }
      if (top) cand.push(i);
    }
    for (const l of lines) { const t = l + sg * P.lineOff; if ((sg < 0 ? l < axis : l > axis) && t > lo && t < hi) cand.push(cols.ti(t)); }
    // Each candidate's own score: the edge, the road between it and the axis, no road beyond it.
    sides[side] = cand.map((i) => {
      const ia = cols.ti(axis), span = sg < 0 ? [i, ia] : [ia, i];
      let n = 0, ok = 0;
      for (let q = span[0]; q < span[1]; q++) { if (q < 0 || q >= cols.nt || cols.seen[q] < 0.5) continue; n++; if (roadLike(cols, ref, q)) ok++; }
      let nb = 0, okb = 0;
      for (let k = 1; k <= Math.round(1 / cols.res); k++) { const q = sg < 0 ? i - k : i + k - 1; if (q < 0 || q >= cols.nt || cols.seen[q] < 0.5) continue; nb++; if (roadLike(cols, ref, q)) okb++; }
      const e = Math.min(cols.E[i] ?? 0, 12);
      return { t: cols.tOf(i), own: e / (e + 3) + P.alpha * (n ? ok / n : 0) - P.gamma * (nb ? okb / nb : 0) };
    });
  }
  const W = road.reach.A + road.reach.B, sW = Math.max(P.sigmaMin, P.sigmaRel * W / 2) * Math.SQRT2;
  const mid = axis + (road.reach.B - road.reach.A) / 2;
  let best = null;
  for (const a of sides.A) for (const b of sides.B) {
    const s = a.own + b.own - 2 * P.beta * ((b.t - a.t - W) / sW) ** 2 - P.beta * (((a.t + b.t) / 2 - mid) / CENTRE_SIGMA) ** 2;
    if (!best || s > best.s) best = { s, A: a.t, B: b.t };
  }
  return best ? { A: best.A, B: best.B } : { A: Math.max(lim.A + 0.5, axis - road.reach.A), B: Math.min(lim.B - 0.5, axis + road.reach.B) };
}
