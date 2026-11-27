// The way cars park, read off the orthophoto (Bára 16. 11. 2026, point 7): in a band of parking, stall lines
// across the street (kolmé) or at an angle (šikmé) and the cars in them repeat every 2.3–4 m along the street,
// parallel parking (podélné) every 5–7 m. Per part with a known way (TSK, the city's data, OSM) the band's
// brightness is averaged along lines at angles θ to the cut (0 = across the street, along the cut) and the
// periodicity of that signal along the street measured (normalised autocorrelation).
//   node evaluation/ortofoto/stani-eval.mjs        → printed, data/stani-eval.json
import fs from "node:fs/promises";
import path from "node:path";
import { decodePng } from "../../app/public/dmvs.js";
import { strip, layout } from "./run.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITIES = { praha: ["ipr10", 0.1], brno: ["brno25", 0.1], plzen: ["plzen10", 0.1], hradec: ["cuzk12", 0.125], ostrava: ["cuzk12", 0.125] };
const SHIFT = { brno25: [1.06, 3.09] };
const ANGLES = [-60, -45, -30, 0, 30, 45, 60]; // degrees from the cut's direction (0: a line along the cut)

// The signal along the street (u) of the band [a, b] averaged along lines at angle th, its local mean removed.
function signal(st, a, b, th) {
  const { nt, nu, res, t0, L } = st, tan = Math.tan((th * Math.PI) / 180), mid = (a + b) / 2, out = new Float32Array(nu);
  for (let j = 0; j < nu; j++) {
    let s = 0, n = 0;
    for (let t = a; t < b; t += res) {
      const i = Math.floor((t - t0) / res), jj = j + Math.round(((t - mid) * tan) / res);
      if (i < 0 || i >= nt || jj < 0 || jj >= nu) continue;
      const v = L[jj * nt + i];
      if (!Number.isNaN(v)) { s += v; n++; }
    }
    out[j] = n ? s / n : NaN;
  }
  // minus a running mean over 6 m, so slow light changes (shade) do not count
  const w = Math.round(3 / res), d = new Float32Array(nu);
  for (let j = 0; j < nu; j++) {
    let s = 0, n = 0;
    for (let q = Math.max(0, j - w); q <= Math.min(nu - 1, j + w); q++) if (!Number.isNaN(out[q])) { s += out[q]; n++; }
    d[j] = Number.isNaN(out[j]) || !n ? 0 : out[j] - s / n;
  }
  return d;
}
// The strongest normalised autocorrelation of x over lags [l0, l1] (m).
function period(x, res, l0, l1) {
  let e = 0;
  for (const v of x) e += v * v;
  if (!e) return { r: 0, lag: 0 };
  let best = { r: -1, lag: 0 };
  for (let k = Math.round(l0 / res); k <= Math.round(l1 / res); k++) {
    let s = 0;
    for (let j = 0; j + k < x.length; j++) s += x[j] * x[j + k];
    const r = s / e;
    if (r > best.r) best = { r, lag: k * res };
  }
  return best;
}

const rows = [];
for (const [city, [key, res]] of Object.entries(CITIES)) {
  const AB = path.join(ROOT, "..", city, "data", "ab-city-stejne"), IMG = path.join(ROOT, "data", city, "img", key);
  for (const f of (await fs.readdir(AB)).filter((x) => /^\d+\.json$/.test(x))) {
    const r = JSON.parse(await fs.readFile(path.join(AB, f), "utf8")), n = f.slice(0, -5);
    if (!r.a?.extent || !r.a.segments) continue;
    const parts = layout(r.a).parts.filter((p) => p.type === "parkovani" && p.w >= 1.6);
    if (!parts.length) continue;
    let img, meta;
    try { img = await decodePng(await fs.readFile(path.join(IMG, `${n}.png`))); meta = JSON.parse(await fs.readFile(path.join(IMG, `${n}.png.json`), "utf8")); } catch { continue; }
    const k = Math.cos((r.cut.lat * Math.PI) / 180), [sx, sy] = (SHIFT[key] || [0, 0]).map((v) => v / k);
    const st = strip(img, [meta.bbox[0] - sx, meta.bbox[1] - sy, meta.bbox[2] - sx, meta.bbox[3] - sy], r.cut, r.a.extent[0] - 1, r.a.extent[1] + 1, res);
    for (const p of parts) {
      const seg = r.a.segments[p.i], a = p.s + 0.3, b = p.e - 0.3;
      const scores = Object.fromEntries(ANGLES.map((th) => {
        const x = signal(st, a, b, th);
        return [th, { short: period(x, res, 2.2, 4.0), long: period(x, res, 5.0, 7.0) }];
      }));
      rows.push({ city, n, truth: seg.orient || "podelne", source: seg.source, w: +p.w.toFixed(2), scores });
    }
  }
}
await fs.writeFile(path.join(ROOT, "data", "stani-eval.json"), JSON.stringify(rows, null, 1));
for (const x of rows.filter((x) => x.source !== "odhad")) {
  const s = x.scores, best = ANGLES.reduce((b, th) => (s[th].short.r > s[b].short.r ? th : b), 0);
  console.log(`${x.city} ${x.n}`.padEnd(12), x.truth.padEnd(8), x.source.padEnd(5), `š ${x.w}`.padEnd(8), `kolmo ${s[0].short.r.toFixed(2)}@${s[0].short.lag.toFixed(1)}`, `nejlépe ${best}° ${s[best].short.r.toFixed(2)}@${s[best].short.lag.toFixed(1)}`, `dlouhé ${s[0].long.r.toFixed(2)}@${s[0].long.lag.toFixed(1)}`);
}
