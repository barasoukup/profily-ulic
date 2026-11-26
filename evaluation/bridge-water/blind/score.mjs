// The score of a blind A/B of 26. 11. 2026 (packages.mjs): two judges a pair (results/p<k>-a|b.jsonl), the key
// (results/key.json), per stratum of the sample; a pair goes to the side with more votes, ties are undecided. With the
// measurement of the outer sidewalks (results/m<k>-a|b.jsonl, measure-key.json): the app's outer sidewalk per side of
// both variants against the mean of the two measurers.
//   node evaluation/bridge-water/blind/score.mjs <results dir> <sample.json> <rows.json> <variant new> <variant old> [label new] [label old]
import fs from "node:fs";
import path from "node:path";
const [RES, SAMPLE, ROWS, NEW, OLD, LN = NEW, LO = OLD] = process.argv.slice(2);
const json = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const lines = (f) => fs.readFileSync(f, "utf8").split("\n").filter((l) => l.trim().startsWith("{")).map((l) => JSON.parse(l));
const sample = new Map(json(SAMPLE).map((s) => [s.id, s])), rows = new Map(json(ROWS).map((r) => [r.id, r])), key = json(path.join(RES, "key.json"));
const choose = (n, k) => { let c = 1; for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1); return c; };
export const sign = (a, b) => { const n = a + b; if (!n) return 1; let s = 0; for (let i = Math.max(a, b); i <= n; i++) s += choose(n, i); return Math.min(1, (2 * s) / 2 ** n); };
const V = {};
for (const k of Object.keys(key)) V[k] = [];
for (let k = 1; fs.existsSync(path.join(RES, `p${k}-a.jsonl`)); k++) for (const j of ["a", "b"]) for (const r of lines(path.join(RES, `p${k}-${j}.jsonl`))) { const q = key[`${k}/${r.n}`]; if (q) V[`${k}/${r.n}`].push(r.verdict === "X" || r.verdict === "Y" ? q[r.verdict] : r.verdict); }
const out = [];
let agree = 0, both = 0, agreeSides = 0;
for (const [k, v] of Object.entries(V)) {
  if (v.length !== 2) throw new Error(`${k}: ${v.length} verdiktů`);
  if (v[0] === v[1]) agree++;
  if (v.every((x) => x === NEW || x === OLD)) { both++; if (v[0] === v[1]) agreeSides++; }
  const s = v.filter((x) => x === NEW).length - v.filter((x) => x === OLD).length;
  const r = s > 0 ? NEW : s < 0 ? OLD : v.every((x) => x === "nejde") ? "nejde" : "nerozhodne";
  out.push({ k, id: key[k].id, kind: sample.get(key[k].id)?.kind || sample.get(key[k].id)?.town, country: sample.get(key[k].id)?.country, v, r, sure: Math.abs(s) === 2 });
}
const row = (n, l) => { const g = (f) => l.filter(f).length, a = g((x) => x.r === NEW), b = g((x) => x.r === OLD); return `| ${n} | ${l.length} | **${a} : ${b}** | ${g((x) => x.r === "nerozhodne")} | ${g((x) => x.r === "nejde")} | ${a + b ? (sign(a, b) < 0.001 ? "< 0,001" : sign(a, b).toFixed(3).replace(".", ",")) : "–"} | ${g((x) => x.r === NEW && x.sure)} : ${g((x) => x.r === OLD && x.sure)} |`; };
console.log(`## Slepé A/B: ${LN} proti ${LO}, ${out.length} dvojic\n`);
console.log(`Shoda posuzovatelů ${agree}/${out.length}; kde oba vybrali stranu, ${agreeSides}/${both}.\n`);
console.log(`| skupina | dvojic | ${LN} : ${LO} | nerozhodně | nejde | znaménkový test p | oba shodně |\n|---|---|---|---|---|---|---|`);
console.log(row("všechny", out));
for (const g of [...new Set(out.map((x) => x.kind))].sort()) console.log(row(g, out.filter((x) => x.kind === g)));
console.log("\n## Po dvojicích\n\n| balík/č. | řez | skupina | stát | posuzovatelé | výsledek |\n|---|---|---|---|---|---|");
for (const x of out.sort((a, b) => a.id.localeCompare(b.id, "cs", { numeric: true }))) console.log(`| ${x.k} | ${x.id} | ${x.kind} | ${x.country} | ${x.v.join(", ")} | ${x.r} |`);
// ---- the outer sidewalks
if (fs.existsSync(path.join(RES, "measure-key.json"))) {
  const mkey = json(path.join(RES, "measure-key.json")), M = {};
  for (let k = 1; fs.existsSync(path.join(RES, `m${k}-a.jsonl`)); k++) for (const j of ["a", "b"]) for (const r of lines(path.join(RES, `m${k}-${j}.jsonl`))) { const id = mkey[`${k}/${r.n}`]; (M[id] ??= []).push(r); }
  const WALK = new Set(["chodnik", "chodnik_kola", "stezka_sdilena"]), ROADISH = new Set(["pruh", "krajnice", "parkovani", "cyklopruh", "bus", "tramvaj", "tramvaj_v_pruhu", "tramvaj_pruh", "obsluzna", "delici", "pruh_piktokoridor"]);
  // The outer sidewalk of a side: the first walking part from that end before any part of the roadway (0: none).
  const outer = (parts, fromEnd) => { const p = fromEnd ? [...parts].reverse() : parts; for (const [t, w] of p) { if (WALK.has(t)) return w; if (ROADISH.has(t)) return 0; } return 0; };
  const D = [];
  for (const [id, ms] of Object.entries(M)) {
    const r = rows.get(id);
    for (const [side, end] of [["A", false], ["B", true]]) {
      const v = ms.map((m) => m[side]).filter((x) => typeof x === "number");
      if (v.length < 2) continue;
      const truth = (v[0] + v[1]) / 2, n = outer(r[NEW].parts, end), o = outer(r[OLD].parts, end);
      D.push({ id, side, truth, spread: Math.abs(v[0] - v[1]), n, o, kind: sample.get(id)?.kind });
    }
  }
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
  const f = (x) => x.toFixed(2).replace(".", ",");
  console.log(`\n## Krajní chodníky proti dvěma měřičům nad ortofotem (${D.length} stran, kde oba měřiči změřili)\n`);
  console.log(`Rozptyl měřičů: medián ${f(med(D.map((d) => d.spread)))} m, do 0,5 m ${D.filter((d) => d.spread <= 0.5).length}/${D.length}.\n`);
  console.log(`| skupina | stran | ${LN}: medián chyby | ${LN}: do 1 m | ${LO}: medián chyby | ${LO}: do 1 m | chodník tam, kde měřiči nic | chodník chybí, kde měřiči ano | ${LN} ≥ 5,9 m |\n|---|---|---|---|---|---|---|---|---|`);
  for (const [g, l] of [["všechny", D], ...[...new Set(D.map((d) => d.kind))].sort().map((k) => [k, D.filter((d) => d.kind === k)])]) {
    const en = l.map((d) => Math.abs(d.n - d.truth)), eo = l.map((d) => Math.abs(d.o - d.truth));
    console.log(`| ${g} | ${l.length} | ${f(med(en))} | ${en.filter((e) => e <= 1).length} | ${f(med(eo))} | ${eo.filter((e) => e <= 1).length} | ${l.filter((d) => d.truth === 0 && d.n > 0).length} / ${l.filter((d) => d.truth === 0 && d.o > 0).length} | ${l.filter((d) => d.truth >= 1 && d.n === 0).length} / ${l.filter((d) => d.truth >= 1 && d.o === 0).length} | ${l.filter((d) => d.n >= 5.9).length} |`);
  }
  console.log(`\n(sloupce „chodník tam / chybí“: ${LN} / ${LO})\n\n| řez | strana | měřiči | ${LN} | ${LO} |\n|---|---|---|---|---|`);
  for (const d of D.sort((a, b) => a.id.localeCompare(b.id, "cs", { numeric: true }))) console.log(`| ${d.id} | ${d.side} | ${f(d.truth)} (±${f(d.spread / 2)}) | ${f(d.n)} | ${f(d.o)} |`);
}
