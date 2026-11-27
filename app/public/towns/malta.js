// Malta (Bára 23. 11. 2026): the state of a cut inside staty.json's "malta" (OSM's boundary with the territorial waters).
// No street surfaces, parking nor buildings with floors are published: the profile is the estimate from OSM and the
// Planning Authority's orthophoto of 2018 (lanes-ortho.js "mt"). Sources: evaluation/malta/ZDROJE.md.
import { osmTiles } from "../gis.js";

export const sources = {
  osm: (lat, lon, radius) => osmTiles(lat, lon, radius),
  surfaces: async () => ({ features: [], abroad: true }),
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost: async () => ({}),
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers: none (the estimate from the orthophoto and OSM).
export const SURFACE_MAPS = [];
