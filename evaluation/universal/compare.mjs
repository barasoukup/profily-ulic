// The universal comparison of two profiles (Bára 17. 11. 2026: the composition first, then the width of the whole
// street): both as the judge's classes (BRIEF.md), A→B. Composition: the sequence of classes with neighbours of the same
// class merged, within the street space (core()) and without the shoulders ("krajnice"); compared by edit distance
// (a part missing, added or of another class is one edit). Lanes: their count. Width: the street space (core()).
export const CLASS = {
  chodnik: "chodnik", chodnik_kola: "chodnik", stezka_sdilena: "chodnik", nastupiste: "nastupiste",
  cyklostezka: "cyklostezka", cyklopruh: "cyklopruh", ochranny_pruh: "cyklopruh",
  parkovani: "stani", pruh: "pruh", pruh_piktokoridor: "pruh", obsluzna: "pruh", bus: "bus", bus_cyklo: "bus",
  tramvaj: "tramvaj", tramvaj_pruh: "tramvaj", tramvaj_v_pruhu: "tramvaj",
  zelen: "zelen", stromorad: "stromy", delici: "delici", krajnice: "krajnice",
  railway: "zeleznice", // a railway beside the street (27. 11. 2026; the judge's code in evaluation/archive/railway/BRIEF.md)
};
const KNOWN = new Set(["chodnik", "stani", "pruh", "bus", "cyklopruh", "cyklostezka", "tramvaj", "zelen", "stromy", "delici", "nastupiste", "krajnice", "zeleznice", "jine"]);
// Parts as [class, width]: an app profile ([type, width] or {type, width}) or the judge's ([code, width, …], "?" dropped).
export function asClasses(parts, judge = false) {
  return parts.map((p) => {
    const [t, w] = Array.isArray(p) ? p : [p.type, p.width];
    const c = judge ? String(t).replace("?", "") : CLASS[t] || "jine";
    return [KNOWN.has(c) ? c : "jine", +w || 0];
  });
}
// The street space: from the first to the last part of the street itself (sidewalk, parking, a lane, cycle, tram, a
// platform); green, trees and land beyond its sidewalks are not counted (the reference and the judge end it
// differently: a verge, a front garden, the window of the cut). Green or trees between two lanes is a median.
const CORE = new Set(["chodnik", "stani", "pruh", "bus", "cyklopruh", "cyklostezka", "tramvaj", "nastupiste", "delici", "zeleznice"]);
const ROADWAY = new Set(["pruh", "bus", "tramvaj"]);
export function core(cls) {
  const out = cls.map(([c, w], i) => {
    if (c !== "zelen" && c !== "stromy") return [c, w];
    const between = cls.slice(0, i).some(([x]) => ROADWAY.has(x)) && cls.slice(i + 1).some(([x]) => ROADWAY.has(x));
    return [between ? "delici" : "zelen", w];
  });
  const i = out.findIndex(([c]) => CORE.has(c)), j = out.findLastIndex(([c]) => CORE.has(c));
  return i < 0 ? [] : out.slice(i, j + 1);
}
export function composition(cls) {
  const seq = [];
  for (const [c] of core(cls)) if (c !== "krajnice" && c !== "jine" && seq.at(-1) !== c) seq.push(c);
  return seq;
}
export const lanes = (cls) => cls.filter(([c]) => c === "pruh" || c === "bus" || c === "tramvaj").length;
export const streetWidth = (cls) => core(cls).reduce((a, [, w]) => a + w, 0);
// Edit distance with the edits listed: missing (in a, not in b), extra (in b), other (a class for another).
export function diff(a, b) {
  const n = a.length, m = b.length, d = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i ? (j ? 0 : i) : j)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const edits = [];
  for (let i = n, j = m; i > 0 || j > 0;) {
    if (i && j && d[i][j] === d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) { if (a[i - 1] !== b[j - 1]) edits.push(`${a[i - 1]}→${b[j - 1]}`); i--; j--; }
    else if (i && d[i][j] === d[i - 1][j] + 1) { edits.push(`chybí ${a[i - 1]}`); i--; }
    else { edits.push(`navíc ${b[j - 1]}`); j--; }
  }
  return { dist: d[n][m], edits };
}
// A side without a facade (the judge's facadeA / facadeB false; Bára 23. 11. 2026): where the street space ends there is
// arbitrary (the judge stops counting grass somewhere, the app at its own end), so on that side the street ends at its
// own outermost part at the road: from the outermost part of the roadway (a lane, BUS, tram, parking, a cycle lane, a
// shoulder) outwards a sidewalk, a cycle track or a platform directly beyond it, each of them also across a verge (green,
// trees, a shoulder) of at most VERGE_MAX between it and the road; nothing farther (a path across a lawn, a car park).
// The width and the composition count up to that edge (the shoulder at the road included); nothing beyond it, not even
// green (Bára 24. 11. 2026: ending at the kerb there is right for the user, so the measurement must not count it as
// missing green).
const VERGE_MAX = 3;
const ROAD_EDGE = new Set(["pruh", "bus", "tramvaj", "stani", "cyklopruh", "krajnice"]), WALK = new Set(["chodnik", "cyklostezka", "nastupiste", "zeleznice"]), VERGE = new Set(["zelen", "krajnice"]);
// open: { A, B } true where the side has no facade. Returns the street's parts.
export function scope(cls, open = {}) {
  const out = cls.map(([c, w], i) => {
    if (c !== "zelen" && c !== "stromy") return [c, w];
    const between = cls.slice(0, i).some(([x]) => ROADWAY.has(x)) && cls.slice(i + 1).some(([x]) => ROADWAY.has(x));
    return [between ? "delici" : "zelen", w]; // as core(): trees beside the street are green
  });
  let i = out.findIndex(([c]) => CORE.has(c)), j = out.findLastIndex(([c]) => CORE.has(c));
  if (i < 0) return { parts: [] };
  // The street's edge going outwards from index r by step (+1 towards B, -1 towards A).
  const edge = (r, step) => {
    let k = r;
    for (let q = r + step; q >= 0 && q < out.length;) {
      if (WALK.has(out[q][0])) { k = q; q += step; continue; }
      const n = q + step;
      if (VERGE.has(out[q][0]) && out[q][1] <= VERGE_MAX && n >= 0 && n < out.length && WALK.has(out[n][0])) { k = n; q = n + step; continue; }
      break;
    }
    return k;
  };
  const r0 = out.findIndex(([c]) => ROAD_EDGE.has(c)), r1 = out.findLastIndex(([c]) => ROAD_EDGE.has(c));
  if (open.A && r0 >= 0) i = edge(r0, -1);
  if (open.B && r1 >= 0) j = edge(r1, 1);
  return { parts: out.slice(i, j + 1) };
}
function compositionOf({ parts }) {
  const seq = [];
  for (const [c] of parts) if (c !== "krajnice" && c !== "jine" && seq.at(-1) !== c) seq.push(c);
  return seq;
}
// a: the reference, b: the judged profile. open: { A, B } the sides without a facade (the judge's), the same for both;
// none given: the street space as core() (the calibration, OLD=1 in score-states.mjs).
export function compare(aParts, bParts, aJudge = false, bJudge = false, open = null) {
  const a = asClasses(aParts, aJudge), b = asClasses(bParts, bJudge);
  if (!open) {
    const ca = composition(a), cb = composition(b), { dist, edits } = diff(ca, cb);
    return { same: dist === 0, score: 1 - dist / Math.max(ca.length, cb.length, 1), edits, lanesA: lanes(a), lanesB: lanes(b), widthA: streetWidth(a), widthB: streetWidth(b) };
  }
  const sa = scope(a, open), sb = scope(b, open), ca = compositionOf(sa), cb = compositionOf(sb), { dist, edits } = diff(ca, cb);
  const width = (s) => s.parts.reduce((x, [, w]) => x + w, 0);
  return { same: dist === 0, score: 1 - dist / Math.max(ca.length, cb.length, 1), edits, lanesA: lanes(a), lanesB: lanes(b), widthA: width(sa), widthB: width(sb) };
}
