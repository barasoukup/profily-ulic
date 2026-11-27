// Scores the judges' floors against the old rule and the current floors.js (recomputed from the stored heights).
//   node score.mjs <results dir with A1,A2,B1,B2 .jsonl>
import fs from "node:fs";
import path from "node:path";
import { sign, wilson } from "../canada/review/stat.mjs";
import { floorsFromHeight, floorsOld } from "../../pilot/public/floors.js";
const HERE = path.dirname(new URL(import.meta.url).pathname), R = process.argv[2];
const L = (fs_) => new Map(fs_.flatMap((f) => fs.readFileSync(path.join(R, f), "utf8").trim().split("\n").map((l) => JSON.parse(l))).map((r) => [r.id, r]));
const A = L(["A1.jsonl", "A2.jsonl"]), B = L(["B1.jsonl", "B2.jsonl"]);
const rows = [...JSON.parse(fs.readFileSync(path.join(HERE, "sample.json"))).rows.map((r) => ({ ...r, set: "Toronto" })), ...JSON.parse(fs.readFileSync(path.join(HERE, "sample-osm.json"))).rows.map((r) => ({ ...r, set: "OSM" }))];
const out = [];
let skip = 0, apart = 0;
for (const r of rows) {
  const x = A.get(r.id)?.floors, y = B.get(r.id)?.floors;
  if (x == null || y == null) { skip++; continue; }
  if (Math.abs(x - y) > 1) { apart++; continue; }
  const t = (x + y) / 2, type = r.tags.building === "yes" ? undefined : r.tags.building, shape = r.tags["roof:shape"];
  const old = r.set === "Toronto" ? floorsOld(r.h) : Math.round(r.h / 3.5), now = floorsFromHeight(r.h, { type, roofShape: shape });
  const dflt = r.set === "Toronto" ? 2 : 3; // what the app draws when the height gives no floors (a guess)
  out.push({ ...r, t, old, now, eo: Math.abs(old - t), en: Math.abs((now ?? dflt) - t), changed: old !== now });
}
const show = (name, xs) => { const w = xs.filter((r) => r.en < r.eo - 1e-9).length, l = xs.filter((r) => r.en > r.eo + 1e-9).length; console.log(`| ${name} | ${xs.length} | **${w} : ${l}** | ${xs.length - w - l} | ${wilson(w, w + l)} | ${sign(w, l).toFixed(3)} |`); };
console.log(`budov ${rows.length}, nejde poznat ${skip}, posudky se liší o víc než jedno ${apart}, porovnáno ${out.length}\n\n| sada | budov | blíž nově : dřív | stejně | podíl (95 %) | p |\n|---|---|---|---|---|---|`);
const ch = out.filter((r) => r.changed);
show("změněné, vše", ch);
for (const s of ["Toronto", "OSM"]) show(`změněné, ${s}`, ch.filter((r) => r.set === s));
console.log(`\nbez změny (kontrola, má být stejně): ${out.filter((r) => !r.changed).length} budov`);
if (process.argv[3]) { console.log("\n| id | h | typ | střecha | foto | dřív | nově |\n|---|---|---|---|---|---|---|"); for (const r of ch) console.log(`| ${r.id} | ${r.h} | ${r.tags.building} | ${r.tags["roof:shape"] || "-"} | ${r.t} | ${r.old} | ${r.now ?? "–"} |`); }
