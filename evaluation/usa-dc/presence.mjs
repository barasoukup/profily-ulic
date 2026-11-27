// The DC pilot: presence of parking, a green strip and a median in the street space (compare.mjs scope, the judge's open
// sides), judge against DC's map and against OSM alone: agreement per cut (both have it or both do not).
//   node evaluation/usa-dc/presence.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { asClasses, scope } from "../universal/compare.mjs";
import { ROOT, DATA } from "./lib.mjs";
const load = async (f) => new Map(JSON.parse(await fs.readFile(path.join(DATA, f), "utf8")).map((r) => [r.id, r]));
const dc = await load("app-dc.json"), osm = await load("app-osm.json");
const judged = (await Promise.all(["u-us-1.jsonl", "u-us-2.jsonl"].map((f) => fs.readFile(path.join(ROOT, "results", f), "utf8")))).join("\n").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((j) => j.usable);
const has = (parts, judge, open, c) => scope(asClasses(parts, judge), open).parts.some(([x]) => x === c);
console.log("| prvek | posuzovatel má | DC souhlasí | jen OSM souhlasí |\n|---|---|---|---|");
for (const c of ["stani", "zelen", "delici", "chodnik", "cyklopruh"]) {
  let n = 0, jd = 0, a = 0, b = 0;
  for (const j of judged) {
    const open = { A: j.facadeA === false, B: j.facadeB === false }, x = has(j.parts, true, open, c);
    n++; jd += x; a += x === has(dc.get(j.id).parts, false, open, c); b += x === has(osm.get(j.id).parts, false, open, c);
  }
  console.log(`| ${c} | ${jd} z ${n} | ${a} z ${n} | ${b} z ${n} |`);
}
