// Austria (Bára 16. 11. 2026): the state of a cut inside staty.json's Austria. As in Slovakia, no Czech technical map,
// RÚIAN or ČÚZK orthophoto is asked: the profile is the estimate from OSM and basemap.at's orthophoto (app.js,
// ortho-osm.js, lanes-ortho.js "at"), the houses are OSM's. Cities' own data (Vienna's Mehrzweckkarte…) come with
// their A/B tests (evaluation/austria/).
import { osmTiles } from "../gis.js";

async function osm(lat, lon, radius) {
  return osmTiles(lat, lon, radius);
}

export const sources = {
  osm,
  surfaces: async () => ({ features: [], abroad: true }),
  lines: async () => ({ features: [], edges: [], widths: [], areas: [] }),
  parking: async () => ({ features: [] }),
  podlaznost: async () => ({}),
};

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;
