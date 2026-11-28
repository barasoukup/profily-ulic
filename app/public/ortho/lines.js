import { ALONG, median } from "./image.js";

// ---------- the lines ----------
const FAINT = 0.55, LONG = 0.3, WEAK = 0.05, REL = 0.14, MIN_DL = 10, SHARE = 0.1, MAX_W = 0.6, BLOCKS = 8, MIN_SPREAD = 3, WIDER = 1.5;
const CURVES = [0, 1 / 200, -1 / 200, 1 / 100, -1 / 100, 1 / 50, -1 / 50];
// Pixels brighter than the median of their row's surroundings (±0.75 m) by REL of it; the value is by how much
// (paint stands out about twice as much as worn, lighter asphalt).
export function brightMap(st) {
  const { nt, nu, res, L } = st, win = Math.max(2, Math.round(0.75 / res)), H = new Uint8Array(nt * nu), step = Math.max(1, win >> 2);
  for (let j = 0; j < nu; j++) for (let i = win; i < nt - win; i++) {
    const v = L[j * nt + i];
    if (Number.isNaN(v)) continue;
    const around = [];
    for (let d = -win; d <= win; d += step) if (Math.abs(d) > 1) around.push(L[j * nt + i + d]);
    const m = median(around);
    if (v - m > Math.max(MIN_DL, REL * m)) H[j * nt + i] = Math.min(255, Math.round(v - m));
  }
  return H;
} // 1/R: the street may bend (Bára)
export function shareCurve(st, H, s, e, tan, k) {
  const { nt, nu, res, t0 } = st;
  const i0 = Math.max(0, Math.floor((s - WIDER - t0) / res)), i1 = Math.min(nt - 1, Math.floor((e + WIDER - t0) / res));
  const out = [];
  for (let i = i0; i <= i1; i++) {
    let n = 0, hit = 0, dl = 0;
    const bk = new Array(BLOCKS).fill(0), bn = new Array(BLOCKS).fill(0);
    for (let j = 0; j < nu; j++) {
      const u = ALONG - (j + 0.5) * res, ii = i + Math.round((u * tan + (k * u * u) / 2) / res);
      if (ii < 0 || ii >= nt || Number.isNaN(st.L[j * nt + ii])) continue;
      n++;
      const b = Math.min(BLOCKS - 1, Math.floor((j / nu) * BLOCKS));
      bn[b]++;
      if (H[j * nt + ii]) { hit++; bk[b]++; dl += H[j * nt + ii]; }
    }
    out.push({ t: t0 + (i + 0.5) * res, v: n ? hit / n : 0, dl: hit ? dl / hit : 0, spread: bk.filter((x, q) => bn[q] && x / bn[q] >= 0.1).length });
  }
  return out;
}
function peaks(share, res, min = SHARE, minSpread = MIN_SPREAD) {
  const out = [], sep = Math.round(0.3 / res);
  for (let k = 0; k < share.length; k++) {
    const v = share[k].v;
    if (v < min) continue;
    let top = true;
    for (let q = Math.max(0, k - sep); q <= Math.min(share.length - 1, k + sep); q++) if (share[q].v > v || (share[q].v === v && q < k)) { top = false; break; }
    if (!top) continue;
    let a = k, e = k;
    while (a > 0 && share[a - 1].v >= v / 2) a--;
    while (e + 1 < share.length && share[e + 1].v >= v / 2) e++;
    if ((e - a + 1) * res > MAX_W) continue;
    const ring = share.slice(Math.max(0, k - 2 * sep), Math.min(share.length, k + 2 * sep + 1)).map((x) => x.v);
    if (v - Math.min(...ring) < min * 0.8) continue;
    if (Math.max(...share.slice(a, e + 1).map((x) => x.spread)) < minSpread) continue;
    out.push({ t: share[k].t, share: v, dl: share[k].dl });
  }
  return out;
}
// Is the line at t dashed: along it, at least three dashes (runs of paint from 0.8 m, gaps of 0.3 m closed; the
// inner ones of about one length), with gaps from 1 m of about one length between them. A worn solid line breaks into short bits, one
// hidden by parked cars into irregular pieces.
function lineOn(st, H, t, tan, k) {
  const { nt, nu, res, t0 } = st, i = Math.round((t - t0) / res - 0.5);
  const on = [];
  for (let j = 0; j < nu; j++) {
    const u = ALONG - (j + 0.5) * res, ii = i + Math.round((u * tan + (k * u * u) / 2) / res);
    on.push(ii >= 0 && ii < nt && (H[j * nt + ii] || (ii > 0 && H[j * nt + ii - 1]) || (ii + 1 < nt && H[j * nt + ii + 1])) ? 1 : 0);
  }
  const close = Math.round(0.3 / res);
  for (let j = 0, last = -Infinity; j < nu; j++) if (on[j]) { if (j - last > 1 && j - last <= close) for (let q = last + 1; q < j; q++) on[q] = 1; last = j; }
  return on;
}
function dashed(st, H, t, tan, k) {
  const { nu, res } = st, on = lineOn(st, H, t, tan, k);
  const runs = [];
  for (let j = 0; j < nu;) { let q = j; while (q < nu && on[q] === on[j]) q++; runs.push({ on: on[j], len: (q - j) * res, inner: j > 0 && q < nu }); j = q; }
  const dash = runs.filter((r) => r.on && r.len >= 0.8).map((r) => r.len), gap = runs.filter((r) => !r.on && r.inner && r.len >= 1).map((r) => r.len);
  if (dash.length < 3 || gap.length < 2) return false;
  const even = (v) => { const m = v.reduce((a, x) => a + x, 0) / v.length; return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length) <= 0.45 * m; };
  return even(dash.slice(1, -1).length >= 2 ? dash.slice(1, -1) : dash) && even(gap);
}
// The rhythm of a line along the street (centreLine below): the share of its length with paint (gaps under 0.3 m
// closed), the longest bare run (m) and the number of paint runs of 0.8 m or more.
function lineRhythm(st, H, t, tan, k) {
  const { nu, res } = st, on = lineOn(st, H, t, tan, k);
  let sum = 0, gap = 0, longest = 0, dashes = 0, runOn = 0;
  for (let j = 0; j < nu; j++) {
    sum += on[j];
    if (on[j]) { gap = 0; runOn++; } else { gap++; longest = Math.max(longest, gap * res); if (runOn * res >= 0.8) dashes++; runOn = 0; }
  }
  if (runOn * res >= 0.8) dashes++;
  return { fill: sum / nu, gap: longest, dashes };
}
// The lines of one carriageway [s, e]: one direction and bend for all of them (the sharpest share curve).
function linesOf(st, H, s, e, wantRhythm = false) {
  let best = null;
  for (let deg = -3; deg <= 3 + 1e-9; deg += 0.5) for (const k of CURVES) {
    const sh = shareCurve(st, H, s, e, Math.tan((deg * Math.PI) / 180), k);
    const q = sh.reduce((a, x) => a + x.v * x.v, 0);
    if (!best || q > best.q) best = { q, sh, tan: Math.tan((deg * Math.PI) / 180), k };
  }
  // On a city's orthophoto (10 cm, paint fills its pixels) a line standing out less than FAINT of the carriageway's
  // strongest long line is worn, lighter asphalt between the wheel tracks, not paint (Jateční, Plzeň). On ČÚZK's
  // 12.5 cm a thin edge line looks as faint (Bohumínská), so there it stays.
  // Lines mostly hidden (a lorry over a dashed line: Poděbradská) come too, weak: they count only by how much
  // more than WEAK of them is seen, so they only win where the lanes do not fit without them.
  const strong = best ? peaks(best.sh, st.res) : [];
  const weak = best ? peaks(best.sh, st.res, WEAK, 2).filter((m) => m.share < SHARE).map((m) => ({ ...m, weak: true })) : [];
  const found = [...strong, ...weak].sort((a, b) => a.t - b.t).map((m) => ({ ...m, dashed: dashed(st, H, m.t, best.tan, best.k), ...(wantRhythm && lineRhythm(st, H, m.t, best.tan, best.k)) }));
  if (!st.fine) return found;
  const top = Math.max(0, ...found.filter((m) => m.share >= LONG).map((m) => m.dl));
  return found.filter((m) => m.dl >= FAINT * top);
}
// Strong lines anywhere across [s, e] (ortho-osm.js: an edge line V 4 lies just inside a kerb): their offsets.
export const strongLines = (st, s, e, min = 0.3) => linesOf(st, brightMap(st), s, e).filter((m) => m.share >= min).map((m) => m.t);
// Of those inside the carriageway, the set whose gaps look like lanes (2.5–4.75 m; at the kerbs 1–7.5 m for a
// shoulder; a gap of two lanes whose line is missing with a small penalty), the most line strength.
export const LANE_MIN = 2.5, LANE_MAX = 4.75, OUTER_MAX = 7.5, EDGE_MIN = 0.1;
const OUTER_MIN = 1, MISSED = 0.1, EDGE_SHARE = 0.5, DASHED_MAX = 0.6;
export function laneLines(st, H, s, e) {
  const all = linesOf(st, H, s, e), c = all.filter((m) => m.t > s + 0.7 && m.t < e - 0.7), n = c.length;
  const best = new Array(n).fill(-Infinity), prev = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    const first = c[i].t - s;
    const own = (m) => m.share - (m.weak ? WEAK : 0);
    if (first >= OUTER_MIN && first <= OUTER_MAX + LANE_MAX) best[i] = own(c[i]) - (first > OUTER_MAX ? MISSED : 0);
    for (let q = 0; q < i; q++) {
      const g = c[i].t - c[q].t, v = best[q] + own(c[i]) - (g > LANE_MAX ? MISSED : 0);
      if (g >= LANE_MIN && g <= 2 * LANE_MAX && v > best[i]) { best[i] = v; prev[i] = q; }
    }
  }
  let end = -1, top = 0;
  for (let i = 0; i < n; i++) { const last = e - c[i].t, v = best[i] - (last > OUTER_MAX ? MISSED : 0); if (last >= OUTER_MIN && last <= OUTER_MAX + LANE_MAX && v > top) { top = v; end = i; } }
  const chain = [];
  for (let i = end; i >= 0; i = prev[i]) chain.unshift(c[i]);
  // The edge lines close to the kerbs (a narrow shoulder, even 20 cm: Bára): a solid line within EDGE_NEAR of a kerb,
  // a lane's width from the next line.
  if (!chain.length) return [];
  const edge = (lo, hi) => all.filter((m) => m.t > lo && m.t < hi && m.share >= EDGE_SHARE).sort((a, b) => b.share - a.share)[0];
  const a = edge(s + EDGE_MIN, Math.min(s + 1, chain[0].t - LANE_MIN)), b = edge(Math.max(e - 1, chain.at(-1).t + LANE_MIN), e - EDGE_MIN);
  if (a) chain.unshift(a);
  if (b) chain.push(b);
  // The positions, and which of them are solid lines (true: an edge line, also one broken by short gaps, over
  // DASHED_MAX of its length, at a slip road: Rozvadovská spojka; false: dashed with long gaps, dividing lanes, or a
  // line mostly hidden, which an edge line is not; undefined: a faint line, not known).
  const out = chain.map((m) => m.t);
  out.solid = chain.map((m) => (m.weak || (m.dashed && m.share < DASHED_MAX) ? false : m.share >= EDGE_SHARE ? true : undefined));
  return out;
}
// ---------- the centre line of a two-way roadway ----------
// Does the roadway [s, e] (the cut's t) have a line down the middle, and is it solid or dashed (Bára 27. 11. 2026: the
// law of parking in Slovenia asks for it, ZPrCP čl. 65/4/12 and 65/4/10; countries/<ISO>.js centreLine)? The lines of
// the carriageway as laneLines reads them, one in the middle part of it (not an edge line or the boundary of a
// parking lane: 2.2 m from the kerbs; within a fifth of the width, at least 1.5 m, of the middle: a car parked on one
// side moves the middle of the lanes).
// Solid: paint along (nearly) all of its length; dashed: regular dashes and gaps, or a line with long bare runs.
// Returns { found: false } (a roadway seen, no line), { found: true, kind: "solid" | "dashed" | null (not known which),
// t, share, fill } or null (not known: no photo, the roadway outside it, a narrow one,).
export const CENTRE = { edge: 2.2, near: 0.2, nearMin: 1.5, solidFill: 0.8, dashedFill: 0.65, minWidth: 4.5, seen: 0.6 };
export function centreLine(st, s, e, H = null) {
  if (!st || !(e - s >= CENTRE.minWidth)) return null;
  if (s - 0.5 <= st.t0 || e + 0.5 >= st.t0 + st.nt * st.res) return null;
  // The middle part must be seen: pixels of the photo along it.
  const i0 = Math.max(0, Math.floor((s + CENTRE.edge - st.t0) / st.res)), i1 = Math.min(st.nt - 1, Math.floor((e - CENTRE.edge - st.t0) / st.res));
  let n = 0, known = 0;
  for (let j = 0; j < st.nu; j += 3) for (let i = i0; i <= i1; i += 3) { n++; if (!Number.isNaN(st.L[j * st.nt + i])) known++; }
  if (!n || known < CENTRE.seen * n) return null;
  H ??= brightMap(st);
  const mid = (s + e) / 2, win = Math.max(CENTRE.nearMin, CENTRE.near * (e - s));
  const c = linesOf(st, H, s, e, true).filter((m) => !m.weak && m.t > s + CENTRE.edge && m.t < e - CENTRE.edge && Math.abs(m.t - mid) <= win).sort((a, b) => b.share - a.share)[0];
  if (!c) return { found: false };
  const kind = c.dashed ? "dashed" : c.fill >= CENTRE.solidFill ? "solid" : c.fill <= CENTRE.dashedFill ? "dashed" : null;
  return { found: true, kind, t: +c.t.toFixed(2), share: +c.share.toFixed(2), fill: +c.fill.toFixed(2), gap: +c.gap.toFixed(1), dashes: c.dashes, regular: c.dashed };
}
