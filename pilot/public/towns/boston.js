// Boston (Bára 26. 11. 2026): the surface maps of the City of Boston and of Cambridge for the shared adapter
// (planimetrics.js), read from small static tiles of the site (tools/build_planimetrics_us.mjs, data/us-plan/<city>/,
// built once per deploy, never a request to the cities on a click: their roadways are a few polygons of the whole city
// each, megabytes for any box). Elsewhere in the metro (Somerville, Brookline, Newton …) the estimate from the
// orthophoto and OSM. towns/usa.js asks the map whose area holds the cut.
// - Boston (its boundary, mesta-us.json "boston", and 30 m beyond it; AREAS.boston; Open Data Commons PDDL 1.0, City of
//   Boston): Street Edges of the City of Boston Basemap (basemap_IPS 15: RD-PAVED and RD-UNPAVED the roadway 701,
//   RD-TRAF-ISLAND a traffic island or median 9950, RD-ALLEY an alley 1003, the runway left out), the Sidewalk Inventory
//   (OpenData 0) 702, the buildings of the basemap (basemap_IPS 16) 601. ?boston=0 leaves it out.
// - Cambridge (mesta-us.json "cambridge", 30 m beyond it; City of Cambridge GIS, PDDL 1.0): Roads (RD-PAVED, RD-BRIDGE,
//   RD-UNPAVED 701, RD-TRAF-ISLAND 9950, RD-ALLEY 1003), Sidewalks (702; TREE-WELL green 401), Driveways 1003, Parking
//   Lots 1003 (a bay at the kerb 704), Buildings 601. ?cambridge=0 leaves it out.
// Both maps as Toronto's: an island with no roadway on both sides is land beside the street (islandsBeside); a gap between
// two roadways is the median, with OSM's tram tracks in it the tram bed (?off=mapgaps); a cycle track OSM has in the map's
// carriageway is cut out of it (?off=roadtracks; the maps are older than many of Boston's separated bike lanes); the
// alleys of the maps join OSM's elements as alley areas (?off=ulicky). A gap beyond the outer sidewalk told by OSM's houses and
// lots and the orthophoto (outerGaps) only with ?outergaps=1.
// - The houses (podlaznost): Boston's buildings count their floors (part_floors), which stand for the house's floors
//   (?bostonhouse=0: not).
// A tile that does not come: the estimate, said so (mapFailed).
import { inArea } from "../places.js";
import { planimetricMap, gapsBetweenRoads, kerbBays, osmTracks, islandsBeside, outerGaps, WALKED } from "./planimetrics.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_US?.[k] ?? null : new URLSearchParams(location.search).get(k));
const off = (name) => (param("off") || "").split(",").includes(name);
export const AREAS = {
  boston: { box: [-71.192, 42.227, -70.748, 42.401], town: "boston", near: 30 },
  cambridge: { box: [-71.161, 42.352, -71.063, 42.405], town: "cambridge", near: 30 },
};

// The static tiles (tools/build_planimetrics_us.mjs TILE, CITIES: the fields of each layer in the tile's order).
export const PLAN_TILE = 0.005;
export const PLAN_FIELDS = {
  boston: { b: ["part_floors"], s: [], r: ["type"] },
  cambridge: { b: ["TYPE"], s: ["TYPE"], r: ["TYPE"], d: [], p: [] },
};
// A tile's layer as esri JSON features (rings in degrees).
export function decodePlanTile(json, ix, iy, fields) {
  const x0 = ix * PLAN_TILE, y0 = iy * PLAN_TILE;
  return (json || []).map((row) => {
    const attributes = Object.fromEntries(fields.map((f, k) => [f, row[k]]));
    const rings = row.slice(fields.length).map((c) => { const r = []; for (let i = 0; i + 1 < c.length; i += 2) r.push([x0 + c[i] / 1e7, y0 + c[i + 1] / 1e7]); return r; });
    return { attributes, geometry: { rings } };
  });
}
const tiles = new Map();
function tile(city, ix, iy) {
  const k = `${city}/${ix}_${iy}`;
  if (!tiles.has(k)) {
    if (tiles.size >= 24) tiles.delete(tiles.keys().next().value);
    const p = fetch(`data/us-plan/${k}.json`).then((r) => (r.ok ? r.json() : r.status === 404 ? {} : Promise.reject(new Error(`us-plan ${k} ${r.status}`))));
    p.catch(() => { if (tiles.get(k) === p) tiles.delete(k); });
    tiles.set(k, p);
  }
  return tiles.get(k);
}
// The features of a layer in a box "x0,y0,x1,y1" (the pieces of every tile it touches; a polygon cut by tiles is in pieces,
// which a test of a point does not see).
export const planAsk = (city) => async (layer, bbox) => {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number), out = [];
  const keys = [];
  for (let ix = Math.floor(x0 / PLAN_TILE); ix <= Math.floor(x1 / PLAN_TILE); ix++)
    for (let iy = Math.floor(y0 / PLAN_TILE); iy <= Math.floor(y1 / PLAN_TILE); iy++) keys.push([ix, iy]);
  const got = await Promise.all(keys.map(([ix, iy]) => tile(city, ix, iy)));
  got.forEach((t, k) => out.push(...decodePlanTile(t[layer], ...keys[k], PLAN_FIELDS[city][layer])));
  return { features: out };
};

const roadCode = (t) => {
  t = String(t || "");
  if (/TRAF-ISLAND/.test(t)) return [9950, 3];
  if (/ALLEY/.test(t)) return [1003, 5];
  if (/PAVED|UNPAVED|BRIDGE/.test(t)) return [701, 4];
  return null;
};
const prepare = (runs, { tags, tracks, cycleTracks, osmAreas }) => {
  islandsBeside(runs);
  if (!off("mapgaps")) gapsBetweenRoads(runs, tracks());
  kerbBays(runs);
  // (Off, ?outergaps=1 on: the gaps beyond the outer sidewalk by OSM and the orthophoto, planimetrics.js outerGaps; the blind
  // A/B of 52 new arterials did not show it better, 18 : 16, evaluation/usa/boston/outer/ZPRAVA.md.)
  if (param("outergaps") === "1") outerGaps(runs, osmAreas());
  if (!WALKED.has(tags?.highway) && !off("roadtracks")) osmTracks(runs, cycleTracks());
};
export const BOSTON_MAP = {
  id: "boston", area: AREAS.boston, on: () => param("boston") !== "0", ask: planAsk("boston"),
  layers: [
    { id: "b", code: () => [601, 0] },
    { id: "s", code: () => [702, 2] },
    { id: "r", code: (a) => roadCode(a.type) },
  ],
  alleys: { layer: "r", test: (a) => /ALLEY/.test(a.type || ""), source: "Boston Street Edges", off: () => off("ulicky") },
  prepare,
};
export const CAMBRIDGE_MAP = {
  id: "cambridge", area: AREAS.cambridge, on: () => param("cambridge") !== "0", ask: planAsk("cambridge"),
  layers: [
    { id: "b", code: () => [601, 0] },
    { id: "s", code: (a) => (/TREE/.test(a.TYPE || "") ? [401, 1] : [702, 2]) },
    { id: "r", code: (a) => roadCode(a.TYPE) },
    { id: "d", code: () => [1003, 5] },
    { id: "p", code: () => [1003, 6, true] },
  ],
  alleys: { layer: "r", test: (a) => /ALLEY/.test(a.TYPE || ""), source: "Cambridge Roads", off: () => off("ulicky") },
  prepare,
};
export const bostonMap = planimetricMap(BOSTON_MAP);
export const cambridgeMap = planimetricMap(CAMBRIDGE_MAP);
export const BOSTON_MAPS = [bostonMap, cambridgeMap];

// A house of Boston's basemap by its counted floors (part_floors "4", "5.0"; a count no house has is a slip).
export function bostonHouse(a) {
  const n = Math.round(Number(a?.part_floors));
  return n >= 1 && n <= 60 ? { cornice: n, roof: 0, total: n, usHouse: "boston" } : {};
}
export async function bostonPodlaznost(lat, lon) {
  if (param("bostonhouse") === "0" || !BOSTON_MAP.on() || !inArea(AREAS.boston, lon, lat)) return {};
  return bostonHouse((await bostonMap.at("b", lat, lon))?.attributes);
}
