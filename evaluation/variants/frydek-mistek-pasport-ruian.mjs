// frydek-mistek: the town's road passport with RÚIAN's buildings and parcels only, without the national DTM of ČÚZK:
// for cuts of local streets where the DTM has nothing (the profile is then the OSM estimate, variant "odhad"),
// so the comparison costs ČÚZK two RÚIAN requests a cut instead of about ten.
//   CITY=frydek-mistek VARIANTS=odhad,frydek-mistek-pasport-ruian CACHE=disk ONLY=… node evaluation/ab.mjs
import { sources, own } from "../../pilot/public/towns/frydek-mistek.js";
import { withRuian } from "../../pilot/public/towns/overlay.js";
export const about = "pasport s RÚIAN, bez DTM ČÚZK";
export const surfaces = async (bbox) => { const o = await own(bbox); return withRuian({ features: [...o.passport.features, ...o.green.features] }, bbox); };
export const { osm, lines } = sources;
