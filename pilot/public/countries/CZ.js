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
  // The motorways keep the usual reach (the other states: 35 m): measured, the A/B of 25. 11. 2026
  // (evaluation/sjednoceni, 14 random cuts of Czech motorways and expressways): all 14 changed, judged blind worse 13 : 1;
  // the national DTM draws surfaces everywhere, so 35 m runs on into fields, woods, car parks and other roads (only 27 in
  // Plzeň gained its second carriageway).
  wideRoads: false,
  // The Czech house looks: sorela, the brick block of the 1950s–60s, the panel house.
  socialistLooks: true,
  // The author's name (about.js).
  author: "Bára Soukupová",
};
