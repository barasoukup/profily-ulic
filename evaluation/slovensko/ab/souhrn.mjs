// Summary of the A/B test of the Slovak passports (vysledky/rezy.json; verdicts in vysledky/posudky.json:
// { id: "a" | "b" | "obe" | "zadna" | "?" , … }): per town how many cuts the passport took (its surfaces at the axis:
// no estimate note), how many differ, and the verdicts on the orthophoto.
//   node evaluation/slovensko/ab/souhrn.mjs
import fs from "node:fs";
import { parts } from "./obrazky.mjs";
const dir = new URL("vysledky/", import.meta.url);
const rows = JSON.parse(fs.readFileSync(new URL("rezy.json", dir), "utf8"));
let verdicts = {};
try { verdicts = JSON.parse(fs.readFileSync(new URL("posudky.json", dir), "utf8")); } catch {}
const towns = {};
for (const r of rows) {
  const t = (towns[r.town] ??= { cuts: 0, used: 0, differ: 0, a: 0, b: 0, obe: 0, zadna: 0, "?": 0, unknownA: 0, unknownB: 0 });
  t.cuts++;
  if (r.B?.sources?.skTown && !r.B.note) t.used++;
  if (parts(r.A) !== parts(r.B)) t.differ++;
  const v = verdicts[r.id]?.v ?? verdicts[r.id];
  if (typeof v === "string" && v in t) t[v]++;
  const unk = (p) => (p?.segments || []).filter(([ty]) => ty === "nezname").reduce((a, [, w]) => a + w, 0);
  t.unknownA += unk(r.A); t.unknownB += unk(r.B);
}
console.log("město | řezů | pasport u osy | liší se | lépe s pasportem | lépe bez | obě dobře | obě špatně | nejasné | Neurčeno bez/s (m)");
for (const [k, t] of Object.entries(towns)) console.log([k, t.cuts, t.used, t.differ, t.b, t.a, t.obe, t.zadna, t["?"], `${t.unknownA.toFixed(0)}/${t.unknownB.toFixed(0)}`].join(" | "));
