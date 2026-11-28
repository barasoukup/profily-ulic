// The app's estimate from the orthophoto and OSM (ortho-osm.js + derive.js, as regression.mjs runs it) on the cuts of
// cuts.mjs, saved as the parts laid across the cut, so compare.py measures it with the same function as the model.
// OSM from the app's own packs (as the model's hints, Fable's review: the old local tiles lack green).
//   node evaluation/ai-segmentation/estimate.mjs brno [brno10|brno20|cuzk12]
// Writes data/ai-seg/cuts/<city>/estimate-<key>.json: { n: { parts: [{ type, s, e }], extent } | { fail } }.
import fs from "node:fs";
import { setCity, sources } from "./labels-lib.mjs";
// After labels-lib (the app's config.js as published, STATIC = true: OSM from the packs); static imports would load
// the app's modules before it.
const { cuts, truthOf, stripOf } = await import("../ortho-osm/lib.mjs");
const { orthoOsmPolys, trimToEnds, P } = await import("../../app/public/ortho-osm.js");
const { localFrame, deriveProfile } = await import("../../app/public/derive.js");

const [city = "brno", key = "brno10"] = process.argv.slice(2);
P.off = new Set((process.env.OFF || "").split(",").filter(Boolean));
setCity(city);
if (!(await sources.osm(49.1951, 16.6068, 30)).elements.some((e) => e.type === "way")) throw new Error("OSM packs not read");
const out = {};
for (const c of await cuts(city)) {
  if (!truthOf(c, 0).way) continue;
  const st = await stripOf(city, key, c);
  if (!st) { out[c.n] = { fail: "no image" }; continue; }
  const osm = { elements: (await sources.osm(c.cut.lat, c.cut.lon, 70)).elements };
  const frame = localFrame(c.cut.lat, c.cut.lon), b = (c.cut.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)];
  const way = osm.elements.find((e) => e.type === "way" && e.id === c.cut.wayId);
  if (!way) { out[c.n] = { fail: "no way" }; continue; }
  const polys = orthoOsmPolys({ osm, frame, dir, way, st });
  const p = polys && trimToEnds(deriveProfile({ center: [0, 0], dir, half: 40, polys, osm, frame, way, reach: { left: 40, right: 40 } }), polys.ends);
  if (!p?.segments?.length || !p.extent) { out[c.n] = { fail: "no profile" }; continue; }
  const parts = [];
  let t = p.extent[1];
  for (const s of p.segments) { parts.push({ type: s.type, s: +(t - s.width).toFixed(3), e: +t.toFixed(3) }); t -= s.width; }
  out[c.n] = { parts, extent: p.extent, edges: p.edges || null };
}
const file = new URL(`../../../../../data/ai-seg/cuts/${city}/estimate-${key}${process.env.OFF ? `-off-${process.env.OFF}` : ""}${process.env.WALKCAP ? `-cap${process.env.WALKCAP}` : ""}.json`, import.meta.url);
fs.writeFileSync(file, JSON.stringify(out));
const v = Object.values(out);
console.log(`${city} ${key}: ${v.length} cuts, ${v.filter((x) => x.parts).length} with a profile`);
