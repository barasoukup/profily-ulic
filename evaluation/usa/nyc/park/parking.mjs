// Parking alone in the universal measurement (REPORT.md): for each kerb (A, B: what lies before the first and after the last
// lane) of the judged cuts whether the judge and the app have parking there, without and with ?nycsigns=1.
//   node evaluation/usa/nyc/park/parking.mjs
import fs from "node:fs";
const here = (f) => new URL(f, import.meta.url), rows = JSON.parse(fs.readFileSync(here("results/rows.json")));
const J = [1, 2, 3].flatMap((k) => fs.readFileSync(here(`results/q${k}.jsonl`), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l))).filter((j) => j.usable);
const LANE = /^(pruh|bus|tram)/;
const side = (parts, s, re) => { const i = parts.map((p, k) => (LANE.test(String(p[0]).replace("?", "")) ? k : -1)).filter((k) => k >= 0); if (!i.length) return null; return (s === "A" ? parts.slice(0, i[0]) : parts.slice(i.at(-1) + 1)).some((p) => re.test(p[0])); };
for (const v of ["def", "nycsigns"]) {
  const t = { found: 0, missing: 0, extra: 0, none: 0 }, cuts = new Set();
  for (const j of J) {
    const r = rows.find((x) => x.id === j.id && x.variant === v);
    for (const s of ["A", "B"]) {
      const truth = side(j.parts, s, /^stani/), app = side(r.parts, s, /^parkovani$/);
      if (truth === null || app === null) continue;
      t[truth ? (app ? "found" : "missing") : app ? "extra" : "none"]++;
      if (truth !== app) cuts.add(j.id);
    }
  }
  console.log(`| ${v === "def" ? "bez značek" : "?nycsigns=1"} | ${J.length} | ${t.found} | ${t.missing} | ${t.extra} | ${t.none} | ${cuts.size} |`);
}
