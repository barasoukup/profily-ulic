// The inputs of sample.mjs for a town without a local OSM extract: the town's boundary (the RÚIAN obec
// from ČÚZK) → evaluation/<id>/data/<id>_hranice.geojson, and the OSM streets inside its envelope taken
// from the national tiles (pilot/data/osm-tiles) → data/osm/<id>_ways.geojsonl (the ogr2ogr shape
// sample.mjs reads: osm_id, name, highway, other_tags as hstore). Nothing is downloaded but the boundary.
//   node evaluation/osm_ways.mjs <id> <RÚIAN kód obce>
import fs from "node:fs";
import path from "node:path";
import { TILE, decodeTile, mergePieces } from "../pilot/public/osmtile.js";

const [id, kod] = process.argv.slice(2);
if (!id || !kod) throw new Error("node evaluation/osm_ways.mjs <id> <kód obce>");
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DATA = path.join(ROOT, id, "data");
fs.mkdirSync(DATA, { recursive: true });

const OBEC = "https://ags.cuzk.gov.cz/arcgis/rest/services/RUIAN/Prohlizeci_sluzba_nad_daty_RUIAN/MapServer/12/query";
const q = new URLSearchParams({ where: `kod=${kod}`, outFields: "nazev", outSR: 4326, f: "geojson" });
const border = await (await fetch(`${OBEC}?${q}`)).json();
if (!border.features?.length) throw new Error(`obec ${kod} nenalezena`);
fs.writeFileSync(path.join(DATA, `${id}_hranice.geojson`), JSON.stringify(border));
const pts = border.features.flatMap((f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates)).flat(2);
const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
console.log(border.features[0].properties.nazev, Math.min(...xs).toFixed(3), Math.min(...ys).toFixed(3), Math.max(...xs).toFixed(3), Math.max(...ys).toFixed(3));

const TILES = path.join(ROOT, "..", "pilot", "data", "osm-tiles");
const lists = [];
for (let ix = Math.floor(Math.min(...xs) / TILE); ix <= Math.floor(Math.max(...xs) / TILE); ix++) {
  for (let iy = Math.floor(Math.min(...ys) / TILE); iy <= Math.floor(Math.max(...ys) / TILE); iy++) {
    try { lists.push(decodeTile(fs.readFileSync(path.join(TILES, `${ix}_${iy}.json`), "utf8")).filter((e) => e.type === "way" && e.tags.highway)); } catch {}
  }
}
const hs = (o) => Object.entries(o).map(([k, v]) => `"${k}"=>"${String(v).replace(/"/g, "'")}"`).join(",");
const out = fs.createWriteStream(path.join(ROOT, "..", "data", "osm", `${id}_ways.geojsonl`));
let n = 0;
for (const w of mergePieces(lists)) {
  if (w.type !== "way" || !w.tags.highway) continue;
  const { name, highway, ...other } = w.tags;
  out.write(JSON.stringify({ type: "Feature", properties: { osm_id: String(w.id), name: name || null, highway, other_tags: hs(other) }, geometry: { type: "LineString", coordinates: w.geometry.map((p) => [p.lon, p.lat]) } }) + "\n");
  n++;
}
out.end();
console.log(n, "cest z", lists.length, "dlaždic");
