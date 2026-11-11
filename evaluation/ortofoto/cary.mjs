// Road markings, round two (Bára 11. 11. 2026: try more ways). On the cached images of run.mjs, per roadway:
//   m1  the detector of run.mjs (share of bright rows per column, the street's direction as OSM has it);
//   m2  the same on a map of bright pixels, searched also turned by up to ±MAX_DEG (the street's direction of
//       OSM is often a degree or two off: over ±20 m that smears a line by up to 0.7 m);
//       and bent: in a curve (Bára) a line drifts by u²/2R, so arcs of radius ≥ 50 m are tried too;
//   m3  m2 on two orthophotos together: a line counts where both see it (after fitting one image onto the other).
// Ground truth: the lines checked by eye on the finest orthophoto (labels/<city>.json, see --label), against
// which each method's hits and misses are counted.
//   CITY=praha node evaluation/ortofoto/cary.mjs --label [n …]   images to label (data/<city>/label/<n>-<way>.jpg)
//   CITY=praha node evaluation/ortofoto/cary.mjs                 the comparison (data/<city>/cary.json, printed)
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { decodePng } from "../../pilot/public/dmvs.js";
import { ALL, strip, median, layout, align, encodePng, markings } from "./run.mjs";

const run = promisify(execFile);
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITY = process.env.CITY || "praha";
const OUT = path.join(ROOT, "data", CITY);
const AB = path.join(ROOT, "..", CITY, "data", "ab-city-stejne");
const FINE = CITY === "praha" ? "ipr10" : "brno25"; // labels are made on this one
const PAIR = { praha: ["ipr10", "cuzk12"], brno: ["brno25", "cuzk12"] }[CITY];
const ALONG = 20, PAD = 3;

async function load(n, key) {
  const r = JSON.parse(await fs.readFile(path.join(AB, `${n}.json`), "utf8"));
  const p = r.a;
  if (!p?.segments?.length) return null;
  const file = path.join(OUT, "img", key, `${n}.png`);
  let img, bbox;
  try { img = await decodePng(await fs.readFile(file)); bbox = JSON.parse(await fs.readFile(file + ".json", "utf8")).bbox; } catch { return null; }
  const L = layout(p), t0 = p.extent[0] - PAD, t1 = p.extent[1] + PAD;
  const st = strip(img, bbox, r.cut, t0, t1, ALL[key].res);
  const al = align(st, L.kerbs);
  const ways = L.ways.map((w) => ({ s: w.s + al.shift, e: w.e + al.shift, geo: w.geo, parts: w.parts.map((x) => ({ ...x, s: x.s + al.shift, e: x.e + al.shift })) }));
  const rails = L.parts.filter((x) => /^tramvaj/.test(x.type)).map((x) => ({ s: x.s + al.shift, e: x.e + al.shift }));
  return { r, st, ways, rails, shift: al.shift, fit: al.fit };
}

// ---------- m2: the map of bright pixels, searched along several directions ----------
const REL = 0.14, MIN_DL = 10, SHARE = 0.1, MAX_W = 0.6, BLOCKS = 8, MIN_SPREAD = 3, MAX_DEG = 3, STEP_DEG = 0.5, WIDER = 1.5;
function brightMap(st) {
  const { nt, nu, res, L } = st, win = Math.max(2, Math.round(0.75 / res)), H = new Uint8Array(nt * nu);
  const step = Math.max(1, win >> 2);
  for (let j = 0; j < nu; j++) for (let i = win; i < nt - win; i++) {
    const v = L[j * nt + i];
    if (Number.isNaN(v)) continue;
    const around = [];
    for (let d = -win; d <= win; d += step) if (Math.abs(d) > 1) around.push(L[j * nt + i + d]);
    const m = median(around);
    if (v - m > Math.max(MIN_DL, REL * m)) H[j * nt + i] = 1;
  }
  return H;
}
const CURVES = [0, 1 / 200, -1 / 200, 1 / 100, -1 / 100, 1 / 50, -1 / 50]; // 1/R, R in m
// m4: the lines of one roadway run side by side, so the roadway gets one direction and one bend: the (angle,
// curve) whose share curve has the most of its mass in sharp peaks; only its peaks count.
function m4(st, H, s, e) {
  let best = null;
  for (let deg = -MAX_DEG; deg <= MAX_DEG + 1e-9; deg += STEP_DEG) for (const k of CURVES) {
    const sh = shareCurve(st, H, s, e, Math.tan((deg * Math.PI) / 180), k);
    // Sharpness: the sum of squared shares (a line concentrated in few columns beats one smeared over many).
    const q = sh.reduce((a, x) => a + x.v * x.v, 0);
    if (!best || q > best.q) best = { q, deg, k, sh };
  }
  return peaks(best.sh, st.res).map((m) => ({ ...m, deg: best.deg, R: best.k ? Math.round(1 / best.k) : null }));
}
// m5: the lanes chosen together (LITERATURA.md, Máttyus et al. 2016): of m4's lines inside the roadway, the set
// whose gaps look like lanes (inner gaps LANE_MIN–LANE_MAX, the outer ones up to OUTER_MAX for a shoulder or
// parking), with the most line strength; a line that would make a 1 m "lane" is left out. Dynamic programming
// over the lines sorted across the street.
const LANE_MIN = 2.5, LANE_MAX = 4.75, OUTER_MAX = 7.5, OUTER_MIN = 1.0, MISSED = 0.1;
function m5(st, H, s, e) {
  const c = m4(st, H, s, e).filter((m) => m.t > s + 0.7 && m.t < e - 0.7);
  const n = c.length;
  // best[i]: the best score of a chain from the kerb A to line i; prev[i] the line before it (−1: the kerb).
  const best = new Array(n).fill(-Infinity), prev = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    // A gap may also be two lanes whose line was not found (a small penalty).
    const first = c[i].t - s;
    if (first >= OUTER_MIN && first <= OUTER_MAX + LANE_MAX) best[i] = c[i].share - (first > OUTER_MAX ? MISSED : 0);
    for (let q = 0; q < i; q++) {
      const g = c[i].t - c[q].t, v = best[q] + c[i].share - (g > LANE_MAX ? MISSED : 0);
      if (g >= LANE_MIN && g <= 2 * LANE_MAX && v > best[i]) { best[i] = v; prev[i] = q; }
    }
  }
  let end = -1, top = 0; // no line at all is allowed (score 0), when the roadway is one lane or unmarked
  for (let i = 0; i < n; i++) { const last = e - c[i].t, v = best[i] - (last > OUTER_MAX ? MISSED : 0); if (last >= OUTER_MIN && last <= OUTER_MAX + LANE_MAX && v > top) { top = v; end = i; } }
  const out = [];
  for (let i = end; i >= 0; i = prev[i]) out.unshift(c[i]);
  return out;
}
function shareCurve(st, H, s, e, tan, k) {
  const { nt, nu, res, t0 } = st;
  const i0 = Math.max(0, Math.floor((s - WIDER - t0) / res)), i1 = Math.min(nt - 1, Math.floor((e + WIDER - t0) / res));
  const share = [];
  for (let i = i0; i <= i1; i++) {
    let n = 0, hit = 0;
    const bk = new Array(BLOCKS).fill(0), bn = new Array(BLOCKS).fill(0);
    for (let j = 0; j < nu; j++) {
      const u = ALONG - (j + 0.5) * res, ii = i + Math.round((u * tan + (k * u * u) / 2) / res);
      if (ii < 0 || ii >= nt || Number.isNaN(st.L[j * nt + ii])) continue;
      n++;
      const b = Math.min(BLOCKS - 1, Math.floor((j / nu) * BLOCKS));
      bn[b]++;
      if (H[j * nt + ii]) { hit++; bk[b]++; }
    }
    share.push({ t: t0 + (i + 0.5) * res, v: n ? hit / n : 0, spread: bk.filter((x, q) => bn[q] && x / bn[q] >= 0.1).length });
  }
  return share;
}
function m2(st, H, s, e, degs = null, curves = CURVES) {
  const { nt, nu, res, t0 } = st;
  const i0 = Math.max(0, Math.floor((s - WIDER - t0) / res)), i1 = Math.min(nt - 1, Math.floor((e + WIDER - t0) / res));
  const found = [];
  for (let deg = -MAX_DEG; deg <= MAX_DEG + 1e-9; deg += STEP_DEG) {
    if (degs && !degs.includes(deg)) continue;
    const tan = Math.tan((deg * Math.PI) / 180);
    for (const k of curves) {
    const share = [];
    for (let i = i0; i <= i1; i++) {
      let n = 0, hit = 0;
      const bk = new Array(BLOCKS).fill(0), bn = new Array(BLOCKS).fill(0);
      for (let j = 0; j < nu; j++) {
        const u = ALONG - (j + 0.5) * res, ii = i + Math.round((u * tan + (k * u * u) / 2) / res);
        if (ii < 0 || ii >= nt || Number.isNaN(st.L[j * nt + ii])) continue;
        n++;
        const b = Math.min(BLOCKS - 1, Math.floor((j / nu) * BLOCKS));
        bn[b]++;
        if (H[j * nt + ii]) { hit++; bk[b]++; }
      }
      share.push({ t: t0 + (i + 0.5) * res, v: n ? hit / n : 0, spread: bk.filter((x, q) => bn[q] && x / bn[q] >= 0.1).length });
    }
    found.push(...peaks(share, res).map((m) => ({ ...m, deg, R: k ? Math.round(1 / k) : null })));
    }
  }
  // The same line seen under neighbouring angles: keep the strongest (within 0.3 m).
  found.sort((a, b) => b.share - a.share);
  const out = [];
  for (const m of found) if (!out.some((o) => Math.abs(o.t - m.t) < 0.3)) out.push(m);
  return out.sort((a, b) => a.t - b.t);
}
function peaks(share, res) {
  const out = [], sep = Math.round(0.3 / res);
  for (let k = 0; k < share.length; k++) {
    const v = share[k].v;
    if (v < SHARE) continue;
    let top = true;
    for (let q = Math.max(0, k - sep); q <= Math.min(share.length - 1, k + sep); q++) if (share[q].v > v || (share[q].v === v && q < k)) { top = false; break; }
    if (!top) continue;
    let a = k, e = k;
    while (a > 0 && share[a - 1].v >= v / 2) a--;
    while (e + 1 < share.length && share[e + 1].v >= v / 2) e++;
    if ((e - a + 1) * res > MAX_W) continue;
    const ring = share.slice(Math.max(0, k - 2 * sep), Math.min(share.length, k + 2 * sep + 1)).map((x) => x.v);
    if (v - Math.min(...ring) < SHARE * 0.8) continue;
    if (Math.max(...share.slice(a, e + 1).map((x) => x.spread)) < MIN_SPREAD) continue;
    out.push({ t: +share[k].t.toFixed(2), share: +v.toFixed(2), solid: v >= 0.6 });
  }
  return out;
}

// ---------- fitting one orthophoto onto another (across the street) ----------
// The column medians of brightness of both images, compared at offsets ±3 m: the best correlation wins.
function columns(st) {
  const col = [];
  for (let i = 0; i < st.nt; i++) { const v = []; for (let j = 0; j < st.nu; j += 2) v.push(st.L[j * st.nt + i]); col.push(median(v)); }
  return col;
}
function offset(a, b) {
  // Both on a 0.1 m grid.
  const g = (st) => { const c = columns(st), n = Math.floor((c.length * st.res) / 0.1), o = []; for (let i = 0; i < n; i++) { const a = Math.floor((i * 0.1) / st.res), b = Math.max(a + 1, Math.floor(((i + 1) * 0.1) / st.res)); o.push(c.slice(a, b).reduce((x, y) => x + y, 0) / (b - a)); } return o; };
  const A = g(a), B = g(b);
  let best = 0, bestC = -2;
  for (let d = -30; d <= 30; d++) {
    let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0;
    for (let i = 0; i < A.length; i++) {
      const j = i + d;
      if (j < 0 || j >= B.length || Number.isNaN(A[i]) || Number.isNaN(B[j])) continue;
      sa += A[i]; sb += B[j]; saa += A[i] * A[i]; sbb += B[j] * B[j]; sab += A[i] * B[j]; n++;
    }
    const c = (sab - (sa * sb) / n) / Math.sqrt((saa - (sa * sa) / n) * (sbb - (sb * sb) / n));
    if (c > bestC) { bestC = c; best = d; }
  }
  return { d: +(best * 0.1).toFixed(1), c: +bestC.toFixed(2) }; // b's feature at t + d is a's at t
}

// ---------- labelling images: the roadway at 20 px/m, numbered candidate ticks ----------
const COLORS = [[255, 40, 40], [40, 200, 255], [255, 220, 0], [255, 60, 255], [60, 255, 60], [255, 140, 0]];
async function labelImages(ns) {
  const dir = path.join(OUT, "label");
  await fs.mkdir(dir, { recursive: true });
  const sheet = [];
  for (const n of ns) {
    const x = await load(n, FINE);
    if (!x) continue;
    const H = brightMap(x.st);
    for (const [wi, w] of x.ways.entries()) {
      const lanes = w.parts.filter((p) => /^(pruh|bus|obsluzna|tramvaj_v)/.test(p.type)).length;
      if (lanes < 2) continue;
      // Loose candidates (lower share) so the labels can pick from them.
      const cand = m2(x.st, H, w.s, w.e).filter((m) => !x.rails.some((r) => m.t > r.s + 0.2 && m.t < r.e - 0.2));
      const s = w.s - 2, e = w.e + 2, PXM = 20, W = Math.round((e - s) * PXM), Hh = 2 * ALONG * 10;
      const rgba = new Uint8Array(W * Hh * 4);
      for (let y = 0; y < Hh; y++) for (let X = 0; X < W; X++) {
        const t = s + (X + 0.5) / PXM, u = ALONG - (y + 0.5) / 10;
        const i = Math.floor((t - x.st.t0) / x.st.res), j = Math.floor((ALONG - u) / x.st.res), o = (y * W + X) * 4;
        if (i < 0 || i >= x.st.nt || j < 0 || j >= x.st.nu) continue;
        const q = (j * x.st.nt + i) * 3;
        rgba[o] = x.st.rgb[q]; rgba[o + 1] = x.st.rgb[q + 1]; rgba[o + 2] = x.st.rgb[q + 2]; rgba[o + 3] = 255;
      }
      // Ticks at the top (candidate k in colour k mod 6, left to right), metre ruler at the bottom.
      cand.forEach((m, k) => { const X = Math.round((m.t - s) * PXM), c = COLORS[k % COLORS.length]; for (let y = 0; y < 18; y++) for (const dx of [0, 1]) { const o = (y * W + X + dx) * 4; if (X + dx < W) { rgba[o] = c[0]; rgba[o + 1] = c[1]; rgba[o + 2] = c[2]; } } });
      for (let mt = Math.ceil(s); mt <= e; mt++) { const X = Math.round((mt - s) * PXM), len = mt % 5 === 0 ? 14 : 7; for (let y = Hh - len; y < Hh; y++) { const o = (y * W + X) * 4; if (X < W) { rgba[o] = 255; rgba[o + 1] = 255; rgba[o + 2] = 255; } } }
      const png = path.join(dir, `${n}-${wi}.png`);
      await fs.writeFile(png, encodePng(rgba, W, Hh));
      await run("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "80", png, "--out", png.replace(/png$/, "jpg")]);
      await fs.rm(png);
      sheet.push({ n, way: wi, name: x.r.cut.name, from: +s.toFixed(2), lanes, cand: cand.map((m, k) => ({ k, t: m.t, x: Math.round((m.t - s) * PXM), share: m.share, deg: m.deg })) });
    }
  }
  await fs.writeFile(path.join(dir, "candidates.json"), JSON.stringify(sheet, null, 1));
  for (const r of sheet) console.log(`${r.n}-${r.way} ${r.name} (${r.lanes} pruhy): ${r.cand.map((c) => `${c.k}@${c.x}px`).join(" ")}`);
}

// ---------- the comparison against the labels ----------
// labels/<city>.json: { "<n>-<way>": { "lines": [t, …] } } — the true lines in metres of the FINE image (the
// candidates' t, plus missed ones read off the ruler), "skip": true for roadways that cannot be judged.
const MATCH = 0.3, EDGE = 0.7;
function score(found, truth) {
  const hit = truth.filter((t) => found.some((f) => Math.abs(f - t) <= MATCH)).length;
  const ok = found.filter((f) => truth.some((t) => Math.abs(f - t) <= MATCH)).length;
  return { truth: truth.length, found: found.length, hit, ok };
}
async function compare() {
  const labels = JSON.parse(await fs.readFile(path.join(ROOT, "labels", `${CITY}.json`), "utf8"));
  delete labels._;
  // Labels in pixels of the labelling images (20 px/m from their "from").
  const sheet = JSON.parse(await fs.readFile(path.join(OUT, "label", "candidates.json"), "utf8"));
  for (const [k, v] of Object.entries(labels)) if (v.px) { const c = sheet.find((x) => `${x.n}-${x.way}` === k); v.lines = v.px.map((p) => c.from + p / 20); }
  const sources = Object.keys(ALL).filter((k) => !ALL[k].cities || ALL[k].cities.includes(CITY));
  const tally = {};
  const add = (k, s) => { const t = (tally[k] ??= { truth: 0, found: 0, hit: 0, ok: 0, ways: 0 }); for (const q of ["truth", "found", "hit", "ok"]) t[q] += s[q]; t.ways++; };
  const rows = [];
  const byN = {};
  for (const key of Object.keys(labels)) { const [n, w] = key.split("-").map(Number); (byN[n] ??= []).push(w); }
  for (const [nS, wis] of Object.entries(byN)) {
    const n = +nS, fine = await load(n, FINE);
    if (!fine) continue;
    const imgs = {};
    for (const k of sources) imgs[k] = k === FINE ? fine : await load(n, k);
    const H = {};
    for (const [k, x] of Object.entries(imgs)) if (x) H[k] = brightMap(x.st);
    for (const wi of wis) {
      const lab = labels[`${n}-${wi}`];
      if (lab.skip) continue;
      const truth = lab.lines;
      const wF = fine.ways[wi];
      const row = { key: `${n}-${wi}`, truth: truth.length };
      for (const [k, x] of Object.entries(imgs)) {
        if (!x) continue;
        // The truth moved into this image: the images' offset against the fine one.
        const off = k === FINE ? { d: 0, c: 1 } : offset(fine.st, x.st);
        const tr = truth.map((t) => t + off.d);
        const w = { s: wF.s + off.d, e: wF.e + off.d, parts: [] };
        const rails = fine.rails.map((r) => ({ s: r.s + off.d, e: r.e + off.d }));
        const clean = (ms) => ms.filter((m) => !rails.some((r) => m.t > r.s + 0.2 && m.t < r.e - 0.2) && m.t >= w.s - WIDER && m.t <= w.e + WIDER).map((m) => m.t);
        const r1 = score(clean(markings(x.st, w)), tr), r2 = score(clean(m2(x.st, H[k], w.s, w.e)), tr), r20 = score(clean(m2(x.st, H[k], w.s, w.e, [0], [0])), tr), r2s = score(clean(m2(x.st, H[k], w.s, w.e, null, [0])), tr);
        const r4 = score(clean(m4(x.st, H[k], w.s, w.e)), tr);
        add(`${k} m4 jeden směr a oblouk na vozovku`, r4);
        // Only the lines inside the roadway (≥ EDGE m from its kerbs): the lane dividers, which split the width.
        const inside = (ts) => ts.filter((t) => t > w.s + EDGE && t < w.e - EDGE);
        add(`${k} uvnitř m1`, score(inside(clean(markings(x.st, w))), inside(tr)));
        add(`${k} uvnitř m4`, score(inside(clean(m4(x.st, H[k], w.s, w.e))), inside(tr)));
        add(`${k} uvnitř m5 pruhy dohromady`, score(inside(clean(m5(x.st, H[k], w.s, w.e))), inside(tr)));
        if (process.env.FP === k) {
          const f4 = clean(m4(x.st, H[k], w.s, w.e));
          const fp = f4.filter((t) => !tr.some((q) => Math.abs(q - t) <= MATCH)).map((t) => `${(t - w.s).toFixed(2)} od A (šířka ${(w.e - w.s).toFixed(1)})`);
          const miss = tr.filter((q) => !f4.some((t) => Math.abs(q - t) <= MATCH)).map((q) => (q - w.s).toFixed(2));
          console.log(`${n}-${wi}: navíc ${fp.join("; ") || "–"} | chybí ${miss.join(", ") || "–"}`);
        }
        add(`${k} m1`, r1); add(`${k} m2`, r2); add(`${k} m2 rovně, jen OSM směr`, r20); add(`${k} m2 bez oblouků`, r2s);
        row[k] = `${r2.hit}/${r2.truth} (${r2.found - r2.ok} navíc) posun ${off.d}`;
      }
      // m3: the pair together.
      const [a, b] = PAIR.map((k) => imgs[k]);
      if (a && b) {
        const oa = PAIR[0] === FINE ? 0 : offset(fine.st, a.st).d, ob = offset(a.st, b.st).d;
        const fa = m2(a.st, H[PAIR[0]], wF.s + oa, wF.e + oa).map((m) => m.t), fb = m2(b.st, H[PAIR[1]], wF.s + oa + ob, wF.e + oa + ob).map((m) => m.t - ob);
        const both = fa.filter((t) => fb.some((u) => Math.abs(u - t) <= MATCH) && !fine.rails.some((r) => t - oa > r.s + 0.2 && t - oa < r.e - 0.2));
        add(`${PAIR.join("+")} m3`, score(both, truth.map((t) => t + oa)));
      }
      // The dividers: where the app puts them (boundaries between parts of the profile, on the real
      // carriageway) and where the orthophoto finds them (m4, inside), against the true ones.
      const inner = truth.filter((t) => t > wF.s + EDGE && t < wF.e - EDGE);
      // Every boundary between two parts of the roadway (lane|lane, shoulder|lane, parking|lane, bike lane|lane…).
      const appB = wF.parts.slice(1).map((p) => p.s);
      const near = (list, t) => (list.length ? Math.min(...list.map((x) => Math.abs(x - t))) : Infinity);
      row.dividers = inner.length;
      row.appLanes = appB.length + 1;
      row.trueLanes = inner.length + 1;
      row.appErr = inner.map((t) => +near(appB, t).toFixed(2));
      // The same with the app's boundaries moved as a whole by the best shift (±3 m): only how it splits the
      // roadway, not where the roadway lies, counts.
      let bestD = 0, bestE = Infinity;
      for (let d = -3; d <= 3; d += 0.05) { const e = inner.reduce((a, t) => a + Math.min(1.5, near(appB.map((b) => b + d), t)), 0); if (e < bestE) { bestE = e; bestD = d; } }
      row.appErrShifted = inner.map((t) => +near(appB.map((b) => b + bestD), t).toFixed(2));
      for (const k of [FINE, "cuzk12"]) {
        const x = imgs[k];
        if (!x) continue;
        const off = k === FINE ? 0 : offset(fine.st, x.st).d;
        const f = m4(x.st, H[k], wF.s + off, wF.e + off).map((m) => m.t - off).filter((t) => t > wF.s + EDGE && t < wF.e - EDGE);
        row[`err_${k}`] = inner.map((t) => +near(f, t).toFixed(2));
        row[`lanes_${k}`] = f.length + 1;
      }
      rows.push(row);
    }
  }
  console.log("metoda | vozovek | čar (pravda) | nalezeno správně (recall) | nalezeno celkem | z toho správně (precision)");
  for (const [k, t] of Object.entries(tally).sort()) console.log(`${k} | ${t.ways} | ${t.truth} | ${t.hit} (${Math.round((100 * t.hit) / t.truth)} %) | ${t.found} | ${t.ok} (${t.found ? Math.round((100 * t.ok) / t.found) : 0} %)`);
  await fs.writeFile(path.join(OUT, "cary.json"), JSON.stringify({ tally, rows }, null, 1));
  // Dividers: the app's error against the orthophoto's.
  const all = (k) => rows.flatMap((r) => r[k] || []);
  const stat = (e) => { const f = e.filter(Number.isFinite).sort((a, b) => a - b); return `medián ${f.length ? f[f.length >> 1].toFixed(2) : "–"} m, do 0,3 m ${e.filter((v) => v <= 0.3).length}/${e.length}, nad 1 m ${e.filter((v) => v > 1).length}`; };
  console.log(`\nDělicí čáry uvnitř vozovky (${all("appErr").length}): aplikace ${stat(all("appErr"))}`);
  console.log(`  aplikace s nejlepším posunem celé vozovky: ${stat(all("appErrShifted"))}`);
  for (const k of [FINE, "cuzk12"]) console.log(`  ortofoto ${k} (m4): ${stat(all(`err_${k}`))}`);
  const lanes = (k) => rows.filter((r) => r[k] === r.trueLanes).length;
  console.log(`Počet pruhů správně: aplikace ${lanes("appLanes")}/${rows.length}, ${FINE} ${lanes(`lanes_${FINE}`)}/${rows.length}, cuzk12 ${lanes("lanes_cuzk12")}/${rows.length}`);
}

if (process.argv.includes("--label")) {
  const ns = process.argv.slice(process.argv.indexOf("--label") + 1).map(Number).filter(Boolean);
  await labelImages(ns);
} else await compare();
