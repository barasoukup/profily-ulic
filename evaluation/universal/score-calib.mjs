// The calibration of the universal judging in Prague (Bára 17. 11. 2026): the judge's profiles (results/calib-*.jsonl)
// against the truth (the app's profile from IPR MTVU), and the app's estimate (orthophoto and OSM) against the truth and
// against the judge, by the same measure (compare.mjs). The judge's error says how far its judging can be trusted where
// there is no truth (SK, AT, DE).
//   node evaluation/universal/score-calib.mjs [calib-3.jsonl …]
import fs from "node:fs/promises";
import path from "node:path";
import { compare } from "./compare.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const pilot = new Map(JSON.parse(await fs.readFile(path.join(ROOT, "..", "streetview", "pilot.json"), "utf8")).map((r) => [r.id, r]));
// Which results: the files named on the command line (calib-3.jsonl calib-4.jsonl), else all calib-*.jsonl.
const files = process.argv.length > 2 ? process.argv.slice(2) : (await fs.readdir(path.join(ROOT, "results"))).filter((f) => /^calib-.*\.jsonl$/.test(f));
const judged = (await Promise.all(files.map((f) => fs.readFile(path.join(ROOT, "results", f), "utf8")))).join("\n").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((j) => j.usable);
const sum = (key) => {
  const rows = judged.map((j) => {
    const p = pilot.get(j.id);
    return key === "ai-truth" ? compare(p.truth, j.parts, false, true) : key === "est-truth" ? p.estimate && compare(p.truth, p.estimate) : p.estimate && compare(j.parts, p.estimate, true, false);
  }).filter(Boolean);
  const same = rows.filter((r) => r.same).length, score = rows.reduce((a, r) => a + r.score, 0) / rows.length;
  const lanes = rows.filter((r) => r.lanesA === r.lanesB).length, w1 = rows.filter((r) => Math.abs(r.widthA - r.widthB) <= 1).length, w2 = rows.filter((r) => Math.abs(r.widthA - r.widthB) <= 2).length;
  const edits = {};
  for (const r of rows) for (const e of r.edits) edits[e] = (edits[e] || 0) + 1;
  const top = Object.entries(edits).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([e, n]) => `${e} ${n}×`).join(", ");
  const pct = (x) => `${Math.round((100 * x) / rows.length)} %`;
  return `| ${key} | ${rows.length} | ${pct(same)} | ${Math.round(100 * score)} % | ${pct(lanes)} | ${pct(w1)} / ${pct(w2)} | ${top} |`;
};
console.log(`Posouzených řezů: ${judged.length}\n\n| srovnání | řezů | složení stejné | shoda složení | pruhy stejně | šířka ulice do 1 / 2 m | nejčastější rozdíly |\n|---|---|---|---|---|---|---|`);
for (const k of ["ai-truth", "est-truth", "est-ai"]) console.log(sum(k));
