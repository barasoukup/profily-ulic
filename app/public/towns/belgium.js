// Belgium (Bára 20. 11. 2026): the state of a cut inside states.json's "belgium". No region publishes a map of street
// surfaces with the sidewalks as a web service (evaluation/belgium/SOURCES.md): the profile is the estimate from OSM and
// the region's orthophoto (lanes-ortho.js "be": Flanders' or Wallonia's), with the lines of the regions' large-scale
// maps as candidates for the kerbs (ortho-osm.js edges), as the Slovak towns' drawings:
// - Flanders: GRB (Grootschalig Referentiebestand, Digitaal Vlaanderen, WFS geo.api.vlaanderen.be, CORS *), the lines
//   of the road's division WGO: the edge of the roadway (wrb), of the zone of pedestrians and cyclists (wcz) and of
//   unpaved land (woz).
// - Wallonia: PICC (Projet Informatique de Cartographie Continue, SPW, ArcGIS geoservices.wallonie.be, CORS for the
//   origin asking), "Voirie - Ligne": the edges of the roadway, sidewalks, parking, cycle tracks and kerbs.
// - Brussels publishes no such lines (UrbIS is a download): the estimate alone, no request.
// ?hrany=0 leaves the lines out (the A/B test, evaluation/belgium/ab/).
// Flanders' surfaces (Bára 24. 11. 2026): GRB's road corridor WBN (wegbaan, facade to facade) divided by those same
// lines WGO into roadway, sidewalks (the zone of pedestrians and cyclists), side strips and verges along the cut, as
// its surfaces where WBN lies under the cut's centre of a street with a kerb on both sides (as Vienna's FMZK), with
// OSM's buildings, green and water around. Licence: Modellicentie gratis hergebruik v1.0, "Bron: Grootschalig
// Referentie Bestand Vlaanderen, Digitaal Vlaanderen". ?wbn=0 leaves it out (the A/B test, evaluation/belgium/ab-wbn/:
// better 10, worse 2 of 25 cuts).
import { flagsOf } from "../flags.js";
import { osmTiles, getJSON, query, envelope, asMtvu } from "../gis.js";
import { beRegionsAt } from "../lanes-ortho.js";
import { MTVU_LABELS } from "../city.js";
import { osmAreas } from "./slovakia.js";
import { inside } from "../places.js";
import { polygonsOf, pathsOf, cachedBy } from "./shared.js";

const flag = flagsOf("PROFILY_BE");

export const GRB_WFS = "https://geo.api.vlaanderen.be/GRB/wfs";
export const PICC = "https://geoservices.wallonie.be/arcgis/rest/services/TOPOGRAPHIE/PICC_VDIFF/MapServer/20";
// The PICC's lines that are an edge of a part of the street (not a gutter, a crossing, a marking or a driveway).
export const PICC_EDGE = new Set(["Voirie - Bord", "Trottoir", "Parking", "Piste cyclable - Bord", "Bordure", "Îlot directionnel", "Zone d'arrêt de bus"]);
// WGO's kinds by their label (LBLTYPE): the edge of the roadway, of the zone of pedestrians and cyclists, of unpaved land.
const GRB_LABEL = /rand van de rijbaan|zone zwakke weggebruiker|onverharde zone/;

export const grbPaths = (json) => (json?.features || []).filter((f) => GRB_LABEL.test(f.properties?.LBLTYPE || ""))
  .flatMap((f) => pathsOf(f.geometry));
export const piccPaths = (json) => (json?.features || []).filter((f) => PICC_EDGE.has(f.attributes?.NATUR_DESC)).flatMap((f) => f.geometry?.paths || []);

// One GRB layer in a box, asked once (WGO serves both the kerbs' lines and the surfaces).
const grbMemo = new Map();
function grbLayer(type, bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  return cachedBy(grbMemo, `${type} ${bbox}`, () =>
    // WFS 2.0 with the URN of EPSG:4326: the box lat, lon; the answer's GeoJSON lon, lat.
    getJSON(`${GRB_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: `GRB:${type}`,
      srsName: "EPSG:4326", bbox: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326`, outputFormat: "application/json", count: "3000" })}`), { evictFirst: true });
}
async function grb(bbox) {
  return grbPaths(await grbLayer("WGO", bbox));
}
async function picc(bbox) {
  return piccPaths(await query(`${PICC}/query`, { ...envelope(bbox), outFields: "NATUR_DESC", returnGeometry: "true" }));
}

// One request a box and region (the surfaces and the lines of a cut, a cut moved a little ask the same box). The
// region by the cut's centre (regions-be.json; the hostile review: no request to Flanders in Wallonia or Brussels,
// and near the language border, within about 2 km, both regions' lines).
const memo = new Map();
function edgesAt(bbox) {
  if (!memo.has(bbox)) {
    if (memo.size > 30) memo.delete(memo.keys().next().value);
    const [x0, y0, x1, y1] = bbox.split(",").map(Number);
    memo.set(bbox, beRegionsAt((x0 + x1) / 2, (y0 + y1) / 2).catch(() => ["vl", "wal"]).then(async (regions) => {
      const asks = regions.filter((r) => r === "vl" || r === "wal");
      const got = await Promise.all(asks.map((r) => (r === "vl" ? grb(bbox) : picc(bbox)).catch(() => [])));
      const first = got.findIndex((g) => g.length);
      return { paths: got.flat(), id: first >= 0 ? (asks[first] === "vl" ? "grb" : "picc") : null };
    }));
  }
  return memo.get(bbox);
}

async function lines(bbox) {
  if (!bbox || flag("hrany") === "0") return { features: [], edges: [], widths: [], areas: [] };
  const e = await edgesAt(bbox);
  return { features: [], edges: e.paths, edgesFrom: e.paths.length ? e.id : null, symbols: [], widths: [], areas: [] };
}

// ---------- Flanders: the road corridor WBN divided by the lines WGO, along the cut ----------
// GRB's wegbaan (WBN) is the road corridor from facade (or plot) to facade, cut into road segments and crossing zones;
// the wegopdeling (WGO) lines divide it: wcz the kerb's foot (the edge of the zone of pedestrians and cyclists), wrb the
// edge of the paved strip for cars (left out within 0.5 m of a wcz), woz the edge of unpaved land (GRB's
// objectenhandboek). The lines carry no sides and often stop short of each other, so they do not close into areas:
// the kinds are read along the cut instead, from the street's axis outwards, each line crossed giving the next kind.
const GRB_KIND = (label) => (/\(wcz\)/.test(label) ? "wcz" : /\(wrb\)/.test(label) ? "wrb" : /\(woz\)/.test(label) ? "woz" : null);
const ROADS = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|road|busway)(_link)?$/;
// The next kind across a line; "side" is the strip beyond the edge of the roadway (parking, a gutter, a level sidewalk).
const ACROSS = {
  road: { wrb: "side", wcz: "walk", woz: "green" },
  side: { wrb: "road", wcz: "walk", woz: "green" },
  walk: { wcz: "road", wrb: "road", woz: "green" },
  green: { woz: "walk", wcz: "walk", wrb: "road" },
};
// A side strip as an MTVU code by its width and what ends it: before a kerb or a verge parking from 1.6 m to 3 m
// (narrower: the roadway's gutter; wider: other paved area, a square or a car park); at the corridor's edge (no kerb:
// a level street) a sidewalk, from 6 m other paved area.
const sideCode = (w, kerb) => (kerb ? (w < 1.6 ? 701 : w <= 3 ? 704 : 1003) : w < 6 ? 702 : 1003);
const CODE = { road: 701, walk: 702, green: 401 };

const cross = (a, b, p, q) => {
  const r = [b[0] - a[0], b[1] - a[1]], s = [q[0] - p[0], q[1] - p[1]], den = r[0] * s[1] - r[1] * s[0];
  if (!den) return null;
  const t = ((p[0] - a[0]) * s[1] - (p[1] - a[1]) * s[0]) / den, u = ((p[0] - a[0]) * r[1] - (p[1] - a[1]) * r[0]) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
};

// The parts of the cut (metres from its centre along dir, a unit vector; half its length) from WBN's polygons and WGO's
// lines in metres around the centre: [{ from, to, code }], or null where the centre lies outside WBN. start: the kind
// at the anchor ("road", or "walk" on a path); anchor: where the reading starts, as a fraction of the cut (0.5 its
// centre; a street of two carriageways is cut in the middle of its median, so the reading starts on the carriageway
// OSM draws, grbSurfaces; the review of 24. 11. 2026: from the median as "road" every kind came out inverted).
export function grbAlong(wbn, wgo, dir, half, start = "road", anchor = 0.5) {
  const A = [-dir[0] * half, -dir[1] * half], B = [dir[0] * half, dir[1] * half], at = (t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
  const inWbn = (t) => { const [x, y] = at(t); return wbn.some((rings) => inside(rings, x, y)); };
  if (!inWbn(0.5) || !inWbn(anchor)) return null;
  const ev = [];
  for (const rings of wbn) for (const r of rings) for (let i = 1; i < r.length; i++) { const t = cross(A, B, r[i - 1], r[i]); if (t != null) ev.push({ t, type: "wbn" }); }
  for (const l of wgo) for (let i = 1; i < l.pts.length; i++) { const t = cross(A, B, l.pts[i - 1], l.pts[i]); if (t != null) ev.push({ t, type: l.type }); }
  // One crossing a place (a line doubled, a line on WBN's edge: the line counts).
  ev.sort((a, b) => a.t - b.t);
  const eps = 0.02 / (2 * half), uniq = [];
  for (const e of ev) {
    const last = uniq.at(-1);
    if (last && e.t - last.t < eps) { if (last.type === "wbn") last.type = e.type; } else uniq.push({ ...e });
  }
  const parts = [];
  let kerbs = 0;
  for (const side of [1, -1]) {
    const list = side > 0 ? uniq.filter((e) => e.t > anchor) : uniq.filter((e) => e.t < anchor).reverse();
    let kind = start, from = anchor;
    for (let i = 0; i <= list.length; i++) {
      const e = list[i], to = e ? e.t : side > 0 ? 1 : 0;
      parts.push({ a: Math.min(from, to), b: Math.max(from, to), kind, end: e?.type, side });
      if (!e) break;
      // WBN's boundary: on into the next polygon (a crossing zone) with the same kind, or the corridor's end.
      if (e.type === "wbn") { if (!inWbn(e.t + side * eps * 5)) break; } else kind = ACROSS[kind][e.type];
      if (e.type === "wcz" && !parts.some((p) => p.side === side && p.kerb)) { parts.at(-1).kerb = true; kerbs++; }
      from = e.t;
    }
  }
  // Only a street with a kerb on both sides: beyond a lone edge of the roadway (a level street) GRB does not tell
  // parking from the sidewalk, and the estimate from the orthophoto does better (the A/B test, evaluation/belgium/ab-wbn).
  if (kerbs < 2) return null;
  return parts.map((p) => {
    const w = (p.b - p.a) * 2 * half;
    return { from: (p.a - 0.5) * 2 * half, to: (p.b - 0.5) * 2 * half, code: p.kind === "side" ? sideCode(w, p.end === "wcz" || p.end === "woz") : CODE[p.kind] };
  }).filter((p) => p.to - p.from > 0.01);
}

// The cut's direction from its box (app.js: the cut's ends ± pad at two opposite corners) and OSM's ways: of the two
// diagonals the one more across the nearest street or path (the cut's own: its centre lies on it).
export function cutOfBox(bbox, osmElements, pad = 0.0004) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const lat0 = (y0 + y1) / 2, lon0 = (x0 + x1) / 2, kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110574;
  const hx = Math.max(0, (x1 - x0) / 2 - pad) * kx, hy = Math.max(0, (y1 - y0) / 2 - pad) * ky, cut = Math.hypot(hx, hy);
  if (cut < 1) return null;
  // The parts reach as far as the box (the profile may end beyond the cut's first guess, at the facades).
  const half = cut + pad * ky;
  let best = null;
  for (const el of osmElements || []) {
    if (el.type !== "way" || !el.tags?.highway || !el.geometry || el.tags.area === "yes") continue;
    const g = el.geometry.map((p) => [(p.lon - lon0) * kx, (p.lat - lat0) * ky]);
    for (let i = 1; i < g.length; i++) {
      const [a, b] = [g[i - 1], g[i]], d = [b[0] - a[0], b[1] - a[1]], L2 = d[0] * d[0] + d[1] * d[1];
      if (!L2) continue;
      const t = Math.max(0, Math.min(1, -(a[0] * d[0] + a[1] * d[1]) / L2)), dist = Math.hypot(a[0] + t * d[0], a[1] + t * d[1]);
      if (!best || dist < best.dist) best = { dist, along: [d[0] / Math.sqrt(L2), d[1] / Math.sqrt(L2)], tags: el.tags, g };
    }
  }
  const dirs = [[hx / cut, hy / cut], [hx / cut, -hy / cut]];
  const dir = best ? dirs.sort((p, q) => Math.abs(p[0] * best.along[0] + p[1] * best.along[1]) - Math.abs(q[0] * best.along[0] + q[1] * best.along[1]))[0] : dirs[0];
  // Where the nearest way crosses the cut (a fraction of it, 0.5 the centre), the crossing nearest the centre.
  let axis = null;
  if (best) {
    const A = [-dir[0] * half, -dir[1] * half], B = [dir[0] * half, dir[1] * half];
    for (let i = 1; i < best.g.length; i++) {
      const t = cross(A, B, best.g[i - 1], best.g[i]);
      if (t != null && (axis == null || Math.abs(t - 0.5) < Math.abs(axis - 0.5))) axis = t;
    }
  }
  return { lat0, lon0, kx, ky, dir, half, tags: best?.tags, axis };
}

// WBN and WGO of a cut's box as thin MTVU features along the cut (2 m along the street), or null.
export function grbSurfaces(wbnJson, wgoJson, osmElements, bbox, tags = null) {
  const c = cutOfBox(bbox, osmElements);
  if (!c) return null;
  const P = ([x, y]) => [(x - c.lon0) * c.kx, (y - c.lat0) * c.ky], back = ([x, y]) => [x / c.kx + c.lon0, y / c.ky + c.lat0];
  const wbn = [];
  for (const f of wbnJson?.features || []) {
    const g = f.geometry;
    for (const rings of polygonsOf(g)) wbn.push(rings.map((r) => r.map(P)));
  }
  const wgo = [];
  for (const f of wgoJson?.features || []) {
    const type = GRB_KIND(f.properties?.LBLTYPE || ""), g = f.geometry;
    if (type) for (const l of pathsOf(g)) wgo.push({ pts: l.map(P), type });
  }
  // Only a street for cars: a path's corridor (a park, a square) has no lines to read.
  if (!ROADS.test((tags || c.tags)?.highway || "")) return null;
  // A cut whose centre is off its road (app.js centerOnStreet: the middle of a street of two carriageways) is read from
  // where the road crosses it; a cut on its road from its centre, as before.
  const anchor = c.axis != null && ROADS.test(c.tags?.highway || "") && Math.abs(c.axis - 0.5) * 2 * c.half > 1 ? c.axis : 0.5;
  const parts = grbAlong(wbn, wgo, c.dir, c.half, "road", anchor);
  if (!parts) return null;
  const [nx, ny] = c.dir, along = [-ny, nx];
  return {
    features: parts.map((p) => ({ attributes: { code: p.code }, geometry: { rings: [[[p.from, -1], [p.to, -1], [p.to, 1], [p.from, 1], [p.from, -1]]
      .map(([t, s]) => back([nx * t + along[0] * s, ny * t + along[1] * s]))] } })),
  };
}

async function surfaces(bbox, tags) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (flag("wbn") === "0") return { features: [], abroad: true };
  const regions = await beRegionsAt(cx, cy).catch(() => ["vl"]);
  if (!regions.includes("vl")) return { features: [], abroad: true };
  let own;
  try {
    const r = Math.max((x1 - x0) * 111320 * Math.cos((cy * Math.PI) / 180), (y1 - y0) * 110574) / 2;
    const [wbn, wgo, o] = await Promise.all([grbLayer("WBN", bbox), grbLayer("WGO", bbox), osmTiles(cy, cx, r)]);
    own = grbSurfaces(wbn, wgo, o.elements, bbox, tags);
  } catch {
    // Outside Flanders (near the language border) WBN is empty: the estimate; a failure in Flanders is told.
    return { features: [], abroad: true, ...(regions[0] === "vl" && { beFailed: "grb" }) };
  }
  // Only where WBN lies under the cut's centre (elsewhere the estimate).
  if (!own?.features.length) return { features: [], abroad: true };
  const o = await osmAreas(bbox);
  return { features: [...o.buildings, ...asMtvu([[own, (a) => a.code]], MTVU_LABELS).features, ...o.rest], beTown: "grb" };
}

async function osm(lat, lon, radius) {
  return osmTiles(lat, lon, radius);
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

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: Flanders' GRB (regions-be.json "vl"); Wallonia's PICC gives only lines, Brussels nothing.
export const SURFACE_MAPS = ["vl"];
