// trebic: the town's road passport with RÚIAN's buildings and parcels only, without the national DTM of ČÚZK:
// for cuts of local streets where the DTM has nothing (the profile is then the OSM estimate, variant "odhad"),
// so the comparison costs ČÚZK two RÚIAN requests a cut instead of about ten.
//   CITY=trebic VARIANTS=odhad,trebic-pasport-ruian CACHE=disk ONLY=… node evaluation/ab.mjs
import { sources, own } from "../../pilot/public/towns/trebic.js";
import { withRuian } from "../../pilot/public/towns/overlay.js";
export const about = "pasport s RÚIAN, bez DTM ČÚZK";
export const surfaces = async (bbox) => withRuian(await own(bbox), bbox);
export const { osm, lines } = sources;
