// Spain (Bára 23. 11. 2026): the state of a cut inside staty.json's "spain" (with the islands, Ceuta, Melilla and
// Llívia). No Czech technical map, RÚIAN or ČÚZK orthophoto is asked: the profile is the estimate from OSM and IGN's
// PNOA orthophoto (lanes-ortho.js "es"), except where a city publishes its street surfaces (evaluation/spain/ZDROJE.md):
// - Zaragoza: the sidewalks, medians and green strips of the city's paving map of 2017 (IDEZar GeoServer WFS, GeoJSON,
//   CORS *, no fees nor constraints in its capabilities). It has no roadway as a surface: the roadway is what lies
//   between them along OSM's roads (a band about each road axis, after the city's surfaces and OSM's buildings, so they
//   win; marked as an estimate). ?zaragoza=0 leaves it out (the A/B test, evaluation/spain/ab/).
// - Buildings everywhere but the Basque Country and Navarre: the Catastro's INSPIRE WFS (ovc.catastro.meh.es, GML
//   only, CORS *): the floors of the building's part at the facade, the year, the use and the dwellings (?catastro=0
//   leaves them out). Not asked inside the two (regions-es.json); there the foral cadastre of the province
//   (towns/spain-foral.js: Navarre, Álava, Bizkaia, Gipuzkoa; ?foral=0 leaves them out).
// As Kraków's base map: the city's surfaces with OSM's buildings before them and OSM's green and water after, only
// where the city has a sidewalk near the cut's centre; a city that does not answer: the estimate, with a note.
import { osmTiles, getJSON, asMtvu, asPassport } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { inArea } from "../places.js";
import { osmAreas } from "./slovensko.js";
import { foralEnabled, foralFetch } from "./spain-foral.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_ES?.[k] ?? null : new URLSearchParams(location.search).get(k));

export const ZARAGOZA_WFS = "https://idezar-sig.zaragoza.es/servicios/geoserver/wfs";
export const AREAS = { zaragoza: { box: [-1.02, 41.58, -0.78, 41.73] } };
// The paving map's layers → MTVU codes (city.js MTVU_LABELS): a sidewalk, a median (paved, between two roadways), a
// green strip.
export const ZARAGOZA_LAYERS = { "idezar_base:Aceras_PavimentoTF_2017": 702, "idezar_base:Medianas_PavimentoTF_201702": 1003, "idezar_base:PBandVerde_PavimentoTF_20170": 401 };

const ringsOf = (g) => (g?.type === "Polygon" ? g.coordinates : g?.type === "MultiPolygon" ? g.coordinates.flat() : null);
// A MultiPolygon is split into its polygons (one feature each: the rings of one polygon are its outline and holes).
export function zaragozaFeatures(layers) {
  const out = [];
  for (const [code, json] of layers) {
    for (const f of json?.features || []) {
      const g = f.geometry;
      const polys = g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : [];
      for (const p of polys) out.push({ attributes: { code }, geometry: { rings: p } });
    }
  }
  return { features: out };
}
async function zaragoza(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const layers = await Promise.all(Object.entries(ZARAGOZA_LAYERS).map(async ([name, code]) => [code, await getJSON(`${ZARAGOZA_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature",
    typeNames: name, outputFormat: "application/json", srsName: "EPSG:4326", count: "500", BBOX: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326` })}`)]));
  return zaragozaFeatures(layers);
}
export const ES_TOWNS = { zaragoza };
const townAt = (lon, lat) => Object.keys(ES_TOWNS).find((id) => param(id) !== "0" && inArea(AREAS[id], lon, lat)) ?? null;

// The roadway a city without one as a surface leaves between its sidewalks: a band about each OSM road axis, as
// quadrilaterals (one feature a segment, so overlapping bands do not cancel), half as wide as ROAD_HALF of its kind.
const ROAD_HALF = { motorway: 15, trunk: 15, primary: 15, secondary: 12, tertiary: 10 };
const ROADS = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|busway)(_link)?$/;
export function roadBands(elements, lat) {
  const mx = 1 / (111320 * Math.cos((lat * Math.PI) / 180)), my = 1 / 110574, out = [];
  for (const el of elements || []) {
    const t = el.tags || {};
    // Not a road below ground nor through a building (a passage: the review of 23. 11. 2026).
    if (el.type !== "way" || !el.geometry || !ROADS.test(t.highway || "") || Number(t.layer) < 0 || t.tunnel === "yes" || t.tunnel === "building_passage") continue;
    const h = ROAD_HALF[String(t.highway).replace("_link", "")] ?? 7;
    for (let i = 1; i < el.geometry.length; i++) {
      const a = el.geometry[i - 1], b = el.geometry[i];
      const dx = (b.lon - a.lon) / mx, dy = (b.lat - a.lat) / my, len = Math.hypot(dx, dy);
      if (!len) continue;
      const nx = (-dy / len) * h * mx, ny = (dx / len) * h * my, ex = (dx / len) * 1 * mx, ey = (dy / len) * 1 * my;
      out.push({ attributes: { CTVUK_KOD: 701, CTVUK_POPIS: MTVU_LABELS[701], ODHAD: 1 }, geometry: { rings: [[
        [a.lon - ex + nx, a.lat - ey + ny], [b.lon + ex + nx, b.lat + ey + ny], [b.lon + ex - nx, b.lat + ey - ny], [a.lon - ex - nx, a.lat - ey - ny], [a.lon - ex + nx, a.lat - ey + ny]]] } });
    }
  }
  return out;
}

// One request a box (a cut moved a little asks the same box again: the box rounded to about 10 m), at most 30 kept.
const memo = new Map();
function cached(id, bbox) {
  const key = `${id} ${bbox.split(",").map((v) => (+v).toFixed(4)).join(",")}`;
  if (!memo.has(key)) {
    memo.set(key, ES_TOWNS[id](bbox).catch((err) => { memo.delete(key); throw err; }));
    if (memo.size > 30) memo.delete(memo.keys().next().value);
  }
  return memo.get(key);
}

const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
// A sidewalk of the city within NEAR m of the cut's centre (the city maps this street).
const NEAR = 25;
const ring = (r) => Array.from({ length: 12 }, (_, i) => [r * Math.cos((i * Math.PI) / 6), r * Math.sin((i * Math.PI) / 6)]);
const AROUND = [[0, 0], ...[3, 8, 15, NEAR].flatMap(ring)];

async function surfaces(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const id = townAt(cx, cy);
  if (!id) return { features: [], abroad: true };
  let own;
  try {
    own = asMtvu([[await cached(id, bbox), (a) => a.code]], MTVU_LABELS);
  } catch {
    return { features: [], abroad: true, esFailed: id };
  }
  const my = 1 / 110574, mx = 1 / (111320 * Math.cos((cy * Math.PI) / 180));
  const at = own.features.some((f) => f.attributes.CTVUK_KOD === 702 && AROUND.some(([ox, oy]) => inRings(f.geometry.rings, cx + ox * mx, cy + oy * my)));
  if (!at) return { features: [], abroad: true };
  const r = Math.max((x1 - x0) / mx, (y1 - y0) / my) / 2;
  const [o, osm] = await Promise.all([osmAreas(bbox), osmTiles(cy, cx, r)]);
  return { features: [...o.buildings, ...asPassport(own).features, ...o.rest, ...roadBands(osm.elements, cy)], esTown: id, passport: true };
}

// ---------- Catastro (buildings) ----------
export const CATASTRO_WFS = "https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx";
// A time limit (the review of 23. 11. 2026: app.js waits for the houses; a hanging Catastro held them as long as the
// browser let it), the same as gis.js getJSON.
const CATASTRO_TIMEOUT = 25000;
export const catastroUrl = (type, lat, lon, d) => `${CATASTRO_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typenames: type, srsname: "EPSG::4326",
  bbox: `${lat - d},${lon - d},${lat + d},${lon + d}` })}`;
const catastro = (type, lat, lon, d) => fetch(catastroUrl(type, lat, lon, d), { signal: AbortSignal.timeout(CATASTRO_TIMEOUT) })
  .then((r) => { if (!r.ok) throw new Error(`Catastro ${r.status}`); return r.text(); });
// The GML's members: their id, rings (posList lat lon) and the values the app uses.
const members = (gml) => String(gml || "").split(/<gml:featureMember>/).slice(1);
const value = (m, tag) => m.match(new RegExp(`<[^>]*:${tag}>([^<]*)<`))?.[1] ?? null;
const ringsGml = (m) => [...m.matchAll(/<gml:posList[^>]*>([^<]*)<\/gml:posList>/g)].map((x) => {
  const v = x[1].trim().split(/\s+/).map(Number), r = [];
  for (let i = 0; i + 1 < v.length; i += 2) r.push([v[i + 1], v[i]]);
  return r;
});
// A building (BU:Building) and its parts (BU:BuildingPart) → the facts of app.js ruianFacts and an OSM building type for
// profile.js (as BD TOPO in France). The floors of the part the facade's point lies in, else the most of the parts (the
// building's own count is empty in the Catastro; a courtyard's part is lower).
const USE = { "1_residential": "living", "4_1_office": "office", "4_2_retail": "office", "4_3_publicServices": "public", "3_industrial": "industrial", "2_agriculture": "industrial" };
export function catastroBuilding(buildingGml, partsGml, lat, lon) {
  // The building the point lies in, else the first of the window (a party wall: the neighbour's year and use otherwise).
  const all = members(buildingGml);
  const b = all.find((m) => { const r = ringsGml(m); return r.length && inRings(r, lon, lat); }) || all[0];
  const parts = members(partsGml).map((m) => ({ floors: Number(value(m, "numberOfFloorsAboveGround")), rings: ringsGml(m) })).filter((p) => p.floors > 0);
  const here = parts.filter((p) => p.rings.length && inRings(p.rings, lon, lat));
  const floors = Math.max(0, ...(here.length ? here : parts).map((p) => p.floors)) || undefined;
  if (!b && !floors) return {};
  const year = parseInt(String(b ? value(b, "beginning") : "").slice(0, 4), 10);
  const built = year > 1005 && year <= new Date().getFullYear() + 2 ? year : undefined;
  const use = USE[b ? value(b, "currentUse") : ""];
  const dwellings = Number(b ? value(b, "numberOfDwellings") : NaN);
  const living = use === "living";
  const office = use === "office" ? true : undefined;
  const type = use === "industrial" ? "industrial" : living ? (dwellings > 1 ? "apartments" : dwellings === 1 ? "house" : undefined) : office ? "office" : undefined;
  // catastro: the credit only for a cut with a house of the Catastro (credits.js esCatastro; Bára 27. 11. 2026).
  return { built, office, house: (living && dwellings === 1) || undefined, type, ...(floors && { cornice: floors, total: floors, roof: 0 }), catastro: true };
}
// The Basque Country and Navarre (regions-es.json, tools/build_regions_es.mjs: the provinces ar, gi, bi and nc; Bára
// 23. 11. 2026): their own foral cadastres, the Catastro answers nothing there. foralAt: the province of a point that
// lies, with the points about 500 m around it, inside the four (the boundaries are of 1 : 1 000 000; near their outer
// edge, and when the file did not load, the Catastro is asked as before). Treviño (Burgos) and Villaverde (Cantabria)
// are holes. provinceAt: the province the point itself lies in.
let foral = null;
const regions = (json) => {
  foral ??= json ? Promise.resolve(json) : (async () => {
    const url = new URL("../regions-es.json", import.meta.url);
    if (url.protocol === "file:") return JSON.parse((await import("node:fs")).readFileSync(url, "utf8"));
    const r = await fetch(url);
    if (!r.ok) throw new Error(`regions-es.json ${r.status}`);
    return r.json();
  })();
  return foral.catch(() => { foral = null; return {}; });
};
export async function provinceAt(lon, lat, json = null) {
  const all = await regions(json);
  return Object.keys(all).find((code) => inRings(all[code], lon, lat)) ?? null;
}
export async function foralAt(lon, lat, json = null) {
  const all = await regions(json), d = 0.005, codes = Object.keys(all);
  const near = [[d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, -d], [d, -d], [-d, d]];
  const here = codes.find((code) => inRings(all[code], lon, lat));
  return here && near.every(([dx, dy]) => codes.some((code) => inRings(all[code], lon + dx * 1.4, lat + dy))) ? here : null;
}
// One answer a point (rounded to about a metre: a cut moved a little asks the same facade again), at most 30 kept.
// In the four provinces the cadastre of the province (towns/spain-foral.js; ?foral=0 none, ?foral=nc,gi some); near
// their outer edge, where it has no building, the Catastro after it.
const houses = new Map();
const once = (key, ask) => {
  if (!houses.has(key)) {
    houses.set(key, ask().catch((err) => { houses.delete(key); throw err; }));
    if (houses.size > 30) houses.delete(houses.keys().next().value);
  }
  return houses.get(key);
};
async function podlaznost(lat, lon) {
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`, d = 0.000005; // about half a metre around the facade's point
  const deep = await foralAt(lon, lat), prov = deep ?? (await provinceAt(lon, lat));
  if (prov && foralEnabled(prov, param("foral"))) {
    const p = await once(`${prov} ${key}`, () => foralFetch(prov, lat, lon, d)).catch((err) => { if (deep) throw err; return {}; });
    if (deep || p.total || p.built) return p;
  }
  if (deep || param("catastro") === "0") return {};
  return once(key, () => Promise.all([catastro("BU:Building", lat, lon, d), catastro("BU:BuildingPart", lat, lon, d)]).then(([b, p]) => catastroBuilding(b, p, lat, lon)));
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
// answers: the towns' paving maps (their AREAS).
export const SURFACE_MAPS = Object.keys(ES_TOWNS);
