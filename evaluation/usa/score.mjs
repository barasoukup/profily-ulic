// The universal measurement of the USA (phase 2, 24. 11. 2026): the pilot's judges (evaluation/usa-dc/results/u-us-*.jsonl,
// 30 usable cuts of 32) against the app's profiles collected at the judged cuts (evaluation/universal/data/us-ab.json,
// the rows dc-* in the variants def: with all three shared changes, old: without them, dc0: without DC's map; us-meas2.json:
// the app as it stays, tree pits off), and the
// pilot's offline profile (evaluation/usa-dc/data/app-dc.json) for comparison. The rules as in evaluation/usa-dc/score.mjs
// (a side without a facade counts up to the street's edge; only cuts with a roadway).
//   node evaluation/usa/score.mjs > evaluation/usa/results/score.md
import fs from "node:fs/promises";
import path from "node:path";
import { compare, asClasses, composition } from "../universal/compare.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname), PILOT = path.join(HERE, "..", "usa-dc");
const rows = JSON.parse(await fs.readFile(path.join(HERE, "..", "universal", "data", "us-ab.json"), "utf8")).filter((r) => r.id.startsWith("dc-"));
const variant = (v) => new Map(rows.filter((r) => r.variant === v && r.parts?.length).map((r) => [r.id, r]));
const pilot = new Map(JSON.parse(await fs.readFile(path.join(PILOT, "data", "app-dc.json"), "utf8")).map((r) => [r.id, r]));
const sample = new Map(JSON.parse(await fs.readFile(path.join(PILOT, "sample.json"), "utf8")).map((r) => [r.id, r]));
const judged = (await Promise.all((await fs.readdir(path.join(PILOT, "results"))).filter((f) => /^u-.*\.jsonl$/.test(f)).map((f) => fs.readFile(path.join(PILOT, "results", f), "utf8"))))
  .join("\n").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const LANE = ["pruh", "pruh_piktokoridor", "obsluzna", "bus", "bus_cyklo", "tramvaj_v_pruhu"];
// The app as it stays (tree pits off, ?jamky=1; the DC line fixed in staty.json): collected again into us-meas2.json.
const meas2 = path.join(HERE, "..", "universal", "data", "us-meas2.json");
const def = await fs.readFile(meas2, "utf8").then((t) => new Map(JSON.parse(t).filter((r) => r.parts?.length).map((r) => [r.id, r])), () => variant("def"));
const withPits = variant("def");
const usable = judged.filter((j) => j.usable && def.get(j.id)).filter((j) => [...def.get(j.id).parts.map((p) => p[0]), ...j.parts.map((p) => String(p[0]).replace("?", ""))].some((t) => LANE.includes(t)));
const pct = (a, n) => `${Math.round((100 * a) / n)} %`;
const rowsOf = (app) => usable.filter((j) => app.get(j.id)).map((j) => ({ j, r: compare(j.parts, app.get(j.id).parts, true, false, { A: j.facadeA === false, B: j.facadeB === false }) }));
function summary(label, list) {
  const n = list.length, edits = {};
  for (const { r } of list) for (const e of r.edits) edits[e] = (edits[e] || 0) + 1;
  const top = Object.entries(edits).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([e, k]) => `${e} ${k}×`).join(", ");
  return `| ${label} | ${n} | ${pct(list.filter(({ r }) => r.same).length, n)} | ${Math.round((100 * list.reduce((a, { r }) => a + r.score, 0)) / n)} % | ${pct(list.filter(({ r }) => r.lanesA === r.lanesB).length, n)} | ${pct(list.filter(({ r }) => Math.abs(r.widthA - r.widthB) <= 1).length, n)} / ${pct(list.filter(({ r }) => Math.abs(r.widthA - r.widthB) <= 2).length, n)} | ${top} |`;
}
console.log("| profil | řezů | složení stejné | shoda složení | pruhy stejně | šířka uličního prostoru do 1 / 2 m | nejčastější rozdíly (aplikace proti posuzovateli) |\n|---|---|---|---|---|---|---|");
const now = rowsOf(def);
console.log(summary("aplikace (mapa DC, inventář DDOT, ortofoto, model obrub)", now));
for (const k of ["residential", "collector", "arterial"]) console.log(summary(`– ${k}`, now.filter(({ j }) => sample.get(j.id).kind === k)));
console.log(summary("aplikace se všemi třemi změnami (i jamky stromů, ?jamky=1)", rowsOf(withPits)));
console.log(summary("aplikace bez tří společných změn (?off=ulicky,jamky,pocetpruhu)", rowsOf(variant("old"))));
console.log(summary("aplikace bez mapy DC (?dc=0: odhad z OSM a ortofota)", rowsOf(variant("dc0"))));
console.log(summary("pilot offline (fáze 1, data/app-dc.json)", rowsOf(pilot)));
console.log("\n| řez | ulice | posuzovatel | aplikace | shoda | bez změn | bez mapy |\n|---|---|---|---|---|---|---|");
const seq = (parts, judge) => composition(asClasses(parts, judge)).join(" ");
const old = new Map(rowsOf(variant("old")).map((x) => [x.j.id, x.r])), dc0 = new Map(rowsOf(variant("dc0")).map((x) => [x.j.id, x.r]));
for (const { j, r } of now) console.log(`| ${j.id} | ${sample.get(j.id).name} | ${seq(j.parts, true)} | ${seq(def.get(j.id).parts)} | ${Math.round(100 * r.score)} % | ${old.has(j.id) ? Math.round(100 * old.get(j.id).score) + " %" : "–"} | ${dc0.has(j.id) ? Math.round(100 * dc0.get(j.id).score) + " %" : "–"} |`);
