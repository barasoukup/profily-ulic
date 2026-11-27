// The sample of the A/B test of the towns' map lines (kerbs) and Zvolen's roads (Bára 16. 11. 2026): 20 random points
// (fixed seed) within 1.2 km of the centres of Nitra, Zvolen, Piešťany and Hlohovec, then Prešov's and Bratislava's
// points of vzorek.json. Written to vzorek-hrany.json for collect.js.
//   node evaluation/slovakia/ab/sample-edges.mjs
import fs from "node:fs";
const TOWNS = { nitra: [48.3090, 18.0870], zvolen: [48.5760, 19.1250], piestany: [48.5920, 17.8270], hlohovec: [48.4300, 17.8030] };
let seed = 20261117;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const out = [];
for (const [town, [lat, lon]] of Object.entries(TOWNS)) for (let i = 0; i < 20; i++) {
  const r = 1200 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
  out.push({ id: 200 + out.length + 1, town, lat: +(lat + (r * Math.cos(a)) / 111320).toFixed(6), lon: +(lon + (r * Math.sin(a)) / (111320 * Math.cos((lat * Math.PI) / 180))).toFixed(6) });
}
const old = JSON.parse(fs.readFileSync(new URL("vzorek.json", import.meta.url), "utf8")).filter((p) => ["presov", "bratislava", "dubravka"].includes(p.town));
fs.writeFileSync(new URL("vzorek-hrany.json", import.meta.url), JSON.stringify([...out, ...old], null, 1));
console.log(out.length + old.length, "bodů");
