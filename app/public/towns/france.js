// France (Bára 22. 11. 2026): the state of a cut inside states.json's "france" (metropolitan France and Corsica). No
// Czech technical map, RÚIAN or ČÚZK orthophoto is asked: the profile is the estimate from OSM and IGN's orthophoto
// (lanes-ortho.js "fr"), except where a city publishes its street surfaces:
// - Paris: the city's Plan de voirie (opendata.paris.fr, Opendatasoft API, CORS *, ODbL): roadways (chaussées),
//   sidewalks (trottoirs), cycle tracks, bus lanes and the parking and delivery bays cut into the sidewalk (one layer,
//   "Piste": on IGN's orthophoto the bays along the kerb where the cars stand), medians (terre-pleins) and the mixed
//   areas of crossings and raised junctions. ?paris=0 leaves it out (the A/B test, evaluation/france/ab/).
// - Buildings everywhere: IGN's BD TOPO (data.geopf.fr WFS, CORS *, Licence Ouverte 2.0): floors, height, year,
//   dwellings and use (?bdtopo=0 leaves them out).
// As Kraków's base map: the city's surfaces with OSM's buildings before them and OSM's green and water after, only
// where the city has a roadway, a cycle track, parking or a bus lane at the cut's centre or near it; a city that does
// not answer: the estimate, with a note.
import { flagsOf } from "../flags.js";
import { osmTiles, getJSON, asMtvu, asPassport } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { inArea, inside } from "../places.js";
import { osmAreas } from "./slovakia.js";

const flag = flagsOf("PROFILY_FR");

export const PARIS_API = "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets";
export const AREAS = { paris: { box: [2.22, 48.81, 2.47, 48.91] } };
// The Plan de voirie's layers, in the order a point takes the first surface it lies in (derive.js classify): the bays
// and cycle tracks drawn over the roadway or the sidewalk first.
export const PARIS_LAYERS = ["plan-de-voirie-pistes-cyclables-et-couloirs-de-bus", "plan-de-voirie-terre-pleins", "plan-de-voirie-aires-mixtes-vehicules-et-pietons",
  "plan-de-voirie-chaussees", "plan-de-voirie-trottoirs-emprises"];
// lib_classe → MTVU codes (city.js MTVU_LABELS). A bus lane, or one for buses and bikes, is roadway (OSM says which
// lane); a mixed area (a raised crossing, a plateau where cars and walkers share) is roadway too.
const PARIS_KIND = { "Chaussée": 701, Trottoir: 702, "Piste cyclable": 703, Piste: 704, "Couloir bus": 701, "Couloir mixte bus-vélo": 701, "Terre-plein": 1003, "Aire mixte véhicule-piéton": 701 };
export const parisCode = (p) => PARIS_KIND[p?.lib_classe] ?? null;

const ringsOf = (g) => (g?.type === "Polygon" ? g.coordinates : g?.type === "MultiPolygon" ? g.coordinates.flat() : null);
async function parisLayer(name, bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const out = [];
  // At most 100 records a request; a cut's box has a few dozen of each layer (five pages at most).
  for (let offset = 0; offset < 500; offset += 100) {
    const json = await getJSON(`${PARIS_API}/${name}/records?${new URLSearchParams({ where: `in_bbox(geo_shape,${y0},${x0},${y1},${x1})`, select: "lib_classe,geo_shape", limit: "100", offset: String(offset) })}`);
    out.push(...(json.results || []));
    if ((json.results || []).length < 100) break;
  }
  return out;
}
export function parisFeatures(layers) {
  return { features: layers.flat().map((r) => ({ attributes: { code: parisCode(r) }, geometry: { rings: ringsOf(r.geo_shape?.geometry) } })).filter((f) => f.attributes.code && f.geometry.rings) };
}
async function paris(bbox) {
  return parisFeatures(await Promise.all(PARIS_LAYERS.map((l) => parisLayer(l, bbox))));
}

// A roadway, a cycle track or a parking bay near the cut's centre (a sidewalk alone is not enough, as in the
// Netherlands); up to 4 m when a sidewalk lies at the centre, else up to 10 m (a median between two roadways).
const STREET = new Set([701, 703, 704]);
const ring = (r) => Array.from({ length: 8 }, (_, i) => [r * Math.cos((i * Math.PI) / 4), r * Math.sin((i * Math.PI) / 4)]);
const NEAR = [[0, 0], ...[1.5, 4].flatMap(ring)], WIDE = [...NEAR, ...[7, 10].flatMap(ring)];
export const FR_TOWNS = { paris };
const townAt = (lon, lat) => Object.keys(FR_TOWNS).find((id) => flag(id) !== "0" && inArea(AREAS[id], lon, lat)) ?? null;

// One request a box (a cut moved a little asks the same box again: the box rounded to about 10 m), at most 30 kept.
const memo = new Map();
function cached(id, bbox) {
  const key = `${id} ${bbox.split(",").map((v) => (+v).toFixed(4)).join(",")}`;
  if (!memo.has(key)) {
    memo.set(key, FR_TOWNS[id](bbox).catch((err) => { memo.delete(key); throw err; }));
    if (memo.size > 30) memo.delete(memo.keys().next().value);
  }
  return memo.get(key);
}

async function surfaces(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const id = townAt(cx, cy);
  if (!id) return { features: [], abroad: true };
  let own;
  try {
    const got = await cached(id, bbox);
    own = asMtvu([[got, (a) => a.code]], MTVU_LABELS);
  } catch {
    return { features: [], abroad: true, frFailed: id };
  }
  const my = 1 / 110574, mx = 1 / (111320 * Math.cos((cy * Math.PI) / 180));
  const centre = own.features.find((f) => inside(f.geometry.rings, cx, cy))?.attributes.CTVUK_KOD;
  const around = centre === 702 ? NEAR : WIDE;
  const at = own.features.some((f) => STREET.has(f.attributes.CTVUK_KOD) && around.some(([ox, oy]) => inside(f.geometry.rings, cx + ox * mx, cy + oy * my)));
  if (!at) return { features: [], abroad: true };
  const o = await osmAreas(bbox);
  return { features: [...o.buildings, ...asPassport(own).features, ...o.rest], frTown: id, passport: true };
}

// ---------- BD TOPO (IGN) ----------
export const BDTOPO_WFS = "https://data.geopf.fr/wfs/ows";
const wfs = (layer, bbox, count) => {
  const [x0, y0, x1, y1] = bbox;
  // WFS 2.0 with the URN of EPSG:4326: the box lat, lon; the answer's GeoJSON lon, lat.
  return getJSON(`${BDTOPO_WFS}?${new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: `BDTOPO_V3:${layer}`, SRSNAME: "EPSG:4326",
    BBOX: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326`, OUTPUTFORMAT: "application/json", COUNT: String(count) })}`);
};

const lines = async () => ({ features: [], edges: [], widths: [], areas: [] });

// A building of BD TOPO → the facts of app.js ruianFacts and an OSM building type for profile.js (as the BAG).
export function bdtopoBuilding(f) {
  const p = f?.properties || {};
  const year = parseInt(String(p.date_d_apparition || ""), 10);
  const built = year > 1005 && year <= new Date().getFullYear() + 2 ? year : undefined;
  // nombre_d_etages: the floors of the building, the ground floor included (IGN's description of BD TOPO).
  // The count is noisy (the hostile review: 8 floors on 16.7 m, 1 on 15.9 m) and often missing where the height is
  // known: the height decides when the count lies outside 2.4–5 m a floor (tall ground floors and roofs of Paris), or is missing (about 3 m a floor).
  const byHeight = p.hauteur > 0 ? Math.max(1, Math.round(p.hauteur / 3)) : undefined;
  const counted = p.nombre_d_etages > 0 ? Math.round(p.nombre_d_etages) : undefined;
  const floors = counted && (!byHeight || (counted >= p.hauteur / 5 && counted <= p.hauteur / 2.4)) ? counted : byHeight;
  const uses = [p.usage_1, p.usage_2].filter(Boolean);
  const living = uses[0] === "Résidentiel";
  // A church or a synagogue is no office; a department store ("Industriel, agricole ou commercial") no hall: only an
  // industrial or agricultural use makes one (the hostile review).
  const office = !living && uses[0] === "Commercial et services" ? true : undefined;
  const type = p.nature === "Eglise" || p.nature === "Chapelle" || uses[0] === "Religieux" ? "church" : uses[0] === "Industriel" || uses[0] === "Agricole" ? "industrial"
    : living ? (p.nombre_de_logements > 1 ? "apartments" : p.nombre_de_logements === 1 ? "house" : undefined) : office ? "office" : undefined;
  return {
    built, office, house: (living && p.nombre_de_logements === 1) || undefined, type,
    ...(floors && { cornice: floors, total: floors, roof: 0, fromHeight: true, height: p.hauteur > 0 ? Math.round(p.hauteur * 10) / 10 : undefined }),
  };
}
async function podlaznost(lat, lon) {
  if (flag("bdtopo") === "0") return {};
  const d = 0.000005; // about half a metre around the facade's point
  const json = await wfs("batiment", [lon - d, lat - d, lon + d, lat + d], 5);
  const standing = (json?.features || []).filter((f) => f.properties?.etat_de_l_objet === "En service" && !f.properties?.construction_legere);
  const b = standing.find((f) => { const r = ringsOf(f.geometry); return r && inside(r, lon, lat); }) || standing[0];
  return b ? bdtopoBuilding(b) : {};
}

// ---------- parking: Paris's register of parking places ----------
// Every regulated place on the public road (opendata.paris.fr stationnement-voie-publique-emplacements, ODbL, updated
// daily): one point a stretch of stalls, in the middle of the strip, with its length along the kerb (lon), depth (lar),
// arrangement (typsta: Longitudinal, Bataille perpendicular, Epi angled), use (regpri: paid, delivery, the disabled,
// two-wheelers…) and place (locsta). Only stretches on the roadway: "Chaussée", a painted bay ("Faux lincoln") and one
// along a median ("Contre terre plein"); a bay cut into the sidewalk (Lincoln) is the Plan de voirie's own surface.
// The register covers all of Paris (all parking there is regulated): a kerb with no stretch at the cut has none
// (derive.js kerbParking). Paris's wide roadways have no lines on IGN's image (shade, few markings): without it the
// rules left their parking strips as shoulders (Bd Saint-Germain, Rue de Castiglione). ?parisstani=0 leaves it out.
export const PARIS_PARKING_SET = "stationnement-voie-publique-emplacements";
const PARIS_ORIENT = { Longitudinal: "podelne", Bataille: "kolme", Epi: "sikme" };
const ON_ROAD = new Set(["Chaussée", "Faux lincoln", "Contre terre plein"]);
export function parisParking(records) {
  return records.filter((r) => ON_ROAD.has(r.locsta) && PARIS_ORIENT[r.typsta] && r.lon > 0 && r.lar > 0 && r.geo_point_2d)
    .map((r) => ({ lon: r.geo_point_2d.lon, lat: r.geo_point_2d.lat, len: r.lon, w: r.lar, orient: PARIS_ORIENT[r.typsta], street: r.nomvoie || "" }));
}
async function parking(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (flag("parisstani") === "0" || flag("paris") === "0" || !inArea(AREAS.paris, cx, cy)) return { features: [] };
  const out = [];
  for (let offset = 0; offset < 500; offset += 100) {
    const json = await getJSON(`${PARIS_API}/${PARIS_PARKING_SET}/records?${new URLSearchParams({ where: `in_bbox(geo_point_2d,${y0},${x0},${y1},${x1})`, select: "typsta,locsta,lon,lar,nomvoie,geo_point_2d", limit: "100", offset: String(offset) })}`);
    out.push(...(json.results || []));
    if ((json.results || []).length < 100) break;
  }
  return { features: [], kerbParking: parisParking(out), parisParking: true };
}

export const sources = {
  osm: (lat, lon, radius) => osmTiles(lat, lon, radius),
  surfaces,
  lines,
  parking,
  podlaznost,
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: the towns' maps (their AREAS).
export const SURFACE_MAPS = Object.keys(FR_TOWNS);
