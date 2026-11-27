// The sample of the A/B test of the Slovak towns' passports (Bára 16. 11. 2026): random points (fixed seed) within
// 1.5 km of the centre of each town whose passport the app asks (towns/slovakia.js SK_TOWNS), Dúbravka apart (its
// borough passport). The app snaps each to the nearest street (cutAt). Written to vzorek.json for collect.js.
//   node evaluation/slovakia/ab/sample.mjs
import fs from "node:fs";
const TOWNS = { bratislava: [48.1440, 17.1100, 25], dubravka: [48.1880, 17.0350, 15], presov: [48.9980, 21.2400, 25],
  zilina: [49.2230, 18.7400, 25], bystrica: [48.7360, 19.1460, 25] };
let seed = 20261116;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const out = [];
for (const [town, [lat, lon, n]] of Object.entries(TOWNS)) for (let i = 0; i < n; i++) {
  const r = (town === "dubravka" ? 900 : 1500) * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: out.length + 1, town, lat: +(lat + (r * Math.cos(a)) / 111320).toFixed(6), lon: +(lon + (r * Math.sin(a)) / (111320 * Math.cos((lat * Math.PI) / 180))).toFixed(6) });
}
fs.writeFileSync(new URL("vzorek.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(out.length, "bodů");
