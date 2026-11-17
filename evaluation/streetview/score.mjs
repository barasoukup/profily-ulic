// The pilot's score (Bára 17. 11. 2026): how often what the judge saw on the street-level photos (vysledky/posudky.jsonl)
// agrees with the truth (the app's profile from IPR MTVU), feature by feature; and how often the estimate from the
// orthophoto and OSM agrees with the truth and with the judge. Only "sure" answers of usable cuts count.
//   node evaluation/streetview/score.mjs
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const rows = JSON.parse(await fs.readFile(path.join(ROOT, "pilot.json"), "utf8"));
const judged = new Map((await fs.readFile(path.join(ROOT, "vysledky", "posudky.jsonl"), "utf8")).split("\n").filter(Boolean).map((l) => JSON.parse(l)).map((j) => [j.id, j]));
const F = ["lanes", "parkingLeft", "parkingRight", "cycle", "tram", "sidewalkLeft", "sidewalkRight", "trees", "median"];
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} % (${a}/${b})` : "–");
const lines = ["| znak | AI = pravda | odhad = pravda | odhad = AI | AI si nebyla jistá |", "|---|---|---|---|---|"];
let usable = 0;
for (const r of rows) if (judged.get(r.id)?.usable) usable++;
const tot = { aiT: [0, 0], eT: [0, 0], eAi: [0, 0] };
for (const f of F) {
  let aiT = 0, nAiT = 0, eT = 0, nET = 0, eAi = 0, nEAi = 0, unsure = 0;
  for (const r of rows) {
    const j = judged.get(r.id);
    if (r.fEstimate) { nET++; if (r.fEstimate[f] === r.fTruth[f]) eT++; }
    if (!j?.usable) continue;
    if (j[`${f}Sure`] === false) { unsure++; continue; }
    nAiT++; if (j[f] === r.fTruth[f]) aiT++;
    if (r.fEstimate) { nEAi++; if (r.fEstimate[f] === j[f]) eAi++; }
  }
  lines.push(`| ${f} | ${pct(aiT, nAiT)} | ${pct(eT, nET)} | ${pct(eAi, nEAi)} | ${unsure} |`);
  tot.aiT[0] += aiT; tot.aiT[1] += nAiT; tot.eT[0] += eT; tot.eT[1] += nET; tot.eAi[0] += eAi; tot.eAi[1] += nEAi;
}
lines.push(`| **celkem** | ${pct(...tot.aiT)} | ${pct(...tot.eT)} | ${pct(...tot.eAi)} | |`);
console.log(`Použitelných řezů: ${usable} z ${rows.length}\n\n${lines.join("\n")}`);
