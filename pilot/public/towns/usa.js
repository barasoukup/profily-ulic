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
// A map that does not answer: the estimate, said so (sources.js usFailed). Requests: four a cut (memo by the box).
// - The houses (podlaznost): DC's assessment tables CAMA (Office of Tax and Revenue, Property_and_Land_WebMercator:
//   25 residential, 23 commercial; CC BY 4.0) by the lot under the facade's point (40, Owner Polygons: only its SSL and
//   use code are asked, never the owner). Both houses of a cut in three requests: the lots along the line between the two
//   points, the residential rows of them, the commercial ones only where a lot has no residential row. An answer later
//   than CAMA_MS is left out (the house as OSM has it). ?cama=0 leaves it out. The condominium table (24) has no
//   floors and its units are not on the lot: not asked.
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
const SUB_FIELDS = "TOTALTRAVELLANES,TOTALPARKINGLANES,TOTALPARKINGLANEWIDTH,RPPSIDE,BIKELANE_CONVENTIONAL,BIKELANE_BUFFERED,BIKELANE_PROTECTED,ROUTENAME";

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
export function carveParking(runs, block, tags = {}, wayAlong = true) {
  const a = block.a, n = Number(a.TOTALPARKINGLANES) || 0;
  if (!n) return [];
  const w = Math.min(3, Math.max(1.8, ft(a.TOTALPARKINGLANEWIDTH) / n || 2.4));
  const road = (r) => r.code === 701 || r.code === 9950;
  let i = runs.findIndex((r) => r.code === 701 && r.s <= 0 && r.e >= 0);
  if (i < 0) {
    const near = runs.map((r, k) => [k, r]).filter(([, r]) => r.code === 701).sort(([, x], [, y]) => Math.min(Math.abs(x.s), Math.abs(x.e)) - Math.min(Math.abs(y.s), Math.abs(y.e)))[0];
    if (!near) return [];
    i = near[0];
  }
  let lo = i, hi = i;
  while (lo > 0 && road(runs[lo - 1])) lo--;
  while (hi < runs.length - 1 && road(runs[hi + 1])) hi++;
  while (runs[lo].code !== 701) lo++;
  while (runs[hi].code !== 701) hi--;
  // The street's direction is the cut's dir turned left, so the cut's dir points to the street's right: +t (hi) is its right, −t (lo) its left.
  let sides;
  if (n >= 2) sides = ["lo", "hi"];
  else {
    const right = block.along ? "hi" : "lo", left = right === "hi" ? "lo" : "hi";
    const rpp = String(a.RPPSIDE || "").toUpperCase();
    const osmSide = ["left", "right"].find((s) => tags[`parking:${s}`] && !/^no/.test(tags[`parking:${s}`]));
    const osmAt = osmSide && ((osmSide === "right") === wayAlong ? "hi" : "lo");
    sides = [rpp === "I" ? left : rpp === "O" ? right : osmAt || right];
  }
  const out = [];
  for (const s of sides) {
    const r = s === "lo" ? runs[lo] : runs[hi];
    if (r.e - r.s < w + 2.5) continue; // no room for a lane beside it
    if (s === "lo") { out.push({ code: 704, s: r.s, e: r.s + w }); r.s += w; } else { out.push({ code: 704, s: r.e - w, e: r.e }); r.e -= w; }
  }
  runs.push(...out);
  runs.sort((x, y) => x.s - y.s);
  return out.length ? sides : [];
}

// The inventory's lanes and bike lanes as the way's OSM tags (app.js wayTags): lanes from TOTALTRAVELLANES, a bike lane
// where OSM tags no cycleway. wayAlong: does the OSM way run along the street's direction.
export function blockTags(block, tags = {}, wayAlong = true) {
  const a = block.a, out = {};
  if (+a.TOTALTRAVELLANES > 0) out.lanes = String(a.TOTALTRAVELLANES);
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
export function dcSurfaces({ roads, walks, bldg, sub }, osmElements, bbox, tags = null, { ddot = true } = {}) {
  const c = cutOfBox(bbox, osmElements);
  if (!c) return null;
  const runs = runsAlong([[1, bldg], [11, walks], [10, roads]], c);
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
  const parked = block ? carveParking(runs, block, tags || c.tags || {}, wayAlong) : [];
  const wayTags = block ? blockTags(block, tags || c.tags || {}, wayAlong) : null;
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
    own = dcSurfaces({ roads, walks, bldg, sub }, o.elements, bbox, tags, { ddot: ddot && !!sub });
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
  const off = typeof location !== "undefined" && (new URLSearchParams(location.search).get("off") || "").split(",").includes("ulicky");
  if (!dcOn() || off || !inArea(AREAS.dc, lon, lat)) return o;
  const dy = radius / 110574, dx = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  const bbox = [lon - dx, lat - dy, lon + dx, lat + dy].map((v) => v.toFixed(5)).join(",");
  try {
    const json = await cached(`alley ${bbox}`, () => getJSON(`${DC_PLAN}/10/query?${new URLSearchParams({ ...envelope(bbox), where: "DESCRIPTION = 'Alley'", outFields: "DESCRIPTION", returnGeometry: "true" })}`));
    const add = alleyAreas(json);
    return add.length ? { ...o, elements: [...o.elements, ...add] } : o;
  } catch (err) { console.warn("DC alleys", err); return o; }
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

export const sources = {
  osm,
  surfaces,
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost,
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): DC's Planimetrics.
export const SURFACE_MAPS = ["dc"];
