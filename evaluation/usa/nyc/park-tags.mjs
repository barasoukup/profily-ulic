// How much of New York's street network OSM tags with parking (the parking split of 26. 11. 2026, park/REPORT.md): for
// each point of a sample the tags parking:* of the cut's way.  SITE=http://localhost:5463 node evaluation/usa/nyc/park-tags.mjs [sample.json]
import fs from "node:fs/promises";
const SITE = process.env.SITE;
globalThis.location = { search: "?osm=balik", href: SITE, origin: SITE };
const native = globalThis.fetch;
globalThis.fetch = (url, o) => (/^https?:/.test(String(url?.url || url)) ? native(url, o) : native(new URL(String(url), SITE + "/"), o));
const C = await import("../../../app/public/city.js"), json = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8"));
C.loadBounds(await json("../../../app/public/towns.json")); await import("../../../app/public/america.js"); C.loadStates({ ...await json("../../../app/public/states.json"), ...await json("../../../app/public/states-america.json") }); C.loadTowns(await json("../../../app/public/towns-us.json"));
const U = await import("../../../app/public/towns/usa.js");
const pts = await json(process.argv[2] || "sample-all.json");
let tagged = 0;
for (const s of pts) {
  const o = await U.sources.osm(s.lat, s.lon, 80), way = o.elements.find((e) => e.id === s.wayId);
  const t = Object.fromEntries(Object.entries(way?.tags || {}).filter(([k]) => /^parking/.test(k)));
  if (Object.keys(t).length) tagged++;
  console.log(s.id, s.kind, way?.tags?.highway, way?.tags?.name || "", JSON.stringify(t));
}
console.log("s tagy stání", tagged, "z", pts.length);
