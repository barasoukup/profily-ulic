// The A/B of ?outerosm=1 by the kind of change (REPORT.md): the profile ends earlier (by more than 2 m, a lot or a house of
// OSM where the map's lawn ran on), later, or only a little (under 2 m at the ends).   node evaluation/usa/boston/outer-osm/split.mjs
import fs from "node:fs";
const here = (f) => new URL(f, import.meta.url), rows = JSON.parse(fs.readFileSync(here("results/rows.json"))), key = JSON.parse(fs.readFileSync(here("results/key.json")));
const W = (r) => r.parts.reduce((s, p) => s + p[1], 0), V = {};
for (let k = 1; fs.existsSync(here(`results/p${k}-a.jsonl`)); k++) for (const j of ["a", "b"]) for (const l of fs.readFileSync(here(`results/p${k}-${j}.jsonl`), "utf8").split("\n").filter((x) => x.trim())) {
  const r = JSON.parse(l), q = key[`${k}/${r.n}`]; (V[q.id] ??= []).push(r.verdict === "X" || r.verdict === "Y" ? q[r.verdict] : r.verdict);
}
const groups = {};
for (const [id, v] of Object.entries(V)) {
  const a = rows.find((r) => r.id === id && r.variant === "def"), b = rows.find((r) => r.id === id && r.variant === "ogosm"), d = W(b) - W(a);
  const g = d < -2 ? "kratší (konec u parkoviště/domu z OSM)" : d > 2 ? "delší" : "do 2 m";
  const s = v.filter((x) => x === "ogosm").length - v.filter((x) => x === "def").length;
  (groups[g] ??= { on: 0, off: 0, tie: 0, n: 0 }); groups[g].n++; groups[g][s > 0 ? "on" : s < 0 ? "off" : "tie"]++;
}
for (const [g, x] of Object.entries(groups)) console.log(`| ${g} | ${x.n} | ${x.on} : ${x.off} | ${x.tie} |`);
