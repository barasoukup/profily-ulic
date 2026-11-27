// Cyprus (Bára 23. 11. 2026): the state of a cut inside states.json's "cyprus" (GISCO's island). No city publishes its
// street surfaces: the profile is the estimate from OSM and the DLS orthophoto (lanes-ortho.js "cy"). The buildings of
// the DLS (INSPIRE BU3, CC BY 4.0): floors, height and type (the roof type is not read). In the north and on the British bases the DLS has nothing (the
// estimate from OSM alone). Sources: evaluation/cyprus/SOURCES.md.
import { osmTiles, getJSON } from "../gis.js";

const param = (k) => (typeof location === "undefined" ? globalThis.PROFILY_CY?.[k] ?? null : new URLSearchParams(location.search).get(k));
export const DLS_BUILDINGS = "https://eservices.dls.moi.gov.cy/inspire/rest/services/INSPIRE/BU_Buildings/MapServer/6/query";

// A DLS building → the facts of app.js ruianFacts and an OSM building type for profile.js (as BD TOPO in France).
export function dlsBuilding(a) {
  const kind = String(a?.B_TYPE || "").toLowerCase().replace(/\s+/g, " ").trim();
  const floors = a?.FLOOR_QTY > 0 ? Math.round(a.FLOOR_QTY) : undefined;
  const church = /church|mosque|monastery|religious/.test(kind);
  const industrial = /industrial|agricultur/.test(kind);
  const office = /commercial|office/.test(kind) ? true : undefined;
  const type = church ? "church" : industrial ? "industrial" : office ? "office" : /high residential/.test(kind) ? "apartments" : /low ?residential/.test(kind) ? "house" : undefined;
  return { office, house: type === "house" || undefined, type,
    ...(floors && { cornice: floors, total: floors, roof: 0, fromHeight: false, height: a.H_ROOF_A_1 > 0 ? Math.round(a.H_ROOF_A_1 * 10) / 10 : undefined }) };
}
async function podlaznost(lat, lon) {
  if (param("dls") === "0") return {};
  const json = await getJSON(`${DLS_BUILDINGS}?${new URLSearchParams({ geometry: `${lon},${lat}`, geometryType: "esriGeometryPoint", inSR: "4326", distance: "1", units: "esriSRUnit_Meter",
    spatialRel: "esriSpatialRelIntersects", outFields: "B_TYPE,FLOOR_QTY,H_ROOF_A_1", returnGeometry: "false", f: "json" })}`);
  const f = (json?.features || []).sort((x, y) => (y.attributes.FLOOR_QTY || 0) - (x.attributes.FLOOR_QTY || 0))[0];
  // dls: the credit only for a cut with a house of the DLS (credits.js cyDls; before, every Cypriot cut had it).
  return f ? { ...dlsBuilding(f.attributes), dls: true } : {};
}

export const sources = {
  osm: (lat, lon, radius) => osmTiles(lat, lon, radius),
  surfaces: async () => ({ features: [], abroad: true }),
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost,
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: none (the estimate from the orthophoto and OSM).
export const SURFACE_MAPS = [];
