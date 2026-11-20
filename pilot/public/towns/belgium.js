// Belgium (Bára 20. 11. 2026): the state of a cut inside staty.json's "belgium". No region publishes a map of street
// surfaces with the sidewalks as a web service (evaluation/belgium/ZDROJE.md): the profile is the estimate from OSM and
// the region's orthophoto (lanes-ortho.js "be": Flanders' or Wallonia's), with the lines of the regions' large-scale
// maps as candidates for the kerbs (ortho-osm.js edges), as the Slovak towns' drawings:
// - Flanders: GRB (Grootschalig Referentiebestand, Digitaal Vlaanderen, WFS geo.api.vlaanderen.be, CORS *), the lines
//   of the road's division WGO: the edge of the roadway (wrb), of the zone of pedestrians and cyclists (wcz) and of
//   unpaved land (woz).
// - Wallonia: PICC (Projet Informatique de Cartographie Continue, SPW, ArcGIS geoservices.wallonie.be, CORS for the
//   origin asking), "Voirie - Ligne": the edges of the roadway, sidewalks, parking, cycle tracks and kerbs.
// - Brussels publishes no such lines (UrbIS is a download): the estimate alone.
// ?hrany=0 leaves the lines out (the A/B test, evaluation/belgium/ab/).
import { osmTiles, getJSON, query, envelope } from "../gis.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_BE?.[k] ?? null : new URLSearchParams(location.search).get(k));

export const GRB_WFS = "https://geo.api.vlaanderen.be/GRB/wfs";
export const PICC = "https://geoservices.wallonie.be/arcgis/rest/services/TOPOGRAPHIE/PICC_VDIFF/MapServer/20";
// The PICC's lines that are an edge of a part of the street (not a gutter, a crossing, a marking or a driveway).
export const PICC_EDGE = new Set(["Voirie - Bord", "Trottoir", "Parking", "Piste cyclable - Bord", "Bordure", "Îlot directionnel", "Zone d'arrêt de bus"]);
// WGO's kinds by their label (LBLTYPE): the edge of the roadway, of the zone of pedestrians and cyclists, of unpaved land.
const GRB_LABEL = /rand van de rijbaan|zone zwakke weggebruiker|onverharde zone/;

export const grbPaths = (json) => (json?.features || []).filter((f) => GRB_LABEL.test(f.properties?.LBLTYPE || ""))
  .flatMap((f) => (f.geometry?.type === "LineString" ? [f.geometry.coordinates] : f.geometry?.type === "MultiLineString" ? f.geometry.coordinates : []));
export const piccPaths = (json) => (json?.features || []).filter((f) => PICC_EDGE.has(f.attributes?.NATUR_DESC)).flatMap((f) => f.geometry?.paths || []);

async function grb(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  // WFS 2.0 with the URN of EPSG:4326: the box lat, lon; the answer's GeoJSON lon, lat.
  return grbPaths(await getJSON(`${GRB_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "GRB:WGO",
    srsName: "EPSG:4326", bbox: `${y0},${x0},${y1},${x1},urn:ogc:def:crs:EPSG::4326`, outputFormat: "application/json", count: "2000" })}`));
}
async function picc(bbox) {
  return piccPaths(await query(`${PICC}/query`, { ...envelope(bbox), outFields: "NATUR_DESC", returnGeometry: "true" }));
}

// One request a box (the surfaces and the lines of a cut, a cut moved a little ask the same box).
const memo = new Map();
function edgesAt(bbox) {
  if (!memo.has(bbox)) {
    if (memo.size > 30) memo.delete(memo.keys().next().value);
    // Flanders' lines first; where it has none (Wallonia, Brussels), Wallonia's.
    memo.set(bbox, grb(bbox).catch(() => []).then(async (paths) => (paths.length ? { paths, id: "grb" }
      : { paths: await picc(bbox).catch(() => []), id: "picc" })));
  }
  return memo.get(bbox);
}

async function lines(bbox) {
  if (!bbox || param("hrany") === "0") return { features: [], edges: [], widths: [], areas: [] };
  const e = await edgesAt(bbox);
  return { features: [], edges: e.paths, edgesFrom: e.paths.length ? e.id : null, symbols: [], widths: [], areas: [] };
}

async function osm(lat, lon, radius) {
  return osmTiles(lat, lon, radius);
}

export const sources = {
  osm,
  surfaces: async () => ({ features: [], abroad: true }),
  lines,
  parking: async () => ({ features: [] }),
  podlaznost: async () => ({}),
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;
