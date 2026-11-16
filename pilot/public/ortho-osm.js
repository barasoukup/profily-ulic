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
// Green areas of OSM (tools/build_osm_tiles.mjs keeps them near the roads, cut by tiles): lawns, parks, gardens, woods.
// Water, allotments and cemeteries (kept alike): where a profile ends, as MTVU's water (501) and gardens (300).
export const WATER = (t) => t.natural === "water" || t.water !== undefined || ["reservoir", "basin", "allotments", "cemetery"].includes(t.landuse) || t.waterway === "riverbank";
export const GREEN = (t) => ["grass", "meadow", "village_green", "flowerbed", "forest", "orchard", "recreation_ground"].includes(t.landuse) || ["park", "garden"].includes(t.leisure) || ["grass", "grassland", "scrub", "wood", "heath"].includes(t.natural);
// tu: (lon, lat) → [t across the cut, u along it]; wayId: the clicked street. Returns the clicked way's crossing
// { t, along (+1 when it runs with u), tags }, the other ways crossing the cut, the buildings' stretches on the lines
// u, the nearest facade on each side of the axis (A: t below it, B: above; null where none within 40 m) and the
// buildings' outlines (in [t, u]).
export function osmAlong(elements, tu, wayId, half = 45) {
  const toTU = (g) => g.map((p) => tu(p.lon, p.lat));
  const buildings = [], ways = [], outlines = [], greens = [];
  let own = null;
  for (const el of elements || []) {
    const tags = el.tags || {};
    if (!el.geometry) continue;
    if (el.type === "area" && !tags.building && (GREEN(tags) || WATER(tags))) { greens.push(el); continue; }
    if (el.type === "area" && tags.building && tags.building !== "no" && tags.building !== "roof" && !underground(tags)) {
      const rings = [toTU(el.geometry), ...(el.holes || []).map(toTU)];
      let hit = false;
      for (const u of BUILDING_U) {
        // All the crossings, however far: a big block (a hotel 60 m deep, Drevená in Bratislava) has its far side
        // out of the window, and an odd count of crossings would lose the house.
        const xs = rings.flatMap((r) => crossT([...r, r[0]], Infinity, u).map((x) => x.t)).sort((a, b) => a - b);
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
  const facade = {}, facadeU = {};
  if (own) for (const [side, sg] of [["A", -1], ["B", 1]]) {
    facade[side] = null;
    for (const u of BUILDING_U) {
      const hits = buildings.filter((b) => b.u === u && (sg < 0 ? b.e < own.t : b.s > own.t)).map((b) => (sg < 0 ? b.e : b.s)).filter((x) => Math.abs(x - own.t) < 40);
      if (hits.length) { facade[side] = hits.reduce((a, b) => (Math.abs(b - own.t) < Math.abs(a - own.t) ? b : a)); facadeU[side] = u; break; }
    }
  }
  return { own, buildings, ways, facade, facadeU, outlines, greens };
}

// The level of a way: its layer, or −1 in a tunnel and 1 on a bridge without one. Ways of another level than the
// clicked street (a road in a tunnel under it, tracks on a bridge over it) do not limit or widen it.
const levelOf = (t) => Number(t.layer) || (t.tunnel && t.tunnel !== "no" ? -1 : t.bridge && t.bridge !== "no" ? 1 : 0);
const sameLevel = (w, o) => levelOf(w.tags) === levelOf(o.own.tags);

// ---------- the carriageway OSM implies ----------
const num = (v) => { const x = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(x) ? x : null; };
const ONEWAY = (t) => t.oneway === "yes" || t.oneway === "1" || t.oneway === "-1" || t.junction === "roundabout" || t.highway === "motorway";
// Lane width by the road's class (the app's 3 m, wider on main roads, narrower in residential streets).
const LANE_W = { motorway: 3.5, trunk: 3.5, primary: 3.25, secondary: 3.25, tertiary: 3.0 };
export const laneWidth = (hw) => LANE_W[String(hw).replace("_link", "")] ?? 2.75;
// Parking at one side of the way (left / right of its drawing direction), the street-parking schemes old and new:
// its kind and how much of the carriageway it takes (m).
// Only parking on the carriageway counts (lane, street_side, half of half_on_kerb); no_parking, no_stopping, yes and
// the like take nothing. The old scheme: parking:lane:<side>=parallel|diagonal|perpendicular|marked with the place in
// parking:lane:<side>:<orientation>=on_street|half_on_kerb|on_kerb|lay_by.
const OLD_ORIENT = ["parallel", "diagonal", "perpendicular", "marked", "inline"];
function parkingSide(t, side) {
  const v = t[`parking:${side}`] ?? t["parking:both"], orient = t[`parking:${side}:orientation`] ?? t["parking:both:orientation"];
  const old = t[`parking:lane:${side}`] ?? t["parking:lane:both"];
  let kind = v ?? null, or = orient ?? "parallel";
  if (!kind && old) {
    if (OLD_ORIENT.includes(old)) {
      or = old === "marked" || old === "inline" ? "parallel" : old;
      const at = t[`parking:lane:${side}:${old}`] ?? t[`parking:lane:both:${old}`];
      kind = at === "on_kerb" ? "on_kerb" : at === "half_on_kerb" ? "half_on_kerb" : at === "lay_by" || at === "street_side" ? "street_side" : "lane";
    } else kind = old;
  }
  if (!["lane", "street_side", "half_on_kerb"].includes(kind)) return { kind, w: 0 };
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
  const axis = o.own.t, far = Math.max(road.reach.A, road.reach.B), rails = o.ways.filter((w) => w.tags.railway === "tram" && sameLevel(w, o) && Math.abs(w.t - axis) < far + 3.5);
  if (!rails.length || (o.own.tags.embedded_rails === undefined && !rails.some((w) => Math.abs(w.t - axis) < far))) return road;
  const reach = { ...road.reach };
  for (const w of rails) { const side = w.t < axis ? "A" : "B"; reach[side] = Math.max(reach[side], Math.abs(w.t - axis) + 1.7); }
  return { ...road, reach, w: reach.A + reach.B, rails: rails.length };
}
// Where a kerb may lie on each side: up to the facade, 0.75 m short of a separately mapped sidewalk (its line is the
// sidewalk's middle), halfway to a partner carriageway (ways of the street's own level only); at most 25 m.
export function limits(o, axis) {
  const lim = { A: axis - 25, B: axis + 25 };
  const near = (side, t, back = 0) => { if (side === "A" && t < axis && t + back > lim.A) lim.A = t + back; if (side === "B" && t > axis && t - back < lim.B) lim.B = t - back; };
  for (const side of ["A", "B"]) if (o.facade[side] !== null) near(side, o.facade[side]);
  for (const w of o.ways) {
    if (!sameLevel(w, o)) continue;
    const hw = w.tags.highway, side = w.t < axis ? "A" : "B";
    if (hw === "footway" && w.tags.footway === "sidewalk") near(side, w.t, 0.75);
    if ((w.id === o.pairId || ["motorway", "trunk", "primary", "secondary", "tertiary"].includes(String(hw).replace("_link", "")) && w.tags.oneway === "yes") && Math.abs(w.t - axis) > 4) near(side, (w.t + axis) / 2);
  }
  return lim;
}

// The other carriageway of a street of two one-way ones (Suché mýto in Bratislava; Bára 16. 11. 2026): the nearest
// one-way street way of the same level and name (unnamed: of the same class), 4 to 35 m from the clicked one. Its
// kerbs are read as the clicked one's; the strip between them is a median.
export function partnerOf(o) {
  const own = o.own, tg = own.tags;
  if (!ONEWAY(tg)) return null;
  const same = (w) => (tg.name ? w.tags.name === tg.name : String(w.tags.highway).replace("_link", "") === String(tg.highway).replace("_link", ""));
  const c = o.ways.filter((w) => STREET.test(w.tags.highway || "") && ONEWAY(w.tags) && sameLevel(w, o) && same(w) && Math.abs(w.t - own.t) > 4 && Math.abs(w.t - own.t) < 35);
  return c.length ? c.reduce((a, b) => (Math.abs(b.t - own.t) < Math.abs(a.t - own.t) ? b : a)) : null;
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
  // A blank stretch (the image's edge of coverage: white or black and flat along the street, a metre wide or more) is
  // not seen: no road there and no kerb at its edge. A painted line is narrower.
  const flat = (i) => {
    let n = 0, s = 0, s2 = 0;
    for (let j = 0; j < nu; j += 3) { const x = L[j * nt + i]; if (Number.isNaN(x)) continue; n++; s += x; s2 += x * x; }
    if (!n) return false;
    const m = s / n;
    return (m >= 248 || m <= 5) && Math.sqrt(Math.max(0, s2 / n - m * m)) < 2;
  };
  const isFlat = Uint8Array.from({ length: nt }, (_, i) => (flat(i) ? 1 : 0)), wide = Math.round(1 / res);
  for (let i = 0; i < nt;) {
    if (!isFlat[i]) { i++; continue; }
    let e = i;
    while (e < nt && isFlat[e]) e++;
    if (e - i >= wide) for (let q = i; q < e; q++) seen[q] = 0;
    i = e;
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
export const P = { tolL: 0.2, tolS: 18, greenMax: 0.3, minEdge: 1.6, alpha: 1.5, beta: 0.5, gamma: 0.8, sigmaMin: 1.0, sigmaRel: 0.3, lineOff: 0.4, mapBonus: 0.8 };
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
// edges: where the lines of a town's technical map (an edge of a kerb, of a sidewalk; towns/slovensko.js) cross the
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
// Is there anything to read on the image: mostly seen (not outside the source's coverage), not one flat colour (a
// blank or white answer), not black or white all over?
export function usable(st) {
  if (!st?.L?.length) return false;
  let n = 0, seen = 0, sum = 0, sq = 0;
  for (let q = 0; q < st.L.length; q += 7) { n++; const v = st.L[q]; if (Number.isNaN(v)) continue; seen++; sum += v; sq += v * v; }
  if (seen < 0.5 * n) return false;
  const mean = sum / seen, sd = Math.sqrt(Math.max(0, sq / seen - mean * mean));
  return sd >= 4 && mean > 5 && mean < 245;
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

// ---------- the surfaces for derive.js ----------
// The MTVU codes the profile knows: 701 the roadway, 702 a sidewalk, 1003 a paved area, 601 a building. A sidewalk runs
// from the kerb to the facade, at most SIDEWALK_MAX (the rest greenery where the image is mostly green, else a
// paved area up to REST_MAX m, else nothing); with no facade within reach, only where OSM tags one (sidewalk:width,
// else the default SIDEWALK m), then nothing (the profile ends there). Where OSM says there is no sidewalk the space
// is treated as that rest.
const ALONG = 10, SIDEWALK = 2.5, SIDEWALK_MAX = 6, REST_MAX = 12, HOUSE = 5, GREEN_AREA = 0.1; // evaluation/ortofoto-osm/zelen.mjs: on ČÚZK 12.5 cm 67 % (Prague) and 82 % (Brno) of the metres right
const STREET = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|pedestrian|road)(_link)?$/;
// frame: derive.js localFrame of the cut (its centre is [0, 0]); dir: the street's direction in it; way: the clicked
// OSM way; st: laneImage's image (null or blank: the kerbs where OSM expects them). Returns the polygons (as derive.js
// mtvuPolygons, with .kerbs and .image: whether the orthophoto found a kerb) or null.
// edges: lines of a town's technical map ([[lon, lat], …]), towns/slovensko.js: candidates for the kerbs and the outer
// edge of a sidewalk.
// widths: centre lines of roads with their width (ZBGIS Cesta, towns/slovensko.js: { path, w }): where one crosses the
// cut by the street's axis it gives the carriageway OSM would only guess (no width tag).
// areas: surfaces of a national map beside the street (ZBGIS car parks and lawns: MTVU features in WGS 84), after the
// carriageway and the houses, before OSM's green; not one under the axis (a lawn the street crosses on the map).
export function orthoOsmPolys({ osm, frame, dir, way, st, mapRuns = [], edges = [], widths = [], areas = [] }) {
  if (!way || !STREET.test(way.tags?.highway || "")) return null;
  const normal = [-dir[1], dir[0]];
  const tu = (lon, lat) => { const [x, y] = frame.toXY(lon, lat); return [x * normal[0] + y * normal[1], x * dir[0] + y * dir[1]]; };
  const xy = (t, u) => [normal[0] * t + dir[0] * u, normal[1] * t + dir[1] * u];
  const o = osmAlong(osm?.elements, tu, way.id);
  if (!o.own) return null;
  // Where the map's lines cross the cut (t), on the cut's line and a metre either side (a line may end just at it).
  const edgeT = [...new Set(edges.flatMap((path) => [0, -1, 1].flatMap((u0) => crossT(path.map(([lo, la]) => tu(lo, la)), 45, u0).map((x) => Math.round(x.t * 20) / 20))))].sort((a, b) => a - b);
  const pair = partnerOf(o);
  if (pair) o.pairId = pair.id;
  // A road's width from the national map (ZBGIS) where its centre line crosses the cut within 4 m of the axis.
  const widthT = widths.flatMap(({ path, w }) => crossT(path.map(([lo, la]) => tu(lo, la)), 45).map((x) => ({ t: x.t, w })));
  const mapWidth = (rd, axis) => {
    if (rd.from === "width") return rd;
    const c = widthT.filter((x) => Math.abs(x.t - axis) < 4 && x.w >= 2.5 && x.w <= 30).sort((a, b) => Math.abs(a.t - axis) - Math.abs(b.t - axis))[0];
    if (!c) return rd;
    const reach = { A: Math.max(1, axis - (c.t - c.w / 2)), B: Math.max(1, c.t + c.w / 2 - axis) };
    return { ...rd, w: reach.A + reach.B, reach, from: "zbgis" };
  };
  const road = withRails(mapWidth(osmRoad(o.own), o.own.t), o), k = kerbsOnImage(st, o, road, mapRuns, edgeT);
  if (!Number.isFinite(k.A) || !Number.isFinite(k.B) || k.B - k.A < 2) return null;
  // The other carriageway, its side (pSide) and the clicked one's kerb towards it.
  let k2 = null, road2 = null, pSide = null;
  if (pair) {
    const o2 = { ...o, own: pair, ways: [...o.ways.filter((w) => w !== pair), o.own], pairId: o.own.id };
    road2 = withRails(mapWidth(osmRoad(pair), pair.t), o2);
    k2 = kerbsOnImage(st, o2, road2, mapRuns, edgeT);
    pSide = pair.t < o.own.t ? "A" : "B";
    const inner = k2[pSide === "A" ? "B" : "A"];
    if (!Number.isFinite(k2.A) || !Number.isFinite(k2.B) || k2.B - k2.A < 2 || (pSide === "A" ? inner > k.A : inner < k.B)) k2 = null;
  }
  const bboxOf = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  const rect = (code, label, s, e) => { const ring = [xy(s, -ALONG), xy(e, -ALONG), xy(e, ALONG), xy(s, ALONG), xy(s, -ALONG)]; return { code, label, guess: true, orthoOsm: true, rings: [ring], bbox: bboxOf(ring) }; };
  // The order is the priority (derive.js classify takes the first polygon containing a point): the carriageway, the
  // OSM buildings, OSM's green areas, water and allotments, then the sidewalks and the rest up to the houses. A house in
  // a park stays a house; where OSM has a lawn beside the street it is greenery; water and allotments end the profile.
  const polys = [rect(701, "vozovka (ortofoto a OSM)", k.A, k.B)];
  if (k2) polys.push(rect(701, "vozovka (ortofoto a OSM)", k2.A, k2.B));
  for (const { el } of o.outlines) {
    const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
    polys.push({ code: 601, label: "budova (OSM)", rings, bbox: bboxOf(rings[0]) });
  }
  polys.areas = 0;
  for (const f of areas) {
    const rings = (f.geometry?.rings || []).map((r) => r.map(([lo, la]) => frame.toXY(lo, la)));
    if (!rings.length) continue;
    const under = rings.some((r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > 0 !== yj > 0 && 0 < ((xj - xi) * (0 - yi)) / (yj - yi) + xi) c = !c; } return c; });
    if (under) continue;
    polys.push({ code: f.attributes.CTVUK_KOD, label: f.attributes.CTVUK_POPIS, rings, bbox: bboxOf(rings[0]) });
    polys.areas++;
  }
  for (const el of o.greens) {
    const rings = [el.geometry, ...(el.holes || [])].map((r) => r.map((g) => frame.toXY(g.lon, g.lat)));
    const [code, label] = GREEN(el.tags) ? [401, "zeleň (OSM)"] : ["allotments", "cemetery"].includes(el.tags.landuse) ? [300, "zahrady (OSM)"] : [501, "voda (OSM)"];
    polys.push({ code, label, guess: true, orthoOsm: true, rings, bbox: bboxOf(rings[0]) });
  }
  // A stretch without a sidewalk (past SIDEWALK_MAX, or all of it where OSM says there is none): greenery where the image
  // is mostly green, a paved area up to REST_MAX m, else nothing (the profile ends: a yard, a field, a plot of its own).
  const rest = (a, b) => {
    const g = [];
    if (k.cols) for (let i = k.cols.ti(a); i < k.cols.ti(b); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]);
    if (g.length && g.reduce((x, y) => x + y, 0) / g.length >= GREEN_AREA) polys.push(rect(401, "zeleň (ortofoto)", a, b));
    else if (b - a <= REST_MAX) polys.push(rect(1003, "plocha před domem (odhad)", a, b));
  };
  let edgeUsed = k.why.A === "mapa" || k.why.B === "mapa" || (k2 && (k2.why.A === "mapa" || k2.why.B === "mapa"));
  // The median between the two carriageways: greenery where the image is mostly green, else a paved strip.
  if (k2) {
    const [a, b] = pSide === "A" ? [k2.B, k.A] : [k.B, k2.A];
    if (b - a >= 0.3) {
      const g = [];
      if (k.cols) for (let i = k.cols.ti(a); i < k.cols.ti(b); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]);
      polys.push(g.length && g.reduce((x, y) => x + y, 0) / g.length >= GREEN_AREA ? rect(401, "zeleň (ortofoto)", a, b) : rect(1003, "dělicí pás (odhad)", a, b));
    }
  }
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    // Beyond the other carriageway its kerb and its sidewalk tags count.
    const out = k2 && side === pSide, rd = out ? road2 : road;
    const kerb = out ? k2[side] : k[side], f = o.facade[side], says = rd.sidewalk[side];
    const far = f !== null ? f : says === "no" ? null : says || rd.sidewalkW[side] ? kerb + sg * (rd.sidewalkW[side] || SIDEWALK) : null;
    if (far === null || sg * (far - kerb) < 0.3) continue;
    const span = (x, y) => (sg < 0 ? [y, x] : [x, y]);
    // A sidewalk of at most SIDEWALK_MAX; the rest up to the house is some other area (a front garden, a yard, a lawn:
    // MTVU in Prague and Brno: 34 of 42 such stretches over 6 m hold a sidewalk of at most 6 m).
    let swEnd = says === "no" ? kerb : Math.abs(far - kerb) > SIDEWALK_MAX ? kerb + sg * SIDEWALK_MAX : far;
    // A line of the map across the sidewalk (its edge against green or a front garden; not the house's own front)
    // ends it there.
    if (swEnd !== kerb) {
      const cut = edgeT.filter((t) => sg * (t - kerb) >= 1 && sg * (swEnd - t) > 0 && Math.abs(far - t) > 0.5).sort((x, y) => sg * (x - y))[0];
      if (cut !== undefined) { swEnd = cut; edgeUsed = true; }
    }
    if (swEnd !== kerb) polys.push(rect(702, "chodník (ortofoto a OSM)", ...span(kerb, swEnd)));
    if (swEnd !== far) rest(...span(swEnd, far));
    // A house found only beside the cut (on a line u ≠ 0): its front drawn across the cut, so the profile ends at it.
    if (f !== null && o.facadeU[side] !== 0) polys.push({ ...rect(601, "budova (OSM, vedle řezu)", ...span(far, far + sg * HOUSE)), guess: false });
  }
  // Whether a line of the town's map decided a kerb or a sidewalk's edge (the credits).
  polys.edges = !!edgeUsed;
  polys.widthFrom = road.from;
  polys.kerbs = { A: k.A, B: k.B, why: k.why, ...(k2 && { pair: { A: k2.A, B: k2.B, why: k2.why } }) };
  // Whether the orthophoto decided anything (a kerb found on it); else the kerbs are OSM's (the status says so).
  polys.image = k.image;
  return polys;
}
