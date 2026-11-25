// The USA (Bára 24. 11. 2026, phase 2 of the North America pilot; evaluation/usa-dc/ZPRAVA.md, evaluation/usa/): the state
// of a cut inside staty.json's "usa", the metro of Washington DC. Outside DC the estimate from OSM (and nothing else). In
// DC (the box AREAS.dc; the services answer nothing beyond the District):
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
//   to the cut's centre within 12 m and along the street (|cos| ≥ 0.85) is the cut's block. TOTALTRAVELLANES is the
//   street's lane count (the way's OSM lanes, app.js wayTags); TOTALPARKINGLANES strips of TOTALPARKINGLANEWIDTH / count
//   (ft → m, 1.8–3.0 m) are cut off the carriageway's outer kerbs as kerb parking 704 (with one lane, RPPSIDE's side:
//   O right of the line's direction, I left, a reading of the field; else OSM's parking:<side>, else the line's right),
//   and the law's estimate is off there (noParkGuess); a bike lane of the inventory (BIKELANE_CONVENTIONAL, _BUFFERED,
//   _PROTECTED: BD both sides, IB/OB one) is OSM's cycleway:<side>=lane where OSM tags none. ?ddot=0 leaves it out.
// Arterials (25. 11. 2026, evaluation/usa/tepny; ?off=dctepny: as before):
// - the Planimetrics' Traffic Barrier (layer 13, "Barrier") is handed on as a guard-rail line: the roadway polygons of
//   DC run across a median of concrete barriers (Military Road: 27.3 m, seven lanes), and derive.js splitMedians cuts a
//   roadway where a guard rail lies between two street axes;
// - a traffic or median island with no roadway on both sides of it is no median (the corner lawn of 3rd Street NW);
// - the one parking lane with no side known lies on the side of fewer lanes of a two-way block (3rd Street NW);
// - a protected bike lane or a two-way protected one (BIKELANE_PROTECTED, _DUAL_PROTECTED, _DUAL_BUFFERED) that OSM has
//   as a way of its own (cycleway=separate) is a cycle track at that kerb (703; 15th Street NW).
// - TOTALTRAVELLANES counts both carriageways: on a one-way way of a two-way block OSM's lanes stand, else the direction's.
// A map that does not answer: the estimate, said so (sources.js usFailed). Requests: six a cut (memo by the box).
import { osmTiles, getJSON, envelope, asMtvu } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { inArea } from "../places.js";
import { cutOfBox } from "./belgium.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_US?.[k] ?? null : new URLSearchParams(location.search).get(k));
export const dcOn = () => param("dc") !== "0";
export const ddotOn = () => param("ddot") !== "0";
export const DC_PLAN = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Planimetrics_2023/MapServer";
export const DC_SUBBLOCK = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/162";
// The District's box (the Planimetrics answer nothing beyond it). inside: for the overview map (tools/build_coverage.mjs),
// which has no boundary of DC (GISCO's LAU are European): the box, cut to the metro.
const DC_BOX = [-77.12, 38.79, -76.909, 38.996];
export const AREAS = { dc: { box: DC_BOX, inside: (lon, lat) => lon >= DC_BOX[0] && lon <= DC_BOX[2] && lat >= DC_BOX[1] && lat <= DC_BOX[3] } };
const ft = (x) => (Number(x) || 0) * 0.3048;
const STEP = 0.1;
const off = (name) => (param("off") || "").split(",").includes(name);
const SUB_FIELDS = "TOTALTRAVELLANES,TOTALTRAVELLANESINBOUND,TOTALTRAVELLANESOUTBOUND,TOTALBIKELANES,TOTALBIKELANEWIDTH,BIKELANE_DUAL_PROTECTED,BIKELANE_DUAL_BUFFERED,TOTALPARKINGLANES,TOTALPARKINGLANEWIDTH,RPPSIDE,BIKELANE_CONVENTIONAL,BIKELANE_BUFFERED,BIKELANE_PROTECTED,ROUTENAME";

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
const inRing = (ring, x, y) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const inRings = (rings, x, y) => rings.reduce((c, r) => (inRing(r, x, y) ? !c : c), false);

// The kinds along the cut: runs { code, s, e } in metres from the centre along dir (c: cutOfBox's frame).
// layers: [[layer, esri json]…].
export function runsAlong(layers, c) {
  const P = ([lon, lat]) => [(lon - c.lon0) * c.kx, (lat - c.lat0) * c.ky];
  const polys = [];
  for (const [layer, json] of layers) for (const f of json?.features || []) {
    const code = dcCode(layer, f.attributes?.DESCRIPTION);
    if (!code || !f.geometry?.rings?.length) continue;
    const rings = f.geometry.rings.map((r) => r.map(P)), xs = rings.flat();
    polys.push({ code: code[0], prio: code[1], rings, box: [Math.min(...xs.map((p) => p[0])), Math.min(...xs.map((p) => p[1])), Math.max(...xs.map((p) => p[0])), Math.max(...xs.map((p) => p[1]))] });
  }
  polys.sort((a, b) => a.prio - b.prio);
  const runs = [];
  for (let t = -c.half; t < c.half - 1e-9; t += STEP) {
    const x = c.dir[0] * (t + STEP / 2), y = c.dir[1] * (t + STEP / 2);
    const p = polys.find((q) => x >= q.box[0] && x <= q.box[2] && y >= q.box[1] && y <= q.box[3] && inRings(q.rings, x, y));
    const code = p ? p.code : 401, last = runs.at(-1);
    if (last && last.code === code) last.e = t + STEP; else runs.push({ code, s: t, e: t + STEP });
  }
  return runs;
}

// An island with a roadway on both sides of it stays a median; any other is land beside the street, green as the
// map's other gaps (the runs changed in place).
export function islandsBeside(runs) {
  const roads = runs.filter((r) => r.code === 701);
  for (const r of runs) if (r.code === 9950 && !(roads.some((x) => x.e <= r.s + 0.01) && roads.some((x) => x.s >= r.e - 0.01))) r.code = 401;
  for (let i = runs.length - 1; i > 0; i--) if (runs[i].code === runs[i - 1].code) { runs[i - 1].e = runs[i].e; runs.splice(i, 1); }
  return runs;
}

// The carriageway at the cut's centre: the roadway run there (or the nearest) with its neighbours of roadway or median,
// as [lo, hi] its outer roadway runs; null without one.
function carriageway(runs) {
  const road = (r) => r.code === 701 || r.code === 9950;
  let i = runs.findIndex((r) => r.code === 701 && r.s <= 0 && r.e >= 0);
  if (i < 0) {
    const near = runs.map((r, k) => [k, r]).filter(([, r]) => r.code === 701).sort(([, x], [, y]) => Math.min(Math.abs(x.s), Math.abs(x.e)) - Math.min(Math.abs(y.s), Math.abs(y.e)))[0];
    if (!near) return null;
    i = near[0];
  }
  let lo = i, hi = i;
  while (lo > 0 && road(runs[lo - 1])) lo--;
  while (hi < runs.length - 1 && road(runs[hi + 1])) hi++;
  while (runs[lo].code !== 701) lo++;
  while (runs[hi].code !== 701) hi--;
  return [lo, hi];
}
// A strip of width w and code cut off the outer kerb of the carriageway's run r on side s ("lo", "hi"), or null.
function kerbStrip(r, s, w, code) {
  if (r.e - r.s < w + 2.5) return null; // no room for a lane beside it
  if (s === "lo") { const x = { code, s: r.s, e: r.s + w }; r.s += w; return x; }
  const x = { code, s: r.e - w, e: r.e }; r.e -= w;
  return x;
}

// The block's protected bike lanes that OSM has as ways of their own (cycleway[:side]=separate), cut off the kerbs as
// cycle tracks 703. Returns the sides.
export function carveTracks(runs, block, tags = {}) {
  const a = block.a, dual = a.BIKELANE_DUAL_PROTECTED || a.BIKELANE_DUAL_BUFFERED, one = a.BIKELANE_PROTECTED;
  if (!(dual || one) || !Object.entries(tags).some(([k, v]) => /^cycleway(:(left|right|both))?$/.test(k) && v === "separate")) return [];
  const at = carriageway(runs);
  if (!at) return [];
  const right = block.along ? "hi" : "lo", left = right === "hi" ? "lo" : "hi", all = ft(a.TOTALBIKELANEWIDTH);
  const sides = { BD: [right, left], OB: [right], IB: [left] }[dual || one] || [];
  const w = dual ? Math.min(3.7, Math.max(2.4, all || 3)) : Math.min(2.5, Math.max(1.2, all / (Number(a.TOTALBIKELANES) || 1) || 1.5));
  const out = sides.map((s) => kerbStrip(runs[s === "lo" ? at[0] : at[1]], s, w, 703)).filter(Boolean);
  runs.push(...out);
  runs.sort((x, y) => x.s - y.s);
  return sides;
}

// The map has the street when a kind of it lies within 3 m of the cut's centre: a roadway or a median under a street for
// cars (a dual carriageway is cut in its middle), a roadway or a sidewalk under a footway, path or cycleway.
const WALKED = new Set(["footway", "path", "pedestrian", "cycleway", "steps", "bridleway", "corridor"]);
export function hasStreet(runs, tags = null) {
  const kinds = !tags?.highway || WALKED.has(tags.highway) ? [701, 702] : [701, 9950];
  return runs.some((r) => kinds.includes(r.code) && r.s <= 3 && r.e >= -3);
}

// The block of the inventory: the nearest SubBlock line along the street within 12 m of the cut's centre. along: does
// the line run with the street's direction (the cut's dir turned left: [-dir[1], dir[0]]).
export function blockOf(json, c) {
  const street = [-c.dir[1], c.dir[0]];
  let best = null;
  for (const f of json?.features || []) for (const path of f.geometry?.paths || []) {
    const pts = path.map(([lon, lat]) => [(lon - c.lon0) * c.kx, (lat - c.lat0) * c.ky]);
    for (let i = 1; i < pts.length; i++) {
      const [a, b] = [pts[i - 1], pts[i]], d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(...d);
      if (!L) continue;
      const u = Math.max(0, Math.min(1, -(a[0] * d[0] + a[1] * d[1]) / (L * L))), dist = Math.hypot(a[0] + u * d[0], a[1] + u * d[1]);
      const cos = (d[0] * street[0] + d[1] * street[1]) / L;
      if (dist > 12 || Math.abs(cos) < 0.85) continue;
      if (!best || dist < best.d) best = { d: dist, a: f.attributes || {}, along: cos > 0, line: [d[0] / L, d[1] / L] };
    }
  }
  return best;
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
    const rpp = String(a.RPPSIDE || "").toUpperCase();
    const osmSide = ["left", "right"].find((s) => tags[`parking:${s}`] && !/^no/.test(tags[`parking:${s}`]));
    const osmAt = osmSide && ((osmSide === "right") === wayAlong ? "hi" : "lo");
    // A two-way block: the side of fewer lanes has the parking (inbound runs against the line, so on its left).
    const ib = Number(a.TOTALTRAVELLANESINBOUND) || 0, ob = Number(a.TOTALTRAVELLANESOUTBOUND) || 0, fewer = bySide && ib && ob && ib !== ob ? (ib < ob ? left : right) : null;
    sides = [rpp === "I" ? left : rpp === "O" ? right : osmAt || fewer || right];
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

// The cut's features from the answers (Node tests call it with saved answers): null where the map has not the street.
export function dcSurfaces({ roads, walks, bldg, sub }, osmElements, bbox, tags = null, { ddot = true, arterial = true } = {}) {
  const c = cutOfBox(bbox, osmElements);
  if (!c) return null;
  const runs = runsAlong([[1, bldg], [11, walks], [10, roads]], c);
  if (arterial) islandsBeside(runs);
  if (!hasStreet(runs, tags || c.tags)) return null;
  const block = ddot ? blockOf(sub, c) : null;
  const street = [-c.dir[1], c.dir[0]];
  // The OSM way nearest the centre (cutOfBox's) along the street?
  const way = (osmElements || []).filter((el) => el.type === "way" && el.tags === c.tags && el.geometry?.length > 1)[0];
  let wayAlong = true;
  if (way) {
    const g = way.geometry, [p, q] = [g[0], g.at(-1)];
    wayAlong = (q.lon - p.lon) * c.kx * street[0] + (q.lat - p.lat) * c.ky * street[1] >= 0;
  }
  if (block && arterial) carveTracks(runs, block, tags || c.tags || {});
  const parked = block ? carveParking(runs, block, tags || c.tags || {}, wayAlong, { bySide: arterial }) : [];
  const wayTags = block ? blockTags(block, tags || c.tags || {}, wayAlong, { byDirection: arterial }) : null;
  const back = ([x, y]) => [x / c.kx + c.lon0, y / c.ky + c.lat0];
  const features = runs.map((r) => ({ attributes: { code: r.code }, geometry: { rings: [[[r.s, -1], [r.e, -1], [r.e, 1], [r.s, 1], [r.s, -1]]
    .map(([t, u]) => back([c.dir[0] * t + street[0] * u, c.dir[1] * t + street[1] * u]))] } }));
  return { features, block: !!block, parked, wayTags };
}

const memo = new Map();
function cached(key, make) {
  if (!memo.has(key)) {
    if (memo.size > 40) memo.delete(memo.keys().next().value);
    memo.set(key, make().catch((err) => { memo.delete(key); throw err; }));
  }
  return memo.get(key);
}
const plan = (layer, bbox) => cached(`${layer} ${bbox}`, () => getJSON(`${DC_PLAN}/${layer}/query?${new URLSearchParams({ ...envelope(bbox), outFields: "DESCRIPTION", returnGeometry: "true" })}`));
const subBlock = (bbox) => cached(`sub ${bbox}`, () => getJSON(`${DC_SUBBLOCK}/query?${new URLSearchParams({ ...envelope(bbox), outFields: SUB_FIELDS, returnGeometry: "true" })}`));

async function surfaces(bbox, tags = null) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const estimate = (extra = {}) => ({ features: [], abroad: true, ...extra });
  if (!dcOn() || !inArea(AREAS.dc, cx, cy)) return estimate();
  let own;
  try {
    const r = Math.max((x1 - x0) * 111320 * Math.cos((cy * Math.PI) / 180), (y1 - y0) * 110574) / 2;
    const ddot = ddotOn();
    const [roads, walks, bldg, sub, o] = await Promise.all([plan(10, bbox), plan(11, bbox), plan(1, bbox), ddot ? subBlock(bbox).catch(() => null) : null, osmTiles(cy, cx, r)]);
    own = dcSurfaces({ roads, walks, bldg, sub }, o.elements, bbox, tags, { ddot: ddot && !!sub, arterial: !off("dctepny") });
  } catch {
    return estimate({ usFailed: "dc" });
  }
  if (!own) return estimate();
  return {
    features: asMtvu([[own, (a) => a.code]], MTVU_LABELS).features, usTown: "dc",
    ...(own.block && { usDdot: true, noParkGuess: true }), ...(own.wayTags && Object.keys(own.wayTags).length && { wayTags: own.wayTags }),
  };
}

// DC's alleys (Planimetrics layer 10, Alley) join the OSM elements as alley areas (service=alley), so that a click
// keeps away from their mouths as from a crossing (derive.js awayFromJunctions; OSM draws few of DC's alleys: dc-1-1).
// Only in DC with the map on; a failure leaves OSM's alone. ?off=ulicky: not asked.
export function alleyAreas(json) {
  return (json?.features || []).filter((f) => /alley/i.test(f.attributes?.DESCRIPTION || "") && f.geometry?.rings?.length)
    .flatMap((f, k) => f.geometry.rings.slice(0, 1).map((r) => ({ type: "area", id: -(k + 1), tags: { service: "alley", source: "DC Planimetrics" }, geometry: r.map(([lon, lat]) => ({ lat, lon })) })));
}
async function osm(lat, lon, radius) {
  const o = await osmTiles(lat, lon, radius);
  if (!dcOn() || off("ulicky") || !inArea(AREAS.dc, lon, lat)) return o;
  const dy = radius / 110574, dx = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  const bbox = [lon - dx, lat - dy, lon + dx, lat + dy].map((v) => v.toFixed(5)).join(",");
  try {
    const json = await cached(`alley ${bbox}`, () => getJSON(`${DC_PLAN}/10/query?${new URLSearchParams({ ...envelope(bbox), where: "DESCRIPTION = 'Alley'", outFields: "DESCRIPTION", returnGeometry: "true" })}`));
    const add = alleyAreas(json);
    return add.length ? { ...o, elements: [...o.elements, ...add] } : o;
  } catch (err) { console.warn("DC alleys", err); return o; }
}

// The Planimetrics' concrete barriers as guard-rail lines (MTVU code 71540, derive.js splitMedians); a failure leaves them out.
const NO_LINES = { features: [], edges: [], widths: [], areas: [] };
export const barrierLines = (json) => (json?.features || []).filter((f) => f.attributes?.DESCRIPTION === "Barrier" && f.geometry?.paths?.length)
  .map((f) => ({ attributes: { CTMTP_KOD: 71540 }, geometry: f.geometry }));
async function lines(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  if (!dcOn() || off("dctepny") || !inArea(AREAS.dc, (x0 + x1) / 2, (y0 + y1) / 2)) return NO_LINES;
  try { return { ...NO_LINES, features: barrierLines(await plan(13, bbox)) }; } catch (err) { console.warn("DC barriers", err); return NO_LINES; }
}

export const sources = {
  osm,
  surfaces,
  lines,
  parking: async () => ({ features: [] }),
  podlaznost: async () => ({}),
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): DC's Planimetrics.
export const SURFACE_MAPS = ["dc"];
