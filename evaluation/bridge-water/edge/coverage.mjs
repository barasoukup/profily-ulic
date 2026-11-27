// How many of the sampled bridges lie inside a bridge deck OSM maps (man_made=bridge polygons, exported with osmium
// from the local extracts into BRIDGES/<pack>.geojsonl, see patch-pack.mjs).
//   BRIDGES=… node evaluation/bridge-water/edge/coverage.mjs [sample.json …]
import fs from "node:fs";
import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const DIR = process.env.BRIDGES;
const files = process.argv.slice(2).length ? process.argv.slice(2) : [path.join(HERE, "../blind/sample.json")];
const pip = (ring, x, y) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const cache = new Map();
const decks = (pack) => {
  if (!cache.has(pack)) {
    const f = path.join(DIR, `${pack}.geojsonl`);
    cache.set(pack, fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l.replace(/^\x1e/, ""))) : null);
  }
  return cache.get(pack);
};
const tally = {};
for (const file of files) for (const s of JSON.parse(fs.readFileSync(file, "utf8"))) {
  const d = decks(s.pack);
  const key = `${s.pack}/${s.kind}`;
  tally[key] ??= { n: 0, deck: 0, nodata: 0 };
  tally[key].n++;
  if (!d) { tally[key].nodata++; continue; }
  const hit = d.some((f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).some((p) => pip(p[0], s.lon, s.lat) && !p.slice(1).some((h) => pip(h, s.lon, s.lat))));
  if (hit) tally[key].deck++;
  if (process.env.V) console.log(s.id, s.pack, s.name, hit ? "deck" : "-");
}
const sum = { n: 0, deck: 0 };
for (const [k, v] of Object.entries(tally).sort()) { console.log(k, `${v.deck}/${v.n}`, v.nodata ? `(no data ${v.nodata})` : ""); sum.n += v.n - v.nodata; sum.deck += v.deck; }
console.log(`all: ${sum.deck}/${sum.n}`);
