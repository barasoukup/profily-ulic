// Of the sample's cuts that the passport changes (the profile with it differs from the one without it, collect.js), 35 a
// town drawn at random (seed 20261127) for the blind A/B: sample-ab.json. Also the numbers of the collection.
//   node evaluation/pasporty-blind/pick.mjs
import fs from "node:fs";
const here = (f) => new URL(f, import.meta.url).pathname;
const sample = JSON.parse(fs.readFileSync(here("sample.json"), "utf8")), rows = new Map(JSON.parse(fs.readFileSync(here("../universal/data/m1126-passports.json"), "utf8")).map((r) => [r.id, r]));
const differs = (a, b) => a.parts.length !== b.parts.length || a.parts.some(([t, w], i) => t !== b.parts[i][0] || Math.abs(w - b.parts[i][1]) >= 0.2);
let seed = 20261127;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const out = [], stats = {};
for (const town of ["slapanice", "kurim"]) {
  const mine = sample.filter((s) => s.town === town), est = (v) => /odhad/.test(v?.note || "");
  const ch = mine.filter((s) => { const r = rows.get(s.id); return r?.pas?.parts?.length && r?.bez?.parts?.length && differs(r.pas, r.bez); });
  stats[town] = { cuts: mine.length, changed: ch.length, passportUsed: mine.filter((s) => rows.get(s.id)?.pas?.sources?.passport).length,
    estimateWithout: mine.filter((s) => est(rows.get(s.id)?.bez)).length, estimateWith: mine.filter((s) => est(rows.get(s.id)?.pas)).length,
    changedEstimateWithout: ch.filter((s) => est(rows.get(s.id)?.bez)).length };
  const a = ch.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  out.push(...a.slice(0, 35));
}
fs.writeFileSync(here("sample-ab.json"), JSON.stringify(out, null, 1));
fs.writeFileSync(here("results/collection.json"), JSON.stringify(stats, null, 1));
console.log(JSON.stringify(stats), out.length);
