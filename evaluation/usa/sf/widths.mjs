// San Francisco's street widths against the judges' (the universal measurement, results/q*.jsonl): the signed difference
// app − judge per cut, with the map and without it (?sf=0).   node evaluation/usa/sf/widths.mjs
import fs from "node:fs";
import { compare } from "../../universal/compare.mjs";
const here = (f) => new URL(f, import.meta.url);
const rows = JSON.parse(fs.readFileSync(here("../../universal/data/us-sf-fresh.json"), "utf8"));
const judged = fs.readdirSync(here("results/")).filter((f) => /^q\d+\.jsonl$/.test(f))
  .flatMap((f) => fs.readFileSync(here(`results/${f}`), "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l))).filter((j) => j.usable !== false);
for (const v of ["def", "sf0"]) {
  const d = [];
  for (const j of judged) {
    const r = rows.find((x) => x.id === j.id && x.variant === v);
    if (!r?.parts?.length) continue;
    const open = !j.facadeA || !j.facadeB ? { A: !j.facadeA, B: !j.facadeB } : null;
    const c = compare(r.parts, j.parts, false, true, open);
    d.push([j.id, +(c.widthA - c.widthB).toFixed(1)]);
  }
  const s = d.map((x) => x[1]).sort((a, b) => a - b);
  console.log(v, "řezů", d.length, "medián rozdílu aplikace − posuzovatel", s[Math.floor(s.length / 2)], "m;", d.map((x) => x.join(" ")).join(", "));
}
