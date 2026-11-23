// Portugal (Bára 23. 11. 2026): the state of a cut inside staty.json's "portugal" (with Madeira and the Azores). No Czech
// technical map, RÚIAN or ČÚZK orthophoto is asked: the profile is the estimate from OSM and DGT's orthophotos
// (lanes-ortho.js "pt": the aerial of 2025, else 2021, else 2018, else the satellite mosaic of 2023; only on the mainland,
// Madeira and the Azores have none of them: there OSM alone). Sources and what was looked for: evaluation/portugal/ZDROJE.md.
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
