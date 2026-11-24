// The DC pilot's score, by the universal measurement (evaluation/universal/compare.mjs, today's rules: a side without a
// facade counts only up to the street's edge; only cuts with a roadway; the sample has no service roads at all, so the
// exclusion of driveways, parking aisles and drive-throughs leaves nothing out). The judges' profiles vysledky/u-us-*.jsonl
// against data/app-dc.json (DC's surface map) and data/app-osm.json (OSM alone).
//   node evaluation/usa-dc/score.mjs            the summary and a table per cut (Markdown)
import fs from "node:fs/promises";
import path from "node:path";
import { compare, asClasses, composition, scope, diff } from "../universal/compare.mjs";
import { ROOT, DATA } from "./lib.mjs";

const sample = new Map(JSON.parse(await fs.readFile(path.join(ROOT, "sample.json"), "utf8")).map((r) => [r.id, r]));
const load = async (f) => new Map(JSON.parse(await fs.readFile(path.join(DATA, f), "utf8")).map((r) => [r.id, r]));
const dc = await load("app-dc.json"), osm = await load("app-osm.json"), dc2 = await load("app-dc-lanes.json");
const judged = (await Promise.all((await fs.readdir(path.join(ROOT, "vysledky"))).filter((f) => /^u-.*\.jsonl$/.test(f)).map((f) => fs.readFile(path.join(ROOT, "vysledky", f), "utf8"))))
  .join("\n").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const LANE = ["pruh", "pruh_piktokoridor", "obsluzna", "bus", "bus_cyklo", "tramvaj_v_pruhu"];
const usable = judged.filter((j) => j.usable && dc.get(j.id)?.parts?.length).filter((j) => [...dc.get(j.id).parts.map((p) => p[0]), ...j.parts.map((p) => String(p[0]).replace("?", ""))].some((t) => LANE.includes(t)));
const pct = (a, n) => `${Math.round((100 * a) / n)} %`;
const rowsOf = (app) => usable.map((j) => ({ j, r: compare(j.parts, app.get(j.id).parts, true, false, { A: j.facadeA === false, B: j.facadeB === false }) }));
function summary(label, rows) {
  const n = rows.length, edits = {};
  for (const { r } of rows) for (const e of r.edits) edits[e] = (edits[e] || 0) + 1;
  const top = Object.entries(edits).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([e, k]) => `${e} ${k}×`).join(", ");
  return `| ${label} | ${n} | ${pct(rows.filter(({ r }) => r.same).length, n)} | ${Math.round((100 * rows.reduce((a, { r }) => a + r.score, 0)) / n)} % | ${pct(rows.filter(({ r }) => r.lanesA === r.lanesB).length, n)} | ${pct(rows.filter(({ r }) => Math.abs(r.widthA - r.widthB) <= 1).length, n)} / ${pct(rows.filter(({ r }) => Math.abs(r.widthA - r.widthB) <= 2).length, n)} | ${top} |`;
}
const a = rowsOf(dc), b = rowsOf(osm);
const byKind = (rows, k) => rows.filter(({ j }) => sample.get(j.id).kind === k);
console.log("| profil | řezů | složení stejné | shoda složení | pruhy stejně | šířka uličního prostoru do 1 / 2 m | nejčastější rozdíly (aplikace proti posuzovateli) |\n|---|---|---|---|---|---|---|");
console.log(summary("DC: mapa povrchů + inventář DDOT", a));
for (const k of ["residential", "collector", "arterial"]) console.log(summary(`DC – ${k}`, byKind(a, k)));
console.log(summary("DC + pruhy z inventáře (varianta)", rowsOf(dc2)));
console.log(summary("jen OSM (bez mapy, bez ortofota)", b));
// A check of the judge (ZPRAVA.md): the same composition with the green strips beside the roadway left out of both
// profiles (scope() first, so green between lanes stays a median): the judges left out narrow grass strips the
// orthophoto shows (dc-5-1, dc-8-4, dc-3-4), which the map has.
function noGreen(app) {
  const comp = (parts, judge, open) => { const seq = []; for (const [c] of scope(asClasses(parts, judge), open).parts) if (!["krajnice", "jine", "zelen"].includes(c) && seq.at(-1) !== c) seq.push(c); return seq; };
  const sc = usable.map((j) => { const open = { A: j.facadeA === false, B: j.facadeB === false }, x = comp(j.parts, true, open), y = comp(app.get(j.id).parts, false, open); return 1 - diff(x, y).dist / Math.max(x.length, y.length, 1); });
  return `${Math.round((100 * sc.reduce((a, b) => a + b, 0)) / sc.length)} % (stejné ${sc.filter((v) => v === 1).length} z ${sc.length})`;
}
console.log(`\nShoda složení bez pásů zeleně u vozovky: DC ${noGreen(dc)}, jen OSM ${noGreen(osm)}`);
console.log(`\nVynecháno (posuzovatel: není ulice): ${judged.filter((j) => !j.usable).map((j) => j.id).join(", ") || "nic"}\n`);
console.log("| řez | ulice (typ) | posuzovatel | DC | shoda DC | jen OSM | shoda OSM | šířka posuz. / DC |\n|---|---|---|---|---|---|---|---|");
const seq = (parts, judge) => composition(asClasses(parts, judge)).join(" ");
for (let i = 0; i < a.length; i++) {
  const { j, r } = a[i], s = sample.get(j.id), o = b[i].r;
  console.log(`| ${j.id} | ${s.name} (${s.highway}) | ${seq(j.parts, true)} | ${seq(dc.get(j.id).parts)} | ${Math.round(100 * r.score)} % | ${seq(osm.get(j.id).parts)} | ${Math.round(100 * o.score)} % | ${r.widthA.toFixed(1)} / ${r.widthB.toFixed(1)} |`);
}
