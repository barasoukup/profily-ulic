// Czechia (CZ): the Czech rules of countries/default.js, with what a place in no state the app knows lacks. Its cities'
// data are city.js and towns/.
import base from "./default.js";

export default {
  ...base,
  code: "CZ",
  // Czechia and the margins of its OSM extract (the box of a saved cut before Slovakia).
  bounds: [12, 48, 19, 52],
  // ČÚZK's orthophoto for a tram bed (ortho.js).
  bedOrtho: "cuzk",
  // The Czech house looks: sorela, the brick block of the 1950s–60s, the panel house.
  socialistLooks: true,
};
