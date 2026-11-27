// Controls of the panel rule on the verified samples of all-buildings: every house drawn as a panel house (plocha/povalecny)
// there, its look with and without ?off=panel2.   node controls-old.mjs
import fs from "node:fs";
import path from "node:path";
import { P, C, HERE } from "./lib.mjs";
globalThis.PROFILY_CA = {};
const AB = path.join(HERE, "../all-buildings");
const R = (f) => JSON.parse(fs.readFileSync(f));
const rows = {};
for (const f of fs.readdirSync(AB).filter((f) => /^vzorek.*json$/.test(f))) for (const r of R(path.join(AB, f)).rows || []) if (r.before && r.after) rows[r.id] = r;
const keys = Object.assign({}, ...["klic1", "klic2", "klic3-AT", "klic4"].map((k) => R(path.join(AB, "results", k + ".json"))));
const jud = Object.assign({}, ...["posudek1", "posudek2", "posudek3-AT", "posudek4"].map((k) => R(path.join(AB, "results", k + ".json"))));
let n = 0, lost = 0, same = 0; const out = [];
for (const [id, r] of Object.entries(rows)) for (const a of ["before", "after"]) {
  const info = r[a].info;
  C.setCity(r.city); if (r.panels !== undefined) C.city.panels = r.panels;
  globalThis.PROFILY_CA.off = ""; const l1 = P.buildingStyle(info);
  globalThis.PROFILY_CA.off = "panel2"; const l0 = P.buildingStyle(info);
  if (l0 === l1) { same++; continue; }
  n++;
  const k = keys[id], j = jud[id], side = k ? (k.X === a ? "X" : "Y") : null;
  out.push(`${id} ${a} ${l0}>${l1} judged(${a}) ${j && side ? j[side] : "-"} | ${j?.type || ""} | ${JSON.stringify(info.block)} n=${info.levels} y=${info.start || "-"}`);
}
console.log(`rows ${Object.keys(rows).length}; looks changed ${n}`); console.log(out.join("\n"));
