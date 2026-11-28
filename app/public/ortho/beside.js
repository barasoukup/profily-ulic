import { crossT, osmAlong } from "./osm-along.js";
import { columns, greenValues, meanOf } from "./columns.js";
import { P } from "./settings.js";
import { AI_RUN, ALONG, GREEN_AREA, HOUSE, PIECE_GREEN, SIDEWALK_MAX, SYMBOL_LABEL } from "./measures.js";
import { OSM_SIDEWALK } from "./road-tags.js";
import { facadeStrip } from "./facade.js";

// ---------- beyond a town's passport (Slovakia) ----------
// A passport keeps only the roads a town maintains: its sidewalk or square may end metres short of the houses (Poštová
// in Bratislava: the paving between its tree rows and the hotel; 17. novembra in Prešov: a gap before the house, the
// sidewalk on the other side missing). On each side, from the axis up to the nearest end (a house of the surfaces or of
// OSM, an OSM fence or wall, the far side of a separately mapped OSM sidewalk), every stretch no surface covers gets
// pieces, only where that end lies within BESIDE_MAX of the last surface (no end: the profile ends as before; Bára,
// Tranovského: no sidewalk laid over a lawn up to a far house). The pieces between the lines of the town's map are a
// sidewalk or green by the map's symbol, else by the image (against the green at the axis); an OSM sidewalk is a
// sidewalk; a stretch without lines wider than SIDEWALK_MAX a sidewalk by the street and the rest green or paving by
// the image. All an estimate. polys: the surfaces as derive.js takes them (frame XY). P.off "beside": off (the A/B).
const BESIDE_MAX = 15, WALK_REACH = 8, BESIDE_GREEN = 0.22, BARRIER = (t) => ["fence", "wall", "retaining_wall", "hedge"].includes(t.barrier);
const inRing = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const ZB_LABEL = { 401: "zeleň (ZBGIS)", 704: "parkoviště (ZBGIS)" };
const STEP = 0.1;

// max: how far beyond the last surface the end may lie (countries/<ISO>.js besideMax; Germany 25 m for Aachen's front
// gardens of 15–18 m, A/B of 17. 11. 2026; else BESIDE_MAX).
// aiSurf: the model's kinds across the cut (ai-kerbs.js aiSurface: t → "chodník", "zeleň", "vozovka", "budova", "jiné" or
// null), where it read the orthophoto: the pieces take its kinds as the estimate's sidewalks and front gardens do without
// the map (Bára 24. 11. 2026, evaluation/finland/ab3: Helsinki's gardens beyond YLRE were "plocha (odhad)", the image's
// green share there is near nil; the model told them). ?off=mapfill: as before (also the house beside the cut below).
export function besidePassport({ osm, frame, dir, way, st, edges = [], symbols = [], areas = [], polys = [], max = BESIDE_MAX, aiSurf = null }) {
  // Not beside a motorway or an expressway (R1 in Banská Bystrica: a sidewalk up to a hall across the ditch).
  if (P.off?.has("beside") || !way || /^(motorway|trunk)/.test(way.tags?.highway || "")) return [];
  const bx = openBeside({ osm, frame, dir, way, st, edges, symbols, areas, polys, max, aiSurf });
  if (!bx) return [];
  for (const [side, sg] of [["A", -1], ["B", 1]]) besideSide(bx, side, sg);
  return bx.out;
}

// What the cut has before any piece is made: what OSM has along it, what the surfaces have at a t (at), the image's green share
// (greenOf), the national map's areas (zbAt), the model's reading (model, mapWalks).
function openBeside({ osm, frame, dir, way, st, edges, symbols, areas, polys, max, aiSurf }) {
  const normal = [-dir[1], dir[0]];
  const tu = (lon, lat) => { const [x, y] = frame.toXY(lon, lat); return [x * normal[0] + y * normal[1], x * dir[0] + y * dir[1]]; };
  const xy = (t, u) => [normal[0] * t + dir[0] * u, normal[1] * t + dir[1] * u];
  const o = osmAlong(osm?.elements, tu, way.id);
  if (!o.own) return null;
  // What the surfaces have at t on the cut: "house", the surface's code or null.
  const at = (t) => {
    const [x, y] = xy(t, 0);
    for (const p of polys) {
      const b = p.bbox;
      if (b && (x < b[0] || x > b[2] || y < b[1] || y > b[3])) continue;
      if (!p.rings?.length || !inRing(p.rings[0], x, y) || p.rings.slice(1).some((h) => inRing(h, x, y))) continue;
      return p.code === 601 ? "house" : p.code;
    }
    return null;
  };
  const cols = st && st.nt ? columns(st) : null;
  const greenOf = (a, b) => { const g = greenValues(cols, a, b); return g.length ? meanOf(g) : NaN; };
  const axisGreen = greenOf(o.own.t - 1.5, o.own.t + 1.5) || 0;
  const edgeT = [...new Set(edges.flatMap((path) => [0, -1, 1].flatMap((u0) => crossT(path.map(([lo, la]) => tu(lo, la)), 45, u0).map((x) => Math.round(x.t * 20) / 20))))];
  const symT = symbols.map((p) => { const [t, u] = tu(p.x, p.y); return { t, u, code: p.code }; }).filter((p) => Math.abs(p.u) < 15);
  const symbolAt = (a, b) => { const n = new Map(); for (const p of symT) if (p.t > a && p.t < b) n.set(p.code, (n.get(p.code) || 0) + 1); return n.size ? [...n].sort((x, y) => y[1] - x[1])[0][0] : null; };
  const bboxOf = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  const rect = (code, label, s, e) => { const ring = [xy(s, -ALONG), xy(e, -ALONG), xy(e, ALONG), xy(s, ALONG), xy(s, -ALONG)]; return { code, label, guess: true, orthoOsm: true, rings: [ring], bbox: bboxOf(ring), span: [Math.min(s, e), Math.max(s, e)] }; };
  // The national map's lawns and car parks (ZBGIS, towns/slovakia.js) say what a piece is where they cover its middle
  // (front gardens: their image is as green as the paving, 0.12–0.32 against 0.04–0.20).
  const zb = areas.map((f) => ({ code: f.attributes?.CTVUK_KOD, rings: (f.geometry?.rings || []).map((r) => r.map(([lo, la]) => frame.toXY(lo, la))) })).filter((f) => f.rings.length);
  const zbAt = (t) => { const [x, y] = xy(t, 0); return zb.find((f) => inRing(f.rings[0], x, y))?.code ?? null; };
  const out = [];
  // Which sources a piece took (the credits of the cut: the town's map lines or symbols, ZBGIS, the image).
  out.used = { edges: false, zbgis: false, image: false };
  const model = !!aiSurf && !P.off?.has("mapfill");
  // A street the surfaces draw without any sidewalk or cycle track across the cut (a narrow lane between lawns,
  // Runoilijanpolku in Helsinki) gets none from the model either: what it reads there as a sidewalk is the lane's edge.
  const mapWalks = model && (() => { for (let t = o.own.t - 30; t <= o.own.t + 30; t += 0.25) if ([702, 703].includes(at(t))) return true; return false; })();
  return { o, at, greenOf, axisGreen, edgeT, symbolAt, rect, zbAt, out, model, mapWalks, aiSurf, max };
}

// A piece [a, b]; near: its end towards the street (a wide one keeps its sidewalk there); walk: whether it may be a
// sidewalk (the side has none yet: beyond a passport's sidewalk the rest is a front garden or a paved area, not a
// second sidewalk; Bára, Tranovského). Returns whether it took the side's sidewalk.
function pieceOf(bx, a, b, near, walk) {
  const { greenOf, axisGreen, symbolAt, rect, zbAt, out, model } = bx;
  const sym = symbolAt(a, b);
  if (SYMBOL_LABEL[sym]) { out.push({ ...rect(sym, SYMBOL_LABEL[sym], a, b), guess: false }); out.used.edges = true; return sym === 702; }
  const z = zbAt((a + b) / 2);
  if (ZB_LABEL[z]) { out.push(rect(z, ZB_LABEL[z], a, b)); out.used.zbgis = true; return false; }
  if (model) return piecesByModel(bx, a, b, near, walk);
  const g = greenOf(a, b);
  if (Number.isFinite(g)) out.used.image = true;
  const green = Number.isFinite(g) && g >= Math.min(BESIDE_GREEN, PIECE_GREEN + axisGreen);
  if (green) { out.push(rect(401, "zeleň (ortofoto)", a, b)); return false; }
  if (!walk) { out.push(rect(1003, "plocha před domem (odhad)", a, b)); return false; }
  if (b - a <= SIDEWALK_MAX) { out.push(rect(702, "chodník (ortofoto a OSM)", a, b)); return true; }
  const [s0, s1] = near === a ? [a, a + SIDEWALK_MAX] : [b - SIDEWALK_MAX, b];
  out.push(rect(702, "chodník (ortofoto a OSM)", s0, s1));
  const [r0, r1] = s0 === a ? [s1, b] : [a, s0], gr = greenOf(r0, r1);
  out.push(Number.isFinite(gr) && gr >= GREEN_AREA ? rect(401, "zeleň (ortofoto)", r0, r1) : rect(1003, "plocha před domem (odhad)", r0, r1));
  return true;
}

// The model's runs over [a, b] (from the street out), each at least AI_RUN (a shorter one joins its neighbour).
function runsOf(bx, a, b) {
  const { aiSurf } = bx;
  const runs = [];
  for (let t = a + 0.1; t < b; t += 0.2) { const k = aiSurf(t), c = k === "chodník" ? 702 : k === "zeleň" ? 401 : k ? 1003 : runs.at(-1)?.c ?? 1003; const l = runs.at(-1); if (l && l.c === c) l.e = Math.min(b, t + 0.1); else runs.push({ c, s: Math.max(a, t - 0.1), e: Math.min(b, t + 0.1) }); }
  for (let q = 0; q < runs.length; q++) if (runs.length > 1 && runs[q].e - runs[q].s < AI_RUN) { const nb = q > 0 ? q - 1 : q + 1; runs[nb].s = Math.min(runs[nb].s, runs[q].s); runs[nb].e = Math.max(runs[nb].e, runs[q].e); runs.splice(q, 1); q = -1; }
  if (runs.length) { runs[0].s = a; runs.at(-1).e = b; }
  return runs;
}

// The model's runs over [a, b] (from the street out), each at least AI_RUN (a shorter one joins its neighbour): a
// sidewalk only where the side has none yet, its first run (behind a car park too), at most SIDEWALK_MAX of it (as the
// estimate's aiWalkCap), the rest a paved area (another run of sidewalk: green or paving by the image's green share, as
// without the model); green as green; a roadway, a house's roof or anything else as a paved area (the
// surfaces and OSM's houses decide those).
function piecesByModel(bx, a, b, near, walk) {
  const { greenOf, axisGreen, rect, out, mapWalks } = bx;
  out.used.image = true;
  walk = walk && mapWalks;
  const runs = runsOf(bx, a, b), from = near === a ? 1 : -1;
  if (from < 0) runs.reverse();
  let took = false;
  for (const r of runs) {
    if (r.c === 702 && walk && !took) {
      const cap = from > 0 ? [r.s, Math.min(r.e, r.s + SIDEWALK_MAX)] : [Math.max(r.s, r.e - SIDEWALK_MAX), r.e];
      out.push(rect(702, "chodník (AI)", ...cap));
      if (cap[1] - cap[0] < r.e - r.s - 0.05) out.push(from > 0 ? rect(1003, "plocha před domem (AI)", cap[1], r.e) : rect(1003, "plocha před domem (AI)", r.s, cap[0]));
      took = true;
      continue;
    }
    // A sidewalk the side may not take: the image's green share decides, as without the model.
    if (r.c === 702) { const g = greenOf(r.s, r.e); out.push(Number.isFinite(g) && g >= Math.min(BESIDE_GREEN, PIECE_GREEN + axisGreen) ? rect(401, "zeleň (ortofoto)", r.s, r.e) : rect(1003, "plocha před domem (odhad)", r.s, r.e)); continue; }
    out.push(r.c === 401 ? rect(401, "zeleň (AI)", r.s, r.e) : rect(1003, "plocha před domem (AI)", r.s, r.e));
  }
  return took;
}

// Where the end lies farther than max (a house 30 m off across a car park and a lawn), with the model: the side goes
// on to the far edge of the first sidewalk the model reads within WALK_REACH of the map's last surface, else as before
// (Maasälväntie in Helsinki: the sidewalk behind perpendicular parking was missing).
function walkBeyond(bx, last, sg) {
  const { model, mapWalks, aiSurf } = bx;
  if (!model || !mapWalks) return null;
  let on = null;
  for (let d = 0.1; d < WALK_REACH + SIDEWALK_MAX; d += 0.2) {
    const t = last + sg * d, k = aiSurf(t);
    if (k === null) break;
    if (k === "chodník") { if (on === null) { if (d > WALK_REACH) break; on = d; } }
    else if (on !== null) { if (d - on >= AI_RUN) return last + sg * d; on = null; }
  }
  return on !== null && WALK_REACH + SIDEWALK_MAX - on >= AI_RUN ? last + sg * (WALK_REACH + SIDEWALK_MAX) : null;
}

// One side of the cut: the stretches nothing covers between the street and the end (a house, a wall, an OSM sidewalk) become pieces.
function besideSide(bx, side, sg) {
  const { o, at, rect, out } = bx;
  // The surfaces along the cut from the axis out: the first house, the last covered t before it.
  let house = null, last = o.own.t;
  for (let t = o.own.t; Math.abs(t - o.own.t) < 40; t += sg * STEP) {
    const k = at(t);
    if (k === "house") { house = t; break; }
    if (k) last = t;
  }
  // Whether the surfaces have a sidewalk on this side already (a passport's sidewalk, footway or square).
  let walked = false;
  for (let t = o.own.t; sg * (last - t) >= 0; t += sg * STEP) if ([702, 703].includes(at(t))) { walked = true; break; }
  const before = out.length;
  const end = endOfSide(bx, side, sg, last, house);
  if (!end) return;
  const { to, farEnd, walks } = end;
  // The OSM sidewalk before the end: 2 m about its line.
  const walk = walks.filter((w) => sg * (to - w.t) >= 0).sort((a, b) => sg * (a.t - b.t))[0];
  const walkAt = walk ? [walk.t - 1, walk.t + 1] : null;
  fillGaps(bx, sg, gapsToEnd(bx, sg, to), walkAt, walked);
  // A strip of paving up to FACADE_STRIP wide between a sidewalk and the house it ends at is the sidewalk's own (the
  // house's outline drawn a little off the map's sidewalk: Rue des Tournelles in Paris 0.65 m, Helsinki's YLRE; Bára
  // 26. 11. 2026, evaluation/archive/facade-strip).
  if (!farEnd && (to === house || to === o.facade[side]) && out.length > before) facadeStrip(out, before, to, sg, at);
  // The house found beside the cut only: its front across the cut, the profile ends at it.
  // With ?off=mapfill only where the surfaces have no house farther on (Tammitie in Helsinki: OSM's house beside the
  // cut stood nearer than the city's outline across it, the profile ran on past it as "neurčeno").
  if (!farEnd && out.length > before && to === o.facade[side] && (house === null || (!P.off?.has("mapfill") && sg * (house - to) > 0.3)) && o.facadeU[side] !== 0) out.push({ ...rect(601, "budova (OSM, vedle řezu)", ...(sg < 0 ? [to - HOUSE, to] : [to, to + HOUSE])), guess: false });
}

// Where the side ends (a house, a fence or wall, an OSM sidewalk) and which OSM sidewalks lie before it; null: no end within reach.
function endOfSide(bx, side, sg, last, house) {
  const { o, max } = bx;
  const walks = o.ways.filter((w) => OSM_SIDEWALK(w.tags) && sg * (w.t - last) > 0.3);
  const ends = [house, o.facade[side], ...o.ways.filter((w) => BARRIER(w.tags) && sg * (w.t - o.own.t) > 0.3).map((w) => w.t), ...walks.map((w) => w.t + sg * 1)]
    .filter((x) => x !== null && x !== undefined && sg * (x - o.own.t) > 0.3);
  if (!ends.length) return null;
  let to = ends.reduce((a, b) => (sg * (b - a) < 0 ? b : a)), farEnd = false;
  if (sg * (to - last) > max) {
    const w = walkBeyond(bx, last, sg);
    if (w === null || sg * (to - w) < 0) return null;
    to = w; farEnd = true;
  }
  return { to, farEnd, walks };
}

// The stretches nothing covers between the axis and the end.
function gapsToEnd(bx, sg, to) {
  const { o, at } = bx;
  const gaps = [];
  let g0 = null;
  for (let t = o.own.t; sg * (to - t) > 0; t += sg * STEP) {
    const free = !at(t);
    if (free && g0 === null) g0 = t;
    if (!free && g0 !== null) { gaps.push([g0, t]); g0 = null; }
  }
  if (g0 !== null) gaps.push([g0, to]);
  return gaps;
}

// From the street out (the gaps nearest first); walked: whether the surfaces have a sidewalk on this side already.
function fillGaps(bx, sg, gaps, walkAt, walked) {
  const { edgeT, rect, out } = bx;
  for (const [p, q] of gaps) {
    if (Math.abs(q - p) < 0.3) continue;
    const [a, b] = sg < 0 ? [q, p] : [p, q];
    const lines = edgeT.filter((t) => t - a >= 0.5 && b - t >= 0.5);
    if (lines.length) out.used.edges = true;
    const stops = [a, ...lines, ...(walkAt ? walkAt.filter((t) => t - a >= 0.3 && b - t >= 0.3) : []), b].sort((x, y) => x - y);
    const order = [...Array(stops.length - 1).keys()];
    if (sg < 0) order.reverse();
    for (const n of order) {
      const [s, e] = [stops[n], stops[n + 1]];
      if (walkAt && s >= walkAt[0] - 0.01 && e <= walkAt[1] + 0.01) { out.push(rect(702, "chodník (OSM)", s, e)); walked = true; continue; }
      if (pieceOf(bx, s, e, sg < 0 ? e : s, !walked && !walkAt)) walked = true;
    }
  }

}
