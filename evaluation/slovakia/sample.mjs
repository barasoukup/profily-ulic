// The sample of cuts in Slovakia (Bára 15. 11. 2026): random points (fixed seed) within about 1.2 km of the centres
// of six towns; the app snaps each to the nearest street (cutAt). Written to vzorek.json for collect.js.
//   node evaluation/slovakia/sample.mjs
import fs from "node:fs";
const TOWNS = { bratislava: [48.1440, 17.1100], kosice: [48.7190, 21.2580], zilina: [49.2230, 18.7400], nitra: [48.3120, 18.0870],
  "banska-bystrica": [48.7360, 19.1460], presov: [48.9980, 21.2400] };
const PER = { bratislava: 12, kosice: 10, zilina: 5, nitra: 5, "banska-bystrica": 4, presov: 4 };
let seed = 20261115;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const out = [];
for (const [town, [lat, lon]] of Object.entries(TOWNS)) for (let i = 0; i < PER[town]; i++) {
  const r = 1200 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: out.length + 1, town, lat: +(lat + (r * Math.cos(a)) / 111320).toFixed(6), lon: +(lon + (r * Math.sin(a)) / (111320 * Math.cos((lat * Math.PI) / 180))).toFixed(6) });
}
fs.writeFileSync(new URL("vzorek.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(out.length, "bodů");
