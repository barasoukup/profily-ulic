// Přerov: the city's technical map (DTM polohopis 2024, gis.prerov.eu) is public only as vector tiles
// (ArcGIS VectorTileServer, CORS) in S-JTSK: on a click the tiles of level 7 (135 m, 3 cm precision) around
// the cut are read (towns/mvt.js) and their polygons turned into WGS 84 (towns/sjtsk.js, EPSG 1623; within
// 0.5 m of OSM's buildings). The kind of a surface is the name of its layer (komunikace, chodníky, parkoviště,
// cyklostezky, zelené plochy, budovy…). Fences, walls and noise barriers from the same tiles; floors of the
// buildings from RÚIAN of ČÚZK.
//
// A town module (towns/<id>.js, listed in towns/index.js) gives sources.js the five data sources of a
// click (osm, surfaces, lines, parking, podlaznost; see towns/jihlava.js) and app.js its base maps.
import { osmTiles, asMtvu, ruianBuilding } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { decodeMvt } from "./mvt.js";
import { toWgs, fromWgs } from "./sjtsk.js";

const PR_TILES = "https://gis.prerov.eu/arcgis1/rest/services/DTM_polohopis_vector/VectorTileServer/tile";
// The tiling of the service (tileInfo): origin, level 7 and its resolution (m/px), 512 px tiles.
const OX = -543621.1630064357, OY = -1127556.0625435659, LOD = 7, SIZE = 512 * 0.26458386250105836;
const PR_CENTRE = [-534350, -1138260];

// The tiles are asked once per cut for the surfaces and again for the lines; the last few stay in memory.
const tiles = new Map();
const tile = (row, col) => {
  const key = `${row}/${col}`;
  if (!tiles.has(key)) {
    if (tiles.size > 16) tiles.delete(tiles.keys().next().value);
    tiles.set(key, fetch(`${PR_TILES}/${LOD}/${row}/${col}.pbf`, { signal: AbortSignal.timeout(20000) })
      .then((r) => (r.ok ? r.arrayBuffer() : r.status === 404 ? null : Promise.reject(new Error(`Přerov ${r.status}`))))
      .then((buf) => ({ row, col, layers: buf ? decodeMvt(new Uint8Array(buf)) : {} }))
      .catch((err) => { tiles.delete(key); throw err; }));
  }
  return tiles.get(key);
};
// The tiles an envelope "x0,y0,x1,y1" (WGS 84) touches.
async function tilesOf(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const corners = [[x0, y0], [x0, y1], [x1, y0], [x1, y1]].map(([lon, lat]) => fromWgs(lon, lat, PR_CENTRE));
  const cols = corners.map(([x]) => Math.floor((x - OX) / SIZE)), rows = corners.map(([, y]) => Math.floor((OY - y) / SIZE));
  const want = [];
  for (let r = Math.min(...rows); r <= Math.max(...rows); r++) for (let c = Math.min(...cols); c <= Math.max(...cols); c++) want.push(tile(r, c));
  return Promise.all(want);
}
// Features of the named layers as ArcGIS features in WGS 84 (polygons: rings, lines: paths).
function features(ts, names) {
  const out = [];
  for (const { row, col, layers } of ts) {
    const tx = OX + col * SIZE, ty = OY - row * SIZE;
    for (const name of names) {
      const layer = layers[name];
      if (!layer) continue;
      const k = SIZE / layer.extent;
      for (const f of layer.features) {
        const parts = f.rings.map((ring) => ring.map(([px, py]) => toWgs(tx + px * k, ty - py * k)));
        if (f.type === 3) out.push({ attributes: { layer: name }, geometry: { rings: parts } });
        else if (f.type === 2) out.push({ attributes: { layer: name }, geometry: { paths: parts } });
      }
    }
  }
  return { features: out };
}

// Layers → MTVU codes. Buildings first (derive.js takes the first surface a point lies in).
const PR_BUILDINGS = ["budovy", "kostely", "garáže", "lehké stavby", "skleníky", "trafostanice", "chatky", "altánky"];
const PR_CODES = {
  "komunikace": 701, "komunikace nezpevněné": 701, "mosty": 701,
  "chodníky:1": 702, "chodníky s dlažbou pro nevidomé": 702, "schodiště": 702, "čekárny MHD": 702,
  "cyklostezky": 703, "parkoviště": 704, "kontejnerová stání": 1003, "ostatní plochy": 1003, "dvory": 603,
  "zahrady": 300, "zelené plochy": 401, "záhony": 401, "skupinová zeleň": 401, "živé ploty": 401, "parky": 401,
  "hřiště:1": 901, "pískoviště": 901, "zdi": 602, "hradby": 602, "vodní nádrže": 502, "vodní plochy:1": 501,
  "železnice:2": 1100, "lesní půda": 200, "zemědělská půda": 100, "hřbitovy:2": 402,
};
async function surfaces(bbox) {
  const ts = await tilesOf(bbox);
  return asMtvu([
    [features(ts, PR_BUILDINGS), 601],
    [features(ts, Object.keys(PR_CODES)), (a) => PR_CODES[a.layer]],
  ], MTVU_LABELS);
}

// Fences and noise barriers (lines) and the outlines of walls → the codes of IPR's line layer (derive.js
// FENCE_LINES): they end the street.
async function lines(bbox) {
  const ts = await tilesOf(bbox);
  const out = [];
  for (const f of features(ts, ["ploty", "protihluková stěna", "zdi", "hradby"]).features) {
    const paths = f.geometry.paths || f.geometry.rings;
    out.push({ attributes: { CTMTP_KOD: f.attributes.layer === "ploty" ? 61210 : 71210 }, geometry: { paths } });
  }
  return { features: out };
}

const none = async () => ({ features: [] });
export const sources = { osm: (lat, lon, r) => osmTiles(lat, lon, r), surfaces, lines, parking: none, podlaznost: ruianBuilding };
export { RUIAN_HALL, RUIAN_LOW } from "../gis.js";
// No base maps of its own yet (the national ones show the city); the orthophoto of the evaluation is ČÚZK's.
// Where the city's map has nothing (outlying parts), sources.js asks the national DTM.
export const ortho = null;
