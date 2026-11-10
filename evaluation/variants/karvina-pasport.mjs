// Karviná: the town's road passport, passport of green and UMPS lines (T-MAPY WFS) over the national DTM of
// ČÚZK, with the town's trees, benches and lamps (pilot/public/towns/karvina.js).
//   CITY=karvina VARIANTS=city,karvina-pasport CACHE=disk node evaluation/ab.mjs
import { sources } from "../../pilot/public/towns/karvina.js";
export const about = "pasport komunikací a zeleně Karviné (WFS) nad DTM ČÚZK";
export const { surfaces, osm, lines } = sources;
