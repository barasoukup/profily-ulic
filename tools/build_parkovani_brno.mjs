// Paid parking of Brno for the profile, from the map of parkovanivbrne.cz (Brněnské komunikace): its
// sections (úseky OPS) are current, unlike the export on data.brno.cz (2/2024), which misses whole areas
// brought in since (e.g. 8-02 Spodní, 9-01 Dunajská). The map loads one data file (mapdata.o.js) that
// does not allow other pages to read it, so it is fetched once per deploy and cut down here (Bára).
//   node tools/build_parkovani_brno.mjs <out dir>
//   → parkovani/<ix>_<iy>.json  sections and special stalls as ArcGIS JSON polygons with KIND (useky,
//                    zasobovani, specialni), in 0.005° tiles like the OSM tiles
import fs from "node:fs";
import path from "node:path";

const MAP = "https://www.parkovanivbrne.cz/mapa/";
const outDir = process.argv[2];
if (!outDir) {
  console.error("použití: node tools/build_parkovani_brno.mjs <výstup>");
  process.exit(1);
}

const get = async (url) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.text();
};
const html = await get(MAP);
const file = html.match(/js\/data\/\d+\/mapdata[^"']*/)?.[0];
if (!file) throw new Error("mapa parkovanivbrne.cz: soubor s daty nenalezen");
const text = await get(MAP + file);
const data = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));

const round = (v) => +v.toFixed(7);
const polys = (g) => (g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []);
// Layers of the map → kinds of derive.js (TSK_CODES): sections, deliveries, other special stalls.
const LAYERS = { ops: "useky", zasobovani: "zasobovani", obratkovestani: "specialni" };
const features = [];
for (const [layer, kind] of Object.entries(LAYERS)) {
  for (const f of data[layer]?.features || []) {
    for (const p of polys(f.geometry)) features.push({ attributes: { KIND: kind }, geometry: { rings: p.map((r) => r.map(([x, y]) => [round(x), round(y)])) } });
  }
}
// The residential parking areas are not taken: they outline whole quarters, also streets with no paid
// stall (Elišky Krásnohorské in 6-01, Bára), so the profile goes by the sections themselves.
if (features.length < 1000) throw new Error(`mapa parkovanivbrne.cz: málo dat (${features.length} úseků)`);
const TILE = 0.005;
const tiles = new Map();
for (const f of features) {
  const xs = f.geometry.rings[0].map((q) => q[0]), ys = f.geometry.rings[0].map((q) => q[1]);
  for (let ix = Math.floor(Math.min(...xs) / TILE); ix <= Math.floor(Math.max(...xs) / TILE); ix++) {
    for (let iy = Math.floor(Math.min(...ys) / TILE); iy <= Math.floor(Math.max(...ys) / TILE); iy++) {
      const k = `${ix}_${iy}`;
      if (!tiles.has(k)) tiles.set(k, []);
      tiles.get(k).push(f);
    }
  }
}
const tileDir = path.join(outDir, "parkovani");
fs.rmSync(tileDir, { recursive: true, force: true });
fs.mkdirSync(tileDir, { recursive: true });
for (const [k, fs_] of tiles) fs.writeFileSync(path.join(tileDir, `${k}.json`), JSON.stringify({ features: fs_ }));
console.log(`parkování Brno: ${features.length} úseků a stání v ${tiles.size} dlaždicích (${file})`);
