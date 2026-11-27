// A place in no state the app knows (cizina: the margins of the OSM extracts beyond the borders): OSM only, no
// technical map, no passport, no national map (the estimate from OSM, app.js and ortho-osm.js). The answers have the
// shape of the Slovak sources' with nothing in them.
import { osmTiles } from "../gis.js";

export const sources = {
  osm: (lat, lon, radius) => osmTiles(lat, lon, radius),
  surfaces: async () => ({ features: [], abroad: true }),
  lines: async (bbox) => (bbox ? { features: [], edges: [], edgesFrom: undefined, symbols: [], widths: [], areas: [] } : { features: [] }),
  parking: async () => ({ features: [] }),
  podlaznost: async () => ({}),
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: none (the estimate from the orthophoto and OSM).
export const SURFACE_MAPS = [];
