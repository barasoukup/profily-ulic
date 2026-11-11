// Fitting the profile onto the orthophoto (Bára 11. 11. 2026: "napojení profilů zkus vyřešit, musí to jít").
// The profile's geometry is the surface map (MTVU / the city's map / ČÚZK's DTM, as runs across the cut); the
// image may lie a little elsewhere. Wanted: the shift d (m, across the cut) with image t = map t + d, and how sure
// it is. Methods:
//   r0  run.mjs align(): the steps of brightness (column medians) at the carriageway edges, 5 %/m penalty;
//   r1  edges first, then medians: per pixel the change of brightness across the street, its median per column
//       (cars and dashes do not count), against every boundary of the surface map (kerbs weigh 1, others 0.5);
//       sure when the best shift beats the best one at least 0.6 m away by RATIO;
//   r2  r1 also turned (±2°): a street whose direction OSM has a little off still fits.
// Independent tests: (a) the kerbs checked by eye (labels/obruby-<city>.json, oznac.mjs), (b) the two halves of
// the strip along the street fitted alone (they must agree), (c) two orthophotos (their own offset taken out).
//   CITY=praha node evaluation/ortofoto/napojeni.mjs   → data/<city>/napojeni.json, printed summary
import fs from "node:fs/promises";
import path from "node:path";
import { decodePng } from "../../pilot/public/dmvs.js";
import { ALL, strip, median, layout, align } from "./run.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITY = process.env.CITY || "praha";
const OUT = path.join(ROOT, "data", CITY);
const AB = path.join(ROOT, "..", CITY, "data", "ab-city-stejne");
const MAX = +process.env.MAX || 3, RATIO = 1.25, PAD = 3;
const KERB = (c) => c === 700 || c === 701 || c === 704 || (c >= 9700 && c < 9800); // as run.mjs CARRIAGE

// The map's boundaries across the cut: [{ t, w }] (a carriageway edge weighs 1, any other boundary 0.5).
export function boundaries(runs) {
  const out = [];
  for (let k = 1; k < (runs || []).length; k++) {
    const a = runs[k - 1], b = runs[k];
    if (Math.abs(b.s) >= 39.9 || a.code === b.code) continue;
    out.push({ t: b.s, w: KERB(a.code) !== KERB(b.code) ? 1 : 0.5 });
  }
  return out;
}

// Per column the median (over rows u ∈ [ua, ub]) of the brightness change across the street, at 0.1 m spacing.
function edgeProfile(st, ua = -20, ub = 20, tan = 0) {
  const { nt, nu, res, t0, L } = st, d = Math.max(1, Math.round(0.15 / res));
  const step = Math.max(1, Math.round(0.1 / res));
  const ja = Math.max(0, Math.floor((20 - ub) / res)), jb = Math.min(nu, Math.ceil((20 - ua) / res));
  const prof = [];
  for (let i = d; i < nt - d; i += step) {
    const v = [];
    for (let j = ja; j < jb; j += 2) {
      const u = 20 - (j + 0.5) * res, ii = i + Math.round((u * tan) / res);
      if (ii - d < 0 || ii + d >= nt) continue;
      const a = L[j * nt + ii - d], b = L[j * nt + ii + d];
      if (!Number.isNaN(a) && !Number.isNaN(b)) v.push(Math.abs(b - a));
    }
    prof.push({ t: t0 + (i + 0.5) * res, g: v.length ? median(v) : 0 });
  }
  return prof;
}
// The score of a shift: the weighted mean of the strongest edge within ±0.15 m of each boundary, over the
// profile's typical edge.
function fit(prof, bounds, maxShift = MAX) {
  if (!bounds.length || prof.length < 10) return null;
  const t0 = prof[0].t, dt = prof[1].t - prof[0].t, typical = median(prof.map((p) => p.g)) || 1;
  const at = (t) => { const i = Math.round((t - t0) / dt); let m = 0; for (let q = i - 1; q <= i + 1; q++) if (q >= 0 && q < prof.length) m = Math.max(m, prof[q].g); return m; };
  const W = bounds.reduce((a, b) => a + b.w, 0);
  const scores = [];
  for (let d = -maxShift; d <= maxShift + 1e-9; d += 0.05) scores.push({ d: +d.toFixed(2), s: bounds.reduce((a, b) => a + b.w * at(b.t + d), 0) / W / typical });
  const best = scores.reduce((a, b) => (b.s > a.s ? b : a));
  const other = scores.filter((x) => Math.abs(x.d - best.d) >= 0.6).reduce((a, b) => (b.s > a.s ? b : a), { s: 0 });
  return { d: best.d, score: +best.s.toFixed(2), ratio: +(best.s / (other.s || 1e-9)).toFixed(2), sure: best.s / (other.s || 1e-9) >= RATIO && best.s >= 1.5 };
}
export function r1(st, runs, ua, ub) { return fit(edgeProfile(st, ua, ub), boundaries(runs)); }
export function r2(st, runs) {
  let best = null;
  for (let deg = -2; deg <= 2 + 1e-9; deg += 0.5) {
    const f = fit(edgeProfile(st, -20, 20, Math.tan((deg * Math.PI) / 180)), boundaries(runs));
    if (f && (!best || f.score > best.score)) best = { ...f, deg };
  }
  return best;
}

async function loadImg(n, key, r) {
  const file = path.join(OUT, "img", key, `${n}.png`);
  try {
    const img = await decodePng(await fs.readFile(file)), bbox = JSON.parse(await fs.readFile(file + ".json", "utf8")).bbox;
    return strip(img, bbox, r.cut, r.a.extent[0] - PAD, r.a.extent[1] + PAD, ALL[key].res);
  } catch { return null; }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sources = Object.keys(ALL).filter((k) => !ALL[k].cities || ALL[k].cities.includes(CITY));
  const out = {};
  for (const f of (await fs.readdir(AB)).filter((f) => /^\d+\.json$/.test(f))) {
    const n = +f.slice(0, -5), r = JSON.parse(await fs.readFile(path.join(AB, f), "utf8"));
    if (!r.a?.runs || !r.a.extent) continue;
    const L = layout(r.a), row = {};
    for (const k of sources) {
      const st = await loadImg(n, k, r);
      if (!st) continue;
      const a0 = align(st, L.kerbs);
      row[k] = { r0: { d: a0.shift, sure: a0.fit >= 2 }, r1: r1(st, r.a.runs), r2: r2(st, r.a.runs), top: r1(st, r.a.runs, 0, 20), bottom: r1(st, r.a.runs, -20, 0) };
    }
    out[n] = row;
  }
  await fs.writeFile(path.join(OUT, "napojeni.json"), JSON.stringify(out, null, 1));
  // (b) halves and (c) sources: how often they agree within 0.3 m.
  const cuts = Object.values(out);
  for (const k of sources) {
    const rows = cuts.map((c) => c[k]).filter(Boolean);
    const halves = rows.filter((x) => x.top && x.bottom && x.r1?.sure);
    const agree = halves.filter((x) => Math.abs(x.top.d - x.bottom.d) <= 0.3).length;
    console.log(`${k}: řezů ${rows.length}, r1 jisté ${rows.filter((x) => x.r1?.sure).length}, půlky shodné ${agree}/${halves.length}`);
  }
  for (let i = 0; i < sources.length; i++) for (let j = i + 1; j < sources.length; j++) {
    const [a, b] = [sources[i], sources[j]];
    for (const m of ["r0", "r1", "r2"]) {
      const both = cuts.filter((c) => c[a]?.[m] && c[b]?.[m]);
      const sure = both.filter((c) => c[a][m].sure && c[b][m].sure);
      const agree = (list) => list.filter((c) => Math.abs(c[a][m].d - c[b][m].d) <= 0.4).length;
      console.log(`${a}×${b} ${m}: shoda do 0,4 m ${agree(both)}/${both.length}, z jistých ${agree(sure)}/${sure.length}`);
    }
  }
}
