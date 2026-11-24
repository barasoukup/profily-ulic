// Anywhere in the Czech Republic outside the cities with their own sources: the same as Pardubice, which
// has no GIS of its own either (the national DTM of ČÚZK read live, RÚIAN houses, the OSM tiles), with the
// road and green passports of a few towns over it where the cut lies in one of them (towns/pasporty.js).
import { sources as pardubice } from "./pardubice.js";
import { withPassports } from "./pasporty.js";
export { national, ortho } from "./pardubice.js";
export const sources = { ...pardubice, surfaces: withPassports(pardubice.surfaces) };

// The overview map of the About dialog (tools/build_coverage.mjs): where this module's own map of the street surfaces
// answers. "all": the whole of Czechia (the DMVS technical map of ČÚZK, the towns' passports over it).
export const SURFACE_MAPS = ["all"];
