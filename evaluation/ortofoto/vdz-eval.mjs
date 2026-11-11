// Hradec Králové: the orthophoto's lines against the town's road markings (vdz.mjs, data/hradec/vdz.json). The
// passport is not fully trusted (Bára): it may be old, incomplete or shifted. So first the shift of the passport
// against each image (the median gap of the clear matches), then per carriageway the lines inside it found by
// m1, m4, m5 (cary.mjs) against the passport's lines there, and how often the passport has lines the image does
// not show (an old or wrong passport) or the other way round.
//   node evaluation/ortofoto/vdz-eval.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { decodePng } from "../../pilot/public/dmvs.js";
import { ALL, strip, median, layout, markings } from "./run.mjs";
import { brightMap, m4, m5 } from "./cary.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITY = process.env.CITY || "hradec"; // hradec2: the sample of cuts at the passport's lines
const AB = path.join(ROOT, "..", CITY, "data", "ab-city-stejne");
const OUT = path.join(ROOT, "data", CITY);
const vdz = JSON.parse(await fs.readFile(path.join(OUT, "vdz.json"), "utf8"));
const MATCH = 0.3, EDGE = 0.7, PAD = 3;
const near = (list, t) => (list.length ? list.reduce((b, x) => (Math.abs(x - t) < Math.abs(b - t) ? x : b)) : null);
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : "–");

for (const key of ["cuzk12", "cuzk25"]) {
  const per = [], tally = {};
  for (const [nS, lines] of Object.entries(vdz)) {
    const n = +nS, r = JSON.parse(await fs.readFile(path.join(AB, `${n}.json`), "utf8"));
    if (!r.a?.extent || !lines.length) continue;
    const file = path.join(OUT, "img", key, `${n}.png`);
    let st;
    try { st = strip(await decodePng(await fs.readFile(file)), JSON.parse(await fs.readFile(file + ".json", "utf8")).bbox, r.cut, r.a.extent[0] - PAD, r.a.extent[1] + PAD, ALL[key].res); } catch { continue; }
    const H = brightMap(st), L = layout(r.a);
    for (const w of L.ways) {
      if (!w.geo) continue;
      const pass = lines.map((l) => l.t).filter((t) => t > w.s + EDGE && t < w.e - EDGE);
      const found = { m1: markings(st, w).map((q) => q.t), m4: m4(st, H, w.s, w.e).map((q) => q.t), m5: m5(st, H, w.s, w.e).map((q) => q.t) };
      const b = (r.cut.bearing * Math.PI) / 180;
      per.push({ n, pass, found, s: w.s, e: w.e, nx: -Math.cos(b), ny: Math.sin(b) });
    }
  }
  // The passport's shift against the image, one for the town (a transformation of coordinates shifts all of it
  // alike): east and north from the gaps of m4 lines to the nearest passport line (within 2 m), by least squares
  // (each gap is the shift seen across its cut), twice, the second time without the gaps far off the first fit.
  let gaps = per.flatMap((p) => p.found.m4.filter((t) => t > p.s + EDGE && t < p.e - EDGE).map((t) => { const q = near(p.pass, t); return q === null ? null : { g: t - q, nx: p.nx, ny: p.ny }; })).filter((g) => g && Math.abs(g.g) <= 2);
  const lsq = (G) => { let a = 0, b = 0, c = 0, d = 0, e = 0; for (const x of G) { a += x.nx * x.nx; b += x.nx * x.ny; c += x.ny * x.ny; d += x.nx * x.g; e += x.ny * x.g; } const det = a * c - b * b; return [(d * c - e * b) / det, (e * a - d * b) / det]; };
  let [ex, ey] = lsq(gaps);
  gaps = gaps.filter((x) => Math.abs(x.g - (ex * x.nx + ey * x.ny)) <= 0.5);
  [ex, ey] = lsq(gaps);
  const res = gaps.map((x) => Math.abs(x.g - (ex * x.nx + ey * x.ny)));
  for (const p of per) for (const [m, f0] of Object.entries(p.found)) {
    const shift = ex * p.nx + ey * p.ny;
    const f = f0.filter((t) => t > p.s + EDGE && t < p.e - EDGE).map((t) => t - shift);
    const t = (tally[m] ??= { truth: 0, hit: 0, found: 0, ok: 0, ways: 0 });
    t.ways++; t.truth += p.pass.length; t.found += f.length;
    t.hit += p.pass.filter((q) => f.some((x) => Math.abs(x - q) <= MATCH)).length;
    t.ok += f.filter((x) => p.pass.some((q) => Math.abs(x - q) <= MATCH)).length;
  }
  console.log(`${key}: vozovek ${per.length}, čar pasportu uvnitř ${per.reduce((a, p) => a + p.pass.length, 0)}, posun pasportu proti obrázku ${ex.toFixed(2)} m na východ, ${ey.toFixed(2)} m na sever (zbytek shod medián ${median(res).toFixed(2)} m z ${res.length})`);
  for (const [m, t] of Object.entries(tally)) console.log(`  ${m}: z čar pasportu nalezeno ${pct(t.hit, t.truth)} (${t.hit}/${t.truth}), z nalezených v pasportu ${pct(t.ok, t.found)} (${t.ok}/${t.found})`);
}
