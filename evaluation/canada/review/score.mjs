// The score of the second review's A/Bs (packages.mjs; results/<group>-<k>-a.jsonl and -b.jsonl): the rule against without it, by two
// blind judges a pair. A pair is won by a side with more of the two votes; "both" counts pairs where both judges chose the same
// side; "cannot judge" apart.   node evaluation/canada/review/score.mjs > results/score.md
import fs from "node:fs";
const here = (f) => new URL(f, import.meta.url), key = JSON.parse(fs.readFileSync(here("results/key.json"), "utf8")), report = JSON.parse(fs.readFileSync(here("results/packages.json"), "utf8"));
const lines = (f) => fs.readFileSync(here(f), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
const choose = (n, k) => { let c = 1; for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1); return c; };
export const sign = (a, b) => { const n = a + b; if (!n) return 1; let s = 0; for (let i = Math.max(a, b); i <= n; i++) s += choose(n, i); return Math.min(1, (2 * s) / 2 ** n); };
export const wilson = (a, n) => { if (!n) return ""; const z = 1.96, p = a / n, d = 1 + (z * z) / n, m = p + (z * z) / (2 * n), q = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n)); return `${Math.round((100 * (m - q)) / d)}–${Math.round((100 * (m + q)) / d)} %`; };
const V = {};
for (const k of Object.keys(key)) {
  const [pack, n] = k.split("/");
  V[k] = ["a", "b"].map((j) => { const r = lines(`results/${pack}-${j}.jsonl`).find((x) => String(x.n) === n); if (!r) throw new Error(`${k} ${j}`); return r.verdict === "X" || r.verdict === "Y" ? (key[k][r.verdict] === "def" ? "def" : "off") : r.verdict; });
}
console.log("# A/B druhé recenze\n\n| skupina | dvojic | s pravidlem : bez | nerozhodně | nejde posoudit | podíl (95 %) | p | oba shodně | shoda posuzovatelů |\n|---|---|---|---|---|---|---|---|---|");
const row = (name, ks) => {
  const r = ks.map((k) => { const v = V[k], a = v.filter((x) => x === "def").length, b = v.filter((x) => x === "off").length; return { a, b, no: a === b && v.includes("nejde"), tie: a === b && !v.includes("nejde"), same: v[0] === v[1] }; });
  const w = r.filter((x) => x.a > x.b).length, l = r.filter((x) => x.b > x.a).length;
  console.log(`| ${name} | ${ks.length} | **${w} : ${l}** | ${r.filter((x) => x.tie).length} | ${r.filter((x) => x.no).length} | ${wilson(w, w + l)} | ${sign(w, l).toFixed(3)} | ${r.filter((x) => x.a === 2).length} : ${r.filter((x) => x.b === 2).length} | ${r.filter((x) => x.same).length}/${ks.length} |`);
};
const groups = [...new Set(Object.keys(key).map((k) => k.replace(/-\d+\/.*/, "")))];
for (const g of groups) {
  const ks = Object.keys(key).filter((k) => k.startsWith(`${g}-`));
  row(g, ks);
  if (ks.some((k) => key[k].photo !== undefined)) { row(`${g}, s fotkou`, ks.filter((k) => key[k].photo)); row(`${g}, jen ortofoto`, ks.filter((k) => !key[k].photo)); }
  for (const kind of ["local", "service", "collector", "arterial", "motorway"]) if (g === "ddot" && ks.some((k) => key[k].kind === kind)) row(`${g}, ${kind}`, ks.filter((k) => key[k].kind === kind));
}
console.log("\n" + JSON.stringify(report) + "\n\n| dvojice | řez | hlasy |\n|---|---|---|");
for (const k of Object.keys(key)) console.log(`| ${k} | ${key[k].id} | ${V[k].join(", ")} |`);
