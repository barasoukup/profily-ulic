// A/B of two variants (code-health plan, step 19): the measures of a profile, what makes two profiles differ, the review
// file of verdicts and its summary (moved from evaluation/ab.mjs, same text out), and the blind pairs for a judge: the
// order A/B random and recorded, un-blinded afterwards. Pure functions over plain data.

// ---------- Measures of a profile ----------
const ROADWAY = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "tramvaj", "krajnice", "parkovani", "cyklopruh", "ochranny_pruh", "obsluzna"]);
const SIDEWALK = new Set(["chodnik", "chodnik_kola", "stezka_sdilena"]);
const sum = (segs, set) => +segs.filter((s) => set.has(s.type)).reduce((a, s) => a + s.width, 0).toFixed(2);
export function measures(p) {
  if (!p?.segments) return null;
  const total = p.segments.reduce((a, s) => a + s.width, 0);
  const unknown = p.segments.filter((s) => s.type === "nezname").reduce((a, s) => a + s.width, 0);
  return {
    total: +total.toFixed(2), roadway: sum(p.segments, ROADWAY), sidewalk: sum(p.segments, SIDEWALK),
    edges: [p.edges?.left, p.edges?.right], unknown: +(total ? unknown / total : 0).toFixed(3),
    osmEstimate: /odhad z OSM/.test(p.notice || ""), parts: p.segments.length,
    // Street furniture by kind, tree strips, parking strips and how many of them are estimates.
    items: p.segments.flatMap((s) => (s.items || []).map((it) => it.kind)).sort().join(","),
    trees: p.segments.filter((s) => s.type === "stromorad").length,
    parking: p.segments.filter((s) => s.type === "parkovani").map((s) => s.source).sort().join(","),
    // The parts in order with their kind of tram bed and lane widths rounded to 0.25 m (PARTS=1).
    kinds: p.segments.map((s) => s.type + (s.bed ? `:${s.bed}` : "") + (s.withBus ? "+bus" : "") + (s.position ? `@${s.position}` : "")).join(","),
    lanes: p.segments.filter((s) => s.type === "pruh" || s.type === "krajnice").map((s) => `${s.type[0]}${Math.round(s.width * 4) / 4}`).join(","),
  };
}
// How two sets of measures differ (empty: the same). items: also street furniture, trees and parking (ITEMS=1); parts: also the
// kinds of parts and the lanes (PARTS=1).
export function differs(a, b, { items = process.env.ITEMS === "1", parts = process.env.PARTS === "1" } = {}) {
  if (!a || !b) return ["chybí"];
  const out = [];
  if (Math.abs(a.roadway - b.roadway) > 0.5) out.push(`vozovka ${a.roadway}/${b.roadway}`);
  if (Math.abs(a.sidewalk - b.sidewalk) > 0.5) out.push(`chodník ${a.sidewalk}/${b.sidewalk}`);
  if (a.edges[0] !== b.edges[0] || a.edges[1] !== b.edges[1]) out.push(`okraje ${a.edges.join("+")}/${b.edges.join("+")}`);
  if (a.osmEstimate !== b.osmEstimate) out.push(`odhad OSM ${a.osmEstimate ? "A" : "B"}`);
  if (items) {
    if ((a.items ?? "") !== (b.items ?? "")) out.push(`předměty ${a.items || "-"}/${b.items || "-"}`);
    if ((a.trees ?? 0) !== (b.trees ?? 0)) out.push(`stromy ${a.trees}/${b.trees}`);
    if ((a.parking ?? "") !== (b.parking ?? "")) out.push(`stání ${a.parking || "-"}/${b.parking || "-"}`);
  }
  if (parts) {
    if ((a.kinds ?? "") !== (b.kinds ?? "")) out.push(`části ${a.kinds}/${b.kinds}`);
    if ((a.lanes ?? "") !== (b.lanes ?? "")) out.push(`pruhy ${a.lanes || "-"}/${b.lanes || "-"}`);
  }
  return out;
}

// ---------- The review file: one line per differing cut, a verdict a / b / obě / žádná ----------
const VERDICT = /verdikt:\s*(a|b|obě|obe|both|žádná|zadna|neither)(?=[\s·,.;]|$)/iu;
export const normVerdict = (v) => ({ a: "a", b: "b", "obě": "obě", obe: "obě", both: "obě", "žádná": "žádná", zadna: "žádná", neither: "žádná" })[v.toLowerCase()];
// The text of review.md → Map(n → { verdict, line }); the verdict is null where it is still "?".
export function parseReview(text) {
  const out = new Map();
  for (const line of text.split("\n")) {
    const n = line.match(/^- č\. (\d+)/)?.[1], v = line.match(VERDICT)?.[1];
    if (n) out.set(Number(n), { verdict: v ? normVerdict(v) : null, line });
  }
  return out;
}
// The text of review.md for the pairs { sample, cut, a, b } (a, b: a variant's result with .measures); a verdict already filled in
// (old: parseReview) is kept.
export function reviewText(city, a, b, pairs, old = new Map(), diff = differs) {
  const lines = [`# ${city}: A = ${a}, B = ${b}`, "",
    "Posuďte každý řez nad ortofotem (png/<n>.svg.png) a místo `?` napište `a`, `b`, `obě` nebo `žádná`;",
    "za verdikt krátkou poznámku. `--summary` verdikty sečte. Nový běh vyplněné verdikty zachová.", ""];
  for (const r of pairs) {
    const d = diff(r.a?.measures, r.b?.measures);
    if (!d.length) continue;
    const keep = old.get(r.sample.n);
    if (keep?.verdict) { lines.push(keep.line); continue; }
    lines.push(`- č. ${r.sample.n} ${r.cut?.highway || ""} ${r.cut?.name || ""}: ${d.join("; ")} · verdikt: ? · `);
  }
  return lines.join("\n") + "\n";
}

// ---------- The summary of a pair ----------
export const median = (xs) => { const v = xs.filter((x) => Number.isFinite(x)).sort((p, q) => p - q); return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : NaN; };
// The lines of `--summary`: pairs as read from the pair's folder, review = parseReview(...) (empty Map without one). list: the differing cuts too.
export function summaryLines(city, a, b, pairs, review = new Map(), { list = true, diff = differs } = {}) {
  const rs = pairs, ok = rs.filter((r) => r.a?.measures && r.b?.measures);
  const A = (k) => ok.map((r) => r.a.measures[k]), B = (k) => ok.map((r) => r.b.measures[k]);
  const d = (k) => median(ok.map((r) => Math.abs(r.a.measures[k] - r.b.measures[k])));
  const within = (k) => ok.filter((r) => Math.abs(r.a.measures[k] - r.b.measures[k]) <= 0.5).length;
  const different = ok.filter((r) => diff(r.a.measures, r.b.measures).length);
  const mean = (xs) => xs.reduce((p, q) => p + q, 0) / (xs.length || 1);
  const out = [`\n== ${city}: A ${a} × B ${b} ==`,
    `${rs.length} řezů, ${ok.length} se dvěma profily, ${rs.length - ok.length} chyb`,
    `shoda (vozovka i chodník do 0,5 m, stejné okraje, stejně odhad z OSM): ${ok.length - different.length}/${ok.length}, liší se ${different.length}`,
    `vozovka do 0,5 m ${within("roadway")}, chodník do 0,5 m ${within("sidewalk")}, okraje stejné ${ok.filter((r) => r.a.measures.edges.join() === r.b.measures.edges.join()).length}`,
    `medián |rozdílu|: vozovka ${d("roadway").toFixed(2)} m, chodník ${d("sidewalk").toFixed(2)} m, celkem ${d("total").toFixed(2)} m`,
    `B širší vozovka (> 0,5 m) ${ok.filter((r) => r.b.measures.roadway - r.a.measures.roadway > 0.5).length}, užší ${ok.filter((r) => r.a.measures.roadway - r.b.measures.roadway > 0.5).length}`,
    `odhad z OSM: A ${A("osmEstimate").filter(Boolean).length}, B ${B("osmEstimate").filter(Boolean).length}; Neurčeno průměr A ${mean(A("unknown")).toFixed(3)}, B ${mean(B("unknown")).toFixed(3)}`,
    `čas ploch (medián ms): A ${median(ok.map((r) => r.a.surfacesMs))}, B ${median(ok.map((r) => r.b.surfacesMs))}; dotazů na řez (medián): A ${median(ok.map((r) => r.a.requests))}, B ${median(ok.map((r) => r.b.requests))}`];
  const counts = { a: 0, b: 0, "obě": 0, "žádná": 0 };
  let open = 0;
  for (const r of different) { const v = review.get(r.sample.n)?.verdict; if (v) counts[v]++; else open++; }
  out.push(`verdikty (${different.length - open}/${different.length} posouzeno): lepší A ${counts.a}, lepší B ${counts.b}, obě ${counts["obě"]}, žádná ${counts["žádná"]}`);
  if (list) for (const r of different) out.push(`  ${r.sample.n} ${r.cut.highway} ${r.cut.name || ""}: ${diff(r.a.measures, r.b.measures).join("; ")}${review.get(r.sample.n)?.verdict ? ` → ${review.get(r.sample.n).verdict}` : ""}`);
  for (const r of rs) if (!r.a?.measures || !r.b?.measures) out.push(`  ${r.sample.n}: ${r.error || r.a?.error || r.b?.error}`);
  return out;
}

// ---------- Blind pairs for a judge ----------
function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// pairs: [{ id, a, b }] (a, b: whatever the judge is shown of variant A and B: a file, a profile). Returns { items, key }: items
// [{ id, first, second }] in a random order with A and B randomly on either position; key { id: "ab" | "ba" } says which is which,
// and is kept apart from what the judge sees (write it to a file the judge is not given). Seeded: the same seed, the same order.
export function blindPairs(pairs, seed) {
  const rnd = rng(seed), key = {}, items = pairs.map((p) => {
    const swap = rnd() < 0.5;
    key[p.id] = swap ? "ba" : "ab";
    return swap ? { id: p.id, first: p.b, second: p.a } : { id: p.id, first: p.a, second: p.b };
  });
  for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
  return { items, key };
}
// The judge's verdicts by position ({ id: "1" | "2" | "both" | "neither" }, Czech "obě" / "žádná" too) → by variant ({ id: "a" | "b" | "obě" | "žádná" }).
export function unblind(verdicts, key) {
  const out = {};
  for (const [id, v] of Object.entries(verdicts)) {
    const w = String(v).toLowerCase();
    if (w === "both" || w === "obě" || w === "obe") out[id] = "obě";
    else if (w === "neither" || w === "žádná" || w === "zadna") out[id] = "žádná";
    else if (w === "1" || w === "2") out[id] = (w === "1") === (key[id] === "ab") ? "a" : "b";
    else throw new Error(`verdict ${id}: ${v}`);
  }
  return out;
}
// Counts of the verdicts and the two-sided exact sign test of a : b (ties left out): the p of a result at least that lopsided
// if A and B were equally good.
export function tally(verdicts) {
  const c = { a: 0, b: 0, "obě": 0, "žádná": 0 };
  for (const v of Object.values(verdicts)) c[v]++;
  const n = c.a + c.b, k = Math.min(c.a, c.b);
  let p = 0;
  if (n) { let term = 1; for (let i = 0; i < n; i++) term /= 2; let coef = 1; for (let i = 0; i <= k; i++) { p += coef * term; coef = (coef * (n - i)) / (i + 1); } p = Math.min(1, 2 * p); } else p = 1;
  return { ...c, p: +p.toFixed(4) };
}
