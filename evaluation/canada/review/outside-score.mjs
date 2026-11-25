// The surroundings of Washington and Toronto by the universal measurement (outside.mjs; one judging a cut).   node outside-score.mjs
import fs from "node:fs";
import { compare } from "../../universal/compare.mjs";
const here = (f) => new URL(f, import.meta.url), L = (f) => fs.readFileSync(here(f), "utf8").trim().split("\n").map((l) => JSON.parse(l)), M = L("results/outside-judged-md.jsonl"), J = L("results/outside-judged.jsonl").map((j) => M.find((m) => m.id === j.id) || j), P = new Map(JSON.parse(fs.readFileSync(here("results/outside.json"), "utf8")).map((r) => [r.id, r]));
const app = new Map(JSON.parse(fs.readFileSync(here("../../universal/data/na-review.json"), "utf8")).filter((r) => r.variant === "def").map((r) => [r.id, r])), LANE = ["pruh", "bus", "tramvaj"];
const use = J.filter((j) => j.usable && app.get(j.id)?.parts?.length && j.parts.some((p) => LANE.includes(String(p[0]).replace("?", ""))));
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const boot = (d) => { const b = Array.from({ length: 5000 }, () => d.reduce((a) => a + d[Math.floor(rnd() * d.length)], 0) / d.length).sort((x, y) => x - y); return [b[125], b[4875]].map((x) => Math.round(100 * x)).join("–"); };
const pct = (a, n) => `${Math.round((100 * a) / n)} %`;
console.log(`použitelných ${use.length} z ${J.length} (nepoužité: ${J.filter((j) => !use.includes(j)).map((j) => j.id).join(", ") || "žádný"})\n\n| | řezů | složení stejné | shoda složení (95 %) | pruhy stejně | šířka do 1 / 2 m | nejčastější rozdíly |\n|---|---|---|---|---|---|---|`);
for (const [name, l] of [["obojí", use], ["okolí Washingtonu", use.filter((j) => j.id.startsWith("us"))], ["okolí Toronta", use.filter((j) => j.id.startsWith("ca"))], ["s fotkou", use.filter((j) => P.get(j.id).photo)], ["jen ortofoto", use.filter((j) => !P.get(j.id).photo)], ["místní", use.filter((j) => P.get(j.id).kind === "local")], ["obslužné", use.filter((j) => P.get(j.id).kind === "service")], ["ostatní", use.filter((j) => !/local|service/.test(P.get(j.id).kind))]]) {
  if (!l.length) continue;
  const r = l.map((j) => compare(j.parts, app.get(j.id).parts, true, false, { A: j.facadeA === false, B: j.facadeB === false })), e = {};
  for (const x of r) for (const y of x.edits) e[y] = (e[y] || 0) + 1;
  console.log(`| ${name} | ${l.length} | ${pct(r.filter((x) => x.same).length, l.length)} | **${pct(r.reduce((a, x) => a + x.score, 0), l.length)}** (${boot(r.map((x) => x.score))}) | ${pct(r.filter((x) => x.lanesA === x.lanesB).length, l.length)} | ${pct(r.filter((x) => Math.abs(x.widthA - x.widthB) <= 1).length, l.length)} / ${pct(r.filter((x) => Math.abs(x.widthA - x.widthB) <= 2).length, l.length)} | ${Object.entries(e).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, q]) => `${k} ${q}×`).join(", ")} |`);
}
