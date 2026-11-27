// The attic rule of towns/slovenia.js gursBuilding against what is known of the houses (Bára 23. 11. 2026): the
// photo-judged houses of the A/B (data/raw.json, REPORT.md) and the OSM buildings with building:levels and
// roof:levels (data/raw-osm.json from attic-osm.mjs: GURS's floors = building:levels + roof:levels with roof:levels ≥ 1
// → its top floor is in the roof; = building:levels → it is not; any other count is left out). Asks nothing.
//   node evaluation/slovenia/ab/attic-fit.mjs
import fs from "node:fs";
import { gursBuilding, ATTIC } from "../../../app/public/towns/slovenia.js";

const HERE = new URL("./", import.meta.url);
const raw = JSON.parse(fs.readFileSync(new URL("data/raw.json", HERE), "utf8"));
const osm = JSON.parse(fs.readFileSync(new URL("data/raw-osm.json", HERE), "utf8"));
const PHOTO = { "lj5-left": 0, "lj13-right": 0, "lj4-right": 0, "ma2-left": 0, "ma4-right": 0, "lj12-left": 1, "ma11-right": 1, "ma3-right": 1, "ma14-right": 1 };
const rows = [];
for (const [id, attic] of Object.entries(PHOTO)) rows.push({ set: "fotky", id, attic, b: gursBuilding(raw[id].b) });
for (const [id, v] of Object.entries(osm)) {
  const b = gursBuilding(v.b);
  if (!b.total) continue;
  const { levels, roofLevels } = v.osm;
  const attic = b.total === levels + roofLevels && roofLevels >= 1 ? 1 : b.total === levels ? 0 : null;
  if (attic !== null) rows.push({ set: "OSM", id, attic, b });
}
const line = (name, rs) => {
  const hit = rs.filter((r) => r.attic && r.b.roof).length, miss = rs.filter((r) => r.attic && !r.b.roof).length;
  const fp = rs.filter((r) => !r.attic && r.b.roof).length, tn = rs.filter((r) => !r.attic && !r.b.roof).length;
  return `| ${name} | ${rs.length} | ${rs.filter((r) => r.attic).length} | ${fp + tn} | ${hit + tn} | ${hit} | ${fp} |`;
};
console.log(`pravidlo: ${ATTIC.min}–${ATTIC.max} podlaží, H2 − H3 < ${ATTIC.perFloor} m × podlaží + ${ATTIC.roof} m`);
console.log("| soubor | domů | s podkrovím | bez | správně (dosud = bez) | podkroví nalezeno | falešně |\n|---|---|---|---|---|---|---|");
for (const set of ["fotky", "OSM"]) console.log(line(set, rows.filter((r) => r.set === set)));
console.log(line("celkem", rows));
for (const r of rows) if (!!r.b.roof !== !!r.attic) console.log(r.set, r.id, `${r.b.total} podlaží, výška ${r.b.height ?? "–"} m, rok ${r.b.built ?? "–"}:`, r.attic ? "podkroví nenalezeno" : "falešné podkroví");
