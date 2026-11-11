// Shoulders and hatching (Bára 11. 11. 2026: "a co ty krajnice a šrafy?") against the independent marks
// (labels/oznac-*.json; OZNACOVANI.md: hatch and parking ranges, lines, edges). Per marked carriageway:
//   krajnice  every shoulder the app estimates (krajnice, odhad): what really is there (hatching or parked cars
//             overlapping 40 % of it, else plain asphalt; and whether a line runs along its inner boundary) against
//             (a) the band verdict of run.mjs (pixels of the band: rows of cars, bright share, edges) and
//             (b) the lines: an edge line found (m4) within 0.4 m of the boundary between lane and shoulder;
//   šrafy     hatching anywhere in the carriageway: hatchRuns() (below) against the marked hatch ranges.
//   CITY=praha node evaluation/ortofoto/krajnice.mjs [who …]
import fs from "node:fs/promises";
import path from "node:path";
import { decodePng } from "../../pilot/public/dmvs.js";
import { ALL, strip, layout } from "./run.mjs";
import { brightMap, m4 } from "./cary.mjs";
import { FINEST } from "./oznac.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITY = process.env.CITY || "praha";
const OUT = path.join(ROOT, "data", CITY);
const AB = path.join(ROOT, "..", CITY, "data", "ab-city-stejne");
const FINE = FINEST[CITY.replace(/\d+$/, "")] || "cuzk12";
const PAD = 3;

// Hatching: per column (0.1 m) the share of bright pixels (brightMap) within ±HATCH_ALONG m; hatching is a plateau
// of such columns at least HATCH_MIN_W wide, where no single column stands out as a line (its peak is not much
// above the plateau's median). A run of the plateau is returned as [s, e].
const HATCH_ALONG = 10, HATCH_SHARE = 0.12, HATCH_MIN_W = 0.8;
export function hatchRuns(st, H, s, e) {
  const { nt, res, t0 } = st, step = Math.max(1, Math.round(0.1 / res));
  const j0 = Math.max(0, Math.floor((20 - HATCH_ALONG) / res)), j1 = Math.min(st.nu, Math.ceil((20 + HATCH_ALONG) / res));
  const cols = [];
  for (let i = Math.max(0, Math.floor((s - t0) / res)); i <= Math.min(nt - 1, Math.floor((e - t0) / res)); i += step) {
    let n = 0, hit = 0;
    for (let j = j0; j < j1; j++) { if (Number.isNaN(st.L[j * nt + i])) continue; n++; if (H[j * nt + i]) hit++; }
    cols.push({ t: t0 + (i + 0.5) * res, v: n ? hit / n : 0 });
  }
  const out = [];
  for (let k = 0; k < cols.length; k++) {
    if (cols[k].v < HATCH_SHARE) continue;
    let q = k;
    while (q + 1 < cols.length && cols[q + 1].v >= HATCH_SHARE * 0.7) q++;
    const run = cols.slice(k, q + 1), w = run.at(-1).t - run[0].t;
    const vs = run.map((x) => x.v).sort((a, b) => a - b), med = vs[vs.length >> 1];
    if (w >= HATCH_MIN_W && med >= HATCH_SHARE) out.push([+run[0].t.toFixed(2), +run.at(-1).t.toFixed(2)]);
    k = q;
  }
  return out;
}

// hatchRuns2: hatched areas are often short (a triangle of a few metres at a lane's start), so small windows
// (0.8 m across × 3 m along, over ±15 m) are judged alone: a window is hatched when HATCH2_SHARE of its pixels
// are bright and they spread over its columns (no single column holds them: not a line) and over its rows (not
// a stop line); a column across the street is hatched when two windows along it are. Runs ≥ 0.6 m are returned.
const KERB_GAP = 0.4; // m kept off the carriageway's edges (kerbs, gutters, their shadows)
const HATCH2_SHARE = 0.16, HATCH2_PEAK = 2.2, HATCH2_MAX = 0.75, HATCH2_RUNS = +(process.env.RUNS || 2);
export function hatchRuns2(st, H, s, e) {
  const { nt, nu, res, t0 } = st, cw = Math.max(2, Math.round(0.8 / res)), ch = Math.round(3 / res);
  const i0 = Math.max(0, Math.floor((s - t0) / res)), i1 = Math.min(nt - cw, Math.floor((e - t0) / res) - cw);
  const j0 = Math.floor(5 / res), j1 = Math.min(nu, Math.ceil(35 / res)) - ch;
  const hits = new Map();
  for (let i = i0; i <= i1; i += Math.max(1, cw >> 1)) for (let j = j0; j <= j1; j += ch >> 1) {
    let n = 0, b = 0;
    const col = new Array(cw).fill(0), row = new Array(ch).fill(0);
    for (let dj = 0; dj < ch; dj++) for (let di = 0; di < cw; di++) {
      const k = (j + dj) * nt + i + di;
      if (Number.isNaN(st.L[k])) continue;
      n++;
      if (H[k]) { b++; col[di]++; row[dj]++; }
    }
    if (n < cw * ch * 0.8 || b / n < HATCH2_SHARE || b / n > HATCH2_MAX) continue;
    const peak = (v) => Math.max(...v) / (v.reduce((x, y) => x + y, 0) / v.length);
    if (peak(col) > HATCH2_PEAK || peak(row) > HATCH2_PEAK * 2) continue;
    // Stripes: along each column bright and dark alternate (oblique stripes cross it again and again); a kerb, a
    // gutter or a white car is one long bright run. Bright runs (≥ 2 px) per column, on average, at least RUNS.
    let runs = 0;
    for (let di = 0; di < cw; di++) {
      let inRun = 0;
      for (let dj = 0; dj < ch; dj++) {
        if (H[(j + dj) * nt + i + di]) inRun++;
        else { if (inRun >= 2) runs++; inRun = 0; }
      }
      if (inRun >= 2) runs++;
    }
    if (runs / cw < HATCH2_RUNS) continue;
    // Oblique: the bright pattern of a column reappears in the column 0.375 m further across shifted along the
    // street (a stripe at an angle); a dashed line, a kerb or a car repeats it unshifted.
    const gap = Math.max(2, Math.round(0.375 / res)), maxS = Math.round(1 / res);
    let oblique = 0, pairs = 0;
    for (let di = 0; di + gap < cw; di++) {
      let best = 0, bestS = 0;
      for (let sh = -maxS; sh <= maxS; sh++) {
        let o = 0;
        for (let dj = Math.max(0, -sh); dj < ch && dj + sh < ch; dj++) if (H[(j + dj) * nt + i + di] && H[(j + dj + sh) * nt + i + di + gap]) o++;
        if (o > best || (o === best && Math.abs(sh) < Math.abs(bestS))) { best = o; bestS = sh; }
      }
      if (!best) continue;
      pairs++;
      if (Math.abs(bestS) >= 2) oblique++;
    }
    if (!pairs || oblique / pairs < 0.5) continue;
    hits.set(i, (hits.get(i) || 0) + 1);
  }
  const cols = [...hits].filter(([, c]) => c >= 2).map(([i]) => i).sort((a, b) => a - b);
  const out = [];
  for (const i of cols) {
    const a = t0 + i * res, b = a + cw * res, last = out.at(-1);
    if (last && a <= last[1] + 0.2) last[1] = b; else out.push([a, b]);
  }
  return out.filter(([a, b]) => b - a >= 0.6).map(([a, b]) => [+a.toFixed(2), +b.toFixed(2)]);
}

async function image(n, key, r) {
  const file = path.join(OUT, "img", key, `${n}.png`);
  try { return strip(await decodePng(await fs.readFile(file)), JSON.parse(await fs.readFile(file + ".json", "utf8")).bbox, r.cut, r.a.extent[0] - PAD, r.a.extent[1] + PAD, ALL[key].res); } catch { return null; }
}
const overlap = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));

if (import.meta.url === `file://${process.argv[1]}` && !process.argv.includes("--pasport")) {
  const who = process.argv.slice(2);
  const index = Object.fromEntries(JSON.parse(await fs.readFile(path.join(OUT, "oznac", "index.json"), "utf8")).map((x) => [x.name, x]));
  const results = Object.fromEntries(JSON.parse(await fs.readFile(path.join(OUT, "results.json"), "utf8")).map((x) => [x.n, x]));
  const sh = [], ha = [];
  for (const w of who) {
    let lab;
    try { lab = JSON.parse(await fs.readFile(path.join(ROOT, "labels", `oznac-${CITY}-${w}.json`), "utf8")); } catch { continue; }
    for (const [name, m] of Object.entries(lab)) {
      const ix = index[name];
      if (!ix || !(m.quality === "ok" || (process.env.JUNCTION && m.quality === "junction")) || (m.edges || []).length < 2) continue;
      const toT = (px) => ix.from + px / ix.pxPerM;
      const r = JSON.parse(await fs.readFile(path.join(AB, `${ix.n}.json`), "utf8")), L = layout(r.a), way = L.ways[ix.way];
      if (!way) continue;
      const hatch = (m.hatch || []).map(([a, b]) => [toT(Math.min(a, b)), toT(Math.max(a, b))]), park = (m.parking || []).map(([a, b]) => [toT(Math.min(a, b)), toT(Math.max(a, b))]);
      const lines = (m.lines || []).map(([px]) => toT(px)), edges = m.edges.map(toT);
      for (const key of [...new Set([FINE, "cuzk12"])]) {
        const st = await image(ix.n, key, r);
        if (!st) continue;
        const H = brightMap(st), found = m4(st, H, way.s, way.e).map((q) => q.t);
        // (1) the app's estimated shoulders
        const res = results[ix.n]?.by?.[key];
        way.parts.forEach((p, q) => {
          if (p.type !== "krajnice" || p.source !== "odhad") return;
          const span = [p.s, p.e], len = p.e - p.s;
          const truth = hatch.some((h) => overlap(h, span) >= 0.4 * len) ? "šrafy" : park.some((h) => overlap(h, span) >= 0.4 * len) ? "auta" : "asfalt";
          // The boundary towards the lanes: the shoulder's side facing the middle of the carriageway.
          const inner = (p.s + p.e) / 2 < (way.s + way.e) / 2 ? p.e : p.s;
          const fill = res?.ways.flatMap((w2) => w2.fills).find((f) => f.i === p.i);
          sh.push({ key, name, len: +len.toFixed(2), truth, lineTrue: lines.some((t) => Math.abs(t - inner) <= 0.5), lineFound: found.some((t) => Math.abs(t - inner) <= 0.5), band: fill?.verdict || "–" });
        });
        // (2) hatching in the carriageway
        // Searched in the carriageway of the map (as the app would), not between the marked edges.
        ha.push({ key, name, truth: hatch, found: hatchRuns(st, H, way.s, way.e) });
        ha.push({ key: key + " okna", name, truth: hatch, found: hatchRuns2(st, H, way.s + KERB_GAP, way.e - KERB_GAP) });
      }
    }
  }
  const by = (arr, f) => arr.reduce((a, x) => ((a[f(x)] = (a[f(x)] || 0) + 1), a), {});
  for (const key of [...new Set(sh.map((x) => x.key))]) {
    const s = sh.filter((x) => x.key === key);
    console.log(`${CITY} ${key}: krajnic odhadem ${s.length}, skutečně ${JSON.stringify(by(s, (x) => x.truth))}`);
    console.log(`  povrch pásu (run.mjs): ${JSON.stringify(by(s, (x) => `${x.truth}→${x.band}`))}`);
    console.log(`  čára na hranici skutečně ${s.filter((x) => x.lineTrue).length}, nalezena ${s.filter((x) => x.lineFound).length}, z toho správně ${s.filter((x) => x.lineFound && x.lineTrue).length}`);
  }
  for (const key of [...new Set(ha.map((x) => x.key))]) {
    const h = ha.filter((x) => x.key === key);
    const tLen = h.reduce((a, x) => a + x.truth.reduce((b, q) => b + q[1] - q[0], 0), 0), fLen = h.reduce((a, x) => a + x.found.reduce((b, q) => b + q[1] - q[0], 0), 0);
    const both = h.reduce((a, x) => a + x.truth.reduce((b, q) => b + x.found.reduce((c, f) => c + overlap(q, f), 0), 0), 0);
    const ways = h.filter((x) => x.truth.length), hit = ways.filter((x) => x.found.some((f) => x.truth.some((q) => overlap(q, f) > 0.3)));
    const clean = h.filter((x) => !x.truth.length), fp = clean.filter((x) => x.found.length);
    console.log(`${CITY} ${key} šrafy: vozovek se šrafami ${ways.length}, nalezeno ${hit.length}; vozovek bez šraf ${clean.length}, falešně ${fp.length}; šíře šraf ${tLen.toFixed(1)} m, nalezeno ${fLen.toFixed(1)} m, společně ${both.toFixed(1)} m`);
  }
  await fs.writeFile(path.join(OUT, "krajnice.json"), JSON.stringify({ sh, ha }, null, 1));
}

// --pasport (Hradec, CITY=hradec3: cuts at the passport's hatched areas): hatchRuns on every carriageway against the
// passport's hatched areas (pk-dzv-p, kind 500, data/hradec/vdz-plochy.json): each area's part within ±15 m along
// the street, as a range across the cut.
if (import.meta.url === `file://${process.argv[1]}` && process.argv.includes("--pasport")) {
  const areas = JSON.parse(await fs.readFile(path.join(ROOT, "data", "hradec", "vdz-plochy.json"), "utf8")).features.filter((f) => f.properties.druh_vodorovne_znacky_tid === 500);
  const R = 6378137, tally = {};
  for (const f of (await fs.readdir(AB)).filter((f) => /^\d+\.json$/.test(f))) {
    const n = +f.slice(0, -5), r = JSON.parse(await fs.readFile(path.join(AB, f), "utf8"));
    if (!r.a?.extent) continue;
    const b = (r.cut.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)], normal = [-dir[1], dir[0]];
    const kx = (R * Math.cos((r.cut.lat * Math.PI) / 180) * Math.PI) / 180, ky = (R * Math.PI) / 180;
    const tu = ([lon, lat]) => { const x = (lon - r.cut.lon) * kx, y = (lat - r.cut.lat) * ky; return [x * normal[0] + y * normal[1], x * dir[0] + y * dir[1]]; };
    const truth = [];
    for (const a of areas) {
      const rings = a.geometry.type === "Polygon" ? [a.geometry.coordinates[0]] : a.geometry.coordinates.map((p) => p[0]);
      for (const ring of rings) {
        const pts = ring.map(tu).filter(([, u]) => Math.abs(u) <= 15);
        if (pts.length >= 2) truth.push([Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0]))]);
      }
    }
    const L = layout(r.a);
    for (const key of ["cuzk12", "cuzk25"]) {
      const st = await image(n, key, r);
      if (!st) continue;
      const H = brightMap(st);
      for (const [name, fn] of [[key, hatchRuns], [key + " okna", hatchRuns2]]) {
      const t = (tally[name] ??= { ways: 0, withHatch: 0, hit: 0, clean: 0, fp: 0 });
      for (const w of L.ways) {
        if (!w.geo) continue;
        const tr = truth.filter((q) => overlap(q, [w.s, w.e]) > 0.5), found = fn === hatchRuns2 ? fn(st, H, w.s + KERB_GAP, w.e - KERB_GAP) : fn(st, H, w.s, w.e);
        t.ways++;
        if (tr.length) { t.withHatch++; if (found.some((f) => tr.some((q) => overlap(q, f) > 0.3))) t.hit++; }
        else { t.clean++; if (found.length) t.fp++; }
      }
      }
    }
  }
  for (const [k, t] of Object.entries(tally)) console.log(`${CITY} ${k} pasport: vozovek ${t.ways}, se šrafami podle pasportu ${t.withHatch}, nalezeno ${t.hit}; bez šraf ${t.clean}, falešně ${t.fp}`);
}
