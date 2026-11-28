import { ALONG } from "./image.js";
import { shareCurve } from "./lines.js";

// ---------- hatching (V 13: a band of oblique parallel stripes, between solid lines) ----------
// Bára 27. 11. 2026: silnice I/14 in Česká Třebová has two lanes and a hatched strip between them, which the lines
// alone do not tell (the strip is no lane, it holds no dashed line). The stripes of hatching run at an angle to the
// street, which nothing else on a roadway does (lane lines, kerbs, zebra stripes run along or across it, cars and
// leaves have no direction): a window's gradients (structure tensor) are coherent and point obliquely.
export const HATCH = { win: 0.8, high: 2.5, coh: 0.45, rms: 4, lo: 20, hi: 70, centre: 8, centreShare: 0.4, along: 0.1, wMin: 0.8, wMax: 4.5, sign: 0.9, rhy: 0.5, side: 2.2, off: false };
export const HATCH_PARAMS = HATCH;
// Oblique cells over the strip: [{ i, j, ok }] on a grid of cells half a window apart; also the per-cell values.
export function hatchCells(st) {
  const { nt, nu, res, L } = st, cw = Math.max(2, Math.round(HATCH.win / res)), ch = Math.max(3, Math.round(HATCH.high / res));
  const W = nt + 1, I = (a) => new Float64Array((nt + 1) * (nu + 1)).fill(0), xx = I(), yy = I(), xy = I(), cnt = I();
  const gx = new Float32Array(nt * nu), gy = new Float32Array(nt * nu), ok = new Uint8Array(nt * nu);
  for (let j = 1; j < nu - 1; j++) for (let i = 1; i < nt - 1; i++) {
    const a = L[j * nt + i - 1], b = L[j * nt + i + 1], c = L[(j - 1) * nt + i], d = L[(j + 1) * nt + i];
    if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c) || Number.isNaN(d)) continue;
    gx[j * nt + i] = (b - a) / 2; gy[j * nt + i] = (d - c) / 2; ok[j * nt + i] = 1;
  }
  for (let j = 0; j < nu; j++) for (let i = 0; i < nt; i++) {
    const k = j * nt + i, x = gx[k], y = gy[k], o = (j + 1) * W + i + 1;
    xx[o] = x * x + xx[o - 1] + xx[o - W] - xx[o - W - 1];
    yy[o] = y * y + yy[o - 1] + yy[o - W] - yy[o - W - 1];
    xy[o] = x * y + xy[o - 1] + xy[o - W] - xy[o - W - 1];
    cnt[o] = ok[k] + cnt[o - 1] + cnt[o - W] - cnt[o - W - 1];
  }
  const sum = (T, i, j) => T[(j + ch) * W + i + cw] - T[j * W + i + cw] - T[(j + ch) * W + i] + T[j * W + i];
  const cells = [];
  for (let j = 0; j + ch <= nu; j += Math.max(1, ch >> 1)) for (let i = 0; i + cw <= nt; i += Math.max(1, cw >> 1)) {
    const n = sum(cnt, i, j);
    if (n < cw * ch * 0.8) { cells.push({ i, j, ok: false }); continue; }
    const a = sum(xx, i, j), b = sum(yy, i, j), c = sum(xy, i, j), tr = a + b;
    const rms = Math.sqrt(tr / n), coh = tr > 0 ? Math.sqrt((a - b) ** 2 + 4 * c * c) / tr : 0;
    // The gradient's angle from the across-axis (0 = it points across the street: a line along it), 0–90.
    const sphi = (0.5 * Math.atan2(2 * c, a - b) * 180) / Math.PI, phi = Math.abs(sphi);
    cells.push({ i, j, rms, coh, phi, sphi, ok: rms >= HATCH.rms && coh >= HATCH.coh && phi >= HATCH.lo && phi <= HATCH.hi });
  }
  return { cells, cw, ch };
}
// How regularly the stripes repeat in the band [a, b]: the pixels of the middle rows projected on the direction across
// the stripes (the cells' gradient direction, angle sphi), averaged per step, the profile high-passed; its best
// autocorrelation at a lag of one stripe pitch (0.3–1.8 m) and the amplitude (grey levels).
function stripeRhythm(st, a, b, sphi) {
  const { nt, nu, res, t0, L } = st, cs = Math.cos((sphi * Math.PI) / 180), sn = Math.sin((sphi * Math.PI) / 180);
  const i0 = Math.max(0, Math.ceil((a + 0.1 - t0) / res)), i1 = Math.min(nt - 1, Math.floor((b - 0.1 - t0) / res));
  const j0 = Math.max(0, Math.round((ALONG - HATCH.centre) / res)), j1 = Math.min(nu - 1, Math.round((ALONG + HATCH.centre) / res));
  if (i1 - i0 < 3) return { r: 0, amp: 0 };
  const bins = new Map();
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const v = L[j * nt + i];
    if (Number.isNaN(v)) continue;
    const m = Math.round(i * cs + j * sn), q = bins.get(m) || [0, 0];
    q[0] += v; q[1]++; bins.set(m, q);
  }
  const keys = [...bins.keys()].sort((x, y) => x - y), lo = keys[0], hi = keys.at(-1), n = hi - lo + 1;
  if (n < Math.round(2.5 / res)) return { r: 0, amp: 0 };
  const p = Array.from({ length: n }, (_, k) => { const q = bins.get(lo + k); return q && q[1] >= 3 ? q[0] / q[1] : NaN; });
  const win = Math.max(2, Math.round(0.9 / res)), hp = p.map((v, k) => { if (Number.isNaN(v)) return NaN; const around = p.slice(Math.max(0, k - win), k + win + 1).filter((x) => !Number.isNaN(x)); return v - around.reduce((x, y) => x + y, 0) / around.length; });
  const ok = hp.filter((v) => !Number.isNaN(v)), amp = Math.sqrt(ok.reduce((x, v) => x + v * v, 0) / (ok.length || 1));
  let best = 0;
  for (let lag = Math.round(0.3 / res); lag <= Math.round(1.8 / res); lag++) {
    let num = 0, d1 = 0, d2 = 0;
    for (let k = 0; k + lag < n; k++) if (!Number.isNaN(hp[k]) && !Number.isNaN(hp[k + lag])) { num += hp[k] * hp[k + lag]; d1 += hp[k] ** 2; d2 += hp[k + lag] ** 2; }
    if (d1 && d2) best = Math.max(best, num / Math.sqrt(d1 * d2));
  }
  return { r: best, amp };
}
// The hatched bands in the roadway [s, e] (t across): [{ s, e, share }].
export function hatchBands(st, s, e, H = null) {
  const { res, t0 } = st, { cells, cw, ch } = hatchCells(st);
  // Per cell column: the share of oblique cells in the middle rows (the cut: u within ±centre) and along the strip.
  const byI = new Map();
  for (const c of cells) { if (!byI.has(c.i)) byI.set(c.i, []); byI.get(c.i).push(c); }
  const mid = (c) => Math.abs(ALONG - (c.j + ch / 2) * res) <= HATCH.centre;
  const cols = [...byI.entries()].sort((a, b) => a[0] - b[0]).map(([i, list]) => {
    const m = list.filter(mid), valid = (x) => x.rms !== undefined;
    return { t: t0 + (i + cw / 2) * res, c: m.filter(valid).length ? m.filter((x) => x.ok).length / m.filter(valid).length : 0, a: list.filter(valid).length ? list.filter((x) => x.ok).length / list.filter(valid).length : 0 };
  }).filter((x) => x.t > s - 0.3 && x.t < e + 0.3);
  const out = [];
  for (let k = 0; k < cols.length; k++) {
    if (cols[k].c < HATCH.centreShare || cols[k].a < HATCH.along) continue;
    let q = k;
    while (q + 1 < cols.length && cols[q + 1].c >= HATCH.centreShare * 0.7 && cols[q + 1].a >= HATCH.along * 0.7) q++;
    let a = cols[k].t - (cw / 2) * res, b = cols[q].t + (cw / 2) * res;
    // The solid lines that bound the strip lie just outside the oblique cells: the edges move to them.
    if (H) {
      const sh = shareCurve(st, H, a - 1, b + 1, 0, 0), peak = (lo, hi) => sh.filter((x) => x.t >= lo && x.t <= hi).reduce((m, x) => (x.v > m.v ? x : m), { v: 0 });
      const pa = peak(a - 0.8, a + 0.15), pb = peak(b - 0.15, b + 0.8);
      if (pa.v >= 0.45) a = pa.t;
      if (pb.v >= 0.45) b = pb.t;
    }
    const w = b - a;
    const tIn = (c) => { const t = t0 + (c.i + cw / 2) * res; return t >= a && t <= b; };
    const okc = cells.filter((c) => c.ok && tIn(c) && mid(c)), pos = okc.filter((c) => c.sphi > 0).length;
    const sph = okc.map((c) => c.sphi).sort((x, y) => x - y), rhythm = stripeRhythm(st, a, b, sph.length ? sph[sph.length >> 1] : 45);
    const stat = { rhy: rhythm.r, amp: rhythm.amp, sign: okc.length ? Math.max(pos, okc.length - pos) / okc.length : 0, coh: okc.length ? okc.reduce((x, c) => x + c.coh, 0) / okc.length : 0, rms: okc.length ? okc.reduce((x, c) => x + c.rms, 0) / okc.length : 0, a: cols.slice(k, q + 1).reduce((x, y) => x + y.a, 0) / (q - k + 1) };
    if (w >= HATCH.wMin && w <= HATCH.wMax && stat.sign >= HATCH.sign && stat.rhy >= HATCH.rhy && a - s >= HATCH.side && e - b >= HATCH.side) out.push({ ...stat, s: +a.toFixed(2), e: +b.toFixed(2), share: +(cols.slice(k, q + 1).reduce((x, y) => x + y.c, 0) / (q - k + 1)).toFixed(2) });
    k = q;
  }
  return out;
}
