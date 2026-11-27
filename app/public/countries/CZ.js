// Czechia (CZ): the Czech rules of countries/default.js, with what a place in no state the app knows lacks. Its cities'
// data are city.js and towns/.
import base, { CZ_SIGNS, lawNote } from "./default.js";

export default {
  ...base,
  code: "CZ",
  // Czechia and the margins of its OSM extract (the box of a saved cut before Slovakia).
  bounds: [12, 48, 19, 52],
  // ČÚZK's orthophoto for a tram bed (ortho.js) and for the lanes (lanes-ortho.js; Prague, Brno and Plzeň their own).
  bedOrtho: "cuzk",
  laneOrtho: "cuzk",
  // The law of parking (§ 25 odst. 3), the signs of vyhláška 294/2015 Sb. and Mapy.com's panoramas: Czech, only here
  // (Bára 26. 11. 2026; a place in no state the app knows has none of them, default.js).
  halfKerbNote: lawNote("§ 25 odst. 3 zák. 361/2000 Sb."),
  signs: CZ_SIGNS,
  panorama: true,
  // The Czech house looks: sorela, the brick block of the 1950s–60s, the panel house.
  socialistLooks: true,
  // The buildings of the estimate from the orthophoto and OSM where no surface map covers the cut: RÚIAN's first
  // (gis.js ruianOutlines, app.js).
  estimateBuildings: "ruian",
};
