// The universal accuracy measurement of Lithuania (Bára 24. 11. 2026), as evaluation/universal/score-states.mjs, for LT
// only and twice: the app as it is (vysledky/app-lt.json: Vilnius's surface map where it has the street) and the estimate
// from OSM alone (vysledky/lt-odhad.json, the same cuts with ?vilnius=0: what the rest of Lithuania gets). The judge's
// profiles: vysledky/u-lt-*.jsonl. Sample points on service=driveway, parking_aisle or drive-through are left out (new
// rule of 24. 11. 2026), as are footways and paths (no roadway).
//   node evaluation/lithuania/score.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { compare } from "../universal/compare.mjs";

const U = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "universal");
// The collections (evaluation/universal/data is not kept in git): copies in vysledky/ here.
const OWN = path.join(path.dirname(new URL(import.meta.url).pathname), "vysledky");
const load = async (f) => new Map(JSON.parse(await fs.readFile(path.join(OWN, f), "utf8")).map((r) => [r.id, r]));
const EX = new Set(["driveway", "parking_aisle", "drive-through"]);
const judged = (await Promise.all((await fs.readdir(path.join(U, "vysledky"))).filter((f) => /^u-lt-.*\.jsonl$/.test(f)).map((f) => fs.readFile(path.join(U, "vysledky", f), "utf8"))))
  .join("\n").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((j) => j.usable);
const ROAD = ["pruh", "pruh_piktokoridor", "obsluzna", "bus", "bus_cyklo", "tramvaj_v_pruhu"];
const pct = (a, n) => `${Math.round((100 * a) / n)} %`;
console.log("| varianta | řezů | složení stejné | shoda složení | pruhy stejně | šířka do 1 / 2 m | nejčastější rozdíly |\n|---|---|---|---|---|---|---|");
for (const [label, file] of [["aplikace (s mapou povrchů Vilniusu)", "app-lt.json"], ["jen odhad z OSM (?vilnius=0)", "lt-odhad.json"]]) {
  const app = await load(file);
  const rows = judged.filter((j) => app.get(j.id)?.parts?.length && !EX.has(app.get(j.id).service))
    .filter((j) => [...app.get(j.id).parts.map((p) => p[0]), ...j.parts.map((p) => String(p[0]).replace("?", ""))].some((t) => ROAD.includes(t)))
    .map((j) => compare(j.parts, app.get(j.id).parts, true, false, { A: j.facadeA === false, B: j.facadeB === false }));
  const n = rows.length, edits = {};
  for (const r of rows) for (const e of r.edits) edits[e] = (edits[e] || 0) + 1;
  const top = Object.entries(edits).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([e, k]) => `${e} ${k}×`).join(", ");
  console.log(`| ${label} | ${n} | ${pct(rows.filter((r) => r.same).length, n)} | ${Math.round((100 * rows.reduce((a, r) => a + r.score, 0)) / n)} % | ${pct(rows.filter((r) => r.lanesA === r.lanesB).length, n)} | ${pct(rows.filter((r) => Math.abs(r.widthA - r.widthB) <= 1).length, n)} / ${pct(rows.filter((r) => Math.abs(r.widthA - r.widthB) <= 2).length, n)} | ${top} |`);
}
