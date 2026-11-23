// The universal judging, the result per state (Bára 17. 11. 2026): the app's profiles (data/app*.json from collect.js)
// against the judge's (vysledky/u-*.jsonl, the judge building its own profile from the state's orthophoto and the
// street-level photos), by the same measure as the calibration (compare.mjs): the composition of the street space, the
// lanes, the width of the street space. The judge itself agrees with MTVU in Prague in 71–82 % of the composition
// (ZPRAVA.md), so the numbers are the app's agreement with a good, not perfect, observer.
//   node evaluation/universal/score-states.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { compare } from "./compare.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(ROOT, "data");
const app = new Map();
// app.json first, then app-<x>.json (a later collection of the same cuts, after a fix, wins).
for (const f of (await fs.readdir(DATA)).filter((f) => /^app(-[a-z-]+)?\.json$/.test(f)).sort((a, b) => (a === "app.json" ? -1 : b === "app.json" ? 1 : a.localeCompare(b)))) for (const r of JSON.parse(await fs.readFile(path.join(DATA, f), "utf8"))) app.set(r.id, r);
const judged = (await Promise.all((await fs.readdir(path.join(ROOT, "vysledky"))).filter((f) => /^u-.*\.jsonl$/.test(f)).map((f) => fs.readFile(path.join(ROOT, "vysledky", f), "utf8"))))
  .join("\n").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((j) => j.usable && app.get(j.id)?.parts?.length)
  // Streets only: the random point may fall on a path in a park or a footway (no roadway in the app's profile nor the
  // judge's); those are no street profile to judge.
  .filter((j) => [...app.get(j.id).parts.map((p) => p[0]), ...j.parts.map((p) => String(p[0]).replace("?", ""))].some((t) => ["pruh", "pruh_piktokoridor", "obsluzna", "bus", "bus_cyklo", "tramvaj_v_pruhu"].includes(t)));
const pct = (a, n) => `${Math.round((100 * a) / n)} %`;
console.log("| stát | řezů | složení stejné | shoda složení | pruhy stejně | šířka uličního prostoru do 1 / 2 m | nejčastější rozdíly (aplikace proti posuzovateli) |\n|---|---|---|---|---|---|---|");
for (const country of ["CZ", "SK", "AT", "DE", "CH", "LI", "NL", "BE", "LU", "PL", "FR", "ES", "PT"]) {
  const rows = judged.filter((j) => app.get(j.id).country === country).map((j) => compare(j.parts, app.get(j.id).parts, true, false));
  if (!rows.length) continue;
  const n = rows.length, edits = {};
  for (const r of rows) for (const e of r.edits) edits[e] = (edits[e] || 0) + 1;
  const top = Object.entries(edits).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([e, k]) => `${e} ${k}×`).join(", ");
  console.log(`| ${country} | ${n} | ${pct(rows.filter((r) => r.same).length, n)} | ${Math.round((100 * rows.reduce((a, r) => a + r.score, 0)) / n)} % | ${pct(rows.filter((r) => r.lanesA === r.lanesB).length, n)} | ${pct(rows.filter((r) => Math.abs(r.widthA - r.widthB) <= 1).length, n)} / ${pct(rows.filter((r) => Math.abs(r.widthA - r.widthB) <= 2).length, n)} | ${top} |`);
}
