// San Francisco (Bára 26. 11. 2026): the City and County of San Francisco in the state "usa" (staty-america.json, the metro
// table of tools/build_staty.mjs), the city by its boundary (mesta-us.json "sanfrancisco") and 30 m beyond it. The city has
// no planimetric polygons of its roadways that a browser can read (the basemap of services.sfgov.org does not answer from
// outside), so the surface map is put together from three open layers along the cut (towns/planimetrics.js, d.runs):
// - the right of way (DataSF "Right of Way Polygons", h8n7-e4ns, 2014; SODA with CORS; PDDL): the street between the
//   property lines;
// - the kerbs (SFMTA's blockface curbs, DataSF/master MapServer 12, CBB_TYPE BLK, NBLK and ISL for islands; STATUS Active;
//   CORS for the origin asking): where they cross the cut inside the right of way, the outermost two are the roadway's
//   edges, a pair between them a median or island; the rest of the right of way is sidewalk;
// - the buildings (DataSF "Building Footprints", ynuv-fyni, 2010 model; PDDL): houses 601 outside the right of way (the
//   footprints lie about 1.4 m east of it, sfRuns), a gap outside it green 401 (front yards, as Washington's).
// Only where this has the street under the cut's centre (hasStreet). A right of way with fewer than two kerbs across it is
// left a sidewalk: no roadway under a street for cars, so no map (the estimate), not a guess.
// - SFMTA's digital curb (MapServer 56, Curb Zones & All Policies; the same as DataSF wntw-x37e): a side of the roadway whose
//   curb zones within 15 m of the cut allow parking (general, residential permit, accessible, car share, motorcycle,
//   special permit, loading) gets a parking lane at the kerb (8 ft, 2.44 m; angled where the zone has more than one stall
//   in 14 ft each, by its longest zone of cars: 16 ft, 4.88 m); a side whose zones allow none gets none, and the law's estimate is off where both sides have
//   zones (noParkGuess). ?sfcurb=0 leaves it out.
// - the houses (podlaznost): the median height of the footprint under the facade (hgt_median_m, no request of its own) as
//   floors by Toronto's rule (towns/canada.js floorsOf), which OSM's building:levels overrules. ?sfhouse=0 leaves it out.
// ?sf=0 leaves the map out (the estimate from OSM). A map that does not answer: the estimate, said so (mapFailed "sf").
// Requests: four a cut (memo by the box). No orthophoto: none of San Francisco's is open (NAIP of USGS is 0.6–1 m).
import { getJSON, envelope } from "../gis.js";
import { inArea } from "../places.js";
import { planimetricMap, runsAlong, memory, carriageway, kerbStrip } from "./planimetrics.js";
import { floorsOf } from "./canada.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_US?.[k] ?? null : new URLSearchParams(location.search).get(k));
export const sfOn = () => param("sf") !== "0";
export const sfCurbOn = () => param("sfcurb") !== "0";
export const AREAS = { sf: { box: [-122.53, 37.70, -122.35, 37.84], town: "sanfrancisco", near: 30 } };
export const SF_ROW = "https://data.sf.gov/resource/h8n7-e4ns.geojson";
export const SF_BUILDINGS = "https://data.sf.gov/resource/ynuv-fyni.geojson";
export const SFMTA = "https://services.sfmta.com/arcgis/rest/services/DataSF/master/MapServer";
const LIMIT = 2000;

// A SODA answer (GeoJSON) as ArcGIS's: { features: [{ attributes, geometry: { rings } }] }; full at the limit.
export function sodaAsEsri(json) {
  const features = (json?.features || []).map((f) => {
    const g = f.geometry || {}, polys = g.type === "MultiPolygon" ? g.coordinates : g.type === "Polygon" ? [g.coordinates] : [];
    return { attributes: f.properties || {}, geometry: { rings: polys.flat() } };
  });
  return { features, ...(features.length >= LIMIT && { exceededTransferLimit: true }) };
}
const soda = (url, column) => (bbox) => {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const box = `POLYGON((${x0} ${y0},${x1} ${y0},${x1} ${y1},${x0} ${y1},${x0} ${y0}))`;
  return getJSON(`${url}?${new URLSearchParams({ $where: `intersects(${column},'${box}')`, $limit: String(LIMIT) })}`).then(sodaAsEsri);
};

// Where the lines of an answer cross the cut: [{ t, island }] (t in metres from the centre along dir; c: cutOfBox's frame).
export function crossings(json, c) {
  const P = ([lon, lat]) => [(lon - c.lon0) * c.kx, (lat - c.lat0) * c.ky];
  const n = [-c.dir[1], c.dir[0]], out = [];
  for (const f of json?.features || []) for (const path of f.geometry?.paths || []) {
    const g = path.map(P);
    for (let i = 1; i < g.length; i++) {
      const [a, b] = [g[i - 1], g[i]], ua = a[0] * n[0] + a[1] * n[1], ub = b[0] * n[0] + b[1] * n[1];
      if (ua === ub || (ua > 0) === (ub > 0)) continue;
      const u = ua / (ua - ub), t = (a[0] + u * (b[0] - a[0])) * c.dir[0] + (a[1] + u * (b[1] - a[1])) * c.dir[1];
      if (Math.abs(t) <= c.half) out.push({ t, island: /^ISL/i.test(f.attributes?.CBB_TYPE || "") });
    }
  }
  return out.sort((x, y) => x.t - y.t);
}

// The runs along the cut from the buildings, the right of way and the kerbs (the answers in the order of SF_MAP.layers).
// The footprints (a model of 2010) lie about 1.4 m east of the right of way (Folsom, Mission, Valencia Streets: a gap of
// 1.2–1.4 m on the west side, a building 1.4–1.8 m into the street on the east): the right of way comes first, and a gap
// narrower than FACADE_GAP between it and a building is the building's.
const FACADE_GAP = 2;
export function sfRuns([bldg, row, curbs], c) {
  const runs = runsAlong([[() => [702, 0], row], [() => [601, 1], bldg]], c);
  runs.forEach((r, i) => {
    const [a, b] = [runs[i - 1], runs[i + 1]];
    if (r.gap && r.e - r.s < FACADE_GAP && a && b && ((a.code === 702 && b.code === 601) || (a.code === 601 && b.code === 702))) { r.code = 601; delete r.gap; }
  });
  for (let i = runs.length - 1; i > 0; i--) if (runs[i].code === runs[i - 1].code && !runs[i].lot === !runs[i - 1].lot) { runs[i - 1].e = runs[i].e; runs.splice(i, 1); }
  const kerbs = crossings(curbs, c);
  for (let i = runs.length - 1; i >= 0; i--) {
    const r = runs[i];
    if (r.code !== 702) continue;
    // (Two lines within 0.3 m are one kerb drawn twice, a blockface's end on the next one's start.)
    const ks = kerbs.filter((k) => k.t > r.s + 0.3 && k.t < r.e - 0.3).filter((k, j, a) => !j || k.t - a[j - 1].t > 0.3).map((k) => k.t);
    if (ks.length < 2) continue;
    const parts = [{ code: 702, s: r.s, e: ks[0] }];
    const inner = ks.length % 2 === 0 ? ks.slice(1, -1) : [];
    let s = ks[0];
    for (let j = 0; j < inner.length; j += 2) { parts.push({ code: 701, s, e: inner[j] }, { code: 9950, s: inner[j], e: inner[j + 1] }); s = inner[j + 1]; }
    parts.push({ code: 701, s, e: ks.at(-1) }, { code: 702, s: ks.at(-1), e: r.e });
    runs.splice(i, 1, ...parts.filter((p) => p.e - p.s > 0.05));
  }
  return runs;
}

// The digital curb: the sides of the carriageway with parking at the cut (runs changed in place). zones: the answer of
// layer 56. Returns { sides: ["lo"|"hi"…], known: the sides that have zones at the cut }.
const PARKING = /^(general parking|residential permit parking|accessible parking|car share parking|motorcycle parking|special permit parking|commercial loading|general loading|six wheeled truck loading)$/i;
const ALONG = 15, KERB_NEAR = 2.5; // m
export function curbParking(runs, zones, c) {
  const at = carriageway(runs);
  if (!at) return { sides: [], known: [] };
  const P = ([lon, lat]) => [(lon - c.lon0) * c.kx, (lat - c.lat0) * c.ky];
  const n = [-c.dir[1], c.dir[0]], edge = { lo: runs[at[0]].s, hi: runs[at[1]].e };
  const bySide = { lo: [], hi: [] };
  for (const f of zones?.features || []) {
    const a = f.attributes || {};
    for (const path of f.geometry?.paths || []) {
      const g = path.map(P);
      for (let i = 1; i < g.length; i++) {
        const [p, q] = [g[i - 1], g[i]], d = [q[0] - p[0], q[1] - p[1]], L = Math.hypot(...d);
        if (!L || Math.abs((d[0] * n[0] + d[1] * n[1]) / L) < 0.85) continue; // along the street
        const u = Math.max(0, Math.min(1, -(p[0] * d[0] + p[1] * d[1]) / (L * L))), x = [p[0] + u * d[0], p[1] + u * d[1]];
        if (Math.abs(x[0] * n[0] + x[1] * n[1]) > ALONG) continue;
        const t = x[0] * c.dir[0] + x[1] * c.dir[1];
        for (const s of ["lo", "hi"]) if (Math.abs(t - edge[s]) <= KERB_NEAR) bySide[s].push(a);
      }
    }
  }
  const known = Object.keys(bySide).filter((s) => bySide[s].length), sides = [];
  for (const s of known) {
    const park = bySide[s].filter((a) => PARKING.test(a.POLICY_CATEGORY || ""));
    if (!park.length) continue;
    // (Angled by the longest zone of cars: motorcycles' stalls are short whatever the kerb.)
    const cars = park.filter((a) => !/motorcycle/i.test(a.POLICY_CATEGORY || "")).sort((a, b) => Number(b.LENGTH_FT) - Number(a.LENGTH_FT))[0];
    const angled = !!cars && Number(cars.NUM_SPACES) >= 3 && Number(cars.LENGTH_FT) / Number(cars.NUM_SPACES) < 14;
    const x = kerbStrip(runs[s === "lo" ? at[0] : at[1]], s, angled ? 4.88 : 2.44, 704);
    if (x) { runs.push(x); sides.push(s); }
  }
  runs.sort((x, y) => x.s - y.s);
  return { sides, known };
}

const cached = memory();
const ZONE_FIELDS = "POLICY_CATEGORY,NUM_SPACES,LENGTH_FT,SIDE_OF_STREET";
const curbZones = (bbox) => cached(bbox, () => getJSON(`${SFMTA}/56/query?${new URLSearchParams({ ...envelope(bbox), outFields: ZONE_FIELDS, returnGeometry: "true" })}`));

export const SF_MAP = {
  id: "sf", area: AREAS.sf, on: sfOn, service: `${SFMTA}`, fields: "CBB_TYPE",
  layers: [
    { id: "bldg", get: soda(SF_BUILDINGS, "shape") },
    { id: "row", get: soda(SF_ROW, "the_geom") },
    { id: 12, fields: "CBB_TYPE", where: "STATUS = 'Active' OR STATUS IS NULL" },
  ],
  runs: sfRuns,
  extra: (bbox) => (sfCurbOn() ? curbZones(bbox).catch(() => null) : undefined),
  adjust: (runs, { c, extra }) => {
    if (!extra) return {};
    const { sides, known } = curbParking(runs, extra, c);
    return known.length || sides.length ? { sfCurb: true, ...(known.length === 2 && { noParkGuess: true }) } : {};
  },
};
const map = planimetricMap(SF_MAP);
export const sfHere = map.here;
export const sfSurfaces = map.surfaces;

// A house by the median height of its footprint (2010; Toronto's rule of floors).
export function sfHouse(a) {
  const n = floorsOf(Number(a?.hgt_median_m));
  return n ? { cornice: n, roof: 0, total: n, fromHeight: true, sfHouse: true } : {};
}
export async function sfPodlaznost(lat, lon) {
  if (param("sfhouse") === "0" || !sfOn() || !inArea(AREAS.sf, lon, lat)) return {};
  return sfHouse((await map.at("bldg", lat, lon))?.attributes);
}
