// Poland (Bára 21. 11. 2026): the state of a cut inside states.json's "poland". The national BDOT10k and the counties'
// base maps are not served openly with CORS (evaluation/poland/SOURCES.md): the profile is the estimate from OSM and
// GUGiK's orthophoto (lanes-ortho.js "pl"), except where a city publishes its surfaces:
// - Kraków: the city's base map MJO (msip.um.krakow.pl, ArcGIS, CORS for the origin asking): roadways (Jezdnia),
//   squares (Plac), sidewalks (Chodnik), paths for cyclists and walkers (Ścieżka). Off unless ?krakow=1 (Bára 26. 11. 2026:
//   the city's rules ask for the written consent of MSIP's administrator for continuous use in another system,
//   evaluation/archive/licences/REPORT.md; the A/B test, evaluation/poland/ab/, runs with ?krakow=1).
// As Germany's city maps: the city's surfaces with OSM's buildings before them and OSM's green and water after, only
// where the city has a surface of the street at the cut's centre or near it; a city that does not answer: the
// estimate, with a note.
import { osmTiles, query, envelope, asMtvu, asPassport } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { inArea } from "../places.js";
import { osmAreas } from "./slovakia.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_PL?.[k] ?? null : new URLSearchParams(location.search).get(k));

export const KRAKOW = "https://msip.um.krakow.pl/arcgis/rest/services/Mapy_bazowe/basemap_MJO/MapServer";
export const AREAS = { krakow: { box: [19.79, 49.96, 20.22, 50.13] } };
// The base map's layers and kinds (kod_nz) → MTVU codes (city.js MTVU_LABELS).
const KRAKOW_LAYERS = [5, 6, 8];
// Ścieżka (KTCR04) is drawn in the red of cycle paths, but it takes in the walkers' part too: on Most Kotlarski the
// whole walkway of each side (a grey sidewalk and a red cycle strip side by side on the orthophoto) is one Ścieżka, and
// as a cycle path it became two cycle paths (a two-way track split by its directions). As a walkway OSM decides what
// it holds (segregated: a sidewalk and a cycle path side by side; Bára 21. 11. 2026: "záleží, jak to tam opravdu vypadá").
const KRAKOW_KIND = { KTJZ01: 701, KTPL01: 1003, KTCR02: 702, KTCR04: 702 };
export const krakowCode = (a) => KRAKOW_KIND[/\((\w+)\)/.exec(a?.kod_nz || "")?.[1]] ?? null;

async function krakow(bbox) {
  const got = await Promise.all(KRAKOW_LAYERS.map((l) => query(`${KRAKOW}/${l}/query`, { ...envelope(bbox), outFields: "kod_nz", returnGeometry: "true" })));
  // The service gives at most 1000 a request: an answer cut short is no map (the estimate, with a note).
  if (got.some((j) => j.exceededTransferLimit)) throw new Error("MJO: exceededTransferLimit");
  return { features: got.flatMap((j) => j.features || []).map((f) => ({ attributes: { code: krakowCode(f.attributes) }, geometry: f.geometry })).filter((f) => f.attributes.code && f.geometry?.rings) };
}

const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
// A roadway near the cut's centre (a sidewalk alone is not enough, as in the Netherlands).
const STREET = new Set([701]);
const NEAR = [[0, 0], ...[1.5, 4, 7].flatMap((r) => Array.from({ length: 8 }, (_, i) => [r * Math.cos((i * Math.PI) / 4), r * Math.sin((i * Math.PI) / 4)]))];
export const PL_TOWNS = { krakow };
// The towns asked only with ?<id>=1 (no consent to their use yet).
export const OFF_BY_DEFAULT = new Set(["krakow"]);
const townOn = (id) => (OFF_BY_DEFAULT.has(id) ? param(id) === "1" : param(id) !== "0");
const townAt = (lon, lat) => Object.keys(PL_TOWNS).find((id) => townOn(id) && inArea(AREAS[id], lon, lat)) ?? null;

async function surfaces(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const id = townAt(cx, cy);
  if (!id) return { features: [], abroad: true };
  let own;
  try {
    own = asMtvu([[await PL_TOWNS[id](bbox), (a) => a.code]], MTVU_LABELS);
  } catch {
    return { features: [], abroad: true, plFailed: id };
  }
  const my = 1 / 110574, mx = 1 / (111320 * Math.cos((cy * Math.PI) / 180));
  const at = own.features.some((f) => STREET.has(f.attributes.CTVUK_KOD) && NEAR.some(([ox, oy]) => inRings(f.geometry.rings, cx + ox * mx, cy + oy * my)));
  if (!at) return { features: [], abroad: true };
  const o = await osmAreas(bbox);
  return { features: [...o.buildings, ...asPassport(own).features, ...o.rest], plTown: id, passport: true };
}

export const sources = {
  osm: (lat, lon, radius) => osmTiles(lat, lon, radius),
  surfaces,
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost: async () => ({}),
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: the towns' base maps (their AREAS).
export const SURFACE_MAPS = Object.keys(PL_TOWNS).filter((id) => !OFF_BY_DEFAULT.has(id));
