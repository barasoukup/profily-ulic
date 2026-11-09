// Plzeň: the city's GIS (ags.plzen.eu) answers the browser directly (CORS). Its technical map (DTM in the
// JVF DTM model of the DMVS) covers the whole ground, as Prague's MTVU does: roadways, sidewalks, cycle
// paths, parking areas, tram beds, buildings, yards, gardens and green. Its lines give fences, walls,
// railings and guard rails. The city's passports add trees, benches, bike stands and bollards, and its 3D
// buildings (2024, joined with RÚIAN) the floors, heights, age and walls of a house.
//
// A town module (towns/<id>.js, listed in towns/index.js) gives sources.js the five data sources of a
// click (osm, surfaces, lines, parking, podlaznost; the shapes are those of Prague's answers, see
// queries.js) and app.js its base maps. See towns/jihlava.js.
import { query, envelope, osmTiles, boxAround, asMtvu, addPoints, ruianBuilding, RUIAN_HALL, RUIAN_LOW } from "../gis.js";
import { MTVU_LABELS } from "../city.js";

const PL = "https://ags.plzen.eu/arcgis/rest/services";
const PL_ZPS = `${PL}/GIS_DTM/GIS_DTM_ZPS_kesovana`;
const PL_BUILDINGS = `${PL}/GIS_3D_budovy/GIS_Budovy_Plzen_2024_1/FeatureServer/5/query`;
const PL_PASPORT = `${PL}/GIS_Pasporty`;
// The city's services turn S-JTSK into WGS 84 by another transformation (15965) than ČÚZK, IPR and the
// orthophotos (S_JTSK_To_WGS_1984_1, 1623): about 12 m off OSM in Plzeň. A layer's query takes
// datumTransformation=1623 (for its input geometry too). The query of many layers at once and the 3D
// buildings do not take it: their input is moved into the service's WGS 84 by the difference and their
// answers back (it varies by under 0.2 m over the city).
const PL_DATUM = { datumTransformation: 1623 };
const PL_SHIFT = [5.36e-5, 1.01e-4]; // lon, lat
const plQuery = (url, params) => query(url, { ...params, ...PL_DATUM });
const none = () => ({ features: [] });

const shiftBox = (bbox) => bbox.split(",").map(Number).map((v, i) => v + PL_SHIFT[i % 2]).join(",");
const unshift = (pts) => pts.map(([x, y]) => [x - PL_SHIFT[0], y - PL_SHIFT[1]]);

// Areas of the technical map → MTVU codes, or a function of the attributes giving one (as
// tools/build_dtm_brno.py reads the DTM of the region). The first area holding a point wins: tram beds,
// cycle paths, parking and sidewalks lie on top of the roadway, bridge decks (a roadway and its sidewalks
// alike) come last. Roofs over the ground (zastřešení) and underground objects are left out.
const PL_SURFACES = [
  [307, 705], // tramvajová dráha
  [300, 703], // cyklostezka
  [301, 704], // parkoviště, odstavná plocha
  [299, 702], [302, 702], [304, 702], [311, 702], [338, 702], [342, 702], // chodník, ostrůvek, nájezd, nástupiště, schodiště, rampa
  [298, 701], [318, 701], // provozní plocha pozemní komunikace, mostní váha
  // Přidružená plocha: in Plzeň mostly verges and dirt tracks beside a road (test č. 21), not its roadway:
  // paved as a paved area, else as green (estimate).
  [305, (a) => (a.PrevazujiciPovrch >= 1 && a.PrevazujiciPovrch <= 4 ? 1003 : [402, true])],
  [297, 601], // budova
  [339, 602], [337, 602], [340, 602], [343, 602], [344, 602], [345, 602], [347, 602], [334, 602], [336, 602], [348, 602],
  [349, 603], // dvůr, nádvoří
  [303, 401], [358, 401], [359, 401], // dělicí pás, udržovaná zeleň, vegetační mísa
  [310, 402], [326, 402], [335, 402], [357, 402], // příkop, násep; meliorační žlab; hřbitov; nevyužívaná plocha
  [355, 300], [356, 200], [354, 100], // zahrada, les, zemědělská plocha
  [352, 501], [325, 501], [353, 502], [319, 502], [320, 502], [321, 503],
  [333, 901], [312, 1003], [306, 1100], // hřiště, manipulační plocha, železnice
  [313, 700], // plocha mostní konstrukce
];
const FIELDS = { 305: "PrevazujiciPovrch" };
// Lines of the technical map → the codes of IPR's line layer (derive.js FENCE_LINES and the rest).
const PL_LINES = { 69: 61210, 71: 71210, 88: 71210, 78: 61530, 87: 71522 }; // plot, zeď, protihluková stěna, zábradlí, svodidlo
const LEVEL = "UrovenUmisteniObjektuZPS";

// One query of the feature service for all areas and lines of a cut (surfaces and lines ask with the same
// envelope), objects under the ground left out.
const zpsCache = new Map();
const zps = (bbox) => {
  if (!zpsCache.has(bbox)) {
    if (zpsCache.size > 8) zpsCache.delete(zpsCache.keys().next().value);
    const ids = [...PL_SURFACES.map(([id]) => id), ...Object.keys(PL_LINES).map(Number)];
    const layerDefs = JSON.stringify(ids.map((layerId) => ({ layerId, where: `${LEVEL} IS NULL OR ${LEVEL} >= 0`, outFields: [LEVEL, FIELDS[layerId]].filter(Boolean).join(",") })));
    zpsCache.set(bbox, query(`${PL_ZPS}/FeatureServer/query`, { ...envelope(shiftBox(bbox)), layerDefs }).then((json) => {
      const byId = {};
      for (const l of json.layers || []) {
        for (const f of l.features || []) {
          if (f.geometry?.rings) f.geometry.rings = f.geometry.rings.map(unshift);
          if (f.geometry?.paths) f.geometry.paths = f.geometry.paths.map(unshift);
        }
        byId[l.id] = l;
      }
      return byId;
    }).catch((err) => { zpsCache.delete(bbox); throw err; }));
  }
  return zpsCache.get(bbox);
};

// Areas above the ground (bridges, footbridges) carry LEVEL 1: derive.js uses them only for a cut on a bridge.
async function surfaces(bbox) {
  const layers = await zps(bbox);
  const codeOf = (code, a) => (typeof code === "function" ? code(a) : code);
  const json = asMtvu(PL_SURFACES.map(([id, code]) => [layers[id], (a) => (a[LEVEL] > 0 ? null : codeOf(code, a))]), MTVU_LABELS);
  const above = asMtvu(PL_SURFACES.map(([id, code]) => [layers[id], (a) => (a[LEVEL] > 0 ? codeOf(code, a) : null)]), MTVU_LABELS);
  for (const f of above.features) f.attributes.LEVEL = 1;
  return { features: [...json.features, ...above.features] };
}

async function lines(bbox) {
  const layers = await zps(bbox);
  const features = [];
  for (const [id, code] of Object.entries(PL_LINES)) {
    for (const f of layers[id]?.features || []) {
      if (f.geometry?.paths && !(f.attributes?.[LEVEL] > 0)) features.push({ attributes: { CTMTP_KOD: code }, geometry: f.geometry });
    }
  }
  return { features };
}

// OSM around a point plus the city's trees (not felled), benches, bike stands and bollards where OSM has
// no such thing nearby. Each layer: its url, the fields it needs, its filter and the OSM tags of a feature.
const PL_POINTS = [
  [`${PL_PASPORT}/GIS_PAS_ZEL_ukazka/FeatureServer/1/query`, "POKACEN", "POKACEN IS NULL OR POKACEN = 0", () => ({ natural: "tree" })],
  [`${PL_PASPORT}/GIS_PAS_MOB_ukazka/FeatureServer/6/query`, "OBJECTID", "1=1", () => ({ amenity: "bench" })],
  [`${PL_PASPORT}/GIS_PAS_MOB_ukazka/FeatureServer/9/query`, "OBJECTID", "1=1", () => ({ amenity: "bicycle_parking" })],
  [`${PL_PASPORT}/GIS_PAS_MOB_ukazka/FeatureServer/44/query`, "OBJECTID", "1=1", () => ({ barrier: "bollard" })],
];
async function osm(lat, lon, radius) {
  const box = boxAround(lat, lon, radius);
  const [o, ...pts] = await Promise.all([
    osmTiles(lat, lon, radius),
    ...PL_POINTS.map(([url, outFields, where]) => plQuery(url, { ...envelope(box), outFields, where }).catch(none)),
  ]);
  return addPoints(o, pts, PL_POINTS.map(([, , , tagsOf]) => tagsOf), "Plzeň", lat);
}

// Parking: the parking areas of the technical map are among the surfaces (704). The city's layer of
// parking places (GIS_Doprava) holds car parks off the street only, and Plzeň publishes no stalls.
const parking = async () => none();

// A house from the city's 3D buildings (2024): RÚIAN's floors, use, completion and walls, and the measured
// heights of eaves and ridge above the ground. Without floors in RÚIAN they come from the height of the
// eaves; a ridge well above the eaves is a pitched roof (IPR's roof codes: 1 pitched, 3 flat). A point
// outside the 3D buildings asks RÚIAN itself.
const FLOOR = 3.2; // m, eaves height per floor
const PANEL = new Set([4, 41, 42, 43]);
async function podlaznost(lat, lon) {
  let a;
  try {
    const json = await query(PL_BUILDINGS, {
      geometry: `${lon + PL_SHIFT[0]},${lat + PL_SHIFT[1]}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects",
      outFields: "RELVYS_BUD,RELVYS_OKA,PocetPodlazi,ZpusobVyuzitiKod,Dokonceni,DruhKonstrukceKod,ZastavenaPlocha", returnGeometry: "false", f: "json",
    });
    a = json.features?.[0]?.attributes;
  } catch {}
  if (!a) return ruianBuilding(lat, lon);
  const { RELVYS_BUD: ridge, RELVYS_OKA: eaves, PocetPodlazi: floors, ZpusobVyuzitiKod: use, Dokonceni: built, DruhKonstrukceKod: walls, ZastavenaPlocha: area } = a;
  const pitched = ridge > 0 && eaves > 0 && ridge - eaves > 1.5;
  const byHeight = eaves > 2 ? Math.max(1, Math.round(eaves / FLOOR)) : 0;
  // RÚIAN counts floors in the roof too: those above the eaves are drawn as roof floors.
  const cornice = floors ? (pitched && byHeight ? Math.min(floors, byHeight) : floors) : byHeight;
  if (!cornice) return ruianBuilding(lat, lon);
  return {
    cornice, roof: floors ? floors - cornice : 0, total: floors || cornice, roofType: ridge > 0 && eaves > 0 ? (pitched ? 1 : 3) : undefined,
    kind: RUIAN_HALL.has(use) ? 3 : RUIAN_LOW.has(use) ? 6 : undefined, newBuild: false, area: area || undefined,
    built: built ? new Date(built).getUTCFullYear() : undefined, panel: PANEL.has(walls) || undefined,
  };
}

export const sources = { osm, surfaces, lines, parking, podlaznost };

// Base maps: the city's orthophoto (2024, 5 cm) and technical map, drawn by its GIS as export images in
// Web Mercator (its caches are in S-JTSK; ArcgisExport asks for the transformation 1623), with OSM
// underneath for the zoomed-out view.
const ORTHO = `${PL}/Orto_2024_5cm_RGB_mimoveg/MapServer`;
export function maps({ ArcgisExport, BIG_TILES, osm: osmLayer, cuzk }) {
  return {
    base: {
      "Ortofoto Plzeň": [osmLayer(1), new ArcgisExport("", { service: ORTHO, minZoom: 15, maxZoom: 21, ...BIG_TILES, attribution: "ortofoto 2024 © Statutární město Plzeň" })],
      "Technická mapa": [osmLayer(0.5), new ArcgisExport("", { service: `${PL_ZPS}/MapServer`, minZoom: 17, maxZoom: 21, ...BIG_TILES, attribution: "technická mapa © Statutární město Plzeň" })],
      "Ortofoto ČÚZK": [cuzk()],
      "OpenStreetMap": [osmLayer(1)],
    },
    default: "Ortofoto Plzeň",
    lines: new ArcgisExport("", { service: `${PL}/GIS_DTM/GIS_DTM_ZPS_linie_body/MapServer`, maxZoom: 21, minZoom: 17, ...BIG_TILES, opacity: 0.9, attribution: "technická mapa © Statutární město Plzeň" }),
  };
}

// The orthophoto for the evaluation (evaluation/run_brno.mjs): an ArcGIS export in Web Mercator.
export const ortho = { service: `${ORTHO}/export`, datum: 1623 };
