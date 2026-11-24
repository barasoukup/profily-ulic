// The second A/B sample of Tallinn's surface map (hostile review 24. 11. 2026, bod 5): named streets for cars only, the
// whole city (not 3 km of the centre: the estates of Lasnamäe and Mustamäe, the villas of Nõmme too). 40 ways drawn
// with a fixed seed from the local OSM pack of Estonia (pilot/data/osm-pack/ee-novy.posm), highway residential to
// primary with a name, in the box [24.60, 59.38, 24.88, 59.47]; the point is the way's middle vertex.
//   node evaluation/estonia/ab/sample2.mjs > evaluation/estonia/ab/sample2.json
import fs from "node:fs/promises";
import { Pack } from "../../../pilot/public/osmpack.js";

const CARS = new Set(["primary", "secondary", "tertiary", "residential", "unclassified", "living_street"]);
const BOX = [24.6, 59.38, 24.88, 59.47], T = 0.005;
const fh = await fs.open(new URL("../../../pilot/data/osm-pack/ee-novy.posm", import.meta.url));
const pack = new Pack(async (a, b) => { const buf = Buffer.alloc(b - a + 1); await fh.read(buf, 0, buf.length, a); return { bytes: new Uint8Array(buf) }; });
const names = [];
for (let ix = Math.floor(BOX[0] / T); ix <= Math.floor(BOX[2] / T); ix++) for (let iy = Math.floor(BOX[1] / T); iy <= Math.floor(BOX[3] / T); iy++) names.push(`${ix}_${iy}`);
const ways = new Map();
for (const e of (await pack.tiles(names)).flat()) {
  if (e.type !== "way" || !CARS.has(e.tags?.highway) || !e.tags?.name || e.tags.tunnel || e.tags.bridge || !(e.geometry?.length >= 2)) continue;
  const m = e.geometry[Math.floor(e.geometry.length / 2)];
  if (m.lon < BOX[0] || m.lon > BOX[2] || m.lat < BOX[1] || m.lat > BOX[3]) continue;
  if (!ways.has(e.id)) ways.set(e.id, { name: e.tags.name, highway: e.tags.highway, lat: +m.lat.toFixed(6), lon: +m.lon.toFixed(6) });
}
await fh.close();
let seed = 20261124;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const all = [...ways.entries()].sort((a, b) => a[0] - b[0]).map(([id, w]) => ({ ...w, wayId: id, r: rnd() })).sort((a, b) => a.r - b.r);
const used = new Set(), out = [];
for (const w of all) {
  if (used.has(w.name)) continue; // one cut a street
  used.add(w.name);
  out.push({ id: `ts${out.length + 1}`, town: "tallinn", name: w.name, highway: w.highway, lat: w.lat, lon: w.lon });
  if (out.length === 40) break;
}
console.error(`${ways.size} ulic pro auta se jménem, vybráno ${out.length}`);
console.log(JSON.stringify(out, null, 1));
