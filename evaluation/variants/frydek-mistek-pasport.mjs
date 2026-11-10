// Frýdek-Místek: the town's road passport and passport of green (T-MAPY WFS) over the national DTM of ČÚZK,
// with the town's trees, benches, bike stands and lamps (pilot/public/towns/frydek-mistek.js).
//   CITY=frydek-mistek VARIANTS=city,frydek-mistek-pasport CACHE=disk node evaluation/ab.mjs
import { sources } from "../../pilot/public/towns/frydek-mistek.js";
export const about = "pasport komunikací a zeleně F-M (WFS) nad DTM ČÚZK";
export const { surfaces, osm } = sources;
