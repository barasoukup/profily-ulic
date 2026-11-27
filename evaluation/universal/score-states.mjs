// The universal judging, the result per state (Bára 17. 11. 2026): the app's profiles (data/app*.json from collect.js)
// against the judge's (results/u-*.jsonl, the judge building its own profile from the state's orthophoto and the
// street-level photos), by the same measure as the calibration (compare.mjs): the composition of the street space, the
// lanes, the width of the street space. The judge itself agrees with MTVU in Prague in 71–82 % of the composition
// (REPORT.md), so the numbers are the app's agreement with a good, not perfect, observer.
// Since 23. 11. 2026 (Bára): on a side the judge found no facade on (facadeA / facadeB false) the width and the
// composition stop at the street's own outermost part there, with green beyond it as an item of presence (compare.mjs
// scope(), BRIEF.md); OLD=1: the street space as before (core()).
// Since 24. 11. 2026 (Bára), in every state (first Slovenia, then all; the re-measurement of 24. 11.): a cut whose clicked OSM way is
// highway=service with service=driveway, parking_aisle or drive-through is left out (no street; not moved). The way's
// tags come from the app's row (service, as the Lithuanian collection keeps it) or results/sluzebni-<iso>.json (read
// from the state's OSM pack by the cut's wayId; the re-collection data/app-zprepocet.json keeps highway and service from
// the pack too). Plain service roads without a service tag stay.
//   node evaluation/universal/score-states.mjs
//   STATES=SI                only these states
//   OLD=1 NOEX=1             the method before 23. 11. 2026, without the exclusion
//   SKIP=zprepocet           leave out the collections whose name has this (the profiles before a re-collection)
//   DATA_DIRS=dir1:dir2 …    more folders with app*.json (the collections live in the worktrees of the states; later wins)
import fs from "node:fs/promises";
import path from "node:path";
import { compare } from "./compare.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(ROOT, "data");
const app = new Map();
// app.json first, then app-<x>.json (a later collection of the same cuts, after a fix, wins).
for (const dir of [...(process.env.DATA_DIRS || "").split(":").filter(Boolean), DATA]) for (const f of (await fs.readdir(dir).catch(() => [])).filter((f) => /^app(-[a-z-]+)?\.json$/.test(f) && !(process.env.SKIP && f.includes(process.env.SKIP))).sort((a, b) => (a === "app.json" ? -1 : b === "app.json" ? 1 : a.localeCompare(b)))) for (const r of JSON.parse(await fs.readFile(path.join(dir, f), "utf8"))) app.set(r.id, r);
for (const f of (await fs.readdir(path.join(ROOT, "results"))).filter((f) => /^sluzebni-[a-z]+\.json$/.test(f))) for (const r of JSON.parse(await fs.readFile(path.join(ROOT, "results", f), "utf8"))) if (app.has(r.id) && r.service) app.get(r.id).service ??= r.service;
const NO_STREET = new Set(["driveway", "parking_aisle", "drive-through"]);
// Left out: no street at the point (the service), and cuts the app flags as in a junction (junction.mjs; JUNCTION=1 keeps them).
const { inJunction } = await import("./junction.mjs");
const excluded = (j) => process.env.NOEX !== "1" && (NO_STREET.has(app.get(j.id).service) || (process.env.JUNCTION !== "1" && inJunction(app.get(j.id))));
const judged = (await Promise.all((await fs.readdir(path.join(ROOT, "results"))).filter((f) => /^u-.*\.jsonl$/.test(f)).map((f) => fs.readFile(path.join(ROOT, "results", f), "utf8"))))
  .join("\n").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((j) => j.usable && app.get(j.id)?.parts?.length)
  // Streets only: the random point may fall on a path in a park or a footway (no roadway in the app's profile nor the
  // judge's); those are no street profile to judge.
  .filter((j) => [...app.get(j.id).parts.map((p) => p[0]), ...j.parts.map((p) => String(p[0]).replace("?", ""))].some((t) => ["pruh", "pruh_piktokoridor", "obsluzna", "bus", "bus_cyklo", "tramvaj_v_pruhu"].includes(t)));
const pct = (a, n) => `${Math.round((100 * a) / n)} %`;
console.log("| stát | řezů | složení stejné | shoda složení | pruhy stejně | šířka uličního prostoru do 1 / 2 m | nejčastější rozdíly (aplikace proti posuzovateli) |\n|---|---|---|---|---|---|---|");
// Parts of a state reported apart (24. 11. 2026): Finland with the app's orthophoto or Helsinki's surface map (Helsinki,
// Espoo, Turku) and without (Tampere, Oulu, the north of Vantaa); Copenhagen with its kerb lines and parking areas and
// the rest of Denmark.
const GROUPS = {
  "FI s ortofotem": (r) => r.country === "FI" && /^(helsinki|espoo|turku)/.test(r.town),
  "FI bez ortofota": (r) => r.country === "FI" && !/^(helsinki|espoo|turku)/.test(r.town),
  "DK Kodaň": (r) => r.country === "DK" && /^kobenhavn/.test(r.town),
  "DK zbytek": (r) => r.country === "DK" && !/^kobenhavn/.test(r.town),
};
for (const country of ["CZ", "SK", "AT", "DE", "CH", "LI", "NL", "BE", "LU", "PL", "FR", "ES", "PT", "MC", "CY", "MT", "IT", "EE", "SI", "LT", "FI", "DK", ...Object.keys(GROUPS)]) {
  if (process.env.STATES && !process.env.STATES.split(",").includes(country.slice(0, 2))) continue;
  const all = judged.filter((j) => (GROUPS[country] ? GROUPS[country](app.get(j.id)) : app.get(j.id).country === country)), out = all.filter(excluded);
  if (out.length) console.error(`${country}: vynecháno ${out.length} (${out.map((j) => `${j.id} ${app.get(j.id).service}`).join(", ")})`);
  const rows = all.filter((j) => !excluded(j)).map((j) => compare(j.parts, app.get(j.id).parts, true, false, process.env.OLD === "1" ? null : { A: j.facadeA === false, B: j.facadeB === false }));
  if (!rows.length) continue;
  const n = rows.length, edits = {};
  for (const r of rows) for (const e of r.edits) edits[e] = (edits[e] || 0) + 1;
  const top = Object.entries(edits).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([e, k]) => `${e} ${k}×`).join(", ");
  console.log(`| ${country} | ${n} | ${pct(rows.filter((r) => r.same).length, n)} | ${Math.round((100 * rows.reduce((a, r) => a + r.score, 0)) / n)} % | ${pct(rows.filter((r) => r.lanesA === r.lanesB).length, n)} | ${pct(rows.filter((r) => Math.abs(r.widthA - r.widthB) <= 1).length, n)} / ${pct(rows.filter((r) => Math.abs(r.widthA - r.widthB) <= 2).length, n)} | ${top} |`);
}
