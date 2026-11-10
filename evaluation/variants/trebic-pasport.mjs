// Třebíč: the town's road passport (PaKom 2020, ArcGIS) over the national DTM of ČÚZK, with the town's lamps
// and benches (pilot/public/towns/trebic.js).
//   CITY=trebic VARIANTS=city,trebic-pasport CACHE=disk node evaluation/ab.mjs
import { sources } from "../../pilot/public/towns/trebic.js";
export const about = "pasport komunikací Třebíče (PaKom 2020) nad DTM ČÚZK";
export const { surfaces, osm } = sources;
