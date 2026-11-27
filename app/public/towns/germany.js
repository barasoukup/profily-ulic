// Germany (Bára 17. 11. 2026): the state of a cut inside states.json's Germany. As in Austria, no Czech technical map,
// RÚIAN or ČÚZK orthophoto is asked: the profile is the estimate from OSM and the orthophoto of the Land (app.js,
// ortho-osm.js, lanes-ortho.js), the houses are OSM's. Cities' own maps of street surfaces where they have them
// (Bára: "ortofoto je minimum, ne optimum"), each with its A/B test (evaluation/germany/ab/):
// - Berlin: Straßenbefahrung 2014 (gdi.berlin.de WFS, CORS *, dl-de/zero-2-0): roadways, sidewalks, cycle tracks,
//   parking, green, tram beds, medians, stop areas of all public streets. ?berlin=0 leaves it out.
// - Hamburg: Feinkartierung Straße (api.hamburg.de OGC API Features, CORS *, dl-de/by-2-0 "Freie und Hansestadt
//   Hamburg"): the surfaces of the main and district roads with their use (even cycle and bus lanes) and material.
//   ?hamburg=0 leaves it out.
// - Aachen: the surfaces of the Straßendatenbank, mostly from a survey of 2022 (geoserver.aachen.de WFS, CORS *,
//   dl-de/zero-2-0 "Stadt Aachen"): roadway, gutter, sidewalk, cycle tracks and lanes, parking, green, islands.
//   ?aachen=0 leaves it out.
// As in Slovakia's passports: the city's surfaces with OSM's buildings before them and OSM's green and water after,
// only where the city has a surface of the street at the cut's centre (elsewhere the estimate); a city whose service
// does not answer: the estimate, with a note.
import { osmTiles, getJSON, asMtvu, asPassport } from "../gis.js";
import { MTVU_LABELS } from "../city.js";
import { inArea } from "../places.js";
import { osmAreas } from "./slovakia.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_DE?.[k] ?? null : new URLSearchParams(location.search).get(k));
// The territories of the cities' maps (places.js inArea; the services are empty outside the city anyway).
export const AREAS = { berlin: { box: [13.08, 52.33, 13.77, 52.68] }, hamburg: { box: [9.72, 53.39, 10.34, 53.74] }, aachen: { box: [5.97, 50.63, 6.22, 50.86] } };

// Berlin: the area layers of the Straßenbefahrung → MTVU codes (city.js MTVU_LABELS). Tree pits, driveway crossings,
// stairs and ramps belong to the sidewalk they lie in; a median (Trennstreifen) is paved or green, its material code
// has no public legend: other paved area, the orthophoto tells grass (derive.js surfaceLook).
export const BERLIN_WFS = "https://gdi.berlin.de/services/wfs/strassenbefahrung";
export const BERLIN_LAYERS = { cm_fahrbahn: 701, ca_haltebereich_bus: 701, cl_gehweg: 702, cj_fussgaengerzone: 702, cb_haltestellenwartebereich: 702,
  by_gehwegueberfahrt: 702, cc_treppe: 702, cd_rampe: 702, bn_baumscheibe: 702, ch_radweg: 703, ck_parkflaeche: 704, bz_gleiskoerper_strab: 705,
  ce_gruenflaeche: 401, cf_trennstreifen: 1003, ci_oeffentlicher_platz: 1003 };
async function berlin(bbox) {
  // WFS 1.1 takes several types with a bbox in one request (2.0 refuses the bbox for more than one type).
  const json = await getJSON(`${BERLIN_WFS}?${new URLSearchParams({ service: "WFS", version: "1.1.0", request: "GetFeature",
    typeName: Object.keys(BERLIN_LAYERS).map((l) => `strassenbefahrung:${l}`).join(","), outputFormat: "application/json", srsName: "EPSG:4326",
    bbox: `${bbox},EPSG:4326` })}`);
  return geoRings(json, (f) => BERLIN_LAYERS[String(f.id).split(".")[0]]);
}

// Hamburg: the use (nutzung) of the Feinkartierung → MTVU codes; cycle, bus and protected lanes lie in the roadway
// (OSM and the orthophoto give the lanes); anything else by its category.
export const HAMBURG_API = "https://api.hamburg.de/datasets/v1/feinkartierung_strasse/collections/strassenflaechen/items";
const HAMBURG_USE = { Fahrbahn: 701, Mischverkehrsfläche: 701, Busbuchten: 701, Bussonderstreifen: 701, Radfahrstreifen: 701, Schutzstreifen: 701,
  Gehweg: 702, Fußgängerzone: 702, Treppe: 702, Überfahrt: 702, "gemeinsamer Geh- und Radweg": 702, "Parkplätze Radverkehr": 702, Fahrgastunterstand: 702,
  Radweg: 703, "Parkplätze Kfz": 704, Grünfläche: 401, Wasserfläche: 501, "sonstige bzw. nicht-Verkehrsflächen": 1003 };
const HAMBURG_KIND = { Verkehrsflächen: 1003, Grünflächen: 401, Wasserflächen: 501, "sonstige Flächen": 1003 };
export const hamburgCode = (p) => (/tunnel|unter/i.test(p.ebene || "") ? null : HAMBURG_USE[p.nutzung] ?? HAMBURG_KIND[p.kategorie] ?? null);
async function hamburg(bbox) {
  const features = [];
  let url = `${HAMBURG_API}?${new URLSearchParams({ f: "json", limit: "1000", bbox })}`;
  // A cut's box has a few hundred surfaces; more come on the next page (at most three).
  for (let page = 0; url && page < 3; page++) {
    const json = await getJSON(url);
    features.push(...(json.features || []));
    url = (json.links || []).find((l) => l.rel === "next")?.href || null;
  }
  return geoRings({ features }, (f) => hamburgCode(f.properties || {}));
}

// Aachen: feat_type → MTVU codes; a gutter, a bus bay and a cycle lane on the roadway are roadway; under- and
// overpasses (level) are left out (not the street of the cut).
export const AACHEN_WFS = "https://geoserver.aachen.de/opendata/strassendatenbank/wfs";
const AACHEN_TYPE = { Fahrbahn: 701, Rinne: 701, Busbucht: 701, "Fahrradweg auf Fahrbahn": 701, Gehweg: 702, Fahrradweg: 703, Parkplatz: 704,
  Gruenflaeche: 401, Verkehrsinsel: 1003, Sonstiges: 1003, Bahngleis: 1100 };
export const aachenCode = (p) => (p.level ? null : AACHEN_TYPE[p.feat_type] ?? null);
async function aachen(bbox) {
  const json = await getJSON(`${AACHEN_WFS}?${new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature",
    typeNames: "strassendatenbank:logo_flaechen", outputFormat: "application/json", srsName: "EPSG:4326", count: "3000",
    propertyName: "feat_type,level,wkb_geometry", bbox: `${bbox},EPSG:4326` })}`);
  return geoRings(json, (f) => aachenCode(f.properties || {}));
}

// GeoJSON polygons as the ESRI-like features asMtvu takes, with their code.
function geoRings(json, code) {
  return {
    features: (json?.features || []).map((f) => {
      const g = f.geometry;
      const rings = g?.type === "Polygon" ? g.coordinates : g?.type === "MultiPolygon" ? g.coordinates.flat() : null;
      const c = code(f);
      // Berlin's Gleiskörper takes in tracks in the asphalt too (its art 0 and 1 both): derive.js asks OSM.
      return rings && c ? { attributes: { code: c, ...(String(f.id).startsWith("bz_gleiskoerper_strab.") ? { ANY_TRAM: 1 } : {}) }, geometry: { rings } } : null;
    }).filter(Boolean),
  };
}

const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
const STREET = new Set([701, 702, 703, 704, 705, 1003]);
export const DE_TOWNS = { berlin, hamburg, aachen };
export const deTownAt = (lon, lat) => Object.keys(DE_TOWNS).find((id) => param(id) !== "0" && inArea(AREAS[id], lon, lat)) ?? null;

async function surfaces(bbox) {
  const [x0, y0, x1, y1] = bbox.split(",").map(Number);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const id = deTownAt(cx, cy);
  if (!id) return { features: [], abroad: true };
  let own;
  try {
    own = asMtvu([[await DE_TOWNS[id](bbox), (a) => a.code]], MTVU_LABELS);
  } catch {
    return { features: [], abroad: true, deFailed: id };
  }
  // Only where the city has a surface of the street at the cut's centre or 1.5 m around it.
  const dy = 1.5 / 110574, dx = 1.5 / (111320 * Math.cos((cy * Math.PI) / 180));
  const at = own.features.some((f) => STREET.has(f.attributes.CTVUK_KOD) && [[0, 0], [dx, 0], [-dx, 0], [0, dy], [0, -dy]].some(([ox, oy]) => inRings(f.geometry.rings, cx + ox, cy + oy)));
  if (!at) return { features: [], abroad: true };
  const o = await osmAreas(bbox);
  return { features: [...o.buildings, ...asPassport(own).features, ...o.rest], deTown: id, passport: true };
}

async function osm(lat, lon, radius) {
  return osmTiles(lat, lon, radius);
}

export const sources = {
  osm,
  surfaces,
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost: async () => ({}),
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: the cities' street surfaces (their AREAS).
export const SURFACE_MAPS = Object.keys(DE_TOWNS);
