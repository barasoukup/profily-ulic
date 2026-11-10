// Reach of the points along the street (derive.js REACH): lamps, traction poles and stops 15 m, the rest
// as derive.js (trees 8 m, benches and others 6 m). The current Prague sources (points and open data).
//   CITY=praha VARIANTS=praha-dosah-6,praha-dosah-15 ITEMS=1 node evaluation/ab.mjs
export const about = "dosah lamp, sloupů trakce a zastávek 15 m";
export const reach = { lampa: 15, sloup: 15, zastavka: 15 };
