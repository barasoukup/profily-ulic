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
// no geometry nor CORS; ZDROJE.md 3), and for the facades the outlines of the GRPK (Bára 24. 11. 2026: the cut ends at
// the facade): geoportal.lt NZT/GRPK layer 22 Pastatai, CORS for the origin asking, the dataset CC BY 4.0 (geoportal.lt
// Open data), credited "budovy GRPK © Lietuvos Respublikos aplinkos ministerija (CC BY 4.0)". Everywhere in
// Lithuania: under Vilnius's map before OSM's buildings (the nearer facade ends a side); for the estimate the houses OSM
// lacks join OSM's (grpkAsOsm). A failure leaves OSM's alone, silently. ?grpk=0 leaves it out. A/B of 88 cuts in Vilnius
// (evaluation/lithuania/ZPRAVA.md): 14 changed, better 5, worse 2, same 7; the universal measurement's composition the same.
import { osmTiles, getJSON, asMtvu, asPassport } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { inArea } from "../places.js";
import { osmAreas } from "./slovensko.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_LT?.[k] ?? null : new URLSearchParams(location.search).get(k));
// Both on by default (Bára 24. 11. 2026): Vilnius's map (?vilnius=0 leaves it out) and the GRPK's houses (?grpk=0).
export const vilniusOn = () => param("vilnius") !== "0";
export const grpkOn = () => param("grpk") !== "0";
export const VILNIUS_MAP = "https://gis.vplanas.lt/arcgis/rest/services/Baziniai_zemelapiai/Vilnius_basemap_LKS_su_rajonu/MapServer/13";
export const GRPK_BUILDINGS = "https://www.geoportal.lt/arcgis/rest/services/NZT/GRPK/MapServer/22";
// Vilnius's box (the map covers the city and the district around it; the cut's town decides beyond).
export const AREAS = { vilnius: { box: [25.02, 54.56, 25.49, 54.84] } };

// The area's code and purpose → MTVU codes (city.js MTVU_LABELS). The codes by the map's legend (22xx water, 23xx
// vegetation, 2413 a cemetery, 2421–2430 paved: asphalt, concrete, setts, blocks, tiles, gravel, wood, other, steps);
// 2403 is grass (seen over the city's orthophoto). The other 24xx are not in the legend: those that looked like gardens
// and green yards are other green; 2401 (also arable land), 2409 (also garages), 2410 (gravel ground) and 2414 are left
// to OSM (the review of 24. 11. 2026). The purpose is matched by its start, in any case (sport, sporto). A square
// (aikšt) is any paved place (a square, a playground, a car park): paved.
const PURPOSE = [[/^kelias/, 701], [/^pėsč/, 702], [/^dvir/, 703], [/^park/, 704], [/^sport/, 901]];
export function vilniusCode(p) {
  const k = Number(p?.KODAS), purpose = String(p?.Paskirtis || "").trim().toLowerCase();
  if (k >= 2421 && k <= 2430) {
    const hit = PURPOSE.find(([re]) => re.test(purpose));
    if (hit) return hit[1];
    if (purpose) return 1003;
    // A paved area with no purpose: setts, blocks, tiles, concrete or other paving are walked on (the sidewalks of
    // Gedimino prospektas have none), asphalt is a yard or a lane, gravel is left to OSM.
    if (k === 2430 || (k >= 2422 && k <= 2428 && k !== 2426)) return 702;
    if (k === 2421) return 1003;
    return null;
  }
  if (k === 2403) return 401;
  if (k === 2413) return 402;
  if ([2402, 2404, 2405, 2406, 2407, 2408, 2411, 2412].includes(k)) return 402;
  if (k >= 2301 && k <= 2305) return 200;
  if (k === 2307) return 300;
  if (k >= 2306 && k <= 2308) return 402;
  if (k === 2201 || k === 2202) return 501;
  if (k >= 2203 && k <= 2205) return 502;
  if (k === 2206) return 402; // a marsh
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
// Ordered by OBJECTID so that the pages neither repeat nor skip an area (the review).
export const vilniusUrl = (bbox, offset = 0) => `${VILNIUS_MAP}/query?${new URLSearchParams({ f: "geojson", geometry: bbox, geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326",
  spatialRel: "esriSpatialRelIntersects", outFields: "KODAS,Paskirtis", maxAllowableOffset: "0.000003", orderByFields: "OBJECTID", resultOffset: String(offset), resultRecordCount: "1000" })}`;
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
// The GRPK's buildings (GKODAS by the layer's legend: pa0 a building, pa23 a garage, pa6 a tower, pa58 a greenhouse;
// pa651/652 wind mills are left out). Esri JSON (the service gives no GeoJSON): the rings of a polygon, holes among them.
const GRPK_KINDS = new Set(["pa0", "pa23", "pa6", "pa58"]);
// No paging (the MapServer refuses orderByFields and resultOffset); a cut's box holds far fewer than its 1 000 houses.
export const grpkUrl = (bbox) => `${GRPK_BUILDINGS}/query?${new URLSearchParams({ f: "json", geometry: bbox, geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326",
  spatialRel: "esriSpatialRelIntersects", outFields: "GKODAS", returnGeometry: "true", maxAllowableOffset: "0.000003" })}`;
export function grpkFeatures(json) {
  return (json?.features || []).filter((f) => GRPK_KINDS.has(f.attributes?.GKODAS) && f.geometry?.rings?.length)
    .map((f) => ({ attributes: { CTVUK_KOD: 601, CTVUK_POPIS: MTVU_LABELS[601], ODHAD: 0 }, geometry: { rings: f.geometry.rings } }));
}
const grpk = async (bbox) => grpkFeatures(await getJSON(grpkUrl(bbox)));
const grpkMemo = new Map();
function grpkCached(bbox) {
  const key = bbox.split(",").map((v) => (+v).toFixed(4)).join(",");
  if (!grpkMemo.has(key)) {
    grpkMemo.set(key, grpk(bbox).catch((err) => { grpkMemo.delete(key); throw err; }));
    if (grpkMemo.size > 30) grpkMemo.delete(grpkMemo.keys().next().value);
  }
  return grpkMemo.get(key);
}
// The GRPK's houses of the cut, or none (switched off, or no answer: OSM's alone).
async function grpkHouses(bbox) {
  if (!grpkOn()) return [];
  try { return await grpkCached(bbox); } catch (err) { console.warn("GRPK", err); return []; }
}
// The estimate (ortho-osm.js, derive.js) reads the houses of OSM: the GRPK's that OSM lacks join them as OSM areas
// (building=yes, no floors), so that a side ends at its facade. A GRPK house is OSM's already when its centre lies in
// an OSM building or an OSM building's centre lies in it. Esri's outer rings run clockwise, holes the other way.
const signed = (r) => r.reduce((a, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return a + x * y2 - x2 * y; }, 0) / 2;
const centre = (r) => { let x = 0, y = 0; for (const p of r) { x += p[0]; y += p[1]; } return [x / r.length, y / r.length]; };
export function grpkAsOsm(houses, elements) {
  const osm = (elements || []).filter((el) => el.type === "area" && el.tags?.building && el.tags.building !== "no" && el.geometry?.length > 2)
    .map((el) => [el.geometry.map((p) => [p.lon, p.lat])]);
  const out = [];
  houses.forEach((h, k) => {
    const outers = h.geometry.rings.filter((r) => signed(r) < 0), holes = h.geometry.rings.filter((r) => signed(r) >= 0);
    for (const [i, r] of (outers.length ? outers : h.geometry.rings.slice(0, 1)).entries()) {
      const c = centre(r);
      if (osm.some((o) => inRings(o, c[0], c[1]) || inRings([r], ...centre(o[0])))) continue;
      out.push({ type: "area", id: -(k * 10 + i + 1), tags: { building: "yes", source: "GRPK" }, geometry: r.map(([lon, lat]) => ({ lat, lon })),
        holes: holes.filter((q) => inRings([r], q[0][0], q[0][1])).map((q) => q.map(([lon, lat]) => ({ lat, lon }))) });
    }
  });
  return out;
}
// The houses the last OSM request took from the GRPK (for the credit of the cut that follows).
let grpkAdded = 0;
async function osm(lat, lon, radius) {
  const [o, h] = await Promise.all([osmTiles(lat, lon, radius), !grpkOn() ? [] : (() => {
    const dy = radius / 110574, dx = radius / (111320 * Math.cos((lat * Math.PI) / 180));
    return grpkHouses([lon - dx, lat - dy, lon + dx, lat + dy].map((v) => v.toFixed(6)).join(","));
  })()]);
  const add = grpkAsOsm(h, o.elements);
  grpkAdded = add.length;
  return add.length ? { ...o, elements: [...o.elements, ...add] } : o;
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
  // Without the map the estimate: the GRPK's houses came with OSM's (osm above).
  const estimate = (extra = {}) => ({ features: [], abroad: true, ...extra, ...(grpkAdded && { ltGrpk: true }) });
  if (!vilniusOn() || !inArea(AREAS.vilnius, cx, cy)) return estimate();
  let own;
  try {
    own = asMtvu([[await cached(bbox), (a) => a.code]], MTVU_LABELS);
  } catch {
    return estimate({ ltFailed: "vilnius" });
  }
  if (!hasStreet(own.features, cx, cy, tags)) return estimate();
  // With the map: the GRPK's houses before OSM's, the nearer facade ends a side.
  const [o, h] = await Promise.all([osmAreas(bbox), grpkHouses(bbox)]);
  return { features: [...h, ...o.buildings, ...asPassport(own).features, ...o.rest], ltTown: "vilnius", passport: true, ...(h.length && { ltGrpk: true }) };
}

export const sources = {
  osm,
  surfaces,
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost: async () => ({}),
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: Vilnius's topographic areas.
export const SURFACE_MAPS = ["vilnius"];
