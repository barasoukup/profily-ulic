// The USA (Bára 24. 11. 2026, phase 2 of the North America pilot; evaluation/usa-dc/ZPRAVA.md, evaluation/usa/): the state
// of a cut inside staty.json's "usa", the metros of Washington DC, New York City (towns/newyork.js), San Francisco (its
// own map: towns/sanfrancisco.js, asked by sources.surfaces and podlaznost where it has the place) and Boston (Bára
// 26. 11. 2026: Boston's and Cambridge's surface maps in towns/boston.js, picked below by the place). Outside the cities'
// maps the estimate from OSM (in Boston's metro with MassGIS's orthophoto). In
// DC (the District by its boundary, mesta-us.json, and 60 m beyond it for the streets along the line; AREAS.dc):
// - DC Planimetrics 2023 (OCTO, maps2.dcgis.dc.gov DCGIS_DATA/Planimetrics_2023/MapServer, layers 10 Roads, 11 Sidewalks,
//   1 Building Footprints; CORS for the origin asking; CC BY 4.0, "DC GIS / Office of the Chief Technology Officer") as
//   the surface map: the kinds read along the cut every 0.1 m (as Flanders' GRB, towns/belgium.js) and handed on as
//   MTVU-coded strips 2 m along the street (the mapping of the pilot, evaluation/usa-dc/build.mjs):
//     Building, Parking Garage → 601; Sidewalk, Hidden Sidewalk, Stairs → 702; Crosswalk → 701 (on the roadway);
//     Road, Intersection, Hidden Road / Intersection → 701; median and traffic islands, Hidden Median → 9950;
//     Alley, Paved Drive, Parking Lot → 1003 (off the street: a lot as 704 would be kerb parking);
//     a gap between the polygons (the tree strip, a front yard, a lawn) → 401 green.
//   Where polygons overlap: building, sidewalk, median, roadway, the rest. Only where the map has the street under the
//   cut's centre (hasStreet, as Vilnius and Helsinki: within 3 m a roadway or median under a street for cars, a roadway or
//   sidewalk under a footway). ?dc=0 leaves the map out (the estimate from OSM and the orthophoto).
// - DDOT's Roadway SubBlock inventory (Transportation_WebMercator/MapServer/162, CC BY 4.0): the inventory's line nearest
//   to the cut's centre within 12 m and along the street (|cos| ≥ 0.85), of a kind that fits the OSM way (ROADTYPE: a street or
//   service road first, an alley, driveway, ramp or trail only where the way is one) and filled in (some lane or parking
//   counted), is the cut's block. TOTALTRAVELLANES is the
//   street's lane count (the way's OSM lanes, app.js wayTags); TOTALPARKINGLANES strips of TOTALPARKINGLANEWIDTH / count
//   (ft → m, 1.8–3.0 m) are cut off the carriageway's outer kerbs as kerb parking 704 (with one lane on OSM's
//   parking:<side>, else the side of fewer lanes, else the line's right; not by RPPSIDE, which says where the residents'
//   permit holds, with codes nobody published),
//   and the law's estimate is off there (noParkGuess); a bike lane of the inventory (BIKELANE_CONVENTIONAL, _BUFFERED,
//   _PROTECTED: BD both sides, IB/OB one) is OSM's cycleway:<side>=lane where OSM tags none. ?ddot=0 leaves it out.
// Arterials (25. 11. 2026, evaluation/usa/arterials; ?off=dcarterials: as before):
// - the Planimetrics' Traffic Barrier (layer 13, "Barrier") is handed on as a guard-rail line: the roadway polygons of
//   DC run across a median of concrete barriers (Military Road: 27.3 m, seven lanes), and derive.js splitMedians cuts a
//   roadway where a guard rail lies between two street axes;
// - a traffic or median island with no roadway on both sides of it is no median (the corner lawn of 3rd Street NW);
// - the one parking lane with no side in OSM lies on the side of fewer lanes of a two-way block (3rd Street NW);
// - a protected bike lane or a two-way protected one (BIKELANE_PROTECTED, _DUAL_PROTECTED, _DUAL_BUFFERED) that OSM has
//   as a way of its own (cycleway=separate) is a cycle track (703) where OSM's way lies (15th Street NW at the kerb,
//   Pennsylvania Avenue NW in the middle).
// - TOTALTRAVELLANES counts both carriageways: on a one-way way of a two-way block OSM's lanes stand, else the direction's.
// The sides are by the cut's own way (app.js hands it on), not by OSM's way nearest the box's centre: where two carriageways
// are cut in the middle that is the other one, or a path in the median.
// A cut whose centre lies in a polygon of an intersection says so (junction, app.js).
// A map that does not answer: the estimate, said so (sources.js mapFailed); an inventory that does not: the parking and the
// lanes by the rules, said so (ddotFailed). Requests: six a cut (layers 10, 11, 1, 13, the alleys of 10 and SubBlock; memo
// by the box) and the orthophoto's images.
// - The houses (podlaznost): DC's assessment tables CAMA (Office of Tax and Revenue, Property_and_Land_WebMercator:
//   25 residential, 23 commercial; CC BY 4.0) by the lot under the facade's point (40, Owner Polygons: only its SSL and
//   use code are asked, never the owner). Both houses of a cut in three requests: the lots along the line between the two
//   points, the residential rows of them, the commercial ones only where a lot has no residential row. An answer later
//   than CAMA_MS is left out (the house as OSM has it). ?cama=0 leaves it out. The condominium table (24) has no
//   floors and its units are not on the lot: not asked.
import { getJSON, envelope } from "../gis.js";
import { inArea } from "../places.js";
import { BOSTON_MAPS, bostonPodlaznost, AREAS as BOSTON_AREAS } from "./boston.js";
import { planimetricMap, planimetricCut, memory, carriageway, kerbStrip, carveTrack, trackPlace, isTrack, parallelsAt, islandsBeside, inRings, WALKED } from "./planimetrics.js";
import { AREA as NYC_AREA, nycMap, nycPodlaznost } from "./newyork.js";
// San Francisco (26. 11. 2026): its own surface map and houses (towns/sanfrancisco.js); the state's sources ask it where it has the place.
import { AREAS as SF_AREAS, sfHere, sfSurfaces, sfPodlaznost } from "./sanfrancisco.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_US?.[k] ?? null : new URLSearchParams(location.search).get(k));
export const dcOn = () => param("dc") !== "0";
export const ddotOn = () => param("ddot") !== "0";
export const DC_PLAN = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Planimetrics_2023/MapServer";
export const DC_SUBBLOCK = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/162";
// The District by its boundary (mesta-us.json "washington", tools/build_towns_us.mjs: simplified to 20 m), the box only
// a first test; 60 m beyond it, since Western, Eastern and Southern Avenue run along the line.
// New York City (26. 11. 2026): towns/newyork.js.
export const AREAS = { dc: { box: [-77.121, 38.79, -76.908, 38.997], town: "washington", near: 60 }, nyc: NYC_AREA, ...SF_AREAS };
const ft = (x) => (Number(x) || 0) * 0.3048;
const off = (name) => (param("off") || "").split(",").includes(name);
const SUB_FIELDS = "TOTALTRAVELLANES,TOTALTRAVELLANESINBOUND,TOTALTRAVELLANESOUTBOUND,TOTALBIKELANES,TOTALBIKELANEWIDTH,BIKELANE_DUAL_PROTECTED,BIKELANE_DUAL_BUFFERED,TOTALPARKINGLANES,TOTALPARKINGLANEWIDTH,BIKELANE_CONVENTIONAL,BIKELANE_BUFFERED,BIKELANE_PROTECTED,ROADTYPE";

// A kind of the Planimetrics as [MTVU code, priority] (lower first), or null (left out: canopies, the rest of layer 1).
export function dcCode(layer, d) {
  d = String(d || "").toLowerCase();
  if (layer === 1) return /building|garage/.test(d) ? [601, 0] : null;
  if (layer === 11) return /crosswalk/.test(d) ? [701, 3] : [702, 1];
  if (/median|island/.test(d)) return [9950, 2];
  if (/road|intersection/.test(d)) return [701, 3];
  if (/parking lot|alley|drive/.test(d)) return [1003, 4];
  return null;
}

// The block's protected bike lanes that OSM has as ways of their own (cycleway[:side]=separate) as cycle tracks 703: where
// OSM's own way lies (at a kerb, or in the middle of the carriageway: Pennsylvania Avenue NW); without such a way on the
// side OSM tags, and only where neither says it on the inventory's side. A side OSM says has none (cycleway:right=no) gets
// none, nor the inner side of one of two carriageways (its track is in the middle, where is not known). runs changed in
// place. at: { wayAlong, tracks: the t of OSM's cycleways, way: the t of the cut's way, others: of the street's other
// carriageways }. Returns the places ("lo", "hi", "mid").
export function carveTracks(runs, block, tags = {}, { wayAlong = true, tracks = [], way = 0, others = [] } = {}) {
  const a = block.a, dual = a.BIKELANE_DUAL_PROTECTED || a.BIKELANE_DUAL_BUFFERED, one = a.BIKELANE_PROTECTED;
  const cycle = (k) => tags[`cycleway:${k}`], separate = (v) => v === "separate";
  if (!(dual || one) || ![tags.cycleway, cycle("left"), cycle("right"), cycle("both")].some(separate)) return [];
  const at = carriageway(runs);
  if (!at) return [];
  const all = ft(a.TOTALBIKELANEWIDTH);
  const w = dual ? Math.min(3.7, Math.max(2.4, all || 3)) : Math.min(2.5, Math.max(1.2, all / (Number(a.TOTALBIKELANES) || 1) || 1.5));
  const lo = runs[at[0]].s, hi = runs[at[1]].e;
  const places = new Map(); // place → t
  if (tracks.length) {
    for (const t of tracks) {
      if (t < lo - 1.5 || t > hi + 1.5) continue; // on the sidewalk or beyond it: the map's own surfaces
      places.set(trackPlace(t, lo, hi, w), t);
    }
  } else {
    const osmAt = { right: wayAlong ? "hi" : "lo", left: wayAlong ? "lo" : "hi" };
    const tagged = ["left", "right"].filter((k) => separate(cycle(k)) || separate(cycle("both")));
    const right = block.along ? "hi" : "lo", left = right === "hi" ? "lo" : "hi";
    const ddot = { BD: ["lo", "hi"], OB: [right], IB: [left] }[dual || one] || [];
    let sides = tagged.length === 1 ? [osmAt[tagged[0]]] : ddot;
    for (const k of ["left", "right"]) if (cycle(k) && !separate(cycle(k))) sides = sides.filter((x) => x !== osmAt[k]);
    sides = sides.filter((x) => !others.some((t) => (x === "hi" ? t > way + 2 : t < way - 2)));
    for (const x of sides) places.set(x, null);
  }
  const done = [...places].filter(([x, t]) => carveTrack(runs, at, x, w, t)).map(([x]) => x);
  runs.sort((x, y) => x.s - y.s);
  return done;
}

// The block of the inventory: the nearest SubBlock line along the street within 12 m of the cut's centre, of a kind that
// fits the way (ROADTYPE: 1 street, 2 service road, 3 ramp, 4 alley, 5 driveway, 6 trail, 7 walkway), a street before
// an alley. A block with neither a lane nor a parking lane counted is not filled in (309 streets): none. along: does
// the line run with the street's direction (the cut's dir turned left: [-dir[1], dir[0]]).
const blockRank = (type, highway = "") => {
  if (WALKED.has(highway)) return type >= 6 ? 0 : null;
  if (type <= 2) return 0;
  if (type === 3) return /^motorway|^trunk|_link$/.test(highway) ? 0 : null;
  if (type === 4) return 1;
  return type === 5 && highway === "service" ? 1 : null;
};
export function blockOf(json, c, tags = null) {
  const street = [-c.dir[1], c.dir[0]];
  let best = null;
  for (const f of json?.features || []) for (const path of f.geometry?.paths || []) {
    const rank = blockRank(Number(f.attributes?.ROADTYPE) || 1, tags?.highway);
    if (rank === null) continue;
    const pts = path.map(([lon, lat]) => [(lon - c.lon0) * c.kx, (lat - c.lat0) * c.ky]);
    for (let i = 1; i < pts.length; i++) {
      const [a, b] = [pts[i - 1], pts[i]], d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(...d);
      if (!L) continue;
      const u = Math.max(0, Math.min(1, -(a[0] * d[0] + a[1] * d[1]) / (L * L))), dist = Math.hypot(a[0] + u * d[0], a[1] + u * d[1]);
      const cos = (d[0] * street[0] + d[1] * street[1]) / L;
      if (dist > 12 || Math.abs(cos) < 0.85) continue;
      if (!best || rank < best.rank || (rank === best.rank && dist < best.d)) best = { rank, d: dist, a: f.attributes || {}, along: cos > 0, line: [d[0] / L, d[1] / L] };
    }
  }
  return best && (Number(best.a.TOTALTRAVELLANES) || Number(best.a.TOTALPARKINGLANES)) ? best : null;
}

// The block's parking strips cut off the carriageway's outer kerbs (runs changed in place). The carriageway: the
// roadway run at the centre (or the nearest) and its neighbours of roadway or median. Sides: "lo" the run at low t,
// "hi" at high t. wayAlong: does the OSM way run along the street's direction (for its parking:<side>). Returns the
// sides with parking.
export function carveParking(runs, block, tags = {}, wayAlong = true, { bySide = true } = {}) {
  const a = block.a, n = Number(a.TOTALPARKINGLANES) || 0;
  if (!n) return [];
  const w = Math.min(3, Math.max(1.8, ft(a.TOTALPARKINGLANEWIDTH) / n || 2.4));
  const at = carriageway(runs);
  if (!at) return [];
  const [lo, hi] = at;
  // The street's direction is the cut's dir turned left, so the cut's dir points to the street's right: +t (hi) is its right, −t (lo) its left.
  let sides;
  if (n >= 2) sides = ["lo", "hi"];
  else {
    const right = block.along ? "hi" : "lo", left = right === "hi" ? "lo" : "hi";
    const osmSide = ["left", "right"].find((s) => tags[`parking:${s}`] && !/^no/.test(tags[`parking:${s}`]));
    const osmAt = osmSide && ((osmSide === "right") === wayAlong ? "hi" : "lo");
    // A two-way block: the side of fewer lanes has the parking (inbound runs against the line, so on its left).
    const ib = Number(a.TOTALTRAVELLANESINBOUND) || 0, ob = Number(a.TOTALTRAVELLANESOUTBOUND) || 0, fewer = bySide && ib && ob && ib !== ob ? (ib < ob ? left : right) : null;
    sides = [osmAt || fewer || right];
  }
  const out = [];
  for (const s of sides) { const x = kerbStrip(s === "lo" ? runs[lo] : runs[hi], s, w, 704); if (x) out.push(x); }
  runs.push(...out);
  runs.sort((x, y) => x.s - y.s);
  return out.length ? sides : [];
}

// The inventory's lanes and bike lanes as the way's OSM tags (app.js wayTags): lanes from TOTALTRAVELLANES, a bike lane
// where OSM tags no cycleway. wayAlong: does the OSM way run along the street's direction.
export function blockTags(block, tags = {}, wayAlong = true, { byDirection = true } = {}) {
  const a = block.a, out = {};
  if (+a.TOTALTRAVELLANES > 0) out.lanes = String(a.TOTALTRAVELLANES);
  // A one-way carriageway of a two-way block: the block's total is both carriageways' (Military Road got four lanes on a
  // carriageway of two); OSM's own count stands, else the block's lanes of the way's direction.
  const ib = +a.TOTALTRAVELLANESINBOUND || 0, ob = +a.TOTALTRAVELLANESOUTBOUND || 0;
  if (byDirection && out.lanes && /^(yes|1|true|-1)$/.test(tags.oneway || "") && ib && ob) {
    if (+tags.lanes > 0) delete out.lanes;
    else out.lanes = String((block.along === wayAlong) !== (tags.oneway === "-1") ? ob : ib);
  }
  const bike = [a.BIKELANE_CONVENTIONAL, a.BIKELANE_BUFFERED, a.BIKELANE_PROTECTED].find(Boolean);
  if (bike && !Object.keys(tags).some((k) => /^cycleway/.test(k))) {
    if (bike === "BD") out["cycleway:both"] = "lane";
    else if (bike === "OB" || bike === "IB") {
      // OB: on the line's right; the way's right when it runs as the line does.
      const lineRight = bike === "OB", same = block.along === wayAlong;
      out[`cycleway:${lineRight === same ? "right" : "left"}`] = "lane";
    }
  }
  return out;
}

// What DDOT's inventory adds to the runs of a cut (planimetrics.js adjust): its block's protected bike lanes, the parking
// cut off the kerbs, the way's tags. extra: the answer of SubBlock, null when it failed, undefined with ?ddot=0.
function inventory(runs, { c, tags, way, wayAlong, osmElements, extra: sub }, arterial = !off("dcarterials")) {
  if (!sub) return { ...(sub === null && { ddotFailed: true }) };
  const block = blockOf(sub, c, tags);
  if (!block) return {};
  if (arterial) {
    const car = (el) => el.id !== way?.id && el.tags.name && el.tags.name === tags.name && !WALKED.has(el.tags.highway);
    carveTracks(runs, block, tags, { wayAlong, tracks: parallelsAt(osmElements, c, isTrack),
      way: way ? parallelsAt([way], c, () => true).sort((p, q) => Math.abs(p) - Math.abs(q))[0] ?? 0 : 0, others: parallelsAt(osmElements, c, car) });
  }
  carveParking(runs, block, tags, wayAlong, { bySide: arterial });
  const wayTags = blockTags(block, tags, wayAlong, { byDirection: arterial });
  return { usDdot: true, noParkGuess: true, ...(Object.keys(wayTags).length && { wayTags }) };
}

// DC's Planimetrics for the shared adapter (planimetrics.js). Its alleys join OSM's elements as alley areas, so that a click
// keeps away from their mouths (OSM draws few of DC's alleys: dc-1-1); ?off=ulicky: not asked.
export const DC_MAP = {
  id: "dc", area: AREAS.dc, on: dcOn, service: DC_PLAN, fields: "DESCRIPTION",
  layers: [1, 11, 10].map((id) => ({ id, code: (a) => dcCode(id, a.DESCRIPTION) })),
  junction: { layer: 10, test: (a) => /intersection/i.test(a.DESCRIPTION || "") },
  alleys: { layer: 10, where: "DESCRIPTION = 'Alley'", test: (a) => /alley/i.test(a.DESCRIPTION || ""), source: "DC Planimetrics", off: () => off("ulicky") },
  prepare: (runs) => { if (!off("dcarterials")) islandsBeside(runs); },
  extra: (bbox) => (ddotOn() ? subBlock(bbox).catch(() => null) : undefined),
  adjust: inventory,
};
const cached = memory();
const subBlock = (bbox) => cached(bbox, () => getJSON(`${DC_SUBBLOCK}/query?${new URLSearchParams({ ...envelope(bbox), outFields: SUB_FIELDS, returnGeometry: "true" })}`));
const map = planimetricMap(DC_MAP);
// The cut's features from the answers (Node tests call it with saved answers): null where the map has not the street.
export const dcSurfaces = ({ roads, walks, bldg, sub }, osmElements, bbox, tags = null, { ddot = true, way = null } = {}) =>
  planimetricCut(DC_MAP, [bldg, walks, roads], osmElements, bbox, tags, { way, extra: ddot ? sub : undefined });

// The Planimetrics' concrete barriers as guard-rail lines (MTVU code 71540, derive.js splitMedians); a failure leaves them out.
const NO_LINES = { features: [], edges: [], widths: [], areas: [] };
export const barrierLines = (json) => (json?.features || []).filter((f) => f.attributes?.DESCRIPTION === "Barrier" && f.geometry?.paths?.length)
  .map((f) => ({ attributes: { CTMTP_KOD: 71540 }, geometry: f.geometry }));
async function lines(bbox) {
  if (off("dcarterials") || !map.here(bbox)) return NO_LINES;
  try { return { ...NO_LINES, features: barrierLines(await map.ask(13, bbox)) }; } catch (err) { console.warn("DC barriers", err); return NO_LINES; }
}

// ---- The houses: CAMA ----
export const camaOn = () => param("cama") !== "0";
export const DC_LAND = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Property_and_Land_WebMercator/MapServer";
const CAMA_MS = 3500, CAMA_REST = 60000; // ms: the longest wait; the rest after a failure
// The kind of a house by its structure (25 STRUCT_D), else by the lot's use code (the USECODE table, 54). A use that does not
// tell the building (a church's or a school's lot may be a row house) gives none.
const STRUCT = [[/^(row|town)/i, "terrace"], [/^semi/i, "semidetached_house"], [/^single/i, "detached"], [/^multi/i, "apartments"]];
const USE = (c) => {
  if ([21, 22, 26, 27, 28, 29].includes(c)) return "apartments";
  if ([31, 32, 33].includes(c)) return "hotel";
  if ([41, 42, 43, 44, 45, 46, 47, 49, 67, 68].includes(c)) return "retail";
  if ([51, 52, 53, 59, 61].includes(c)) return "office";
  if (c >= 71 && c <= 79) return "industrial";
  return undefined;
};
const WALL = [[/brick/i, "brick"], [/stone/i, "stone"], [/wood|shingle|log/i, "wood"], [/vinyl|aluminum|hardboard|plywood/i, "vinyl"], [/stucco|plaster|adobe/i, "stucco"], [/concr/i, "concrete"], [/metal/i, "metal"]];
const first = (list, d) => list.find(([re]) => re.test(d || ""))?.[1];
// A house's facts as app.js takes them. STORIES counts halves (2.5: a finished attic): an attic under the gable of a
// detached house is in its roof, in a row it is a floor of its own (a mansard). A count no house has (25, 65) is a slip.
export function camaHouse(res, com, use) {
  const a = res || com;
  if (!a && !use) return {};
  const year = Number(a?.AYB), st = Number(res?.STORIES), type = (res && first(STRUCT, res.STRUCT_D)) || USE(Number(a?.USECODE ?? use));
  const n = st >= 1 && st <= 6 ? (type === "detached" ? Math.floor(st + 0.25) : Math.round(st)) : undefined;
  const material = first(WALL, a?.EXTWALL_D);
  if (!(year > 1700) && !n && !type && !material) return {};
  return { usCama: true, ...(year > 1700 && year < 2100 && { built: year }), ...(n && { cornice: n, roof: 0, total: n }), ...(type && { type }), ...(material && { material }) };
}
// The house at each point ([lon, lat]) from the lots (layer 40) and the tables' rows.
export function camaAt(points, lots, res, com) {
  const row = (json, ssl) => (json?.features || []).map((f) => f.attributes).filter((a) => a.SSL === ssl).sort((a, b) => (a.BLDG_NUM || 1) - (b.BLDG_NUM || 1))[0];
  return points.map(([x, y]) => {
    const here = (lots?.features || []).filter((f) => f.geometry?.rings && inRings(f.geometry.rings, x, y)).map((f) => f.attributes);
    const rows = here.map((a) => [row(res, a.SSL), row(com, a.SSL), a.USECODE]);
    const best = rows.find((r) => r[0]) || rows.find((r) => r[1]) || rows[0];
    return best ? camaHouse(...best) : {};
  });
}
const camaAsk = (layer, params) => fetch(`${DC_LAND}/${layer}/query?${new URLSearchParams({ f: "json", ...params })}`, { signal: AbortSignal.timeout(CAMA_MS) })
  .then((r) => { if (!r.ok) throw new Error(`CAMA ${r.status}`); return r.json(); }).then((j) => { if (j.error) throw new Error(`CAMA ${j.error.message}`); return j; });
async function camaOf(points) {
  const deadline = new Promise((_, no) => setTimeout(() => no(new Error("CAMA timeout")), CAMA_MS));
  const work = (async () => {
    const path = points.length > 1 ? points : [points[0], [points[0][0] + 1e-6, points[0][1]]];
    const lots = await camaAsk(40, { geometry: JSON.stringify({ paths: [path] }), geometryType: "esriGeometryPolyline", inSR: "4326", outSR: "4326",
      spatialRel: "esriSpatialRelIntersects", outFields: "SSL,USECODE", returnGeometry: "true", geometryPrecision: "7" });
    const here = (lots.features || []).filter((f) => f.geometry?.rings && points.some(([x, y]) => inRings(f.geometry.rings, x, y)));
    const ssl = [...new Set(here.map((f) => f.attributes.SSL).filter((v) => /^[\w ]+$/.test(v || "")))].slice(0, 40);
    if (!ssl.length) return points.map(() => ({}));
    const where = (list) => `SSL IN (${list.map((v) => `'${v}'`).join(",")})`;
    const res = await camaAsk(25, { where: where(ssl), outFields: "SSL,BLDG_NUM,AYB,STORIES,STRUCT_D,EXTWALL_D,USECODE" });
    const left = ssl.filter((v) => !(res.features || []).some((f) => f.attributes.SSL === v));
    const com = left.length ? await camaAsk(23, { where: where(left), outFields: "SSL,BLDG_NUM,AYB,EXTWALL_D,USECODE" }).catch(() => null) : null;
    return camaAt(points, lots, res, com);
  })();
  return Promise.race([work, deadline]);
}
// Both houses of a cut are asked in the same turn (app.js): one batch.
let batch = null, camaRest = 0;
const houses = new Map();
async function podlaznost(lat, lon) {
  const nyc = await nycPodlaznost(lat, lon);
  if (nyc) return nyc;
  if (!camaOn() || !inArea(AREAS.dc, lon, lat) || Date.now() < camaRest) return {};
  const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  if (!houses.has(key)) {
    if (!batch) {
      const b = batch = { points: [] };
      b.done = new Promise((ok) => setTimeout(ok, 0)).then(() => { batch = null; return camaOf(b.points); })
        .catch((err) => { console.warn("CAMA", err.message); camaRest = Date.now() + CAMA_REST; return null; });
    }
    const i = batch.points.push([lon, lat]) - 1;
    houses.set(key, batch.done.then((all) => { if (!all) houses.delete(key); return all?.[i] || {}; }));
    if (houses.size > 30) houses.delete(houses.keys().next().value);
  }
  return houses.get(key);
}

// The map of the cut's place: DC's, else the one of Boston's metro (towns/boston.js) whose city holds the box's centre (inside
// its boundary before the metres beyond it: Memorial Drive is Cambridge's, the Charles Boston's), else DC's (the estimate).
const strictly = (m, bbox) => { const [x0, y0, x1, y1] = bbox.split(",").map(Number); return inArea({ ...BOSTON_AREAS[m === BOSTON_MAPS[0] ? "boston" : "cambridge"], near: 0 }, (x0 + x1) / 2, (y0 + y1) / 2); };
const mapOf = (bbox) => (map.here(bbox) ? map : BOSTON_MAPS.find((m) => m.here(bbox) && strictly(m, bbox)) || BOSTON_MAPS.find((m) => m.here(bbox)) || map);
const box = (lat, lon, r = 1) => { const dy = r / 110574, dx = r / (111320 * Math.cos((lat * Math.PI) / 180)); return [lon - dx, lat - dy, lon + dx, lat + dy].join(","); };
export const sources = {
  osm: (lat, lon, radius) => mapOf(box(lat, lon)).osm(lat, lon, radius),
  // The city's map whose area has the cut (DC's, New York's, San Francisco's, Boston's or Cambridge's; elsewhere the estimate).
  surfaces: (bbox, ...rest) => (sfHere(bbox) ? sfSurfaces(bbox, ...rest) : (nycMap.here(bbox) ? nycMap : mapOf(bbox)).surfaces(bbox, ...rest)),
  lines,
  parking: async () => ({ features: [] }),
  // The houses: San Francisco's heights, New York's footprints and DC's CAMA (podlaznost above), else Boston's basemap.
  podlaznost: async (lat, lon) => (inArea(SF_AREAS.sf, lon, lat) ? sfPodlaznost(lat, lon)
    : inArea(AREAS.dc, lon, lat) || inArea(AREAS.nyc, lon, lat) ? podlaznost(lat, lon) : bostonPodlaznost(lat, lon)),
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): DC's Planimetrics, New York's, San Francisco's and the
// maps of Boston and Cambridge.
export const SURFACE_MAPS = ["dc", "nyc", "sf", "boston", "cambridge"];
