import { RAILWAY_CODE } from "../types.js";
import { P } from "./settings.js";
import { greenValues, meanOf } from "./columns.js";
import { TRACK_HALF, heavyRail, railHalf } from "./rail.js";
import { OSM_SHARED, STREET } from "./road-tags.js";
import { AI_RUN, GREEN_AREA, HOUSE, PIECE_GREEN, SIDEWALK, SIDEWALK_MAX, SYMBOL_LABEL } from "./measures.js";

// The surfaces beside the street (parts of orthoOsmPolys, polys.js): what each side has from the kerb to the house, what the
// map's symbols and the last things of the street add, and what lies behind everything else.
const WALK_MIN = 1.0, WALK_WIN = 1.0; // the narrowest sidewalk the image may end (from the kerb) and the stretch of green that ends it (m)
const BACK_MIN = 2; // m: the shortest run of green or paving the image may give behind everything else
const REST_MAX = 12; // m: the paved area a stretch without a sidewalk may be

// A stretch without a sidewalk (past SIDEWALK_MAX, or all of it where OSM says there is none): greenery where the image
// is mostly green, a paved area up to REST_MAX m, else nothing (the profile ends: a yard, a field, a plot of its own).
// The kind the map's symbols give a stretch [a, b] across the cut (the most frequent within 15 m along), or null.
export function readyRest(cx) {
  const { symbols, tu, k, k2, rect, polys } = cx;
  const symT = symbols.map((p) => { const [t, u] = tu(p.x, p.y); return { t, u, code: p.code }; }).filter((p) => Math.abs(p.u) < 15);
  const symbolAt = (a, b) => {
    const n = new Map();
    for (const p of symT) if (p.t > a && p.t < b) n.set(p.code, (n.get(p.code) || 0) + 1);
    return n.size ? [...n].sort((x, y) => y[1] - x[1])[0][0] : null;
  };
  const rest = (a, b) => {
    const sym = symbolAt(a, b);
    if (SYMBOL_LABEL[sym]) { polys.push({ ...rect(sym, SYMBOL_LABEL[sym], a, b), guess: false }); cx.edgeUsed = true; return; }
    const g = greenValues(k.cols, a, b);
    if (g.length && meanOf(g) >= GREEN_AREA) polys.push(rect(401, "zeleň (ortofoto)", a, b));
    else if (b - a <= REST_MAX) polys.push(rect(1003, "plocha před domem (odhad)", a, b));
  };
  cx.edgeUsed = k.why.A === "mapa" || k.why.B === "mapa" || (k2 && (k2.why.A === "mapa" || k2.why.B === "mapa"));
  Object.assign(cx, { symbolAt, rest });
}

// The sidewalk of each side from the kerb to the house, and the rest of the stretch.
export function addSidewalks(cx) {
  for (const [side, sg] of [["A", -1], ["B", 1]]) addSidewalkOf(cx, side, sg);
}

// One side: how far a sidewalk is to be looked for (the house, OSM's tags, the default), then its pieces by the map's lines, the
// model, or the image alone.
function addSidewalkOf(cx, side, sg) {
  const { aiSurf, o, edgeT, road, k, k2, road2, pSide, rect, polys, reached } = cx;
  // Beyond the other carriageway its kerb and its sidewalk tags count.
  const out = k2 && side === pSide, rd = out ? road2 : road;
  const kerb = out ? k2[side] : k[side], f = o.facade[side], says = rd.sidewalk[side];
  const far = f !== null ? f : says === "no" ? null : says || rd.sidewalkW[side] ? kerb + sg * (rd.sidewalkW[side] || SIDEWALK) : null;
  reached[side] = far !== null && sg * (far - kerb) >= 0.3 ? far : kerb;
  if (far === null || sg * (far - kerb) < 0.3) return;
  const span = (x, y) => (sg < 0 ? [y, x] : [x, y]);
  // A sidewalk of at most SIDEWALK_MAX; the rest up to the house is some other area (a front garden, a yard, a lawn:
  // MTVU in Prague and Brno: 34 of 42 such stretches over 6 m hold a sidewalk of at most 6 m).
  // A smaller cap, also by the street's class, lost (docs/decisions.md): telling a sidewalk from other paving needs the
  // image, not a number.
  const swEnd = says === "no" ? kerb : Math.abs(far - kerb) > SIDEWALK_MAX ? kerb + sg * SIDEWALK_MAX : far;
  // Lines of the map across the stretch from the kerb to the house (not the house's own front): its pieces, each a
  // sidewalk or green by the image (Bára, Štúrova in Piešťany: the sidewalks lie by the houses, the green strip by
  // the kerb) or by the map's symbol in it. Without such lines a sidewalk from the kerb as before.
  const roadGreen = (() => { if (!k.cols) return 0; const g = []; for (let i = k.cols.ti(o.own.t - 1.5); i <= k.cols.ti(o.own.t + 1.5); i++) if (i >= 0 && i < k.cols.nt && Number.isFinite(k.cols.green[i])) g.push(k.cols.green[i]); return g.length ? g.reduce((x, y) => x + y, 0) / g.length : 0; })();
  const cuts = says === "no" ? [] : edgeT.filter((t) => sg * (t - kerb) >= 1 && sg * (far - t) > 0.5).sort((x, y) => sg * (x - y));
  const sc = { side, sg, kerb, far, span, swEnd, roadGreen, cuts };
  if (cuts.length) addPiecesByMapLines(cx, sc);
  else if (aiSurf && P.aiWalk) addPiecesByModel(cx, sc);
  else addPiecesByImage(cx, sc);
  // A house found only beside the cut (on a line u ≠ 0): its front drawn across the cut, so the profile ends at it.
  if (f !== null && o.facadeU[side] !== 0) polys.push({ ...rect(601, "budova (OSM, vedle řezu)", ...span(far, far + sg * HOUSE)), guess: false });
}

// The map's lines across the stretch from the kerb to the house cut it in pieces, each a sidewalk or green by the image or the symbol.
function addPiecesByMapLines(cx, sc) {
  const { k, rect, polys, symbolAt, rest } = cx;
  const { sg, kerb, far, span, roadGreen, cuts } = sc;
  cx.edgeUsed = true;
  const bounds = [kerb, ...cuts, far];
  for (let q = 0; q + 1 < bounds.length; q++) {
    const [a, b] = span(bounds[q], bounds[q + 1]);
    const sym = symbolAt(a, b);
    const put = (p) => polys.push(p);
    if (SYMBOL_LABEL[sym]) { put({ ...rect(sym, SYMBOL_LABEL[sym], a, b), guess: false }); continue; }
    const g = greenValues(k.cols, a, b);
    // Against the roadway's own share by the axis (the Slovak mosaic is greenish all over).
    const green = g.length && meanOf(g) >= PIECE_GREEN + roadGreen;
    // The last piece up to a house farther than a sidewalk: as the rest (a front garden, a yard). So is any other
    // paved piece wider than a sidewalk, and the first one by the kerb keeps SIDEWALK_MAX of sidewalk (1000 Slovak
    // streets: 8 sidewalks of 9–18 m between the town map's lines).
    const wide = !green && b - a > SIDEWALK_MAX;
    if (q === bounds.length - 2 && b - a > SIDEWALK_MAX) rest(a, b);
    else if (wide && q === 0) { const m = kerb + sg * SIDEWALK_MAX, [c, d] = span(kerb, m), [e, h] = span(m, bounds[1]); put(rect(702, "chodník (ortofoto a mapa)", c, d)); rest(e, h); }
    else if (wide) rest(a, b);
    else put(green ? rect(401, "zeleň (ortofoto a mapa)", a, b) : rect(702, "chodník (ortofoto a mapa)", a, b));
  }
}

// P.aiWalk (a trial, 19. 11. 2026): the model's kinds from the kerb to the house (or OSM's sidewalk end) decide
// sidewalk, green and other, in runs of at least AI_RUN (the rules confuse sidewalks under trees with lawns and
// dry lawns with paving; the hold-out: some 300 m each way).
function addPiecesByModel(cx, sc) {
  const { aiSurf, rect, polys } = cx;
  const { sg, kerb, far, span } = sc;
  const kindAt = (t) => { const kind = aiSurf(t); return kind === "chodník" ? 702 : kind === "zeleň" ? 401 : kind ? 1003 : null; };
  const runs = [];
  for (let t = kerb + sg * 0.1; sg * (far - t) > 0; t += sg * 0.2) { const c = kindAt(t) ?? runs.at(-1)?.c ?? 702; const l = runs.at(-1); if (l && l.c === c) l.e = t + sg * 0.1; else runs.push({ c, s: t - sg * 0.1, e: t + sg * 0.1 }); }
  for (let q = 0; q < runs.length; q++) if (runs.length > 1 && Math.abs(runs[q].e - runs[q].s) < AI_RUN) { const nb = q > 0 ? q - 1 : q + 1; runs[nb].s = sg * runs[nb].s < sg * runs[q].s ? runs[nb].s : runs[q].s; runs[nb].e = sg * runs[nb].e > sg * runs[q].e ? runs[nb].e : runs[q].e; runs.splice(q, 1); q = -1; }
  if (runs.length) { runs[0].s = kerb; runs.at(-1).e = far; }
  // Paving the model calls sidewalk counts as sidewalk only up to SIDEWALK_MAX from the kerb, beyond it as a paved
  // area (German maps: forecourts and yards of 8–12 m between the sidewalk and the house, the model's "sidewalk"
  // up to the house; the hold-out, Rudolf-Reusch-Straße, Pestalozzistraße).
  const lim = kerb + sg * SIDEWALK_MAX;
  const out = [];
  for (const r of runs) {
    if (r.c !== 702 || sg * (r.e - lim) <= 0) { out.push(r); continue; }
    if (sg * (r.s - lim) >= 0) { out.push({ ...r, c: 1003 }); continue; }
    out.push({ ...r, e: lim }, { c: 1003, s: lim, e: r.e });
  }
  runs.splice(0, runs.length, ...out);
  const LBL = { 702: "chodník (AI)", 401: "zeleň (AI)", 1003: "zpevněná plocha (AI)" };
  for (const r of runs) polys.push(rect(r.c, LBL[r.c], ...span(r.s, r.e)));
}

// The sidewalk ends where the image turns green for good (Bára 18. 11. 2026, Za Kalváriou in Prešov: a 1.4 m
// sidewalk by the kerb, then lawn and trees up to the house, was drawn 6 m wide: the cap, not the image). From
// WALK_MIN off the kerb on, the first WALK_WIN that is green as a piece between map lines is (PIECE_GREEN over
// the roadway's own share) ends it, if the next WALK_WIN is green too. Saturation, yellowness and edges of the
// image as other ends of it lost (docs/decisions.md).
function addPiecesByImage(cx, sc) {
  const { k, rect, polys, symbolAt, rest } = cx;
  const { sg, kerb, far, span, roadGreen } = sc;
  let swEnd = sc.swEnd;
  if (k.cols && swEnd !== kerb && Math.abs(swEnd - kerb) > WALK_MIN + 2 * WALK_WIN) {
    const greenOf = (x, y) => { const [a, b] = x < y ? [x, y] : [y, x], g = greenValues(k.cols, a, b); return g.length ? meanOf(g) : NaN; };
    const soft = (x, y) => greenOf(x, y) >= PIECE_GREEN + roadGreen;
    for (let x = kerb + sg * WALK_MIN; sg * (swEnd - x) > 2 * WALK_WIN; x += sg * 0.2) {
      if (soft(x, x + sg * WALK_WIN) && soft(x + sg * WALK_WIN, x + sg * 2 * WALK_WIN)) { swEnd = x; break; }
    }
  }
  if (swEnd !== kerb) {
    // The map's symbol in the sidewalk's stretch: a lawn there is a green strip, not a sidewalk.
    const sym = symbolAt(...span(kerb, swEnd));
    if (sym === 401) { polys.push({ ...rect(401, SYMBOL_LABEL[401], ...span(kerb, swEnd)), guess: false }); cx.edgeUsed = true; }
    else polys.push(rect(702, "chodník (ortofoto a OSM)", ...span(kerb, swEnd)));
  }
  if (swEnd !== far) rest(...span(swEnd, far));
}

// Between the street's own sidewalk and the end the last thing of the street sets (a path, a cycle track, tracks,
// another carriageway OSM maps there; Bára 18. 11. 2026: "Neurčeno" beyond the street in 67 of 87 Prague cuts, under
// it MTVU's green, paths and side roads; evaluation/ortho-osm/errors.mjs): each such thing drawn as what it is, the
// gaps between them green where the image is mostly green, else paved. A side road
// there is a roadway of its own.
export function addNearThings(cx) {
  const { o, k, rect, polys, chain, reached } = cx;
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    if (!chain[side].length || reached[side] === null) continue;
    let outer = reached[side];
    const span = (x, y) => (sg < 0 ? [y, x] : [x, y]);
    const fill = (x, y) => {
      if (sg * (y - x) < 0.3) return;
      const g = greenValues(k.cols, Math.min(x, y), Math.max(x, y));
      const green = g.length && meanOf(g) >= GREEN_AREA;
      polys.push(green ? rect(401, "zeleň (ortofoto)", ...span(x, y)) : rect(1003, "zpevněná plocha (odhad)", ...span(x, y)));
    };
    for (const w of chain[side]) {
      const kind = w.tags.railway === "tram" ? [705, "tramvajové těleso (OSM)", TRACK_HALF] : heavyRail(w, o) ? [RAILWAY_CODE, "železnice (OSM)", railHalf(w)] : w.tags.highway === "cycleway" && !OSM_SHARED(w.tags) ? [703, "cyklostezka (OSM)", 1.3]
        : STREET.test(w.tags.highway || "") ? [701, "vozovka (OSM, souběžná)", 3] : [702, "chodník (OSM, zvlášť)", SIDEWALK / 2];
      if (!kind) break;
      const a = w.t - sg * kind[2], b = w.t + sg * kind[2];
      if (sg * (b - outer) < 0.3) continue;
      fill(outer, a);
      polys.push(rect(kind[0], kind[1], ...span(sg * (a - outer) > 0 ? a : outer, b)));
      outer = b;
    }
  }
}

// Whatever is left uncovered beyond the street (a yard, a lawn past a path, ground up to a house farther than REST_MAX:
// "Neurčeno" in most cuts, errors.mjs, Bára 18. 11. 2026): green or paved by the image, in runs of at least
// BACK_MIN, behind everything else (the order is the priority; trimToEnds does not reach out for them).
export function addBackground(cx) {
  const { o, k, k2, pSide, rect, polys, hard } = cx;
  if (k.cols) {
    const c = k.cols, half = Math.round(1 / c.res), isG = [];
    for (let i = 0; i < c.nt; i++) {
      let sum = 0, n = 0;
      for (let q = i - half; q <= i + half; q++) if (q >= 0 && q < c.nt && Number.isFinite(c.green[q]) && c.seen[q] >= 0.5) { sum += c.green[q]; n++; }
      isG.push(n ? sum / n >= GREEN_AREA : null);
    }
    const runs = [];
    for (let i = 0; i < c.nt; i++) {
      if (isG[i] === null) continue;
      const l = runs.at(-1);
      if (l && l.g === isG[i] && l.i1 === i - 1) l.i1 = i; else runs.push({ g: isG[i], i0: i, i1: i });
    }
    // Short runs join the longer neighbour.
    for (let q = 0; q < runs.length; q++) {
      const r = runs[q];
      if ((r.i1 - r.i0 + 1) * c.res >= BACK_MIN || runs.length < 2) continue;
      const nb = q > 0 && (q === runs.length - 1 || runs[q - 1].i1 - runs[q - 1].i0 >= runs[q + 1].i1 - runs[q + 1].i0) ? q - 1 : q + 1;
      if (runs[nb].i1 === r.i0 - 1 || runs[nb].i0 === r.i1 + 1) { runs[nb].i0 = Math.min(runs[nb].i0, r.i0); runs[nb].i1 = Math.max(runs[nb].i1, r.i1); runs.splice(q, 1); q = -1; }
    }
    // Not behind a house; paving only up to REST_MAX (a far house gives no tens of metres of paving).
    const fA = o.facade.A ?? -Infinity, fB = o.facade.B ?? Infinity;
    for (const r of runs) {
      const a = Math.max(fA, c.tOf(r.i0) - c.res / 2), b = Math.min(fB, c.tOf(r.i1) + c.res / 2);
      // Paving beyond REST_MAX is no lot of the street, but up to a wall, a fence or steps the street's side ends at (Bára
      // 27. 11. 2026, Leipzig, Berliner Straße: the profile stopped 1.3 m before the wall): from the kerb to that end.
      if (!r.g && b - a > REST_MAX) {
        for (const [side, sg] of [["A", -1], ["B", 1]]) {
          const e = hard[side];
          if (e === null) continue;
          const kt = (k2 && side === pSide ? k2 : k)[side], [x, y] = sg < 0 ? [Math.max(a, e), Math.min(b, kt)] : [Math.max(a, kt), Math.min(b, e)];
          if (y - x >= BACK_MIN) polys.push(rect(1003, "zpevněná plocha (odhad)", x, y));
        }
        continue;
      }
      if (b - a < BACK_MIN || (!r.g && b - a > REST_MAX)) continue;
      polys.push(r.g ? rect(401, "zeleň (ortofoto)", a, b) : rect(1003, "zpevněná plocha (odhad)", a, b));
    }
  }
}
