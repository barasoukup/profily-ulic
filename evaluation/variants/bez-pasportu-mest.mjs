// The towns' passports are in the app (towns/pasporty.js, Bára 16. 11. 2026) before their A/B test: this variant
// is the app without them, the national DTM of ČÚZK alone as anywhere else, against "city" (with the passport).
//   CITY=chomutov VARIANTS=bez-pasportu-mest,city CACHE=disk node evaluation/ab.mjs
import { sources } from "../../pilot/public/towns/pardubice.js";
export const about = "bez pasportu města: jen DTM ČÚZK";
export const { surfaces } = sources;
