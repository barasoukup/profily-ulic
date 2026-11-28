// New York City (Bára 26. 11. 2026, the USA's second metro; evaluation/usa/nyc/): the city's five boroughs (towns-us.json
// "newyork", tools/build_towns_us.mjs) and 30 m beyond their line. Its sources, read through towns/usa.js:
// - the NYC Planimetric Database 2022 (NYC Office of Technology and Innovation, flown in 2022 at 0.5 ft; capture rules in
//   github.com/CityOfNewYork/nyc-planimetrics Capture_Rules.md) as the surface map by the shared adapter (planimetrics.js),
//   from the city's own ArcGIS Online organisation NYCmaps (services6.arcgis.com/yG5s3afENB5iO9fj, owner "maps.nyc.data";
//   CORS *; the same layers are on NYC Open Data, whose datasets are free of restrictions on their use by the city's law,
//   Administrative Code § 23-502, the source to be named):
//     Building (FEATURE_CODE 2100 building, 1000 parking structure, 1006 cantilevered, 5100 under construction, 5110 garage)
//       → 601; canopies, tanks, sheds, trailers, skybridges, placeholders left out;
//     Sidewalk (380000 in the street, 380010 inside a block), Plaza (public plazas) → 702;
//     Median (curb, grass, rail, fence, barrier, other, traffic island) → 9950, a painted median (360010) is roadway: the
//       roadbed runs under it (left out, the roadbed shows);
//     Roadbed (350000 roadbed, 350010 intersection, 350020 shoulder) → 701, a driveway (350030) → 1003;
//     Parking Lot (over 2,000 sq ft, separated from the roadway by a kerb) → 1003, a strip at the kerb no wider than a stall
//       kerb parking 704 (kerbBays, as Toronto);
//     a gap between the polygons (the tree strip, a front yard, a lawn) → 401 green.
//   Rules as the other maps: a median with no roadway on both sides is land (islandsBeside, as DC); a cycle track OSM has as
//   a way of its own in the roadbed is cut out of it (osmTracks, as Toronto: the map of 2022 draws the protected lanes'
//   kerbs of planters and parking as roadway; ?off=roadtracks). ?nyc=0 leaves the map out (the estimate from OSM and the
//   orthophoto). Roadbed, Sidewalk and Median must answer (else the estimate, mapFailed "nyc"); Plaza and Parking Lot may
//   not (the map without them, a note in the console).
// - the houses (podlaznost): the building footprint under the facade (the request the cut has made already): its roof height
//   (HEIGHT_ROOF, ft) as floors as Toronto's, its year (CONSTRUCTION_YEAR) and a garage. ?nychouse=0 leaves it out.
// - the orthophoto of the State of New York (NYS ITS Geospatial Services, 2024, 0.5 ft; lanes-ortho.js US_ORTHO "us-nyc").
import { inArea } from "../places.js";
import { planimetricMap, islandsBeside, kerbBays, osmTracks, WALKED } from "./planimetrics.js";
import { heightHouse } from "../floors.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_US?.[k] ?? null : new URLSearchParams(location.search).get(k));
const off = (name) => (param("off") || "").split(",").includes(name);
export const nycOn = () => param("nyc") !== "0";
// The five boroughs by their line (the box only a first test), 30 m beyond it (the Bronx's line along the streets of Yonkers
// and Mount Vernon, Queens's along Nassau's).
export const AREA = { box: [-74.27, 40.47, -73.68, 40.93], town: "newyork", near: 30 };
export const NYC_SERVICE = "https://services6.arcgis.com/yG5s3afENB5iO9fj/arcgis/rest/services";
const BUILDING = "BUILDING_view/FeatureServer/0", ROADBED = "Roadbed_2022/FeatureServer/20";
const HOUSE = new Set([1000, 1006, 2100, 5100, 5110]);
// A kind of the planimetrics as [MTVU code, priority (lower first), true for a parking area], or null (left out).
export const nycCode = {
  building: (a) => (HOUSE.has(Number(a.FEATURE_CODE)) ? [601, 0] : null),
  sidewalk: () => [702, 1],
  median: (a) => (Number(a.SUB_FEATURE_CODE) === 360010 ? null : [9950, 2]),
  roadbed: (a) => (Number(a.SUB_FEATURE_CODE) === 350030 ? [1003, 4] : [701, 3]),
  lot: () => [1003, 5, true],
};
export const NYC_MAP = {
  id: "nyc", area: AREA, on: nycOn, service: NYC_SERVICE, fields: "SUB_FEATURE_CODE",
  layers: [
    { id: BUILDING, fields: "FEATURE_CODE,HEIGHT_ROOF,CONSTRUCTION_YEAR", code: nycCode.building },
    { id: "Sidewalk_2022/FeatureServer/22", code: nycCode.sidewalk },
    // (Plaza and Parking Lot are optional: one that does not answer leaves the map without it, planimetrics.js optionalAnswer.)
    { id: "Plaza_2022/FeatureServer/16", code: nycCode.sidewalk, optional: true },
    { id: "Median_2022/FeatureServer/9", code: nycCode.median },
    { id: ROADBED, code: nycCode.roadbed },
    { id: "Parking_Lot_2022/FeatureServer/13", code: nycCode.lot, optional: true },
  ],
  junction: { layer: ROADBED, test: (a) => Number(a.SUB_FEATURE_CODE) === 350010 },
  prepare: (runs, { tags, cycleTracks }) => {
    islandsBeside(runs);
    if (!off("kerbbays")) kerbBays(runs);
    if (!WALKED.has(tags?.highway) && !off("roadtracks")) osmTracks(runs, cycleTracks(), 1.8, !off("trackaxis"));
  },
};
export const nycMap = planimetricMap(NYC_MAP);

// A house from its footprint's attributes: the roof's height in feet (from the ground) as floors (floors.js), the
// year, a garage.
export function nycHouse(a) {
  if (!a) return {};
  const code = Number(a.FEATURE_CODE);
  if (code === 5110) return { type: "garage", garage: true, nycHouse: true };
  if (!HOUSE.has(code)) return {};
  const house = heightHouse(Number(a.HEIGHT_ROOF) * 0.3048), year = Number(a.CONSTRUCTION_YEAR);
  const built = year > 1700 && year < 2100 ? { built: year } : {};
  return house.cornice || built.built ? { ...house, ...built, nycHouse: true } : {};
}
export async function nycPodlaznost(lat, lon) {
  if (param("nychouse") === "0" || !nycOn() || !inArea(AREA, lon, lat)) return null;
  return nycHouse((await nycMap.at(BUILDING, lat, lon))?.attributes);
}
