// Ostrava: the city's generalized technical map (Polohopis DTM, ArcGIS) with tram axes and paid parking
// sections, instead of the national DTM of ČÚZK (pilot/public/towns/ostrava.js).
//   CITY=ostrava VARIANTS=city,ostrava-dtm CACHE=disk node evaluation/ab.mjs
import { sources } from "../../pilot/public/towns/ostrava.js";
export const about = "technická mapa Ostravy (generalizace, 2019)";
export const { surfaces, lines, parking } = sources;
