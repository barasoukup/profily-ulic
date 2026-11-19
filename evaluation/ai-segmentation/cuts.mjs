// Patches around the cuts of the estimate's regression (evaluation/ortofoto-osm/regrese.mjs: the cuts of
// evaluation/<city>/data/ab-city-stejne and their truth from MTVU), so the model is measured exactly as the app's
// estimate is: the kerbs of the carriageway and the sidewalk per side, along the same cut lines.
//   node evaluation/ai-segmentation/cuts.mjs brno
// OSM from the app's packs, as the training patches (osm.mjs). Writes data/ai-seg/cuts/<city>/<n>.json (patch of 83.2 m, 416 px, with the cut's lines and the truth) and .osm.json.
import fs from "node:fs";
import { setCity, sources } from "./labels-lib.mjs";
const { cuts, truthOf, frame } = await import("../ortofoto-osm/lib.mjs");
const { hintsOf } = await import("./osm.mjs");

const city = process.argv[2] || "brno";
setCity(city);
const dir = new URL(`../../../../../data/ai-seg/cuts/${city}/`, import.meta.url);
fs.mkdirSync(dir, { recursive: true });
const HALF = 41.6, PX = 416;
let n = 0;
for (const c of await cuts(city)) {
  const truth = truthOf(c, 0);
  if (!truth.way) continue;
  const { lat, lon } = c.cut, f = frame(c.cut);
  const dy = HALF / 110574, dx = HALF / (111320 * Math.cos((lat * Math.PI) / 180));
  const box = [lon - dx, lat - dy, lon + dx, lat + dy];
  // Three lines across the street (u = -3, 0, 3 m along it), a point every 20 cm (t from -40 to 40 m).
  const ts = [];
  for (let t = -40; t <= 40.001; t += 0.2) ts.push(+t.toFixed(1));
  const lines = [-3, 0, 3].map((u) => ts.map((t) => f.lonlat(t, u).map((v) => +v.toFixed(8))));
  fs.writeFileSync(new URL(`${c.n}.json`, dir), JSON.stringify({ id: city, n: c.n, lat, lon, box, half: HALF, px: PX, feats: [],
    cut: c.cut, truth: { way: { s: truth.way.s, e: truth.way.e }, facade: truth.facade, side: truth.side }, ts, lines }));
  fs.writeFileSync(new URL(`${c.n}.osm.json`, dir), JSON.stringify(hintsOf((await sources.osm(lat, lon, 70)).elements, box)));
  n++;
}
console.log(`${city}: ${n} cuts`);
