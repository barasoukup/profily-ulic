// Splits GeoJSONSeq exports of OSM data (from ogr2ogr, tools/build_osm_data.sh) into small grid tiles in
// the compact form of pilot/public/osmtile.js, for the whole Czech Republic (about 700 MB in 230 000 tiles).
// Lines become "way" (cut by tiles: a tile keeps the segments touching it), polygons "area" (whole, with
// holes), points "node". Only what the profile draws, or may draw (Bára: zones, speeds, surface, stops,
// crossings, kinds of trees, widths, signs), is kept; paths and tracks away from streets are left out.
// Streams: tiles go to disk in batches, so memory stays small whatever the extract.
//   node tools/build_osm_tiles.mjs pilot/data/osm-tiles data/osm/cz_ways.geojsonl data/osm/cz_parking.geojsonl …
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { TILE } from "../pilot/public/osmtile.js";

export { TILE };
const [outDir, ...sources] = process.argv.slice(2);

function parseOtherTags(s) {
  const tags = {};
  if (!s) return tags;
  const re = /"((?:[^"\\]|\\.)*)"=>"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(s))) tags[m[1].replace(/\\"/g, '"')] = m[2].replace(/\\"/g, '"');
  return tags;
}

// Tags kept: what derive.js and profile.js read, and what the ideas Bára has not picked yet would need.
const KEEP = /^(highway|name|ref|local_ref|route_ref|railway|oneway|junction|lanes|turn|width|est_width|sidewalk|cycleway|parking|busway|bus|psv|bicycle|footway|service|bridge|tunnel|layer|level|indoor|area|trolley_wire|embedded_rails|surface|smoothness|barrier|natural|amenity|leisure|public_transport|shelter|building|roof:levels|height|orientation|parking_aisle|information|crossing|kerb|tactile_paving|tram|foot|access|motor_vehicle|covered|lit|maxspeed|zone|traffic_sign|leaf_type|leaf_cycle|diameter_crown|cyclestreet|bicycle_road|incline|bench|bin|segregated|location|placement|subway)(:|$)/;
const BUILDING_KEYS = new Set(["building", "building:levels", "roof:levels", "height"]);
// Ways the profile never draws: tracks, roads not built (yet), and footways, paths, steps and bridleways
// away from the roads (in parks, woods and fields). Near a road (within ROAD_NEAR) they stay: sidewalks
// are often mapped as plain footways, and the profile reads which side of a street has one.
const DROP_HW = new Set(["track", "proposed", "construction", "raceway", "abandoned", "corridor", "elevator", "via_ferrata"]);
const PATHS = new Set(["footway", "path", "steps", "bridleway", "cycleway"]);
const ROADS = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street", "service", "pedestrian",
  "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link", "busway", "road"]);
const CELL = 0.0004, ROAD_NEAR = 1; // cells of about 30 × 45 m; a path counts as near within one cell of a road
const cell = (x, y) => Math.floor(x / CELL) * 1e6 + Math.floor(y / CELL);
const roadCells = new Set();
const nearRoad = (coords) => coords.some(([x, y]) => {
  for (let dx = -ROAD_NEAR; dx <= ROAD_NEAR; dx++) for (let dy = -ROAD_NEAR; dy <= ROAD_NEAR; dy++) if (roadCells.has(cell(x + dx * CELL, y + dy * CELL))) return true;
  return false;
});
const dropWay = (t, coords) => DROP_HW.has(t.highway) || (PATHS.has(t.highway) && !(t.highway === "cycleway") && !nearRoad(coords));

const enc = (pts, q) => {
  const g = [];
  let px = 0, py = 0;
  for (const [lon, lat] of pts) {
    const x = Math.round(lon * q), y = Math.round(lat * q);
    g.push(x - px, y - py);
    px = x; py = y;
  }
  return g;
};
const tileOf = (x, y) => [Math.floor(x / TILE), Math.floor(y / TILE)];
// Tiles touched by a segment's bounding box.
function segTiles(a, b, keys) {
  const [x0, y0] = tileOf(Math.min(a[0], b[0]), Math.min(a[1], b[1])), [x1, y1] = tileOf(Math.max(a[0], b[0]), Math.max(a[1], b[1]));
  for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) keys.add(`${ix}_${iy}`);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const FLUSH = 150e6; // bytes held before writing out
const buf = new Map();
let held = 0, n = 0;
const extent = { ix: [Infinity, -Infinity], iy: [Infinity, -Infinity] };
function put(key, line) {
  if (!buf.has(key)) buf.set(key, []);
  buf.get(key).push(line);
  held += line.length + 1;
  if (held > FLUSH) flush();
}
function flush() {
  for (const [key, lines] of buf) {
    fs.appendFileSync(path.join(outDir, `${key}.json`), lines.join("\n") + "\n");
    const [ix, iy] = key.split("_").map(Number);
    extent.ix = [Math.min(extent.ix[0], ix), Math.max(extent.ix[1], ix)];
    extent.iy = [Math.min(extent.iy[0], iy), Math.max(extent.iy[1], iy)];
  }
  buf.clear();
  held = 0;
}

// First pass over the ways: the cells the roads run through (segments sampled every ~10 m).
for (const src of sources.filter((f) => /_ways\.geojsonl$/.test(f))) {
  const rl = readline.createInterface({ input: fs.createReadStream(src), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.includes('"highway"')) continue;
    const f = JSON.parse(line);
    if (!ROADS.has(f.properties.highway)) continue;
    const g = f.geometry;
    for (const c of g.type === "LineString" ? [g.coordinates] : g.coordinates) {
      for (let i = 0; i < c.length - 1; i++) {
        const [ax, ay] = c[i], [bx, by] = c[i + 1], n = Math.max(1, Math.ceil(Math.hypot((bx - ax) * 71000, (by - ay) * 111000) / 10));
        for (let k = 0; k <= n; k++) roadCells.add(cell(ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n));
      }
    }
  }
}

for (const src of sources) {
  const rl = readline.createInterface({ input: fs.createReadStream(src), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const f = JSON.parse(line);
    const p = f.properties;
    const all = parseOtherTags(p.other_tags);
    for (const k of ["name", "highway", "railway", "amenity", "barrier", "leisure", "building"]) if (p[k]) all[k] = p[k];
    const g = f.geometry;
    const line_ = g.type === "LineString" || g.type === "MultiLineString";
    if (line_ && all.highway && dropWay(all, g.type === "LineString" ? g.coordinates : g.coordinates.flat())) continue;
    const building = !!all.building && (g.type === "Polygon" || g.type === "MultiPolygon");
    const tags = Object.fromEntries(Object.entries(all).filter(([k]) => (building ? BUILDING_KEYS.has(k) : KEEP.test(k))));
    if (g.type === "Point") {
      const key = tileOf(...g.coordinates).join("_");
      put(key, JSON.stringify({ t: "n", i: Number(p.osm_id), k: tags, g: enc([g.coordinates], 1e6) }));
    } else if (line_) {
      // Each tile gets the runs of segments that touch it, with the index of the run's first point.
      for (const coords of g.type === "LineString" ? [g.coordinates] : g.coordinates) {
        const runs = new Map(); // tile → [[first point index, last point index], …]
        for (let i = 0; i < coords.length - 1; i++) {
          const keys = new Set();
          segTiles(coords[i], coords[i + 1], keys);
          for (const k of keys) {
            if (!runs.has(k)) runs.set(k, []);
            const r = runs.get(k), last = r[r.length - 1];
            if (last && last[1] === i) last[1] = i + 1; else r.push([i, i + 1]);
          }
        }
        if (coords.length === 1) runs.set(tileOf(...coords[0]).join("_"), [[0, 0]]);
        for (const [k, rs] of runs) {
          for (const [a, b] of rs) put(k, JSON.stringify({ t: "w", i: Number(p.osm_id), k: tags, o: a, g: enc(coords.slice(a, b + 1), 1e6) }));
        }
      }
    } else if (g.type === "Polygon" || g.type === "MultiPolygon") {
      // Buildings to 1e-5° (about 1 m): enough for the house at a cut and the shape of its block.
      const q = building ? 1e5 : 1e6;
      const id = Number(p.osm_way_id || p.osm_id);
      for (const poly of g.type === "Polygon" ? [g.coordinates] : g.coordinates) {
        const keys = new Set();
        for (let i = 0; i < poly[0].length; i++) segTiles(poly[0][i], poly[0][Math.min(i + 1, poly[0].length - 1)], keys);
        const el = { t: "a", i: id, k: tags, g: enc(poly[0], q) };
        if (poly.length > 1) el.h = poly.slice(1).map((r) => enc(r, q));
        if (building) el.q = 5;
        const s = JSON.stringify(el);
        for (const k of keys) put(k, s);
      }
    }
    n++;
  }
}
flush();
// The box the tiles cover (tile indexes): beyond it there is no OSM for the app.
fs.writeFileSync(path.join(outDir, "extent.json"), JSON.stringify(extent));
console.log(`${n} features → ${fs.readdirSync(outDir).length - 1} tiles in ${outDir}`);
