// From polygons to runs along the cut: classify, merge, cap and split them; the orthophoto's look of a surface.
import { inside } from "./geometry.js";
import { OSM_PARKING, isTskParking } from "./polygons.js";
import { MINOR } from "./tags.js";

const STEP = 0.05; // sampling step along the cut (m)
const MIN_RUN = 0.3; // runs narrower than this merge into a neighbour (m)

// Classify the cut: list of runs {code, s, e} with s < e in metres along the normal (+ = left of way).
export function classify(center, normal, half, polys) {
  const runs = [];
  for (let t = -half; t <= half + 1e-9; t += STEP) {
    const x = center[0] + normal[0] * t, y = center[1] + normal[1] * t;
    let code = null, orient, use, guess, carved, weak = null;
    for (const p of polys) {
      const [x0, y0, x1, y1] = p.bbox;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      // An OSM building the map lacks: it takes the place of what is open (paving, yard, green), not of a road, a
      // sidewalk, a tram bed or a stall (withOsmBuildings).
      if (p.osmBuilding) { if (!weak && inside(p.rings, x, y)) weak = p; continue; }
      if (inside(p.rings, x, y)) { code = p.code; orient = p.orient; use = p.use; guess = p.guess; carved = p.carvedTrack; break; }
    }
    if (weak && (code === null || !(code >= 700 && code <= 705) && !(code >= 9700 && code < 9800))) { code = weak.code; orient = use = guess = carved = undefined; }
    const last = runs[runs.length - 1];
    if (last && last.code === code && !!last.guess === !!guess) last.e = t + STEP / 2;
    else runs.push({ code, orient, use, guess, s: t - STEP / 2, e: t + STEP / 2, ...(carved && { carved: true }) });
  }
  runs[0].s = -half;
  runs[runs.length - 1].e = half;
  return runs;
}

export function mergeTiny(runs) {
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      if (r.e - r.s >= MIN_RUN || runs.length === 1) continue;
      const prev = runs[i - 1], next = runs[i + 1];
      const target = !prev ? next : !next ? prev : prev.e - prev.s >= next.e - next.s ? prev : next;
      target.s = Math.min(target.s, r.s);
      target.e = Math.max(target.e, r.e);
      runs.splice(i, 1);
      changed = true;
      break;
    }
    for (let i = 0; i < runs.length - 1; i++) {
      if (runs[i].code === runs[i + 1].code) {
        runs[i].e = runs[i + 1].e;
        runs.splice(i + 1, 1);
        changed = true;
        break;
      }
    }
  }
  return runs;
}

// A parallel bay of OSM (parking=lane) is drawn roughly: its area may be 3.9 m deep over a lane (Klánovická) and would
// make a stall wider than a car. The bay keeps PARALLEL_BAY_MAX at its outer edge (the side away from the street's axis);
// the rest, towards the axis, goes to the roadway beside it, or is one of its own (a guess).
const PARALLEL_BAY_MAX = 2.5; // m (a car 1.8 m with room for doors: 2.0 to 2.5)
export function capParallelBay(runs, axisT) {
  const out = [];
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    if (r.code !== OSM_PARKING || r.orient !== "podelne" || r.e - r.s <= PARALLEL_BAY_MAX + 0.3) { out.push(r); continue; }
    const inner = axisT < r.s ? "s" : axisT > r.e ? "e" : null;
    if (!inner) { out.push(r); continue; }
    const cut = inner === "s" ? r.e - PARALLEL_BAY_MAX : r.s + PARALLEL_BAY_MAX;
    const rest = inner === "s" ? { code: 701, guess: true, s: r.s, e: cut } : { code: 701, guess: true, s: cut, e: r.e };
    const bay = { ...r, ...(inner === "s" ? { s: cut } : { e: cut }) };
    const near = inner === "s" ? out[out.length - 1] : runs[i + 1];
    const road = (x) => x && (x.code === 700 || x.code === 701);
    if (road(near)) { if (inner === "s") near.e = cut; else near.s = cut; out.push(bay); }
    else if (inner === "s") out.push(rest, bay); else out.push(bay, rest);
  }
  // (a roadway run of the next iteration was widened in place: its own turn comes later with its new start)
  return out;
}

// OSM parking areas and MTVU curbs rarely line up exactly; narrow roadway or sidewalk
// strips left next to a parking bay belong to the bay.
export function absorbParkingSlivers(runs) {
  const sliver = (r) => ((r.code === 701 || r.code === 700) && r.e - r.s < 1.2) || (r.code === 702 && r.e - r.s < 0.6);
  const bay = (r) => r?.code === OSM_PARKING || isTskParking(r?.code);
  for (let i = 0; i < runs.length; i++) {
    const near = bay(runs[i - 1]) ? runs[i - 1] : bay(runs[i + 1]) ? runs[i + 1] : null;
    if (near && sliver(runs[i])) runs[i].code = near.code;
  }
  return mergeTiny(runs);
}

export const MEDIAN = 9950;
const MEDIAN_W = 0.6; // width of a median with a guard rail (m)

// MTVU draws both carriageways and the guard rail between them as one roadway: a guard rail
// with a road axis on each side splits the run and becomes a narrow median.
export function splitMedians(runs, cross, rails) {
  const out = [];
  for (const r of runs) {
    if (r.code !== 701 && r.code !== 700) { out.push(r); continue; }
    const axes = cross.filter((c) => c.t > r.s && c.t < r.e && c.way.tags?.highway && !MINOR.has(c.way.tags.highway));
    let s = r.s;
    for (const t of [...rails].sort((a, b) => a - b)) {
      if (t - s < 2.5 || r.e - t < 2.5) continue;
      if (!axes.some((c) => c.t > s && c.t < t) || !axes.some((c) => c.t > t && c.t < r.e)) continue;
      out.push({ ...r, s, e: t - MEDIAN_W / 2 }, { ...r, code: MEDIAN, s: t - MEDIAN_W / 2, e: t + MEDIAN_W / 2 });
      s = t + MEDIAN_W / 2;
    }
    out.push({ ...r, s });
  }
  return out;
}

// Main entry: returns {segments (screen left → right), edges, runs}.
// Pieces read from the DTM's lines beside a roadway (dmvs.js fromLines) are sidewalks or verges: the lines do
// not tell (Bára 12. 11. 2026; Kolín, Mladá Boleslav: the grass verges and ditches of a road in the fields are
// pieces between "boundaries of a transport area" as well). A side has a sidewalk where OSM says so (sidewalk,
// sidewalk:<side>; "separate" is one drawn apart, still there), none where it says no; without a tag where the
// street is built up: a building within BUILT_NEAR m on that side and no speed over 50. The piece nearest the
// roadway is then the sidewalk, the others are green (estimates all).
// With the orthophoto of the click (lanes-ortho.js laneImage st) the colour decides first (Bára 12. 11. 2026): a
// piece that is green, or yellow as the dry grass of ČÚZK's summer images (Kolín: the verges of a road in the
// fields), is green; a grey, light and even one (asphalt, concrete paving) a sidewalk: paving between two boundaries
// of a transport area beside the roadway; only where the colour is unclear (red paving, the shade of trees, a mix)
// the nearest-piece rule stays. Means over the piece, measured on 50 cuts of Kolín and Mladá Boleslav: green grass
// G 10–14, dry grass Y 23–26, paving G 0–5, Y −1–18, brightness L 110–220 and its spread SD 2–28; the deep shade
// of trees L 81 (Mladá Boleslav, Revoluční: no sidewalk there, Bára), their dappled shade on a verge SD 42 (Kolín, Osecká).
const BUILT_NEAR = 30, LOOK_ALONG = 8;
const looksGreen = (m) => m.G > 8 || (m.Y > 20 && m.D > -25);
const looksPaved = (m) => m.G < 6 && m.Y < 19 && m.D > -25 && m.L > 100 && m.SD < 35;
// "green", "paved" or null (no image, too narrow, unclear): the means of a piece on the orthophoto (rows along the
// street within ±LOOK_ALONG m, its stretch of the cut less 0.25 m at each edge).
export function surfaceLook(st, rings, center, normal) {
  if (!st?.G || !st.Y) return null;
  let lo = Infinity, hi = -Infinity;
  for (let t = st.t0; t <= st.t0 + st.nt * st.res; t += 0.1) {
    if (inside(rings, center[0] + normal[0] * t, center[1] + normal[1] * t)) { lo = Math.min(lo, t); hi = Math.max(hi, t); }
  }
  lo += 0.25; hi -= 0.25;
  if (!(hi - lo >= 0.3)) return null;
  const half = st.nu / 2, rows = Math.round(LOOK_ALONG / st.res), m = { G: 0, Y: 0, D: 0, L: 0, LL: 0 };
  let n = 0;
  for (let i = Math.ceil((lo - st.t0) / st.res); i <= Math.floor((hi - st.t0) / st.res); i++) {
    for (let j = Math.max(0, Math.floor(half - rows)); j < Math.min(st.nu, half + rows); j++) {
      const k = j * st.nt + i;
      if (Number.isNaN(st.G[k])) continue;
      m.G += st.G[k]; m.Y += st.Y[k]; m.D += st.D[k]; m.L += st.L[k]; m.LL += st.L[k] * st.L[k]; n++;
    }
  }
  if (!n) return null;
  for (const c of "GYDL") m[c] /= n;
  m.SD = Math.sqrt(Math.max(0, m.LL / n - m.L * m.L)); // how even its brightness is: paving even, dappled shade not
  return looksGreen(m) ? "green" : looksPaved(m) ? "paved" : null;
}
// along: the way's geometry runs along the cut's direction (OSM's left is then the cut's left, +normal); after
// "Otočit" or a link from the other side it runs against it (Fable's review).
export function linePieces(polys, tags, center, normal, st = null, along = true) {
  const pieces = polys.filter((p) => p.fromLines && p.code === 702);
  if (!pieces.length) return polys;
  const off = (p) => ((p.bbox[0] + p.bbox[2]) / 2 - center[0]) * normal[0] + ((p.bbox[1] + p.bbox[3]) / 2 - center[1]) * normal[1];
  const says = (cutSide) => {
    const side = along ? cutSide : cutSide === "left" ? "right" : "left";
    const own = tags[`sidewalk:${side}`] ?? tags["sidewalk:both"];
    if (own) return !["no", "none"].includes(own);
    const s = tags.sidewalk;
    if (!s) return undefined;
    if (["both", "yes", "separate"].includes(s)) return true;
    if (["no", "none"].includes(s)) return false;
    return s === side;
  };
  const fast = parseInt(tags.maxspeed, 10) > 50;
  const built = (sign) => !fast && polys.some((p) => p.code === 601 && off(p) * sign > 0 && Math.abs(off(p)) < BUILT_NEAR);
  const code = new Map();
  for (const [side, sign] of [["left", 1], ["right", -1]]) {
    const mine = pieces.filter((p) => off(p) * sign > 0).sort((a, b) => Math.abs(off(a)) - Math.abs(off(b)));
    const walk = says(side) ?? built(sign);
    const look = mine.map((p) => surfaceLook(st, p.rings, center, normal));
    let walked = false;
    mine.forEach((p, k) => {
      if (look[k] === "green") code.set(p, 401);
      else if (look[k] === "paved") { code.set(p, 702); walked = true; }
      // Unclear: the nearest piece a sidewalk where the side has one and none paved is seen.
      else if (!walk || walked || k > 0) code.set(p, 401);
      else walked = true;
    });
  }
  return polys.map((p) => (code.has(p) && code.get(p) !== p.code ? { ...p, code: code.get(p), label: "" } : p));
}
