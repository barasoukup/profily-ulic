// Split GeoJSONSeq exports of OSM data (from ogr2ogr) into small grid tiles in
// Overpass-like JSON, so the pilot server can answer locally without Overpass.
// Lines become {type: "way"}, polygons (e.g. parking areas) become {type: "area"},
// points (e.g. trees) become {type: "node"}.
//   node tools/build_osm_tiles.mjs pilot/data/osm-tiles data/osm/praha_ways.geojsonl data/osm/praha_parking.geojsonl \
//     data/osm/praha_trees.geojsonl data/osm/praha_treerows.geojsonl
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

export const TILE = 0.005; // degrees

const [outDir, ...sources] = process.argv.slice(2);

function parseOtherTags(s) {
  const tags = {};
  if (!s) return tags;
  const re = /"((?:[^"\\]|\\.)*)"=>"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(s))) tags[m[1].replace(/\\"/g, '"')] = m[2].replace(/\\"/g, '"');
  return tags;
}

const tiles = new Map();
const point = ([lon, lat]) => ({ lat: +lat.toFixed(7), lon: +lon.toFixed(7) });

function add(el, coords) {
  // Every tile touched by a segment's bounding box, so long segments are not missed.
  const keys = new Set();
  for (let i = 0; i < coords.length; i++) {
    const [a, b] = [coords[i], coords[Math.min(i + 1, coords.length - 1)]];
    for (let ix = Math.floor(Math.min(a[0], b[0]) / TILE); ix <= Math.floor(Math.max(a[0], b[0]) / TILE); ix++) {
      for (let iy = Math.floor(Math.min(a[1], b[1]) / TILE); iy <= Math.floor(Math.max(a[1], b[1]) / TILE); iy++) {
        keys.add(`${ix}_${iy}`);
      }
    }
  }
  for (const k of keys) {
    if (!tiles.has(k)) tiles.set(k, []);
    tiles.get(k).push(el);
  }
}

let n = 0;
for (const src of sources) {
  const rl = readline.createInterface({ input: fs.createReadStream(src) });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const f = JSON.parse(line);
    const p = f.properties;
    const tags = parseOtherTags(p.other_tags);
    for (const k of ["name", "highway", "railway", "amenity", "barrier", "leisure", "building"]) if (p[k]) tags[k] = p[k];
    // Buildings only need their height tags; dropping the rest keeps the tiles small.
    if (tags.building) for (const k of Object.keys(tags)) if (!["building", "building:levels", "roof:levels", "height"].includes(k)) delete tags[k];
    const g = f.geometry;
    if (g.type === "Point") {
      add({ type: "node", id: Number(p.osm_id), tags, geometry: [point(g.coordinates)] }, [g.coordinates]);
    } else if (g.type === "LineString" || g.type === "MultiLineString") {
      for (const coords of g.type === "LineString" ? [g.coordinates] : g.coordinates) {
        add({ type: "way", id: Number(p.osm_id), tags, geometry: coords.map(point) }, coords);
      }
    } else if (g.type === "Polygon" || g.type === "MultiPolygon") {
      const id = Number(p.osm_way_id || p.osm_id);
      for (const poly of g.type === "Polygon" ? [g.coordinates] : g.coordinates) {
        add({ type: "area", id, tags, geometry: poly[0].map(point), holes: poly.slice(1).map((r) => r.map(point)) }, poly[0]);
      }
    }
    n++;
  }
}
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
for (const [k, els] of tiles) fs.writeFileSync(path.join(outDir, `${k}.json`), JSON.stringify(els));
// The box the tiles cover (tile indexes): beyond it the app asks Overpass (pilot/public/gis.js).
const ix = [...tiles.keys()].map((k) => +k.split("_")[0]), iy = [...tiles.keys()].map((k) => +k.split("_")[1]);
fs.writeFileSync(path.join(outDir, "extent.json"), JSON.stringify({ ix: [Math.min(...ix), Math.max(...ix)], iy: [Math.min(...iy), Math.max(...iy)] }));
console.log(`${n} features → ${tiles.size} tiles in ${outDir}`);
