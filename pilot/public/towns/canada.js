// Canada (Bára 25. 11. 2026): the state of a cut inside staty.json's "canada", Toronto and the municipalities around it. Outside
// the City of Toronto the estimate from OSM (and nothing else). In Toronto (its boundary, mesta-ca.json, and 30 m beyond it
// for the streets along the line, Steeles Avenue: AREAS.toronto):
// - the city's topographic mapping (gis.toronto.ca cot_geospatial3/MapServer: 3 edge of road, 6 sidewalks, 13 parking lots,
//   2 building outlines, polygons read from aerial photos; CORS for the origin asking; Open Government Licence – Toronto) as
//   the surface map by the shared adapter (planimetrics.js): roads, highways, ramps, bridges and intersections 701,
//   laneways 1003 (the roadway of a cut across one), sidewalks 702, parking lots 1003 (a bay at the kerb 704), buildings
//   601. The map has no medians and no tram beds: a gap between two roadways is the median, or the bed of the streetcar
//   where OSM has its tracks; the cycle tracks built since the map (2021) come from OSM where they are ways of their own in
//   its carriageway (?off=roadtracks: not). ?toronto=0 leaves the map out (the estimate from OSM and the orthophoto).
// - the houses (podlaznost): the height of the building outline under the facade (DERIVED_HEIGHT; no request of its own) as
//   floors, which OSM's building:levels overrules, and a garage. ?torontohouse=0 leaves it out.
// A map that does not answer: the estimate, said so (sources.js mapFailed). Requests: four a cut (memo by the box) and the
// orthophoto's images.
import { osmTiles } from "../gis.js";
import { inArea } from "../places.js";
import { planimetricMap, gapsBetweenRoads, kerbBays, osmTracks, WALKED } from "./planimetrics.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_CA?.[k] ?? null : new URLSearchParams(location.search).get(k));
const off = (name) => (param("off") || "").split(",").includes(name);
export const AREAS = { toronto: { box: [-79.645, 43.575, -79.11, 43.86], town: "toronto", near: 30 } };
export const TORONTO_MAP = {
  id: "toronto", area: AREAS.toronto, on: () => param("toronto") !== "0", fields: "SUBTYPE_DESC",
  service: "https://gis.toronto.ca/arcgis/rest/services/cot_geospatial3/MapServer",
  layers: [
    { id: 2, fields: "SUBTYPE_DESC,DERIVED_HEIGHT", code: (a) => (/building|garage/i.test(a.SUBTYPE_DESC) ? [601, 0] : null) },
    { id: 6, code: () => [702, 1] },
    { id: 3, code: (a) => (/^lane/i.test(a.SUBTYPE_DESC) ? [1003, 4] : [701, 3]) },
    { id: 13, code: () => [1003, 5, true] },
  ],
  junction: { layer: 3, test: (a) => /intersection/i.test(a.SUBTYPE_DESC || "") },
  // ?off=mapgaps, kerbbays, roadtracks: without the rule (the A/B of 25. 11. 2026).
  // The shared fixes of the lost pairs (evaluation/canada/fixes, planimetrics.js): ?off=gapsortho, gapswide, trackaxis.
  prepare: (runs, { tags, tracks, cycleTracks, streets }) => {
    if (!off("mapgaps")) gapsBetweenRoads(runs, tracks(), { byImage: !off("gapsortho"), streets: off("gapswide") ? null : streets });
    if (!off("kerbbays")) kerbBays(runs);
    if (!WALKED.has(tags?.highway) && !off("roadtracks")) osmTracks(runs, cycleTracks(), 1.8, !off("trackaxis"));
  },
};
const map = planimetricMap(TORONTO_MAP);

// A house by its height (to the ridge, or the parapet of a flat roof): 2.2 m of roof and plinth over floors of 3.3 m, from 25 m
// on floors of 3.05 m (the review of 25. 11. 2026: the old 3 m made Markham Street's and Queen Street West's houses a floor too
// tall; the 22 judged houses of houses.json: exact 13, bias +0.14, before 11 and +0.45; 575 houses of OSM: 76 %, bias −0.17).
export const floorsOf = (h) => (h > 2 && h < 400 ? Math.max(1, Math.round((h - 2.2) / (h <= 25 ? 3.3 : 3.05))) : undefined);
export function torontoHouse(a) {
  if (!a) return {};
  if (/garage/i.test(a.SUBTYPE_DESC || "")) return { type: "garage", garage: true, caHouse: true };
  const n = floorsOf(Number(a.DERIVED_HEIGHT));
  return n ? { cornice: n, roof: 0, total: n, fromHeight: true, caHouse: true } : {};
}
async function podlaznost(lat, lon) {
  if (param("torontohouse") === "0" || !TORONTO_MAP.on() || !inArea(AREAS.toronto, lon, lat)) return {};
  return torontoHouse((await map.at(2, lat, lon))?.attributes);
}

const NO_LINES = { features: [], edges: [], widths: [], areas: [] };
export const sources = { osm: osmTiles, surfaces: map.surfaces, lines: async () => NO_LINES, parking: async () => ({ features: [] }), podlaznost };
// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;
// The overview map of the About dialog (tools/build_coverage.mjs): Toronto's topographic mapping.
export const SURFACE_MAPS = ["toronto"];
