// The A/B of Paris's private blocks as the end of the public way (towns/france.js parisBlocks, ?ilots=0): 60 new random
// points within 4 km of the centre, none within 60 m of a point of an earlier Paris A/B (../ab, ../../archive/facade-strip).
//   node evaluation/france/facade/sample.mjs > evaluation/france/facade/sample.json
import fs from "node:fs";
let seed = 20261128;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const old = ["../ab/sample.json", "../../archive/facade-strip/sample.json", "../../archive/facade-strip/sample2.json"].flatMap((f) => JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8")));
const near = (p) => old.some((q) => Math.hypot((p.lat - q.lat) * 110574, (p.lon - q.lon) * 111320 * Math.cos((p.lat * Math.PI) / 180)) < 60);
const [lat0, lon0] = [48.8566, 2.3422], out = [];
for (let i = 1; out.length < 60; i++) {
  const r = 4000 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  const p = { id: `il${i}`, group: "target", place: "paris", lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) };
  if (!near(p)) out.push(p);
}
console.log(JSON.stringify(out, null, 1));
