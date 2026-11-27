// The sample of the A/B test of ZBGIS (road widths, car parks, lawns; Bára 16. 11. 2026): random points (fixed seed)
// within 1.5 km of the centres of towns with no data of their own. Written to vzorek-zbgis.json for collect.js.
//   node evaluation/slovakia/ab/sample-zbgis.mjs
import fs from "node:fs";
const TOWNS = { kosice: [48.7200, 21.2580, 25], trnava: [48.3770, 17.5880, 15], trencin: [48.8945, 18.0440, 15], martin: [49.0660, 18.9230, 12],
  poprad: [49.0560, 20.2970, 12], nitra: [48.3090, 18.0870, 11] };
let seed = 20261118;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const out = [];
for (const [town, [lat, lon, n]] of Object.entries(TOWNS)) for (let i = 0; i < n; i++) {
  const r = 1500 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: 400 + out.length + 1, town, lat: +(lat + (r * Math.cos(a)) / 111320).toFixed(6), lon: +(lon + (r * Math.sin(a)) / (111320 * Math.cos((lat * Math.PI) / 180))).toFixed(6) });
}
fs.writeFileSync(new URL("vzorek-zbgis.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(out.length, "bodů");
