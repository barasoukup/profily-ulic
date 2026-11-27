// The parameters of M1 and M2 (methods.mjs P) tuned on Prague's cuts and checked on Brno's (cross-check: Brno is
// not seen while tuning). A grid over the weights; the score is the share of kerbs within 0.5 m plus the share
// within 1 m, over all of a city's orthophotos.
//   node evaluation/ortho-osm/tune.mjs        → printed; the best set goes into methods.mjs P by hand
import { cuts, truthOf, osmAround, osmAlong, stripOf, SOURCES, ALONG } from "./lib.mjs";
import { strongLines, osmRoad, withRails, limits, m1, m2, m3, columns, P } from "./methods.mjs";

const CAR = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service)(_link)?$/;
async function prepare(city) {
  const out = [];
  for (const c of await cuts(city)) {
    const o = osmAlong(await osmAround(c.cut.lat, c.cut.lon), c);
    if (!o.own) continue;
    const axis = o.own.t, truth = truthOf(c, axis);
    if (!truth.way || c.a.junction || o.ways.some((w) => CAR.test(w.tags.highway || "") && w.tags.area !== "yes" && w.t > truth.way.s + 0.5 && w.t < truth.way.e - 0.5)) continue;
    const road = withRails(osmRoad(o.own), o), lim = limits(o, axis);
    for (const key of Object.keys(SOURCES[city])) {
      const st = await stripOf(city, key, c);
      if (!st) continue;
      st.at = (t, u) => [Math.floor((t - st.t0) / st.res), Math.floor((ALONG - u) / st.res)];
      const lo = Math.max(lim.A, st.t0 + 0.5), hi = Math.min(lim.B, st.t0 + st.nt * st.res - 0.5);
      const lines = hi - lo > 4 ? strongLines(st, lo + 1.5, hi - 1.5) : [];
      out.push({ key, cols: columns(st), axis, lim, road, lines, truth });
    }
  }
  return out;
}
function score(set, method) {
  let n = 0, a = 0, b = 0;
  for (const x of set) {
    const k = method === "m1" ? m1(x.cols, x.axis, x.lim) : method === "m3" ? m3(x.cols, x.axis, x.lim, x.road, x.lines) : m2(x.cols, x.axis, x.lim, x.road, x.lines);
    if (!k) continue;
    for (const e of [Math.abs(k.A - x.truth.way.s), Math.abs(k.B - x.truth.way.e)]) { n++; if (e <= 0.5) a++; if (e <= 1) b++; }
  }
  return { s: (a + b) / n, in05: a / n, in1: b / n };
}
const praha = await prepare("praha"), brno = await prepare("brno");
const fmt = (r) => `${(100 * r.in05).toFixed(0)} % / ${(100 * r.in1).toFixed(0)} %`;
console.log("výchozí P", JSON.stringify(P));
console.log("M1 Praha", fmt(score(praha, "m1")), "Brno", fmt(score(brno, "m1")));
console.log("M2 Praha", fmt(score(praha, "m2")), "Brno", fmt(score(brno, "m2")));
console.log("M3 Praha", fmt(score(praha, "m3")), "Brno", fmt(score(brno, "m3")));
for (const key of new Set(praha.map((x) => x.key))) console.log("  ", key, "M2", fmt(score(praha.filter((x) => x.key === key), "m2")), "M3", fmt(score(praha.filter((x) => x.key === key), "m3")));
for (const key of new Set(brno.map((x) => x.key))) console.log("  ", key, "M2", fmt(score(brno.filter((x) => x.key === key), "m2")), "M3", fmt(score(brno.filter((x) => x.key === key), "m3")));

// M1: the tolerance of "looks like the road" and the stopping run.
let best = null;
const base = { ...P };
for (const tolL of [0.12, 0.2, 0.3]) for (const tolS of [12, 18, 30]) for (const stopRun of [0.5, 0.8, 1.5]) {
  Object.assign(P, base, { tolL, tolS, stopRun });
  const r = score(praha, "m1");
  if (!best || r.s > best.r.s) best = { r, p: { tolL, tolS, stopRun } };
}
Object.assign(P, base, best.p);
console.log("M1 nejlepší na Praze", JSON.stringify(best.p), "Praha", fmt(best.r), "Brno", fmt(score(brno, "m1")));
const m1best = best.p;
// M2: the weights (with M1's tolerances).
best = null;
for (const alpha of [0.5, 1.5, 3]) for (const beta of [0.1, 0.25, 0.5, 1]) for (const gamma of [0, 0.8, 1.5]) for (const sigmaRel of [0.2, 0.3, 0.5]) for (const minEdge of [1.2, 1.6, 2.5]) {
  Object.assign(P, base, m1best, { alpha, beta, gamma, sigmaRel, minEdge });
  const r = score(praha, "m2");
  if (!best || r.s > best.r.s) best = { r, p: { alpha, beta, gamma, sigmaRel, minEdge } };
}
Object.assign(P, base, m1best, best.p);
console.log("M2 nejlepší na Praze", JSON.stringify(best.p), "Praha", fmt(best.r), "Brno", fmt(score(brno, "m2")));
// And the other way round: tuned on Brno, checked on Prague (how much the tuning carries over).
best = null;
for (const alpha of [0.5, 1.5, 3]) for (const beta of [0.1, 0.25, 0.5, 1]) for (const gamma of [0, 0.8, 1.5]) for (const sigmaRel of [0.2, 0.3, 0.5]) for (const minEdge of [1.2, 1.6, 2.5]) {
  Object.assign(P, base, m1best, { alpha, beta, gamma, sigmaRel, minEdge });
  const r = score(brno, "m2");
  if (!best || r.s > best.r.s) best = { r, p: { alpha, beta, gamma, sigmaRel, minEdge } };
}
Object.assign(P, base, m1best, best.p);
console.log("M2 nejlepší na Brně", JSON.stringify(best.p), "Brno", fmt(best.r), "Praha", fmt(score(praha, "m2")));

// ---------- where the ceiling is ----------
// (1) Is there an edge candidate near the true kerb at all (≤ 0.3 / 0.5 m)? (2) M2 if OSM knew the carriageway's
// true width (a width tag everywhere, the axis as OSM has it). (3) M2 if OSM also had the axis in the middle.
Object.assign(P, base);
for (const [city, set] of [["Praha", praha], ["Brno", brno]]) {
  const by = {};
  for (const x of set) {
    const v = (by[x.key] ??= { n: 0, c03: 0, c05: 0, r05: 0, w05: 0, w1: 0, a05: 0, a1: 0 });
    const w = Math.round(0.3 / x.cols.res), cand = [];
    for (let i = 1; i < x.cols.E.length - 1; i++) {
      if (x.cols.E[i] < P.minEdge) continue;
      let top = true;
      for (let q = i - w; q <= i + w; q++) if (q !== i && x.cols.E[q] > x.cols.E[i]) { top = false; break; }
      if (top) cand.push(x.cols.tOf(i));
    }
    const tw = x.truth.way;
    const k = m2(x.cols, x.axis, x.lim, { ...x.road, reach: { A: x.axis - tw.s, B: tw.e - x.axis } }, x.lines);
    const mid = (tw.s + tw.e) / 2, half = (tw.e - tw.s) / 2;
    const k2 = m2(x.cols, mid, x.lim, { ...x.road, reach: { A: half, B: half } }, x.lines);
    for (const [t, side] of [[tw.s, "A"], [tw.e, "B"]]) {
      v.n++;
      const d = Math.min(...cand.map((c) => Math.abs(c - t)));
      if (d <= 0.3) v.c03++;
      if (d <= 0.5) v.c05++;
      // The same for a place 1.5 m into the carriageway (a chance hit: how dense the candidates are).
      const t2 = side === "A" ? t + 1.5 : t - 1.5;
      if (Math.min(...cand.map((c) => Math.abs(c - t2))) <= 0.5) v.r05++;
      if (k && Math.abs(k[side] - t) <= 0.5) v.w05++;
      if (k && Math.abs(k[side] - t) <= 1) v.w1++;
      if (k2 && Math.abs(k2[side] - t) <= 0.5) v.a05++;
      if (k2 && Math.abs(k2[side] - t) <= 1) v.a1++;
    }
  }
  for (const [key, v] of Object.entries(by)) console.log(city, key, `hrana u obruby do 0,3 m ${(100 * v.c03 / v.n).toFixed(0)} %, do 0,5 m ${(100 * v.c05 / v.n).toFixed(0)} % (náhodně 1,5 m ve vozovce ${(100 * v.r05 / v.n).toFixed(0)} %); M2 se skutečnou šířkou ${(100 * v.w05 / v.n).toFixed(0)} % / ${(100 * v.w1 / v.n).toFixed(0)} %; i s osou uprostřed ${(100 * v.a05 / v.n).toFixed(0)} % / ${(100 * v.a1 / v.n).toFixed(0)} %`);
}
