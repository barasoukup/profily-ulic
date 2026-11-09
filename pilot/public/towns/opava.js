// Opava: the town's GIS (mapy.opava-city.cz, ArcGIS, folder "external") answers the browser directly
// (CORS): the surfaces of the town's map of the ground (Účelová mapa povrchové situace – plochy: roadway,
// sidewalk, paved areas, lawns, gardens, buildings, walls and fence bases as polygons, drawn by CAD), the
// parking stalls of the paid zones, trees, benches, stops (with their shelters) and bike stands; floors of
// the buildings from RÚIAN of ČÚZK.
//
// A town module (towns/<id>.js, listed in towns/index.js) gives sources.js the five data sources of a
// click (osm, surfaces, lines, parking, podlaznost; see towns/jihlava.js) and app.js its base maps.
import { query, envelope, osmTiles, boxAround, asMtvu, addPoints, ruianBuilding } from "../gis.js";
import { MTVU_LABELS } from "../city.js";

const OP = "https://mapy.opava-city.cz/server/rest/services";
const OP_EXT = `${OP}/external`;
const OP_PLOCHY = `${OP_EXT}/info_dtm_plochy_find/MapServer/0/query`;
const OP_ZPS = `${OP_EXT}/dopr_zps/MapServer`;
const OP_TECH = `${OP}/basemaps/basemap_umpspro/MapServer`;
// The town's services turn S-JTSK into WGS 84 by 15965 by default, about 4 m east of OSM and RÚIAN
// in Opava: answers come with S_JTSK_To_WGS_1984_1 (1623), within 0.1 m of RÚIAN's corners. The point
// queries go to RÚIAN (ČÚZK), which needs no shift.
const OP_DATUM = { datumTransformation: 1623 };
const opQuery = (url, params) => query(url, { ...params, ...OP_DATUM });
const none = () => ({ features: [] });

// The map of the ground is asked once per cut for the surfaces and again for the walls and fences.
// The roadways of the town's streets are four polygons of 50 to 430 rings each (0.2 to 1 km², the largest
// 59 000 vertices), one of them labelled "Cesta" and three by mistake as a brick building ("Bud-zděná"),
// a sidewalk and a paved area: no building lies in them, two thirds of OSM's street axes around do. They
// are asked apart, generalized to 0.2 m (2.4 MB → 0.1 MB for the largest), and read as roadway.
const OP_BIG = "Shape_Area > 100000 AND (POPIS LIKE 'Bud%' OR POPIS LIKE 'Chodn%' OR POPIS LIKE 'Zpevn%' OR POPIS = 'Cesta')";
const plochyCache = new Map();
const plochy = (bbox) => {
  if (!plochyCache.has(bbox)) {
    if (plochyCache.size > 8) plochyCache.delete(plochyCache.keys().next().value);
    plochyCache.set(bbox, Promise.all([
      opQuery(OP_PLOCHY, { ...envelope(bbox), outFields: "POPIS", where: `NOT (${OP_BIG})` }),
      opQuery(OP_PLOCHY, { ...envelope(bbox), outFields: "OBJECTID", where: OP_BIG, maxAllowableOffset: 0.000002, geometryPrecision: 7 }),
    ]).then(([rest, big]) => ({
      // Last: where it overlaps a surface drawn on its own, that one wins.
      features: [...(rest.features || []), ...(big.features || []).map((f) => ({ ...f, attributes: { POPIS: ROADWAYS } }))],
    })).catch((err) => { plochyCache.delete(bbox); throw err; }));
  }
  return plochyCache.get(bbox);
};
const ROADWAYS = "vozovky";

// Kinds of the map of the ground (POPIS) → MTVU codes. "SN" (shora neviditelná) is ground under a roof
// or a passage; a building with a passage under it (podchodná) is left out, so the ground shows.
// Footings, gutters and expansion joints are left out (the surface around them goes on), walls and fence
// bases are narrow "other structures" (the line layer below turns them into walls and fences).
const OP_BUILDINGS = new Set(["Bud-zděná", "Bud-dřevěná", "Bud-lehká", "Budova-Ortofoto", "Budova-Katastr"]);
const OP_CODES = {
  [ROADWAYS]: 701, "Cesta": 701, "Cesta SN - shora neviditelná": 701,
  "Chodník": 702, "Chodník SN - shora neviditelný": 702, "Schody": 702, "Schody-prostranství": 702,
  "Schody SN - shora neviditelné": 702, "Rampa": 702, "Přístřešek-zastávka": 702,
  "Zpevněná plocha": 1003, "Zpevněná plocha SN": 1003, "Hospodářský vjezd": 1003, "Stanoviště kontejneru": 1003,
  "Anglický dvorek": 603, "Atrium": 603,
  "Trávník": 401, "Záhon": 401, "Skupiny keřů": 401, "Skupiny stromů": 401, "Skupiny stromů a keřů": 401,
  "Nepolodná půda": 401, "Nezpevněná plocha": 401, "Nezpevněná plocha SN": 401, "Louka": 401, "Hřbitov": 402,
  "Zahrada": 300, "Ovocný sad": 300, "Orná půda": 100,
  "Les jehličnatý": 200, "Les smíšený": 200, "Les listnatý": 200,
  "Hřiště": 901, "Pískoviště": 901, "Umělý povrch": 901, "Bazén": 901,
  "Vodní tok": 501, "Jez": 501, "Voda": 501, "Močál": 501, "Vodní nádrž": 502,
  "Zeď opěrná": 602, "Zeď opěrná SN - shora neviditelná": 602, "Zeď okrasná": 602, "Zeď protihluková": 602,
  "Podezdívka plotu": 602,
};
const popis = (a) => (a.POPIS || "").trim();

// Buildings first (a stop shelter or an SN surface may lie under a roof), then the rest.
async function surfaces(bbox) {
  const p = await plochy(bbox);
  return asMtvu([
    [p, (a) => (OP_BUILDINGS.has(popis(a)) ? 601 : null)],
    [p, (a) => OP_CODES[popis(a)] ?? null],
  ], MTVU_LABELS);
}

// Walls and fence bases of the map of the ground → the codes of IPR's line layer (derive.js FENCE_LINES
// and TECH_ITEM): their outlines cross the cut where the wall or fence stands. A retaining wall is an
// item of the profile, a garden wall, a noise barrier or a fence ends the street. The town's CAD lines
// (info_dtm_liniova) carry only level numbers without a key, and its layer of fences (basemap_umpspro 49)
// only draws, so a fence without a base is known from OSM alone.
const OP_LINE_CODES = { "Podezdívka plotu": 61210, "Zeď okrasná": 71210, "Zeď protihluková": 71210, "Zeď opěrná": 71422 };
async function lines(bbox) {
  const p = await plochy(bbox);
  const features = [];
  for (const f of p.features || []) {
    const code = OP_LINE_CODES[popis(f.attributes || {})];
    if (code && f.geometry?.rings) features.push({ attributes: { CTMTP_KOD: code }, geometry: { paths: f.geometry.rings } });
  }
  return { features };
}

// OSM around a point plus the town's trees, benches, stop shelters and bike stands where OSM has no such
// thing nearby. The town keeps no points of its street lamps (only lines of lighting per street).
// Each layer: its url, the fields it needs, and the OSM tags of a feature (null: not drawn).
const OP_POINTS = [
  [`${OP_EXT}/zipr_stromykere_V/MapServer/0/query`, "OBJECTID_1", () => ({ natural: "tree" })],
  // The benches' map layer hides its geometry; the feature layer gives it.
  [`${OP_EXT}/mmi_lavicky_V/FeatureServer/0/query`, "OBJECTID", () => ({ amenity: "bench" })],
  [`${OP_EXT}/dopr_mhd_V/MapServer/0/query`, "Zastreseni", (a) => (a.Zastreseni === "krytá" ? { amenity: "shelter", shelter_type: "public_transport", bus: "yes" } : null)],
  [`${OP_EXT}/dopr_cyklodoprava_V/MapServer/6/query`, "OBJECTID_1", () => ({ amenity: "bicycle_parking" })],
];
async function osm(lat, lon, radius) {
  const box = boxAround(lat, lon, radius);
  const [o, ...pts] = await Promise.all([
    osmTiles(lat, lon, radius),
    ...OP_POINTS.map(([url, outFields]) => opQuery(url, { ...envelope(box), outFields }).catch(none)),
  ]);
  return addPoints(o, pts, OP_POINTS.map(([, , tagsOf]) => tagsOf), "Opava", lat);
}

// Parking stalls of the paid zones (short-term, mid-term, residents' cards, disabled), one polygon per
// stall or row of stalls with its road marking (TYP, V 10a–g; V 10f is a stall for the disabled, as all of
// layer 9). derive.js reads the orientation from the polygon's depth.
const OP_PARKING_LAYERS = [2, 3, 4, 9];
async function parking(bbox) {
  const layers = await Promise.all(OP_PARKING_LAYERS.map((n) =>
    opQuery(`${OP_ZPS}/${n}/query`, { ...envelope(bbox), outFields: "TYP" }).then((json) => [n, json])));
  const features = [];
  for (const [n, json] of layers) {
    for (const f of json.features || []) {
      if (!f.geometry?.rings) continue;
      const special = n === 9 || /^V10f/.test(f.attributes?.TYP || "");
      features.push({ attributes: { KIND: special ? "specialni" : "useky", PS_ZPS: 1 }, geometry: f.geometry });
    }
  }
  return { features };
}

// Floors, use, year and walls of a building from RÚIAN of ČÚZK (gis.js): the town's building layer
// (budovymmo) holds only the town hall's own buildings.
const podlaznost = ruianBuilding;

export const sources = { osm, surfaces, lines, parking, podlaznost };

// Base maps: the town's technical map (its caches are in S-JTSK, so an export image in Web Mercator with
// the datum of the data above), the ČÚZK orthophoto (the town's orthophoto service is a copy of ČÚZK's)
// and OSM. ctx: { L, ArcgisExport, BIG_TILES, osm (an OSM layer), cuzk (the ČÚZK orthophoto) } from app.js.
export function maps({ ArcgisExport, BIG_TILES, osm: osmLayer, cuzk }) {
  const tech = (opts) => new ArcgisExport("", { service: OP_TECH, maxZoom: 21, ...BIG_TILES, attribution: "účelová mapa © Statutární město Opava", ...opts });
  return {
    base: {
      "Ortofoto ČÚZK": [cuzk()],
      "Účelová mapa": [osmLayer(0.5), tech({ minZoom: 16 })],
      "OpenStreetMap": [osmLayer(1)],
    },
    default: "Ortofoto ČÚZK",
    // The technical map draws only as a whole (its cached service ignores a choice of layers): no overlay.
    lines: null,
  };
}

// No orthophoto of its own: the evaluation (evaluation/run_brno.mjs) takes ČÚZK's.
export const ortho = null;
