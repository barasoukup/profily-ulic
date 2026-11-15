// The sample's inputs of a town without its own OSM export (Bára, 15. 11. 2026: the towns' new passports): its
// boundary from RÚIAN of ČÚZK (evaluation/<city>/data/<city>_hranice.geojson) and its streets from the app's OSM
// tiles of the whole country (data/osm/<city>_ways.geojsonl, as the GeoJSONSeq of ogr2ogr that sample.mjs reads).
//   node evaluation/town_prep.mjs sumperk Šumperk   → then CITY=sumperk node evaluation/sample.mjs
import fs from "node:fs";
import path from "node:path";
import { decodeTile, mergePieces, TILE } from "../pilot/public/osmtile.js";

const [city, name] = process.argv.slice(2);
if (!city || !name) throw new Error("node evaluation/town_prep.mjs <city> <název obce>");
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DATA = path.join(ROOT, city, "data");
fs.mkdirSync(DATA, { recursive: true });

const q = new URLSearchParams({ where: `nazev='${name}'`, outFields: "nazev,kod", outSR: 4326, f: "geojson" });
const border = await fetch(`https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/12/query?${q}`).then((r) => r.json());
if (!border.features?.length) throw new Error(`obec ${name} nenalezena`);
fs.writeFileSync(path.join(DATA, `${city}_hranice.geojson`), JSON.stringify(border));
const pts = border.features.flatMap((f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates)).flat(2);
const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);

const TILES = path.join(ROOT, "..", "pilot", "data", "osm-tiles");
const lists = [];
for (let x = Math.floor(Math.min(...xs) / TILE); x <= Math.floor(Math.max(...xs) / TILE); x++) {
  for (let y = Math.floor(Math.min(...ys) / TILE); y <= Math.floor(Math.max(...ys) / TILE); y++) {
    const file = path.join(TILES, `${x}_${y}.json`);
    if (fs.existsSync(file)) lists.push(decodeTile(fs.readFileSync(file, "utf8")));
  }
}
const hstore = (tags) => Object.entries(tags).filter(([k]) => !["name", "highway"].includes(k)).map(([k, v]) => `"${k}"=>"${String(v).replace(/"/g, '\\"')}"`).join(",");
const out = mergePieces(lists).filter((e) => e.type === "way" && e.tags?.highway && e.geometry.length > 1).map((e) => JSON.stringify({
  type: "Feature",
  properties: { osm_id: String(e.id), name: e.tags.name || null, highway: e.tags.highway, other_tags: hstore(e.tags) || null },
  geometry: { type: "LineString", coordinates: e.geometry.map((g) => [g.lon, g.lat]) },
}));
fs.writeFileSync(path.join(ROOT, "..", "data", "osm", `${city}_ways.geojsonl`), out.join("\n") + "\n");
console.log(city, out.length, "ways,", lists.length, "tiles");
