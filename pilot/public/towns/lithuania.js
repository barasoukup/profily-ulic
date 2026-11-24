// Lithuania (Bára 24. 11. 2026): the state of a cut inside staty.json's "lithuania". The national orthophoto of the
// NŽT is licensed for viewing on geoportal.lt only (evaluation/lithuania/ZDROJE.md 1): no orthophoto at all, the profile
// is the estimate from OSM, except in Vilnius:
// - Vilnius's topographic areas 1 : 500 (gis.vplanas.lt, Vilnius_basemap_LKS_su_rajonu layer 13 TEDR_PRLOTAI_P_500,
//   ArcGIS 10.81, CORS for the origin asking): every area with its surface (KODAS) and, for the paved ones, its purpose
//   (Paskirtis: kelias a roadway, pėsč pedestrian, dvir cycle, park parking, nuovaža a driveway, aikšt a square,
//   šalik/kelkr a shoulder…). No licence stated; Bára 24. 11. 2026 took it as she took Copenhagen's layers the same day,
//   credited "Vilniaus miesto savivaldybė / Vilniaus planas". As Tallinn's map: OSM's buildings before it, OSM's green
//   and water after, only where the map has the street under the cut's centre (hasStreet: within 3 m, a roadway under a
//   street for cars; the map leaves out many main roads, whose sidewalks alone would make the street a sidewalk); a map that does not answer: the
//   estimate, with a note. ?vilnius=0 leaves it out.
// The buildings: OSM's (the GRPK's PASK use code is undocumented and gives no floors nor year; NŽT's NTR has them but
// no geometry nor CORS; ZDROJE.md 3).
import { osmTiles, getJSON, asMtvu, asPassport } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { inArea } from "../places.js";
import { osmAreas } from "./slovensko.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_LT?.[k] ?? null : new URLSearchParams(location.search).get(k));
export const VILNIUS_MAP = "https://gis.vplanas.lt/arcgis/rest/services/Baziniai_zemelapiai/Vilnius_basemap_LKS_su_rajonu/MapServer/13";
// Vilnius's box (the map covers the city and the district around it; the cut's town decides beyond).
export const AREAS = { vilnius: { box: [25.02, 54.56, 25.49, 54.84] } };

// The area's code and purpose → MTVU codes (city.js MTVU_LABELS). The codes by the map's legend (22xx water, 23xx
// vegetation, 2413 a cemetery, 2421–2430 paved: asphalt, concrete, setts, blocks, tiles, gravel, wood, other, steps);
// 2403 is grass (seen over the city's orthophoto), the other 24xx below 2413 are not in the legend and look like
// gardens and unpaved yards: other green. Gravel without a purpose and 2410 (gravel ground) are left to OSM.
const PURPOSE = {
  kelias: 701, "pėsč": 702, aikšt: 702, dvir: 703, park: 704,
  "nuovaža": 1003, "šalik": 1003, kelkr: 1003, "pavirš": 1003, stat: 1003, kita: 1003, sport: 901,
};
export function vilniusCode(p) {
  const k = Number(p?.KODAS), purpose = String(p?.Paskirtis || "").trim();
  if (k >= 2421 && k <= 2430) {
    if (PURPOSE[purpose]) return PURPOSE[purpose];
    if (purpose) return 1003;
    // A paved area with no purpose: setts, blocks, tiles, concrete or other paving are walked on (the sidewalks of
    // Gedimino prospektas have none), asphalt is a yard or a lane, gravel is left to OSM.
    if (k === 2430 || (k >= 2422 && k <= 2428 && k !== 2426)) return 702;
    if (k === 2421) return 1003;
    return null;
  }
  if (k === 2403) return 401;
  if (k === 2413) return 402;
  if (k >= 2401 && k <= 2412 && k !== 2410) return 402;
  if (k >= 2301 && k <= 2305) return 200;
  if (k === 2307) return 300;
  if (k >= 2306 && k <= 2308) return 402;
  if (k === 2201 || k === 2202 || k === 2205) return 501;
  if (k >= 2203 && k <= 2206) return 502;
  return null;
}
export function vilniusFeatures(json) {
  const out = [];
  for (const f of json?.features || []) {
    const code = vilniusCode(f.properties), g = f.geometry;
    if (!code) continue;
    for (const p of g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []) out.push({ attributes: { code }, geometry: { rings: p } });
  }
  return { features: out };
}
export const vilniusUrl = (bbox, offset = 0) => `${VILNIUS_MAP}/query?${new URLSearchParams({ f: "geojson", geometry: bbox, geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326",
  spatialRel: "esriSpatialRelIntersects", outFields: "KODAS,Paskirtis", maxAllowableOffset: "0.000003", ...(offset && { resultOffset: String(offset), resultRecordCount: "1000" }) })}`;
// The service gives 1 000 areas an answer: the next pages, at most three in all (the centre has about 300 in 160 m).
async function vilnius(bbox) {
  const features = [];
  for (let page = 0; page < 3; page++) {
    const json = await getJSON(vilniusUrl(bbox, page * 1000));
    features.push(...(json?.features || []));
    if (!json?.exceededTransferLimit) break;
  }
  return vilniusFeatures({ features });
}
const memo = new Map();
function cached(bbox) {
  const key = bbox.split(",").map((v) => (+v).toFixed(4)).join(",");
  if (!memo.has(key)) {
    memo.set(key, vilnius(bbox).catch((err) => { memo.delete(key); throw err; }));
    if (memo.size > 30) memo.delete(memo.keys().next().value);
  }
  return memo.get(key);
}
const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
// The map has the street when an area of its kind lies under the cut's centre (within 3 m): a roadway under a street
// for cars, a roadway or a walked area under a footway, path or cycleway. (The A/B, 24. 11. 2026: under four streets for
// cars the map has only a paved yard or a walked area, and the street lost its roadway; the estimate is better there.)
const AROUND = [[0, 0], ...Array.from({ length: 12 }, (_, i) => [3 * Math.cos((i * Math.PI) / 6), 3 * Math.sin((i * Math.PI) / 6)])];
const WALKED = new Set(["footway", "path", "pedestrian", "cycleway", "steps", "bridleway", "corridor"]);
export function hasStreet(features, cx, cy, tags = null) {
  const my = 1 / 110574, mx = 1 / (111320 * Math.cos((cy * Math.PI) / 180));
  const kinds = !tags?.highway || WALKED.has(tags.highway) ? [701, 702, 703] : [701];
  return features.some((f) => kinds.includes(f.attributes.CTVUK_KOD) && AROUND.some(([ox, oy]) => inRings(f.geometry.rings, cx + ox * mx, cy + oy * my)));
}
async function surfaces(bbox, tags = null) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (param("vilnius") === "0" || !inArea(AREAS.vilnius, cx, cy)) return { features: [], abroad: true };
  let own;
  try {
    own = asMtvu([[await cached(bbox), (a) => a.code]], MTVU_LABELS);
  } catch {
    return { features: [], abroad: true, ltFailed: "vilnius" };
  }
  if (!hasStreet(own.features, cx, cy, tags)) return { features: [], abroad: true };
  const o = await osmAreas(bbox);
  return { features: [...o.buildings, ...asPassport(own).features, ...o.rest], ltTown: "vilnius", passport: true };
}

export const sources = {
  osm: (lat, lon, radius) => osmTiles(lat, lon, radius),
  surfaces,
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost: async () => ({}),
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;
