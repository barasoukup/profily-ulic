// Streets with a cycle track of their own in OSM beside a street (the rule osmTracks of towns/planimetrics.js): random
// ones of Toronto, a fixed seed, 150 m apart. Writes tracks.json.   node evaluation/canada/tracks-sample.mjs
import fs from "node:fs/promises";
import { decodeTile, mergePieces } from "../../pilot/public/osmtile.js";
import { inside } from "../../pilot/public/places.js";
import { isTrack } from "../../pilot/public/towns/planimetrics.js";
const DATA = new URL("data/osm-tiles/", import.meta.url).pathname;
process.env.OSM_TILES = DATA;
const { placeCut } = await import("../usa-dc/lib.mjs");
const T = JSON.parse(await fs.readFile(new URL("../../pilot/public/mesta-ca.json", import.meta.url), "utf8")).toronto;
let seed = 20261127; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const tiles = await Promise.all((await fs.readdir(DATA)).filter((f) => /^-?\d+_-?\d+\.json$/.test(f)).sort().map(async (f) => decodeTile(await fs.readFile(DATA + f, "utf8"))));
const ways = mergePieces(tiles).filter((w) => w.type === "way" && w.tags && isTrack(w) && w.tags.highway === "cycleway" && inside(T, w.geometry[0].lon, w.geometry[0].lat)).sort((a, b) => a.id - b.id);
const out = [];
for (let i = 0; out.length < 40 && i < 800; i++) {
  const w = ways[Math.floor(rnd() * ways.length)], k = Math.floor(rnd() * (w.geometry.length - 1)), [a, b] = [w.geometry[k], w.geometry[k + 1]];
  const f = rnd(), lat = a.lat + (b.lat - a.lat) * f, lon = a.lon + (b.lon - a.lon) * f, n = [(b.lat - a.lat) / 1e5, 0];
  const c = await placeCut(lat, lon).catch(() => null);
  if (!c) continue;
  const osm = c.way.tags.highway;
  // The street beside it: a point 7 m off each side.
  let street = /primary|secondary|tertiary|residential|unclassified|trunk/.test(osm) ? c : null;
  const L = Math.hypot((b.lon - a.lon) * 80500, (b.lat - a.lat) * 110574), nx = -((b.lat - a.lat) * 110574) / L, ny = ((b.lon - a.lon) * 80500) / L;
  for (const d of [6, -6]) if (!street) { const q = await placeCut(lat + (ny * d) / 110574, lon + (nx * d) / 80500).catch(() => null); if (q && /primary|secondary|tertiary|residential|unclassified|trunk/.test(q.way.tags.highway)) street = q; }
  if (!street || out.some((o) => Math.hypot((o.lat - street.lat) * 110574, (o.lon - street.lon) * 80500) < 150)) continue;
  out.push({ id: `c-${out.length + 1}`, country: "CA", town: "toronto", name: street.way.tags.name || "", highway: street.way.tags.highway, wayId: street.way.id, lat: +street.lat.toFixed(7), lon: +street.lon.toFixed(7), bearing: +street.bearing.toFixed(1), variants: ["def", "rt0"] });
}
await fs.writeFile(new URL("tracks.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(ways.length, out.length);
