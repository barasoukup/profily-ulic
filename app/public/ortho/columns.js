import { median } from "./osm-along.js";

// ---------- the image across the cut, per column ----------
// Per 5 m piece along the street (8 of them) the median brightness of each column; the column's median over them,
// its green share (G ≥ 10: treetops, lawns) and saturation. The kerb is a step of brightness (or of green) that holds
// along the street: in most of the pieces, with the same sign. st: laneImage's (L, G, S; t0, res, nt, nu).
const BLOCKS = 8;
export function columns(st) {
  const { nt, nu, res, t0, L, G, S } = st, bl = Array.from({ length: BLOCKS }, () => new Float32Array(nt));
  const medL = new Float32Array(nt), green = new Float32Array(nt), sat = new Float32Array(nt), seen = new Float32Array(nt), yel = new Float32Array(nt);
  const bs = Array.from({ length: BLOCKS }, () => new Float32Array(nt));
  const per = Math.floor(nu / BLOCKS);
  const v_seen = (i) => { let c = 0; for (let j = 0; j < BLOCKS * per; j++) if (!Number.isNaN(L[j * nt + i])) c++; return c; };
  for (let i = 0; i < nt; i++) {
    let gn = 0, n = 0; const sv = [];
    for (let b = 0; b < BLOCKS; b++) {
      const v = [];
      for (let j = b * per; j < (b + 1) * per; j++) {
        const q = j * nt + i, x = L[q];
        if (Number.isNaN(x)) continue;
        v.push(x);
        // Under the crown of a tree OSM knows the green is the tree, not a lawn (st.canopy; Václavské náměstí).
        if (!st.canopy?.[q]) { n++; if (G[q] >= 10) gn++; }
        if (j % 2 === 0) sv.push(S[q]);
      }
      bl[b][i] = v.length ? median(v) : NaN;
      const vs = [];
      for (let j = b * per; j < (b + 1) * per; j += 2) { const q = j * nt + i; if (!Number.isNaN(L[q])) vs.push(S[q]); }
      bs[b][i] = vs.length ? median(vs) : NaN;
    }
    medL[i] = median(Array.from(bl, (x) => x[i]));
    // Yellowness ((R+G)/2 − B; LITERATURE-2.md: dry grass is yellow, a shadow blue), where the image has it.
    if (st.Y) { const yv = []; for (let j = 0; j < nu; j += 2) { const q = j * nt + i; if (!Number.isNaN(L[q])) yv.push(st.Y[q]); } yel[i] = yv.length ? median(yv) : NaN; } else yel[i] = NaN;
    green[i] = n ? gn / n : st.canopy ? 0 : NaN; sat[i] = median(sv); seen[i] = v_seen(i) / nu;
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
  // A change of surface (Bára 19. 11. 2026: the sidewalk's edge to the grass is plain to see, more than its kerb): in
  // brightness and in saturation, each against its own typical step on this image (no absolute values: seasons,
  // climates, orthophotos differ), per 5 m piece the largest step within ±0.3 m (an edge of front gardens is not
  // ruler-straight), the median over the pieces (it holds along the street). Ec, relative to its own typical value.
  const shift = Math.round(0.3 / res), stepAt = (arr, b, i) => {
    let a = 0, c = 0, na = 0, nc = 0;
    for (let k = 0; k < d; k++) { const x = arr[b][i - 1 - k], y = arr[b][i + k]; if (!Number.isNaN(x)) { a += x; na++; } if (!Number.isNaN(y)) { c += y; nc++; } }
    return na && nc ? Math.abs(c / nc - a / na) : NaN;
  };
  const allL = [], allS = [];
  for (let i = d; i <= nt - d; i += 2) for (let b = 0; b < BLOCKS; b++) { const x = stepAt(bl, b, i), y = stepAt(bs, b, i); if (x > 0) allL.push(x); if (y > 0) allS.push(y); }
  const tL = median(allL) || 1, tS = median(allS) || 1, ec = new Float32Array(nt + 1);
  for (let i = d + shift; i <= nt - d - shift; i++) {
    const per5 = [];
    for (let b = 0; b < BLOCKS; b++) {
      let best = NaN;
      for (let q = i - shift; q <= i + shift; q++) { const v = (stepAt(bl, b, q) || 0) / tL + (stepAt(bs, b, q) || 0) / tS; if (!(v <= best)) best = v; }
      if (Number.isFinite(best)) per5.push(best);
    }
    if (per5.length >= 4) ec[i] = median(per5);
  }
  const typicalC = median(Array.from(ec).filter((x) => x > 0)) || 1;
  const Ec = Float32Array.from(ec, (x) => x / typicalC);
  return { nt, res, t0, medL, green, sat, seen, yel, E, Ec, tL, tS, ti: (t) => Math.round((t - t0) / res), tOf: (i) => t0 + i * res };
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

// The green share of every column of the image that has one between a and b (m across the cut); none when there is no image.
export function greenValues(cols, a, b) {
  const g = [];
  if (cols) for (let i = cols.ti(a); i < cols.ti(b); i++) if (i >= 0 && i < cols.nt && Number.isFinite(cols.green[i])) g.push(cols.green[i]);
  return g;
}
export const meanOf = (g) => g.reduce((x, y) => x + y, 0) / g.length;
