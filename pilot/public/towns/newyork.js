// New York City (Bára 26. 11. 2026, the USA's second metro; evaluation/usa/nyc/): the city's five boroughs (mesta-us.json
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
// - off, ?nycsigns=1 on (26. 11. 2026, evaluation/usa/nyc/park/ZPRAVA.md): NYC DOT's Parking Regulation Locations and Signs
//   (NYC Open Data nfid-uabd, SODA with CORS *; free of restrictions by Admin. Code § 23-502, the source named) say along
//   which kerb cars may stand: the map's roadway is one polygon from kerb to kerb, OSM tags parking on few of the city's
//   streets (0 of the measurement's 75 ways). One request a cut (the signs within the box, by their State Plane feet).
//   Off: the blind A/B of 31 changed new cuts 17 : 8 (p 0.11), the universal measurement 75 → 72 %.
import { inArea } from "../places.js";
import { getJSON } from "../gis.js";
import { planimetricMap, islandsBeside, kerbBays, osmTracks, memory, WALKED } from "./planimetrics.js";
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
// ---------- parking by NYC DOT's signs (?nycsigns=1) ----------
export const NYC_SIGNS = "https://data.cityofnewyork.us/resource/nfid-uabd.json";
export const nycSignsOn = () => param("nycsigns") === "1";
// EPSG:2263 (NAD83 / New York Long Island, US survey feet; Lambert conformal conic of two parallels), forward and back: the
// signs' coordinates are on the street's centre line at the sign's distance from the corner, side_of_street names the kerb.
const A = 6378137, E = Math.sqrt(2 / 298.257222101 - 1 / 298.257222101 ** 2), FT = 1200 / 3937, RAD = Math.PI / 180;
const P1 = (40 + 40 / 60) * RAD, P2 = (41 + 2 / 60) * RAD, P0 = (40 + 10 / 60) * RAD, L0 = -74 * RAD, FE = 300000 / FT;
const mOf = (p) => Math.cos(p) / Math.sqrt(1 - E * E * Math.sin(p) ** 2), tOf = (p) => Math.tan(Math.PI / 4 - p / 2) / ((1 - E * Math.sin(p)) / (1 + E * Math.sin(p))) ** (E / 2);
const N = (Math.log(mOf(P1)) - Math.log(mOf(P2))) / (Math.log(tOf(P1)) - Math.log(tOf(P2))), F = mOf(P1) / (N * tOf(P1) ** N), R0 = A * F * tOf(P0) ** N;
export const toStatePlane = (lon, lat) => { const r = A * F * tOf(lat * RAD) ** N, th = N * (lon * RAD - L0); return [FE + (r * Math.sin(th)) / FT, (R0 - r * Math.cos(th)) / FT]; };
export function fromStatePlane(x, y) {
  const X = (x - FE) * FT, Y = R0 - y * FT, t = (Math.hypot(X, Y) / (A * F)) ** (1 / N);
  let p = Math.PI / 2 - 2 * Math.atan(t);
  for (let i = 0; i < 6; i++) p = Math.PI / 2 - 2 * Math.atan(t * ((1 - E * Math.sin(p)) / (1 + E * Math.sin(p))) ** (E / 2));
  return [(Math.atan2(X, Y) / N + L0) / RAD, p / RAD];
}
// What a sign says of the kerb: "allow" where cars stand at least some of the time (street cleaning, metered or time-limited
// parking, angle parking, a ban for some hours only), "never" for a ban at any time (no standing, no stopping, a bus stop,
// a fire zone), else null (bus route panels, locators, meter notes).
const HOURS = /\d(AM|PM)|MIDNIGHT|NOON/;
export function signKind(desc) {
  const d = String(desc || "").toUpperCase();
  if (/BROOM|SANITATION/.test(d) || /\bHMP\b|HOUR PARKING|METERED PARKING|ANGLE PARKING/.test(d)) return "allow";
  if (/ANYTIME|BUS STOP|FIRE ZONE|NO STOPPING/.test(d) && !HOURS.test(d)) return "never";
  if (/^NO (PARKING|STANDING)/.test(d) && HOURS.test(d)) return "allow";
  return null;
}
// A street's name as DOT and OSM write it alike ("EAST    7 STREET", "East 7th Street").
const TYPE = { AVE: "AVENUE", AV: "AVENUE", ST: "STREET", BLVD: "BOULEVARD", RD: "ROAD", PL: "PLACE", PKWY: "PARKWAY", DR: "DRIVE", LN: "LANE", CT: "COURT", TER: "TERRACE", SQ: "SQUARE" };
const POINT = { E: "EAST", W: "WEST", N: "NORTH", S: "SOUTH" };
export function streetKey(v) {
  const w = String(v || "").toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\b(\d+)(ST|ND|RD|TH)\b/g, "$1").split(/\s+/).filter(Boolean);
  if (w.length > 1) { w[0] = POINT[w[0]] || (w[0] === "SAINT" ? "ST" : w[0]); w[w.length - 1] = TYPE[w.at(-1)] || w.at(-1); }
  return w.join(" ");
}
const SIGN_ALONG = 40; // m along the street from the cut: the nearest sign of a kerb within it decides
// The way's parking tags by the signs (as OSM's: parking:<side>=lane|no, :orientation), only for a side OSM tags none.
// signs: the answer's rows; c: the cut's frame (planimetrics.js cutOfBox); wayAlong: the way runs with the street.
export function signTags(signs, c, tags = {}, wayAlong = true) {
  const name = streetKey(tags.name), street = [-c.dir[1], c.dir[0]], left = [-street[1], street[0]], out = {};
  if (!name || !signs?.length) return out;
  const near = { left: null, right: null };
  for (const g of signs) {
    const kind = signKind(g.sign_description), sv = { N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0] }[g.side_of_street];
    if (!kind || !sv || streetKey(g.on_street) !== name || !(+g.sign_x_coord > 0)) continue;
    const [lon, lat] = fromStatePlane(+g.sign_x_coord, +g.sign_y_coord), x = (lon - c.lon0) * c.kx, y = (lat - c.lat0) * c.ky;
    const along = Math.abs(x * street[0] + y * street[1]), sl = sv[0] * left[0] + sv[1] * left[1];
    // (A kerb at about 45° to the compass is not told.)
    if (along > SIGN_ALONG || Math.abs(sl) < 0.2) continue;
    const side = (sl > 0) === wayAlong ? "left" : "right", best = near[side];
    if (!best || along < best.along - 1e-9 || (Math.abs(along - best.along) < 1e-9 && kind === "allow")) near[side] = { along, kind, angle: /ANGLE PARKING/.test(String(g.sign_description).toUpperCase()) };
  }
  const osm = (side) => [`parking:${side}`, "parking:both", `parking:lane:${side}`, "parking:lane:both"].some((k) => tags[k] !== undefined);
  for (const side of ["left", "right"]) {
    const n = near[side];
    if (!n || osm(side)) continue;
    out[`parking:${side}`] = n.kind === "allow" ? "lane" : "no";
    if (n.kind === "allow") out[`parking:${side}:orientation`] = n.angle ? "diagonal" : "parallel";
  }
  return out;
}
const signMemo = memory();
// The signs within the cut's box widened to SIGN_ALONG (one request; at most 2,000 rows).
function signsIn(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number), pad = 0.0005;
  const a = toStatePlane(x0 - pad, y0 - pad), b = toStatePlane(x1 + pad, y1 + pad), [lx, hx] = [a[0], b[0]].sort((p, q) => p - q), [ly, hy] = [a[1], b[1]].sort((p, q) => p - q);
  const where = `sign_x_coord between ${Math.floor(lx)} and ${Math.ceil(hx)} and sign_y_coord between ${Math.floor(ly)} and ${Math.ceil(hy)}`;
  return signMemo(bbox, () => getJSON(`${NYC_SIGNS}?${new URLSearchParams({ $where: where, $select: "on_street,side_of_street,sign_description,sign_x_coord,sign_y_coord", $limit: "2000" })}`));
}

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
  extra: (bbox) => (nycSignsOn() ? signsIn(bbox).catch(() => null) : undefined),
  adjust: (runs, { c, tags, wayAlong, extra }) => {
    if (!extra || WALKED.has(tags?.highway)) return {};
    const wayTags = signTags(extra, c, tags, wayAlong);
    return Object.keys(wayTags).length ? { wayTags, nycSigns: true } : {};
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
