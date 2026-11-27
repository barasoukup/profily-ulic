// Italy (Bára 23. 11. 2026): the state of a cut inside states.json's "italy", which is only where an orthophoto or a
// surface map has an open licence (the province of Bolzano, Turin, Bologna, Modena; Lombardy by its DBT since 24. 11. 2026,
// towns/lombardy.js; evaluation/italy/ZDROJE.md). The profile is the estimate from OSM and that orthophoto
// (lanes-ortho.js "it"), except in Lombardy (the DBT's surfaces, no orthophoto) and Bologna:
// - Bologna's Carta tecnica comunale (opendata.comune.bologna.it, Opendatasoft, CORS *, CC BY 4.0): the road areas
//   (aree stradali: the carriageway of the streets and of their junctions) as polygons. The sidewalks are only lines
//   there: what lies between the roadway, OSM's buildings, green and water is paved walking area (a fill after all
//   of them, marked as an estimate). OFF unless ?bologna=1: the A/B of 40 cuts (evaluation/italy/ab/ZPRAVA.md) showed the
//   road areas are the whole street space with its sidewalks (roadways of 20 m with shoulders, the sidewalks lost).
// - Bologna's buildings (c_a944ctc_edifici_pl): the height to the eaves, so the floors (about 3.2 m a floor), and the
//   kind (a church, a portico…). Under a portico the building behind it (within PORTICO_REACH). ?bolognadomy=0 leaves
//   them out.
import { osmTiles, getJSON, asMtvu, asPassport } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { inArea } from "../places.js";
import { osmAreas } from "./slovensko.js";
import { surfaces as lombardySurfaces, AREAS as LOMBARDY_AREAS } from "./lombardy.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_IT?.[k] ?? null : new URLSearchParams(location.search).get(k));

export const BOLOGNA_API = "https://opendata.comune.bologna.it/api/explore/v2.1/catalog/datasets";
export const AREAS = { bologna: { box: [11.22, 44.42, 11.44, 44.56] }, ...LOMBARDY_AREAS };
// The road areas' kinds that are a roadway at the ground (not one over a river or a railway, nor one being built).
const ROADWAY = new Set(["Tracciato principale in tronco", "Tronco di intersezione tra strade a raso"]);

// At most 500 areas a box (5 pages); the map is off (?bologna=1), so a cut over more just loses the rest. Before it is
// turned on: say so, and split the fill by the kerb lines (ab/ZPRAVA.md; the review of 23. 11. 2026, finding 18).
async function records(dataset, bbox, select) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const out = [];
  for (let offset = 0; offset < 500; offset += 100) {
    const json = await getJSON(`${BOLOGNA_API}/${dataset}/records?${new URLSearchParams({ where: `in_bbox(geo_shape,${y0},${x0},${y1},${x1})`, select, limit: "100", offset: String(offset) })}`);
    out.push(...(json.results || []));
    if ((json.results || []).length < 100) break;
  }
  return out;
}
const ringsOf = (g) => (g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []);
export function bolognaRoads(rows) {
  return { features: rows.filter((r) => ROADWAY.has(r.descrizion)).flatMap((r) => ringsOf(r.geo_shape?.geometry).map((rings) => ({ attributes: { code: 701 }, geometry: { rings } }))) };
}

const memo = new Map();
function cached(bbox) {
  const key = bbox.split(",").map((v) => (+v).toFixed(4)).join(",");
  if (!memo.has(key)) {
    memo.set(key, records("aree-stradali", bbox, "descrizion,geo_shape").then(bolognaRoads).catch((err) => { memo.delete(key); throw err; }));
    if (memo.size > 30) memo.delete(memo.keys().next().value);
  }
  return memo.get(key);
}
const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
const ring = (r) => Array.from({ length: 12 }, (_, i) => [r * Math.cos((i * Math.PI) / 6), r * Math.sin((i * Math.PI) / 6)]);
const AROUND = [[0, 0], ...[2, 5, 10].flatMap(ring)];

async function surfaces(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  // Lombardy's DBT (towns/lombardy.js; null outside the region or with ?lombardia=0).
  const lombardy = await lombardySurfaces(bbox);
  if (lombardy) return lombardy;
  if (param("bologna") !== "1" || !inArea(AREAS.bologna, cx, cy)) return { features: [], abroad: true };
  let own;
  try {
    own = asMtvu([[await cached(bbox), (a) => a.code]], MTVU_LABELS);
  } catch {
    return { features: [], abroad: true, itFailed: "bologna" };
  }
  // A roadway of the map at the cut's centre or within 10 m.
  const my = 1 / 110574, mx = 1 / (111320 * Math.cos((cy * Math.PI) / 180));
  if (!own.features.some((f) => AROUND.some(([ox, oy]) => inRings(f.geometry.rings, cx + ox * mx, cy + oy * my)))) return { features: [], abroad: true };
  const o = await osmAreas(bbox);
  // The rest of the box: paved walking area (sidewalks, squares), an estimate, after everything else.
  const fill = { attributes: { CTVUK_KOD: 702, CTVUK_POPIS: MTVU_LABELS[702], ODHAD: 1 }, geometry: { rings: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]] } };
  return { features: [...o.buildings, ...asPassport(own).features, ...o.rest, fill], itTown: "bologna", passport: true };
}

// ---------- Bologna's buildings ----------
// A building of the Carta tecnica → the facts of app.js ruianFacts (as BD TOPO in France): the floors from the height to
// the eaves (3.2 m a floor everywhere: the old town's higher ground floors and palaces are not told apart, so their
// floors may come out too many; not measured), a church as a church.
export function bolognaBuilding(r) {
  const h = Number(r?.altezza_gr);
  const kind = String(r?.descrizion || "");
  if (/portico|tettoia/i.test(kind)) return {};
  const floors = h > 2 ? Math.max(1, Math.round(h / 3.2)) : undefined;
  const type = /chiesa|campanile/i.test(kind) ? "church" : undefined;
  return { type, ...(floors && { cornice: floors, total: floors, roof: 0, height: Math.round(h * 10) / 10 }) };
}
// The facade point of a cut under a portico hits only the portico (Bologna is full of them; the review of 23. 11. 2026):
// then the tallest building within PORTICO_REACH of it (a portico is about 4–6 m deep).
const PORTICO_REACH = "8m";
const isPortico = (x) => /portico|tettoia/i.test(x?.descrizion || "");
const tallest = (rows) => rows.filter((x) => !isPortico(x)).sort((a, b) => (b.altezza_gr || 0) - (a.altezza_gr || 0))[0];
const buildingsWhere = async (where) => (await getJSON(`${BOLOGNA_API}/c_a944ctc_edifici_pl/records?${new URLSearchParams({ where, select: "altezza_gr,descrizion", limit: "10" })}`)).results || [];
async function podlaznost(lat, lon) {
  if (param("bolognadomy") === "0" || !inArea(AREAS.bologna, lon, lat)) return {};
  const point = `geom'POINT(${lon} ${lat})'`;
  const hit = await buildingsWhere(`intersects(geo_shape, ${point})`);
  const r = tallest(hit) || (hit.some(isPortico) ? tallest(await buildingsWhere(`within_distance(geo_shape, ${point}, ${PORTICO_REACH})`)) : null);
  return r ? bolognaBuilding(r) : {};
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
// answers: Lombardy's DBT (Bologna's map is off unless ?bologna=1).
export const SURFACE_MAPS = ["lombardia"];
