// Estonia (Bára 23. 11. 2026): the state of a cut inside staty.json's "estonia". The profile is the estimate from OSM
// and the Land and Spatial Development Board's orthophoto (lanes-ortho.js "ee"), except in Tallinn:
// - Tallinn's surface map (the city's base map, gis.tallinn.ee tar_maakate, ArcGIS 11.5, CORS echo): roadways, sidewalks
//   and paths, drivable yards and car parks, shoulders, other paved areas, lawns, flower beds, yards (one request a layer;
//   evaluation/estonia/ZDROJE.md). No licence stated; Bára 23. 11. 2026: a city's work used for nothing bad, with its
//   credit. As Zaragoza's: OSM's buildings before it, OSM's green and water after, only where the map has a roadway or a
//   sidewalk near the cut's centre; a map that does not answer: the estimate, with a note. ?tallinn=0 leaves it out.
// The buildings of the topographic
// database ETAK (WFS, CORS *, the Board's open-data licence): the height of the house at the facade, so its floors
// (about 3 m a floor), and the kind (a dwelling or public building / an ancillary or industrial one). ?etak=0 leaves
// them out.
import { osmTiles, getJSON, asMtvu, asPassport } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { inArea } from "../places.js";
import { osmAreas } from "./slovensko.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_EE?.[k] ?? null : new URLSearchParams(location.search).get(k));
export const TALLINN_MAP = "https://gis.tallinn.ee/arcgis/rest/services/tar_maakate/MapServer";
export const AREAS = { tallinn: { box: [24.55, 59.35, 24.97, 59.51] } };
// The map's layers → MTVU codes (city.js MTVU_LABELS): big roads (roadways), small roads (sidewalks, paths), a drivable
// place (yards, car parks), a shoulder and another place (paved), a lawn and a flower bed, a yard.
export const TALLINN_LAYERS = { 36: 701, 35: 702, 47: 704, 46: 1003, 45: 1003, 39: 401, 34: 401, 38: 603 };
export function tallinnFeatures(layers) {
  const out = [];
  for (const [code, json] of layers) for (const f of json?.features || []) {
    const g = f.geometry;
    for (const p of g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []) out.push({ attributes: { code }, geometry: { rings: p } });
  }
  return { features: out };
}
async function tallinn(bbox) {
  const layers = await Promise.all(Object.entries(TALLINN_LAYERS).map(async ([id, code]) => [code, await getJSON(`${TALLINN_MAP}/${id}/query?${new URLSearchParams({ f: "geojson", geometry: bbox,
    geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326", spatialRel: "esriSpatialRelIntersects", outFields: "kate", maxAllowableOffset: "0.000003" })}`)]));
  return tallinnFeatures(layers);
}
const memo = new Map();
function cached(bbox) {
  const key = bbox.split(",").map((v) => (+v).toFixed(4)).join(",");
  if (!memo.has(key)) {
    memo.set(key, tallinn(bbox).catch((err) => { memo.delete(key); throw err; }));
    if (memo.size > 30) memo.delete(memo.keys().next().value);
  }
  return memo.get(key);
}
const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
// A roadway or sidewalk of the map within 15 m of the cut's centre (the map has this street).
const ring = (r) => Array.from({ length: 12 }, (_, i) => [r * Math.cos((i * Math.PI) / 6), r * Math.sin((i * Math.PI) / 6)]);
const AROUND = [[0, 0], ...[3, 8, 15].flatMap(ring)];
async function surfaces(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (param("tallinn") === "0" || !inArea(AREAS.tallinn, cx, cy)) return { features: [], abroad: true };
  let own;
  try {
    own = asMtvu([[await cached(bbox), (a) => a.code]], MTVU_LABELS);
  } catch {
    return { features: [], abroad: true, eeFailed: "tallinn" };
  }
  const my = 1 / 110574, mx = 1 / (111320 * Math.cos((cy * Math.PI) / 180));
  const at = own.features.some((f) => [701, 702].includes(f.attributes.CTVUK_KOD) && AROUND.some(([ox, oy]) => inRings(f.geometry.rings, cx + ox * mx, cy + oy * my)));
  if (!at) return { features: [], abroad: true };
  const o = await osmAreas(bbox);
  return { features: [...o.buildings, ...asPassport(own).features, ...o.rest], eeTown: "tallinn", passport: true };
}

export const ETAK_WFS = "https://gsavalik.envir.ee/geoserver/etak/ows";

export function etakBuilding(p) {
  const h = Number(p?.korgus_m);
  const floors = h > 2 ? Math.max(1, Math.round(h / 3)) : undefined;
  const industrial = /tootmis|abi/i.test(String(p?.tyyp_tekst || "")) && !/elu/i.test(String(p?.tyyp_tekst || ""));
  return { type: industrial ? "industrial" : undefined, ...(floors && { cornice: floors, total: floors, roof: 0, height: h }) };
}
async function podlaznost(lat, lon) {
  if (param("etak") === "0") return {};
  const d = 0.00001; // about a metre around the facade's point
  const json = await getJSON(`${ETAK_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "etak:e_401_hoone_ka",
    outputFormat: "application/json", srsName: "EPSG:4326", count: "5", BBOX: `${lat - d},${lon - d},${lat + d},${lon + d},urn:ogc:def:crs:EPSG::4326` })}`);
  const f = (json?.features || []).sort((a, b) => (b.properties?.korgus_m || 0) - (a.properties?.korgus_m || 0))[0];
  return f ? etakBuilding(f.properties) : {};
}

export const sources = {
  osm: (lat, lon, radius) => osmTiles(lat, lon, radius),
  surfaces,
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost,
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: Tallinn's.
export const SURFACE_MAPS = ["tallinn"];
