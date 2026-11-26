// How much of New York's street network OSM tags with parking (the parking split of 26. 11. 2026, park/ZPRAVA.md): for
// each point of a sample the tags parking:* of the cut's way.  SITE=http://localhost:5463 node evaluation/usa/nyc/park-tags.mjs [sample.json]
import fs from "node:fs/promises";
const SITE = process.env.SITE;
globalThis.location = { search: "?osm=balik", href: SITE, origin: SITE };
const native = globalThis.fetch;
globalThis.fetch = (url, o) => (/^https?:/.test(String(url?.url || url)) ? native(url, o) : native(new URL(String(url), SITE + "/"), o));
const C = await import("../../../pilot/public/city.js"), json = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8"));
C.loadBounds(await json("../../../pilot/public/mesta.json")); await import("../../../pilot/public/america.js"); C.loadStates({ ...await json("../../../pilot/public/staty.json"), ...await json("../../../pilot/public/staty-america.json") }); C.loadTowns(await json("../../../pilot/public/mesta-us.json"));
const U = await import("../../../pilot/public/towns/usa.js");
const pts = await json(process.argv[2] || "sample-all.json");
let tagged = 0;
for (const s of pts) {
  const o = await U.sources.osm(s.lat, s.lon, 80), way = o.elements.find((e) => e.id === s.wayId);
  const t = Object.fromEntries(Object.entries(way?.tags || {}).filter(([k]) => /^parking/.test(k)));
  if (Object.keys(t).length) tagged++;
  console.log(s.id, s.kind, way?.tags?.highway, way?.tags?.name || "", JSON.stringify(t));
}
console.log("s tagy stání", tagged, "z", pts.length);
