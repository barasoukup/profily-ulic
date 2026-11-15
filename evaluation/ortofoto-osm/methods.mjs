// The methods of the experiment (ZPRAVA.md): where the carriageway's kerbs are, from OSM alone (M0), from the
// orthophoto alone (M1), and from both (M2); then the sidewalks between the kerbs and the OSM facades.
import { median, mean } from "./lib.mjs";
import { brightMap, laneLines } from "../../pilot/public/lanes-ortho.js";

// ---------- M0: OSM and the rules ----------
const num = (v) => { const x = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(x) ? x : null; };
const ONEWAY = (t) => t.oneway === "yes" || t.oneway === "1" || t.oneway === "-1" || t.junction === "roundabout" || t.highway === "motorway";
// Lane width by the road's class (the app's 3 m, wider on main roads, narrower in residential streets).
const LANE_W = { motorway: 3.5, trunk: 3.5, primary: 3.25, secondary: 3.25, tertiary: 3.0 };
export const laneWidth = (hw) => LANE_W[String(hw).replace("_link", "")] ?? 2.75;
// Parking at one side of the way (left / right of its drawing direction), the OSM street-parking schemes old and new:
// how much of the carriageway it takes (m).
function parkingSide(t, side) {
  const v = t[`parking:${side}`] ?? t["parking:both"], orient = t[`parking:${side}:orientation`] ?? t["parking:both:orientation"];
  const old = t[`parking:lane:${side}`] ?? t["parking:lane:both"];
  const kind = v ?? (old ? (["parallel", "diagonal", "perpendicular", "marked"].includes(old) ? "lane" : old) : null);
  const or = orient ?? (["parallel", "diagonal", "perpendicular"].includes(old) ? old : "parallel");
  if (!kind || ["no", "none", "separate", "on_kerb", "shoulder", "fire_lane"].includes(kind)) return { kind, w: 0 };
  const full = or === "perpendicular" ? 5 : or === "diagonal" ? 4.5 : 2.0;
  return { kind, w: kind === "half_on_kerb" ? full / 2 : full };
}
const cyclewaySide = (t, side) => { const v = t[`cycleway:${side}`] ?? t["cycleway:both"] ?? t.cycleway; return v === "lane" || v === "share_busway" ? 1.5 : 0; };
// The carriageway OSM implies: { w, lanes, parking: { A, B } (m at each side of the cut), from: what decided }.
// side A of the cut is t < axis; the way's left is side B when the way runs with the cut's u (along > 0).
export function osmRoad(own) {
  const t = own.tags, ow = ONEWAY(t), hw = t.highway;
  const lanes = num(t.lanes) ?? (hw === "living_street" || hw === "pedestrian" || hw === "service" ? 1 : ow ? 1 : 2);
  const leftIs = own.along > 0 ? "B" : "A", rightIs = leftIs === "A" ? "B" : "A";
  const pl = parkingSide(t, "left"), pr = parkingSide(t, "right");
  const parking = { [leftIs]: pl.w, [rightIs]: pr.w }, parkKind = { [leftIs]: pl.kind, [rightIs]: pr.kind };
  const cyc = cyclewaySide(t, "left") + cyclewaySide(t, "right");
  const lw = laneWidth(hw);
  const width = num(t.width);
  // A width tag between one lane and 40 m is the carriageway's width (it is meant so; sometimes it is the street's).
  const w = width && width >= 2.5 && width <= 40 ? width : Math.max(lanes, 1) * lw + parking.A + parking.B + cyc;
  // Tram tracks in the street (OSM railway=tram crossing the cut near the axis, or embedded_rails on the road): the
  // carriageway reaches at least 1.7 m past the outer track's axis on each side (half a tram and a little).
  const reach = { A: w / 2, B: w / 2 };
  const sw = (side) => { const v = t[`sidewalk:${side}`] ?? t["sidewalk:both"] ?? (t.sidewalk === "both" || t.sidewalk === side ? "yes" : t.sidewalk === "no" || t.sidewalk === "none" ? "no" : t.sidewalk === "separate" ? "separate" : t.sidewalk === "left" || t.sidewalk === "right" ? "no" : null); return v; };
  const swW = (side) => num(t[`sidewalk:${side}:width`] ?? t["sidewalk:both:width"] ?? t["sidewalk:width"]);
  const sidewalk = { [leftIs]: sw("left"), [rightIs]: sw("right") }, sidewalkW = { [leftIs]: swW("left"), [rightIs]: swW("right") };
  return { w, reach, lanes, oneway: ow, parking, parkKind, sidewalk, sidewalkW, from: width ? "width" : num(t.lanes) ? "lanes" : "výchozí" };
}
// Rails in the road: where OSM tram tracks cross the cut within the expected carriageway (+ 3.5 m), it reaches past them.
export function withRails(road, o) {
  const axis = o.own.t, rails = o.ways.filter((w) => w.tags.railway === "tram" && Math.abs(w.t - axis) < Math.max(road.reach.A, road.reach.B) + 3.5);
  if (!rails.length || o.own.tags.embedded_rails === undefined && !rails.some((w) => Math.abs(w.t - axis) < Math.max(road.reach.A, road.reach.B))) return road;
  const reach = { ...road.reach };
  for (const w of rails) { const side = w.t < axis ? "A" : "B"; reach[side] = Math.max(reach[side], Math.abs(w.t - axis) + 1.7); }
  return { ...road, reach, w: reach.A + reach.B, rails: rails.length };
}
// Where the search for a kerb may go on each side: up to the facade, a separately mapped sidewalk (its line is the
// sidewalk's middle) or halfway to a partner carriageway; at most 25 m.
export function limits(o, axis) {
  const lim = { A: axis - 25, B: axis + 25 };
  const near = (side, t, back = 0) => { if (side === "A" && t < axis && t + back > lim.A) lim.A = t + back; if (side === "B" && t > axis && t - back < lim.B) lim.B = t - back; };
  for (const side of ["A", "B"]) if (o.facade[side] !== null) near(side, o.facade[side]);
  for (const w of o.ways) {
    const hw = w.tags.highway, side = w.t < axis ? "A" : "B";
    if (hw === "footway" && w.tags.footway === "sidewalk") near(side, w.t, side === "A" ? -0.5 : 0.5);
    if (["motorway", "trunk", "primary", "secondary", "tertiary"].includes(String(hw).replace("_link", "")) && w.tags.oneway === "yes" && Math.abs(w.t - axis) > 4) near(side, (w.t + axis) / 2);
  }
  return lim;
}
export function m0(o, road) {
  const axis = o.own.t;
  const lim = limits(o, axis);
  return { A: Math.max(lim.A + 0.5, axis - road.reach.A), B: Math.min(lim.B - 0.5, axis + road.reach.B) };
}

// ---------- the image across the cut: per column (t) ----------
// Per 5 m piece along the street (8 of them) the median brightness of each column; the column's median over them,
// its green share (treetops, lawns) and saturation. The kerb is a step of brightness (or of green) that holds along
// the street: in most of the pieces, with the same sign.
const BLOCKS = 8;
export function columns(st) {
  const { nt, nu, res, t0, L, G, rgb } = st, bl = Array.from({ length: BLOCKS }, () => new Float32Array(nt));
  const medL = new Float32Array(nt), green = new Float32Array(nt), sat = new Float32Array(nt), seen = new Float32Array(nt);
  const per = Math.floor(nu / BLOCKS);
  for (let i = 0; i < nt; i++) {
    let gn = 0, n = 0; const sv = [];
    for (let b = 0; b < BLOCKS; b++) {
      const v = [];
      for (let j = b * per; j < (b + 1) * per; j++) {
        const q = j * nt + i, x = L[q];
        if (Number.isNaN(x)) continue;
        v.push(x); n++;
        if (G[q] >= 10 && rgb[q * 3 + 1] > rgb[q * 3 + 2]) gn++;
        if (j % 2 === 0) sv.push(Math.max(rgb[q * 3], rgb[q * 3 + 1], rgb[q * 3 + 2]) - Math.min(rgb[q * 3], rgb[q * 3 + 1], rgb[q * 3 + 2]));
      }
      bl[b][i] = v.length ? median(v) : NaN;
    }
    medL[i] = median(Array.from(bl, (x) => x[i]));
    green[i] = n ? gn / n : NaN; sat[i] = median(sv); seen[i] = n / nu;
  }
  // Edges between columns i-1 and i: the signed difference of the pieces' brightness across ±d, its median over the
  // pieces, times the share of pieces that agree in sign; plus the step of green.
  const d = Math.max(1, Math.round(0.25 / res)), edge = new Float32Array(nt + 1);
  for (let i = d; i <= nt - d; i++) {
    const diffs = [];
    for (let b = 0; b < BLOCKS; b++) {
      let a = 0, c = 0, na = 0, nc = 0;
      for (let k = 0; k < d; k++) { const x = bl[b][i - 1 - k], y = bl[b][i + k]; if (!Number.isNaN(x)) { a += x; na++; } if (!Number.isNaN(y)) { c += y; nc++; } }
      if (na && nc) diffs.push(c / nc - a / na);
    }
    if (diffs.length < 4) continue;
    const m = median(diffs), agree = diffs.filter((x) => Math.sign(x) === Math.sign(m) && Math.abs(x) >= 3).length / diffs.length;
    let ga = 0, gc = 0;
    for (let k = 0; k < d; k++) { ga += green[i - 1 - k] || 0; gc += green[i + k] || 0; }
    edge[i] = Math.abs(m) * agree + 60 * Math.abs(gc - ga) / d;
  }
  const typical = median(Array.from(edge).filter((x) => x > 0)) || 1;
  const E = Float32Array.from(edge, (x) => x / typical);
  return { nt, res, t0, medL, green, sat, seen, E, ti: (t) => Math.round((t - t0) / res), tOf: (i) => t0 + i * res };
}

// Does column i look like the roadway at the axis (its brightness, no green, its colour)?
function roadRef(cols, axis) {
  const i0 = cols.ti(axis - 1.5), i1 = cols.ti(axis + 1.5), L = [], S = [];
  for (let i = Math.max(0, i0); i <= Math.min(cols.nt - 1, i1); i++) if (cols.green[i] < 0.3) { L.push(cols.medL[i]); S.push(cols.sat[i]); }
  return { L: median(L), S: median(S) };
}
export const P = { tolL: 0.2, tolS: 18, greenMax: 0.3, stopRun: 0.8, snap: 0.4, minEdge: 1.6, alpha: 1.5, beta: 0.5, gamma: 0.8, sigmaMin: 1.0, sigmaRel: 0.3, lineOff: 0.4 };
const roadLike = (cols, ref, i) => cols.green[i] < P.greenMax && Math.abs(cols.medL[i] - ref.L) <= Math.max(14, P.tolL * ref.L) && Math.abs(cols.sat[i] - ref.S) <= P.tolS;

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

// ---------- M2: both (candidate edges scored by the image and by what OSM expects) ----------
// The candidates: local maxima of the edge strength (≥ minEdge) between 1 m from the axis and the limits, and a kerb
// lineOff beyond each strong line near where OSM expects the kerb (the edge line, V 4). Score: the edge (saturating)
// + alpha × the share of road-like columns between the axis and it − gamma × the share of road-like columns in the
// metre beyond it − beta × ((distance − expected) / sigma)²; expected = half the OSM width (+ parking) from the axis.
export function m2(cols, axis, lim, road, lines = []) {
  const ref = roadRef(cols, axis), out = {}, why = {};
  if (!Number.isFinite(ref.L)) return null;
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const exp = road.reach[side], sigma = Math.max(P.sigmaMin, P.sigmaRel * exp);
    const lo = sg < 0 ? Math.max(lim.A, cols.t0 + 0.3) : axis + 1, hi = sg < 0 ? axis - 1 : Math.min(lim.B, cols.t0 + cols.nt * cols.res - 0.3);
    const cand = [];
    const w = Math.round(0.3 / cols.res);
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
    let best = null;
    for (const c of cand) {
      const ia = cols.ti(axis), span = sg < 0 ? [c.i, ia] : [ia, c.i];
      let n = 0, ok = 0;
      for (let q = span[0]; q < span[1]; q++) { if (q < 0 || q >= cols.nt || cols.seen[q] < 0.5) continue; n++; if (roadLike(cols, ref, q)) ok++; }
      let nb = 0, okb = 0;
      for (let k = 1; k <= Math.round(1 / cols.res); k++) { const q = sg < 0 ? c.i - k : c.i + k - 1; if (q < 0 || q >= cols.nt || cols.seen[q] < 0.5) continue; nb++; if (roadLike(cols, ref, q)) okb++; }
      const dist = Math.abs(cols.tOf(c.i) - axis);
      const e = Math.min(cols.E[c.i] ?? 0, 12);
      const score = e / (e + 3) + P.alpha * (n ? ok / n : 0) - P.gamma * (nb ? okb / nb : 0) - P.beta * ((dist - exp) / sigma) ** 2;
      if (!best || score > best.score) best = { score, t: cols.tOf(c.i), from: c.from };
    }
    // No candidate at all: OSM's expectation.
    out[side] = best ? best.t : sg < 0 ? Math.max(lim.A + 0.5, axis - exp) : Math.min(lim.B - 0.5, axis + exp);
    why[side] = best ? best.from : "osm";
  }
  out.why = why;
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
