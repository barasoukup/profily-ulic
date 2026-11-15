// Outside the Czech Republic (Bára 15. 11. 2026): Slovakia, and the margins of the OSM extracts beyond the borders
// ("cizina"). Only the OSM tiles are read: the technical map of ČÚZK (DMVS) and RÚIAN cover the Czech Republic only
// (the DMVS answers outside it without CORS, which looked like an outage), so they are not asked at all. The surfaces
// are none, so the profile is the estimate from OSM and the orthophoto (app.js, ortho-osm.js); the houses' floors
// are OSM's building:levels.
import { osmTiles } from "../gis.js";

// abroad: the surfaces are missing on purpose (sources.js outage says the profile is an estimate outside Czechia).
const none = async () => ({ features: [], abroad: true });
const nothing = async () => ({});

export const sources = { osm: osmTiles, surfaces: none, lines: async () => ({ features: [] }), parking: async () => ({ features: [] }), podlaznost: nothing };

// No fallback to the DMVS (sources.js national).
export const national = true;
export const ortho = null;
