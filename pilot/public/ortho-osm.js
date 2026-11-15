// The street from the orthophoto and OSM where no technical map answers (Bára 15. 11. 2026; evaluation/ortofoto-osm/
// ZPRAVA.md, method M2): the surfaces derive.js needs are made up of the OSM buildings, a carriageway whose kerbs are
// read on the orthophoto of the click (lanes-ortho.js laneImage) near where OSM expects them (width, lanes, parking,
// tram tracks), and sidewalks from the kerbs to the buildings. Every surface but the buildings is an estimate
// (guess: the parts are "odhad"). Against MTVU (Prague, Brno, simple cuts): kerbs within 0.5 m at 39–49 %, within 1 m
// at 57–69 %, against 26–35 % / 51–59 % from OSM alone; with an OSM width tag much better.

import { strongLines } from "./lanes-ortho.js";

const median = (a) => { const b = a.filter((v) => Number.isFinite(v)).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };

// ---------- what OSM says along the cut ----------
const underground = (tags) => Number(tags.layer) < 0 || Number(tags.level) < 0 || tags.location === "underground" || tags.tunnel === "yes";
// Where a ring or a line (in the cut's [t, u]) crosses the line u = u0, within |t| ≤ half.
function crossT(pts, half, u0 = 0) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [t1, u1] = pts[i], [t2, u2] = pts[i + 1];
    if ((u1 > u0) === (u2 > u0) || u1 === u2) continue;
    const t = t1 + ((u0 - u1) / (u2 - u1)) * (t2 - t1);
    if (Math.abs(t) <= half) out.push({ t, d: [t2 - t1, u2 - u1] });
  }
  return out;
}
// The buildings are read on lines u = 0, ±1 and ±2 m: OSM's outlines are simpler than the map's, a row of houses
// may have a gap of a metre exactly at the cut.
export const BUILDING_U = [0, -1, 1, -2, 2];
// tu: (lon, lat) → [t across the cut, u along it]; wayId: the clicked street. Returns the clicked way's crossing
// { t, along (+1 when it runs with u), tags }, the other ways crossing the cut, the buildings' stretches on the lines
// u, the nearest facade on each side of the axis (A: t below it, B: above; null where none within 40 m) and the
// buildings' outlines (in [t, u]).
export function osmAlong(elements, tu, wayId, half = 45) {
  const toTU = (g) => g.map((p) => tu(p.lon, p.lat));
  const buildings = [], ways = [], outlines = [];
  let own = null;
  for (const el of elements || []) {
    const tags = el.tags || {};
    if (!el.geometry) continue;
    if (el.type === "area" && tags.building && tags.building !== "no" && tags.building !== "roof" && !underground(tags)) {
      const rings = [toTU(el.geometry), ...(el.holes || []).map(toTU)];
      let hit = false;
      for (const u of BUILDING_U) {
        const xs = rings.flatMap((r) => crossT([...r, r[0]], half + 20, u).map((x) => x.t)).sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) { buildings.push({ s: xs[i], e: xs[i + 1], u }); hit = true; }
      }
      if (hit) outlines.push({ rings, el });
      continue;
    }
    if (el.type !== "way") continue;
    for (const x of crossT(toTU(el.geometry), half)) {
      const w = { t: x.t, along: Math.sign(x.d[1]) || 1, tags, id: el.id };
      if (el.id === wayId) { if (!own || Math.abs(w.t) < Math.abs(own.t)) own = w; } else ways.push(w);
    }
  }
  const facade = {};
  if (own) for (const [side, sg] of [["A", -1], ["B", 1]]) {
    facade[side] = null;
    for (const u of BUILDING_U) {
      const hits = buildings.filter((b) => b.u === u && (sg < 0 ? b.e < own.t : b.s > own.t)).map((b) => (sg < 0 ? b.e : b.s)).filter((x) => Math.abs(x - own.t) < 40);
      if (hits.length) { facade[side] = hits.reduce((a, b) => (Math.abs(b - own.t) < Math.abs(a - own.t) ? b : a)); break; }
    }
  }
  return { own, buildings, ways, facade, outlines };
}

// ---------- the carriageway OSM implies ----------
const num = (v) => { const x = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(x) ? x : null; };
const ONEWAY = (t) => t.oneway === "yes" || t.oneway === "1" || t.oneway === "-1" || t.junction === "roundabout" || t.highway === "motorway";
// Lane width by the road's class (the app's 3 m, wider on main roads, narrower in residential streets).
const LANE_W = { motorway: 3.5, trunk: 3.5, primary: 3.25, secondary: 3.25, tertiary: 3.0 };
export const laneWidth = (hw) => LANE_W[String(hw).replace("_link", "")] ?? 2.75;
// Parking at one side of the way (left / right of its drawing direction), the street-parking schemes old and new:
// its kind and how much of the carriageway it takes (m).
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
// own: osmAlong's own. Returns { w, reach: { A, B } (from the axis), lanes, parking, sidewalk, sidewalkW, from }; side A
// of the cut is t < axis, the way's left is side B when it runs with u.
export function osmRoad(own) {
  const t = own.tags, ow = ONEWAY(t), hw = t.highway;
  const lanes = num(t.lanes) ?? (hw === "living_street" || hw === "pedestrian" || hw === "service" ? 1 : ow ? 1 : 2);
  const leftIs = own.along > 0 ? "B" : "A", rightIs = leftIs === "A" ? "B" : "A";
  const pl = parkingSide(t, "left"), pr = parkingSide(t, "right");
  const parking = { [leftIs]: pl.w, [rightIs]: pr.w }, parkKind = { [leftIs]: pl.kind, [rightIs]: pr.kind };
  const cyc = cyclewaySide(t, "left") + cyclewaySide(t, "right");
  const width = num(t.width);
  // A width tag between one lane and 40 m is the carriageway's width (it is meant so; sometimes it is the street's).
  const w = width && width >= 2.5 && width <= 40 ? width : Math.max(lanes, 1) * laneWidth(hw) + parking.A + parking.B + cyc;
  const sw = (side) => t[`sidewalk:${side}`] ?? t["sidewalk:both"] ?? (t.sidewalk === "both" || t.sidewalk === side ? "yes" : t.sidewalk === "no" || t.sidewalk === "none" ? "no" : t.sidewalk === "separate" ? "separate" : t.sidewalk === "left" || t.sidewalk === "right" ? "no" : null);
  const swW = (side) => num(t[`sidewalk:${side}:width`] ?? t["sidewalk:both:width"] ?? t["sidewalk:width"]);
  return { w, reach: { A: w / 2, B: w / 2 }, lanes, oneway: ow, parking, parkKind, sidewalk: { [leftIs]: sw("left"), [rightIs]: sw("right") }, sidewalkW: { [leftIs]: swW("left"), [rightIs]: swW("right") }, from: width ? "width" : num(t.lanes) ? "lanes" : "výchozí" };
}
// Tram tracks in the street: where OSM tracks cross the cut within the expected carriageway, it reaches at least
// 1.7 m past the outer track's axis (half a tram and a little).
export function withRails(road, o) {
  const axis = o.own.t, far = Math.max(road.reach.A, road.reach.B), rails = o.ways.filter((w) => w.tags.railway === "tram" && Math.abs(w.t - axis) < far + 3.5);
  if (!rails.length || (o.own.tags.embedded_rails === undefined && !rails.some((w) => Math.abs(w.t - axis) < far))) return road;
  const reach = { ...road.reach };
  for (const w of rails) { const side = w.t < axis ? "A" : "B"; reach[side] = Math.max(reach[side], Math.abs(w.t - axis) + 1.7); }
  return { ...road, reach, w: reach.A + reach.B, rails: rails.length };
}
// Where a kerb may lie on each side: up to the facade, a separately mapped sidewalk (its line is the sidewalk's
// middle) or halfway to a partner carriageway; at most 25 m.
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

// ---------- the image across the cut, per column ----------
// Per 5 m piece along the street (8 of them) the median brightness of each column; the column's median over them,
// its green share (G ≥ 10: treetops, lawns) and saturation. The kerb is a step of brightness (or of green) that holds
// along the street: in most of the pieces, with the same sign. st: laneImage's (L, G, S; t0, res, nt, nu).
const BLOCKS = 8;
export function columns(st) {
  const { nt, nu, res, t0, L, G, S } = st, bl = Array.from({ length: BLOCKS }, () => new Float32Array(nt));
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
        if (G[q] >= 10) gn++;
        if (j % 2 === 0) sv.push(S[q]);
      }
      bl[b][i] = v.length ? median(v) : NaN;
    }
    medL[i] = median(Array.from(bl, (x) => x[i]));
    green[i] = n ? gn / n : NaN; sat[i] = median(sv); seen[i] = n / nu;
  }
  // Edges between columns i-1 and i: the signed difference of the pieces' brightness across ±d, its median over the
  // pieces, times the share of pieces that agree in sign; plus the step of green. Relative to the typical change.
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
// The roadway at the axis (±1.5 m, not green): its brightness and saturation; does column i look like it?
export const P = { tolL: 0.2, tolS: 18, greenMax: 0.3, minEdge: 1.6, alpha: 1.5, beta: 0.5, gamma: 0.8, sigmaMin: 1.0, sigmaRel: 0.3, lineOff: 0.4 };
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
export function kerbs(cols, axis, lim, road, lines = []) {
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
    let best = null;
    for (const c of cand) {
      const ia = cols.ti(axis), span = sg < 0 ? [c.i, ia] : [ia, c.i];
      let n = 0, ok = 0;
      for (let q = span[0]; q < span[1]; q++) { if (q < 0 || q >= cols.nt || cols.seen[q] < 0.5) continue; n++; if (roadLike(cols, ref, q)) ok++; }
      let nb = 0, okb = 0;
      for (let k = 1; k <= Math.round(1 / cols.res); k++) { const q = sg < 0 ? c.i - k : c.i + k - 1; if (q < 0 || q >= cols.nt || cols.seen[q] < 0.5) continue; nb++; if (roadLike(cols, ref, q)) okb++; }
      const dist = Math.abs(cols.tOf(c.i) - axis), e = Math.min(cols.E[c.i] ?? 0, 12);
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
// Kerbs on the image st (laneImage's), for the street o (osmAlong) and its road (osmRoad, withRails).
export function kerbsOnImage(st, o, road) {
  const axis = o.own.t, lim = limits(o, axis), end = st.t0 + st.nt * st.res;
  const lo = Math.max(lim.A, st.t0 + 0.5), hi = Math.min(lim.B, end - 0.5);
  const lines = hi - lo > 4 ? strongLines(st, lo + 1.5, hi - 1.5) : [];
  const cols = columns(st);
  return { ...kerbs(cols, axis, lim, road, lines), lim, cols };
}

// ---------- the surfaces for derive.js ----------
// The MTVU codes the profile knows: 701 the roadway, 702 a sidewalk, 1003 a paved area, 601 a building. A sidewalk runs
// from the kerb to the facade, at most SIDEWALK_MAX (the rest greenery where the image is mostly green, else a
// paved area); with no facade within reach, only where
// OSM tags one (sidewalk:width, else the default SIDEWALK m), then nothing (the profile ends there). Where OSM says
// there is no sidewalk the space is a paved area.
const ALONG = 10, SIDEWALK = 2.5, SIDEWALK_MAX = 6, GREEN_AREA = 0.1; // evaluation/ortofoto-osm/zelen.mjs: on ČÚZK 12.5 cm 67 % (Prague) and 82 % (Brno) of the metres right
const STREET = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|pedestrian|road)(_link)?$/;
// frame: derive.js localFrame of the cut (its centre is [0, 0]); dir: the street's direction in it; way: the clicked
// OSM way; st: laneImage's image. Returns the polygons (as derive.js mtvuPolygons) or null.
export function orthoOsmPolys({ osm, frame, dir, way, st }) {
  if (!st || !way || !STREET.test(way.tags?.highway || "")) return null;
  const normal = [-dir[1], dir[0]];
  const tu = (lon, lat) => { const [x, y] = frame.toXY(lon, lat); return [x * normal[0] + y * normal[1], x * dir[0] + y * dir[1]]; };
  const xy = (t, u) => [normal[0] * t + dir[0] * u, normal[1] * t + dir[1] * u];
  const o = osmAlong(osm?.elements, tu, way.id);
  if (!o.own) return null;
  const road = withRails(osmRoad(o.own), o), k = kerbsOnImage(st, o, road);
  if (!Number.isFinite(k.A) || !Number.isFinite(k.B) || k.B - k.A < 2) return null;
  const bboxOf = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  const rect = (code, label, s, e) => { const ring = [xy(s, -ALONG), xy(e, -ALONG), xy(e, ALONG), xy(s, ALONG), xy(s, -ALONG)]; return { code, label, guess: true, orthoOsm: true, rings: [ring], bbox: bboxOf(ring) }; };
  const polys = [rect(701, "vozovka (ortofoto a OSM)", k.A, k.B)];
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    const kerb = k[side], f = o.facade[side], says = road.sidewalk[side];
    const far = f !== null ? f : says === "no" ? null : says || road.sidewalkW[side] ? kerb + sg * (road.sidewalkW[side] || SIDEWALK) : null;
    if (far === null || sg * (far - kerb) < 0.3) continue;
    if (says === "no") { polys.push(rect(1003, "zpevněná plocha (odhad)", ...(sg < 0 ? [far, kerb] : [kerb, far]))); continue; }
    // A sidewalk of at most SIDEWALK_MAX; the rest up to the house is some other area (a front garden, a yard, a lawn:
    // the image does not tell, MTVU in Prague and Brno: 34 of 42 such stretches over 6 m hold a sidewalk of at most 6 m).
    const swEnd = Math.abs(far - kerb) > SIDEWALK_MAX ? kerb + sg * SIDEWALK_MAX : far;
    polys.push(rect(702, "chodník (ortofoto a OSM)", ...(sg < 0 ? [swEnd, kerb] : [kerb, swEnd])));
    if (swEnd !== far) {
      // Green on the image over most of it (a lawn, treetops): greenery, else a paved area.
      const [a, b] = sg < 0 ? [far, swEnd] : [swEnd, far], g = [];
      for (let i = k.cols.ti(a); i < k.cols.ti(b); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]);
      const green = g.length && g.reduce((x, y) => x + y, 0) / g.length >= GREEN_AREA;
      polys.push(green ? rect(401, "zeleň (ortofoto)", a, b) : rect(1003, "plocha před domem (odhad)", a, b));
    }
  }
  // The OSM buildings at the cut, as the map's.
  for (const { el } of o.outlines) {
    const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
    polys.push({ code: 601, label: "budova (OSM)", rings, bbox: bboxOf(rings[0]) });
  }
  polys.kerbs = { A: k.A, B: k.B, why: k.why };
  return polys;
}
